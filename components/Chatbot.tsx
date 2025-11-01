
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
        <div className="w-full max-w-4xl mx-auto h-[70vh] flex flex-col bg-black/30 rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-400 flex-shrink-0"><BotIcon className="w-5 h-5 text-cyan-300" /></div>}
                            <div className={`px-4 py-2 rounded-lg max-w-sm md:max-w-md lg:max-w-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
                            </div>
                            {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-400 flex-shrink-0"><UserIcon className="w-5 h-5 text-indigo-300" /></div>}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-400 flex-shrink-0"><BotIcon className="w-5 h-5 text-cyan-300" /></div>
                            <div className="px-4 py-3 rounded-lg bg-gray-700">
                                <Loader />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
             {error && <div className="text-red-400 p-2 text-center text-sm">{error}</div>}
            <div className="p-4 sm:p-6 border-t border-cyan-500/20">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={summary ? "Ask about the audio..." : "Ask me anything..."}
                        disabled={isLoading || !chat}
                        className="flex-1 bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim() || !chat}
                        className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2.5 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(0,255,255,0.4)]"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;