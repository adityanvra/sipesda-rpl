const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const users = require('../routes/users');
const students = require('../routes/students');
const payments = require('../routes/payments');
const paymentTypes = require('../routes/paymentTypes');

const app = express();

// CORS configuration for production - Update dengan domain Vercel Anda  
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          'https://sipesda-deploy.vercel.app',
          'https://sipesda-rpl-fe.vercel.app',
          'https://sipesda-rpl-c573.vercel.app',
          'https://sipesda-deploy-git-main.vercel.app',
          'https://sipesda-deploy-git-main-adityanvra.vercel.app'
        ]
      : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // For legacy browser support
};

// Handle preflight requests
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json());

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