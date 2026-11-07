const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

const validId = (id) => /^\d+$/.test(id);

// قائمة المهام: الجديدة + مهامي المستلمة (حد أدنى من البيانات)
exports.listTasks = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.status, t.created_at, t.accepted_at,
              v.reason, v.arrived_at,
              p.disability_type,
              CASE WHEN t.staff_id = $1 THEN p.full_name END AS patient_name
       FROM tasks t
       JOIN visits v ON v.id = t.visit_id
       JOIN patients p ON p.id = v.patient_id
       WHERE t.status = 'new' OR (t.staff_id = $1 AND t.status = 'accepted')
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json({ tasks: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
};

// استلام المهمة: أول موظف فقط
exports.acceptTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ message: 'رقم المهمة غير صالح' });

    const result = await pool.query(
      `UPDATE tasks
       SET staff_id = $1, status = 'accepted', accepted_at = NOW()
       WHERE id = $2 AND status = 'new'
       RETURNING id, status, accepted_at`,
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      const exists = await pool.query('SELECT id FROM tasks WHERE id = $1', [id]);
      if (exists.rows.length === 0) {
        return res.status(404).json({ message: 'المهمة غير موجودة' });
      }
      return res.status(409).json({ message: 'تم استلام المهمة من موظف آخر' });
    }

    res.json({ task: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
};

// إنهاء المهمة: فقط الموظف اللي استلمها
exports.completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ message: 'رقم المهمة غير صالح' });

    const result = await pool.query(
      `UPDATE tasks
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1 AND staff_id = $2 AND status = 'accepted'
       RETURNING id, status, accepted_at, completed_at`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ message: 'لا يمكن إنهاء هذه المهمة (غير مستلمة منك أو منتهية)' });
    }

    res.json({ task: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
};

// بيانات المريض الكاملة: فقط للموظف اللي استلم المهمة
exports.getTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ message: 'رقم المهمة غير صالح' });

    const result = await pool.query(
      `SELECT t.id, t.status, t.accepted_at,
              v.reason, v.arrived_at,
              p.full_name, p.phone, p.disability_type, p.disability_note,
              p.gender, p.birth_date, p.photo_path
       FROM tasks t
       JOIN visits v ON v.id = t.visit_id
       JOIN patients p ON p.id = v.patient_id
       WHERE t.id = $1 AND t.staff_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'يجب استلام المهمة أولاً' });
    }

    const row = result.rows[0];
    const { photo_path, ...rest } = row;
    res.json({
      task: {
        ...rest,
        photo_url: photo_path ? `/api/tasks/${row.id}/photo` : null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
};

// صورة المريض: فقط للموظف اللي استلم المهمة
exports.getTaskPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ message: 'رقم المهمة غير صالح' });

    const result = await pool.query(
      `SELECT p.photo_path
       FROM tasks t
       JOIN visits v ON v.id = t.visit_id
       JOIN patients p ON p.id = v.patient_id
       WHERE t.id = $1 AND t.staff_id = $2`,
      [id, req.user.id]
    );

    const photo = result.rows[0] && result.rows[0].photo_path;
    if (!photo) return res.status(404).json({ message: 'لا توجد صورة' });

    const file = path.join(__dirname, '..', '..', 'uploads', photo);
    if (!fs.existsSync(file)) return res.status(404).json({ message: 'لا توجد صورة' });

    res.sendFile(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ في السيرفر' });
  }
};