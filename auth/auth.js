var express = require("express");
var crypto = require("crypto");
var passport = require("passport");
var router = express.Router();
const querystring = require("querystring");
const TokenGenerator = require("uuid-token-generator");
const constants = require("../constant/constUrl");

var sql = require("../db.js");

router.get(constants.facebookOpenUrl, passport.authenticate("facebook"));

router.get(
  constants.facebookCallback,
  passport.authenticate("facebook", { failureRedirect: "/failure" }),
  function (req, res) {
    // email: req.user._json.email,
    // firstname: req.user._json.first_name,
    // lastname: req.user._json.last_name,
    // id: req.user.id
    const tokgen = new TokenGenerator(256, TokenGenerator.BASE71);
    const token = tokgen.generate();

    var secretkey = crypto.createCipher("aes-128-cbc", "i#rent*out-api&key");
    var fbId = secretkey.update(req.user.id, "utf8", "hex");
    fbId += secretkey.final("hex");

    sql.query(
      `select * from users where email = ? and logintype = 'Facebook'`,
      [req.user._json.email],
      (err, rows) => {
        if (!err) {
          if (rows.length <= 0) {
            sql.query(
              "INSERT INTO `users`(`uid`, `uname`, `upass`, `email`, `logintype`, `phone`, `wishlist`, `cart`, `token`,`address`, `billingaddress`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                fbId,
                `${req.user._json.first_name} ${req.user._json.last_name}`,
                "",
                req.user._json.email,
                "Facebook",
                "N/A",
                "[]",
                "[]",
                token,
                "[]",
                "[]"
              ],
              (err, rows) => {
                if (!err) {
                  return res.redirect(
                    `${constants.frontendUrl}/?id=${req.user.id}&token=${token}&login=google&existing=false`
                  );
                } else {
                  res.send({
                    token: null,
                    authenticated: false,
                    newUser: true,
                  });
                }
              }
            );
          } else {
            const updateTokenQuery = `UPDATE users SET token=? where uid= ? and email = ?`;
            sql.query(
              updateTokenQuery,
              [token, req.user.id, req.user._json.email],
              (err, rows) => {
                if (!err) {
                  return res.redirect(
                    `${constants.frontendUrl}/?id=${req.user.id}&token=${token}&login=google&existing=true`
                  );
                }
              }
            );
          }
        }
      }
    );
  }
);

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/failure" }),
  function (req, res) {
    // email: req.user._json.email,
    // firstname: req.user._json.name,
    // id: req.user.id

    const tokgen = new TokenGenerator(256, TokenGenerator.BASE71);
    const token = tokgen.generate();

    var secretkey = crypto.createCipher("aes-128-cbc", "i#rent*out-api&key");
    var gpId = secretkey.update(req.user.id, "utf8", "hex");
    gpId += secretkey.final("hex");

    sql.query(
      `select * from users where email = ? and logintype = 'Google'`,
      [req.user._json.email],
      (err, rows) => {
        if (!err) {
          if (rows.length <= 0) {
            sql.query(
              "INSERT INTO `users`(`uid`, `uname`, `upass`, `email`, `logintype`, `phone`, `wishlist`, `cart`, `token`,`address`, `billingaddress`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                req.user.id,
                req.user._json.name,
                "",
                req.user._json.email,
                "Google",
                "N/A",
                "[]",
                "[]",
                token,
                "[]",
                "[]"
              ],
              (err, rows) => {
                if (!err) {
                  return res.redirect(
                    `${constants.frontendUrl}?uid=${req.user.id}&token=${token}&logintype=google&existinguser=false`
                  );
                } else {
                  res.send({
                    token: null,
                    authenticated: false,
                    newUser: true,
                    err: err
                  });
                }
              }
            );
          } else {
            const updateTokenQuery = `UPDATE users SET token=? where uid= ? and email = ?`;
            sql.query(
              updateTokenQuery,
              [token, req.user.id, req.user._json.email],
              (err, rows) => {
                if (!err) {
                  return res.redirect(
                    `${constants.frontendUrl}/?uid=${req.user.id}&token=${token}&logintype=google&existinguser=true`
                  );
                }
              }
            );
          }
        }
      }
    );
  }
);

// Admin Login
router.post("/login", (req, res) => {

  var secretkey = crypto.createCipher('aes-128-cbc', 'i#rent*out-api&key');
  var adpass = secretkey.update(req.body.password, 'utf8', 'hex')
  adpass += secretkey.final('hex');

  sql.query(
    `SELECT * from admin WHERE uname = ? and passcode = ?`,
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
          
          const updateTokenQuery = `UPDATE admin SET token=? where uname= ? and passcode = ?`;
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
router.post("/userlogin", (req, res) => {
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

/*
User Registration:
@Parameters
username
password
email
phone
*/
router.post("/register", (req, res) => {
  const uidtokgen = new TokenGenerator();
  const userToken = `irentout-${uidtokgen.generate()}`;
  const logintokgen = new TokenGenerator(256, TokenGenerator.BASE71);
  const logintoken = logintokgen.generate();

  // Encrypt Password
  const encryptedTime = crypto.createCipher('aes-128-cbc', 'irent@key*');
  let cryptPassword = encryptedTime.update(req.body.password, 'utf8', 'hex')
  cryptPassword += encryptedTime.final('hex');

  let insQuery =
    "INSERT INTO `users`(`uid`, `uname`, `upass`, `email`, `logintype`, `phone`, `wishlist`, `cart`,`token`, `address`, `billingaddress`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  let checkUser = "select uname from users where email = ? and logintype = 'web'";
  sql.query(checkUser, [req.body.email], (err, rows) => {
    if (!err) {
      if (rows.length === 0) {
        sql.query(
          insQuery,
          [
            userToken,
            req.body.username,
            cryptPassword,
            req.body.email,
            "web",
            req.body.phone,
            "[]",
            "[]",
            logintoken,
            "[]",
            "[]"
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
          status: "User with this emil is already registered",
          authenticated: false,
        });
      }
    } else {
      res.send({ error: "Query Error" });
    }
  });
});

router.get("/failure", (req, res) => {
  return res.redirect(`${constants.frontendUrl}/login`);
});


router.post('/userdetails', (req, res) => {
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

router.post('/admindetails', (req, res) => {
  let getDetails = `SELECT user_id, uname, usertype, email FROM admin WHERE token = ?`;
  sql.query(getDetails, [req.body.token], (err, rows) => {
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
