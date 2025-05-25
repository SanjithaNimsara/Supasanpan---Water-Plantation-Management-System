import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import SensorReadings from './components/SensorReadings';
import Reports from './components/Reports';
import ShopItems from './components/ShopItems';
import Invoices from './components/Invoices';
import ResetPassword from './components/ResetPassword';
import Products from './components/Products';
import Billing from './components/Billing';
import Employees from './components/Employees';
import Tasks from './components/Tasks';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/sensor-readings"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager']}>
                    <SensorReadings />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <Reports />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/shop"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager']}>
                    <ShopItems />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager']}>
                    <Invoices />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager']}>
                    <Products />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager']}>
                    <Employees />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/billing"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'employee']}>
                    <Billing />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager']}>
                    <Tasks />
                  </RoleBasedRoute>
                }
              />
            </Routes>
          </Router>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App; 