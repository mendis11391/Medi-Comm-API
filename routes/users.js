var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  sql.query(
    `SELECT uid, uname, email, cart FROM USERS`,
    (err, rows, fields) => {
      if (!err) {
        res.send(rows);
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update cart
router.put("cart/:id", (req, res) => {
  var sqlUpdate = "UPDATE `USERS` SET `cart`= ? WHERE `uid` = ? and `email` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.cart,
      req.params.id,
      req.body.email
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
