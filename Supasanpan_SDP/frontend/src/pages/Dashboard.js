import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import axios from 'axios';
import AlertBox from '../components/AlertBox';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [latestReadings, setLatestReadings] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const intervalRef = useRef(null);

  const fetchData = async () => {
    console.log('Fetching new sensor data...', new Date().toLocaleTimeString());
    try {
      const [latestResponse, historyResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/sensors/latest'),
        axios.get('http://localhost:5000/api/sensors/history')
      ]);

      console.log('Received new data:', latestResponse.data);
      setLatestReadings(latestResponse.data);
      setHistoricalData(historyResponse.data);

      // Check for alerts
      const newAlerts = [];
      if (latestResponse.data) {
        if (latestResponse.data.ph_value < 6.5 || latestResponse.data.ph_value > 7.5) {
          newAlerts.push(`pH value (${latestResponse.data.ph_value}) is out of range`);
        }
        if (latestResponse.data.tds_value < 100 || latestResponse.data.tds_value > 500) {
          newAlerts.push(`TDS value (${latestResponse.data.tds_value}) is out of range`);
        }
        if (latestResponse.data.water_level < 20) {
          newAlerts.push(`Water level (${latestResponse.data.water_level}%) is too low`);
        }
      }
      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      console.log('Interval triggered at:', new Date().toLocaleTimeString());
      fetchData();
    }, 120000); // 2 minutes

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        console.log('Cleaning up interval');
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Empty dependency array

  const chartData = {
    labels: historicalData.map(data => new Date(data.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'pH Value',
        data: historicalData.map(data => data.ph_value),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'TDS Value',
        data: historicalData.map(data => data.tds_value),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      },
      {
        label: 'Water Level (%)',
        data: historicalData.map(data => data.water_level),
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Sensor Data History'
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {alerts.length > 0 && (
        <div className="mb-8">
          <AlertBox alerts={alerts} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">pH Value</h3>
          <p className="text-3xl font-bold">
            {latestReadings?.ph_value || '--'}
          </p>
          <p className="text-sm text-gray-500">Current reading</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">TDS Value</h3>
          <p className="text-3xl font-bold">
            {latestReadings?.tds_value || '--'}
          </p>
          <p className="text-sm text-gray-500">Current reading</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Water Level</h3>
          <p className="text-3xl font-bold">
            {latestReadings?.water_level || '--'}%
          </p>
          <p className="text-sm text-gray-500">Current level</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default Dashboard; 