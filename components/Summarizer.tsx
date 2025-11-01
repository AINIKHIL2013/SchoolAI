
import React, { useState, useRef } from 'react';
import { transcribeAudio, summarizeText, generateSpeech } from '../services/geminiService';
import { fileToBase64, getFileMimeType } from '../utils/file';
import { decodeAudioData } from '../utils/audio';
import { UploadIcon, PlayIcon, StopIcon, SparklesIcon, MicIcon, FileTextIcon, Volume2Icon } from './icons';
import Loader from './Loader';

// FIX: Moved ResultCard outside of Summarizer component to avoid re-declaration on each render.
// This is a React best practice that can resolve subtle bugs, performance issues, and typing errors.
// FIX: Extracted component props to a type alias to resolve a 'children' prop type error.
type ResultCardProps = {
    title: string;
    icon: React.ReactNode;
    // FIX: Made children optional to fix TypeScript error where it was not being inferred correctly.
    children?: React.ReactNode;
};

const ResultCard = ({ title, icon, children }: ResultCardProps) => (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2 mb-3">
            {icon}
            {title}
        </h3>
        <div className="text-gray-300 whitespace-pre-wrap font-light text-sm leading-relaxed max-h-48 overflow-y-auto">
            {children}
        </div>
    </div>
);

interface SummarizerProps {
    onSummarizationComplete: (transcription: string, summary: string) => void;
}

const Summarizer: React.FC<SummarizerProps> = ({ onSummarizationComplete }) => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [transcription, setTranscription] = useState<string>('');
    const [summary, setSummary] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingStep, setLoadingStep] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && (file.type === 'audio/mpeg' || file.type === 'audio/wav')) {
            setAudioFile(file);
            setTranscription('');
            setSummary('');
            setError(null);
        } else {
            setError('Please upload a valid .mp3 or .wav file.');
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
            
            // Step 3: Notify parent component
            onSummarizationComplete(transcribedText, summarizedText);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };
    
    const playSummaryAudio = async () => {
        if (!summary) {
            setError('No summary to play.');
            return;
        }

        if (isPlaying) {
            audioSourceRef.current?.stop();
            setIsPlaying(false);
            return;
        }
        
        setIsLoading(true);
        setLoadingStep('Generating speech...');
        setError(null);

        try {
            const base64Audio = await generateSpeech(summary);
            
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const audioContext = audioContextRef.current;
            
            const decodedBuffer = await decodeAudioData(base64Audio, audioContext);
            
            const source = audioContext.createBufferSource();
            source.buffer = decodedBuffer;
            source.connect(audioContext.destination);
            
            source.onended = () => {
                setIsPlaying(false);
                audioSourceRef.current = null;
            };

            source.start(0);
            audioSourceRef.current = source;
            setIsPlaying(true);
            
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to generate or play audio.');
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-black/30 rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
            <div className="flex flex-col gap-6">
                <div className="text-center">
                    <input
                        type="file"
                        id="audio-upload"
                        className="hidden"
                        accept=".mp3,.wav"
                        onChange={handleFileChange}
                        disabled={isLoading}
                    />
                    <label
                        htmlFor="audio-upload"
                        className={`inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 cursor-pointer w-full sm:w-auto ${
                            isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                        }`}
                    >
                        <UploadIcon className="w-6 h-6" />
                        {audioFile ? audioFile.name : 'Upload Audio File'}
                    </label>
                    <p className="text-sm text-gray-400 mt-2">Supports .mp3 and .wav formats</p>
                </div>

                {audioFile && (
                    <button
                        onClick={processAudio}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-3 w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(129,140,248,0.4)]"
                    >
                        {isLoading ? <Loader /> : <SparklesIcon className="w-6 h-6" />}
                        {isLoading ? loadingStep : 'Transcribe & Summarize'}
                    </button>
                )}

                {error && <div className="text-red-400 bg-red-900/50 border border-red-500 p-3 rounded-lg text-center">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {transcription && (
                        <ResultCard title="Transcription" icon={<MicIcon className="w-5 h-5" />}>
                           {transcription}
                        </ResultCard>
                    )}
                    
                    {summary && (
                        <ResultCard title="AI Summary" icon={<FileTextIcon className="w-5 h-5" />}>
                            {summary}
                        </ResultCard>
                    )}
                </div>

                {summary && (
                    <div className="mt-2">
                        <button
                            onClick={playSummaryAudio}
                            disabled={isLoading && loadingStep === 'Generating speech...'}
                            className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(74,222,128,0.4)]"
                        >
                            {isLoading && loadingStep === 'Generating speech...' ? <Loader/> : (isPlaying ? <StopIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6" />) }
                             {isLoading && loadingStep === 'Generating speech...' ? 'Generating...' : (isPlaying ? 'Stop' : 'Play Summary Audio')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Summarizer;