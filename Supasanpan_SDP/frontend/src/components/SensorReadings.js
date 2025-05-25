import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Snackbar,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Brush,
} from 'recharts';
import { subDays, format, parseISO, addDays } from 'date-fns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { SENSOR_CONFIG } from '../config/sensorConfig';
import axios from 'axios';

// Persisted data outside the component
let persistedHistoricalData = null;
let persistedLatestReading = null;
// Track last notified values to avoid duplicate notifications
let lastNotifiedPh = null;
let lastNotifiedPhTime = null;
let lastNotifiedWaterLevel = null;
let lastNotifiedWaterLevelTime = null;

const SensorReadings = ({ setAlerts, addNotification }) => {
  const [latestReadings, setLatestReadings] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [processedData, setProcessedData] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    health: 'healthy',
    lastMaintenance: new Date(2024, 3, 15),
    nextCheck: addDays(new Date(), 7),
    connection: 'connected'
  });

  // Use thresholds from config
  const thresholds = useMemo(() => SENSOR_CONFIG.thresholds, []);

  const fetchLatestReadings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/sensors/latest');
      setLatestReadings(response.data);
      checkAlerts(response.data);
    } catch (error) {
      console.error('Error fetching latest readings:', error);
      setError('Failed to fetch latest readings');
    }
  };

  const fetchHistoricalReadings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/sensors/historical');
      setHistoricalData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching historical readings:', error);
      setError('Failed to fetch historical readings');
      setLoading(false);
    }
  };

  const checkAlerts = (reading) => {
    const newAlerts = [];
    if (reading.ph_value < thresholds.ph.min || reading.ph_value > thresholds.ph.max) {
      const alertMsg = `pH value (${reading.ph_value}) is out of range (${thresholds.ph.min}-${thresholds.ph.max})`;
      newAlerts.push(alertMsg);
      setAlertMessage(alertMsg);
      setShowAlert(true);
    }
    if (reading.water_level < thresholds.waterLevel.min) {
      const alertMsg = `Water level (${reading.water_level}%) is below minimum threshold (${thresholds.waterLevel.min}%)`;
      newAlerts.push(alertMsg);
      setAlertMessage(alertMsg);
      setShowAlert(true);
    }
    setAlerts(newAlerts);
  };

  const generateRandomData = useCallback(() => {
    const now = new Date();
    return {
      ph_value: (6 + Math.random() * 2).toFixed(2),
      tds_value: Math.floor(100 + Math.random() * 400),
      water_level: Math.floor(20 + Math.random() * 80),
      timestamp: now.toISOString(),
    };
  }, []);

  const formatValue = (value) => {
    if (value === null || value === undefined) return '--';
    return typeof value === 'number' ? value.toFixed(2) : value;
  };

  const parseDateRange = (rangeStr) => {
    if (typeof rangeStr !== 'string') return 7;
    const match = rangeStr.match(/(\d+)([a-zA-Z]+)/);
    if (!match) return 7;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === 'd') return value;
    if (unit === 'm') return value * 30;
    if (unit === 'y') return value * 365;
    return value;
  };

  const aggregateData = (data, groupBy) => {
    const groups = {};
    data.forEach(item => {
      const date = new Date(item.timestamp);
      let key;
      if (groupBy === 'day') {
        key = date.toISOString().slice(0, 10); // YYYY-MM-DD
      } else if (groupBy === 'hour') {
        key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      } else {
        key = item.timestamp;
      }
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    return Object.entries(groups).map(([key, items]) => {
      // Average values for the group
      const avg = arr => arr.reduce((a, b) => a + Number(b), 0) / arr.length;
      return {
        timestamp: key,
        ph_value: avg(items.map(i => i.ph_value)),
        tds_value: avg(items.map(i => i.tds_value)),
        water_level: avg(items.map(i => i.water_level)),
      };
    });
  };

  const processHistoricalData = useCallback((data) => {
    const now = new Date();
    const days = parseDateRange(dateRange);
    const rangeStart = subDays(now, days);
    let filtered = data.filter(item => new Date(item.timestamp) >= rangeStart);
    // Downsample for large ranges
    let groupBy = null;
    if (days >= 30) groupBy = 'day';
    else if (days >= 7) groupBy = 'hour';
    // For 1d, show all points
    if (groupBy) {
      filtered = aggregateData(filtered, groupBy);
    }
    return filtered.map(item => ({
      ...item,
      timestamp: format(parseISO(item.timestamp), groupBy === 'day' ? 'MMM dd' : groupBy === 'hour' ? 'MMM dd HH:00' : 'MMM dd HH:mm:ss'),
      ph_trend: item.ph_value,
      tds_trend: item.tds_value,
      water_level_trend: item.water_level,
    }));
  }, [dateRange]);

  const updateData = useCallback(() => {
    const newReading = generateRandomData();
    setLatestReadings(newReading);
    setHistoricalData(prevData => {
      const newData = [...prevData, newReading];
      return newData.slice(-1000); // Keep only last 1000 readings
    });

    // Check for alerts
    const newAlerts = [];
    if (newReading.ph_value < thresholds.ph.min || newReading.ph_value > thresholds.ph.max) {
      const alertMsg = `pH value (${newReading.ph_value}) is out of range (${thresholds.ph.min}-${thresholds.ph.max})`;
      newAlerts.push(alertMsg);
      setAlertMessage(alertMsg);
      setShowAlert(true);
    }
    if (newReading.water_level < thresholds.waterLevel.min) {
      const alertMsg = `Water level (${newReading.water_level}%) is below minimum threshold (${thresholds.waterLevel.min}%)`;
      newAlerts.push(alertMsg);
      setAlertMessage(alertMsg);
      setShowAlert(true);
    }
    setAlerts(newAlerts);
  }, [generateRandomData, setAlerts, thresholds]);

  const initialDataRef = React.useRef(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // On first mount, use persisted data if available
    if (persistedHistoricalData && persistedLatestReading) {
      setHistoricalData(persistedHistoricalData);
      setLatestReadings(persistedLatestReading);
      setLoading(false);
    } else {
      // Generate initial data
      const now = new Date();
      const data = [];
      const totalPoints = Math.floor((90 * 24 * 60 * 60 * 1000) / SENSOR_CONFIG.intervals.ph);
      for (let i = totalPoints - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * SENSOR_CONFIG.intervals.ph);
        data.push({
          ph_value: (6 + Math.random() * 2).toFixed(2),
          tds_value: Math.floor(100 + Math.random() * 400),
          water_level: Math.floor(20 + Math.random() * 80),
          timestamp: d.toISOString(),
        });
      }
      persistedHistoricalData = data;
      persistedLatestReading = data[data.length - 1];
      setHistoricalData(data);
      setLatestReadings(data[data.length - 1]);
      setLoading(false);
    }

    // Set up intervals for different sensor types
    const phInterval = setInterval(() => {
      const newReading = generateRandomData();
      persistedLatestReading = {
        ...persistedLatestReading,
        ph_value: newReading.ph_value,
        tds_value: newReading.tds_value,
        timestamp: newReading.timestamp
      };
      setLatestReadings({ ...persistedLatestReading });
      persistedHistoricalData = [
        ...persistedHistoricalData,
        {
          ...newReading,
          water_level: persistedHistoricalData[persistedHistoricalData.length - 1]?.water_level
        }
      ].slice(-SENSOR_CONFIG.maxHistoricalDataPoints);
      setHistoricalData([...persistedHistoricalData]);
    }, SENSOR_CONFIG.intervals.ph);

    const waterLevelInterval = setInterval(() => {
      const newReading = generateRandomData();
      persistedLatestReading = {
        ...persistedLatestReading,
        water_level: newReading.water_level,
        timestamp: newReading.timestamp
      };
      setLatestReadings({ ...persistedLatestReading });
      persistedHistoricalData = [
        ...persistedHistoricalData,
        {
          ...newReading,
          ph_value: persistedHistoricalData[persistedHistoricalData.length - 1]?.ph_value,
          tds_value: persistedHistoricalData[persistedHistoricalData.length - 1]?.tds_value
        }
      ].slice(-SENSOR_CONFIG.maxHistoricalDataPoints);
      setHistoricalData([...persistedHistoricalData]);
    }, SENSOR_CONFIG.intervals.waterLevel);

    // Cleanup intervals
    return () => {
      clearInterval(phInterval);
      clearInterval(waterLevelInterval);
    };
  }, []);

  useEffect(() => {
    if (historicalData.length > 0) {
      setProcessedData(processHistoricalData(historicalData));
    }
  }, [dateRange, historicalData, processHistoricalData]);

  useEffect(() => {
    if (!latestReadings) return;
    // pH notification
    if (
      (latestReadings.ph_value < SENSOR_CONFIG.thresholds.ph.min || latestReadings.ph_value > SENSOR_CONFIG.thresholds.ph.max) &&
      (latestReadings.ph_value !== lastNotifiedPh || latestReadings.timestamp !== lastNotifiedPhTime)
    ) {
      const alertMsg = `pH value (${latestReadings.ph_value}) is out of range (${SENSOR_CONFIG.thresholds.ph.min}-${SENSOR_CONFIG.thresholds.ph.max})`;
      setAlertMessage(alertMsg);
      setShowAlert(true);
      if (addNotification) {
        addNotification({ type: 'warning', title: alertMsg });
      }
      lastNotifiedPh = latestReadings.ph_value;
      lastNotifiedPhTime = latestReadings.timestamp;
    }
    // Water level notification
    if (
      latestReadings.water_level < SENSOR_CONFIG.thresholds.waterLevel.min &&
      (latestReadings.water_level !== lastNotifiedWaterLevel || latestReadings.timestamp !== lastNotifiedWaterLevelTime)
    ) {
      const alertMsg = `Water level (${latestReadings.water_level}%) is below minimum threshold (${SENSOR_CONFIG.thresholds.waterLevel.min}%)`;
      setAlertMessage(alertMsg);
      setShowAlert(true);
      if (addNotification) {
        addNotification({ type: 'warning', title: alertMsg });
      }
      lastNotifiedWaterLevel = latestReadings.water_level;
      lastNotifiedWaterLevelTime = latestReadings.timestamp;
    }
  }, [latestReadings, addNotification]);

  const handleDateRangeChange = (event) => {
    setDateRange(event.target.value);
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        width: '100%', 
        px: 3, 
        py: 3,
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.9) 0%, rgba(203, 235, 255, 0.9) 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.1,
          zIndex: 0
        }
      }}
    >
      <Snackbar
        open={showAlert}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity="warning" sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>

      <Grid container spacing={3} alignItems="stretch" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Sensor Cards Row */}
        <Grid item xs={12}>
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{ 
                  p: 3, 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: 4,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease-in-out',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    background: 'rgba(255, 255, 255, 0.95)',
                  }
                }} 
                elevation={0}
              >
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  pH Value
                </Typography>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 1,
                    background: 'linear-gradient(45deg, #3498db, #2980b9)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {formatValue(latestReadings?.ph_value)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Updates every 5 minutes
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{ 
                  p: 3, 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: 4,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease-in-out',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    background: 'rgba(255, 255, 255, 0.95)',
                  }
                }} 
                elevation={0}
              >
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  TDS Value
                </Typography>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 1,
                    background: 'linear-gradient(45deg, #1abc9c, #16a085)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {formatValue(latestReadings?.tds_value)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Updates every 5 minutes
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{ 
                  p: 3, 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: 4,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease-in-out',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    background: 'rgba(255, 255, 255, 0.95)',
                  }
                }} 
                elevation={0}
              >
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  Water Level
                </Typography>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 1,
                    background: 'linear-gradient(45deg, #3498db, #2980b9)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {formatValue(latestReadings?.water_level)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Updates every 10 minutes
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{ 
                  p: 3, 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: 4,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease-in-out',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    background: 'rgba(255, 255, 255, 0.95)',
                  }
                }} 
                elevation={0}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ color: '#2c3e50' }}>
                      System Status
                    </Typography>
                    <Chip
                      icon={systemStatus.health === 'healthy' ? <CheckCircleIcon /> : <WarningIcon />}
                      label={systemStatus.health.charAt(0).toUpperCase() + systemStatus.health.slice(1)}
                      color={systemStatus.health === 'healthy' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon sx={{ color: '#3498db', fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      Last Maintenance: {format(systemStatus.lastMaintenance, 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon sx={{ color: '#3498db', fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      Next Check: {format(systemStatus.nextCheck, 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {systemStatus.connection === 'connected' ? (
                      <CheckCircleIcon sx={{ color: '#2ecc71', fontSize: 18 }} />
                    ) : (
                      <ErrorIcon sx={{ color: '#e74c3c', fontSize: 18 }} />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Connection: {systemStatus.connection.charAt(0).toUpperCase() + systemStatus.connection.slice(1)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
        {/* Historical Data Charts */}
        <Grid item xs={12}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 4, mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 500 }}>
              Historical Data
            </Typography>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={handleDateRangeChange}
                size="small"
                sx={{
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                <MenuItem value="1d">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Grid container spacing={3}>
            {/* pH Chart */}
            <Grid item xs={12} md={4} sx={{ width: '100%' }}>
              <Paper 
                sx={{ 
                  p: 4, 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: 4,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease-in-out',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    background: 'rgba(255, 255, 255, 0.95)',
                  },
                  display: 'flex',
                  flexDirection: 'column'
                }} 
                elevation={0}
              >
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  pH History
                </Typography>
                <Box sx={{ width: '100%', flex: 1, minHeight: 400 }}>
                  <ResponsiveContainer>
                    <LineChart data={processedData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis dataKey="timestamp" stroke="#2c3e50" />
                      <YAxis domain={[0, 14]} stroke="#2c3e50" />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: 8,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          border: 'none',
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                        }}
                      />
                      <Legend />
                      <ReferenceLine y={thresholds.ph.min} stroke="#e74c3c" strokeDasharray="3 3" />
                      <ReferenceLine y={thresholds.ph.max} stroke="#e74c3c" strokeDasharray="3 3" />
                      <Line
                        type="monotone"
                        dataKey="ph_value"
                        stroke="#3498db"
                        name="pH Value"
                        dot={false}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="ph_trend"
                        stroke="#3498db"
                        name="Trend"
                        dot={false}
                        strokeDasharray="5 5"
                        strokeWidth={1}
                      />
                      <Brush 
                        dataKey="timestamp" 
                        height={30} 
                        stroke="#3498db"
                        fill="rgba(52, 152, 219, 0.1)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            {/* TDS Chart */}
            <Grid item xs={12} md={4} sx={{ width: '100%' }}>
              <Paper 
                sx={{ 
                  p: 4, 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: 4,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease-in-out',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    background: 'rgba(255, 255, 255, 0.95)',
                  },
                  display: 'flex',
                  flexDirection: 'column'
                }} 
                elevation={0}
              >
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  TDS History
                </Typography>
                <Box sx={{ width: '100%', flex: 1, minHeight: 400 }}>
                  <ResponsiveContainer>
                    <LineChart data={processedData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis dataKey="timestamp" stroke="#2c3e50" />
                      <YAxis stroke="#2c3e50" />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: 8,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          border: 'none',
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                        }}
                      />
                      <Legend />
                      <ReferenceLine y={thresholds.tds.min} stroke="#e74c3c" strokeDasharray="3 3" />
                      <ReferenceLine y={thresholds.tds.max} stroke="#e74c3c" strokeDasharray="3 3" />
                      <Line
                        type="monotone"
                        dataKey="tds_value"
                        stroke="#1abc9c"
                        name="TDS Value"
                        dot={false}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="tds_trend"
                        stroke="#1abc9c"
                        name="Trend"
                        dot={false}
                        strokeDasharray="5 5"
                        strokeWidth={1}
                      />
                      <Brush 
                        dataKey="timestamp" 
                        height={30} 
                        stroke="#1abc9c"
                        fill="rgba(26, 188, 156, 0.1)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            {/* Water Level Chart */}
            <Grid item xs={12} md={4} sx={{ width: '100%' }}>
              <Paper 
                sx={{ 
                  p: 4, 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: 4,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease-in-out',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    background: 'rgba(255, 255, 255, 0.95)',
                  },
                  display: 'flex',
                  flexDirection: 'column'
                }} 
                elevation={0}
              >
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                  Water Level History
                </Typography>
                <Box sx={{ width: '100%', flex: 1, minHeight: 400 }}>
                  <ResponsiveContainer>
                    <LineChart data={processedData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis dataKey="timestamp" stroke="#2c3e50" />
                      <YAxis domain={[0, 100]} stroke="#2c3e50" />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: 8,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          border: 'none',
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                        }}
                      />
                      <Legend />
                      <ReferenceLine y={thresholds.waterLevel.min} stroke="#e74c3c" strokeDasharray="3 3" />
                      <Line
                        type="monotone"
                        dataKey="water_level"
                        stroke="#3498db"
                        name="Water Level"
                        dot={false}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="water_level_trend"
                        stroke="#3498db"
                        name="Trend"
                        dot={false}
                        strokeDasharray="5 5"
                        strokeWidth={1}
                      />
                      <Brush 
                        dataKey="timestamp" 
                        height={30} 
                        stroke="#3498db"
                        fill="rgba(52, 152, 219, 0.1)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SensorReadings; 