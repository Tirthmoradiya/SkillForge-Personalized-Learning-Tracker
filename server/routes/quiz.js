import express from 'express';
import Course from '../models/Course.js';
import Topic from '../models/Topic.js';
import { verifyToken } from '../middleware/auth.js';
import axios from 'axios';

const router = express.Router();

// POST /api/quiz/generate
router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ message: 'courseId is required' });
    const course = await Course.findById(courseId).populate('topics');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    // Improved prompt for Gemini
    const prompt = `Generate a quiz of exactly 10 multiple-choice questions on these topics: ${course.topics.map(t => t.title).join(', ')}. Each question should have 4 options (A, B, C, D), only one correct answer. STRICTLY return ONLY a JSON array of 10 objects, each with these fields: question (string), options (array of 4 strings), answer (index of correct option, 0-based). Do not include any explanation, markdown, or extra text. Example format: [ { "question": "...", "options": ["A", "B", "C", "D"], "answer": 2 }, ... ]. If you cannot return JSON, use plain text in this format: 1. Question\nA. ...\nB. ...\nC. ...\nD. ...\nAnswer: B`;
    const apiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
    const geminiRes = await axios.post(geminiUrl, {
      contents: [{ parts: [{ text: prompt }] }]
    });
    // Parse Gemini response
    let questions = [];
    let text = '';
    try {
      text = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || geminiRes.data.candidates?.[0]?.content?.text || '';
      // Remove code block markers if present
      if (text.trim().startsWith('```')) {
        text = text.replace(/^```[a-zA-Z]*\n?|```$/g, '').trim();
        // Remove trailing code block if present
        if (text.endsWith('```')) text = text.slice(0, -3).trim();
      }
      // Try to parse as JSON first
      questions = JSON.parse(text);
    } catch (e) {
      // If not valid JSON, try to preprocess plain text
      // Look for lines like: 1. Question\nA. ...\nB. ...\nC. ...\nD. ...\nAnswer: B
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      let qArr = [];
      let i = 0;
      while (i < lines.length) {
        // Find question line
        const qMatch = lines[i].match(/^\d+\.\s*(.*)/);
        if (qMatch) {
          const question = qMatch[1];
          let options = [];
          let answerIdx = null;
          // Next 4 lines: options
          for (let j = 1; j <= 4 && i + j < lines.length; j++) {
            const optMatch = lines[i + j].match(/^[A-Da-d]\.\s*(.*)/);
            if (optMatch) options.push(optMatch[1]);
          }
          // Find answer line
          let answerLine = lines[i + 5] || '';
          let answerLetter = null;
          const ansMatch = answerLine.match(/Answer\s*[:\-]?\s*([A-Da-d])/);
          if (ansMatch) answerLetter = ansMatch[1].toUpperCase();
          if (answerLetter) answerIdx = answerLetter.charCodeAt(0) - 65;
          if (question && options.length === 4 && answerIdx !== null) {
            qArr.push({ question, options, answer: answerIdx });
          }
          i += 6;
        } else {
          i++;
        }
      }
      questions = qArr;
    }
    // Validate format
    if (!Array.isArray(questions) || questions.length !== 10) {
      console.error('Gemini raw response:', text);
      console.error('Parsed questions:', questions);
      return res.status(500).json({ message: 'Gemini did not return 10 valid questions', questions, raw: text });
    }
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router; 