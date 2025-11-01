import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { SendIcon, UserIcon, BotIcon } from './icons';
import { ChatMessage } from '../types';
import Loader from './Loader';

interface ChatbotProps {
    transcription: string;
    summary: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ transcription, summary }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const initChat = () => {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
          
          let systemInstruction = 'You are a helpful Q&A assistant.';
          let initialMessage = 'Hello! How can I help you today? You can ask me questions about a summarized audio file if you have processed one.';

          if (transcription && summary) {
              systemInstruction = `You are an expert assistant with the context of an audio file that has been transcribed and summarized.
    
Here is the full transcription for your reference:
--- TRANSCRIPTION START ---
${transcription}
--- TRANSCRIPTION END ---

Here is the concise summary of the transcription:
--- SUMMARY START ---
${summary}
--- SUMMARY END ---

Your primary role is to answer user questions based on the provided transcription and summary. Be thorough and refer to the context. If a user asks a question unrelated to the context, you may answer it, but always acknowledge your primary role related to the audio file.`;
              
              initialMessage = 'I have the context of your audio file. Feel free to ask me any questions about its content!';
          }

          const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: [],
            config: {
                systemInstruction,
            },
          });

          setChat(newChat);
          setMessages([
            {
              role: 'model',
              parts: [{ text: initialMessage }],
            },
          ]);
        } catch (e) {
            console.error(e);
            setError("Failed to initialize the chatbot. Please check the API key.");
        }
      };
      initChat();
    }, [transcription, summary]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading || !chat) return;

        const userMessage: ChatMessage = {
            role: 'user',
            parts: [{ text: input }],
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await chat.sendMessage({ message: input });
            
            const modelMessage: ChatMessage = {
                role: 'model',
                parts: [{ text: response.text }],
            };
            setMessages(prev => [...prev, modelMessage]);

        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setError(`Failed to get response: ${errorMessage}`);
            // Optionally, remove the user's message if the call fails
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="w-full max-w-4xl mx-auto h-[70vh] flex flex-col bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-slate-900/10 dark:shadow-black/20">
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-600 flex-shrink-0"><BotIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" /></div>}
                            <div className={`px-4 py-3 max-w-sm md:max-w-md lg:max-w-lg shadow-sm ${msg.role === 'user' ? 'bg-violet-500 text-white rounded-2xl rounded-tr-none' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 rounded-2xl rounded-tl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
                            </div>
                            {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-600 flex-shrink-0"><UserIcon className="w-5 h-5 text-violet-500 dark:text-violet-400" /></div>}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-600 flex-shrink-0"><BotIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" /></div>
                            <div className="px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-700">
                                <Loader />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
             {error && <div className="text-red-500 p-2 text-center text-sm">{error}</div>}
            <div className="p-4 sm:p-6 border-t border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={summary ? "Ask about the audio..." : "Ask me anything..."}
                        disabled={isLoading || !chat}
                        className="flex-1 bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim() || !chat}
                        className="bg-sky-500 hover:bg-sky-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white p-2.5 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-100 shadow-md shadow-sky-500/40"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;