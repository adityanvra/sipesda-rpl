const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const users = require('../routes/users');
const students = require('../routes/students');
const payments = require('../routes/payments');
const paymentTypes = require('../routes/paymentTypes');

const app = express();

// CORS configuration for production - Updated with correct domains
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://sipesda-rpl-fe.vercel.app',
        'https://sipesda-rpl-fe-git-main-aditya-navras-projects-b1ead26b.vercel.app',
        'https://sipesda-rpl-fe-aditya-navras-projects-b1ead26b.vercel.app'
      ]
    : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    optionsSuccessStatus: 200
  };
  
  app.use(cors(corsOptions));
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