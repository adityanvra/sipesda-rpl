const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const studentId = req.query.student_id;
    const studentNisn = req.query.student_nisn;
    let sql = 'SELECT * FROM payments';
    let params = [];
    
    if (studentNisn) {
      // Use NISN if provided
      sql += ' WHERE student_nisn = ?';
      params.push(studentNisn);
    } else if (studentId) {
      // Support legacy student_id by looking up NISN first
      const [studentResult] = await db.execute('SELECT nisn FROM students WHERE id = ?', [studentId]);
      if (studentResult.length > 0) {
        sql += ' WHERE student_nisn = ?';
        params.push(studentResult[0].nisn);
      } else {
        return res.json([]); // No student found
      }
    }
    
    const [results] = await db.execute(sql, params);
    res.json(results);
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.get('/by-month', async (req, res) => {
  try {
    const { studentId, studentNisn, month, year } = req.query;
    let nisn = studentNisn;

    // If studentId is provided instead of NISN, convert it
    if (!nisn && studentId) {
      const [studentResult] = await db.execute('SELECT nisn FROM students WHERE id = ?', [studentId]);
      if (studentResult.length > 0) {
        nisn = studentResult[0].nisn;
      } else {
        return res.json([]); // No student found
      }
    }

    const query = `
      SELECT * FROM payments 
      WHERE student_nisn = ? 
        AND MONTH(tanggal_pembayaran) = ? 
        AND YEAR(tanggal_pembayaran) = ?
        AND jenis_pembayaran LIKE '%SPP%'
    `;

    const [results] = await db.execute(query, [nisn, month, year]);
    res.json(results);
  } catch (err) {
    console.error('Get payments by month error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    let studentNisn = data.student_nisn;

    // Support legacy student_id by converting to NISN
    if (!studentNisn && data.student_id) {
      const [studentResult] = await db.execute('SELECT nisn FROM students WHERE id = ?', [data.student_id]);
      if (studentResult.length > 0) {
        studentNisn = studentResult[0].nisn;
      } else {
        return res.status(400).json({ error: 'Student not found' });
      }
    }

    if (!studentNisn) {
      return res.status(400).json({ error: 'student_nisn or student_id is required' });
    }

    const sql = `INSERT INTO payments (student_id, student_nisn, jenis_pembayaran, nominal, tanggal_pembayaran, status, keterangan, catatan, petugas, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    const values = [
      data.student_id || null, // Keep for legacy compatibility
      studentNisn,
      data.jenis_pembayaran, 
      data.nominal, 
      data.tanggal_pembayaran, 
      data.status, 
      data.keterangan, 
      data.catatan, 
      data.petugas
    ];
    const [result] = await db.execute(sql, values);
    res.json({ message: 'Pembayaran ditambahkan', id: result.insertId });
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    
    // Build update fields dynamically
    const validFields = [];
    const values = [];
    
    // Handle student_nisn conversion if student_id is provided
    if (data.student_id && !data.student_nisn) {
      const [studentResult] = await db.execute('SELECT nisn FROM students WHERE id = ?', [data.student_id]);
      if (studentResult.length > 0) {
        data.student_nisn = studentResult[0].nisn;
      }
    }
    
    const allowedFields = ['student_id', 'student_nisn', 'jenis_pembayaran', 'nominal', 'tanggal_pembayaran', 'status', 'keterangan', 'catatan', 'petugas'];
    
    allowedFields.forEach(field => {
      if (data.hasOwnProperty(field) && data[field] !== undefined) {
        validFields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });
    
    if (validFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const sql = `UPDATE payments SET ${validFields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    await db.execute(sql, [...values, req.params.id]);
    res.json({ message: 'Pembayaran diperbarui' });
  } catch (err) {
    console.error('Update payment error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM payments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Pembayaran dihapus' });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

module.exports = router;
