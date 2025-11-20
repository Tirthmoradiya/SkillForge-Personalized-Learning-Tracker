import { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';

// Replace the mock Gemini API call with a real fetch (or keep a better mock)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_GEMINI_API_KEY';

import { API_BASE_URL } from '../config/api';

async function fetchGeminiResponse(prompt) {
  const response = await fetch(`${API_BASE_URL}/api/test/gemini-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const data = await response.json();
  return data.message || data.error || 'No response from Gemini.';
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { type: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsTyping(true);

    // Gemini API integration (mock or real)
    // Add instruction to prompt
    const prompt = `${input}\n\nGive only one best response.`;
    const botReply = await fetchGeminiResponse(prompt);
    setMessages((prev) => [...prev, { type: 'bot', content: botReply }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-full text-white shadow-lg hover:shadow-blue-600/20 hover:scale-110 active:scale-95 transition-all duration-200 relative focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        tabIndex={0}
      >
        <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20"></div>
        {isOpen ? (
          <XMarkIcon className="h-7 w-7" />
        ) : (
          <ChatBubbleLeftIcon className="h-7 w-7" />
        )}
      </button>

      {/* Chat window */}
      <Transition
        show={isOpen}
        enter="transition-all duration-300"
        enterFrom="opacity-0 translate-y-4 scale-95"
        enterTo="opacity-100 translate-y-0 scale-100"
        leave="transition-all duration-200"
        leaveFrom="opacity-100 translate-y-0 scale-100"
        leaveTo="opacity-0 translate-y-4 scale-95"
        className="fixed sm:absolute bottom-0 right-0 w-full h-full sm:bottom-16 sm:right-0 sm:w-full sm:max-w-xs md:max-w-md lg:max-w-lg sm:h-auto z-50"
      >
        <div className="h-full sm:h-auto w-full sm:w-[28rem] sm:max-w-[90vw] md:w-[32rem] md:h-[38rem] bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-none sm:rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col transition-all duration-300">
          {/* Chat header */}
          <div className="sticky top-0 z-10 p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-500/10 to-blue-600/10 flex items-center justify-between shadow-sm">
            <div className="flex items-center">
              <ChatBubbleLeftIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close chat"
              tabIndex={0}
            >
              <XMarkIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/70 dark:bg-gray-900/60">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 shadow-sm whitespace-pre-wrap break-words ${message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                    : 'bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700'
                  }`}
                >
                  {message.type === 'bot' ? <BotMessage content={message.content} /> : message.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[80%] rounded-2xl p-3 bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 shadow-sm transition-colors duration-200 py-3 px-4 text-base"
                aria-label="Chat input"
                tabIndex={0}
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-xl hover:shadow-lg hover:shadow-blue-600/20 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!input.trim()}
                aria-label="Send message"
                tabIndex={0}
              >
                <PaperAirplaneIcon className="h-6 w-6" />
              </button>
            </div>
          </form>
        </div>
      </Transition>
    </div>
  );
}

// Helper to render bot messages with code and bolded explanation
import React from 'react';
function BotMessage({ content }) {
  // Replace HTML entities for code blocks
  const decodeEntities = (str) =>
    str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  // Split code blocks and text
  const parts = [];
  let lastIdx = 0;
  const codeRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
  let match;
  let idx = 0;
  while ((match = codeRegex.exec(content))) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', value: content.slice(lastIdx, match.index) });
    }
    parts.push({ type: 'code', lang: match[1], value: match[2] });
    lastIdx = codeRegex.lastIndex;
    idx++;
  }
  if (lastIdx < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIdx) });
  }

  // Bold keywords in explanation
  function formatText(text) {
    // Replace **text** with <b>text</b>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Replace `text` with <code>text</code> for inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    // Render every line with dangerouslySetInnerHTML so <b>...</b> and <code>...</code> work
    return formatted.split(/\n/).map((line, i) => (
      <div key={i} dangerouslySetInnerHTML={{__html: line}} />
    ));
  }

  return (
    <>
      {parts.map((part, i) =>
        part.type === 'code' ? (
          <pre key={i} className="my-2 rounded-lg bg-gray-900 text-white text-sm p-3 overflow-x-auto border border-gray-700">
            <code>{decodeEntities(part.value)}</code>
          </pre>
        ) : (
          <div key={i} className="mb-1 text-gray-900 dark:text-gray-100 text-[0.97rem]">
            {formatText(part.value)}
          </div>
        )
      )}
    </>
  );
}