const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function createAdminUser() {
  try {
    // First, delete any existing admin user
    await pool.query('DELETE FROM users WHERE username = ?', ['admin']);
    console.log('Deleted existing admin user if any');

    const adminUser = {
      full_name: 'Admin User',
      username: 'admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    };

    // Insert new admin user
    const [result] = await pool.query(
      'INSERT INTO users (full_name, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [adminUser.full_name, adminUser.username, adminUser.email, adminUser.password, adminUser.role]
    );

    console.log('Admin user created successfully with password: admin123');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

createAdminUser(); 