const pool = require('../config/database');

const getTasks = async (req, res) => {
  try {
    const [tasks] = await pool.query(
      `SELECT t.*, u1.full_name as assigned_to_name, u2.full_name as created_by_name 
       FROM tasks t 
       LEFT JOIN users u1 ON t.assigned_to = u1.id 
       JOIN users u2 ON t.created_by = u2.id 
       ORDER BY t.created_at DESC`
    );

    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, assigned_to } = req.body;
    const created_by = req.user.id;

    const [result] = await pool.query(
      `INSERT INTO tasks 
       (title, description, assigned_to, created_by) 
       VALUES (?, ?, ?, ?)`,
      [title, description, assigned_to, created_by]
    );

    res.status(201).json({
      message: 'Task created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if task exists
    const [tasks] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update task status
    await pool.query(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ message: 'Task status updated successfully' });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTaskStatus
}; 