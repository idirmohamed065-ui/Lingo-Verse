import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../stores/authStore';
import { useQuery, useMutation } from 'react-query';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Lesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const { data } = useQuery(['lesson', lessonId], () =>
    api.get(`/courses/lessons/${lessonId}`).then(r => r.data.data)
  );

  const submitMutation = useMutation(
    (payload) => api.post(`/courses/lessons/${lessonId}/submit`, payload).then(r => r.data.data),
    {
      onSuccess: (data) => {
        setScore(data.score);
        setShowResult(true);
        if (data.is_completed) toast.success(`Lesson completed! +${data.xp_earned} XP`);
      }
    }
  );

  const lesson = data?.lesson;
  const questions = lesson?.questions || [];
  const question = questions[currentQ];

  const handleAnswer = () => {
    if (selected === null) return;
    const newAnswers = [...answers, { question_id: question.id, selected, text: selected }];
    setAnswers(newAnswers);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setShowHint(false);
    } else {
      submitMutation.mutate({ answers: newAnswers, time_spent_seconds: 120 });
    }
  };

  const handleTextAnswer = (text) => {
    const newAnswers = [...answers, { question_id: question.id, text }];
    setAnswers(newAnswers);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setShowHint(false);
    } else {
      submitMutation.mutate({ answers: newAnswers, time_spent_seconds: 120 });
    }
  };

  if (!lesson) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  if (showResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${score >= 70 ? 'bg-success-100' : 'bg-danger-100'}`}>
            {score >= 70 ? <CheckCircle className="w-10 h-10 text-success-600" /> : <XCircle className="w-10 h-10 text-danger-600" />}
          </div>
          <h2 className="text-2xl font-bold mb-2">{score >= 70 ? 'Great job!' : 'Keep practicing!'}</h2>
          <p className="text-4xl font-bold text-primary-600 mb-2">{score}%</p>
          <p className="text-gray-600 mb-6">You answered {Math.round((score / 100) * questions.length)} out of {questions.length} correctly</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => { setCurrentQ(0); setAnswers([]); setShowResult(false); setSelected(null); }}
              className="btn-secondary flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
            <button onClick={() => navigate('/learn')} className="btn-primary flex items-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Question {currentQ + 1} of {questions.length}</span>
          <span className="text-sm font-medium text-primary-600">{lesson.title}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">{question?.question_text}</h2>

        {question?.question_type === 'multiple_choice' && (
          <div className="space-y-3">
            {question?.options?.map((opt, i) => (
              <button key={i} onClick={() => setSelected(i)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selected === i ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <span className="font-medium">{String.fromCharCode(65 + i)})</span> {opt}
              </button>
            ))}
          </div>
        )}

        {question?.question_type === 'translation' && (
          <div className="space-y-3">
            <input type="text" placeholder="Type your answer..."
              className="input"
              onKeyDown={(e) => { if (e.key === 'Enter') handleTextAnswer(e.target.value); }}
            />
            <button onClick={() => handleTextAnswer(document.querySelector('input').value)}
              className="w-full btn-primary">Submit Answer</button>
          </div>
        )}

        {showHint && question?.hint && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-600" />
            <p className="text-sm text-yellow-700">{question.hint}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setShowHint(!showHint)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <Lightbulb className="w-4 h-4" /> {showHint ? 'Hide hint' : 'Show hint'}
          </button>
          <button onClick={handleAnswer} disabled={selected === null && question?.question_type === 'multiple_choice'}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {currentQ < questions.length - 1 ? 'Next' : 'Finish'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
