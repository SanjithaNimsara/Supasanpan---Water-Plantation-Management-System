const pool = require('../config/database');

const getLatestReadings = async (req, res) => {
  try {
    const [readings] = await pool.query(
      `SELECT * FROM sensor_readings 
       ORDER BY timestamp DESC 
       LIMIT 1`
    );

    if (readings.length === 0) {
      return res.status(404).json({ message: 'No sensor readings found' });
    }

    res.json(readings[0]);
  } catch (error) {
    console.error('Error getting latest readings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getHistoricalReadings = async (req, res) => {
  try {
    const [readings] = await pool.query(
      `SELECT * FROM sensor_readings 
       ORDER BY timestamp DESC 
       LIMIT 50`
    );

    res.json(readings);
  } catch (error) {
    console.error('Error getting historical readings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addSensorReading = async (req, res) => {
  try {
    const { tank_id, ph_value, tds_value, water_level } = req.body;

    // Validate sensor values against thresholds
    if (ph_value < process.env.PH_MIN || ph_value > process.env.PH_MAX) {
      return res.status(400).json({ message: 'pH value out of range' });
    }

    if (tds_value < process.env.TDS_MIN || tds_value > process.env.TDS_MAX) {
      return res.status(400).json({ message: 'TDS value out of range' });
    }

    if (water_level < process.env.TANK_MIN_LEVEL) {
      return res.status(400).json({ message: 'Water level too low' });
    }

    const [result] = await pool.query(
      `INSERT INTO sensor_readings 
       (tank_id, ph_value, tds_value, water_level) 
       VALUES (?, ?, ?, ?)`,
      [tank_id, ph_value, tds_value, water_level]
    );

    res.status(201).json({
      message: 'Sensor reading added successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error adding sensor reading:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getLatestReadings,
  getHistoricalReadings,
  addSensorReading
}; 