import { CheckCircleIcon, EyeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function ProgressStepper({ topics, viewedTopicIds, currentIdx }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {topics.map((topic, idx) => {
        const viewed = viewedTopicIds.includes(topic._id);
        const unlocked = idx === 0 || viewedTopicIds.includes(topics[idx - 1]._id);
        return (
          <div key={topic._id} className="flex flex-col items-center">
            <div
              className={`flex items-center justify-center rounded-full border-2 transition-all duration-300 w-8 h-8 text-lg font-bold
                ${viewed ? 'bg-green-500 border-green-500 text-white animate-bounce-in' :
                  unlocked ? 'bg-blue-100 border-blue-400 text-blue-700' :
                  'bg-gray-200 border-gray-300 text-gray-400'}
              `}
              aria-label={viewed ? 'Viewed' : unlocked ? 'Unlocked' : 'Locked'}
              tabIndex={0}
            >
              {viewed ? <CheckCircleIcon className="h-6 w-6 animate-pop-in" /> : unlocked ? <EyeIcon className="h-5 w-5" /> : <LockClosedIcon className="h-5 w-5" />}
            </div>
            {idx < topics.length - 1 && (
              <div className="w-8 h-1 bg-gradient-to-r from-blue-200 to-blue-400 dark:from-blue-800 dark:to-blue-600" />
            )}
          </div>
        );
      })}
      <style>{`
        .animate-bounce-in { animation: bounceIn 0.7s; }
        .animate-pop-in { animation: popIn 0.4s; }
        @keyframes bounceIn { 0% { transform: scale(0.5); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
        @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
} 