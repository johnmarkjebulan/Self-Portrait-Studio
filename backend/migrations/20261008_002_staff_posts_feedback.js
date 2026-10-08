module.exports = {
  name: '20261008_002_staff_posts_feedback',
  async up({ sequelize, queryInterface, Sequelize }) {
    await sequelize.query(`DO $$ BEGIN ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'staff'; EXCEPTION WHEN undefined_object THEN NULL; END $$;`);
    const users = await queryInterface.describeTable('users');
    if (!users.is_active) await queryInterface.addColumn('users', 'is_active', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true });

    const feedback = await queryInterface.describeTable('feedback');
    if (feedback.appointment_id && feedback.appointment_id.allowNull === false) {
      await queryInterface.changeColumn('feedback', 'appointment_id', { type: Sequelize.UUID, allowNull: true });
    }
    if (!feedback.staff_reply) await queryInterface.addColumn('feedback', 'staff_reply', { type: Sequelize.TEXT, allowNull: true });
    if (!feedback.replied_by) await queryInterface.addColumn('feedback', 'replied_by', { type: Sequelize.UUID, allowNull: true });
    if (!feedback.replied_at) await queryInterface.addColumn('feedback', 'replied_at', { type: Sequelize.DATE, allowNull: true });

    const tables = (await queryInterface.showAllTables()).map(v => typeof v === 'string' ? v.toLowerCase() : String(v.tableName || v.name || '').toLowerCase());
    if (!tables.includes('posts')) {
      await queryInterface.createTable('posts', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        author_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
        title: { type: Sequelize.STRING(180), allowNull: true },
        caption: { type: Sequelize.TEXT, allowNull: true },
        image_data: { type: Sequelize.TEXT('long'), allowNull: false },
        is_published: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      });
    }
  },
};
