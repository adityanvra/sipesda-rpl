const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const studentId = req.query.student_id;
  let sql = 'SELECT * FROM payments';
  if (studentId) {
    sql += ' WHERE student_id = ' + db.escape(studentId);
  }
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

router.get('/by-month', (req, res) => {
  const { studentId, month, year } = req.query;

  const query = `
    SELECT * FROM payments 
    WHERE student_id = ? 
      AND MONTH(tanggal_pembayaran) = ? 
      AND YEAR(tanggal_pembayaran) = ?
      AND jenis_pembayaran LIKE '%SPP%'
  `;

  db.query(query, [studentId, month, year], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});


router.post('/', (req, res) => {
  const data = req.body;
  const sql = `INSERT INTO payments (student_id, jenis_pembayaran, nominal, tanggal_pembayaran, status, keterangan, catatan, petugas, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  const values = [data.student_id, data.jenis_pembayaran, data.nominal, data.tanggal_pembayaran, data.status, data.keterangan, data.catatan, data.petugas];
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Pembayaran ditambahkan', id: result.insertId });
  });
});

router.put('/:id', (req, res) => {
  const data = req.body;
  const sql = 'UPDATE payments SET ?, updated_at = NOW() WHERE id = ?';
  db.query(sql, [data, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Pembayaran diperbarui' });
  });
});

router.delete('/:id', (req, res) => {
  db.query('DELETE FROM payments WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Pembayaran dihapus' });
  });
});

module.exports = router;
