import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST route for Gemini API
router.post('/gemini-test', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, error: 'Prompt is required' });
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ success: true, message: text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test route for MongoDB connection
router.get('/mongo-test', (req, res) => {
  const status = {
    isConnected: false,
    readyState: 0,
    error: null
  };

  try {
    const mongoose = req.app.get('mongoose');
    status.isConnected = mongoose.connection.readyState === 1;
    status.readyState = mongoose.connection.readyState;
  } catch (error) {
    status.error = error.message;
  }

  res.json(status);
});

export default router;