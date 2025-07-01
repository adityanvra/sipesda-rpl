const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const users = require('../routes/users');
const students = require('../routes/students');
const payments = require('../routes/payments');
const paymentTypes = require('../routes/paymentTypes');

const app = express();

// CORS configuration - Allow frontend domains
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://sipesda-rpl-fe.vercel.app',
      'https://sipesda-rpl-fe-git-main.vercel.app', 
      'https://sipesda-rpl-fe-git-main-adityanvra.vercel.app',
      'https://sipesda-rpl-fe-adityanvra.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Explicit CORS headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://sipesda-rpl-fe.vercel.app',
    'https://sipesda-rpl-fe-git-main.vercel.app', 
    'https://sipesda-rpl-fe-git-main-adityanvra.vercel.app',
    'https://sipesda-rpl-fe-adityanvra.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Debug CORS
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  // Additional debug for CORS issues - v2
  console.log('CORS Headers:', req.headers);
  next();
});

// Routes
app.use('/api/users', users);
app.use('/api/students', students);
app.use('/api/payments', payments);
app.use('/api/payment-types', paymentTypes);

// Health check
app.get('/api', (req, res) => {
  res.json({ 
    message: '🚀 Sipesda Backend API berjalan di Vercel!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Sipesda Backend API berjalan di Vercel!',
    docs: '/api',
    timestamp: new Date().toISOString()
  });
});

module.exports = app; 