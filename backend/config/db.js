// config/db.js – MySQL connection pool using mysql2/promise
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'shopzone',
  waitForConnections: true,
  connectionLimit:    10,        // max simultaneous connections
  queueLimit:         0,
  charset:            'utf8mb4',
});

// Test the connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅  MySQL connected');
    conn.release();
  })
  .catch(err => {
    console.error('❌  MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;