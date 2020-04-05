'user strict';
var sql = require('./db.js');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const bodyparser = require('body-parser');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const constants = require('./constant/constUrl');
const port = process.env.PORT || 3000;

var indexRouter = require('./routes/index');
var productsRouter = require('./routes/products');
var authRouter = require('./auth/auth');
var categoryRouter = require('./routes/categories');
var brandRouter = require('./routes/brand');

var app = express();

app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json({limit: '50mb'}));
app.use(bodyparser.urlencoded({limit: '50mb', extended: true}));

app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());


// CORS Setup
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
  if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'PUT', 'POST', 'PATCH', 'DELETE', 'GET');
      return res.status(200).json({});
  }
});


// Passport
passport.serializeUser(function(user, done) {
done(null, user);
});

passport.deserializeUser(function(obj, done) {
done(null, obj);
});

passport.use(
new FacebookStrategy(
  {
    clientID: '356629928555679',
    clientSecret: '324f33ea1a83490d4b6a3bce532b0180',
    callbackURL: 'http://localhost:3000/auth/facebook/callback',
    profileFields: ["email", "name"]
  },
  function(accessToken, refreshToken, profile, done) {
    const { email, first_name, last_name } = profile._json;
    const userData = {
      email,
      firstName: first_name,
      lastName: last_name
    };
    console.log(userData);
    done(null, profile);
  }
)
);

passport.use(new GoogleStrategy({
  clientID: '499813159230-9cmbhghe7bvhauibvkohie1p09uu1ft4.apps.googleusercontent.com',
  clientSecret: 'VvyZw4p9_C14yiEExxlOWW1j',
  callbackURL: "http://localhost:3000/auth/google/callback"
},
function(accessToken, refreshToken, profile, done) {
console.log(profile);
done(null, profile);
}
));

app.listen(port, () => console.log(`App is running in ${port}`));

app.use('/', authRouter);
app.use('/products', productsRouter);
app.use('/category', categoryRouter);
app.use('/brand', brandRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
