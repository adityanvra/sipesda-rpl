const mysql = require('mysql2/promise');

// Database configuration with Railway MySQL support
const dbConfig = {
  host: process.env.MYSQLHOST || 'switchyard.proxy.rlwy.net',
  port: process.env.MYSQLPORT || 24431,
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'IvKYHCaiEJRWuzYYKbnlHUmzeBWQhFSN',
  database: process.env.MYSQLDATABASE || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create connection pool for serverless functions
const pool = mysql.createPool(dbConfig);

console.log('🔗 Database configuration initialized:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: !!dbConfig.ssl
});

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ Tersambung ke MySQL (${process.env.MYSQLDATABASE || 'railway'})`);
    connection.release();
  } catch (err) {
    console.error('❌ Koneksi ke database gagal:', err.message);
  }
}

// Test connection on startup
if (process.env.NODE_ENV !== 'production') {
  testConnection();
}

module.exports = pool;
