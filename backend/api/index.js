const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const users = require('../routes/users');
const students = require('../routes/students');
const payments = require('../routes/payments');
const paymentTypes = require('../routes/paymentTypes');

const app = express();

// CORS configuration for production - Update dengan domain Netlify Anda
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://your-netlify-domain.netlify.app', // Ganti dengan domain Netlify Anda
        'https://your-netlify-domain.netlify.com'  // Alternative domain
      ]
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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