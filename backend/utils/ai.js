import OpenAI from 'openai';

let openaiClient;

// Placeholder values that indicate the key has not been configured yet.
const PLACEHOLDER_KEYS = ['sk-placeholder', 'your_openai_api_key', 'sk-your_openai_api_key', '', 'undefined', 'null'];

// Centralized, configurable model. Override with AI_MODEL env var.
// Defaults to a widely-available, low-cost model.
const getModel = () => process.env.AI_MODEL || 'gpt-4o-mini';

export const isOpenAIKeyConfigured = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return false;
  if (PLACEHOLDER_KEYS.includes(key.trim().toLowerCase())) return false;
  // Real OpenAI keys start with "sk-"
  if (!key.trim().startsWith('sk-')) return false;
  return true;
};

const getOpenAI = () => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
};

// Build a clear, user-facing error message based on the OpenAI error type.
// Prevents quota/model/config errors from being reported as generic connection errors.
const buildAIErrorMessage = (error) => {
  const status = error?.status;
  const code = error?.code || error?.error?.code;
  const type = error?.error?.type;

  if (status === 429 || code === 'insufficient_quota' || type === 'insufficient_quota') {
    return "The AI service is currently out of quota. Please try again later or contact the administrator to add more credits.";
  }
  if (status === 401 || code === 'invalid_api_key') {
    return "The AI service is not configured correctly (invalid API key). Please contact the administrator.";
  }
  if (status === 404 || code === 'model_not_found' || /model/i.test(error?.message || '')) {
    return "The AI model is not available. Please contact the administrator to update the AI configuration.";
  }
  if (status === 400 || type === 'invalid_request_error') {
    return "The AI service rejected the request. Please try rephrasing your message.";
  }
  // Generic fallback
  return "I'm having trouble connecting right now. Let's try again in a moment!";
};

// General-purpose system prompt. LingoAI answers any educational/general question,
// and acts as a language tutor specifically for language-learning questions.
const buildSystemPrompt = (language, sessionType = 'conversation') => {
  const languageNames = {
    en: 'English', fr: 'French', es: 'Spanish', de: 'German',
    it: 'Italian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', ar: 'Arabic'
  };
  const langName = languageNames[language] || 'the target language';

  const base = `You are LingoAI, a friendly, intelligent general-purpose AI assistant and language tutor. You can help with a wide range of topics: languages and translation, mathematics, physics, chemistry, biology, astronomy, history, geography, programming and technology, general knowledge, study help, writing and explanations, and everyday questions. Never reject a question just because it is not about languages. Give clear, useful, accurate answers and maintain conversation context.`;

  const languageTutor = `When the user is practicing ${langName} or asks a language-learning question, act as an expert language tutor: correct grammar, explain mistakes clearly, adapt explanations to the learner's level, and use the target language with English translations when appropriate.`;

  const sessionHints = {
    conversation: `Keep responses concise (2-3 sentences) for casual conversation, but give fuller explanations when the user asks a substantive question.`,
    grammar: `For grammar questions, explain rules clearly with examples and provide exercises when asked.`,
    vocabulary: `For vocabulary, teach new words with context, example sentences, and memory techniques.`,
    pronunciation: `For pronunciation, describe how to produce sounds, compare with similar sounds in English, and give tips for common mistakes.`,
    quiz: `For quizzes, generate questions with multiple choice answers. Format: Question, then A) B) C) D) options. After the user answers, explain why it's correct/incorrect.`
  };

  return `${base}\n\n${languageTutor}\n\n${sessionHints[sessionType] || sessionHints.conversation}`;
};

export const getTutorResponse = async (messages, language, sessionType = 'conversation') => {
  // Return a clear message when the API key is not configured, without exposing the key.
  if (!isOpenAIKeyConfigured()) {
    console.warn('OpenAI API key is not configured. AI Tutor is unavailable.');
    return {
      content: "The AI Tutor isn't configured yet. An administrator needs to add a valid OPENAI_API_KEY to the server environment before AI conversations can work. Everything else keeps working normally!",
      usage: { total_tokens: 0 }
    };
  }

  try {
    const systemPrompt = buildSystemPrompt(language, sessionType);

    const response = await getOpenAI().chat.completions.create({
      model: getModel(),
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
    // Return a clear, specific error message instead of a generic connection error.
    return {
      content: buildAIErrorMessage(error),
      usage: { total_tokens: 0 }
    };
  }
};

export const checkGrammar = async (text, language) => {
  if (!isOpenAIKeyConfigured()) {
    console.warn('OpenAI API key is not configured. Grammar check is unavailable.');
    return { correct: true, corrected_text: text, errors: [], message: 'AI service not configured yet' };
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: getModel(),
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
    return { correct: true, corrected_text: text, errors: [], message: buildAIErrorMessage(error) };
  }
};

export const generateLessonContent = async (topic, language, level) => {
  if (!isOpenAIKeyConfigured()) {
    console.warn('OpenAI API key is not configured. Lesson generation is unavailable.');
    return null;
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: getModel(),
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