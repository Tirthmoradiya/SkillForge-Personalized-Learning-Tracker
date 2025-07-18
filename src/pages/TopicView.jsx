import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { BookOpenIcon, AcademicCapIcon, BeakerIcon } from '@heroicons/react/24/outline';
// Add import for dynamic course content
import { useEffect } from 'react';
import useApi from '../hooks/useApi';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function TopicView() {
  const { topicId } = useParams();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [courseContent, setCourseContent] = useState('');
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [hasMarkedViewed, setHasMarkedViewed] = useState(false);
  const { post } = useApi();

  useEffect(() => {
    // Try to load a course file for this topic
    const fileName = Object.keys(topicFileMap).find(
      (key) => key === topicId
    );
    if (fileName) {
      import(`../courses/${fileName}.txt?raw`).then((mod) => {
        setCourseContent(mod.default);
      }).catch(() => setCourseContent(''));
    } else {
      setCourseContent('');
    }
    // Show description modal on mount
    setShowDescriptionModal(true);
    setHasMarkedViewed(false);
  }, [topicId]);

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: optionIndex,
    });
  };

  const handleQuizSubmit = () => {
    setShowResults(true);
  };

  const handleCloseModal = async () => {
    setShowDescriptionModal(false);
    if (!hasMarkedViewed) {
      try {
        // Compose two-line description
        const shortDescription = `${topic.description}\nHere you will learn the essentials of this topic.`;
        await post(`/api/user/topics/${topicId}/viewed`, { shortDescription });
        setHasMarkedViewed(true);
      } catch (e) {
        // Optionally handle error
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal for topic description */}
      {showDescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-2">{topic.title}</h2>
            <p className="mb-2">{topic.description}</p>
            <p className="mb-4">Here you will learn the essentials of this topic. Please review the description before proceeding.</p>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={handleCloseModal}
            >
              Continue
            </button>
          </div>
        </div>
      )}
      {/* Topic Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">{topic.title}</h1>
        <p className="mt-1 text-gray-500">{topic.description}</p>
      </div>

      {/* Topic Content Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <Tab.Group>
          <Tab.List className="flex space-x-1 border-b p-1">
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 focus:outline-none focus:ring-2',
                  selected
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                )
              }
            >
              <div className="flex items-center justify-center">
                <BookOpenIcon className="h-5 w-5 mr-2" />
                Content
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 focus:outline-none focus:ring-2',
                  selected
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                )
              }
            >
              <div className="flex items-center justify-center">
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Resources
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 focus:outline-none focus:ring-2',
                  selected
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                )
              }
            >
              <div className="flex items-center justify-center">
                <BeakerIcon className="h-5 w-5 mr-2" />
                Practice
              </div>
            </Tab>
          </Tab.List>
          <Tab.Panels>
            {/* Content Panel */}
            <Tab.Panel className="p-6">
              <div className="prose max-w-none">
                {courseContent ? (
                  <pre>{courseContent}</pre>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: topic.content }} />
                )}
              </div>
            </Tab.Panel>

            {/* Resources Panel */}
            <Tab.Panel className="p-6">
              <div className="space-y-4">
                {topic.resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <h3 className="text-lg font-medium text-gray-900">
                      {resource.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 capitalize">
                      {resource.type}
                    </p>
                  </a>
                ))}
              </div>
            </Tab.Panel>

            {/* Quiz Panel */}
            <Tab.Panel className="p-6">
              <div className="space-y-6">
                {topic.quiz.map((question, questionIndex) => (
                  <div key={questionIndex} className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {question.question}
                    </h3>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <button
                          key={optionIndex}
                          onClick={() => handleAnswerSelect(questionIndex, optionIndex)}
                          className={classNames(
                            'w-full text-left p-4 border rounded-lg',
                            selectedAnswers[questionIndex] === optionIndex
                              ? 'border-blue-500 bg-blue-50'
                              : 'hover:bg-gray-50'
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {showResults && (
                      <p
                        className={classNames(
                          'mt-2 text-sm',
                          selectedAnswers[questionIndex] === question.correctAnswer
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {selectedAnswers[questionIndex] === question.correctAnswer
                          ? 'Correct!'
                          : 'Incorrect. Try again!'}
                      </p>
                    )}
                  </div>
                ))}
                {!showResults && (
                  <button
                    onClick={handleQuizSubmit}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Submit Answers
                  </button>
                )}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}