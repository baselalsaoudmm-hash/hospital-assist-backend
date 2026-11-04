const bcrypt = require('bcrypt');
const pool = require('../config/db');

const DISABILITY_TYPES = ['blind', 'wheelchair', 'deaf', 'elderly', 'other'];

exports.registerPatient = async (req, res) => {
  try {
    const { full_name, phone, password, disability_type, disability_note } = req.body;

    if (!full_name || !phone || !password || !disability_type) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة، بما فيها نوع الاحتياج' });
    }
    if (!DISABILITY_TYPES.includes(disability_type)) {
      return res.status(400).json({ message: 'نوع الاحتياج غير صالح' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO patients (full_name, phone, password_hash, disability_type, disability_note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, phone, disability_type, created_at`,
      [full_name, phone, password_hash, disability_type, disability_note || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'رقم الهاتف مسجل مسبقاً' });
    }
    console.error(err);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
};

exports.registerStaff = async (req, res) => {
  try {
    const { full_name, phone, password, department } = req.body;

    if (!full_name || !phone || !password) {
      return res.status(400).json({ message: 'الاسم والهاتف وكلمة المرور مطلوبة' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO staff (full_name, phone, password_hash, department)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, phone, department, is_available`,
      [full_name, phone, password_hash, department || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'رقم الهاتف مسجل مسبقاً' });
    }
    console.error(err);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
};
