var express = require('express');
var router = express.Router();

var sql = require("../db.js");

/* GET cart details */
router.get('/cart/:id', function(req, res, next) {
  sql.query(
    `SELECT uid, uname, email, cart FROM USERS where token = ?`,
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

// Update cart
router.put("/cart/:id", (req, res) => {
  var sqlUpdate = "UPDATE `USERS` SET `cart`= ? WHERE `uid` = ?";
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

module.exports = router;
