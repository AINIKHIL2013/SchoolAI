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
        <div className="w-full max-w-4xl mx-auto p-6 bg-black/30 rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
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
                        className={`inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 cursor-pointer w-full sm:w-auto ${
                            isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                        }`}
                    >
                        <UploadIcon className="w-6 h-6" />
                        {audioFile ? audioFile.name : 'Upload Audio File'}
                    </label>
                    <p className="text-sm text-gray-400 mt-2">Supports .mp3, .wav, .m4a, and more</p>
                </div>

                {audioFile && (
                    <button
                        onClick={onProcessAudio}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-3 w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(129,140,248,0.4)]"
                    >
                        {isLoading && loadingStep !== 'Generating speech...' ? <Loader /> : <SparklesIcon className="w-6 h-6" />}
                        {isLoading && loadingStep !== 'Generating speech...' ? loadingStep : 'Transcribe & Summarize'}
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
                    <div className="mt-2 flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={playSummaryAudio}
                            disabled={isLoading && loadingStep === 'Generating speech...'}
                            className="flex-1 flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(74,222,128,0.4)]"
                        >
                            {isLoading && loadingStep === 'Generating speech...' ? <Loader/> : (isPlaying ? <StopIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6" />) }
                             {isLoading && loadingStep === 'Generating speech...' ? 'Generating...' : (isPlaying ? 'Stop' : 'Play Summary Audio')}
                        </button>
                        {summaryAudio && (
                             <button
                                onClick={handleDownload}
                                className="flex-1 flex items-center justify-center gap-3 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(2,132,199,0.4)]"
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