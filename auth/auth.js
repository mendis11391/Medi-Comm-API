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
    const query = querystring.stringify({
      email: req.user._json.email,
      firstname: req.user._json.first_name,
      lastname: req.user._json.last_name,
      id: req.user.id,
    });
    const tokgen = new TokenGenerator(256, TokenGenerator.BASE71);
    const token = tokgen.generate();
    sql.query(
      `select * from users where email = ?`,
      [req.user._json.email],
      (err, rows) => {
        if (!err) {
          if (rows.length <= 0) {
            sql.query(
              "INSERT INTO `users`(`uid`, `uname`, `email`, `logintype`, `token`) VALUES (?, ?, ?, ?, ?)"
            ,
              [
                req.user.id,
                `${req.user._json.first_name} ${req.user._json.last_name}`,
                req.user._json.email,
                "Facebook",
                token
              ], (err, rows) => {
                if (!err) {
                  return res.redirect(`http://localhost:4200/dashboard/default?id=${req.user.id}&token=${token}&login=google&existing=false`);
                } else {
                  res.send({token: null, authenticated: false, newUser: true });
                }
              });
          } else {
            const updateTokenQuery = `UPDATE users SET token=? where uid= ? and email = ?`;
            sql.query(updateTokenQuery, [token, req.user.id, req.user._json.email],
              (err, rows) => {
                if(!err) {
                  return res.redirect(`http://localhost:4200/dashboard/default?id=${req.user.id}&token=${token}&login=google&existing=true`);
                }
              });
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
    const query = querystring.stringify({
      email: req.user._json.email,
      firstname: req.user._json.name,
      id: req.user.id,
    });
    const tokgen = new TokenGenerator(256, TokenGenerator.BASE71);
    const token = tokgen.generate();
    sql.query(
      `select * from users where email = ?`,
      [req.user._json.email],
      (err, rows) => {
        if (!err) {
          if (rows.length <= 0) {
            sql.query(
              "INSERT INTO `users`(`uid`, `uname`, `email`, `logintype`, `token`) VALUES (?, ?, ?, ?, ?)"
            ,
              [
                req.user.id,
                req.user._json.name,
                req.user._json.email,
                "Google",
                token
              ], (err, rows) => {
                if (!err) {
                  return res.redirect(`http://localhost:4200/dashboard/default?id=${req.user.id}&token=${token}&login=google&existing=false`);
                } else {
                  res.send({token: null, authenticated: false, newUser: true });
                }
              });
          } else {
            const updateTokenQuery = `UPDATE users SET token=? where uid= ? and email = ?`;
            sql.query(updateTokenQuery, [token, req.user.id, req.user._json.email],
              (err, rows) => {
                if(!err) {
                  return res.redirect(`http://localhost:4200/dashboard/default?id=${req.user.id}&token=${token}&login=google&existing=true`);
                }
              });
          }
        }
      }
    );
  }
);

router.post("/login", (req, res) => {
  sql.query(
    `SELECT * from admin WHERE uname = ? and passcode = ?`,
    [req.body.userName, req.body.password],
    (err, rows) => {
      if (!err) {
        if (rows.length > 0) {
          const tokgen = new TokenGenerator(256, TokenGenerator.BASE71);
          const token = tokgen.generate();
          const updateTokenQuery = `UPDATE admin SET token=? where uname= ? and passcode = ?`;
          sql.query(
            updateTokenQuery,
            [token, req.body.userName, req.body.password],
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

router.get("/failure", (req, res) => {
  return res.redirect("http://localhost:4200/login");
});

module.exports = router;
