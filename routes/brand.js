var express = require("express");
var multer = require("multer");

var productImgArr = [];

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/brand");
  },
  filename: function (req, file, cb) {
    const dte = Date.now();
    let filename = `${dte}-${file.originalname}`;
    productImgArr.push(filename);
    cb(null, filename);
  },
});

var upload = multer({ storage: storage });

var router = express.Router();
const constants = require("../constant/constUrl");
var sql = require("../db.js");

// Verify token 
function verifyToken(req, res, next) {
  if(req.headers.origin===`${constants.frontendUrl}` || req.headers.origin===`${constants.frontendUrl}/iroadmin`){
    next();
  } else{
    return res.status(401).send("Unauthorized request");
  }
}

// Verify token and session valid time
// function verifyToken(req, res, next) {
//   if (!req.headers.authorization) {
//     return res.status(401).send("Unauthorized request");
//   }
//   let token = req.headers.authorization.split(" ")[1];
//   let reqTime = req.headers.authorization.split(" ")[2];

//   const refreshToken = `${token} ${reqTime}`;

//   const currentTime = new Date();
//   const reqTimeSplit = reqTime.split(",");
//   const reqCameTime = new Date(
//     reqTimeSplit[0],
//     reqTimeSplit[1],
//     reqTimeSplit[2],
//     reqTimeSplit[3],
//     reqTimeSplit[4],
//     reqTimeSplit[5],
//     reqTimeSplit[6]
//   );

//   if (token === "null") {
//     return res.status(401).send("Unauthorized request");
//   }

//   sql.query(
//     "select uname, token from admin where token LIKE CONCAT('%', ?, '%')",
//     [token],
//     (err, rows) => {
//       if (!err) {
//         if (rows.length > 0) {
//           const uname = rows[0].uname;
//           const tkn = rows[0].token;
//           const tkn1 = tkn.split(" ")[1];
//           const reqTimeSplit = tkn1.split(",");
//           const dbTime = new Date(
//             reqTimeSplit[0],
//             reqTimeSplit[1],
//             reqTimeSplit[2],
//             reqTimeSplit[3],
//             reqTimeSplit[4],
//             reqTimeSplit[5],
//             reqTimeSplit[6]
//           );

//           if (isTimeValid(dbTime, currentTime) >= 60) {
//             return res.status(403).send("Session Expired");
//           } else {
//             sql.query(
//               "update admin set token = ? where uname = ? and token LIKE CONCAT('%', ?, '%')",
//               [refreshToken, uname, token],
//               (err, rows) => {
//                 if (!err) {
//                   req.userId = rows;
//                   next();
//                 }
//               }
//             );
//           }
//         } else {
//           return res.status(401).send("Unauthorized request");
//         }
//       } else {
//         return res.status(401).send("Unauthorized request");
//       }
//     }
//   );
// }

function isTimeValid(dt2, dt1) {
  var diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}

// Get all brands
router.get("/", (req, res) => {
  sql.query(
    `CALL get_brands()`,
    (err, rows, fields) => {
      if (!err) {
        res.json(rows[0]);
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Get brand by product id
router.get("/:id", (req, res) => {
  let queryDta = `SELECT * FROM brand WHERE brand_id = '${req.params.id}'`;

  sql.query(queryDta, [req.params.id], (err, rows) => {
    if (!err) {
      res.send(rows);
    } else {
        res.send({ error: err });
    }
  });
});

// Delete a brand by id
router.delete('/:id', verifyToken, (req, res) => {
  mysqlConnection.query('delete from brand where brand_id = ?', [req.params.id], (err) => {
    if (!err) {
        res.send('Deleted succesfully');
    }
     else{
      res.send({ error: 'Error' });
    }
      
  })
});

// Update a brand information
router.put(":id", verifyToken,(req, res) => {
  var emp = req.body;
  var id = req.params.id;

  
  var sqlUpdate =
    "UPDATE `prod_details` SET `prod_name`= ?,`prod_price`= ?,`prod_img`= ?,`prod_description`= ?, `prod_qnty`= ?, `prod_add_date`=?  WHERE `prod_id` = ?";
  var sqlGet = "select * from prod_details where id = ?";
  sql.query(
    sqlUpdate,
    [
      emp.prod_id,
      emp.prod_details,
      emp.prod_price,
      emp.prod_img,
      emp.prod_description,
      emp.prod_qnty,
      emp.prod_add_date,
    ],
    (err) => {
      if (!err){
        sql.query(sqlGet, [id], (err, rows) => {
          if (!err) {
            sql.query(prodUpdate, [emp.brand], (err) => {
              if(!err) {
                res.send({'message': 'Update Successfully'});
              }
            });
          } else res.send("Error");
        });
      }
      else {res.send("Error")};
    }
  );
});

router.post("/", verifyToken,upload.array("prod_img", 12), function (req, res, next) {
  var imgName = productImgArr.join("[--split--]");
  productImgArr = [];
  var sqlInsert =
    "INSERT INTO `prod_details`(`prod_id`, `prod_name`,`prod_price`, `prod_img`, `prod_description`) VALUES (?, ?, ?, ?, ?)";
  var sqlBrandIns =
    "INSERT INTO `products`(`prod_id`,`prod_brand_id`,`prod_cat_id`,`prod_status`) values (?, ?, ?, ?)";
  sql.query(
    sqlInsert,
    [
      req.body.prod_id,
      req.body.prod_name,
      req.body.prod_price,
      imgName,
      req.body.prod_description
    ],
    (err) => {
      if (!err) {
        sql.query(
          sqlBrandIns,
          [req.body.prod_id, req.body.brand_name, "cat1234", "1"],
          (err1) => {
            if (!err1) {
              res.send({ res: "Inserted succesfully" });
            }
          }
        );
      } else {
        res.render("error", {
          message: "Oops something went wrong",
          error: { status: 400, stack: "" },
        });
      }
    }
  );
});

module.exports = router;
