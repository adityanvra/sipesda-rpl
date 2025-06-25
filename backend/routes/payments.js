const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const studentId = req.query.student_id;
    let sql = 'SELECT * FROM payments';
    let params = [];
    
    if (studentId) {
      sql += ' WHERE student_id = ?';
      params.push(studentId);
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
    const { studentId, month, year } = req.query;

    const query = `
      SELECT * FROM payments 
      WHERE student_id = ? 
        AND MONTH(tanggal_pembayaran) = ? 
        AND YEAR(tanggal_pembayaran) = ?
        AND jenis_pembayaran LIKE '%SPP%'
    `;

    const [results] = await db.execute(query, [studentId, month, year]);
    res.json(results);
  } catch (err) {
    console.error('Get payments by month error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});


router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const sql = `INSERT INTO payments (student_id, jenis_pembayaran, nominal, tanggal_pembayaran, status, keterangan, catatan, petugas, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    const values = [data.student_id, data.jenis_pembayaran, data.nominal, data.tanggal_pembayaran, data.status, data.keterangan, data.catatan, data.petugas];
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
    const sql = 'UPDATE payments SET ?, updated_at = NOW() WHERE id = ?';
    await db.execute(sql, [data, req.params.id]);
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
