// File guide: This module creates the MySQL connection pool and performs a startup connection check.
// Inputs and outputs: Express requests or configuration enter through its exports; it returns middleware, route responses, query results, or browser behavior as appropriate.
// Connections: Imports and router mounts in app.js show how other modules call this code.

// config/db.js
// A pool reuses available MySQL connections instead of opening a brand-new TCP connection per query.
// Loading dotenv makes private .env settings available through process.env.
require('dotenv').config();
// Import mysql2, the Node.js MySQL driver used to create the pool.
const mysql = require('mysql2');

// createPool returns a shared pool object; modules import this object to run database queries.
const db = mysql.createPool({
    // Read the host from the environment; use localhost for a local MySQL server by default.
    host: process.env.DB_HOST || 'localhost',
    // Database login name comes from the private environment file.
    user: process.env.DB_USER,
    // Database password is read at runtime and must not be committed or documented.
    password: process.env.DB_PASSWORD,
    // Select the configured schema, or use the project's local default database name.
    database: process.env.DB_NAME || 'findback_db',
    // Queue a query when all pooled connections are busy instead of failing immediately.
    waitForConnections: true,
    // Keep at most ten open connections in this pool.
    connectionLimit: 10
});

// Startup check: borrow one connection, report whether MySQL answered, and return it to the pool.
// getConnection uses a callback: err is set on failure; connection is the borrowed connection on success.
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }
    console.log('Connected to FindBack MySQL database!');
    connection.release();
});

// Export the pool so query.js and other modules can access the same configured connection pool.
module.exports = db;
