// routes/userRoutes.js
const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);
router.get('/profile',    ctrl.getProfile);
router.put('/profile',    ctrl.updateProfile);
router.put('/password',
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  validate,
  ctrl.changePassword
);

module.exports = router;