import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  WaterDrop,
  PersonAdd,
} from '@mui/icons-material';

const Register = () => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('employee');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirm_password) {
      showNotification('Passwords do not match', 'error');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Account created successfully!', 'success');
        navigate('/login');
      } else {
        showNotification(data.message || 'Registration failed', 'error');
      }
    } catch (error) {
      showNotification('An error occurred during registration', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(41, 128, 185, 0.1) 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={3}
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            width: 350,
            maxWidth: '100%',
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.95) 0%, rgba(41, 128, 185, 0.95) 100%)',
              p: 1.5,
              borderRadius: '50%',
              mb: 2,
            }}
          >
            <WaterDrop sx={{ fontSize: 32, color: 'white' }} />
          </Box>

          <Typography
            component="h1"
            variant="h5"
            sx={{
              mb: 2,
              fontWeight: 600,
              color: '#2c3e50',
            }}
          >
            Create Account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Box sx={{ mb: 2 }}>
              <TextField
                required
                fullWidth
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                size="small"
                sx={{
                  background: '#fff',
                  borderRadius: 1,
                }}
              />
            </Box>
            <Box sx={{ height: 16, background: 'linear-gradient(90deg, #a2c4f7 0%, #d0e6fa 100%)', borderRadius: 1, mb: 2 }} />
            <Box sx={{ mb: 2 }}>
              <TextField
                required
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                size="small"
                sx={{
                  background: '#fff',
                  borderRadius: 1,
                }}
              />
            </Box>
            <Box sx={{ height: 16, background: 'linear-gradient(90deg, #a2c4f7 0%, #d0e6fa 100%)', borderRadius: 1, mb: 2 }} />
            <Box sx={{ mb: 2 }}>
              <TextField
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                size="small"
                sx={{
                  background: '#fff',
                  borderRadius: 1,
                }}
              />
            </Box>
            <Box sx={{ height: 16, background: 'linear-gradient(90deg, #a2c4f7 0%, #d0e6fa 100%)', borderRadius: 1, mb: 2 }} />
            <Box sx={{ mb: 2 }}>
              <TextField
                required
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                size="small"
                sx={{
                  background: '#fff',
                  borderRadius: 1,
                }}
              />
            </Box>
            <Box sx={{ height: 16, background: 'linear-gradient(90deg, #a2c4f7 0%, #d0e6fa 100%)', borderRadius: 1, mb: 2 }} />
            <Box sx={{ mb: 2 }}>
              <TextField
                required
                fullWidth
                label="Confirm Password"
                name="confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        size="small"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                size="small"
                sx={{
                  background: '#fff',
                  borderRadius: 1,
                }}
              />
            </Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                value={role}
                label="Role"
                onChange={e => setRole(e.target.value)}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
              </Select>
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1,
                mt: 1,
                background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.95) 0%, rgba(41, 128, 185, 0.95) 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(41, 128, 185, 0.95) 0%, rgba(52, 152, 219, 0.95) 100%)',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  <PersonAdd sx={{ mr: 1 }} />
                  Create Account
                </>
              )}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    color: '#3498db',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register; 