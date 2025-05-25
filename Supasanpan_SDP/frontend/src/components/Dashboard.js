import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Avatar,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  WaterDrop as WaterDropIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import SensorReadings from './SensorReadings';
import Invoices from './Invoices';
import EmployeeTasks from './EmployeeTasks';
import Reports from './Reports';
import Products from './Products';
import Billing from './Billing';
import Employees from './Employees';
import Tasks from './Tasks';
import ProfileDialog from './ProfileDialog';
import NotificationPopover from './NotificationPopover';

const drawerWidth = 280;

const Dashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState('home');
  const [alerts, setAlerts] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([
    { type: 'warning', title: 'pH value (6.27) is out of range (6.5-7.5)', time: 'Just now', read: false },
    { type: 'info', title: 'System check completed', time: '10 min ago', read: false },
    { type: 'warning', title: 'Water level (22%) is below minimum', time: '1 hour ago', read: false },
  ]);

  useEffect(() => {
    console.log('Dashboard mounted');
    console.log('User state:', user);
    console.log('Active component:', activeComponent);
  }, [user, activeComponent]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setProfileOpen(true);
  };

  const handleProfileClose = () => {
    setProfileOpen(false);
  };

  const handleNotifClick = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getMenuItems = () => {
    const allMenuItems = [
      { text: 'Home', icon: <HomeIcon />, component: 'home', roles: ['admin', 'manager', 'employee'] },
      { text: 'Products', icon: <InventoryIcon />, component: 'products', roles: ['admin', 'manager'] },
      { text: 'Billing', icon: <ReceiptIcon />, component: 'billing', roles: ['admin', 'manager', 'employee'] },
      { text: 'Invoices', icon: <ReceiptIcon />, component: 'invoices', roles: ['admin', 'manager'] },
      { text: 'Employees', icon: <PeopleIcon />, component: 'employees', roles: ['admin', 'manager'] },
      { text: 'Tasks', icon: <AssessmentIcon />, component: 'tasks', roles: ['admin', 'manager'] },
      { text: 'Reports', icon: <AssessmentIcon />, component: 'reports', roles: ['admin'] },
    ];

    if (!user) return [];
    return allMenuItems.filter(item => item.roles.includes(user.role));
  };

  const menuItems = getMenuItems();

  const drawer = (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      position: 'relative'
    }}>
      <Toolbar sx={{ 
        background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.95) 0%, rgba(41, 128, 185, 0.95) 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 2
      }}>
        <WaterDropIcon sx={{ fontSize: 32 }} />
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
          Supasanpan
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 2, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => setActiveComponent(item.component)}
            selected={activeComponent === item.component}
            sx={{
              borderRadius: 2,
              mb: 1,
              '&.Mui-selected': {
                background: 'rgba(52, 152, 219, 0.1)',
                '&:hover': {
                  background: 'rgba(52, 152, 219, 0.2)',
                },
                '& .MuiListItemIcon-root': {
                  color: '#3498db',
                },
                '& .MuiListItemText-primary': {
                  color: '#3498db',
                  fontWeight: 600,
                },
              },
              '&:hover': {
                background: 'rgba(52, 152, 219, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: activeComponent === item.component ? '#3498db' : 'inherit'
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                fontWeight: activeComponent === item.component ? 600 : 400
              }}
            />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List sx={{ px: 2, pb: 2 }}>
        <ListItem 
          button 
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            '&:hover': {
              background: 'rgba(231, 76, 60, 0.1)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: '#e74c3c' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{ color: '#e74c3c' }}
          />
        </ListItem>
      </List>
    </div>
  );

  const renderComponent = () => {
    console.log('Rendering component:', activeComponent);
    switch (activeComponent) {
      case 'home':
        return <SensorReadings setAlerts={setAlerts} />;
      case 'invoices':
        return <Invoices />;
      case 'employees':
        return <Employees />;
      case 'reports':
        return <Reports />;
      case 'products':
        return <Products />;
      case 'billing':
        return <Billing />;
      case 'tasks':
        return <Tasks />;
      default:
        return <SensorReadings setAlerts={setAlerts} />;
    }
  };

  const addNotification = notif => {
    setNotifications(prev => [
      { ...notif, time: new Date().toLocaleString(), read: false },
      ...prev.slice(0, 19)
    ]);
  };

  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" />;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.95) 0%, rgba(41, 128, 185, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.component === activeComponent)?.text || 'Home'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Notifications">
              <IconButton color="inherit" onClick={handleNotifClick}>
                <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title={user?.username || 'User'}>
              <Avatar 
                sx={{ 
                  bgcolor: 'white',
                  color: '#3498db',
                  width: 35,
                  height: 35,
                  cursor: 'pointer'
                }}
                onClick={handleProfileClick}
              >
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: '#ffffff',
              borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: '#ffffff',
              borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: 0,
          mt: 8,
          background: '#f5f6fa',
          minHeight: '100vh',
        }}
      >
        {alerts.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {alerts.map((alert, index) => (
              <div key={index}>{alert}</div>
            ))}
          </Alert>
        )}
        {renderComponent()}
      </Box>
      <ProfileDialog 
        open={profileOpen}
        onClose={handleProfileClose}
        user={user}
      />
      <NotificationPopover
        open={Boolean(notifAnchorEl)}
        anchorEl={notifAnchorEl}
        onClose={handleNotifClose}
        notifications={notifications}
      />
    </Box>
  );
};

export default Dashboard; 