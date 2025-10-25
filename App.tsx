
import React, { useState, useRef, useEffect } from 'react';
import type { Message, UserAnswers, Question, GeneratedIdea } from './types';
import { Sender } from './types';
import { generateIdea } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import IdeaResult from './components/IdeaResult';
import TypingIndicator from './components/TypingIndicator';
import { SendIcon, RefreshIcon } from './components/icons';

const questions: Question[] = [
  { id: 'problem', text: "Привет! Я твой AI-помощник по генерации идей. Готов создать что-то крутое? Начнем! Какую проблему или потребность ты хочешь решить?" },
  { id: 'audience', text: "Отличная мысль! А для кого будет твое приложение?" },
  { id: 'keywords', text: "Понял. И последнее: какие ключевые слова или ассоциации приходят тебе на ум? (Например: игра, обучение, творчество)" }
];

const App: React.FC = () => {
    const [chatHistory, setChatHistory] = useState<Message[]>([
        { id: 1, sender: Sender.AI, content: questions[0].text }
    ]);
    const [userAnswers, setUserAnswers] = useState<Partial<UserAnswers>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isLoading]);

    const handleNewIdea = () => {
        setUserAnswers({});
        setCurrentQuestionIndex(0);
        setError(null);
        setChatHistory([{ id: 1, sender: Sender.AI, content: questions[0].text }]);
    };
    
    const handleSubmit = async () => {
        if (!inputValue.trim() || isLoading) return;

        const currentAnswerId = questions[currentQuestionIndex].id;
        const newUserAnswers = { ...userAnswers, [currentAnswerId]: inputValue.trim() };
        setUserAnswers(newUserAnswers);
        
        const newUserMessage: Message = {
            id: Date.now(),
            sender: Sender.USER,
            content: inputValue.trim()
        };
        
        setChatHistory(prev => [...prev, newUserMessage]);
        setInputValue('');
        
        const nextQuestionIndex = currentQuestionIndex + 1;

        if (nextQuestionIndex < questions.length) {
            setCurrentQuestionIndex(nextQuestionIndex);
            setTimeout(() => {
                const nextQuestionMessage: Message = {
                    id: Date.now() + 1,
                    sender: Sender.AI,
                    content: questions[nextQuestionIndex].text
                };
                setChatHistory(prev => [...prev, nextQuestionMessage]);
            }, 500);
        } else {
            setIsLoading(true);
            setError(null);
            try {
                const idea = await generateIdea(newUserAnswers as UserAnswers);
                const ideaMessage: Message = {
                    id: Date.now() + 1,
                    sender: Sender.SYSTEM,
                    content: <IdeaResult idea={idea} onNewIdea={handleNewIdea} />
                };
                setChatHistory(prev => [...prev, ideaMessage]);
            } catch (err: any) {
                const errorMessageText = err.message || 'Произошла неизвестная ошибка.';
                setError(errorMessageText);
                const errorMessage: Message = {
                    id: Date.now() + 1,
                    sender: Sender.AI,
                    content: (
                        <div>
                            <p>Ой, что-то пошло не так: <span className="font-semibold">{errorMessageText}</span></p>
                            <button
                                onClick={handleNewIdea}
                                className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 mt-4"
                            >
                                <RefreshIcon className="w-5 h-5" />
                                <span>Начать заново</span>
                            </button>
                        </div>
                    )
                };
                setChatHistory(prev => [...prev, errorMessage]);
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-purple-900/50 font-sans">
            <header className="text-center p-4 border-b border-white/10 shadow-md">
                <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    Идеятор: AI-помощник для твоих проектов
                </h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {chatHistory.map(msg => {
                    if (msg.sender === Sender.SYSTEM) {
                         return <div key={msg.id} className="flex justify-center">{msg.content}</div>;
                    }
                    return <ChatMessage key={msg.id} sender={msg.sender}>{msg.content}</ChatMessage>
                })}
                {isLoading && (
                    <ChatMessage sender={Sender.AI}>
                        <div className="flex flex-col items-center">
                            <TypingIndicator />
                            <span className="text-sm text-gray-400">Думаю над идеей... Это может занять до минуты.</span>
                        </div>
                    </ChatMessage>
                )}
                 <div ref={chatEndRef} />
            </main>

            <footer className="p-4 border-t border-white/10">
                <div className="max-w-3xl mx-auto">
                    <div className="relative">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            placeholder={isLoading ? "Генерация..." : "Введите ваш ответ..."}
                            disabled={isLoading || currentQuestionIndex >= questions.length}
                            rows={1}
                            className="w-full bg-gray-800/80 border border-gray-600 rounded-lg py-3 pl-4 pr-12 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                        />
                        <button 
                            onClick={handleSubmit}
                            disabled={isLoading || !inputValue.trim() || currentQuestionIndex >= questions.length}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;
