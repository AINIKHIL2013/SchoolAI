import React, { useState } from 'react';
import Summarizer from './components/Summarizer';
import Chatbot from './components/Chatbot';
import { BotIcon, AudioLinesIcon } from './components/icons';
import { transcribeAudio, summarizeText, generateSpeech } from './services/geminiService';
import { fileToBase64, getFileMimeType } from './utils/file';

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
  
  // State lifted from Summarizer
  const [transcription, setTranscription] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [summaryAudio, setSummaryAudio] = useState<string | null>(null);


  const headerStyles = "text-4xl md:text-5xl font-bold text-cyan-300 tracking-wider drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]";
  const subheaderStyles = "text-lg text-gray-400 mt-2";

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
      <footer className="w-full max-w-4xl mx-auto text-gray-500 text-sm py-4 mt-8 flex justify-between items-end">
        <p className="text-xs">&copy; 2024 ClassLabs AI. All Rights Reserved.</p>
        <div className="text-right">
          <h3 className="font-mono font-bold text-base text-cyan-300 tracking-wider uppercase drop-shadow-[0_0_4px_rgba(0,255,255,0.5)]">
            Contributors
          </h3>
          <p className="font-mono text-xs text-gray-400">
            Dhanajeyan • Nikhil • Stephen • Skanda • Mugunth • Adithya
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
