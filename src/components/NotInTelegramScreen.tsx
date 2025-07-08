// ./src/components/NotInTelegramScreen.tsx

import React from 'react';
import { Send, Terminal } from 'lucide-react';

// The direct link to the Mini App provided by the user.
const MINI_APP_URL = 'https://t.me/ur_degen_bot/feed';
const TELEGRAM_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/768px-Telegram_logo.svg.png?20220101141644';

// NEW: Add a prop for debug information
interface NotInTelegramScreenProps {
  debugInfo?: string;
}

const NotInTelegramScreen: React.FC<NotInTelegramScreenProps> = ({ debugInfo }) => {
  const openInTelegram = () => {
    window.location.href = MINI_APP_URL;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center p-4 sm:p-6">
      <div className="flex flex-col items-center text-center max-w-2xl w-full space-y-6">
        
        <div className="animate-pulse" style={{ animationDuration: '3s' }}>
          <img 
            src={TELEGRAM_LOGO_URL} 
            alt="Telegram Logo" 
            className="mx-auto h-24 w-24 sm:h-28 sm:w-28"
          />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-bold" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
            Access Denied
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-xl leading-relaxed">
            This is a Telegram Mini App and must be opened within the Telegram messenger.
          </p>
        </div>

        <button
          onClick={openInTelegram}
          className="w-full max-w-xs px-6 py-3 sm:py-4 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg dark:shadow-white/10 font-semibold flex items-center justify-center space-x-3 text-lg"
        >
          <Send className="w-5 h-5" />
          <span>Open in Telegram</span>
        </button>

        {/* --- NEW: Diagnostic Information Display --- */}
        {debugInfo && (
          <div className="w-full pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Terminal className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Diagnostic Info</h2>
            </div>
            <pre className="text-left text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded-lg w-full overflow-x-auto whitespace-pre-wrap break-all">
              {debugInfo}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotInTelegramScreen;
