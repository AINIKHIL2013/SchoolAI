import React, { useState } from 'react';
import Summarizer from './components/Summarizer';
import Chatbot from './components/Chatbot';
import { BotIcon, AudioLinesIcon } from './components/icons';
import { transcribeAudio, summarizeText, generateSpeech } from './services/geminiService';
import { fileToBase64, getFileMimeType } from './utils/file';
import ThemeSwitcher from './components/ThemeSwitcher';

type View = 'summarizer' | 'chatbot';

type NavButtonProps = {
  active: boolean;
  onClick: () => void;
  children?: React.ReactNode;
};

const NavButton = ({
  active,
  onClick,
  children,
}: NavButtonProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
      active
        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
        : 'bg-white/70 text-slate-500 hover:bg-white hover:text-sky-600 border border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-sky-400 dark:border-slate-600'
    }`}
  >
    {children}
  </button>
);


const App: React.FC = () => {
  const [view, setView] = useState<View>('summarizer');
  
  // State lifted from Summarizer
  const [transcription, setTranscription] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [summaryAudio, setSummaryAudio] = useState<string | null>(null);


  const headerStyles = "text-5xl md:text-6xl font-bold text-slate-900 dark:text-slate-100 tracking-wider";
  const subheaderStyles = "text-lg text-slate-600 dark:text-slate-400 mt-4";

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith('audio/')) {
          setAudioFile(file);
          setTranscription('');
          setSummary('');
          setError(null);
          setSummaryAudio(null);
      } else {
          setError('Please upload a valid audio file.');
          setAudioFile(null);
      }
  };

  const processAudio = async () => {
      if (!audioFile) {
          setError('Please select an audio file first.');
          return;
      }
      
      setIsLoading(true);
      setError(null);
      setTranscription('');
      setSummary('');
      setSummaryAudio(null);

      try {
          // Step 1: Transcribe
          setLoadingStep('Transcribing audio...');
          const base64Audio = await fileToBase64(audioFile);
          const mimeType = await getFileMimeType(audioFile);
          const transcribedText = await transcribeAudio(base64Audio, mimeType);
          setTranscription(transcribedText);

          // Step 2: Summarize
          setLoadingStep('Summarizing text...');
          const summarizedText = await summarizeText(transcribedText);
          setSummary(summarizedText);
          
      } catch (err) {
          console.error(err);
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
          setIsLoading(false);
          setLoadingStep('');
      }
  };

  const handleGenerateSpeech = async () => {
    if (!summary) {
        setError('No summary available to generate speech.');
        return;
    }
    setIsLoading(true);
    setLoadingStep('Generating speech...');
    setError(null);
    try {
        const base64Audio = await generateSpeech(summary);
        setSummaryAudio(base64Audio);
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to generate audio.');
    } finally {
        setIsLoading(false);
        setLoadingStep('');
    }
  };

  const renderView = () => {
    switch (view) {
      case 'summarizer':
        return (
          <Summarizer
            audioFile={audioFile}
            transcription={transcription}
            summary={summary}
            isLoading={isLoading}
            loadingStep={loadingStep}
            error={error}
            summaryAudio={summaryAudio}
            onFileChange={handleFileChange}
            onProcessAudio={processAudio}
            onGenerateSpeech={handleGenerateSpeech}
          />
        );
      case 'chatbot':
        return <Chatbot transcription={transcription} summary={summary} />;
      default:
        return (
          <Summarizer
            audioFile={audioFile}
            transcription={transcription}
            summary={summary}
            isLoading={isLoading}
            loadingStep={loadingStep}
            error={error}
            summaryAudio={summaryAudio}
            onFileChange={handleFileChange}
            onProcessAudio={processAudio}
            onGenerateSpeech={handleGenerateSpeech}
          />
        );
    }
  };

  return (
    <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl mx-auto flex-grow">
        <header className="text-center mb-8 relative">
          <h1 className={headerStyles}><i>Schoollabs</i> <span className="bg-gradient-to-r from-sky-500 to-violet-500 text-transparent bg-clip-text">ClassAI</span></h1>
          <p className={subheaderStyles}>Your AI-powered audio analysis and Q&A assistant</p>
          <div className="absolute top-0 right-0">
              <ThemeSwitcher />
          </div>
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
      <footer className="w-full max-w-4xl mx-auto text-slate-500 dark:text-slate-400 text-sm py-4 mt-8 flex justify-between items-end">
        <p className="text-xs">&copy; 2025 <i>Schoollabs</i>. Licensed under the <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-600 dark:hover:text-sky-400">GNU GPL v3</a>.</p>
        <div className="text-right">
          <h3 className="font-mono font-bold text-base text-sky-600 dark:text-sky-400 tracking-wider uppercase">
            Contributors
          </h3>
          <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-sky-500 dark:text-sky-400">Nikhil</span> • Dhanajeyan • Stephen • Skanda • Mugunth • Adithya
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;