// main.js
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import routes from './routes/routes.js'; // ✅ import router

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/uploads', express.static('uploads'));
app.use('/assets', express.static('assets'));

app.use(session({
  secret: 'secret key',
  saveUninitialized: true,
  resave: false,
}));

app.use((req, res, next) => {
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});

app.set('view engine', 'ejs');

// ✅ Use the imported router
app.use('', routes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).send('Something went wrong!');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// MongoDB connection
mongoose.connect(process.env.CONNECTION_STRING_MONGODB)
  .then(() => {
    console.log('CONNECTED TO DB');
    app.listen(PORT, () => {
      console.log(`Server started at port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
