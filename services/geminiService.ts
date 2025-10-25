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
  5.  **Полезные API** (3-4 РЕАЛЬНЫХ и ПРОВЕРЕННЫХ бесплатных API, которые помогут реализовать эту идею. Укажи название и краткое описание. Не предлагай фейковые API типа JSONPlaceholder).
  
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

  **Полезные API:**
  *   **[Название API 1]:** [краткое описание]
  *   **[Название API 2]:** [краткое описание]
  *   **[Название API 3]:** [краткое описание]
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

        if (!ideaText.trim()) {
            throw new Error('Не удалось сгенерировать текст идеи. Ответ от AI был пустым, возможно, из-за настроек безопасности.');
        }

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

        const candidate = imageResponse.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

        if (!imagePart) {
            console.error("Image generation failed. Response:", JSON.stringify(imageResponse, null, 2));
            let reason = 'Неизвестная причина.';
            if (candidate?.finishReason === 'NO_IMAGE') {
                reason = 'AI не смог создать изображение для этого запроса.';
            } else if (candidate?.finishReason === 'SAFETY') {
                reason = 'Запрос был заблокирован фильтрами безопасности.';
            } else if (!candidate) {
                reason = 'Ответ от AI был пуст.';
            }
            throw new Error(`Не удалось сгенерировать изображение. ${reason} Попробуйте сгенерировать новую идею.`);
        }

        const base64ImageBytes: string = imagePart.inlineData!.data;
        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;

        return { text: ideaText, imageUrl };

    } catch (error) {
        console.error("Error calling Gemini API:", error);
         if (error instanceof Error) {
            // Re-throw more specific errors from the try-block
            if (error.message.startsWith('Не удалось')) {
                throw error;
            }
        }
        // Fallback for other errors
        throw new Error("Не удалось сгенерировать идею. Пожалуйста, проверьте ваш API ключ и попробуйте снова.");
    }
};