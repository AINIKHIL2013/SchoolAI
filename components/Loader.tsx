
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-1">
      <div className="w-2 h-2 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
      <div className="w-2 h-2 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  );
};

export default Loader;
