import React, { useState } from 'react';
import type { GeneratedIdea } from '../types';
import { CopyIcon, CheckIcon, RefreshIcon } from './icons';

interface IdeaResultProps {
  idea: GeneratedIdea;
  onNewIdea: () => void;
}

const SimpleMarkdownParser: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const parseInlineBold = (content: string, key: string) => {
      const parts = content.split(/(\*\*.*?\*\*)/g);
      return <span key={key}>{
          parts.map((part, index) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={index}>{part.slice(2, -2)}</strong>;
              }
              return part;
          })
      }</span>;
  }

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key} className="list-disc pl-5 space-y-1 my-2">
          {listItems.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    line = line.trim();
    if (line.startsWith('## ')) {
      flushList(`ul-${index}`);
      elements.push(<h2 key={index} className="text-2xl font-bold mt-4 mb-2 text-purple-300">{line.substring(3)}</h2>);
    } else if (line.startsWith('**') && line.endsWith('**')) {
      flushList(`ul-${index}`);
      const content = line.substring(2, line.length - 2);
      elements.push(<p key={index} className="font-semibold text-lg my-2 text-white">{content}</p>);
    } else if (line.startsWith('* ')) {
      listItems.push(parseInlineBold(line.substring(2), `li-content-${index}`));
    } else if (line) {
      flushList(`ul-${index}`);
      elements.push(<p key={index} className="my-1">{line}</p>);
    }
  });

  flushList('ul-end');
  return <div className="prose prose-invert">{elements}</div>;
};

const IdeaResult: React.FC<IdeaResultProps> = ({ idea, onNewIdea }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(idea.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="bg-gray-800/50 p-6 rounded-lg w-full">
      <h3 className="text-2xl font-bold mb-4 text-center text-purple-300">🎉 Вот твоя идея! 🎉</h3>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <SimpleMarkdownParser text={idea.text} />
        </div>
        <div>
          <img src={idea.imageUrl} alt="Визуализация идеи" className="rounded-lg shadow-lg w-full object-cover" />
           <p className="text-xs text-center text-gray-400 mt-2">Пример того, как это может выглядеть</p>
        </div>
      </div>

      <div className="flex justify-center space-x-4 mt-8">
        <button onClick={handleCopy} className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200">
          {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
          <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
        </button>
        <button onClick={onNewIdea} className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200">
          <RefreshIcon className="w-5 h-5" />
          <span>Новая идея</span>
        </button>
      </div>
    </div>
  );
};

export default IdeaResult;