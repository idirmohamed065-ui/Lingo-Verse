import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { BookOpen, MessageCircle, Trophy, Users, Zap, Globe } from 'lucide-react';

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  const features = [
    { icon: BookOpen, title: 'Interactive Lessons', desc: 'Learn with gamified lessons covering vocabulary, grammar, and conversation.' },
    { icon: MessageCircle, title: 'AI Tutor', desc: 'Practice conversations with our AI-powered language tutor available 24/7.' },
    { icon: Trophy, title: 'Achievements', desc: 'Earn badges and track your progress with detailed analytics.' },
    { icon: Users, title: 'Community', desc: 'Connect with fellow learners, share progress, and compete on leaderboards.' },
    { icon: Zap, title: 'Pronunciation', desc: 'Get real-time feedback on your pronunciation with speech recognition.' },
    { icon: Globe, title: '9 Languages', desc: 'Learn English, French, Spanish, German, Italian, Japanese, Korean, Chinese, and Arabic.' },
  ];

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Master Any Language with AI</h1>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            LingoVerse combines interactive lessons, AI tutoring, and a vibrant community to make language learning fun and effective.
          </p>
          <div className="flex justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="px-8 py-3 bg-white text-primary-700 rounded-xl font-semibold hover:bg-primary-50 transition-colors">
                Continue Learning
              </Link>
            ) : (
              <>
                <Link to="/register" className="px-8 py-3 bg-white text-primary-700 rounded-xl font-semibold hover:bg-primary-50 transition-colors">
                  Start Learning Free
                </Link>
                <Link to="/login" className="px-8 py-3 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why LingoVerse?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="card hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
