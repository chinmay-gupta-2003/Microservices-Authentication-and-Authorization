const express = require('express');
const morgan = require('morgan');

const appError = require('./utils/appError');
const { errorHandler } = require('./controllers/errorController');

const userRouter = require('./routes/userRoutes');
const authRouter = require('./routes/authRoutes');

const app = express();
app.use(express.json());

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use((req, res, next) => {
  req.requestedTime = new Date().toISOString();
  next();
});

app.use('/users', userRouter);
app.use('/auth', authRouter);

app.all('*', (req, res, next) => {
  next(new appError(`Unable to query ${req.originalUrl}`, 404));
});

app.use(errorHandler);

module.exports = app;
