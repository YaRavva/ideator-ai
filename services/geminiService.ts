
import { GoogleGenAI, Modality } from "@google/genai";
import type { UserAnswers } from '../types';

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const generateTextPrompt = (answers: UserAnswers): string => `
  Ты - креативный помощник для школьников, который генерирует интересные и реализуемые идеи для веб-приложений, PWA, Телеграм-ботов или мобильных приложений. 
  Цель: помочь школьникам 14-16 лет с идеями для их проектов.
  
  Вот информация от пользователя:
  Проблема/потребность: "${answers.problem}"
  Целевая аудитория: "${answers.audience}"
  Ключевые слова/ассоциации: "${answers.keywords || 'нет'}"

  Сгенерируй ОДНУ подробную и уникальную идею для приложения.
  Включи:
  1.  **Название приложения** (короткое, запоминающееся).
  2.  **Концепция** (1-2 предложения, что это за приложение и какую проблему решает).
  3.  **3-5 Основных функций** (короткий список).
  4.  **ИИ-составляющая** (как именно ИИ будет встроен в приложение для решения задачи).
  
  Форматируй ответ в markdown:
  
  ## [Название приложения]
  
  **Концепция:** [описание концепции]
  
  **Основные функции:**
  *   [функция 1]
  *   [функция 2]
  *   [функция 3]
  *   [функция 4 (опционально)]
  *   [функция 5 (опционально)]
  
  **ИИ-составляющая:** [объяснение использования ИИ]
`;

const generateImagePrompt = (ideaText: string): string => {
  const titleMatch = ideaText.match(/##\s*(.*?)\n/);
  const conceptMatch = ideaText.match(/\*\*Концепция:\*\*\s*(.*?)\n/);

  const title = titleMatch ? titleMatch[1].replace(/\[|\]/g, '').trim() : "новое приложение";
  const concept = conceptMatch ? conceptMatch[1].trim() : "интерактивный инструмент";

  return `Визуализация интерфейса мобильного приложения или PWA под названием "${title}". 
          Главный экран, который ярко отражает концепцию: "${concept}". 
          Стиль дружелюбный, современный, для школьников. 
          Яркие цвета, иконки, чистый дизайн.`;
};


export const generateIdea = async (answers: UserAnswers): Promise<{ text: string, imageUrl: string }> => {
    try {
        // 1. Generate Text Idea
        const textPrompt = generateTextPrompt(answers);
        const textResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: textPrompt
        });
        const ideaText = textResponse.text;

        // 2. Generate Image based on Text Idea
        const imagePrompt = generateImagePrompt(ideaText);
        const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: imagePrompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        let imageUrl = '';
        for (const part of imageResponse.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                break;
            }
        }

        if (!imageUrl) {
            throw new Error('Image generation failed or returned no data.');
        }

        return { text: ideaText, imageUrl };

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Не удалось сгенерировать идею. Пожалуйста, проверьте ваш API ключ и попробуйте снова.");
    }
};
