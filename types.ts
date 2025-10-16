
import { ReactNode } from 'react';

export enum Sender {
  AI = 'ai',
  USER = 'user',
  SYSTEM = 'system'
}

export interface Message {
  id: number;
  sender: Sender;
  content: ReactNode;
}

export interface UserAnswers {
  problem: string;
  audience: string;
  keywords: string;
}

export interface GeneratedIdea {
  text: string;
  imageUrl: string;
}

export interface Question {
    id: keyof UserAnswers;
    text: string;
}
