require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('Schema ready - setup-db.js:10');
  } catch (err) {
    console.error('Setup failed: - setup-db.js:12', err.message);
  } finally {
    await pool.end();
  }
})();
