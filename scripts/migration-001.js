require('dotenv').config();
const pool = require('../src/config/db');

(async () => {
  try {
    // بيانات تجريبية فقط، بنمسحها عشان نقدر نضيف أعمدة إلزامية
    await pool.query('DELETE FROM tasks');
    await pool.query('DELETE FROM visits');
    await pool.query('DELETE FROM patients');

    await pool.query(`
      ALTER TABLE patients
        ADD COLUMN nationality VARCHAR(20) NOT NULL
          CHECK (nationality IN ('jordanian','non_jordanian')),
        ADD COLUMN national_id VARCHAR(20) NOT NULL UNIQUE,
        ADD COLUMN gender VARCHAR(10) NOT NULL
          CHECK (gender IN ('male','female')),
        ADD COLUMN birth_date DATE NOT NULL
    `);

    await pool.query(`ALTER TYPE visit_reason_enum RENAME VALUE 'checkup' TO 'review'`);

    console.log('Migration done - migration-001.js:23');
  } catch (err) {
    console.error('Migration failed: - migration-001.js:25', err.message);
  } finally {
    await pool.end();
  }
})();