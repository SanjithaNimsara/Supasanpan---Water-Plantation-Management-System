# Water Plantation System Dashboard

A web-based dashboard for monitoring and managing a water plantation system with real-time sensor data, task management, and invoice generation.

## Features

- Real-time monitoring of water parameters (pH, TDS, tank levels)
- Task management system
- Invoice generation
- User authentication with role-based access
- Historical data visualization
- Alert system for unsafe values

## Tech Stack

### Frontend
- React.js
- Chart.js/Recharts for data visualization
- Axios for API calls
- React Router for navigation

### Backend
- Node.js
- Express.js
- MySQL
- JWT for authentication

### Additional Tools
- MySQL Workbench for database management
- Python script for sensor data simulation

## Project Structure

```
water-plantation-dashboard/
├── frontend/              # React frontend
│   ├── public/
│   └── src/
│       ├── components/    # React components
│       ├── pages/        # Page components
│       ├── services/     # API services
│       └── utils/        # Utility functions
├── backend/              # Node.js backend
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   └── utils/          # Utility functions
└── scripts/            # Python sensor simulation
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd backend
   npm install
   ```

3. Set up MySQL database:
   - Create a new database named `water_plantation`
   - Import the schema from `backend/database/schema.sql`

4. Configure environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the variables with your configuration

5. Start the development servers:
   ```bash
   # Frontend
   cd frontend
   npm start

   # Backend
   cd backend
   npm start
   ```

6. Run the sensor simulation script:
   ```bash
   cd scripts
   python sensor_simulation.py
   ```

## API Documentation

### Authentication
- POST /api/auth/login
- POST /api/auth/register

### Sensor Data
- GET /api/sensors/latest
- GET /api/sensors/history
- POST /api/sensors/data

### Tasks
- GET /api/tasks
- POST /api/tasks
- PUT /api/tasks/:id

### Invoices
- GET /api/invoices
- POST /api/invoices

## License

MIT 