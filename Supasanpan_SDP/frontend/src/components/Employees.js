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
    Avatar,
    Divider
} from '@mui/material';
import {
    Edit as EditIcon,
    Visibility as ViewIcon,
    Person as PersonIcon,
    Work as WorkIcon,
    Group as GroupIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
    Business as BusinessIcon,
    Assignment as AssignmentIcon,
    AccessTime as AccessTimeIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogType, setDialogType] = useState('view'); // 'view' or 'edit'
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        emergency_contact: '',
        position: '',
        department: '',
        status: 'active',
        role: ''
    });

    const fetchEmployees = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/employees', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Ensure we're setting a unique list of employees
            const uniqueEmployees = response.data.filter((emp, index, self) =>
                index === self.findIndex((e) => e.id === emp.id)
            );
            setEmployees(uniqueEmployees);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    }, []);

    const fetchRoles = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/employees/roles/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Ensure we're setting unique roles
            const uniqueRoles = response.data.filter((role, index, self) =>
                index === self.findIndex((r) => r.name === role.name)
            );
            setRoles(uniqueRoles);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
        fetchRoles();
    }, [fetchEmployees, fetchRoles]);

    const handleOpenDialog = (employee, type) => {
        setSelectedEmployee(employee);
        setDialogType(type);
        if (type === 'edit') {
            setFormData({
                full_name: employee.full_name,
                email: employee.email,
                phone: employee.phone || '',
                address: employee.address || '',
                emergency_contact: employee.emergency_contact || '',
                position: employee.position || '',
                department: employee.department || '',
                status: employee.status,
                role: employee.role
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedEmployee(null);
        setFormData({
            full_name: '',
            email: '',
            phone: '',
            address: '',
            emergency_contact: '',
            position: '',
            department: '',
            status: 'active',
            role: ''
        });
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdateEmployee = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/employees/${selectedEmployee.id}`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Fetch fresh data after update
            await fetchEmployees();
            handleCloseDialog();
        } catch (error) {
            console.error('Error updating employee:', error);
        }
    };

    const handleDeleteEmployee = async (employeeId) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                console.log('Attempting to delete employee:', employeeId);
                
                // Ensure employeeId is a number
                const id = parseInt(employeeId, 10);
                if (isNaN(id)) {
                    throw new Error('Invalid employee ID');
                }

                const config = {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                };

                console.log('Making DELETE request to:', `http://localhost:5000/api/employees/${id}`);
                console.log('With config:', config);
                
                const response = await axios.delete(`http://localhost:5000/api/employees/${id}`, config);
                
                console.log('Delete response:', response.data);
                
                if (response.data.message === 'Employee deleted successfully') {
                    // Refresh the employee list after deletion
                    await fetchEmployees();
                    alert('Employee deleted successfully');
                } else {
                    throw new Error('Unexpected response from server');
                }
            } catch (error) {
                console.error('Error deleting employee:', error);
                console.error('Error response:', error.response?.data);
                console.error('Error status:', error.response?.status);
                console.error('Error headers:', error.response?.headers);
                
                let errorMessage = 'Failed to delete employee. ';
                if (error.response?.data?.message) {
                    errorMessage += error.response.data.message;
                } else if (error.message) {
                    errorMessage += error.message;
                } else {
                    errorMessage += 'Please try again.';
                }
                
                alert(errorMessage);
            }
        }
    };

    const getStatusColor = (status) => {
        return status === 'active' ? 'success' : 'error';
    };

    return (
        <Box sx={{ 
            p: 3,
            background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(41, 128, 185, 0.1) 100%)',
            minHeight: '100vh'
        }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
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
                    <GroupIcon sx={{ color: 'white' }} fontSize="medium" />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Employee Management
                </Typography>
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
                                    <PersonIcon sx={{ fontSize: 32 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        Total Employees
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                        {employees.length}
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
                        '&:hover': { transform: 'translateY(-5px)' }
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ 
                                    bgcolor: 'success.main',
                                    width: 56,
                                    height: 56,
                                    mr: 2
                                }}>
                                    <WorkIcon sx={{ fontSize: 32 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        Active Employees
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                                        {employees.filter(emp => emp.status === 'active').length}
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
                        '&:hover': { transform: 'translateY(-5px)' }
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ 
                                    bgcolor: 'info.main',
                                    width: 56,
                                    height: 56,
                                    mr: 2
                                }}>
                                    <GroupIcon sx={{ fontSize: 32 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        Roles
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                                        {roles.length}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Employee Table */}
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
                                padding: '16px',
                                '&:first-of-type': {
                                    borderTopLeftRadius: '8px'
                                },
                                '&:last-child': {
                                    borderTopRightRadius: '8px'
                                }
                            }
                        }}>
                            <TableCell>Name</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Position</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {employees.map((employee) => (
                            <TableRow 
                                key={employee.id}
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
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                            {employee.full_name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        {employee.full_name}
                                    </Box>
                                </TableCell>
                                <TableCell>{employee.username}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        {employee.email}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={employee.role_name}
                                        size="small"
                                        sx={{ 
                                            background: 'rgba(52, 152, 219, 0.1)',
                                            color: 'primary.main',
                                            fontWeight: 500
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        icon={employee.status === 'active' ? <CheckCircleIcon /> : <CancelIcon />}
                                        label={employee.status}
                                        color={getStatusColor(employee.status)}
                                        size="small"
                                        sx={{ fontWeight: 500 }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AssignmentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        {employee.position || '-'}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        {employee.department || '-'}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title="View Details">
                                            <IconButton
                                                onClick={() => handleOpenDialog(employee, 'view')}
                                                color="primary"
                                                size="small"
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit Employee">
                                            <IconButton
                                                onClick={() => handleOpenDialog(employee, 'edit')}
                                                color="secondary"
                                                size="small"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete Employee">
                                            <IconButton
                                                onClick={() => handleDeleteEmployee(employee.id)}
                                                color="error"
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Employee Details/Edit Dialog */}
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
                    {dialogType === 'view' ? (
                        <>
                            <PersonIcon />
                            Employee Details
                        </>
                    ) : (
                        <>
                            <EditIcon />
                            Edit Employee
                        </>
                    )}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {dialogType === 'view' ? (
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
                                            {selectedEmployee?.full_name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                                {selectedEmployee?.full_name}
                                            </Typography>
                                            <Typography variant="subtitle1" color="text.secondary">
                                                {selectedEmployee?.role_name}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <EmailIcon color="primary" />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Email</Typography>
                                    </Box>
                                    <Typography variant="body1">{selectedEmployee?.email}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <PhoneIcon color="primary" />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Phone</Typography>
                                    </Box>
                                    <Typography variant="body1">{selectedEmployee?.phone || '-'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <LocationIcon color="primary" />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Address</Typography>
                                    </Box>
                                    <Typography variant="body1">{selectedEmployee?.address || '-'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <AssignmentIcon color="primary" />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Position</Typography>
                                    </Box>
                                    <Typography variant="body1">{selectedEmployee?.position || '-'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <BusinessIcon color="primary" />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Department</Typography>
                                    </Box>
                                    <Typography variant="body1">{selectedEmployee?.department || '-'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <AccessTimeIcon color="primary" />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Status</Typography>
                                    </Box>
                                    <Chip
                                        icon={selectedEmployee?.status === 'active' ? <CheckCircleIcon /> : <CancelIcon />}
                                        label={selectedEmployee?.status}
                                        color={getStatusColor(selectedEmployee?.status)}
                                        size="small"
                                        sx={{ fontWeight: 500 }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        InputProps={{
                                            startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        InputProps={{
                                            startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        InputProps={{
                                            startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Position"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleInputChange}
                                        InputProps={{
                                            startAdornment: <AssignmentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Department"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        InputProps={{
                                            startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
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
                                        InputProps={{
                                            startAdornment: <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    >
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        InputProps={{
                                            startAdornment: <GroupIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    >
                                        {roles.map((role) => (
                                            <MenuItem key={role.id} value={role.name}>
                                                {role.name}
                                            </MenuItem>
                                        ))}
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
                    {dialogType === 'edit' && (
                        <Button 
                            onClick={handleUpdateEmployee} 
                            variant="contained" 
                            color="primary"
                            sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                px: 3
                            }}
                        >
                            Update
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Employees; 