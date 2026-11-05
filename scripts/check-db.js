require('dotenv').config();
const pool = require('../src/config/db');

(async () => {
  try {
    const reasons = await pool.query(
      'SELECT unnest(enum_range(NULL::visit_reason_enum)) AS v'
    );
    console.log('reason values: - check-db.js:9', reasons.rows.map((r) => r.v).join(', '));

    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'patients' ORDER BY ordinal_position`
    );
    console.log('patients columns: - check-db.js:15', cols.rows.map((r) => r.column_name).join(', '));
  } catch (err) {
    console.error('Check failed: - check-db.js:17', err.message);
  } finally {
    await pool.end();
  }
})();