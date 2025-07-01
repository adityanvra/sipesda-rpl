const mysql = require('mysql2/promise');

async function checkUsersInDB() {
  console.log('🔍 Checking Users in Railway Database\n');
  
  const dbConfig = {
    host: 'switchyard.proxy.rlwy.net',
    port: 24431,
    user: 'root',
    password: 'IvKYHCaiEJRWuzYYKbnlHUmzeBWQhFSN',
    database: 'railway',
    ssl: { rejectUnauthorized: false }
  };

  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to Railway database');
    
    // Check users table
    console.log('\n📋 Checking users table...');
    const [users] = await connection.execute('SELECT id, username, email, role FROM users');
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('🔧 Need to insert admin user...');
      
      // Insert admin user with bcrypt hash
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password', 10);
      
      await connection.execute(`
        INSERT INTO users (username, email, password, role) VALUES 
        ('admin', 'admin@sipesda.com', ?, 'admin')
        ON DUPLICATE KEY UPDATE username=username
      `, [hashedPassword]);
      
      console.log('✅ Admin user inserted with bcrypt hash');
      
      // Check again
      const [newUsers] = await connection.execute('SELECT id, username, email, role FROM users');
      console.log('👥 Users after insertion:');
      newUsers.forEach(user => {
        console.log(`   - ${user.username} (${user.role}) - ID: ${user.id}`);
      });
      
    } else {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`   - ${user.username} (${user.role}) - ID: ${user.id}`);
      });
      
      // Check password hash for admin
      const [adminUser] = await connection.execute('SELECT password FROM users WHERE username = ?', ['admin']);
      if (adminUser.length > 0) {
        console.log('\n🔑 Admin password hash:', adminUser[0].password.substring(0, 20) + '...');
        
        // Test bcrypt comparison
        const bcrypt = require('bcryptjs');
        const isValid = await bcrypt.compare('password', adminUser[0].password);
        console.log('🔐 Password "password" matches hash:', isValid);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔒 Connection closed');
    }
  }
}

checkUsersInDB(); 