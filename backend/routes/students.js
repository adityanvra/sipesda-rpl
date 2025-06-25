const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM students');
    res.json(results);
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM students WHERE id = ?', [req.params.id]);
    res.json(results[0] || null);
  } catch (err) {
    console.error('Get student by id error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.get('/nisn/:nisn', async (req, res) => {
  try {
    const [results] = await db.execute('SELECT * FROM students WHERE nisn = ?', [req.params.nisn]);
    res.json(results[0] || null);
  } catch (err) {
    console.error('Get student by nisn error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const sql = `INSERT INTO students (nisn, nama, kelas, nama_wali, angkatan, alamat, no_hp, jenis_kelamin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
    const values = [data.nisn, data.nama, data.kelas, data.nama_wali, data.angkatan, data.alamat, data.no_hp, data.jenis_kelamin];
    const [result] = await db.execute(sql, values);
    res.json({ message: 'Siswa ditambahkan', id: result.insertId });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const sql = `UPDATE students SET ${fields}, updated_at = NOW() WHERE id = ?`;
    await db.execute(sql, [...values, req.params.id]);
    res.json({ message: 'Siswa diperbarui' });
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ message: 'Siswa dihapus' });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

module.exports = router;
