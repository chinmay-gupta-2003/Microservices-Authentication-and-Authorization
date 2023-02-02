const express = require('express');

const {
  protect,
  deactivateUser,
  restrictTo,
  updatePassword,
} = require('../controllers/authController');

const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserData,
  getMe,
} = require('../controllers/userController');

const router = express.Router();

// Use protect as middleware
router.use(protect);

router.route('/deactivateMe').patch(deactivateUser);
router.route('/updateMe').patch(updateUserData);
router.route('/me').get(getMe, getUser);

router.route('/').get(restrictTo('admin'), getAllUsers).post(createUser);

router.use(restrictTo('admin'));
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
