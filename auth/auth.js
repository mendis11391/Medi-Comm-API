var express = require("express");
var crypto = require("crypto");
var passport = require("passport");
var router = express.Router();
const querystring = require("querystring");
const TokenGenerator = require("uuid-token-generator");
const constants = require("../constant/constUrl");
const Speakeasy = require("speakeasy");

const winston = require('winston');
var currentDate = new Date().toJSON().slice(0,10);

var logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'products.js' },
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    // new winston.transports.File({ filename: `./bin/logs/error-${currentDate}.log`, level: 'error' }),
    new winston.transports.File({ filename: `./bin/logs/all-${currentDate}.log` }),
  ],
});

// Verify token 
function verifyToken(req, res, next) {
  if(req.headers.origin===`${constants.frontendUrl}`){
    next();
  } else{
    return res.status(401).send("Unauthorized request");
  }
}

function ISTTime(){
  var currentTime = new Date();

  var currentOffset = currentTime.getTimezoneOffset();

  var ISTOffset = 330;   // IST offset UTC +5:30 

  var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);
  return ISTTime;
}
/********************txt local **** */
router.post('/smsOtp',(req,res)=>{
  var http = require('https');

  var urlencode = require('urlencode');
  
  var otp = req.body.otp;
  var msg=urlencode(`Dear user, ${otp} is your secure OTP for login to irentout.com.%nOTP is valid for 100 seconds. Please DO NOT share this OTP.%nWarm regards,%nTEAM Irentout.com`);
  
  var number=req.body.mobile;
  
  var username='santosh@reachfci.com';
  
  var hash='afb9b5fa88478754ecf0036bbaf520169e0fabe5614917be930f32512128717b'; // The hash key could be found under Help->All Documentation->Your hash key. Alternatively you can use your Textlocal password in plain text.
  
  var sender='IROOTP';
  
  var data='username='+username+'&hash='+hash+'&sender='+sender+'&numbers='+number+'&message='+msg
  
  var options = {
  
   
  
   host: 'api.textlocal.in',
  
    path: '/send?'+data
  
  };
  
   
  
  callback = function(response) {
  
    var str = '';
    //another chunk of data has been recieved, so append it to `str`
    response.on('data', function (chunk) {
  
      console.log(chunk)
    str += chunk;
  
    });
    //the whole response has been recieved, so we just print it out here
  
    response.on('end', function () {
  
    console.log(str);
  
    });
  
  }
  
  http.request(options, callback).end();
  res.send({ Mesaage: 'SMS sent'});
});

//sms for place order
router.post('/smsOrder',(req,res)=>{
  logger.info({
		message: '/smsOrder post authjs api started',
		dateTime: new Date()
	});
  var http = require('https');

  var urlencode = require('urlencode');
  
  var order = req.body.orderId;
  var customerName = req.body.customerName;
  // var msg=urlencode(`Dear ${customerName},%nYour order ${order} has been placed successfully. Complete your eKYC using below link%n%nhttps://irentout.com/eKYC %n%nRegards,%nTeam irentout.com`);
  var msg =urlencode(`Dear ${customerName},%nYour order ${order} has been placed successfully. Complete your eKYC using below link%n %n https://irentout.com/eKYC%n %nRegards,%nTeam irentout.com`);
  var number=req.body.mobile;
  
  var username='santosh@irentout.com';
  
  var hash='de6db89b313d3e12f5d785fd2c05553f9415045cb82610b5fcecbe728c6523d2'; // The hash key could be found under Help->All Documentation->Your hash key. Alternatively you can use your Textlocal password in plain text.
  
  var sender='IRENTO';
  
  var data='username='+username+'&hash='+hash+'&sender='+sender+'&numbers='+number+'&message='+msg
  
  var options = {
   host: 'api.textlocal.in',
  
    path: '/send?'+data
  
  };
  
   
  
  callback = function(response) {
  
    var str = '';
    //another chunk of data has been recieved, so append it to `str`
    response.on('data', function (chunk) {
  
      console.log(chunk)
    str += chunk;
  
    });
    //the whole response has been recieved, so we just print it out here
  
    response.on('end', function () {
  
    console.log(str);
  
    });
  
  }
  
  http.request(options, callback).end();
  // res.send({ Mesaage: 'SMS sent'});
});


//sms for delivery order
router.post('/smsDeliveredOrder',(req,res)=>{
  var http = require('http');

  var urlencode = require('urlencode');
  
  var order = req.body.orderId;
  var customerName = req.body.customerName;
  var msg=urlencode(`Dear ${customerName},%nYour order no. ${order} has been delivered successfully.%nTo check you assets: ${assetLink}%n%nWarm Regards,%nTeam irentout.com`);
  
  var number=req.body.mobile;
  
  var username='santosh@reachfci.com';
  
  var hash='afb9b5fa88478754ecf0036bbaf520169e0fabe5614917be930f32512128717b'; // The hash key could be found under Help->All Documentation->Your hash key. Alternatively you can use your Textlocal password in plain text.
  
  var sender='IRENTO';
  
  var data='username='+username+'&hash='+hash+'&sender='+sender+'&numbers='+number+'&message='+msg
  
  var options = {
   host: 'api.textlocal.in',
  
    path: '/send?'+data
  
  };
  
   
  
  callback = function(response) {
  
    var str = '';
    //another chunk of data has been recieved, so append it to `str`
    response.on('data', function (chunk) {
  
      console.log(chunk)
    str += chunk;
  
    });
    //the whole response has been recieved, so we just print it out here
  
    response.on('end', function () {
  
    console.log(str);
  
    });
  
  }
  
  http.request(options, callback).end();
  res.send({ Mesaage: 'SMS sent'});
});


/*****************End of txt local** */
var sql = require("../db.js");

// router.get(constants.facebookOpenUrl, passport.authenticate("facebook"));

// router.get(
//   constants.facebookCallback,
//   passport.authenticate("facebook", { failureRedirect: "/failure" }),
//   function (req, res) {
//     // email: req.user._json.email,
//     // firstname: req.user._json.first_name,
//     // lastname: req.user._json.last_name,
//     // id: req.user.id
//     const tokgen = new TokenGenerator(256, TokenGenerator.BASE71);
//     const token = tokgen.generate();

//     var secretkey = crypto.createCipher("aes-128-cbc", "i#rent*out-api&key");
//     var fbId = secretkey.update(req.user.id, "utf8", "hex");
//     fbId += secretkey.final("hex");

//     sql.query(
//       `select * from users where email = ? and logintype = 'Facebook'`,
//       [req.user._json.email],
//       (err, rows) => {
//         if (!err) {
//           if (rows.length <= 0) {
//             sql.query(
//               "INSERT INTO `users`(`uid`, `uname`, `upass`, `email`, `logintype`, `phone`, `wishlist`, `cart`, `token`,`address`, `billingaddress`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
//               [
//                 fbId,
//                 `${req.user._json.first_name} ${req.user._json.last_name}`,
//                 "",
//                 req.user._json.email,
//                 "Facebook",
//                 "N/A",
//                 "[]",
//                 "[]",
//                 token,
//                 "[]",
//                 "[]"
//               ],
//               (err, rows) => {
//                 if (!err) {
//                   return res.redirect(
//                     `${constants.frontendUrl}/?id=${req.user.id}&token=${token}&login=google&existing=false`
//                   );
//                 } else {
//                   res.send({
//                     token: null,
//                     authenticated: false,
//                     newUser: true,
//                   });
//                 }
//               }
//             );
//           } else {
//             const updateTokenQuery = `UPDATE users SET token=? where uid= ? and email = ?`;
//             sql.query(
//               updateTokenQuery,
//               [token, req.user.id, req.user._json.email],
//               (err, rows) => {
//                 if (!err) {
//                   return res.redirect(
//                     `${constants.frontendUrl}/?id=${req.user.id}&token=${token}&login=google&existing=true`
//                   );
//                 }
//               }
//             );
//           }
//         }
//       }
//     );
//   }
// );

// router.get(
//   "/auth/google",
//   passport.authenticate("google", {
//     scope: [
//       "https://www.googleapis.com/auth/userinfo.profile",
//       "https://www.googleapis.com/auth/userinfo.email",
//     ],
//   })
// );

// router.get(
//   "/auth/google/callback",
//   passport.authenticate("google", { failureRedirect: "/failure" }),
//   function (req, res) {
//     // email: req.user._json.email,
//     // firstname: req.user._json.name,
//     // id: req.user.id

//     const tokgen = new TokenGenerator(256, TokenGenerator.BASE71);
//     const token = tokgen.generate();

//     var secretkey = crypto.createCipher("aes-128-cbc", "i#rent*out-api&key");
//     var gpId = secretkey.update(req.user.id, "utf8", "hex");
//     gpId += secretkey.final("hex");

//     sql.query(
//       `select * from customer where email = ? `,
//       [req.user._json.email],
//       (err, rows) => {
//         if (!err) {
//           if (rows.length <= 0) {
//             sql.query(
//               "INSERT INTO `customer`(firstName, lastName, mobile, email, password, registeredAt, lastLogin, login_type, token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
//               [
//                 req.user._json.given_name,
//                 req.user._json.family_name,
//                 "",
//                 req.user._json.email,
//                 "N/A",
//                 new Date(),
//                 new Date(),
//                 "Google",
//                 token
//               ],
//               (err) => {
//                 if (!err) {
//                   return res.redirect(
//                     `${constants.frontendUrl}?uid=${rows[0].customer_id}&token=${token}&logintype=google&existinguser=false`
//                   );
//                 } else {
//                   res.send({
//                     token: null,
//                     authenticated: false,
//                     newUser: true,
//                     err: err
//                   });
//                 }
//               }
//             );
//           } else {
//             const updateTokenQuery = `UPDATE customer SET token=? where customer_id= ? and email = ?`;
//             sql.query(
//               updateTokenQuery,
//               [token, rows[0].customer_id, req.user._json.email],
//               (err) => {
//                 if (!err) {
//                   return res.redirect(
//                     `${constants.frontendUrl}/?uid=${rows[0].customer_id}&token=${token}&logintype=google&existinguser=true`
//                   );
//                 }
//               }
//             );
//           }
//         }
//       }
//     );
//   }
// );

// Admin Login
router.post("/login", verifyToken,(req, res) => {

  var secretkey = crypto.createCipher('aes-128-cbc', 'i#rent*out-api&key');
  var adpass = secretkey.update(req.body.password, 'utf8', 'hex')
  adpass += secretkey.final('hex');

  sql.query(
    `SELECT * from customer WHERE email = ? and password = ?`,
    [req.body.userName, adpass],
    (err, rows) => {
      if (!err) {
        if (rows.length > 0) {

          const tokgen = new TokenGenerator(256, TokenGenerator.BASE58);
          let token = tokgen.generate();

          const NoDtToken = token;

          const timeRef = new Date();
          const year = timeRef.getFullYear();
          const month = timeRef.getMonth();
          const curdate = timeRef.getDate();
          const curhours = timeRef.getHours();
          const curmin = timeRef.getMinutes();
          const cursec = timeRef.getSeconds();
          const curmilsec = timeRef.getMilliseconds();

          const finalCurTime = `${year},${month},${curdate},${curhours},${curmin},${cursec},${curmilsec}`;


          // token += ' ' + finalCurTime;
          
          const updateTokenQuery = `UPDATE customer SET token=? where email= ? and password = ?`;
          sql.query(
            updateTokenQuery,
            [token, req.body.userName, adpass],
            (err, rows) => {
              if (!err) {
                res.send({ token: NoDtToken, authenticated: true});
              }
            }
          );
        } else {
          res.send({ token: "error", authenticated: false });
        }
      } else {
        res.send({ token: "error", authenticated: false });
      }
    }
  );
});

// Customer Login
/* Required Parameters 
@email
@password
@logintype
*/
router.post("/userlogin",verifyToken, (req, res) => {
  // Encrypt Password before comparing
  const encryptedTime = crypto.createCipher('aes-128-cbc', 'irent@key*');
  let cryptPassword = encryptedTime.update(req.body.password, 'utf8', 'hex')
  cryptPassword += encryptedTime.final('hex');

  sql.query(
    `SELECT firstName from customer WHERE email = ? and password = ? and login_type = ?`,
    [req.body.email, cryptPassword, req.body.logintype],
    (err, rows) => {
      if (!err) {
        if (rows.length > 0) {
          const tokgen = new TokenGenerator(256, TokenGenerator.BASE71);
          const token = tokgen.generate();
          const updateTokenQuery = `UPDATE customer SET token = ? where email= ? and password = ? and login_type = ?`;
          sql.query(
            updateTokenQuery,
            [token, req.body.email, cryptPassword, req.body.logintype],
            (err, rows) => {
              if (!err) {
                res.send({ token: token, authenticated: true });
              }
            }
          );
        } else {
          res.send({ token: "error", authenticated: false });
        }
      } else {
        res.send({ token: "error", authenticated: false });
      }
    }
  );
});


router.post("/otplogin", verifyToken,(req, res) => {
  // Encrypt Password before comparing
  const encryptedTime = crypto.createCipher('aes-128-cbc', 'irent@key*');
  let cryptPassword = encryptedTime.update(req.body.otp, 'utf8', 'hex')
  cryptPassword += encryptedTime.final('hex');

  sql.query(
    `SELECT firstName from customer WHERE mobile = ? and password = ?`,
    [req.body.mobile, req.body.otp],
    (err, rows) => {
      if (!err) {
        if (rows.length > 0) {
          const tokgen = new TokenGenerator(256, TokenGenerator.BASE71);
          const token = tokgen.generate();
          const updateTokenQuery = `UPDATE customer SET token = ? where mobile= ? and password = ?`;
          sql.query(
            updateTokenQuery,
            [token, req.body.mobile, req.body.otp],
            (err, rows) => {
              if (!err) {
                res.send({ token: token, authenticated: true });
              }
            }
          );
        } else {
          res.send({ token: "error", authenticated: false });
        }
      } else {
        res.send({ token: "error", authenticated: false });
      }
    }
  );
});

/*
User Registration:
@Parameters
username
password
email
phone
*/
router.post("/register", verifyToken,(req, res) => {
  const uidtokgen = new TokenGenerator();
  const userToken = `irentout-${uidtokgen.generate()}`;
  const logintokgen = new TokenGenerator(256, TokenGenerator.BASE71);
  const logintoken = logintokgen.generate();

  // Encrypt Password
  const encryptedTime = crypto.createCipher('aes-128-cbc', 'irent@key*');
  let cryptPassword = encryptedTime.update(req.body.password, 'utf8', 'hex')
  cryptPassword += encryptedTime.final('hex');

  let insQuery =
    "INSERT INTO `customer`( `firstName`, `lastName`, `mobile`, `email`, `password`, `registeredAt`, `lastLogin`,`login_type`, `token`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  let checkUser = "select firstName from customer where email = ? and login_type = 'web'";
  sql.query(checkUser, [req.body.email], (err, rows) => {
    if (!err) {
      if (rows.length === 0) {
        sql.query(
          insQuery,
          [
            req.body.firstName,
            req.body.lastName,
            req.body.phone,
            req.body.email,
            cryptPassword,
            new Date(),
            new Date(),
            "web",
            logintoken
          ],
          (err, rows) => {
            if (!err) {
              res.send({
                status: "Successfully Registered",
                token: logintoken,
                authenticated: true,
              });
            } else {
              res.send({ authenticated: false });
            }
          }
        );
      } else {
        res.send({
          status: "User with this emailId is already registered",
          authenticated: false,
        });
      }
    } else {
      res.send({ error: "Query Error" });
    }
  });
});

router.post("/otpRegister",verifyToken, (req, res) => {
  const uidtokgen = new TokenGenerator();
  const userToken = `irentout-${uidtokgen.generate()}`;
  const logintokgen = new TokenGenerator(256, TokenGenerator.BASE71);
  const logintoken = logintokgen.generate();

  // Encrypt Password
  // const encryptedTime = crypto.createCipher('aes-128-cbc', 'irent@key*');
  // let cryptPassword = encryptedTime.update(req.body.password, 'utf8', 'hex')
  // cryptPassword += encryptedTime.final('hex');

  let insQuery =
    "INSERT INTO `customer`( `firstName`, `lastName`, `mobile`, `email`, `password`, `registeredAt`, `lastLogin`,`login_type`, `token`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  let checkUser = "select firstName from customer where mobile = ? and login_type = 'web'";
  sql.query(checkUser, [req.body.phone], (err, rows) => {
    if (!err) {
      if (rows.length === 0) {
        sql.query(
          insQuery,
          [
            req.body.firstName,
            req.body.lastName,
            req.body.phone,
            req.body.email,
            req.body.password,
            new Date(),
            new Date(),
            "web",
            logintoken
          ],
          (err1, results) => {
            if (!err1) {
              var sqlInsert = "INSERT INTO `cart`(`customer_id`,`products`,`modifiedAt`) VALUES (?,?,?)";
              sql.query(sqlInsert,
                [
                results.insertId,
                '[]',
                new Date()
                ]
              );
              var sqlInsert = "INSERT INTO `wishlist`(`customer_id`,`products`,`modifiedAt`) VALUES (?,?,?)";
              sql.query(sqlInsert,
                [
                results.insertId,
                '[]',
                new Date()
                ]
              );
              res.send({
                status: "Successfully Registered",
                token: logintoken,
                authenticated: true,
              });
            } else {
              res.send({ authenticated: false });
            }
          }
        );
      } else {
        res.send({
          status: "User with this emailId is already registered",
          authenticated: false,
        });
      }
    } else {
      res.send({ error: "Query Error" });
    }
  });
});

/************** OTP LOGIN ***************/

router.post("/totp-secret", (request, response, next) => {
  var secret = Speakeasy.generateSecret({ length: 20 });
  response.send({ "secret": secret.base32 });
});

router.post("/totp-generate", verifyToken,(request, response, next) => {
  response.send({
      "token": Speakeasy.totp({
          secret: request.body.secret,
          encoding: "base32"
      }),
      "remaining": (100 - Math.floor((new Date()).getTime() / 1000.0 % 100))
  });
});

router.post("/totp-validate", verifyToken,(request, response, next) => {
  var a  = Speakeasy.totp.verify({
    secret: request.body.secret,
    encoding: "base32",
    token: request.body.token,
    window: 1});
    console.log(a);
    response.send({
        "valid": a
    });
});

router.post('/otpUserdetails', verifyToken,(req, res) => {
  let getDetails = "select customer_id, firstName, login_type from customer where mobile = ?";
  sql.query(getDetails, [req.body.mobile], (err, rows) => {
    if (!err) {
      if (rows.length > 0) {
       res.send({'data': rows, authenticated: true});
      } else {
        res.send({'data': {}, authenticated: false});
      }
    }
  });
});

/*********End of OTP LOGIN *************/

router.get("/failure", (req, res) => {
  return res.redirect(`${constants.frontendUrl}/login`);
});


router.post('/userdetails', verifyToken,(req, res) => {
  let getDetails = "select customer_id, firstName, login_type from customer where token = ?";
  sql.query(getDetails, [req.body.token], (err, rows) => {
    if (!err) {
      if (rows.length > 0) {
       res.send({'data': rows, authenticated: true});
      } else {
        res.send({'data': {}, authenticated: false});
      }
    }
  });
});

router.post('/admindetails', verifyToken,(req, res) => {
  let getDetails = `SELECT customer_id, firstName FROM customer WHERE token = ? AND login_type= ?`;
  sql.query(getDetails, [req.body.token, 'admin'], (err, rows) => {
    if (!err) {
      if (rows.length > 0) {
       res.send({'data': rows, authenticated: true});
      } else {
        res.send({'data': {}, authenticated: false});
      }
    } else{
      res.send(err);
    }
  });
});

module.exports = router;
