var express = require("express");
var multer = require("multer");

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

function verifyToken(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).send("Unauthorized request");
  }
  let token = req.headers.authorization.split(" ")[1];

  if (token === "null") {
    return res.status(401).send("Unauthorized request");
  }

  sql.query("select uname from admin where token = ?", [token], (err, rows) => {
    if (!err) {
      if (rows.length > 0) {
        req.userId = rows;
        next();
      } else {
        return res.status(401).send("Unauthorized request");
      }
    } else {
      return res.status(401).send("Unauthorized request");
    }
  });
}

// Get all products
router.get("/", verifyToken, (req, res) => {
  sql.query(
    `SELECT a.prod_id, b.proddtl_id, a.prod_brand_id, a.prod_cat_id,
  b.proddtl_name, b.proddtl_price, b.proddtl_img, b.proddtl_description, b.proddtl_qnty, b.proddtl_add_date,
  c.brand_name, c.brand_description, c.brand_image
  FROM products a, prod_details b, brand c WHERE a.prod_id = b.proddtl_id and a.prod_brand_id = c.brand_id`,
    (err, rows, fields) => {
      if (!err) {
        rows.forEach((row, i) => {
          var splitPath = row.proddtl_img.split("[--split--]");
          row.proddtl_img = splitPath;
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
  let queryDta = `SELECT a.prod_id, b.proddtl_id, a.prod_brand_id, a.prod_cat_id,
  b.proddtl_name, b.proddtl_price, b.proddtl_img, b.proddtl_description, b.proddtl_qnty,
  b.proddtl_add_date, c.brand_name, c.brand_description, c.brand_image FROM
  products a, prod_details b, brand c WHERE a.prod_id = '${req.params.id}' &&
  a.prod_brand_id = c.brand_id`;

  let arr = [];
  sql.query(queryDta, [req.params.id], (err, rows) => {
    if (!err) {
      rows.forEach((row, i) => {
        if (row.proddtl_id === row.prod_id) {
          var splitPath = row.proddtl_img.split("[--split--]");
          row.proddtl_img = splitPath;
          arr.push(row);
        }
      });
      res.send(arr);
    } else {
      res.render("error", {
        message: "Oops something went wrong",
        error: { status: 400, stack: queryDta },
      });
    }
  });
});

// Delete a product by id
router.delete("/:id", (req, res) => {
  sql.query("delete from employee where id = ?", [req.params.id], (err) => {
    if (!err) res.send({ res: "Deleted succesfully" });
    else
      res.render("error", {
        message: "Oops something went wrong",
        error: { status: 400, stack: "" },
      });
  });
});

// Update a product information
router.put(":id", (req, res) => {
  var emp = req.body;
  var id = req.params.id;

  var sqlUpdate =
    "UPDATE `prod_details` SET `proddtl_name`= ?,`proddtl_price`= ?,`proddtl_img`= ?,`proddtl_description`= ?, `proddtl_qnty`= ?, `proddtl_add_date`=?  WHERE `proddtl_id` = ?";
  var sqlGet = "select * from prod_details where id = ?";
  sql.query(
    sqlUpdate,
    [
      emp.proddtl_id,
      emp.prod_details,
      emp.proddtl_price,
      emp.proddtl_img,
      emp.proddtl_description,
      emp.proddtl_qnty,
      emp.proddtl_add_date,
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

router.post("/", upload.array("proddtl_img", 12), function (req, res, next) {
  var imgName = productImgArr.join("[--split--]");
  productImgArr = [];
  var sqlInsert =
    "INSERT INTO `prod_details`(`proddtl_id`, `proddtl_name`,`proddtl_price`, `proddtl_img`, `proddtl_description`, `proddtl_qnty`, `proddtl_add_date`) VALUES (?, ?, ?, ?, ?, ?, ?)";
  var sqlBrandIns =
    "INSERT INTO `products`(`prod_id`,`prod_brand_id`,`prod_cat_id`,`prod_status`) values (?, ?, ?, ?)";
  sql.query(
    sqlInsert,
    [
      req.body.proddtl_id,
      req.body.proddtl_name,
      req.body.proddtl_price,
      imgName,
      req.body.proddtl_description,
      req.body.proddtl_qnty,
      req.body.proddtl_add_date,
    ],
    (err) => {
      if (!err) {
        sql.query(
          sqlBrandIns,
          [req.body.proddtl_id, req.body.brand_name, "cat1234", "1"],
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
