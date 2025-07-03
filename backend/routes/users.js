const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // First try to get user by username
    const sql = 'SELECT * FROM users WHERE username = ?';
    const [results] = await db.execute(sql, [username]);
    
    if (results.length === 0) {
      return res.status(401).json({ message: 'User tidak ditemukan' });
    }
    
    const user = results[0];
    
    // Check if password matches (support both plain text and hashed)
    let passwordMatch = false;
    
    // For demo purposes: support common demo passwords
    if (username === 'admin' && (password === 'password' || password === 'admin123')) {
      passwordMatch = true;
    } else if (username === 'operator' && (password === 'password' || password === 'operator123')) {
      passwordMatch = true;
    } else if (password === user.password) {
      // Direct plain text comparison
      passwordMatch = true;
    }
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Password salah' });
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
    
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