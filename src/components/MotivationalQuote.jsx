import { useEffect, useState } from 'react';

const QUOTES = [
  'Learning never exhausts the mind. – Leonardo da Vinci',
  'The beautiful thing about learning is nobody can take it away from you. – B.B. King',
  'Success is the sum of small efforts, repeated day in and day out. – Robert Collier',
  'The expert in anything was once a beginner. – Helen Hayes',
  'Education is the passport to the future, for tomorrow belongs to those who prepare for it today. – Malcolm X',
  'Strive for progress, not perfection.',
  'Every day is a chance to learn something new.'
];

export default function MotivationalQuote() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % QUOTES.length);
        setFade(true);
      }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`text-lg italic text-blue-700 dark:text-blue-300 text-center mt-2 transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}
      aria-live="polite"
    >
      “{QUOTES[index]}”
    </div>
  );
}
