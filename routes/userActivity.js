var express = require('express');
var router = express.Router();

var sql = require("../db.js");

/* GET all activities */
router.get('/', function(req, res) {
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

router.post("/createActivity", function (req, res) {
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