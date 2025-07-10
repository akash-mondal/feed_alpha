// ./src/services/aiService.ts

import API_CONFIG from './config';
import { Tweet, TelegramMessage, SignalProfile } from '../types';

export class AIService {
  private static instance: AIService;

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private isWithin24Hours(dateString: string): boolean {
    const messageTime = new Date(dateString).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return (now - messageTime) <= twentyFourHours;
  }
  
  async summarizeContent(
    tweets: Tweet[] = [], 
    telegramMessages: TelegramMessage[] = [], 
    twitterUsername?: string, 
    telegramChannelName?: string,
    summaryLengthOption: 'concise' | 'detailed' | 'comprehensive' | 'custom' = 'detailed',
    customWordCount?: number,
    trackedSenders?: string[]
  ): Promise<{ twitterSummary?: string; telegramSummary?: string; debugInfo?: any }> {
    const debugInfo: any = { twitter: {}, telegram: {} };

    try {
      const now = new Date();
      let twitterSummary: string | undefined;
      let telegramSummary: string | undefined;

      const getWordCount = () => {
        if (summaryLengthOption === 'custom' && customWordCount) {
          return `${customWordCount - 10}-${customWordCount}`;
        }
        switch (summaryLengthOption) {
          case 'concise': return '30-40';
          case 'detailed': return '50-75';
          case 'comprehensive': return '100-150';
          default: return '50-75';
        }
      };
      
      const wordCount = getWordCount();
      const hasTrackedSenders = trackedSenders && trackedSenders.length > 0;

      // --- Process Twitter Content ---
      if (tweets.length > 0 && twitterUsername) {
        // Still filter by time here, as the combined raw data might contain old posts.
        let relevantTweets = tweets.filter(tweet => this.isWithin24Hours(tweet.createdAt));
        
        if (hasTrackedSenders) {
          const lowercasedSenders = trackedSenders.map(s => s.toLowerCase());
          relevantTweets = relevantTweets.filter(tweet => 
            lowercasedSenders.includes(tweet.author.userName.toLowerCase())
          );
        }

        if (relevantTweets.length === 0) {
          twitterSummary = hasTrackedSenders ? `The tracked users in @${twitterUsername} have not posted in the last 24 hours.` : `No new posts from @${twitterUsername} in the last 24 hours.`;
        } else {
          const tweetTexts = relevantTweets.map(tweet => {
            const cleanedText = tweet.text.replace(/^RT @[a-zA-Z0-9_]+: /g, '');
            return `From @${tweet.author.userName}: "${cleanedText}" (Likes: ${tweet.likeCount}, ~${Math.floor((now.getTime() - new Date(tweet.createdAt).getTime()) / 3600000)}h ago)`;
          }).join('\n\n');
          
          const focusPrompt = hasTrackedSenders ? `Pay special attention to the posts from these users: ${trackedSenders.join(', ')}.` : `Synthesize the key themes, topics, and sentiment from the posts.`;
          const systemPrompt = `You are a sharp social media analyst. Your goal is to synthesize raw X posts into a clear, engaging briefing of about ${wordCount} words. ${focusPrompt} Weave these details into a smooth, easy-to-read paragraph. Do not use lists.`;
          const userPrompt = `Summarize the recent X activity for @${twitterUsername}. The most relevant posts from the last 24 hours are:\n\n${tweetTexts}`;
          
          debugInfo.twitter.systemPrompt = systemPrompt;
          debugInfo.twitter.userPrompt = userPrompt;
          try {
            const aiResult = await this.callAI(userPrompt, systemPrompt);
            twitterSummary = aiResult.content;
            debugInfo.twitter.rawResponse = aiResult.rawResponse;
          } catch (error: any) {
             twitterSummary = "Unable to generate X summary at this time.";
             debugInfo.twitter.error = error.message;
          }
        }
      }

      // --- Process Telegram Content ---
      if (telegramMessages.length > 0 && telegramChannelName) {
        // FIX: Use the raw telegramMessages array directly without any time filtering.
        let relevantMessages = telegramMessages;

        if (hasTrackedSenders) {
          const lowercasedSenders = trackedSenders.map(s => s.toLowerCase());
          relevantMessages = relevantMessages.filter(msg => 
            lowercasedSenders.includes(msg.sender.name.toLowerCase()) || 
            (msg.sender.username && lowercasedSenders.includes(msg.sender.username.toLowerCase())) ||
            lowercasedSenders.includes(String(msg.sender.id))
          );
        }
        
        if (relevantMessages.length === 0) {
          telegramSummary = hasTrackedSenders ? `The tracked members in the "${telegramChannelName}" channel have not sent messages recently.` : `No new activity in the "${telegramChannelName}" channel recently.`;
        } else {
          const messageTexts = relevantMessages.map(msg => `From ${msg.sender.name}: "${msg.text}" (~${Math.floor((now.getTime() - new Date(msg.date).getTime()) / 3600000)}h ago)`).join('\n\n');
          const focusPrompt = hasTrackedSenders ? `Focus on the conversation points from these specific members: ${trackedSenders.join(', ')}.` : `Identify the main themes of conversation from the channel.`;
          const systemPrompt = `You are an analyst summarizing a group chat. Synthesize key discussion points from a Telegram channel into a clear summary of about ${wordCount} words. ${focusPrompt} Weave details into a smooth paragraph. Do not use lists.`;
          const userPrompt = `Summarize the recent discussion in the "${telegramChannelName}" Telegram channel based on these key messages:\n\n${messageTexts}`;

          debugInfo.telegram.systemPrompt = systemPrompt;
          debugInfo.telegram.userPrompt = userPrompt;
           try {
            const aiResult = await this.callAI(userPrompt, systemPrompt);
            telegramSummary = aiResult.content;
            debugInfo.telegram.rawResponse = aiResult.rawResponse;
          } catch (error: any) {
             telegramSummary = "Unable to generate Telegram summary at this time.";
             debugInfo.telegram.error = error.message;
          }
        }
      }

      return { twitterSummary, telegramSummary, debugInfo };
    } catch (error: any) {
      console.error('Error in summarizeContent:', error);
      debugInfo.error = `A critical error occurred in summarizeContent: ${error.message}`;
      return { 
        twitterSummary: tweets.length > 0 ? 'Unable to generate X summary at this time.' : undefined,
        telegramSummary: telegramMessages.length > 0 ? 'Unable to generate Telegram summary at this time.' : undefined,
        debugInfo
      };
    }
  }

  async summarizeSignalProfile(profile: SignalProfile): Promise<string> {
    return "Profile summary not implemented for debugging yet.";
  }

  private async callAI(prompt: string, systemPrompt: string): Promise<{ rawResponse: any; content: string }> {
    const response = await fetch(`${API_CONFIG.ai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_CONFIG.ai.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-R1',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        stream: false, 
        max_tokens: 4000, 
        temperature: 0.6,
        stop: ["<think>", "</think>"]
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("AI API Error:", data);
      throw new Error(`AI API request failed with status ${response.status}: ${JSON.stringify(data, null, 2)}`);
    }

    const content = this.cleanContent(data.choices[0]?.message?.content || 'No summary available.');
    
    return { rawResponse: data, content };
  }

  private cleanContent(content: string): string {
    return content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/\*\*Think[\s\S]*?\*\*/gi, '').replace(/^Here's a summary:/i, '').trim();
  }
}
