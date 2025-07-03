const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    const [results] = await db.execute(sql, [username, password]);
    
    if (results.length === 0) {
      return res.status(401).json({ message: 'User tidak ditemukan' });
    }
    
    res.json(results[0]);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    const [result] = await db.execute(sql, [username, password, role]);
    
    res.json({ message: 'User berhasil ditambahkan', id: result.insertId });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

module.exports = router;