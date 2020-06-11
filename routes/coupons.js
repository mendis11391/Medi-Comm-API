var express = require('express');
var router = express.Router();

var sql = require("../db.js");

/* GET all coupons */
router.get('/', function(req, res) {
    sql.query(
        `SELECT * FROM coupons`,
        (err, rows) => {
          if (!err) {
            res.send(rows);
          } else {
            res.send({ error: 'Error' });
          }
        }
      );
});

// Update deliveryDate
router.put('/', (req, res) => {
  // var sqlUpdate = "UPDATE `coupons` SET `tentitiveDeleivery`= ? WHERE `cityname` = 'Bangalore'";
  var sqlUpdate = "UPDATE `coupons` SET `tentitiveDeleivery` = (case when `cityid` = 'bangalore' then ? when `cityid` = 'hyderabad' then ? when `cityid` = 'mumbai' then ? when `cityid` = 'pune' then ? end) WHERE `cityid` in ('bangalore', 'hyderabad', 'mumbai', 'pune')";
  sql.query(
    sqlUpdate,
    [
      req.body.bangalore,
      req.body.hyderabad,
      req.body.mumbai,
      req.body.pune
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'days updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update Taxes
router.put('/taxes', (req, res) => {
  // var sqlUpdate = "UPDATE `coupons` SET `tentitiveDeleivery`= ? WHERE `cityname` = 'Bangalore'";
  var sqlUpdate = "UPDATE `coupons` SET `taxes` = (case when `cityid` = 'bangalore' then ? when `cityid` = 'hyderabad' then ? when `cityid` = 'mumbai' then ? when `cityid` = 'pune' then ? end) WHERE `cityid` in ('bangalore', 'hyderabad', 'mumbai', 'pune')";
  sql.query(
    sqlUpdate,
    [
      req.body.bangalore,
      req.body.hyderabad,
      req.body.mumbai,
      req.body.pune,
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'taxes updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Add new city
router.post('/', function(req, res) {
    var dte = new Date();
    var rand = Math.floor(Math.random() * 9999 + 1);
    var unqCouponId =
        "city" +
        rand +
        "-" +
        (dte.getMonth() + 1) +
        ":" +
        dte.getFullYear() +
        "-" +
        dte.getHours() +
        "-" +
        dte.getMinutes() +
        "-" +
        dte.getSeconds() +
        "-" +
        dte.getMilliseconds();

    sql.query(
        `INSERT INTO coupons(coupon_id, coupon_title, coupon_code, start_date, end_date, free_shipping, quantity, discount_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [unqCouponId, req.body.city_title, req.body.coupon_code, req.body.start_date, req.body.end_date, req.body.free_shipping, req.body.quantity, req.body.discount_type, req.body.status],
        (err) => {
          if (!err) {
            res.send({message: 'Coupon Inserted Successfully'});
          } else {
            res.send({ error: 'Error' });
          }
        }
      );
});

module.exports = router;
