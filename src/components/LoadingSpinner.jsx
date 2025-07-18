import React from 'react';
import { Transition } from '@headlessui/react';

const LoadingSpinner = ({ size = 'default', fullScreen = false, show = true }) => {
  const spinnerSizes = {
    small: 'w-5 h-5',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const spinnerClasses = `
    relative
    ${spinnerSizes[size]}
    before:content-[''] 
    before:absolute 
    before:inset-0 
    before:rounded-full 
    before:border-4 
    before:border-blue-100 
    dark:before:border-blue-900/30
    after:content-[''] 
    after:absolute 
    after:inset-0 
    after:rounded-full 
    after:border-4 
    after:border-transparent 
    after:border-t-blue-600 
    dark:after:border-t-blue-400
    after:animate-[spin_0.8s_ease-in-out_infinite]
    after:shadow-[0_0_15px_rgba(59,130,246,0.5)]
  `;

  const spinner = (
    <div className="flex items-center justify-center">
      <div
        className={spinnerClasses}
        role="status"
        aria-label="loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <Transition
        show={show}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 flex flex-col items-center space-y-4 animate-fade-in-up">
            {spinner}
            <p className="text-gray-600 dark:text-gray-300 animate-pulse">Loading...</p>
          </div>
        </div>
      </Transition>
    );
  }

  return spinner;
};

export default LoadingSpinner;