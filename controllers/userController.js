const User = require('../models/userModel');
const appError = require('../utils/appError');
const { deleteOne, updateOne, getOne, getAll } = require('./handlerFactory');

const filterObject = (obj, ...allowedFields) => {
  const filteredObject = {};

  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) filteredObject[key] = obj[key];
  });

  return filteredObject;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};

exports.updateUserData = async (req, res, next) => {
  try {
    if (req.body.password || req.body.confirmPassword)
      return next(
        new appError(
          'This route is not authorized for password update, use /updatePassword route!',
          400
        )
      );

    const filteredBody = filterObject(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        runValidators: true,
        new: true,
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Route not defined! Please use /signup instead',
  });
};

exports.getUser = getOne(User);
exports.getAllUsers = getAll(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);
