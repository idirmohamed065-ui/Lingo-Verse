import { useState, useRef, useEffect } from 'react';
import { api } from '../stores/authStore';
import { useQuery, useMutation } from 'react-query';
import { Send, MessageCircle, Plus, ChevronRight, BookOpen, Mic, Brain, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AIChat() {
  const [activeSession, setActiveSession] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [language, setLanguage] = useState('fr');
  const [sessionType, setSessionType] = useState('conversation');
  const messagesEndRef = useRef(null);

  const languages = [
    { id: 'en', name: 'English', flag: '🇬🇧' },
    { id: 'fr', name: 'French', flag: '🇫🇷' },
    { id: 'es', name: 'Spanish', flag: '🇪🇸' },
    { id: 'de', name: 'German', flag: '🇩🇪' },
    { id: 'it', name: 'Italian', flag: '🇮🇹' },
    { id: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { id: 'ko', name: 'Korean', flag: '🇰🇷' },
    { id: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { id: 'ar', name: 'Arabic', flag: '🇸🇦' },
  ];

  const sessionTypes = [
    { id: 'conversation', name: 'Conversation', icon: MessageCircle },
    { id: 'grammar', name: 'Grammar', icon: BookOpen },
    { id: 'vocabulary', name: 'Vocabulary', icon: Brain },
    { id: 'pronunciation', name: 'Pronunciation', icon: Mic },
    { id: 'quiz', name: 'Quiz', icon: HelpCircle },
  ];

  const { data: sessionsData } = useQuery('ai-sessions', () =>
    api.get('/ai-tutor/sessions').then(r => r.data.data)
  );

  const createSession = useMutation(
    (data) => api.post('/ai-tutor/sessions', data).then(r => r.data.data),
    {
      onSuccess: (data) => {
        setActiveSession(data.session);
        setMessages([{ role: 'assistant', content: data.welcome_message }]);
      }
    }
  );

  const sendMessage = useMutation(
    (data) => api.post(`/ai-tutor/sessions/${activeSession.id}/message`, data).then(r => r.data.data),
    {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    }
  );

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    sendMessage.mutate({ message });
    setMessage('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeSession) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">AI Tutor</h1>
        <p className="text-gray-600 mb-8">Practice with our AI language tutor</p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="font-semibold mb-4">Select Language</h3>
            <div className="grid grid-cols-3 gap-2">
              {languages.map((lang) => (
                <button key={lang.id} onClick={() => setLanguage(lang.id)}
                  className={`p-3 rounded-lg border-2 text-center transition-colors ${
                    language === lang.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <span className="text-2xl">{lang.flag}</span>
                  <p className="text-sm mt-1">{lang.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Session Type</h3>
            <div className="space-y-2">
              {sessionTypes.map((type) => (
                <button key={type.id} onClick={() => setSessionType(type.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    sessionType === type.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <type.icon className="w-5 h-5 text-primary-600" />
                  <span className="font-medium">{type.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={() => createSession.mutate({ language_id: language, session_type: sessionType })}
          disabled={createSession.isLoading}
          className="w-full btn-primary py-3 text-lg disabled:opacity-50">
          {createSession.isLoading ? 'Starting session...' : 'Start Session'}
        </button>

        {sessionsData?.sessions?.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold mb-4">Previous Sessions</h3>
            <div className="space-y-2">
              {sessionsData.sessions.slice(0, 5).map((session) => (
                <button key={session.id} onClick={() => {
                  setActiveSession(session);
                  setMessages(session.messages || []);
                }}
                  className="w-full card py-3 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-primary-600" />
                    <div className="text-left">
                      <p className="font-medium">{session.title}</p>
                      <p className="text-sm text-gray-600">{session.total_messages} messages</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{activeSession.title}</h1>
          <p className="text-sm text-gray-600">{languages.find(l => l.id === activeSession.language_id)?.name} • {activeSession.session_type}</p>
        </div>
        <button onClick={() => { setActiveSession(null); setMessages([]); }}
          className="btn-secondary text-sm">New Session</button>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-y-auto p-4 mb-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
            }`}>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {sendMessage.isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          className="flex-1 input" />
        <button onClick={handleSend} disabled={sendMessage.isLoading || !message.trim()}
          className="btn-primary px-4 disabled:opacity-50">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
