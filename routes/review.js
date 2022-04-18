var express = require("express");
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

/* GET all reviews */
router.get('/', verifyToken,function(req, res) {
    sql.query(
        `SELECT * FROM reviews where status=1`,
        (err, rows) => {
          if (!err) {
            res.send(rows);
          } else {
            res.send({ error: 'Error' });
          }
        }
    );
});

router.get('/getAllReviews', verifyToken, function(req, res) {
  sql.query(
      `SELECT * FROM reviews`,
      (err, rows) => {
        if (!err) {
          res.send(rows);
        } else {
          res.send({ error: 'Error' });
        }
      }
  );
});

/* GET all reviews */
router.get('/:id', verifyToken, function(req, res) {
  sql.query(
      `SELECT * FROM reviews WHERE customer_id=${req.params.id}`,
      (err, rows) => {
        if (!err) {
          res.send(rows);
        } else {
          res.send({ error: 'Error' });
        }
      }
  );
});


//frontend post review
router.post("/", verifyToken, function (req, res) {
    
    var sqlInsert =
      "INSERT INTO `reviews`(`customer_id`, `display_name`,`display_mobile`, `ratings`, `review`, `created_at`, `last_updated_at`,`status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    sql.query(
      sqlInsert,
      [
        req.body.uid,
        req.body.displayName,
        req.body.displayMobile,
        req.body.ratings,
        req.body.review,
        new Date(),
        new Date(),
        1
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


  //admin post review
router.post("/adminReview", verifyToken, function (req, res) {
    
  var sqlInsert =
    "INSERT INTO `reviews`(`customer_id`, `display_name`,`display_mobile`, `ratings`, `review`, `created_at`, `last_updated_at`,`status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  sql.query(
    sqlInsert,
    [
      0,
      req.body.displayName,
      req.body.displayMobile,
      req.body.ratings,
      req.body.review,
      req.body.postDate,
      req.body.postDate,
      1
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

// Update users specValue
router.put("/updateReviewValue", verifyToken,(req, res) => {

  var sqlUpdate = "UPDATE `reviews` SET `customer_id` = ?,`display_name`=?,`display_mobile`=?,`ratings`=?,`review`=?,`status`= ? WHERE `id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.customer_id,
      req.body.display_name,
      req.body.display_mobile,
      req.body.ratings,
      req.body.review,
      req.body.status,
      req.body.id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'users email updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});
  
  module.exports = router;
  