const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    console.log('Reading initialization SQL file...');
    const sql = fs.readFileSync(
      path.join(__dirname, 'init.sql'),
      'utf8'
    );

    console.log('Starting transaction...');
    await connection.beginTransaction();

    // First, check existing columns
    const [columns] = await connection.query('DESCRIBE users');
    const existingColumns = columns.map(col => col.Field);
    console.log('Existing columns:', existingColumns);

    // Split the SQL file into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        // Handle ALTER TABLE users statement for adding columns
        if (statement.includes('ALTER TABLE users')) {
          // Extract each ADD COLUMN line
          const addColumnLines = statement.split('\n').filter(line => line.trim().startsWith('ADD COLUMN'));
          for (const line of addColumnLines) {
            const match = line.match(/ADD COLUMN (\w+) (.+)/);
            if (match) {
              const colName = match[1];
              const colDef = match[2].replace(/,$/, '');
              if (!existingColumns.includes(colName)) {
                const alterStatement = `ALTER TABLE users ADD COLUMN ${colName} ${colDef}`;
                console.log('Executing:', alterStatement);
                await connection.query(alterStatement);
              } else {
                console.log(`Column ${colName} already exists, skipping.`);
              }
            }
          }
        } else {
          console.log('Executing:', statement.trim().split('\n')[0]);
          await connection.query(statement);
        }
      }
    }

    await connection.commit();
    console.log('Database initialized successfully');
  } catch (error) {
    if (connection) {
      console.log('Rolling back transaction...');
      await connection.rollback();
    }
    console.error('Error initializing database:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit();
  }
}

initializeDatabase(); 