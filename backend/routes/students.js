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
    // Support pencarian by NISN (primary key) atau ID lama
    let sql, param;
    if (req.params.id.length > 10) {
      // Jika lebih dari 10 karakter, kemungkinan NISN
      sql = 'SELECT * FROM students WHERE nisn = ?';
      param = req.params.id;
    } else {
      // Jika kurang, bisa ID lama atau NISN pendek
      sql = 'SELECT * FROM students WHERE nisn = ? OR id = ?';
      param = req.params.id;
    }
    
    const [results] = await db.execute(sql, sql.includes('OR') ? [param, param] : [param]);
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
    const sql = `INSERT INTO students (nisn, nama, kelas, alamat, no_hp, nama_wali, jenis_kelamin, angkatan, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
    const values = [
      data.nisn,
      data.nama || data.name, 
      data.kelas, 
      data.alamat, 
      data.no_hp || data.no_telepon, 
      data.nama_wali || data.nama_orang_tua,
      data.jenis_kelamin || 'L',
      data.angkatan || new Date().getFullYear().toString()
    ];
    const [result] = await db.execute(sql, values);
    res.json({ message: 'Siswa ditambahkan', nisn: data.nisn });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    // Updated field mapping untuk database yang sudah diubah
    const validFields = [];
    const values = [];
    
    // Direct mapping - tidak perlu mapping lagi karena database sudah disesuaikan
    const allowedFields = ['nisn', 'nama', 'kelas', 'alamat', 'no_hp', 'nama_wali', 'jenis_kelamin', 'angkatan'];
    
    allowedFields.forEach(field => {
      if (data.hasOwnProperty(field) && data[field] !== undefined) {
        validFields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });
    
    // Support for legacy field names
    if (data.no_telepon && !data.no_hp) {
      validFields.push('no_hp = ?');
      values.push(data.no_telepon);
    }
    if (data.nama_orang_tua && !data.nama_wali) {
      validFields.push('nama_wali = ?');
      values.push(data.nama_orang_tua);
    }
    
    if (validFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Update by NISN (primary key) if possible, otherwise by ID
    let whereClause = 'nisn = ?';
    let whereValue = req.params.id;
    
    // Jika ID tidak terlihat seperti NISN, coba cari by ID dulu untuk mendapatkan NISN
    if (req.params.id.length <= 10) {
      try {
        const [existing] = await db.execute('SELECT nisn FROM students WHERE id = ?', [req.params.id]);
        if (existing.length > 0) {
          whereValue = existing[0].nisn;
        }
      } catch (err) {
        // Fallback ke pencarian by parameter asli
        whereClause = 'id = ?';
        whereValue = req.params.id;
      }
    }
    
    const sql = `UPDATE students SET ${validFields.join(', ')}, updated_at = NOW() WHERE ${whereClause}`;
    await db.execute(sql, [...values, whereValue]);
    res.json({ message: 'Siswa diperbarui' });
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    // Delete by NISN (primary key) if possible, otherwise by ID
    let whereClause = 'nisn = ?';
    let whereValue = req.params.id;
    
    if (req.params.id.length <= 10) {
      try {
        const [existing] = await db.execute('SELECT nisn FROM students WHERE id = ?', [req.params.id]);
        if (existing.length > 0) {
          whereValue = existing[0].nisn;
        }
      } catch (err) {
        whereClause = 'id = ?';
        whereValue = req.params.id;
      }
    }
    
    await db.execute(`DELETE FROM students WHERE ${whereClause}`, [whereValue]);
    res.json({ message: 'Siswa dihapus' });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

module.exports = router;
