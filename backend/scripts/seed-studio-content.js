require('dotenv').config();
const { sequelize, Package, Post, User } = require('../src/models');

const packages = [
  { name:'Candid', description:'Self-shoot package for one person.', price:299, duration:15, max_people:1, edited_photos:4, printed_photos:1, services:['15 minutes photo selection','1 backdrop','30 raw copies','Free use of accessories'], image_url:'/studio-media/packages/candid-smooch.jpg' },
  { name:'Smooch', description:'Self-shoot package for two people.', price:499, duration:15, max_people:2, edited_photos:6, printed_photos:5, services:['15 minutes photo selection','2 backdrops','30 raw copies','Free use of accessories'], image_url:'/studio-media/packages/candid-smooch.jpg' },
  { name:'Linked In', description:'Self-shoot package for small groups.', price:699, duration:20, max_people:3, edited_photos:8, printed_photos:9, services:['15 minutes photo selection','3 backdrops','30 raw copies','Free use of accessories'], image_url:'/studio-media/packages/linkedin-tangled.jpg' },
  { name:'Tangled Up', description:'Self-shoot package for families and groups.', price:999, duration:25, max_people:5, edited_photos:10, printed_photos:10, services:['15 minutes photo selection','Unlimited backdrop','All soft copies','Free use of accessories'], image_url:'/studio-media/packages/linkedin-tangled.jpg' },
  { name:'Bum Up', description:'Baby birthday or monthly milestone portrait session.', price:1299, duration:25, max_people:1, edited_photos:11, printed_photos:11, services:['15 minutes photo selection','Printed or plain backdrop','All soft copies','Free use of accessories'], image_url:'/studio-media/packages/bumup-flex.jpg' },
  { name:'Group Hug', description:'Photographer-assisted group portrait package.', price:1499, duration:25, max_people:8, edited_photos:10, printed_photos:11, services:['15 minutes photo selection','Unlimited backdrop','All soft copies','Free use of accessories'], image_url:'/studio-media/packages/group-hug-threshold.jpg' },
  { name:'Flex Ur Tog', description:'Graduation self-shoot plus photographer package.', price:1499, duration:25, max_people:5, edited_photos:10, printed_photos:5, services:['20 minutes self shoot','5 minutes with photographer','Unlimited backdrop with graduation backdrop','10x8 photo frame','All soft copies'], image_url:'/studio-media/packages/bumup-flex.jpg' },
  { name:'Threshold', description:'Prenuptial photographer-assisted portrait package.', price:2499, duration:60, max_people:2, edited_photos:40, printed_photos:11, services:['Unlimited backdrop','10x8 photo frame','All soft copies','Free use of accessories'], image_url:'/studio-media/packages/group-hug-threshold.jpg' },
  { name:'Making A Wish', description:'Birthday portrait package with photographer.', price:2499, duration:60, max_people:1, edited_photos:40, printed_photos:11, services:['Unlimited backdrop','10x8 photo frame','All soft copies','Free use of accessories'], image_url:'/studio-media/packages/wish-maternity.jpg' },
  { name:'Hold The Belly', description:'Maternity portrait session with photographer.', price:2499, duration:30, max_people:2, edited_photos:11, printed_photos:11, services:['Unlimited backdrop','10x8 photo frame','All soft copies','Free use of accessories'], image_url:'/studio-media/packages/wish-maternity.jpg' },
];

const seededPosts = [
  ['Our Studio Packages','Explore our Group Hug and Threshold studio packages.','/studio-media/packages/group-hug-threshold.jpg'],
  ['Candid & Smooch','Simple self-shoot packages for solo and pair portraits.','/studio-media/packages/candid-smooch.jpg'],
  ['Bum Up & Flex Ur Tog','Milestone and graduation portrait packages.','/studio-media/packages/bumup-flex.jpg'],
  ['Birthday & Maternity','Celebrate meaningful milestones with our photographer-assisted sessions.','/studio-media/packages/wish-maternity.jpg'],
  ['Linked In & Tangled Up','Studio packages for couples, friends, and families.','/studio-media/packages/linkedin-tangled.jpg'],
  ['Studio Portrait Highlight · 01','A recent Pose and Pics studio portrait highlight. Thank you for trusting us with your memories. 📸','/studio-media/posts/studio-highlight-01.jpg'],
  ['Studio Portrait Highlight · 02','Another favorite frame from the studio. Simple, warm, and made to keep. ✨','/studio-media/posts/studio-highlight-02.jpg'],
  ['Studio Portrait Highlight · 03','A fresh portrait session from Pose and Pics Photography Studio. 🤍','/studio-media/posts/studio-highlight-03.jpg'],
  ['Studio Portrait Highlight · 04','Captured at Pose and Pics — a studio moment worth remembering. 📷','/studio-media/posts/studio-highlight-04.jpg'],
  ['Studio Portrait Highlight · 05','One more studio favorite from our recent sessions. Thank you for being part of Pose and Pics. ✨','/studio-media/posts/studio-highlight-05.jpg'],
];

async function run(){
  await sequelize.authenticate();
  for (const item of packages) {
    const [pkg] = await Package.findOrCreate({ where:{ name:item.name }, defaults:{...item, active:true} });
    await pkg.update({ ...item, active:true });
  }
  const owner = await User.findOne({ where:{ role:'admin' }, order:[['created_at','ASC']] });
  if (owner) {
    for (const [title,caption,image_url] of seededPosts) {
      const [post] = await Post.findOrCreate({ where:{ title, author_id:owner.id }, defaults:{ author_id:owner.id,title,caption,image_url,is_published:true } });
      await post.update({ caption,image_url,is_published:true });
    }
    console.log(`Seeded owner posts for ${owner.email}`);
  } else {
    console.log('No owner/admin account found yet; package data seeded, owner posts skipped. Run this script again after an owner exists.');
  }
  console.log('Studio packages seeded/updated.');
  await sequelize.close();
}
run().catch(async e=>{console.error(e);try{await sequelize.close()}catch{}process.exit(1)});
