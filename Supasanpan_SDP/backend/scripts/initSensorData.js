const pool = require('../config/database');

async function initSensorData() {
  const connection = await pool.getConnection();
  try {
    // Create sensor_readings table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sensor_readings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tank_id VARCHAR(50) NOT NULL,
        ph_value DECIMAL(4,2) NOT NULL,
        tds_value INT NOT NULL,
        water_level DECIMAL(5,2) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add some sample data
    const sampleData = [
      {
        tank_id: 'tank1',
        ph_value: 7.0,
        tds_value: 300,
        water_level: 80.0
      },
      {
        tank_id: 'tank1',
        ph_value: 7.1,
        tds_value: 310,
        water_level: 75.0
      },
      {
        tank_id: 'tank1',
        ph_value: 6.9,
        tds_value: 290,
        water_level: 70.0
      }
    ];

    for (const data of sampleData) {
      await connection.query(
        'INSERT INTO sensor_readings (tank_id, ph_value, tds_value, water_level) VALUES (?, ?, ?, ?)',
        [data.tank_id, data.ph_value, data.tds_value, data.water_level]
      );
    }

    console.log('Sensor data initialized successfully');
  } catch (error) {
    console.error('Error initializing sensor data:', error);
  } finally {
    connection.release();
    process.exit();
  }
}

initSensorData(); 