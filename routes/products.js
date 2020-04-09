var express = require("express");
var multer = require("multer");
const TokenGenerator = require("uuid-token-generator");

var productImgArr = [];

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/products");
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

          if (isTimeValid(dbTime, currentTime) > 2) {
            return res.status(403).send("Session Expired");
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
    `SELECT * FROM products a, prod_details b, brand c WHERE a.prod_id = b.prod_id and a.prod_brand_id = c.brand_id`,
    (err, rows, fields) => {
      if (!err) {
        rows.forEach((row, i) => {
          var splitPath = row.prod_img.split("[--split--]");
          row.prod_img = splitPath;
        });
        res.send(rows);
      } else {
        res.render("error", {
          message: "Oops something went wrong",
          error: { status: 400, stack: "" },
        });
      }
    }
  );
});

// Get product by product id
router.get("/:id", (req, res) => {
  let queryDta = `SELECT * FROM products a, prod_details b, brand c WHERE a.prod_id = "${req.params.id}" && a.prod_id = b.prod_id && c.brand_id = a.prod_brand_id`;

  let arr = [];
  sql.query(queryDta, [req.params.id], (err, rows) => {
    if (!err) {
      rows.forEach((row) => {
        var splitPath = row.prod_img.split("[--split--]");
        row.prod_img = splitPath;
      });

      rows.forEach((row) => {
        tenureSplit = row.prod_tenure.split("[--split--]");
        tenureSplit.forEach((a) => {
          arr.push(a.split(":"));
        });
        row.prod_tenure = arr;
      });
      res.send(rows);
    } else {
      res.send({ error: "error" });
    }
  });
});

// Delete a products by id
router.delete("/:id", verifyToken, (req, res) => {
  sql.query(
    "delete from products where prod_id = ?",
    [req.params.id],
    (err) => {
      if (!err) {
        sql.query(
          "delete from prod_details where prod_id = ?",
          [req.params.id],
          (err) => {
            if (!err) {
              res.send({ message: "Deleted Successfully" });
            }
          }
        );
      } else {
        res.send({ message: "Error in query execution" });
      }
    }
  );
});

// Update a product information
router.put("/:id", (req, res) => {
  var id = req.params.id;

  var prodUpdate =
    "UPDATE `products` SET `prod_brand_id`=?,`prod_cat_id`=?,`prod_status`=? WHERE `prod_id` = ?";
  var sqlUpdate = `UPDATE prod_details SET prod_name= '${req.body.title}',prod_price= '${req.body.price}',prod_description= '${req.body.description}',prod_ram= '${req.body.ram}',prod_disktype= '${req.body.disk_type}',prod_disksize= '${req.body.disk_size}',prod_specification= '${req.body.specifications}',prod_status= '${req.body.status}',prod_processor= '${req.body.processor}',prod_screensize= '${req.body.screen_size}',prod_tenure= '${req.body.tenureFinal}' WHERE prod_id = '${id}'`;
  var sqlGet = "select * from prod_details where prod_id = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.title,
      req.body.price,
      req.body.description,
      req.body.ram,
      req.body.disk_type,
      req.body.disk_size,
      req.body.specifications,
      req.body.status,
      req.body.processor,
      req.body.screen_size,
      req.body.tenureFinal,
    ],
    (err) => {
      if (!err) {
        sql.query(
          prodUpdate,
          [req.body.brand, req.body.category, req.body.status, id],
          (err) => {
            if (!err) {
              res.send({ message: "Update Successfully" });
            } else {
              res.send({ message: "Query failure" });
            }
          }
        );
      } else {
        res.send("Error");
      }
    }
  );
});

// Insert product
router.post("/", upload.array("product_image", 12), function (req, res, next) {
  var imgName = productImgArr.join("[--split--]");
  productImgArr = [];
  // const tokgen = new TokenGenerator(256, TokenGenerator.BASE71);
  // const prodId = `irentout-${tokgen.generate()}`;
  var dte = new Date();
  var rand = Math.floor(Math.random() * 9999 + 1);
  var unqProdId =
    "fci" +
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
    "INSERT INTO `prod_details`(`prod_id`, `prod_name`, `prod_price`, `prod_img`, `prod_description`, `prod_ram`, `prod_disktype`, `prod_disksize`, `prod_specification`, `prod_status`, `prod_processor`, `prod_screensize`, `prod_tenure`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  var sqlBrandIns =
    "INSERT INTO `products`(`prod_id`,`prod_brand_id`,`prod_cat_id`,`prod_status`) values (?, ?, ?, ?)";
  sql.query(
    sqlInsert,
    [
      unqProdId,
      req.body.name,
      req.body.price,
      imgName,
      req.body.description,
      req.body.ram,
      req.body.disk_type,
      req.body.disk_size,
      req.body.specifications,
      req.body.status,
      req.body.processor,
      req.body.screen_size,
      req.body.tenure,
    ],
    (err) => {
      if (!err) {
        sql.query(
          sqlBrandIns,
          [unqProdId, req.body.brand, req.body.category, req.body.status],
          (err1) => {
            if (!err1) {
              res.send({ res: "Inserted succesfully" });
            }
          }
        );
      } else {
        res.send(err);
      }
    }
  );
});

module.exports = router;
