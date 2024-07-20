// const fs = require('fs');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const factory = require('./handlerFactory');
const sharp = require('sharp');
const multer = require('multer');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// const upload = multer({ dest: 'public/img/users' });
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

// Remarque: 1 name (multiple files) upload.array('', 5(maxcount))

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // single file => req.file/ multiple => req.files
  // console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverFilename}`);

  req.body.imageCover = imageCoverFilename;

  // 2) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  console.log(req.body);
  next();
});

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8')
// );

// exports.idCheck = (req, res, next, val) => {
//   console.log(`Tour Id is: ${val}`);

//   if (+req.params.id > tours.length)
//     return res.status(404).json({
//       status: 'failed',
//       message: 'Invalid ID'
//     });
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   console.log('checking body....');
//   const content = req.body;

//   if (!content.name || !content.price)
//     return res.status(400).json({
//       status: 'Failed',
//       message: 'please provide the name and price properties!'
//     });

//   next();
// };

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // // 1A) Filtering
//   // const queryObj = { ...req.query };
//   // const excludedFields = ['page', 'sort', 'limit', 'fields'];

//   // excludedFields.forEach(el => delete queryObj[el]);
//   // console.log(req.query, queryObj);

//   // // 2A) Advanced Filtering
//   // let queryStr = JSON.stringify(queryObj);
//   // // console.log('Before:', queryStr);
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//   // // console.log('After:', queryStr);

//   // console.log(JSON.parse(queryStr));
//   // let query = Tour.find(JSON.parse(queryStr));

//   // // 2) Sorting
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(',').join(' ');
//   //   console.log(sortBy);
//   //   query = query.sort(sortBy);
//   //   // if equals secondary property:
//   //   //sort('price ratingAverage') // In the url Get (use comma)
//   // } else {
//   //   query = query.sort('-createdAt');
//   // }

//   // // 3) Field Limiting
//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(',').join(' ');
//   //   // Format: select('name duration price')
//   //   query = query.select(fields);
//   // } else {
//   //   // '-' = 'exclusion'
//   //   query = query.select('-__v');
//   // }

//   // // 4) Pagination
//   // const page = +req.query.page || 1;
//   // const limit = +req.query.limit || 100;
//   // const skip = (page - 1) * limit;

//   // console.log('page', page);
//   // // Format = page=2&limit=10, query.skip(20).limit(10) => 11-20, Page 2
//   // query = query.skip(skip).limit(limit);

//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if (skip >= numTours) throw new Error('This page does not exist!!');
//   // }

//   // !!Execute Query
//   // query is getting chained by multiple methodes: .sort().select().skip().limit
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .pagination();
//   // const tours = await query;
//   const tours = await features.query;

//   // const tours = await Tour.find({
//   //   duration: 5,
//   //   difficulty: 'easy'
//   // });

//   // const tours = await Tour.find()
//   // .where('duration')
//   // .equals(5)
//   // .where('difficulty')
//   // .equals('easy');

//   // Send Response
//   res.status(200).json({
//     status: 'Success',
//     requested: req.requestTime,
//     results: tours.length,
//     data: {
//       tours
//     }
//   });
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' });
//   // console.log(req.params);
//   // Tour.findOne({ _id: req.params.id })
//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   if (!tour) {
//     return next(new AppError('No Tour found with that ID!', 404));
//   }

//   // const tour = tours.find(el => el.id === +req.params.id);
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });

//   // res.status(404).json({
//   //   status: 'failed',
//   //   message: error
//   // });

exports.createTour = factory.createOne(Tour);
// // const newTour = new Tour();
// // newtour.save();
// const newTour = await Tour.create(req.body);

// res.status(201).json({
//   status: 'success',
//   // data: {
//   //   tour: newTour
//   // }
//   data: {
//     tour: newTour
//   }
// });

// try {
// } catch (error) {
//   res.status(400).json({
//     status: 'failed',
//     message: error
//   });
// }

exports.updateTour = factory.updateOne(Tour);
// res.status(400).json({
//   status: 'failed',
//   message: error
// });

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = async (req, res, next) => {
//   try {
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if (!tour) {
//       return next(new AppError('No Tour found with that ID!', 404));
//     }

//     res.status(204).json({
//       status: 'success',
//       data: null
//     });
//   } catch (error) {
//     res.status(404).json({
//       status: 'failed',
//       message: error
//     });
//   }
// };

// AGGREGATION
exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.7 } }
      },
      {
        $group: {
          // _id: null,
          _id: { $toUpper: '$difficulty' },
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      {
        $sort: { avgPrice: -1 } // 1 => ascending
      },
      {
        $match: { _id: { $ne: 'EASY' } }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'failed',
      message: error
    });
  }
};

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year; // 2021
  // console.log(year);
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates' // geting all the docs for each startDate
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        // _id: { $dateToString: { format: '%B', date: '$startDates' } },
        numTours: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTours: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan
    }
  });
  // res.status(404).json({
  // status: 'failed',
  // message: error
  // });
});

// '/tours-within/:distance/center/:latlng/unit/:unit',
// '/tours-within/233/center/34.111745,-118.113491/unit/mi',

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat, lng.', 400));
  }

  console.log(distance, lat, lng, unit);

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat, lng.', 400));
  }

  const distances = await Tour.aggregate([
    {
      // only have one geo alreeady specified index so recognition automatic
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: {
      data: distances
    }
  });
});
