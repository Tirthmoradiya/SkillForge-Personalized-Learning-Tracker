import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircleIcon, ChevronRightIcon, XCircleIcon, TrophyIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

function Confetti({ active }) {
  // Simple confetti effect using emoji (for demo, can be replaced with a library)
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center animate-fade-in">
      <div className="text-6xl select-none animate-bounce">🎉</div>
    </div>
  );
}

export default function QuizPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eligibleCourses, setEligibleCourses] = useState([]);
  const [quizState, setQuizState] = useState({ active: false, course: null, questions: [], answers: [], current: 0, submitting: false, result: null, bestScore: null });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch('/api/user/progress/courses', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load courses');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setEligibleCourses(courses.filter(c => c.percentage === 100));
  }, [courses]);

  // Fetch user's best quiz score for a course
  const getBestScore = (courseId) => {
    if (!user || !user.quizScores) return null;
    const found = user.quizScores.find(q => q.course === courseId || q.course?._id === courseId);
    return found ? found.score : null;
  };

  // Show confetti if new high score
  useEffect(() => {
    if (quizState.result && quizState.result.percent === quizState.result.bestScore && quizState.result.percent > 0) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(t);
    }
  }, [quizState.result]);

  // Start quiz: fetch questions from backend
  const startQuiz = async (course) => {
    setQuizState(s => ({ ...s, active: true, course, questions: [], answers: [], current: 0, submitting: true, result: null, bestScore: getBestScore(course.id) }));
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ courseId: course.id })
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.questions)) {
        setQuizState(s => ({ ...s, questions: data.questions, answers: Array(10).fill(null), submitting: false }));
      } else {
        setQuizState(s => ({ ...s, submitting: false }));
        alert(data.message || 'Failed to generate quiz');
      }
    } catch (e) {
      setQuizState(s => ({ ...s, submitting: false }));
      alert('Failed to generate quiz');
    }
  };

  // Handle answer selection
  const selectAnswer = (idx) => {
    setQuizState(s => {
      const newAnswers = [...s.answers];
      newAnswers[s.current] = idx;
      return { ...s, answers: newAnswers };
    });
  };

  // Next question
  const nextQuestion = () => {
    setQuizState(s => ({ ...s, current: s.current + 1 }));
  };

  // Submit quiz
  const submitQuiz = async () => {
    setQuizState(s => ({ ...s, submitting: true }));
    const { questions, answers, course } = quizState;
    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].answer) score++;
    }
    // Save score to backend
    try {
      const res = await fetch('/api/user/quiz-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ courseId: course.id, score: Math.round((score / questions.length) * 100) })
      });
      const data = await res.json();
      setQuizState(s => ({ ...s, submitting: false, result: { score, total: questions.length, percent: Math.round((score / questions.length) * 100), backendMsg: data.message, bestScore: data.score } }));
    } catch (e) {
      setQuizState(s => ({ ...s, submitting: false, result: { score, total: questions.length, percent: Math.round((score / questions.length) * 100), backendMsg: 'Failed to save score', bestScore: null } }));
    }
  };

  // Reset quiz state
  const resetQuiz = () => setQuizState({ active: false, course: null, questions: [], answers: [], current: 0, submitting: false, result: null, bestScore: null });

  // Quiz UI
  if (quizState.active) {
    if (quizState.submitting) {
      return <div className="text-center py-12 text-lg text-blue-600 animate-pulse">Loading quiz...</div>;
    }
    if (quizState.result) {
      return (
        <div className="max-w-xl w-full mx-auto py-4 sm:py-8 px-2 sm:px-0 relative">
          <Confetti active={showConfetti} />
          <div className="flex flex-col items-center mb-6">
            <TrophyIcon className="h-16 w-16 text-yellow-400 drop-shadow mb-2 animate-bounce" />
            <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent">Quiz Result</h2>
          </div>
          <div className="text-2xl mb-4 font-bold text-blue-700 dark:text-blue-300">You scored {quizState.result.score} / {quizState.result.total} <span className="text-gray-500 text-lg">({quizState.result.percent}%)</span></div>
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 h-6 rounded-full transition-all duration-700" style={{ width: `${quizState.result.percent}%` }}></div>
            </div>
          </div>
          <div className="text-green-600 mb-2 font-semibold text-lg">{quizState.result.backendMsg}</div>
          {quizState.result.bestScore !== null && (
            <div className="text-blue-600 mb-4 text-lg">Your best score for this course: <span className="font-bold">{quizState.result.bestScore}%</span></div>
          )}
          <button className="mt-6 bg-gradient-to-r from-blue-600 to-green-500 text-white px-8 py-3 rounded-xl shadow hover:scale-105 transition-transform text-lg font-semibold" onClick={resetQuiz}>Back to Quizzes</button>
        </div>
      );
    }
    const q = quizState.questions[quizState.current];
    if (!q) {
      return (
        <div className="text-center py-12 text-lg text-blue-600 animate-pulse">
          Loading question...
        </div>
      );
    }
    const progress = Math.round(((quizState.current) / quizState.questions.length) * 100);
    return (
      <div className="max-w-xl w-full mx-auto py-4 sm:py-8 px-2 sm:px-0 relative">
        <Confetti active={showConfetti} />
        <h2 className="text-3xl font-extrabold mb-4 text-center bg-gradient-to-r from-blue-600 to-green-400 bg-clip-text text-transparent flex items-center justify-center gap-2 animate-fade-in-up">
          <QuestionMarkCircleIcon className="h-8 w-8 text-blue-400 drop-shadow" />
          {quizState.course.title} Quiz
        </h2>
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 relative overflow-hidden">
            <div className="bg-gradient-to-r from-blue-400 to-green-400 h-5 rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200">{progress}%</span>
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">Question {quizState.current + 1} of {quizState.questions.length}</div>
        </div>
        {/* Animated Question Card */}
        <div className="mb-8 px-2 sm:px-6 py-4 sm:py-7 rounded-2xl sm:rounded-3xl shadow-xl bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-blue-950 border border-blue-100 dark:border-blue-900/40 scale-100 animate-fade-in-up transition-transform duration-300 w-full max-w-xs sm:max-w-none mx-auto">
          <div className="text-xl font-bold text-center text-gray-900 dark:text-white animate-fade-in-up">{q.question}</div>
        </div>
        <div className="space-y-3 sm:space-y-4 mb-8">
          {q.options.map((opt, idx) => {
            const selected = quizState.answers[quizState.current] === idx;
            return (
              <button
                key={idx}
                className={`flex items-center gap-2 sm:gap-3 block w-full text-left px-3 sm:px-6 py-2 sm:py-4 rounded-xl sm:rounded-2xl border-2 font-semibold shadow-sm transition-all duration-200 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-400
                  ${selected
                    ? 'bg-gradient-to-r from-blue-500 to-green-400 text-white border-blue-600 scale-105 ring-2 ring-blue-300 shadow-lg'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900 hover:scale-[1.01] text-gray-900 dark:text-white'}`}
                onClick={() => selectAnswer(idx)}
                disabled={quizState.submitting}
                tabIndex={0}
                aria-pressed={selected}
              >
                {selected ? (
                  <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-300 drop-shadow" />
                ) : (
                  <CircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-200 dark:text-blue-700" />
                )}
                <span>{String.fromCharCode(65 + idx)}. {opt}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col sm:flex-row justify-between mt-8 sm:mt-10 gap-3 sm:gap-4 w-full">
          <button className="flex items-center gap-2 bg-gray-200 text-gray-700 px-5 py-3 rounded-xl shadow hover:bg-gray-300 transition-colors text-base font-semibold" onClick={resetQuiz} aria-label="Cancel Quiz"><XCircleIcon className="h-5 w-5" />Cancel</button>
          {quizState.current < quizState.questions.length - 1 ? (
            <button
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-500 text-white px-8 py-3 rounded-xl shadow hover:scale-105 transition-transform text-base font-semibold"
              onClick={nextQuestion}
              disabled={quizState.answers[quizState.current] === null}
              aria-label="Next Question"
            >
              Next <ChevronRightIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-500 text-white px-8 py-3 rounded-xl shadow hover:scale-105 transition-transform text-base font-semibold"
              onClick={submitQuiz}
              disabled={quizState.answers[quizState.current] === null}
              aria-label="Submit Quiz"
            >
              Submit <CheckCircleIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-extrabold mb-6 text-center bg-gradient-to-r from-blue-600 to-green-400 bg-clip-text text-transparent drop-shadow">Course Quizzes</h1>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : eligibleCourses.length === 0 ? (
        <div className="text-center text-gray-500">Complete a course to unlock its quiz!</div>
      ) : (
        <ul className="space-y-4">
          {eligibleCourses.map(course => (
            <li key={course.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex items-center justify-between border border-gray-100 dark:border-gray-700 hover:scale-[1.01] transition-transform">
              <div>
                <div className="font-bold text-lg text-gray-900 dark:text-white mb-1">{course.title}</div>
                <div className="text-gray-600 dark:text-gray-300 text-sm mb-1">{course.description}</div>
                {getBestScore(course.id) !== null && (
                  <div className="text-blue-600 text-sm mt-1">Best Score: <span className="font-bold">{getBestScore(course.id)}%</span></div>
                )}
              </div>
              <button className="bg-gradient-to-r from-blue-600 to-green-400 text-white px-6 py-2 rounded shadow hover:scale-105 transition-transform" onClick={() => startQuiz(course)}>Take Quiz</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CircleIcon(props) {
  return <svg viewBox="0 0 24 24" fill="none" {...props}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /></svg>;
} 