const mysql = require('mysql2/promise');
require('dotenv').config();

// Creamos el pool de conexión estándar
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS, // Asegúrate de que coincida con tu .env
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// IMPORTANTE: Exportamos el pool directamente
module.exports = pool;