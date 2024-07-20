const mongoose = require('mongoose');
const AppError = require('./../utilities/appError');
const Tour = require('./tourModel');

// Parent refrencing since both the tour and the user are related to the review
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
      minLength: [10, 'A review must have at least 10 characters!']
    },
    rating: {
      type: Number,
      require: [true, 'Please a review must have a rating!'],
      min: [1, 'Rating must be above 1.0 !'],
      max: [5, 'Rating must be below 5.0 !']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour!']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'Review must belong to a user!']
    }
  },
  {
    // Virtual properties => outputed
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'user',
  //   select: 'name photo'
  // }).populate({
  //   path: 'tour',
  //   select: 'name'
  // });
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  console.log('tourId:', tourId);
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  console.log('stats', stats);

  if (stats.length === 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
    return;
  }
  // Persist calculated stats on tour
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating
  });
};

reviewSchema.post('save', function() {
  // USE POST instead as in pre the curr review isNot in collection YET
  // This points to current review
  // Review.calcAverageRatings(this.tour); won't work
  this.constructor.calcAverageRatings(this.tour);

  // Post middleware does nor access next
  // next();
});

// APplying the former to findByIdUpdate and findByIdDelete unattainable no document midleware, only query which does not give us access to the doc; aswe need to curr review so we can extract touId then calculate the statsfrom there
//findByIdAndUpdate and findByIdAndDelete are shorthand for => findOne
// reviewSchema.pre(/^findOneAnd/, async function(next) {
//   // even if it's a query we can just execute it
//   this.r = await this.findOne();
//   console.log(this.r);
// });

// reviewSchema.post(/^findOneAnd/, async function() {
//   this.r.constructor.calcAverageRatings(this.r.tour);
// });

reviewSchema.post(/^findOneAnd/, async function(doc, next) {
  // even if it's a query we can just execute it
  if (!doc) next(new AppError('No review exist with such ID!', 404));
  console.log('doc:', doc);
  await doc.constructor.calcAverageRatings(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
