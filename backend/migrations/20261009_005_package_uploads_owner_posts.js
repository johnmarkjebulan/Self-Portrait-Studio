const crypto = require('crypto');

module.exports = {
  name: '20261009_005_package_uploads_owner_posts',
  async up({ queryInterface, Sequelize }) {
    const sequelize = queryInterface.sequelize;

    const packages = await queryInterface.describeTable('packages');
    if (!packages.image_data) {
      await queryInterface.addColumn('packages', 'image_data', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    const [admins] = await sequelize.query(
      `SELECT id FROM users WHERE role='admin' ORDER BY created_at ASC LIMIT 1`
    );

    if (admins.length) {
      const authorId = admins[0].id;
      const seedPosts = [
        {
          title: 'Studio Portrait Highlight · 01',
          caption: 'A recent Pose and Pics studio portrait highlight. Thank you for trusting us with your memories. 📸',
          image_url: '/studio-media/posts/studio-highlight-01.jpg',
        },
        {
          title: 'Studio Portrait Highlight · 02',
          caption: 'Another favorite frame from the studio. Simple, warm, and made to keep. ✨',
          image_url: '/studio-media/posts/studio-highlight-02.jpg',
        },
        {
          title: 'Studio Portrait Highlight · 03',
          caption: 'A fresh portrait session from Pose and Pics Photography Studio. 🤍',
          image_url: '/studio-media/posts/studio-highlight-03.jpg',
        },
        {
          title: 'Studio Portrait Highlight · 04',
          caption: 'Captured at Pose and Pics — a studio moment worth remembering. 📷',
          image_url: '/studio-media/posts/studio-highlight-04.jpg',
        },
        {
          title: 'Studio Portrait Highlight · 05',
          caption: 'One more studio favorite from our recent sessions. Thank you for being part of Pose and Pics. ✨',
          image_url: '/studio-media/posts/studio-highlight-05.jpg',
        },
      ];

      for (const post of seedPosts) {
        const [exists] = await sequelize.query(
          `SELECT id FROM posts WHERE image_url=:image_url LIMIT 1`,
          { replacements: { image_url: post.image_url } }
        );
        if (!exists.length) {
          await queryInterface.bulkInsert('posts', [{
            id: crypto.randomUUID(),
            author_id: authorId,
            title: post.title,
            caption: post.caption,
            image_data: null,
            image_url: post.image_url,
            is_published: true,
            created_at: new Date(),
            updated_at: new Date(),
          }]);
        }
      }
    }
  },
};
