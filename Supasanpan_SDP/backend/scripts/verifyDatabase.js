const pool = require('../config/database');

async function verifyDatabase() {
  const connection = await pool.getConnection();
  try {
    // Check if database exists
    const [databases] = await connection.query('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === 'water_plantation');
    console.log('Database exists:', dbExists);

    if (dbExists) {
      // Check if users table exists and has correct structure
      await connection.query('USE water_plantation');
      const [tables] = await connection.query('SHOW TABLES');
      const usersTableExists = tables.some(table => table.Tables_in_water_plantation === 'users');
      console.log('Users table exists:', usersTableExists);

      if (usersTableExists) {
        // Check table structure
        const [columns] = await connection.query('DESCRIBE users');
        console.log('Users table columns:', columns.map(col => col.Field));
      }
    }
  } catch (error) {
    console.error('Error verifying database:', error);
  } finally {
    connection.release();
    process.exit();
  }
}

verifyDatabase(); 