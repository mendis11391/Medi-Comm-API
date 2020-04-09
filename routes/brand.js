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

// Get all brands
router.get("/", verifyToken, (req, res) => {
  sql.query(
    `SELECT * FROM brand`,
    (err, rows, fields) => {
      if (!err) {
        res.send(rows);
      } else {
        res.send({ error: 'Error' });
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
        res.send({ error: 'Error' });
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

router.post("/", upload.array("prod_img", 12), function (req, res, next) {
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
