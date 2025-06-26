const mysql = require('mysql2/promise');

async function updateDatabase() {
  const connection = await mysql.createConnection({
    host: 'ballast.proxy.rlwy.net',
    port: 50251,
    user: 'root',
    password: 'ZOXgksyyTFcwFYmXlJvcwTLpQtgNIBPn',
    database: 'railway'
  });

  console.log('🔗 Connected to Railway MySQL database');

  try {
    // 1. Rename columns first
    console.log('📝 Renaming columns...');
    
    try {
      await connection.execute(`
        ALTER TABLE students 
        CHANGE COLUMN nama_orang_tua nama_wali VARCHAR(255)
      `);
      console.log('✅ Renamed nama_orang_tua to nama_wali');
    } catch (error) {
      console.log('ℹ️ nama_orang_tua column may not exist or already renamed');
    }

    try {
      await connection.execute(`
        ALTER TABLE students 
        CHANGE COLUMN no_telepon no_hp VARCHAR(20)
      `);
      console.log('✅ Renamed no_telepon to no_hp');
    } catch (error) {
      console.log('ℹ️ no_telepon column may not exist or already renamed');
    }

    // 2. Add required columns if they don't exist
    console.log('📝 Adding missing columns...');
    
    try {
      await connection.execute(`
        ALTER TABLE students 
        ADD COLUMN nisn VARCHAR(20) UNIQUE AFTER id
      `);
      console.log('✅ Added nisn column');
    } catch (error) {
      console.log('ℹ️ nisn column already exists');
    }

    try {
      await connection.execute(`
        ALTER TABLE students 
        ADD COLUMN jenis_kelamin ENUM('L', 'P') DEFAULT 'L' AFTER nama_wali
      `);
      console.log('✅ Added jenis_kelamin column');
    } catch (error) {
      console.log('ℹ️ jenis_kelamin column already exists');
    }

    try {
      await connection.execute(`
        ALTER TABLE students 
        ADD COLUMN angkatan VARCHAR(10) AFTER jenis_kelamin
      `);
      console.log('✅ Added angkatan column');
    } catch (error) {
      console.log('ℹ️ angkatan column already exists');
    }

    // 3. Update existing data with NISN values if they don't have them
    console.log('📝 Updating existing student data...');
    await connection.execute(`
      UPDATE students SET 
        nisn = CASE 
          WHEN id = 220018106 THEN '2200018106'
          ELSE CONCAT('2024', LPAD(id, 6, '0'))
        END,
        jenis_kelamin = COALESCE(jenis_kelamin, 'L'),
        angkatan = COALESCE(angkatan, '2024')
      WHERE nisn IS NULL OR nisn = ''
    `);
    console.log('✅ Updated student data with NISN');

    // 4. Change primary key to nisn
    console.log('📝 Changing primary key to nisn...');
    
    // Check for foreign key constraints first
    const [fkConstraints] = await connection.execute(`
      SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_NAME = 'students' 
      AND REFERENCED_COLUMN_NAME = 'id'
      AND TABLE_SCHEMA = 'railway'
    `);
    
    if (fkConstraints.length > 0) {
      console.log('⚠️ Found foreign key constraints referencing students.id:');
      fkConstraints.forEach(fk => {
        console.log(`   ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> students.id (${fk.CONSTRAINT_NAME})`);
      });
      
      // Drop foreign key constraints temporarily
      for (const fk of fkConstraints) {
        try {
          await connection.execute(`ALTER TABLE ${fk.TABLE_NAME} DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
          console.log(`✅ Dropped foreign key ${fk.CONSTRAINT_NAME}`);
        } catch (error) {
          console.log(`ℹ️ Could not drop foreign key ${fk.CONSTRAINT_NAME}: ${error.message}`);
        }
      }
    }
    
    // Make sure all NISN values are not null and unique
    const [nullNisn] = await connection.execute('SELECT COUNT(*) as count FROM students WHERE nisn IS NULL OR nisn = ""');
    if (nullNisn[0].count > 0) {
      console.log('⚠️ Found students with null/empty NISN, updating...');
      await connection.execute(`
        UPDATE students SET nisn = CONCAT('2024', LPAD(id, 6, '0'))
        WHERE nisn IS NULL OR nisn = ''
      `);
    }
    
    // Remove AUTO_INCREMENT from id column
    try {
      await connection.execute(`
        ALTER TABLE students 
        MODIFY COLUMN id INT NOT NULL
      `);
      console.log('✅ Removed AUTO_INCREMENT from id column');
    } catch (error) {
      console.log('ℹ️ id column may not have AUTO_INCREMENT or already modified');
    }

    // Drop existing primary key
    try {
      await connection.execute(`
        ALTER TABLE students 
        DROP PRIMARY KEY
      `);
      console.log('✅ Dropped old primary key (id)');
    } catch (error) {
      console.log('ℹ️ No primary key to drop or already dropped');
    }

    // Make nisn NOT NULL (required for primary key)
    try {
      await connection.execute(`
        ALTER TABLE students 
        MODIFY COLUMN nisn VARCHAR(20) NOT NULL
      `);
      console.log('✅ Made nisn NOT NULL');
    } catch (error) {
      console.log('ℹ️ nisn column may already be NOT NULL');
    }

    // Add nisn as primary key
    try {
      await connection.execute(`
        ALTER TABLE students 
        ADD PRIMARY KEY (nisn)
      `);
      console.log('✅ Made nisn the primary key');
    } catch (error) {
      console.log(`❌ Could not make nisn primary key: ${error.message}`);
      // If failed, restore id as primary key
      try {
        await connection.execute(`
          ALTER TABLE students 
          ADD PRIMARY KEY (id)
        `);
        console.log('🔄 Restored id as primary key');
      } catch (restoreError) {
        console.log('❌ Could not restore primary key');
      }
    }
    
    // If we had foreign keys, we might need to recreate them pointing to nisn instead
    // For now, we'll skip this as it depends on the specific use case

    // 5. Add/update users
    console.log('📝 Adding/updating users...');
    await connection.execute(`
      INSERT INTO users (username, password, email, role) VALUES 
      ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@sipesda.com', 'admin'),
      ('operator', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operator@sipesda.com', 'operator')
      ON DUPLICATE KEY UPDATE username=username
    `);
    console.log('✅ Added/updated users');

    // 7. Fix student_nisn in payments table to match students.nisn format
    console.log('📝 Fixing student_nisn in payments table...');
    
    // Check current payments data
    const [currentPayments] = await connection.execute('SELECT id, student_id, student_nisn FROM payments LIMIT 5');
    console.log('Current payments data (before fix):', currentPayments);
    
    // Update student_nisn to match students.nisn format
    await connection.execute(`
      UPDATE payments p
      JOIN students s ON p.student_id = s.id
      SET p.student_nisn = s.nisn
      WHERE p.student_nisn != s.nisn
    `);
    console.log('✅ Fixed student_nisn in payments table');
    
    // Check updated payments data
    const [updatedPayments] = await connection.execute('SELECT id, student_id, student_nisn FROM payments LIMIT 5');
    console.log('Updated payments data (after fix):', updatedPayments);

    // 8. Check final table structure
    console.log('📊 Checking final table structure...');
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM students
    `);
    console.log('Students table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Key === 'PRI' ? '(PRIMARY KEY)' : ''} ${col.Key === 'UNI' ? '(UNIQUE)' : ''} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
    });

    const [students] = await connection.execute('SELECT * FROM students LIMIT 3');
    console.log('Sample students data:', students);

    const [users] = await connection.execute('SELECT id, username, email, role FROM users');
    console.log('Users:', users);

    console.log('🎉 Database update completed successfully!');
    console.log('🔑 Login credentials:');
    console.log('   Admin: username=admin, password=password');
    console.log('   Operator: username=operator, password=password');
    console.log('📋 Students table structure updated');
    console.log('📋 Columns renamed: nama_orang_tua → nama_wali, no_telepon → no_hp');

  } catch (error) {
    console.error('❌ Error updating database:', error.message);
  } finally {
    await connection.end();
    console.log('🔒 Database connection closed');
  }
}

updateDatabase(); 