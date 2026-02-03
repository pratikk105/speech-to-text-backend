const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { AssemblyAI } = require('assemblyai');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// 1. UNIVERSAL CORS (Allows Vercel to talk to Render)
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// 2. DATABASE CONNECTION
const MONGO_URI = "mongodb+srv://pratik:Pratik%400803@speechtextdb.1jyi9zm.mongodb.net/speech_db?retryWrites=true&w=majority";
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch((err) => console.error('❌ Database error:', err));

const Transcription = mongoose.model('Transcription', new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}));

const upload = multer({ dest: 'uploads/' });
const client = new AssemblyAI({ apiKey: process.env.ASSEMBLY_API_KEY });

// 3. WAKE-UP ENDPOINT
app.get('/', (req, res) => {
  res.send('Server is Awake and Ready!');
});

// 4. TRANSCRIBE ROUTE
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    
    const transcript = await client.transcripts.transcribe({ audio: fs.createReadStream(req.file.path) });
    
    const newEntry = new Transcription({ text: transcript.text });
    await newEntry.save();
    
    res.json({ text: transcript.text });
    fs.unlinkSync(req.file.path); 
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});