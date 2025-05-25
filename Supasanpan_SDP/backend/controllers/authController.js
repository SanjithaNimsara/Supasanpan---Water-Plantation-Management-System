const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);

    // Get user from database
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    console.log('Found users:', users);

    if (users.length === 0) {
      console.log('No user found with username:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    console.log('User found:', { id: user.id, username: user.username, role: user.role });

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password validation failed');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: 86400 }
    );

    console.log('Token generated successfully');

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const register = async (req, res) => {
  try {
    const { full_name, username, email, password, confirm_password } = req.body;
    console.log('Registration attempt:', { full_name, username, email });

    // Validate password match
    if (password !== confirm_password) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if username or email already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      console.log('User already exists:', existingUsers[0]);
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Insert new user
    try {
      const [result] = await pool.query(
        'INSERT INTO users (full_name, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [full_name, username, email, hashedPassword, 'employee']
      );
      console.log('User inserted successfully, ID:', result.insertId);

      // Generate JWT token
      const token = jwt.sign(
        { id: result.insertId, username, role: 'employee' },
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: 86400 }
      );
      console.log('Token generated successfully');

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: result.insertId,
          full_name,
          username,
          email,
          role: 'employee'
        }
      });
    } catch (dbError) {
      console.error('Database error during registration:', dbError);
      console.error('Error code:', dbError.code);
      console.error('Error message:', dbError.message);
      console.error('Error sql:', dbError.sql);
      console.error('Error sqlState:', dbError.sqlState);
      console.error('Error sqlMessage:', dbError.sqlMessage);
      
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Username or email already exists' });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Registration error details:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      code: error.code,
      sqlState: error.sqlState
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Verify token and get user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = users[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token using user.id
    await pool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
  register,
  resetPassword
}; 