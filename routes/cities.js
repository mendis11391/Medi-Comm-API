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

// Update deliveryDate
router.put('/', (req, res) => {
  var ctyValArr = Object.entries(req.body);
  var cty;
  var delvDte;
  ctyValArr.forEach((i) => {
    cty = i[0];
    delvDte = i[1];
    addCty(cty, delvDte);
  });

  function addCty(cty, delvDte) {
    var sqlUpdate = `UPDATE 'cities' SET 'tentitiveDeleivery'= ${delvDte} WHERE 'cityid' = ${cty}`;
    sql.query(
      sqlUpdate,
      (err, rows) => {
        if (!err) {
          res.send({'message': 'days updated'});
        } else {
          res.send({ error: err });
        }
      }
    );
  }

  
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
