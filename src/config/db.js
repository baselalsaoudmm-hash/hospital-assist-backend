require('dotenv').config();
const { Pool, types } = require('pg');

// أعمدة DATE ترجع كنص (YYYY-MM-DD) بدون تحويل توقيت
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

module.exports = pool;