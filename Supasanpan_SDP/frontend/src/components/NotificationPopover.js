import React from 'react';
import { Popover, List, ListItem, ListItemIcon, ListItemText, Typography, Box } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

const NotificationPopover = ({ open, anchorEl, onClose, notifications }) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{
        sx: {
          minWidth: 320,
          maxWidth: 400,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          p: 2,
          background: 'rgba(255,255,255,0.97)',
        }
      }}
    >
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <NotificationsIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>Notifications</Typography>
      </Box>
      {notifications && notifications.length > 0 ? (
        <List>
          {notifications.map((notif, idx) => (
            <ListItem key={idx} alignItems="flex-start">
              <ListItemIcon>
                {notif.type === 'warning' ? <WarningIcon color="warning" /> : <InfoIcon color="info" />}
              </ListItemIcon>
              <ListItemText
                primary={notif.title || notif.message || notif}
                secondary={notif.time ? notif.time : null}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
          No notifications
        </Typography>
      )}
    </Popover>
  );
};

export default NotificationPopover; 