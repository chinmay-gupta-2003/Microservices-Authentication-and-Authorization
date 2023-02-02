const AppError = require('../utils/appError');

exports.deleteOne = (Model) => async (req, res, next) => {
  try {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) return next(new AppError('Document not found!', 404));

    res.status(204).json({
      staus: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOne = (Model) => async (req, res, next) => {
  try {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) return next(new AppError('document not found!', 404));

    // Pre save middlewares
    await document.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: { document },
    });
  } catch (error) {
    next(error);
  }
};

exports.createOne = (Model) => async (req, res, next) => {
  try {
    const newDocument = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { newDocument },
    });
  } catch (error) {
    next(error);
  }
};

exports.getOne = (Model) => async (req, res, next) => {
  try {
    let query = Model.findById(req.params.id);

    const document = await query;
    if (!document) return next(new AppError('Document not found!', 404));

    res.status(200).json({
      status: 'success',
      data: { document },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAll = (Model) => async (req, res, next) => {
  try {
    const docs = await Model.find();

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs,
      },
    });
  } catch (error) {
    next(error);
  }
};
