var express = require("express");
var multer = require("multer");

var productImgArr = [];

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/categories");
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

var sql = require("../db.js");

// function verifyToken(req, res, next) {
//   if (!req.headers.authorization) {
//     return res.status(401).send("Unauthorized request");
//   }
//   let token = req.headers.authorization.split(" ")[1];

//   if (token === "null") {
//     return res.status(401).send("Unauthorized request");
//   }

//   sql.query("select uname from admin where token = ?", [token], (err, rows) => {
//     if (!err) {
//       if (rows.length > 0) {
//         req.userId = rows;
//         next();
//       } else {
//         return res.status(401).send("Unauthorized request");
//       }
//     } else {
//       return res.status(401).send("Unauthorized request");
//     }
//   });
// }

// Verify token and session valid time
function verifyToken(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).send("Unauthorized request");
  }
  let token = req.headers.authorization.split(" ")[1];
  let reqTime = req.headers.authorization.split(" ")[2];

  const refreshToken = `${token} ${reqTime}`;

  const currentTime = new Date();
  const reqTimeSplit = reqTime.split(",");
  const reqCameTime = new Date(
    reqTimeSplit[0],
    reqTimeSplit[1],
    reqTimeSplit[2],
    reqTimeSplit[3],
    reqTimeSplit[4],
    reqTimeSplit[5],
    reqTimeSplit[6]
  );

  if (token === "null") {
    return res.status(401).send("Unauthorized request");
  }

  sql.query(
    "select uname, token from admin where token LIKE CONCAT('%', ?, '%')",
    [token],
    (err, rows) => {
      if (!err) {
        if (rows.length > 0) {
          const uname = rows[0].uname;
          const tkn = rows[0].token;
          const tkn1 = tkn.split(" ")[1];
          const reqTimeSplit = tkn1.split(",");
          const dbTime = new Date(
            reqTimeSplit[0],
            reqTimeSplit[1],
            reqTimeSplit[2],
            reqTimeSplit[3],
            reqTimeSplit[4],
            reqTimeSplit[5],
            reqTimeSplit[6]
          );

          if (isTimeValid(dbTime, currentTime) >= 60) {
            return res.status(401).send("Session Expired");
          } else {
            sql.query(
              "update admin set token = ? where uname = ? and token LIKE CONCAT('%', ?, '%')",
              [refreshToken, uname, token],
              (err, rows) => {
                if (!err) {
                  req.userId = rows;
                  next();
                }
              }
            );
          }
        } else {
          return res.status(401).send("Unauthorized request");
        }
      } else {
        return res.status(401).send("Unauthorized request");
      }
    }
  );
}

function isTimeValid(dt2, dt1) {
  var diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}

// Get all products
router.get("/", verifyToken, (req, res) => {
  sql.query(
    `SELECT * FROM category`,
    (err, rows, fields) => {
      if (!err) {
        res.send(rows);
      } else {
        res.send({ error: 'Error' });
      }
    }
  );
});

// Get product by categories id
router.get("/:id", (req, res) => {
  let queryDta = `SELECT * FROM category WHERE cat_id = '${req.params.id}'`;

  sql.query(queryDta, [req.params.id], (err, rows) => {
    if (!err) {
      res.send(rows);
    } else {
        res.send({ error: 'Error' });
    }
  });
});

// Delete a categories by id
router.delete('/:id', verifyToken, (req, res) => {
  mysqlConnection.query('delete from category where cat_id = ?', [req.params.id], (err) => {
    if (!err) {
        res.send('Deleted succesfully');
    }
     else{
      res.send({ error: 'Error' });
    }
      
  })
});

// Update a category information
router.put(":id", (req, res) => {
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
      if (!err)
        sql.query(sqlGet, [id], (err, rows) => {
          if (!err) {
            res.send(rows);
          } else res.send("Error");
        });
      else res.send("Error");
    }
  );
});

router.post("/", function (req, res) {
  productImgArr = [];
  var dte = new Date();
  var rand = Math.floor(Math.random() * 9999 + 1);
  var unqProdId =
    "fci-cat" +
    rand +
    "-" +
    dte.getDate() +
    ":" +
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
  var sqlInsert =
    "INSERT INTO `category`(`cat_id`, `cat_name`, `cat_desc`, `cat_image`) VALUES (?, ?, ?, ?)";
  sql.query(
    sqlInsert,
    [
      unqProdId,
      req.body.cat_name,
      'N/A',
      'N/A'
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
