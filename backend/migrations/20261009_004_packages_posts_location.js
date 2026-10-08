const crypto = require('crypto');

module.exports = {
  name: '20261009_004_packages_posts_location',
  async up({ queryInterface }) {
    const sequelize = queryInterface.sequelize;

    const studioAddress = 'San Agustin St, Poblacion 4, Calaca, 4212 Batangas';
    await sequelize.query(
      `UPDATE studio_settings SET studio_address = :address WHERE id = 1`,
      { replacements: { address: studioAddress } },
    ).catch(() => {});

    const packageRows = [
      {
        name: 'Candid', description: 'Good for 1 pax self-shoot package.', price: 299, duration: 15, max_people: 1, edited_photos: 4, printed_photos: 1,
        services: ['15 minutes photo selection', '1 backdrop', '30 raw copies', 'Free use of accessories'], image_url: '/studio-media/packages/candid-smooch.jpg',
      },
      {
        name: 'Smooch', description: 'Good for 2 pax self-shoot package.', price: 499, duration: 15, max_people: 2, edited_photos: 6, printed_photos: 5,
        services: ['15 minutes photo selection', '2 backdrops', '30 raw copies', 'Free use of accessories'], image_url: '/studio-media/packages/candid-smooch.jpg',
      },
      {
        name: 'Linked In', description: 'Good for 1–3 pax self-shoot package.', price: 699, duration: 20, max_people: 3, edited_photos: 8, printed_photos: 9,
        services: ['15 minutes photo selection', '3 backdrops', '30 raw copies', 'Free use of accessories'], image_url: '/studio-media/packages/linkedin-tangled.jpg',
      },
      {
        name: 'Tangled Up', description: 'Good for 1–5 pax self-shoot package.', price: 999, duration: 25, max_people: 5, edited_photos: 10, printed_photos: 10,
        services: ['15 minutes photo selection', 'Unlimited backdrop', 'All soft copies', 'Free use of accessories'], image_url: '/studio-media/packages/linkedin-tangled.jpg',
      },
      {
        name: 'Bum Up', description: 'Baby birthday shoot or monthly milestone package.', price: 1299, duration: 25, max_people: 1, edited_photos: 11, printed_photos: 11,
        services: ['15 minutes photo selection', 'Printed or plain backdrop', 'All soft copies', 'Free use of accessories'], image_url: '/studio-media/packages/bumup-flex.jpg',
      },
      {
        name: 'Flex Ur Tog', description: 'Graduation portrait package for 1–5 pax.', price: 1499, duration: 25, max_people: 5, edited_photos: 10, printed_photos: 5,
        services: ['20 minutes unlimited self shoot', '5 minutes with photographer', 'Unlimited backdrop with graduation backdrop', '10×8 photo frame', 'All soft copies'], image_url: '/studio-media/packages/bumup-flex.jpg',
      },
      {
        name: 'Group Hug', description: 'Family and group portrait package for 1–8 pax.', price: 1499, duration: 25, max_people: 8, edited_photos: 10, printed_photos: 11,
        services: ['25 minutes photoshoot with photographer', '15 minutes photo selection', 'Unlimited backdrop', 'All soft copies', 'Free use of accessories'], image_url: '/studio-media/packages/group-hug-threshold.jpg',
      },
      {
        name: 'Threshold', description: 'Prenuptial portrait package.', price: 2499, duration: 60, max_people: 2, edited_photos: 40, printed_photos: 11,
        services: ['1 hour photoshoot with photographer', 'Unlimited backdrop', '10×8 photo frame', 'All soft copies', 'Free use of accessories'], image_url: '/studio-media/packages/group-hug-threshold.jpg',
      },
      {
        name: 'Making A Wish', description: 'Birthday shoot package.', price: 2499, duration: 60, max_people: 1, edited_photos: 40, printed_photos: 11,
        services: ['1 hour photoshoot with photographer', 'Unlimited backdrop', '10×8 photo frame', 'All soft copies', 'Free use of accessories'], image_url: '/studio-media/packages/wish-maternity.jpg',
      },
      {
        name: 'Hold The Belly', description: 'Maternity portrait package.', price: 2499, duration: 30, max_people: 2, edited_photos: 11, printed_photos: 11,
        services: ['30 minutes photoshoot with photographer', 'Unlimited backdrop', '10×8 photo frame', 'All soft copies', 'Free use of accessories'], image_url: '/studio-media/packages/wish-maternity.jpg',
      },
    ];

    for (const pkg of packageRows) {
      const [found] = await sequelize.query(`SELECT id FROM packages WHERE lower(name)=lower(:name) LIMIT 1`, { replacements: { name: pkg.name } });
      if (found.length) {
        await sequelize.query(
          `UPDATE packages SET description=:description, price=:price, duration=:duration, max_people=:max_people, edited_photos=:edited_photos, printed_photos=:printed_photos, services=:services::json, image_url=:image_url, active=true, updated_at=NOW() WHERE id=:id`,
          { replacements: { ...pkg, services: JSON.stringify(pkg.services), id: found[0].id } },
        );
      } else {
        await queryInterface.bulkInsert('packages', [{ id: crypto.randomUUID(), ...pkg, services: JSON.stringify(pkg.services), active: true, created_at: new Date(), updated_at: new Date() }]);
      }
    }

    const [admins] = await sequelize.query(`SELECT id FROM users WHERE role='admin' ORDER BY created_at ASC LIMIT 1`);
    if (admins.length) {
      const authorId = admins[0].id;
      const seedPosts = [
        ['Group Hug & Threshold Packages', 'Explore our Group Hug and Threshold studio packages.', '/studio-media/packages-group-hug-threshold.jpg'],
        ['Candid & Smooch Packages', 'Simple and fun self-shoot packages for solo and duo sessions.', '/studio-media/packages-candid-smooch.jpg'],
        ['Bum Up & Flex Ur Tog Packages', 'Milestone and graduation packages from Pose and Pics.', '/studio-media/packages-bum-up-flex.jpg'],
        ['Making A Wish & Hold The Belly', 'Birthday and maternity portrait packages.', '/studio-media/packages-wish-maternity.jpg'],
        ['Linked In & Tangled Up Packages', 'Portrait packages for small groups and families.', '/studio-media/packages-linked-tangled.jpg'],
      ];
      for (const [title, caption, image_url] of seedPosts) {
        const [exists] = await sequelize.query(`SELECT id FROM posts WHERE title=:title LIMIT 1`, { replacements: { title } });
        if (!exists.length) {
          await queryInterface.bulkInsert('posts', [{ id: crypto.randomUUID(), author_id: authorId, title, caption, image_data: null, image_url, is_published: true, created_at: new Date(), updated_at: new Date() }]);
        }
      }
    }
  },
};
