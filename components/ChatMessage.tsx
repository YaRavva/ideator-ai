
import React, { ReactNode } from 'react';
import { Sender } from '../types';

interface ChatMessageProps {
  sender: Sender;
  children: ReactNode;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, children }) => {
  const isUser = sender === Sender.USER;

  const baseClasses = "max-w-md lg:max-w-2xl p-4 rounded-2xl mb-4 text-white/90 leading-relaxed";
  const aiClasses = "bg-gray-700/80 rounded-bl-none";
  const userClasses = "bg-purple-600/90 rounded-br-none self-end";

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${baseClasses} ${isUser ? userClasses : aiClasses}`}>
        {children}
      </div>
    </div>
  );
};

export default ChatMessage;
