var express = require('express');
var router = express.Router();

var sql = require("../db.js");

const winston = require('winston');
var currentDate = new Date().toJSON().slice(0,10)
 
var logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'products.js' },
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    // new winston.transports.File({ filename: `./bin/logs/error-${currentDate}.log`, level: 'error' }),
    new winston.transports.File({ filename: `./bin/logs/all-${currentDate}.log` }),
  ],
});

/* GET all assets */
router.get('/', function(req, res) {
  logger.info({
    message: '/assets api started',
    dateTime: new Date()
  });
    sql.query(
        `CALL get_allAssets()`,
        (err, rows) => {
          if (!err) {
            logger.info({
              message: '/assets loaded successfully',
              dateTime: new Date()
            });
            res.send(rows[0]);
          } else {
            logger.info({
              message: '/assets  failed to load',
              dateTime: new Date()
            });
            res.send({ error: 'Error' });
          }
        }
      );
});

router.get('/:id', function(req, res) {
  sql.query(
      `SELECT * FROM assets where asset_no = ?`,
      [req.params.id],
      (err, rows) => {
        if (!err) {
          res.send(rows);
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

router.post("/createAsset", function (req, res) {
  productImgArr = [];
  var sqlInsert =
    "INSERT INTO `assets`(`assetId`, `availability`) VALUES (?, ?)";
  sql.query(
    sqlInsert,
    [
      req.body.assets,
      1
    ],
    (err) => {
      if (!err) {
        res.send({message: 'Inserted Successfully'});
      } else {
        res.send({message: err});
      }
    }
  );
});

  // Update orders
router.put("/update/:id", (req, res) => {
    var id = req.params.id;
    var sqlUpdate = 'UPDATE assets SET availability= ?, startDate=?, EndDate=?, nextStartDate=? WHERE asset_no= ?';
    sql.query(
      sqlUpdate,
      [
        req.body.availability,
        req.body.startDate,
        req.body.expiryDate,
        req.body.nextStartDate,
        id
      ],
      (err, rows) => {
        if (!err) {
          res.send({'message': 'Asset status updated'});
          console.log('updated')
        } else {
          res.send({ error: err });
          console.log(err);
        }
      }
    );
  });

  
module.exports = router;