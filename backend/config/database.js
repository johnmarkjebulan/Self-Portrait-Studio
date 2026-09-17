require('dotenv').config();
const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
  // Production: Supabase PostgreSQL (or any PostgreSQL host)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
    logging: false,
  });
} else {
  // Local: MySQL via XAMPP
  sequelize = new Sequelize(
    process.env.DB_NAME || 'selfportrait_studio',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    }
  );
}

module.exports = sequelize;
