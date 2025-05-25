const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { auth } = require('../middleware/auth');

// Get all tasks
router.get('/', auth, taskController.getTasks);

// Create new task
router.post('/', auth, taskController.createTask);

// Update task status
router.put('/:id/status', auth, taskController.updateTaskStatus);

module.exports = router; 