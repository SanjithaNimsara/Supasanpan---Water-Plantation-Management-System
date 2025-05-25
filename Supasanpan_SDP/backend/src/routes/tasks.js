const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { auth } = require('../../middleware/auth');

// Get all tasks
router.get('/', auth, async (req, res) => {
    try {
        const [tasks] = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});

// Get task by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const [task] = await db.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
        if (task.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(task[0]);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ message: 'Error fetching task' });
    }
});

// Create new task
router.post('/', auth, async (req, res) => {
    const { title, description, category, priority, due_date, assigned_to, progress, status } = req.body;
    // Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: 'Title is required and must be a non-empty string.' });
    }
    const validPriorities = ['low', 'medium', 'high'];
    if (!priority || !validPriorities.includes(priority)) {
        return res.status(400).json({ message: 'Priority is required and must be one of: low, medium, high.' });
    }
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Status is required and must be one of: pending, in_progress, completed.' });
    }
    // Optional: Validate due_date format if provided
    if (due_date && isNaN(Date.parse(due_date))) {
        return res.status(400).json({ message: 'Due date must be a valid date string.' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO tasks (title, description, category, priority, due_date, assigned_to, progress, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, category, priority, due_date, assigned_to, progress, status]
        );
        res.status(201).json({ id: result.insertId, message: 'Task created successfully' });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: error.message || 'Error creating task' });
    }
});

// Update task
router.put('/:id', auth, async (req, res) => {
    const { title, description, category, priority, due_date, assigned_to, progress, status } = req.body;
    try {
        await db.query(
            'UPDATE tasks SET title = ?, description = ?, category = ?, priority = ?, due_date = ?, assigned_to = ?, progress = ?, status = ? WHERE id = ?',
            [title, description, category, priority, due_date, assigned_to, progress, status, req.params.id]
        );
        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Error updating task' });
    }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
    try {
        await db.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Error deleting task' });
    }
});

module.exports = router; 