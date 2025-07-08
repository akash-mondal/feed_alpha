import React from 'react';

interface FeedbackButtonProps {
  onClick: () => void;
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 flex items-center justify-center bg-black dark:bg-white rounded-2xl shadow-lg text-white dark:text-black hover:scale-105 transition-transform px-3 py-2 w-28 text-center"
      aria-label="Help us make this better"
    >
      <span className="text-xs font-bold leading-tight">
        Help us make this better ✨
      </span>
    </button>
  );
};

export default FeedbackButton;
