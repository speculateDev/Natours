const catchAsync = require('../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const APIFeatures = require('./../utilities/APIFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No Document found with that ID!`, 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    console.log(req.body);
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError('No Document found with that ID!', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    // const newTour = new Tour();
    // newtour.save();
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      // data: {
      //   tour: newTour
      // }
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    query = popOptions ? query.populate(popOptions) : query;

    const doc = await query;

    if (!doc) {
      return next(new AppError('No Document found with that ID!', 404));
    }

    await doc.save({ validateBeforeSave: false });

    // const tour = tours.find(el => el.id === +req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // Allow nested GET Reviews on tour(hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();
    // const tours = await query;

    // let filter = {};
    // if (req.params.tourId) filter = { tour: req.params.tourId };

    // const docs = await features.query.explain();
    const docs = await features.query;

    res.status(200).json({
      status: 'Success',
      requested: req.requestTime,
      results: docs.length,
      data: {
        data: docs
      }
    });
  });
