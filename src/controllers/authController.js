const bcrypt = require('bcrypt');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

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

exports.login = async (req, res) => {
  try {
    const { phone, password, role } = req.body;

    if (!phone || !password || !['patient', 'staff'].includes(role)) {
      return res.status(400).json({ message: 'الهاتف وكلمة المرور والدور (patient أو staff) مطلوبة' });
    }

    const table = role === 'patient' ? 'patients' : 'staff';
    const result = await pool.query(`SELECT * FROM ${table} WHERE phone = $1`, [phone]);
    const user = result.rows[0];

    const invalid = () => res.status(401).json({ message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });

    if (!user) return invalid();

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return invalid();

    const token = jwt.sign(
      { id: user.id, role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, full_name: user.full_name, role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
};