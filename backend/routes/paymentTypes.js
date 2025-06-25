const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM payment_types WHERE aktif = 1');
    res.json(results);
  } catch (err) {
    console.error('Get payment types error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nama, nominal, periode, aktif = true } = req.body;
    const sql = 'INSERT INTO payment_types (nama, nominal, periode, aktif) VALUES (?, ?, ?, ?)';
    const [result] = await db.execute(sql, [nama, nominal, periode, aktif]);
    res.json({ message: 'Jenis pembayaran ditambahkan', id: result.insertId });
  } catch (err) {
    console.error('Create payment type error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

module.exports = router;