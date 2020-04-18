var express = require('express');
var router = express.Router();

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
