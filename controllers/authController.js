const { promisify } = require('util');
const User = require('../models/userModel');
const JWT = require('jsonwebtoken');
const AppError = require('../utils/appError');

const generateAccessToken = (id) =>
  JWT.sign({ id }, process.env.JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
  });

const generateRefreshToken = (id) =>
  JWT.sign({ id }, process.env.JWT_REFRESH_TOKEN_SECRET);

const createSendToken = (res, statusCode, user, refreshToken = null) => {
  const token = generateAccessToken(user._id);

  user.password = undefined;
  user.refreshToken = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    refreshToken,
    data: {
      user,
    },
  });
};

const getDecodedJWT = async (req, res, next, JWTSecret) => {
  try {
    let token;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer'))
      token = authHeader.split(' ')[1];

    if (!token)
      return next(new AppError('Unauthorised access, Please login!'), 401);

    const verifyJWT = promisify(JWT.verify);
    const decodedJWT = await verifyJWT(token, JWTSecret);

    return { token, decodedJWT };
  } catch (error) {
    next(error);
  }
};

exports.generateRefreshToken = async (req, res, next) => {
  try {
    const { token, decodedJWT } = await getDecodedJWT(
      req,
      res,
      next,
      process.env.JWT_REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedJWT.id);

    const lengthOfRefreshTokenArray = user.refreshToken.length;
    if (
      lengthOfRefreshTokenArray >= 2 &&
      token !== user.refreshToken[lengthOfRefreshTokenArray - 1]
    ) {
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Access denied! Invalid creditionals', 400));
    }

    const refreshToken = generateRefreshToken(decodedJWT.id);

    user.refreshToken.push(refreshToken);
    await user.save({ validateBeforeSave: false });

    createSendToken(res, 200, user, refreshToken);
  } catch (error) {
    next(error);
  }
};

exports.signUp = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new AppError('Please provide email and passwords', 400));

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.checkPassword(password, user.password)))
      return next(new AppError('Incorrect email or password', 401));

    const refreshToken = JWT.sign(
      { id: user._id },
      process.env.JWT_REFRESH_TOKEN_SECRET
    );

    user.refreshToken.push(refreshToken);
    await user.save({ validateBeforeSave: false });

    createSendToken(res, 200, user, refreshToken);
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    req.user.refreshToken = undefined;
    await req.user.save({ validateBeforeSave: false });

    res.status(204).json({
      status: 'success',
    });
  } catch (error) {
    next(error);
  }
};

exports.protect = async (req, res, next) => {
  try {
    const { _, decodedJWT } = await getDecodedJWT(
      req,
      res,
      next,
      process.env.JWT_ACCESS_TOKEN_SECRET
    );

    const currentUser = await User.findById(decodedJWT.id);

    if (!currentUser)
      return next(new AppError('User not found with this token!', 401));

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You do not have permission for this action', 403)
      );

    next();
  };
};

exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    if (!req.body.password)
      return next(new AppError('Please provide your password!', 400));

    if (!(await user.checkPassword(req.body.password, user.password)))
      return next(
        new AppError('Incorrect password, re-enter the correct password!', 401)
      );

    user.active = false;
    await user.save({ validateBeforeSave: false });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
