module.exports = {
  name: '20261009_003_gmail_packages_postlikes',
  async up({ queryInterface, Sequelize }) {
    const users = await queryInterface.describeTable('users');
    if (!users.email_verified) await queryInterface.addColumn('users', 'email_verified', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true });
    if (!users.email_verification_code_hash) await queryInterface.addColumn('users', 'email_verification_code_hash', { type: Sequelize.STRING(255), allowNull: true });
    if (!users.email_verification_expires_at) await queryInterface.addColumn('users', 'email_verification_expires_at', { type: Sequelize.DATE, allowNull: true });

    const packages = await queryInterface.describeTable('packages');
    if (!packages.image_url) await queryInterface.addColumn('packages', 'image_url', { type: Sequelize.STRING(500), allowNull: true });

    const posts = await queryInterface.describeTable('posts');
    if (!posts.image_url) await queryInterface.addColumn('posts', 'image_url', { type: Sequelize.STRING(500), allowNull: true });
    if (posts.image_data && posts.image_data.allowNull === false) {
      await queryInterface.changeColumn('posts', 'image_data', { type: Sequelize.TEXT('long'), allowNull: true });
    }

    const tables = (await queryInterface.showAllTables()).map(v => typeof v === 'string' ? v.toLowerCase() : String(v.tableName || v.name || '').toLowerCase());
    if (!tables.includes('post_likes')) {
      await queryInterface.createTable('post_likes', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        post_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'posts', key: 'id' }, onDelete: 'CASCADE' },
        client_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      });
      await queryInterface.addIndex('post_likes', ['post_id', 'client_id'], { unique: true, name: 'uq_post_likes_post_client' });
    }
  },
};
