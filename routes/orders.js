var express = require('express');
var router = express.Router();

var sql = require("../db.js");

/* GET all users */
router.get('/', function(req, res) {
  sql.query(
      `SELECT * FROM orders`,
      (err, rows) => {
        if (!err) {
          res.send(rows);
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

/* GET cart details */
router.get('/:id', function(req, res, next) {
  sql.query(
    `SELECT * FROM orders where userId = ?`,
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.send(rows);
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update users
router.put("/update", (req, res) => {
  var sqlUpdate = "UPDATE `users` SET `upass`= ? WHERE `uid` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.upass,
      req.body.id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'users updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

module.exports = router;
