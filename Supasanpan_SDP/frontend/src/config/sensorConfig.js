export const SENSOR_CONFIG = {
  // Data generation intervals (in milliseconds)
  intervals: {
    ph: 300000,     // 5 minutes
    tds: 300000,    // 5 minutes
    waterLevel: 600000,  // 10 minutes
  },
  
  // Sensor thresholds
  thresholds: {
    ph: { min: 6.5, max: 7.5 },
    tds: { min: 100, max: 500 },
    waterLevel: { min: 20, max: 100 },
  },
  
  // Data retention
  maxHistoricalDataPoints: 1000,
}; 