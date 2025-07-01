// server/routes/chat.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const memoryStore = require('./memoryStore');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat', async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) return res.status(400).send("Missing userId or message");

  // Get user memory
  const userMessages = memoryStore.get(userId) || [];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({ history: userMessages });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    // Save conversation memory
    userMessages.push({ role: "user", parts: [{ text: message }] });
    userMessages.push({ role: "model", parts: [{ text: response }] });

    memoryStore.set(userId, userMessages);

    res.json({ reply: response });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).send("Error processing chat");
  }
});

module.exports = router;
