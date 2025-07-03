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
  
  // Debug endpoint for checking environment and database
  app.get('/api/debug', async (req, res) => {
    try {
      const db = require('../db');
      
      // Test database connection
      const connection = await db.getConnection();
      await connection.execute('SELECT 1 as test');
      connection.release();
      
      res.json({
        status: 'OK',
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          DB_HOST: process.env.DB_HOST ? '***set***' : 'NOT SET',
          DB_USER: process.env.DB_USER ? '***set***' : 'NOT SET',
          DB_PASSWORD: process.env.DB_PASSWORD ? '***set***' : 'NOT SET',
          DB_NAME: process.env.DB_NAME ? '***set***' : 'NOT SET',
          DB_PORT: process.env.DB_PORT || 'NOT SET'
        },
        database: 'Connected successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'ERROR',
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          DB_HOST: process.env.DB_HOST ? '***set***' : 'NOT SET',
          DB_USER: process.env.DB_USER ? '***set***' : 'NOT SET',
          DB_PASSWORD: process.env.DB_PASSWORD ? '***set***' : 'NOT SET',
          DB_NAME: process.env.DB_NAME ? '***set***' : 'NOT SET',
          DB_PORT: process.env.DB_PORT || 'NOT SET'
        },
        database_error: error.message,
        timestamp: new Date().toISOString()
      });
    }
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