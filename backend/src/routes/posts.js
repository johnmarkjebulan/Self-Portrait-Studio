const router = require('express').Router();
const { Post, User, PostLike } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLog');

const includeAuthor = [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }];

async function decorate(posts, userId = null) {
  return Promise.all(posts.map(async (post) => {
    const raw = post.toJSON ? post.toJSON() : post;
    const like_count = await PostLike.count({ where: { post_id: raw.id } });
    const liked_by_me = userId ? Boolean(await PostLike.findOne({ where: { post_id: raw.id, client_id: userId } })) : false;
    return { ...raw, like_count, liked_by_me };
  }));
}

router.get('/public', async (req, res, next) => {
  try {
    const posts = await Post.findAll({ where: { is_published: true }, include: includeAuthor, order: [['created_at', 'DESC']] });
    res.json({ posts: await decorate(posts) });
  } catch (err) { next(err); }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? {} : { is_published: true };
    const posts = await Post.findAll({ where, include: includeAuthor, order: [['created_at', 'DESC']] });
    res.json({ posts: await decorate(posts, req.user.role === 'client' ? req.user.id : null) });
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const imageData = String(req.body.image_data || '');
    const imageUrl = String(req.body.image_url || '').trim();
    if (!imageData.startsWith('data:image/') && !imageUrl.startsWith('/')) return res.status(400).json({ error: 'Please choose a valid image' });
    if (imageData && imageData.length > 7_000_000) return res.status(413).json({ error: 'Image is too large. Please upload an image under about 5 MB.' });
    const post = await Post.create({
      author_id: req.user.id,
      title: String(req.body.title || '').trim().slice(0, 180) || null,
      caption: String(req.body.caption || '').trim().slice(0, 5000) || null,
      image_data: imageData || null,
      image_url: imageUrl || null,
      is_published: req.body.is_published !== false,
    });
    await logActivity(req, 'CREATE_POST', 'Published a studio photo post', 'post', post.id);
    res.status(201).json({ post: { ...(await Post.findByPk(post.id, { include: includeAuthor })).toJSON(), like_count: 0, liked_by_me: false } });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const data = {};
    if (req.body.title !== undefined) data.title = String(req.body.title || '').trim().slice(0, 180) || null;
    if (req.body.caption !== undefined) data.caption = String(req.body.caption || '').trim().slice(0, 5000) || null;
    if (req.body.is_published !== undefined) data.is_published = Boolean(req.body.is_published);
    await post.update(data);
    const updated = await Post.findByPk(post.id, { include: includeAuthor });
    res.json({ post: (await decorate([updated]))[0] });
  } catch (err) { next(err); }
});

router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ error: 'Only clients can like studio posts.' });
    const post = await Post.findOne({ where: { id: req.params.id, is_published: true } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const existing = await PostLike.findOne({ where: { post_id: post.id, client_id: req.user.id } });
    let liked;
    if (existing) { await existing.destroy(); liked = false; }
    else { await PostLike.create({ post_id: post.id, client_id: req.user.id }); liked = true; }
    const like_count = await PostLike.count({ where: { post_id: post.id } });
    res.json({ liked, like_count });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    await post.destroy();
    await logActivity(req, 'DELETE_POST', 'Deleted a studio photo post', 'post', req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
