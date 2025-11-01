
import React, { useState } from 'react';
import Summarizer from './components/Summarizer';
import Chatbot from './components/Chatbot';
import { BotIcon, AudioLinesIcon } from './components/icons';

type View = 'summarizer' | 'chatbot';

// FIX: Moved NavButton outside of App component to avoid re-declaration on each render.
// This is a React best practice that can resolve subtle bugs, performance issues, and typing errors.
// FIX: Extracted component props to a type alias to resolve a 'children' prop type error.
type NavButtonProps = {
  active: boolean;
  onClick: () => void;
  // FIX: Made children optional to fix TypeScript error where it was not being inferred correctly.
  children?: React.ReactNode;
};

const NavButton = ({
  active,
  onClick,
  children,
}: NavButtonProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-lg font-semibold transition-all duration-300 ${
      active
        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.3)]'
        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/70 hover:text-white'
    }`}
  >
    {children}
  </button>
);


const App: React.FC = () => {
  const [view, setView] = useState<View>('summarizer');
  const [transcription, setTranscription] = useState<string>('');
  const [summary, setSummary] = useState<string>('');


  const headerStyles = "text-4xl md:text-5xl font-bold text-cyan-300 tracking-wider drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]";
  const subheaderStyles = "text-lg text-gray-400 mt-2";

  const handleSummarizationComplete = (newTranscription: string, newSummary: string) => {
    setTranscription(newTranscription);
    setSummary(newSummary);
  };

  const renderView = () => {
    switch (view) {
      case 'summarizer':
        return <Summarizer onSummarizationComplete={handleSummarizationComplete} />;
      case 'chatbot':
        return <Chatbot transcription={transcription} summary={summary} />;
      default:
        return <Summarizer onSummarizationComplete={handleSummarizationComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl mx-auto flex-grow">
        <header className="text-center mb-8">
          <h1 className={headerStyles}>ClassLabs AI Summarizer</h1>
          <p className={subheaderStyles}>Your AI-powered audio analysis and Q&A assistant</p>
        </header>

        <nav className="flex justify-center gap-4 mb-8">
          <NavButton active={view === 'summarizer'} onClick={() => setView('summarizer')}>
            <AudioLinesIcon className="w-6 h-6" />
            Summarizer
          </NavButton>
          <NavButton active={view === 'chatbot'} onClick={() => setView('chatbot')}>
            <BotIcon className="w-6 h-6" />
            Chatbot
          </NavButton>
        </nav>

        <main className="w-full">
          {renderView()}
        </main>
      </div>
      <footer className="w-full text-center text-gray-500 text-sm py-4 mt-8">
        <p>Made by Dhanajeyan , Nikhil , Stephen , Skanda , and Mugunth gr-7</p>
      </footer>
    </div>
  );
};

export default App;