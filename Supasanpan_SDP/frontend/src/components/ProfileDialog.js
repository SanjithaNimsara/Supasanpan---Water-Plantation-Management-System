import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const ProfileDialog = ({ open, onClose, user }) => {
  if (!user) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.95) 0%, rgba(41, 128, 185, 0.95) 100%)',
        color: 'white',
        py: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Profile Details</Typography>
        </Box>
        <IconButton 
          onClick={onClose}
          sx={{ 
            color: 'white',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            mb: 3,
            background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.05) 0%, rgba(41, 128, 185, 0.05) 100%)',
            p: 3,
            borderRadius: 2,
          }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: '#3498db',
                fontSize: '2rem',
                mb: 2,
                boxShadow: '0 4px 10px rgba(52, 152, 219, 0.3)',
              }}
            >
              {user.username?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
              {user.full_name || user.username}
            </Typography>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: '#3498db',
                background: 'rgba(52, 152, 219, 0.1)',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                mt: 1,
              }}
            >
              {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
            </Typography>
          </Box>
        </Box>
        <Paper 
          elevation={0} 
          sx={{ 
            background: '#f8f9fa',
            borderRadius: 0,
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <List sx={{ py: 0 }}>
            <ListItem sx={{ py: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PersonIcon sx={{ color: '#3498db' }} />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="subtitle2" color="text.secondary">
                    Username
                  </Typography>
                }
                secondary={
                  <Typography variant="body1" sx={{ color: '#2c3e50', fontWeight: 500 }}>
                    {user.username}
                  </Typography>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem sx={{ py: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <EmailIcon sx={{ color: '#3498db' }} />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                }
                secondary={
                  <Typography variant="body1" sx={{ color: '#2c3e50', fontWeight: 500 }}>
                    {user.email}
                  </Typography>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem sx={{ py: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <BadgeIcon sx={{ color: '#3498db' }} />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="subtitle2" color="text.secondary">
                    Role
                  </Typography>
                }
                secondary={
                  <Typography variant="body1" sx={{ color: '#2c3e50', fontWeight: 500 }}>
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </Paper>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, background: '#f8f9fa' }}>
        <Button 
          variant="contained" 
          onClick={onClose}
          sx={{
            background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2980b9 0%, #2573a7 100%)',
            },
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileDialog; 