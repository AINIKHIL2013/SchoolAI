import React, { useState, useRef, useEffect } from 'react';
import { decodePcmData, createWavBlob, decode } from '../utils/audio';
import { UploadIcon, PlayIcon, StopIcon, SparklesIcon, MicIcon, FileTextIcon, DownloadIcon } from './icons';
import Loader from './Loader';

type ResultCardProps = {
    title: string;
    icon: React.ReactNode;
    children?: React.ReactNode;
};

const ResultCard = ({ title, icon, children }: ResultCardProps) => (
    <div className="bg-white/50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-2 mb-3">
            {icon}
            {title}
        </h3>
        <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-light text-sm leading-relaxed max-h-48 overflow-y-auto">
            {children}
        </div>
    </div>
);

interface SummarizerProps {
    audioFile: File | null;
    transcription: string;
    summary: string;
    isLoading: boolean;
    loadingStep: string;
    error: string | null;
    summaryAudio: string | null;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onProcessAudio: () => void;
    onGenerateSpeech: () => Promise<void>;
}

const Summarizer: React.FC<SummarizerProps> = ({ 
    audioFile,
    transcription,
    summary,
    isLoading,
    loadingStep,
    error,
    summaryAudio,
    onFileChange,
    onProcessAudio,
    onGenerateSpeech,
}) => {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Stop audio playback when component unmounts or audio file changes
    useEffect(() => {
        return () => {
            audioSourceRef.current?.stop();
        };
    }, []);

    useEffect(() => {
        if (isPlaying) {
            audioSourceRef.current?.stop();
            setIsPlaying(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioFile]);

    const playSummaryAudio = async () => {
        if (!summary) return;

        if (isPlaying) {
            audioSourceRef.current?.stop();
            setIsPlaying(false);
            return;
        }
        
        const playBuffer = async (base64: string) => {
             if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const audioContext = audioContextRef.current;
            await audioContext.resume();

            const pcmData = decode(base64);
            const decodedBuffer = await decodePcmData(pcmData, audioContext);
            
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
        }

        if (summaryAudio) {
            await playBuffer(summaryAudio);
            return;
        }
        
        await onGenerateSpeech();
    }

    // Effect to play audio once it's generated and ready
    useEffect(() => {
        if (summaryAudio && isLoading && loadingStep === '') {
            playSummaryAudio();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [summaryAudio, isLoading, loadingStep]);


    const handleDownload = () => {
        if (!summaryAudio) return;
        try {
            const pcmData = decode(summaryAudio);
            const wavBlob = createWavBlob(pcmData);
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'summary.wav';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            // setError is not a prop, maybe pass a setter
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-slate-900/10 dark:shadow-black/20">
            <div className="flex flex-col gap-6">
                <div className="text-center">
                    <input
                        type="file"
                        id="audio-upload"
                        className="hidden"
                        accept="audio/*"
                        onChange={onFileChange}
                        disabled={isLoading}
                    />
                    <label
                        htmlFor="audio-upload"
                        className={`inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 cursor-pointer w-full sm:w-auto transform hover:scale-105 active:scale-95 shadow-md ${
                            isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/30'
                        }`}
                    >
                        <UploadIcon className="w-6 h-6" />
                        {audioFile ? audioFile.name : 'Upload Audio File'}
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Supports .mp3, .wav, .m4a, and more</p>
                </div>

                {audioFile && (
                    <button
                        onClick={onProcessAudio}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-3 w-full bg-violet-500 hover:bg-violet-600 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md shadow-violet-500/30"
                    >
                        {isLoading && loadingStep !== 'Generating speech...' ? <Loader /> : <SparklesIcon className="w-6 h-6" />}
                        {isLoading && loadingStep !== 'Generating speech...' ? loadingStep : 'Transcribe & Summarize'}
                    </button>
                )}

                {error && <div className="text-red-600 bg-red-100 border border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700 p-3 rounded-lg text-center">{error}</div>}

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
                    <div className="mt-2 flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={playSummaryAudio}
                            disabled={isLoading && loadingStep === 'Generating speech...'}
                            className="flex-1 flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/30"
                        >
                            {isLoading && loadingStep === 'Generating speech...' ? <Loader/> : (isPlaying ? <StopIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6" />) }
                             {isLoading && loadingStep === 'Generating speech...' ? 'Generating...' : (isPlaying ? 'Stop' : 'Play Summary Audio')}
                        </button>
                        {summaryAudio && (
                             <button
                                onClick={handleDownload}
                                className="flex-1 flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md shadow-blue-500/30"
                            >
                                <DownloadIcon className="w-6 h-6" />
                                Download Audio
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Summarizer;