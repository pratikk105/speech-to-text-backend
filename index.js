const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { AssemblyAI } = require('assemblyai');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// 1. MIDDLEWARE
app.use(cors());
app.use(express.json());

// 2. DATABASE CONNECTION (Using .then to avoid top-level await error)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch((err) => console.error('❌ Database error:', err));

// 3. DATABASE SCHEMA
const TranscriptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Transcription = mongoose.model('Transcription', TranscriptionSchema);

// 4. CONFIGURATION
const upload = multer({ dest: 'uploads/' });
const client = new AssemblyAI({ apiKey: process.env.ASSEMBLY_API_KEY });

// 5. TRANSCRIBE ROUTE
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    console.log('🎤 Received file, sending to AI...');
    const audioStream = fs.createReadStream(req.file.path);
    
    // The await is allowed here because it is inside an "async" function
    const transcript = await client.transcripts.transcribe({ audio: audioStream });

    // Save to MongoDB
    const newEntry = new Transcription({ text: transcript.text });
    await newEntry.save();
    console.log('💾 Saved to database!');

    res.json({ text: transcript.text });
    
    // Clean up local file
    fs.unlinkSync(req.file.path); 

  } catch (error) {
    console.error('❌ AI Error:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// 6. SERVER START
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});