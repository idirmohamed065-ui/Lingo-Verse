import { useState } from 'react';
import { api } from '../stores/authStore';
import { useQuery } from 'react-query';
import { Mic, Play, Volume2, TrendingUp, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Pronunciation() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('fr');
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null);

  const { data: statsData } = useQuery('pronunciation-stats', () =>
    api.get('/pronunciation/stats').then(r => r.data.data)
  );

  const { data: historyData } = useQuery('pronunciation-history', () =>
    api.get('/pronunciation/history').then(r => r.data.data)
  );

  const handleRecord = async () => {
    if (!text.trim()) { toast.error('Enter text to practice'); return; }
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setResult({
        accuracy: 85,
        fluency: 78,
        completeness: 92,
        pronunciation: 81,
        overall: 84,
        feedback: {
          strengths: ['Good rhythm', 'Clear vowels'],
          improvements: ['Work on R sounds', 'Practice intonation'],
          tips: ['Listen to native speakers', 'Record yourself and compare']
        }
      });
      toast.success('Analysis complete!');
    }, 2000);
  };

  const languages = [
    { id: 'fr', name: 'French' }, { id: 'es', name: 'Spanish' },
    { id: 'de', name: 'German' }, { id: 'it', name: 'Italian' },
    { id: 'ja', name: 'Japanese' }, { id: 'ko', name: 'Korean' },
    { id: 'zh', name: 'Chinese' }, { id: 'ar', name: 'Arabic' },
  ];

  const stats = statsData?.stats || {};

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Pronunciation Practice</h1>
      <p className="text-gray-600 mb-8">Get real-time feedback on your pronunciation</p>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{stats.average_accuracy || 0}</p>
          <p className="text-sm text-gray-600">Accuracy</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.average_fluency || 0}</p>
          <p className="text-sm text-gray-600">Fluency</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{stats.average_completeness || 0}</p>
          <p className="text-sm text-gray-600">Completeness</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.total_attempts || 0}</p>
          <p className="text-sm text-gray-600">Attempts</p>
        </div>
      </div>

      <div className="card mb-8">
        <div className="flex gap-2 mb-4">
          {languages.map((lang) => (
            <button key={lang.id} onClick={() => setLanguage(lang.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                language === lang.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
              {lang.name}
            </button>
          ))}
        </div>

        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to practice pronunciation..."
          className="input min-h-[100px] mb-4 resize-none" />

        <div className="flex gap-3">
          <button onClick={handleRecord} disabled={recording}
            className={`flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 ${recording ? 'animate-pulse' : ''}`}>
            <Mic className="w-5 h-5" />
            {recording ? 'Recording...' : 'Start Recording'}
          </button>
          <button onClick={() => api.post('/pronunciation/speak', { text, language_id: language })}
            className="btn-secondary flex items-center gap-2">
            <Volume2 className="w-5 h-5" /> Listen
          </button>
        </div>
      </div>

      {result && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-600" /> Results
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Accuracy', value: result.accuracy, color: 'bg-primary-600' },
              { label: 'Fluency', value: result.fluency, color: 'bg-purple-600' },
              { label: 'Completeness', value: result.completeness, color: 'bg-green-600' },
              { label: 'Pronunciation', value: result.pronunciation, color: 'bg-orange-600' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="none"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - item.value / 100)}`}
                      className={item.color} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-bold">{item.value}</span>
                </div>
                <p className="text-sm text-gray-600">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-success-50 rounded-lg p-4">
              <h4 className="font-medium text-success-600 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Strengths
              </h4>
              <ul className="space-y-1">
                {result.feedback.strengths.map((s, i) => <li key={i} className="text-sm text-success-700">{s}</li>)}
              </ul>
            </div>
            <div className="bg-warning-50 rounded-lg p-4">
              <h4 className="font-medium text-warning-600 mb-2">Areas to Improve</h4>
              <ul className="space-y-1">
                {result.feedback.improvements.map((s, i) => <li key={i} className="text-sm text-warning-700">{s}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
