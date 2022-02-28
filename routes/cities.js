var express = require('express');
var router = express.Router();
const constants = require("../constant/constUrl");
var sql = require("../db.js");

const winston = require('winston');
var currentDate = new Date().toJSON().slice(0,10);

// Verify token 
function verifyToken(req, res, next) {
  if(req.headers.origin===`${constants.frontendUrl}`){
    next();
  } else{
    return res.status(401).send("Unauthorized request");
  }
}
 
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
  logger.info({
    message: '/cities by id api started',
    dateTime: new Date()
  });
  sql.query(
      `CALL get_cityById(${req.params.id}) `,
      (err, rows) => {
        if (!err) {
          logger.info({
            message: '/cities by id fetched successfully',
            dateTime: new Date()
          });
          res.send(rows[0]);
        } else {
          logger.info({
            message: '/cities by id failed to load',
            dateTime: new Date()
          });
          res.send({ error: 'Error' });
        }
      }
    );
});

router.get('/getAllDeliveryPincodes/:id', function(req, res) {
  logger.info({
    message: '/getAllDeliveryPincodes by id api started',
    dateTime: new Date()
  });
  sql.query(
      `CALL get_DeliveryPicodesById(${req.params.id}) `,
      (err, rows) => {
        if (!err) {
          logger.info({
            message: '/getAllDeliveryPincodes by id fetched successfully',
            dateTime: new Date()
          });
          res.send(rows[0]);
        } else {
          logger.info({
            message: '/getAllDeliveryPincodes by id failed to load',
            dateTime: new Date()
          });
          res.send({ error: 'Error' });
        }
      }
    );
});

router.get('/taxes/:id', function(req, res) {
  logger.info({
    message: '/taxes/:id api started',
    dateTime: new Date()
  });
  sql.query(
      `CALL get_taxesByCity(${req.params.id}) `,
      (err, rows) => {
        if (!err) {
          logger.info({
            message: '/taxes/:id fetched successfully',
            dateTime: new Date()
          });
          res.send(rows[0]);
        } else {
          logger.info({
            message: '/taxes/:id  failed to load',
            dateTime: new Date()
          });
          res.send({ error: 'Error' });
        }
      }
    );
});

// Update padding
router.put('/padding/:id', verifyToken,(req, res) => {
  var sqlUpdate = "UPDATE `cities` SET `city_padding`= ? WHERE `city_id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.bangalore,
      req.params.id
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

// Update padding
router.put('/serialNo/:id',verifyToken, (req, res) => {
  var sqlUpdate = "UPDATE `cities` SET `last_serial_no`= ? WHERE `city_id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.serialNo,
      req.params.id
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

// Update deliveryDate
router.put('/', verifyToken,(req, res) => {
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
router.put('/taxes', verifyToken,(req, res) => {
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
router.post('/', verifyToken,function(req, res) {
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
