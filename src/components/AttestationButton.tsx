import React from 'react';

interface AttestationButtonProps {
  onClick: () => void;
}

const AttestationButton: React.FC<AttestationButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 left-4 z-40 flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg hover:scale-105 transition-all
                 rounded-full w-12 h-12
                 sm:rounded-2xl sm:w-auto sm:h-auto sm:px-3 sm:py-2"
      aria-label="View Attestation Report"
    >
      <img 
        src="https://pbs.twimg.com/profile_images/1790094888069115905/4pu53n55_400x400.jpg" 
        alt="Redpill AI Logo" 
        className="w-6 h-6 rounded-full sm:mr-2" 
      />
      <span className="hidden sm:inline text-xs font-bold leading-tight text-black dark:text-white">
        Secured by Redpill
      </span>
    </button>
  );
};

export default AttestationButton;
