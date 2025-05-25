const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const { auth } = require('../middleware/auth');

// Get latest sensor readings
router.get('/latest', auth, sensorController.getLatestReadings);

// Get historical sensor readings
router.get('/historical', auth, sensorController.getHistoricalReadings);

// Add new sensor reading (for simulation)
router.post('/', auth, sensorController.addSensorReading);

module.exports = router; 