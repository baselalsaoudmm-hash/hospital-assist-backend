const pool = require('../config/db');

const REASONS = ['review', 'appointment', 'medication'];
const COOLDOWN_HOURS = 2;

exports.arrival = async (req, res) => {
  const client = await pool.connect();
  try {
    const patientId = req.user.id;
    const reason = req.body.reason || 'review';

    if (!REASONS.includes(reason)) {
      return res.status(400).json({ message: 'سبب الزيارة غير صالح' });
    }

    await client.query('BEGIN');

    // منع التكرار: زيارة خلال آخر ساعتين
    const recent = await client.query(
      `SELECT id FROM visits
       WHERE patient_id = $1
         AND arrived_at > NOW() - INTERVAL '${COOLDOWN_HOURS} hours'
       LIMIT 1`,
      [patientId]
    );

    if (recent.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(200).json({
        already_notified: true,
        message: 'تم إشعار الفريق مسبقاً بوصولك',
      });
    }

    const visit = await client.query(
      `INSERT INTO visits (patient_id, reason) VALUES ($1, $2)
       RETURNING id, reason, arrived_at`,
      [patientId, reason]
    );

    const task = await client.query(
      `INSERT INTO tasks (visit_id) VALUES ($1)
       RETURNING id, status, created_at`,
      [visit.rows[0].id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      already_notified: false,
      visit: visit.rows[0],
      task: task.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  } finally {
    client.release();
  }
};