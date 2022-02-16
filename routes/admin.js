var express = require("express");
var router = express.Router();
const constants = require("../constant/constUrl");
var sql = require("../db.js");

// Verify token 
function verifyToken(req, res, next) {
  if(req.headers.origin===`${constants.frontendUrl}` || req.headers.origin===`${constants.frontendUrl}/admin`){
    next();
  } else{
    return res.status(401).send("Unauthorized request");
  }
}

/* GET all reviews */
router.get('/', verifyToken,function(req, res) {
    sql.query(
        `SELECT * FROM admin`,
        (err, rows) => {
          if (!err) {
            res.send(rows);
          } else {
            res.send({ error: 'Error' });
          }
        }
    );
});

router.get('/getCustomerRequests', verifyToken,function(req, res) {
  let len=0;
  sql.query(
      `CALL get_customerRequests() `,
      (err, rows) => {
        if (!err) {
          let requests = rows[0];
          for(let i=0;i<requests.length;i++){
            len++;
            requests[i].renewals_timline=JSON.parse(requests[i].renewals_timline); 
            if(len==requests.length){
              res.send(requests);   
            }
          }            
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

router.get('/:id', verifyToken,function(req, res, next) {
    sql.query(
      `SELECT user_id, uname, usertype, email FROM admin WHERE user_id = ?`,
      [req.params.id],
      (err, rows) => {
        if (!err) {
          res.send(rows);
        } else {
          res.send({ error: err });
        }
      }
    );
  });

// router.post("/", function (req, res) {
    
//     var sqlInsert =
//       "INSERT INTO `review`(`name`, `email`, `rating`, `review_desc`) VALUES (?, ?, ?, ?)";
//     sql.query(
//       sqlInsert,
//       [
//         req.body.name,
//         req.body.email,
//         req.body.rating,
//         req.body.reviewDescription,
//       ],
//       (err) => {
//         if (!err) {
//           res.send({message: 'Review Inserted Successfully'});
//         } else {
//           res.send({message: err});
//         }
//       }
//     );
//   });


  
  module.exports = router;
  