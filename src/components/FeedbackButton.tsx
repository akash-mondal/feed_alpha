import React from 'react';
import { Sparkles } from 'lucide-react';

interface FeedbackButtonProps {
  onClick: () => void;
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 flex items-center justify-center bg-black dark:bg-white shadow-lg text-white dark:text-black hover:scale-105 transition-all
                 rounded-full w-12 h-12
                 sm:rounded-2xl sm:w-auto sm:h-auto sm:px-3 sm:py-2"
      aria-label="Help us make this better"
    >
      <Sparkles className="w-6 h-6 sm:mr-2" />
      <span className="hidden sm:inline text-xs font-bold leading-tight">
        Help us make this better ✨
      </span>
    </button>
  );
};

export default FeedbackButton;
