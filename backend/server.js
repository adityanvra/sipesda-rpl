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
    ? ['https://your-frontend-domain.vercel.app'] // Ganti dengan domain Vercel Anda
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
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