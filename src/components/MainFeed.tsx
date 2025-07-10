// ./src/components/MainFeed.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Moon, Sun, MessageSquare, LayoutGrid, List, Menu, Sliders } from 'lucide-react';
import { Topic, TelegramUser, SignalProfile, TelegramMessage } from '../types'; // Import TelegramMessage
import { TwitterService } from '../services/twitterService';
import { TelegramChannelService } from '../services/telegramChannelService';
import { AIService } from '../services/aiService';
import { SupabaseService } from '../services/supabaseService';
import { TelegramService } from '../services/telegramService';
import TopicCard from './TopicCard';
import AddTopicModal from './AddTopicModal';
import DailyBriefModal from './DailyBriefModal';
import TweetDetailView from './TweetDetailView';
import AILoader from './AILoader';
import Footer from './Footer';
import SignalProfileDashboard from './SignalProfileDashboard';
import FeedbackButton from './FeedbackButton';
import FeedbackModal from './FeedbackModal';
import AIDebugPanel from './AIDebugPanel';

interface MainFeedProps {
  initialTopics: Topic[];
  setTopics: React.Dispatch<React.SetStateAction<Topic[]>>;
  darkMode: boolean;
  toggleDarkMode: () => void;
  telegramUser?: TelegramUser;
}

const MainFeed: React.FC<MainFeedProps> = ({ initialTopics, setTopics, darkMode, toggleDarkMode, telegramUser }) => {
  const topics = initialTopics; 
  
  const [view, setView] = useState<'topics' | 'profiles'>('topics');
  const [signalProfiles, setSignalProfiles] = useState<SignalProfile[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDailyBriefModalOpen, setIsDailyBriefModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAILoader, setShowAILoader] = useState(false);
  const [refreshingTopics, setRefreshingTopics] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [compactView, setCompactView] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [aiDebugInfo, setAiDebugInfo] = useState<any | null>(null);

  const twitterService = TwitterService.getInstance();
  const telegramChannelService = TelegramChannelService.getInstance();
  const aiService = AIService.getInstance();
  const supabaseService = SupabaseService.getInstance();
  const telegramService = TelegramService.getInstance();

  useEffect(() => {
    if (telegramUser?.id && topics.length > 0) {
      fetchSignalProfiles();
    }
  }, [telegramUser, topics]);

  const fetchSignalProfiles = async () => {
    if (!telegramUser) return;
    try {
      const profiles = await supabaseService.getSignalProfiles(telegramUser.id, topics);
      setSignalProfiles(profiles);
    } catch (error) {
      console.error("Failed to fetch signal profiles:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const askForFeedbackConsent = async () => {
    if (!telegramUser) return;
    try {
      const consentStatus = await supabaseService.getFeedbackConsent(telegramUser.id);
      if (consentStatus === null) {
        const message = "Thank you for using our app! We would love to get your ideas and feedback to make it better. May we contact you via DM for more personalized feedback in the future?";
        const userGaveConsent = await telegramService.showConfirm(message);
        await supabaseService.setFeedbackConsent(telegramUser.id, userGaveConsent);
        if(userGaveConsent) {
            await telegramService.showAlert("Thank you! We appreciate your support.");
        }
      }
    } catch (error) {
        console.error("Error handling feedback consent:", error);
    }
  };

  const handleAddTopic = async (data: any) => {
    if (!telegramUser) return;
    const isFirstTopic = topics.length === 0;
    setIsLoading(true);
    try {
        // --- THIS IS THE FIX ---
        let twitterData = null;
        let telegramMessages: TelegramMessage[] = []; // Initialize as an empty array instead of null
        
        let displayName = '', profilePicture = '';

        if ((data.type === 'twitter' || data.type === 'both') && data.username) {
            twitterData = await twitterService.getUserTweets(data.username);
            if (twitterData.status === 'success' && twitterData.tweets.length) {
                displayName = twitterData.tweets[0]?.author.name || data.username;
                profilePicture = twitterData.tweets[0]?.author.profilePicture || '';
            } else if (data.type === 'twitter') throw new Error(`Unable to find X user "${data.username}".`);
        }

        const isTelegramType = data.type === 'telegram' || data.type === 'private_telegram' || data.type === 'both';
        if (isTelegramType) {
            const tgIdentifier = data.channelId || data.channelName;
            if (tgIdentifier) {
                telegramMessages = await telegramChannelService.getChannelMessages(tgIdentifier);
                 if (!displayName) displayName = data.channelName || 'Private Group';
            } else if (data.type !== 'both' && data.type !== 'twitter') throw new Error('Invalid Telegram source.');
        }

        setIsModalOpen(false);
        setShowAILoader(true);

        const aiResult = await aiService.summarizeContent(
            twitterData?.tweets, telegramMessages, data.username, data.channelName, 
            data.summaryLength, data.customSummaryLength, data.trackedSenders
        );
        
        setShowAILoader(false);
        setAiDebugInfo(aiResult.debugInfo);
        
        const newTopicData: Omit<Topic, 'id'> = {
            type: data.type === 'private_telegram' ? 'telegram' : data.type,
            username: data.username, channelName: data.channelName, telegramChannelId: data.channelId,
            displayName, twitterSummary: aiResult.twitterSummary, telegramSummary: aiResult.telegramSummary,
            tweets: twitterData?.tweets, telegramMessages, lastUpdated: Date.now(), profilePicture,
            summaryLength: data.summaryLength, customSummaryLength: data.customSummaryLength, trackedSenders: data.trackedSenders
        };

        const addedTopicFromDB = await supabaseService.addTopic(telegramUser.id, newTopicData as Topic);
        setTopics(prev => [...prev, { id: addedTopicFromDB.id, ...newTopicData }]);
        telegramService.hapticFeedback('medium');
        
        if (isFirstTopic) askForFeedbackConsent();
    } catch (error: any) {
        setShowAILoader(false);
        await telegramService.showAlert(error.message || 'Failed to add signal source.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleRefreshTopic = async (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    setRefreshingTopics(prev => new Set(prev).add(topicId));
    try {
        let twitterData = null;
        let telegramMessages: TelegramMessage[] = [];
        let displayName = topic.displayName, profilePicture = topic.profilePicture;
        
        if ((topic.type === 'twitter' || topic.type === 'both') && topic.username) {
            twitterData = await twitterService.getUserTweets(topic.username);
            if (twitterData.status === 'success' && twitterData.tweets.length) {
                displayName = twitterData.tweets[0]?.author.name || displayName;
                profilePicture = twitterData.tweets[0]?.author.profilePicture || profilePicture;
            }
        }
        
        const tgIdentifier = topic.telegramChannelId || topic.channelName;
        if ((topic.type === 'telegram' || topic.type === 'both') && tgIdentifier) {
            telegramMessages = await telegramChannelService.getChannelMessages(tgIdentifier);
        }
        
        setShowAILoader(true);

        const aiResult = await aiService.summarizeContent(
            twitterData?.tweets, telegramMessages, topic.username, topic.channelName, 
            topic.summaryLength, topic.customSummaryLength, topic.trackedSenders
        );

        setShowAILoader(false);
        setAiDebugInfo(aiResult.debugInfo);
        
        const updatedFields: Partial<Topic> = {
            twitterSummary: aiResult.twitterSummary, telegramSummary: aiResult.telegramSummary,
            tweets: twitterData?.tweets || topic.tweets, telegramMessages: telegramMessages || topic.telegramMessages,
            lastUpdated: Date.now(), displayName, profilePicture
        };
        await supabaseService.updateTopic(topicId, updatedFields);
        setTopics(prev => prev.map(t => t.id === topicId ? { ...t, ...updatedFields } : t));
        telegramService.hapticFeedback('light');
    } catch (error) {
        console.error('Error refreshing topic:', error);
        setShowAILoader(false);
        await telegramService.showAlert('Failed to refresh signal.');
    } finally {
        setRefreshingTopics(prev => { const newSet = new Set(prev); newSet.delete(topicId); return newSet; });
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    const confirmed = await telegramService.showConfirm('Are you sure you want to remove this signal source?');
    if (confirmed) {
      await supabaseService.deleteTopic(topicId);
      const remainingTopics = topics.filter(t => t.id !== topicId);
      const orderUpdates = remainingTopics.map((topic, index) => ({ id: topic.id, topic_order: index }));
      setTopics(remainingTopics);
      if (orderUpdates.length > 0) await supabaseService.updateTopicOrder(orderUpdates);
      await fetchSignalProfiles();
      telegramService.hapticFeedback('medium');
    }
  };
  
  const handleSaveProfile = async (data: any, profileId?: string) => {
    if (!telegramUser) return;
    try {
      if (profileId) {
        await supabaseService.updateSignalProfile(profileId, data, data.topicIds);
      } else {
        await supabaseService.addSignalProfile(telegramUser.id, data, data.topicIds);
      }
      await fetchSignalProfiles();
      telegramService.hapticFeedback('heavy');
    } catch (error) {
        console.error("Error saving profile", error);
        telegramService.showAlert("Failed to save profile.");
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    const confirmed = await telegramService.showConfirm('Are you sure you want to delete this profile?');
    if(confirmed) {
      try {
        await supabaseService.deleteSignalProfile(profileId);
        setSignalProfiles(prev => prev.filter(p => p.id !== profileId));
        telegramService.hapticFeedback('heavy');
      } catch (error) {
        console.error("Error deleting profile", error);
        telegramService.showAlert("Failed to delete profile.");
      }
    }
  };

  const handleSubmitFeedback = async (rating: number, comment: string) => {
    if (!telegramUser) return;
    setIsFeedbackLoading(true);
    try {
        await supabaseService.addFeedback(telegramUser.id, rating, comment);
        setIsFeedbackModalOpen(false);
        telegramService.hapticFeedback('medium');
        await telegramService.showAlert("Thank you for your feedback!");
    } catch (error) {
        console.error("Error submitting feedback:", error);
        await telegramService.showAlert("Sorry, we couldn't submit your feedback right now.");
    } finally {
        setIsFeedbackLoading(false);
    }
  };

  const handleReorderTopics = async (draggedId: string, targetId: string, position: 'before' | 'after') => {
    let reorderedTopics = [...topics];
    const draggedIndex = reorderedTopics.findIndex(t => t.id === draggedId);
    let targetIndex = reorderedTopics.findIndex(t => t.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const [draggedItem] = reorderedTopics.splice(draggedIndex, 1);
    targetIndex = reorderedTopics.findIndex(t => t.id === targetId);
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    reorderedTopics.splice(insertIndex, 0, draggedItem);
    setTopics(reorderedTopics);
    const orderUpdates = reorderedTopics.map((topic, index) => ({ id: topic.id, topic_order: index }));
    await supabaseService.updateTopicOrder(orderUpdates);
    telegramService.hapticFeedback('light');
  };

  const handleToggleExpand = (topicId: string) => setExpandedTopics(prev => { const newSet = new Set(prev); newSet.has(topicId) ? newSet.delete(topicId) : newSet.add(topicId); return newSet; });
  const handleViewTweets = (topic: Topic) => { setSelectedTopic(topic); if (telegramUser) telegramService.showBackButton(() => handleBackToFeed()); };
  const handleBackToFeed = () => { setSelectedTopic(null); if (telegramUser) telegramService.hideBackButton(); };

  if (selectedTopic) return <TweetDetailView topic={selectedTopic} onBack={handleBackToFeed} darkMode={darkMode} telegramUser={telegramUser} />;

  if (view === 'profiles') {
    return (
      <SignalProfileDashboard 
        profiles={signalProfiles}
        allTopics={topics}
        onBack={() => setView('topics')}
        onSaveProfile={handleSaveProfile}
        onDeleteProfile={handleDeleteProfile}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 flex flex-col">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl flex-grow">
        <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="relative w-full sm:w-auto" ref={menuRef}>
            <div className="hidden sm:flex items-center space-x-3">
              <button onClick={toggleDarkMode} className="p-3 rounded-full glass border"><span className="sr-only">Toggle Theme</span>{darkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-black" />}</button>
              {topics.length > 0 && <button onClick={() => setCompactView(!compactView)} className="p-3 rounded-full glass border"><span className="sr-only">Toggle View</span>{compactView ? <LayoutGrid className="w-5 h-5 text-black dark:text-white" /> : <List className="w-5 h-5 text-black dark:text-white" />}</button>}
              <button onClick={() => setView('profiles')} className="px-6 py-3 rounded-full bg-gray-100 dark:bg-gray-800 font-medium flex items-center space-x-2 text-black dark:text-white"><Sliders size={16}/><span>Profiles</span></button>
              <button onClick={() => setIsDailyBriefModalOpen(true)} className="px-6 py-3 rounded-full bg-gray-100 dark:bg-gray-800 font-medium flex items-center space-x-2 text-black dark:text-white"><MessageSquare size={16}/><span>Daily Brief</span></button>
              <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium flex items-center space-x-2"><Plus size={18}/><span>Add Signal</span></button>
            </div>
            <div className="flex sm:hidden justify-end">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full glass border"><Menu className="w-5 h-5 text-black dark:text-white" /></button>
            </div>
            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-xl border z-20">
                <button onClick={() => { setView('profiles'); setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t-lg"><Sliders className="w-4 h-4 mr-3" /> Signal Profiles</button>
                <button onClick={() => { setIsModalOpen(true); setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"><Plus className="w-4 h-4 mr-3" /> Add Signal</button>
                <button onClick={() => { setIsDailyBriefModalOpen(true); setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"><MessageSquare className="w-4 h-4 mr-3" /> Daily Brief</button>
                {topics.length > 0 && <button onClick={() => { setCompactView(!compactView); setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">{compactView ? <LayoutGrid className="w-4 h-4 mr-3" /> : <List className="w-4 h-4 mr-3" />} {compactView ? 'Detailed View' : 'Compact View'}</button>}
                <button onClick={() => { toggleDarkMode(); setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-3 text-left text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-b-lg">{darkMode ? <Sun className="w-4 h-4 mr-3" /> : <Moon className="w-4 h-4 mr-3" />} {darkMode ? 'Light Mode' : 'Dark Mode'}</button>
              </div>
            )}
          </div>
        </div>
        {topics.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl"><div className="w-16 h-16 mx-auto mb-4 rounded-full glass flex items-center justify-center"><Plus className="w-8 h-8 text-black dark:text-white"/></div><h3 className="text-xl font-semibold mb-2 text-black dark:text-white">No signals yet</h3><p className="text-gray-500 dark:text-gray-400 mb-6">Add your first signal source to start tracking</p><button onClick={() => setIsModalOpen(true)} className="px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium">Get Started</button></div>
        ) : (
          <div className="space-y-6">{topics.map((topic) => <TopicCard key={topic.id} topic={topic} onRefresh={handleRefreshTopic} onDelete={handleDeleteTopic} onViewTweets={handleViewTweets} onReorder={handleReorderTopics} isRefreshing={refreshingTopics.has(topic.id)} compactView={compactView && !expandedTopics.has(topic.id)} onToggleExpand={compactView ? handleToggleExpand : undefined} />)}</div>
        )}
      </div>
      <Footer telegramUser={telegramUser} />
      <FeedbackButton onClick={() => setIsFeedbackModalOpen(true)} />
      <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} onSubmit={handleSubmitFeedback} isLoading={isFeedbackLoading} />
      <AddTopicModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddTopic} isLoading={isLoading} showAILoader={showAILoader} />
      <DailyBriefModal isOpen={isDailyBriefModalOpen} onClose={() => setIsDailyBriefModalOpen(false)} topics={topics} />
      <AILoader isVisible={showAILoader} />
      <AIDebugPanel debugInfo={aiDebugInfo} onClose={() => setAiDebugInfo(null)} />
    </div>
  );
};

export default MainFeed;
