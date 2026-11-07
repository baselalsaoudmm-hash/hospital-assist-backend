require('dotenv').config();
const pool = require('../src/config/db');

(async () => {
  try {
    const p = await pool.query('SELECT id, phone, full_name FROM patients ORDER BY id');
    const s = await pool.query('SELECT id, phone, full_name FROM staff ORDER BY id');
    console.log('patients: - list-users.js:8', p.rows);
    console.log('staff: - list-users.js:9', s.rows);
  } catch (err) {
    console.error('Failed: - list-users.js:11', err.message);
  } finally {
    await pool.end();
  }
})();
