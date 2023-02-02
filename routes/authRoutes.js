const express = require('express');

const {
  signUp,
  logIn,
  protect,
  generateRefreshToken,
  logout,
} = require('../controllers/authController');

const router = express.Router();

router.route('/signup').post(signUp);
router.route('/login').post(logIn);
router.route('/logout').post(protect, logout);
router.route('/token').post(generateRefreshToken);

module.exports = router;
