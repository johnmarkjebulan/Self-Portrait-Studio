const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/packages', require('./packages'));
router.use('/appointments', require('./appointments'));
router.use('/payments', require('./payments'));
router.use('/notifications', require('./notifications'));
router.use('/feedback', require('./feedback'));
router.use('/posts', require('./posts'));
router.use('/settings', require('./settings'));
router.use('/schedules', require('./schedules'));
router.use('/availability', require('./availability'));
router.use('/analytics', require('./analytics'));
router.use('/activity-logs', require('./activity-logs'));
router.use('/public-stats', require('./public-stats'));

module.exports = router;
