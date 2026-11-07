require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./config/db');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/arrival', require('./routes/arrivalRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

// معالج الأخطاء العام (أخطاء رفع الصور وغيرها)
app.use((err, req, res, next) => {
  if (err.message === 'INVALID_IMAGE') {
    return res.status(400).json({ message: 'الصورة يجب أن تكون JPG أو PNG' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'حجم الصورة يجب ألا يتجاوز 2 ميغابايت' });
  }
  console.error(err);
  res.status(500).json({ message: 'خطأ في السيرفر' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} - app.js:36`));