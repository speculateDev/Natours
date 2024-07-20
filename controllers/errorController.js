const AppError = require('./../utilities/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateDB = err => {
  const message = `Duplicate field value: '${err.keyValue.name}'. Please use another value! `;
  return new AppError(message, 400);
};

const handleValidationErrorDb = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError(`Invalid Token. Please Log in again!`, 401);
const handleJWTExpire = () => new AppError(`Token expired. Please Log in again!`, 401);

//
const sendErrorDev = (err, req, res) => {
  console.log(err);
  // API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // RENDERED WEBSITE
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    console.log(err);
    // OPERATIONAL, trusted error: sent to the client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // PROGRAMMING or other unkwown error; don't leak details to the client
    console.error('ERROR⚡⚡:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!!'
    });
  }
  // B) RENDERED WEBSITE
  if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  } else {
    // PROGRAMMING or other unkwown error; don't leak details to the client
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later!'
    });
  }
};

module.exports = (err, req, res, next) => {
  //   console.log(err.stack);

  //Default status
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err, name: err.name, message: err.message || '' };

    // Invalid ID
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    // Duplicate ID
    else if (err.code === 11000) error = handleDuplicateDB(error);
    // Validation err
    else if (error.name === 'ValidationError') error = handleValidationErrorDb(error);

    // JWT Verification
    // WRONG STRING
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    // EXPIRED TOKEN
    if (error.name === 'TokenExpiredError') error = handleJWTExpire();
    sendErrorProd(error, req, res);
  }
};
