var express = require('express');
var router = express.Router();
const constants = require("../constant/constUrl");
var sql = require("../db.js");

// Verify token 
function verifyToken(req, res, next) {
  if(req.headers.origin===`${constants.frontendUrl}`){
    next();
  } else{
    return res.status(401).send("Unauthorized request");
  }
}

/* GET all activities */
router.get('/', verifyToken,function(req, res) {
    sql.query(
        `SELECT * FROM user_activity`,
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
router.post('/postUserActivity',verifyToken, function(req, res) {
  sql.query(
      `INSERT INTO transactionlog(eventTypeId, sourceIP, customerId, transactionDate, transactionDescription, categoryId, productId, orderId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
       [req.body.eventTypeId, req.body.sourceIP, req.body.customerId, req.body.transactionDate, req.body.transactionDescription, req.body.categoryId,req.body.productId,req.body.orderId],
      (err) => {
        if (!err) {
          res.send({message: 'User activity Inserted Successfully'});
        } else {
          res.send({ error: 'Error:' +err });
        }
      }
    );
});

router.post("/createActivity", verifyToken,function (req, res) {
    datetime = new Date();
	orderDate = (this.datetime.getMonth()+1)+'/'+this.datetime.getDate()+'/'+this.datetime.getFullYear();
	orderTime = this.datetime.getHours()+':'+this.datetime.getMinutes()+':'+this.datetime.getSeconds();

	orderDateTime=[this.orderDate, this.orderTime];
	orderdatetime=JSON.stringify(orderDateTime);
    var sqlInsert =
      "INSERT INTO `user_activity`(`activity_id`, `activity_dateTime`, `activity_log`, `replacement_request`, `return_request`, `user_id`, `txnid`) VALUES (?, ?, ?, ?, ?, ?, ?)";
    sql.query(
      sqlInsert,
      [
        req.body.activity_id,
        orderdatetime,
        req.body.activity_log,
        req.body.replacement,
        req.body.return,
        req.body.user_id,
        req.body.txnid
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

  module.exports = router;