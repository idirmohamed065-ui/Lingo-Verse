import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../stores/authStore';
import { useQuery } from 'react-query';
import { BookOpen, Lock, CheckCircle, ChevronRight } from 'lucide-react';

export default function Learn() {
  const [selectedLang, setSelectedLang] = useState('fr');

  const { data: languagesData } = useQuery('languages', () =>
    api.get('/courses/languages').then(r => r.data.data)
  );

  const { data: coursesData } = useQuery(['courses', selectedLang], () =>
    api.get(`/courses?language=${selectedLang}`).then(r => r.data.data), { enabled: !!selectedLang }
  );

  const languages = languagesData?.languages || [];
  const courses = coursesData?.courses || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">Learn</h1>
      <p className="text-gray-600 mb-8">Choose a language and start learning</p>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {languages.map((lang) => (
          <button key={lang.id} onClick={() => setSelectedLang(lang.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
              selectedLang === lang.id ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}>
            <span className="text-lg">{lang.flag_emoji}</span>
            {lang.name}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-${course.color_theme || 'blue'}-100`}>
                {course.language?.flag_emoji || '📚'}
              </div>
              <div>
                <h3 className="font-semibold">{course.title}</h3>
                <p className="text-sm text-gray-600">{course.level} • {course.total_lessons} lessons</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">{course.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <BookOpen className="w-4 h-4" />
                <span>{course.lessons?.length || 0} lessons</span>
              </div>
              <Link to={`/learn/${course.id}`}
                className="flex items-center gap-1 text-primary-600 font-medium text-sm hover:text-primary-700">
                Start <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
