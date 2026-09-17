require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');
const routes = require('./routes');

const app = express();
const PORT = Number(process.env.PORT || 5000);

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Create backend/.env from .env.example before starting the server.');
  process.exit(1);
}

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', apiLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));
app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || (err.message === 'Origin not allowed by CORS' ? 403 : 500);
  const message = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : (err.message || 'Internal server error');
  res.status(status).json({ error: message });
});

sequelize.authenticate()
  .then(async () => {
    console.log('Database connected.');
    if (process.env.DB_AUTO_SYNC === 'true') {
      await sequelize.sync();
      console.log('Database schema sync complete.');
    }
    app.listen(PORT, () => console.log(`Self-Portrait Studio API → http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });

module.exports = app;
