import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const getTutorResponse = async (messages, language, sessionType = 'conversation') => {
  try {
    const languageNames = {
      en: 'English', fr: 'French', es: 'Spanish', de: 'German',
      it: 'Italian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', ar: 'Arabic'
    };

    const systemPrompts = {
      conversation: `You are LingoAI, a friendly and encouraging language tutor for ${languageNames[language] || 'the target language'}. You help learners practice real conversations. Correct mistakes gently, explain grammar clearly, and keep responses concise (2-3 sentences max). Use the target language with English translations when appropriate.`,
      grammar: `You are LingoAI, a grammar tutor for ${languageNames[language]}. Explain grammar rules clearly with examples. Use simple language. Provide exercises when asked.`,
      vocabulary: `You are LingoAI, a vocabulary tutor for ${languageNames[language]}. Teach new words with context, example sentences, and memory techniques.`,
      pronunciation: `You are LingoAI, a pronunciation coach for ${languageNames[language]}. Describe how to produce sounds, compare with similar sounds in English, and give tips for common mistakes.`,
      quiz: `You are LingoAI, a quiz master for ${languageNames[language]}. Generate 1-question quizzes with multiple choice answers. Format: Question, then A) B) C) D) options. After user answers, explain why it's correct/incorrect.`
    };

    const systemPrompt = systemPrompts[sessionType] || systemPrompts.conversation;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return {
      content: response.choices[0].message.content,
      usage: response.usage
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback response
    return {
      content: "I'm having trouble connecting right now. Let's try again in a moment! In the meantime, can you tell me what you'd like to practice?",
      usage: { total_tokens: 0 }
    };
  }
};

export const checkGrammar = async (text, language) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a grammar checker. Analyze the following text in ${language}. Return ONLY a JSON object with this structure: { "correct": boolean, "corrected_text": string, "errors": [{ "type": string, "message": string, "suggestion": string }] }`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Grammar check error:', error);
    return { correct: true, corrected_text: text, errors: [] };
  }
};

export const generateLessonContent = async (topic, language, level) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Generate a ${level} level language lesson for ${language} on the topic: ${topic}. Return JSON with: { "vocabulary": [{"word", "translation", "example"}], "grammar_points": [{"rule", "explanation", "examples"}], "exercises": [{"type", "question", "options", "correct_answer"}] }`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Lesson generation error:', error);
    return null;
  }
};
