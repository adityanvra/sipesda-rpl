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
    // Karena tabel tidak punya kolom nisn, kita pakai id sementara
    // Atau bisa search by nama jika nisn tidak ada
    const [results] = await db.execute('SELECT * FROM students WHERE id = ?', [req.params.nisn]);
    res.json(results[0] || null);
  } catch (err) {
    console.error('Get student by nisn error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    // Map frontend fields ke database fields yang sebenarnya ada
    const sql = `INSERT INTO students (nama, kelas, alamat, no_telepon, nama_orang_tua, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
    const values = [
      data.nama || data.name, 
      data.kelas, 
      data.alamat, 
      data.no_hp || data.no_telepon, 
      data.nama_wali || data.nama_orang_tua
    ];
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
    // Mapping dari frontend field ke database field yang sesuai
    const fieldMapping = {
      'nisn': 'nisn',
      'nama': 'nama', 
      'kelas': 'kelas',
      'nama_wali': 'nama_orang_tua', // Map ke nama_orang_tua yang ada di DB
      'angkatan': 'angkatan',
      'alamat': 'alamat',
      'no_hp': 'no_telepon', // Map ke no_telepon yang ada di DB
      'jenis_kelamin': 'jenis_kelamin'
    };
    
    // Filter hanya field yang ada di database dan mapping
    const validFields = [];
    const values = [];
    
    Object.keys(data).forEach(key => {
      if (fieldMapping[key]) {
        const dbField = fieldMapping[key];
        validFields.push(`${dbField} = ?`);
        values.push(data[key]);
      }
    });
    
    if (validFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const sql = `UPDATE students SET ${validFields.join(', ')}, updated_at = NOW() WHERE id = ?`;
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
