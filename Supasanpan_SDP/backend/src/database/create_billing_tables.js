const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'water_user',
    password: process.env.DB_PASSWORD || 'mmsn2001',
    database: process.env.DB_NAME || 'water_plantation',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function createBillingTables() {
    let connection;
    try {
        console.log('Reading SQL file...');
        const sql = fs.readFileSync(
            path.join(__dirname, 'billing_tables.sql'),
            'utf8'
        );

        console.log('Getting database connection...');
        connection = await pool.getConnection();
        
        console.log('Starting transaction...');
        await connection.beginTransaction();
        
        // Split the SQL file into individual statements
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        // Execute each statement
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.trim().split('\n')[0]);
                await connection.query(statement);
            }
        }
        
        await connection.commit();
        console.log('Billing tables created successfully');
    } catch (error) {
        if (connection) {
            console.log('Rolling back transaction...');
            await connection.rollback();
        }
        console.error('Error creating billing tables:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error sqlState:', error.sqlState);
        console.error('Error sqlMessage:', error.sqlMessage);
        process.exit(1);
    } finally {
        if (connection) {
            console.log('Releasing connection...');
            connection.release();
        }
    }
}

// Run the function
console.log('Starting billing tables creation...');
createBillingTables().then(() => {
    console.log('Script completed');
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
}); 