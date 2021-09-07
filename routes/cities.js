var express = require('express');
var router = express.Router();

var sql = require("../db.js");

/* GET all cities */
router.get('/', function(req, res) {
    sql.query(
        `SELECT * FROM cities`,
        (err, rows) => {
          if (!err) {
            res.send(rows);
          } else {
            res.send({ error: 'Error' });
          }
        }
      );
});

router.get('/:id', function(req, res) {
  sql.query(
      `CALL get_cityById(${req.params.id}) `,
      (err, rows) => {
        if (!err) {
          res.send(rows[0]);
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

router.get('/taxes/:id', function(req, res) {
  sql.query(
      `CALL get_taxesByCity(${req.params.id}) `,
      (err, rows) => {
        if (!err) {
          res.send(rows[0]);
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

// Update deliveryDate
router.put('/', (req, res) => {
  // var sqlUpdate = "UPDATE `cities` SET `tentitiveDeleivery`= ? WHERE `cityname` = 'Bangalore'";
  var sqlUpdate = "UPDATE `cities` SET `tentitiveDeleivery` = (case when `cityid` = 'bangalore' then ? when `cityid` = 'hyderabad' then ? when `cityid` = 'mumbai' then ? when `cityid` = 'pune' then ? end) WHERE `cityid` in ('bangalore', 'hyderabad', 'mumbai', 'pune')";
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
  // var sqlUpdate = "UPDATE `cities` SET `tentitiveDeleivery`= ? WHERE `cityname` = 'Bangalore'";
  var sqlUpdate = "UPDATE `cities` SET `taxes` = (case when `cityid` = 'bangalore' then ? when `cityid` = 'hyderabad' then ? when `cityid` = 'mumbai' then ? when `cityid` = 'pune' then ? end) WHERE `cityid` in ('bangalore', 'hyderabad', 'mumbai', 'pune')";
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
    var unqCityId =
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
        `INSERT INTO cities(cityid, cityname) VALUES (?, ?)`, [unqCityId, req.body.cityname],
        (err) => {
          if (!err) {
            res.send({message: 'City Inserted Successfully'});
          } else {
            res.send({ error: 'Error' });
          }
        }
      );
});

module.exports = router;
