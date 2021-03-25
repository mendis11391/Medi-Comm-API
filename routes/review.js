var express = require("express");
var router = express.Router();

var sql = require("../db.js");

/* GET all reviews */
router.get('/', function(req, res) {
    sql.query(
        `SELECT * FROM review`,
        (err, rows) => {
          if (!err) {
            res.send(rows);
          } else {
            res.send({ error: 'Error' });
          }
        }
    );
});

router.post("/", function (req, res) {
    
    var sqlInsert =
      "INSERT INTO `review`(`name`, `email`, `rating`, `review_desc`) VALUES (?, ?, ?, ?)";
    sql.query(
      sqlInsert,
      [
        req.body.name,
        req.body.email,
        req.body.rating,
        req.body.reviewDescription,
      ],
      (err) => {
        if (!err) {
          res.send({message: 'Review Inserted Successfully'});
        } else {
          res.send({message: err});
        }
      }
    );
  });
  
  module.exports = router;
  