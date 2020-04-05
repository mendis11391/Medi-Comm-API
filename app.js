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
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    callbackURL: constants.facebookCallbackfullurl,
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
clientID: process.env.GOOGLE_CLIENT_ID,
clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
