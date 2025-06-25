const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  db.query('SELECT * FROM payment_types WHERE aktif = 1', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

router.post('/', (req, res) => {
  const { nama, nominal, periode, aktif = true } = req.body;
  const sql = 'INSERT INTO payment_types (nama, nominal, periode, aktif) VALUES (?, ?, ?, ?)';
  db.query(sql, [nama, nominal, periode, aktif], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Jenis pembayaran ditambahkan', id: result.insertId });
  });
});

module.exports = router;