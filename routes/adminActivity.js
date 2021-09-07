var express = require('express');
var router = express.Router();

var sql = require("../db.js");

/* GET all activities */
router.get('/', function(req, res) {
    sql.query(
        `SELECT * FROM backend_activity`,
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
      "INSERT INTO `backend_activity`(`activity_id`,`user_id`, `activity_dateTime`, `activity_log`) VALUES (?, ?, ?, ?)";
    sql.query(
      sqlInsert,
      [
        req.body.activityId,
        req.body.userId,
        orderdatetime,
        req.body.activityLog
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