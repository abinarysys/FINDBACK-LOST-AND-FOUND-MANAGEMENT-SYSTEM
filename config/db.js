//A pool reuses available MySQL connections instead of opening a brand-new TCP connection per query.
// Loading dotenv makes private .env settings available through process.env.
require('dotenv').config();
// Import mysql2, the Node.js MySQL driver used to create the pool.
const mysql = require('mysql2');

// createPool returns a shared pool object; modules import this object to run database queries.
const db = mysql.createPool({

    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'copy', 
    waitForConnections: true,
    connectionLimit: 10
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }
    console.log("FindBack DB Connected!");
    connection.release();
});

module.exports = db;
