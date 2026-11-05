const bcrypt = require('bcrypt');
const fs = require('fs');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const DISABILITY_TYPES = ['blind', 'wheelchair', 'deaf', 'elderly', 'other'];
const NATIONALITIES = ['jordanian', 'non_jordanian'];
const GENDERS = ['male', 'female'];

const removeFile = (file) => {
  if (file) fs.unlink(file.path, () => {});
};

exports.registerPatient = async (req, res) => {
  const photo = req.file;
  const fail = (status, message, extra = {}) => {
    removeFile(photo);
    return res.status(status).json({ message, ...extra });
  };

  try {
    const body = req.body || {};
    const {
      full_name, phone, password, disability_type, disability_note,
      nationality, national_id, gender, birth_date,
    } = body;

    const required = {
      full_name, phone, password, disability_type,
      nationality, national_id, gender, birth_date,
    };
    const missing = Object.keys(required).filter((k) => !required[k]);
    if (missing.length > 0) {
      return fail(400, 'جميع الحقول مطلوبة، بما فيها نوع الاحتياج', { missing });
    }
    if (!DISABILITY_TYPES.includes(disability_type)) {
      return fail(400, 'نوع الاحتياج غير صالح');
    }
    if (!NATIONALITIES.includes(nationality)) {
      return fail(400, 'الجنسية غير صالحة');
    }
    if (!GENDERS.includes(gender)) {
      return fail(400, 'الجنس غير صالح');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth_date) || isNaN(Date.parse(birth_date))) {
      return fail(400, 'تاريخ الميلاد يجب أن يكون بصيغة YYYY-MM-DD');
    }
    if (new Date(birth_date) > new Date()) {
      return fail(400, 'تاريخ الميلاد غير منطقي');
    }
    if (!/^[A-Za-z0-9]{5,20}$/.test(national_id)) {
      return fail(400, 'الرقم الوطني/المتسلسل غير صالح');
    }
    if (password.length < 6) {
      return fail(400, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO patients
         (full_name, phone, password_hash, photo_path, disability_type, disability_note,
          nationality, national_id, gender, birth_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, full_name, phone, disability_type, nationality, gender, birth_date, created_at`,
      [
        full_name, phone, password_hash, photo ? photo.filename : null,
        disability_type, disability_note || null,
        nationality, national_id, gender, birth_date,
      ]
    );

    res.status(201).json({ ...result.rows[0], has_photo: Boolean(photo) });
  } catch (err) {
    removeFile(photo);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'رقم الهاتف أو الرقم الوطني مسجل مسبقاً' });
    }
    console.error(err);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
};

exports.registerStaff = async (req, res) => {
  try {
    const { full_name, phone, password, department } = req.body || {};

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
    const { phone, password, role } = req.body || {};

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