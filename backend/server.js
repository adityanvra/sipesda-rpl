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

app.use('/users', users);
app.use('/students', students);
app.use('/payments', payments);
app.use('/payment-types', paymentTypes);

app.get('/', (req, res) => {
  res.send('🚀 Sipesda Backend Berjalan dengan Baik!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));