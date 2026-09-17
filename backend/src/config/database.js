require('dotenv').config();
const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'Missing DATABASE_URL. Set backend/.env to your Supabase PostgreSQL Session Pooler connection string.'
  );
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  pool: {
    max: Number(process.env.DB_POOL_MAX || 5),
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
