var express = require('express');
var router = express.Router();

var sql = require("../db.js");

/* GET all users */
router.get('/', function(req, res) {
  sql.query(
      `SELECT uid, uname, email, logintype, cart, address FROM users`,
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
    `SELECT uid, uname, email, cart FROM users where uid = ?`,
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

router.get('/checkemail/:emailEx', function(req, res) {
  sql.query(
      `SELECT count(*) AS emailidCount FROM users where email= ? and logintype = 'web'`,
      [req.params.emailEx],
      (err, rows) => {
        if (!err) {
          if(rows[0].emailidCount > 0 ) {
            res.send({message: '', status: true})
          } else {
            res.send({message: `Email Id doesn't exist`, status: false});
          }
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

/* GET cart details */
router.get('/cart/:id', function(req, res, next) {
  sql.query(
    `SELECT uid, uname, email, cart FROM users where token = ?`,
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

// Update users password
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

// Update cart
router.put("/cart/:id", (req, res) => {
  var sqlUpdate = "UPDATE `users` SET `cart`= ? WHERE `uid` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.cart,
      req.params.id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'cart updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update address
router.put("/address/:id", (req, res) => {
  var sqlUpdate = "UPDATE `users` SET `address`= ? WHERE `uid` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.address,
      req.params.id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'Address updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

module.exports = router;
