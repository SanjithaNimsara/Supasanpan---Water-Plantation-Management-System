import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const EmployeeTasks = () => {
  const [tasks, setTasks] = useState([
    { id: 1, description: 'Check water quality', completed: false },
    { id: 2, description: 'Clean water tanks', completed: true },
    { id: 3, description: 'Restock bottles', completed: false },
  ]);
  const [newTask, setNewTask] = useState('');

  const handleAddTask = () => {
    if (newTask.trim()) {
      setTasks([
        ...tasks,
        {
          id: tasks.length + 1,
          description: newTask.trim(),
          completed: false,
        },
      ]);
      setNewTask('');
    }
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const handleToggleComplete = (taskId) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Employee Tasks
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="New Task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTask}
              fullWidth
            >
              Add Task
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <List>
          {tasks.map((task) => (
            <ListItem
              key={task.id}
              sx={{
                bgcolor: task.completed ? 'action.hover' : 'background.paper',
              }}
            >
              <ListItemText
                primary={task.description}
                sx={{
                  textDecoration: task.completed ? 'line-through' : 'none',
                }}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleToggleComplete(task.id)}
                  color={task.completed ? 'success' : 'default'}
                >
                  <CheckCircleIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteTask(task.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default EmployeeTasks; 