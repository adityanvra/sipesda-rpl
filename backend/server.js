const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const users = require('./routes/users');
const students = require('./routes/students');
const payments = require('./routes/payments');
const paymentTypes = require('./routes/paymentTypes');

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://sipesda-deploy.vercel.app', // Frontend URL yang sudah ada
        'https://sipesda-rpl-fe.vercel.app', // Frontend URL yang baru
        'https://sipesda-rpl-c573.vercel.app', // Frontend URL alternatif
        'https://sipesda-deploy-git-main.vercel.app',
        'https://sipesda-deploy-git-main-adityanvra.vercel.app'
      ]
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.use('/users', users);
app.use('/students', students);
app.use('/payments', payments);
app.use('/payment-types', paymentTypes);

app.get('/', (req, res) => {
  res.send('🚀 Sipesda Backend Berjalan dengan Baik!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));