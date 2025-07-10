import React from 'react';
import { X, Bot } from 'lucide-react';

interface AIDebugPanelProps {
  debugInfo: any | null;
  onClose: () => void;
}

const AIDebugPanel: React.FC<AIDebugPanelProps> = ({ debugInfo, onClose }) => {
  if (!debugInfo) return null;

  const renderSection = (title: string, data: { systemPrompt?: string; userPrompt?: string; rawResponse?: any; error?: string }) => {
    if (!data.systemPrompt && !data.userPrompt && !data.rawResponse && !data.error) {
      return null;
    }

    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">{title}</h3>
        
        {data.systemPrompt && (
          <div className="mb-2">
            <h4 className="text-sm font-bold text-purple-600 dark:text-purple-400">System Prompt:</h4>
            <pre className="text-xs bg-white dark:bg-black p-2 rounded-md w-full overflow-x-auto whitespace-pre-wrap break-all">
              {data.systemPrompt}
            </pre>
          </div>
        )}

        {data.userPrompt && (
          <div className="mb-2">
            <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400">User Prompt:</h4>
            <pre className="text-xs bg-white dark:bg-black p-2 rounded-md w-full overflow-x-auto whitespace-pre-wrap break-all">
              {data.userPrompt}
            </pre>
          </div>
        )}

        {data.rawResponse && (
          <div className="mb-2">
            <h4 className="text-sm font-bold text-green-600 dark:text-green-400">Raw AI Response:</h4>
            <pre className="text-xs bg-white dark:bg-black p-2 rounded-md w-full overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(data.rawResponse, null, 2)}
            </pre>
          </div>
        )}
        
        {data.error && (
            <div className="mb-2">
              <h4 className="text-sm font-bold text-red-600 dark:text-red-400">Error:</h4>
              <pre className="text-xs bg-white dark:bg-black p-2 rounded-md w-full overflow-x-auto whitespace-pre-wrap break-all">
                {data.error}
              </pre>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 p-4">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-black dark:text-white" />
            <h2 className="text-xl font-semibold text-black dark:text-white">AI Debug Panel</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-black dark:text-white" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          {renderSection("Twitter Summary Debug", debugInfo.twitter || {})}
          {renderSection("Telegram Summary Debug", debugInfo.telegram || {})}
        </div>
      </div>
    </div>
  );
};

export default AIDebugPanel;
