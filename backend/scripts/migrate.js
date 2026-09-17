require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../src/models');

async function ensureMigrationTable() {
  const qi = sequelize.getQueryInterface();
  const tables = (await qi.showAllTables()).map((value) =>
    typeof value === 'string' ? value.toLowerCase() : String(value?.tableName || value?.name || '').toLowerCase()
  );
  if (!tables.includes('schema_migrations')) {
    await qi.createTable('schema_migrations', {
      name: { type: DataTypes.STRING(191), allowNull: false, primaryKey: true },
      applied_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
  }
}

async function run() {
  await sequelize.authenticate();
  await ensureMigrationTable();
  const [rows] = await sequelize.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.name));
  const dir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.js')).sort();

  for (const file of files) {
    const migration = require(path.join(dir, file));
    const name = migration.name || file.replace(/\.js$/, '');
    if (applied.has(name)) {
      console.log(`skip ${name}`);
      continue;
    }
    console.log(`apply ${name}`);
    await migration.up({
      sequelize,
      queryInterface: sequelize.getQueryInterface(),
      Sequelize: DataTypes,
    });
    await sequelize.query('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)', {
      replacements: [name, new Date()],
    });
  }
  console.log('Database migrations complete.');
  await sequelize.close();
}

run().catch(async (error) => {
  console.error('Migration failed:', error);
  try { await sequelize.close(); } catch {}
  process.exit(1);
});
