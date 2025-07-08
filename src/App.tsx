// ./src/App.tsx

import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import MainFeed from './components/MainFeed';
import NotInTelegramScreen from './components/NotInTelegramScreen';
import { Topic, TelegramUser } from './types';
import { TelegramService } from './services/telegramService';
import { SupabaseService } from './services/supabaseService';
import { Loader2 } from 'lucide-react';

type TelegramWebApp = Window['Telegram']['WebApp'];

function App() {
  const [appState, setAppState] = useState<'loading' | 'in_telegram' | 'not_in_telegram'>('loading');
  const [showSplash, setShowSplash] = useState(true);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [debugMessage, setDebugMessage] = useState<string>(''); // NEW: State for debug info

  const telegramService = TelegramService.getInstance();
  const supabaseService = SupabaseService.getInstance();

  useEffect(() => {
    // This function will be called ONLY after we confirm the Telegram WebApp object is available.
    const initializeApp = async (tg: TelegramWebApp) => {
      // The try/catch block is now wrapped around the entire initialization logic
      // to capture any potential error.
      try {
        tg.ready();
        telegramService.initializeTelegramApp();
        setDarkMode(tg.colorScheme === 'dark');
        
        const user = await telegramService.authenticateUser();
        if (user) {
          setTelegramUser(user);
          await supabaseService.upsertUser(user);
          const initialTopics = await supabaseService.getTopics(user.id);
          setTopics(initialTopics);
          setAppState('in_telegram');
        } else {
          // This will now be caught and displayed
          throw new Error("telegramService.authenticateUser() returned null. This can happen if initData is missing or invalid.");
        }
      } catch (error: any) {
        // --- NEW: Enhanced Error Handling & Debugging ---
        let debug = 'Diagnosis: An error occurred during initialization.\n\n';
        debug += `Error Message: ${error.message}\n\n`;
        debug += `Stack Trace:\n${error.stack}\n\n`;
        debug += `--- Environment State ---\n`;
        debug += `window.Telegram exists: ${!!window.Telegram}\n`;
        debug += `window.Telegram.WebApp exists: ${!!window.Telegram?.WebApp}\n`;
        debug += `initData exists: ${!!window.Telegram?.WebApp?.initData}\n`;
        debug += `Raw initData: ${window.Telegram?.WebApp?.initData || 'Not available'}`;
        
        setDebugMessage(debug);
        setAppState('not_in_telegram');
      }
    };

    // --- NEW ROBUST POLLING LOGIC with Debugging ---
    let attempts = 0;
    const maxAttempts = 50; // 50 * 100ms = 5 seconds
    const intervalId = setInterval(() => {
      const tg = window.Telegram?.WebApp;

      if (tg && tg.initData) { // Also check for initData presence
        clearInterval(intervalId);
        initializeApp(tg);
      } else {
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          // --- NEW: Detailed Timeout Debug Message ---
          let debug = 'Diagnosis: Polling for Telegram SDK timed out after 5 seconds.\n\n';
          debug += `--- Environment State ---\n`;
          debug += `window.Telegram exists: ${!!window.Telegram}\n`;
          debug += `window.Telegram.WebApp exists: ${!!window.Telegram?.WebApp}\n`;
          debug += `initData exists: ${!!window.Telegram?.WebApp?.initData}\n\n`;
          debug += `This almost always means the app is not running inside a Telegram client, or the client is caching an old/broken version of the app.`;
          
          setDebugMessage(debug);
          setAppState('not_in_telegram');
        }
      }
    }, 100);

    return () => clearInterval(intervalId);

  }, []); // The empty dependency array ensures this effect runs only once on mount.

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleSplashComplete = () => setShowSplash(false);
  const toggleDarkMode = () => setDarkMode(prev => !prev);
  
  switch (appState) {
    case 'loading':
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-black dark:text-white" />
        </div>
      );

    case 'not_in_telegram':
      // NEW: Pass the debug message to the component
      return <NotInTelegramScreen debugInfo={debugMessage} />;

    case 'in_telegram':
      if (showSplash) {
        return <SplashScreen onComplete={handleSplashComplete} topics={topics} darkMode={darkMode} telegramUser={telegramUser || undefined} />;
      }
      return (
        <div className="App">
          <MainFeed initialTopics={topics} setTopics={setTopics} darkMode={darkMode} toggleDarkMode={toggleDarkMode} telegramUser={telegramUser || undefined} />
        </div>
      );

    default:
      return <NotInTelegramScreen debugInfo={debugMessage} />;
  }
}

export default App;
