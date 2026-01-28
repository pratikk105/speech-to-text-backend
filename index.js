const Transcription = require('./models/Transcription');

// Inside your app.post('/api/transcribe'...)
const transcript = await client.transcripts.transcribe({ audio: audioStream });

// SAVE TO DATABASE
const newEntry = new Transcription({ text: transcript.text });
await newEntry.save(); 

res.json({ text: transcript.text });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { AssemblyAI } = require('assemblyai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// 1. MIDDLEWARE SETUP
// We use origin: "*" to fix the "Check if backend is running" error
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// 2. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// 3. FILE UPLOAD (MULTER) CONFIG
const upload = multer({ dest: 'uploads/' });

// 4. ASSEMBLY AI CONFIG
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_API_KEY
});

const fs = require('fs'); // Add this at the top of index.js

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    console.log('🎤 File received. Uploading to AI...');

    // Use a ReadStream to send the file safely
    const audioStream = fs.createReadStream(req.file.path);
    
    const transcript = await client.transcripts.transcribe({
      audio: audioStream
    });

    console.log('✅ Success!');
    res.json({ text: transcript.text });

    // Clean up: Delete the file from 'uploads' folder after sending
    fs.unlinkSync(req.file.path);

  } catch (error) {
    console.error('❌ AI Error Details:', error);
    res.status(500).json({ error: 'AI failed to process the file.' });
  }
});

// 6. START SERVER
app.listen(8000, '0.0.0.0', () => {
  console.log("🚀 Server is live on http://127.0.0.1:8000");
});