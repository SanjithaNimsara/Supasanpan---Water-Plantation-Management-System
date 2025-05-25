import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid,
    Card,
    CardContent,
    Tooltip,
    LinearProgress,
    Avatar,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Edit as EditIcon,
    Visibility as ViewIcon,
    Assignment as AssignmentIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Schedule as ScheduleIcon,
    Flag as FlagIcon,
    Category as CategoryIcon,
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

const Tasks = () => {
    console.log('Tasks component rendered');
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('view');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        due_date: '',
        assigned_to: '',
        progress: 0,
        status: 'pending'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchTasks = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found');
                return;
            }

            const response = await fetch('http://localhost:5000/api/tasks', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }

            const data = await response.json();
            setTasks(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleOpenDialog = (task, type) => {
        setSelectedTask(task);
        setDialogMode(type);
        if (type === 'edit') {
            setFormData({
                title: task.title,
                description: task.description || '',
                category: task.category || '',
                priority: task.priority,
                due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
                assigned_to: task.assigned_to || '',
                progress: task.progress,
                status: task.status
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedTask(null);
        setFormData({
            title: '',
            description: '',
            category: '',
            priority: 'medium',
            due_date: '',
            assigned_to: '',
            progress: 0,
            status: 'pending'
        });
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdateTask = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            await axios.put(
                `http://localhost:5000/api/tasks/${selectedTask.id}`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchTasks();
            handleCloseDialog();
            setError(null);
        } catch (error) {
            console.error('Error updating task:', error);
            setError(error.response?.data?.message || 'Failed to update task. Please try again.');
        }
    };

    const handleCreateTask = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            await axios.post(
                'http://localhost:5000/api/tasks',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchTasks();
            handleCloseDialog();
            setError(null);
        } catch (error) {
            console.error('Error creating task:', error);
            setError(error.response?.data?.message || 'Failed to create task. Please try again.');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }
                await axios.delete(
                    `http://localhost:5000/api/tasks/${taskId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                await fetchTasks();
                setError(null);
            } catch (error) {
                console.error('Error deleting task:', error);
                setError(error.response?.data?.message || 'Failed to delete task. Please try again.');
            }
        }
    };

    const handleOpenCreateDialog = () => {
        setDialogMode('create');
        setFormData({
            title: '',
            description: '',
            category: '',
            priority: 'medium',
            due_date: '',
            assigned_to: '',
            progress: 0,
            status: 'pending'
        });
        setOpenDialog(true);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'in_progress':
                return 'warning';
            case 'pending':
                return 'error';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <div>Tasks component is rendering (debug)</div>
        );
    }

    return (
        <Box sx={{ 
            p: 3,
            background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(41, 128, 185, 0.1) 100%)',
            minHeight: '100vh'
        }}>
            {/* Error Snackbar */}
            <Snackbar 
                open={!!error} 
                autoHideDuration={6000} 
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            {/* Header Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{
                        bgcolor: 'primary.main',
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1,
                        mr: 2
                    }}>
                        <AssignmentIcon sx={{ color: 'white' }} fontSize="medium" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Task Management
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateDialog}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3
                    }}
                >
                    Create Task
                </Button>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ 
                        height: '100%',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-5px)' },
                        background: 'white',
                        boxShadow: 3
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ 
                                    bgcolor: 'primary.main',
                                    width: 56,
                                    height: 56,
                                    mr: 2
                                }}>
                                    <AssignmentIcon sx={{ fontSize: 32 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        Total Tasks
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                        {tasks.length}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ 
                        height: '100%',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-5px)' },
                        background: 'white',
                        boxShadow: 3
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ 
                                    bgcolor: 'success.main',
                                    width: 56,
                                    height: 56,
                                    mr: 2
                                }}>
                                    <CheckCircleIcon sx={{ fontSize: 32 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        Completed Tasks
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                                        {tasks.filter(task => task.status === 'completed').length}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ 
                        height: '100%',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-5px)' },
                        background: 'white',
                        boxShadow: 3
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ 
                                    bgcolor: 'warning.main',
                                    width: 56,
                                    height: 56,
                                    mr: 2
                                }}>
                                    <ScheduleIcon sx={{ fontSize: 32 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        Pending Tasks
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                        {tasks.filter(task => task.status === 'pending').length}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tasks Table */}
            <TableContainer
                component={Paper}
                sx={{
                    boxShadow: 3,
                    background: 'white !important',
                    minHeight: 300,
                    borderRadius: 2,
                    overflow: 'hidden',
                    '& .MuiTable-root, & .MuiTableHead-root, & .MuiTableBody-root, & .MuiTableCell-root': {
                        background: 'white !important'
                    }
                }}
            >
                <Table>
                    <TableHead>
                        <TableRow sx={{ 
                            background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(41, 128, 185, 0.1) 100%)',
                            '& th': {
                                fontWeight: 600,
                                color: 'text.primary',
                                borderBottom: '2px solid rgba(52, 152, 219, 0.2)',
                                padding: '16px'
                            }
                        }}>
                            <TableCell>Title</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Priority</TableCell>
                            <TableCell>Due Date</TableCell>
                            <TableCell>Assigned To</TableCell>
                            <TableCell>Progress</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography variant="h6" color="text.secondary">
                                        No tasks found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            tasks.map((task, idx) => (
                                <TableRow 
                                    key={task.id || idx}
                                    onClick={() => handleOpenDialog(task, 'view')}
                                    sx={{ 
                                        '&:hover': { 
                                            background: 'rgba(52, 152, 219, 0.05)',
                                            cursor: 'pointer'
                                        },
                                        '& td': {
                                            borderBottom: '1px solid rgba(52, 152, 219, 0.1)',
                                            padding: '16px'
                                        }
                                    }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AssignmentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            {task.title}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CategoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            {task.category || '-'}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={<FlagIcon />}
                                            label={task.priority}
                                            color={getPriorityColor(task.priority)}
                                            size="small"
                                            sx={{ fontWeight: 500 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{task.assigned_to || '-'}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={task.progress} 
                                                sx={{ 
                                                    width: '100%',
                                                    height: 8,
                                                    borderRadius: 4,
                                                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: 'primary.main'
                                                    }
                                                }}
                                            />
                                            <Typography variant="body2" color="text.secondary">
                                                {task.progress}%
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={task.status === 'completed' ? <CheckCircleIcon /> : <CancelIcon />}
                                            label={task.status}
                                            color={getStatusColor(task.status)}
                                            size="small"
                                            sx={{ fontWeight: 500 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenDialog(task, 'view');
                                                    }}
                                                    color="primary"
                                                    size="small"
                                                >
                                                    <ViewIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit Task">
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenDialog(task, 'edit');
                                                    }}
                                                    color="secondary"
                                                    size="small"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Task">
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTask(task.id);
                                                    }}
                                                    color="error"
                                                    size="small"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Task Details/Edit Dialog */}
            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog} 
                maxWidth="md" 
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: 3
                    }
                }}
            >
                <DialogTitle sx={{ 
                    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.95) 0%, rgba(41, 128, 185, 0.95) 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    {dialogMode === 'view' ? (
                        <>
                            <AssignmentIcon />
                            Task Details
                        </>
                    ) : dialogMode === 'edit' ? (
                        <>
                            <EditIcon />
                            Edit Task
                        </>
                    ) : (
                        <>
                            <AddIcon />
                            Create Task
                        </>
                    )}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {dialogMode === 'view' ? (
                        <Box>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                        <Avatar 
                                            sx={{ 
                                                width: 64, 
                                                height: 64,
                                                bgcolor: 'primary.main',
                                                fontSize: 24
                                            }}
                                        >
                                            <AssignmentIcon sx={{ fontSize: 32 }} />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                                {selectedTask?.title}
                                            </Typography>
                                            <Typography variant="subtitle1" color="text.secondary">
                                                {selectedTask?.category || 'No Category'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                        Description
                                    </Typography>
                                    <Typography variant="body1" paragraph>
                                        {selectedTask?.description || 'No description provided'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                        Priority
                                    </Typography>
                                    <Chip
                                        icon={<FlagIcon />}
                                        label={selectedTask?.priority}
                                        color={getPriorityColor(selectedTask?.priority)}
                                        size="small"
                                        sx={{ fontWeight: 500 }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                        Status
                                    </Typography>
                                    <Chip
                                        icon={selectedTask?.status === 'completed' ? <CheckCircleIcon /> : <CancelIcon />}
                                        label={selectedTask?.status}
                                        color={getStatusColor(selectedTask?.status)}
                                        size="small"
                                        sx={{ fontWeight: 500 }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                        Due Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedTask?.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'No due date'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                        Assigned To
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedTask?.assigned_to || 'Unassigned'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                        Progress
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={selectedTask?.progress} 
                                            sx={{ 
                                                width: '100%',
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: 'primary.main'
                                                }
                                            }}
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedTask?.progress}%
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        error={!formData.title}
                                        helperText={!formData.title ? 'Title is required' : ''}
                                        InputProps={{
                                            startAdornment: <AssignmentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        InputProps={{
                                            startAdornment: <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Priority"
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleInputChange}
                                        required
                                        InputProps={{
                                            startAdornment: <FlagIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    >
                                        <MenuItem value="low">Low</MenuItem>
                                        <MenuItem value="medium">Medium</MenuItem>
                                        <MenuItem value="high">High</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Due Date"
                                        name="due_date"
                                        value={formData.due_date}
                                        onChange={handleInputChange}
                                        InputProps={{
                                            startAdornment: <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                        InputLabelProps={{
                                            shrink: true
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Assigned To"
                                        name="assigned_to"
                                        value={formData.assigned_to}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Progress"
                                        name="progress"
                                        value={formData.progress}
                                        onChange={handleInputChange}
                                        InputProps={{
                                            inputProps: { min: 0, max: 100 }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="in_progress">In Progress</MenuItem>
                                        <MenuItem value="completed">Completed</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button 
                        onClick={handleCloseDialog}
                        variant="outlined"
                        sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 3
                        }}
                    >
                        Close
                    </Button>
                    {dialogMode === 'edit' && (
                        <Button 
                            onClick={handleUpdateTask} 
                            variant="contained" 
                            color="primary"
                            disabled={!formData.title}
                            sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 3
                            }}
                        >
                            Update
                        </Button>
                    )}
                    {dialogMode === 'create' && (
                        <Button 
                            onClick={handleCreateTask} 
                            variant="contained" 
                            color="primary"
                            disabled={!formData.title}
                            sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 3
                            }}
                        >
                            Create
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Tasks; 