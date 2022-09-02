var express = require("express");
var multer = require("multer");
const constants = require("../constant/constUrl");
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

const winston = require('winston');
var currentDate = new Date().toJSON().slice(0,10)
 
var logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'products.js' },
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    // new winston.transports.File({ filename: `./bin/logs/error-${currentDate}.log`, level: 'error' }),
    new winston.transports.File({ filename: `./bin/logs/all-${currentDate}.log` }),
  ],
});

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
  if(req.headers.origin===`${constants.frontendUrl}` || req.headers.origin===`${constants.frontendUrl}/admin`){
    next();
  } else{
    return res.status(401).send("Unauthorized request");
  }
}

function isTimeValid(dt2, dt1) {
  var diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}

// Get all categoris
router.get("/getMainCategory", (req, res) => { 
  logger.info({
    message: '/getMainCategory api started',
    dateTime: new Date()
  });
  let subCategories=[];
  let subItems=[];
  let len=0;
  sql.query(
    `CALL get_mainCategory()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/getMainCategory fetched successfully',
          dateTime: new Date()
        });
        rows[0].forEach((res)=>{
          subCategories.push(res);          
        });
      } else {
        logger.info({
          message: '/getMainCategory failed to load',
          dateTime: new Date()
        });
        res.send({ error: 'Error' });
      }

      subCategories.forEach((subCat,i,ele) => {
        sql.query(
          `CALL get_categoryByID(${subCat.id})`,
          (err2, rows2) => {
            if(!err2){
              len++;
              subCat.subItems = rows2[0];
              subItems.push(subCat); 
              if(len===ele.length){
                res.send(subItems);
              }
            }            
          });
      });
    }
  );
});

// Get all categoris
router.get("/getMainCategoryLite", (req, res) => { 
  logger.info({
    message: '/getMainCategoryLite api started',
    dateTime: new Date()
  });
  let subCategories=[];
  let subItems=[];
  let len=0;
  sql.query(
    `CALL get_mainCategory()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/getMainCategoryLite fetched successfully',
          dateTime: new Date()
        });
        rows[0].forEach((res)=>{
          subCategories.push(res);          
        });
      } else {
        logger.info({
          message: '/getMainCategoryLite failed to load',
          dateTime: new Date()
        });
        res.send({ error: 'Error' });
      }

      subCategories.forEach((subCat,i,ele) => {
        sql.query(
          `CALL get_categoryByIDLite(${subCat.id})`,
          (err2, rows2) => {
            if(!err2){
              len++;
              subCat.subItems = rows2[0];
              subItems.push(subCat); 
              if(len===ele.length){
                res.send(subItems);
              }
            }            
          });
      });
    }
  );
});

// Get all categoris
router.get("/categoryAndSub", (req, res) => { 
  sql.query(
    `CALL mainAndSubCategory()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/categoryAndSub fetched successfully',
          dateTime: new Date()
        });
        res.json(rows[0]);
      } else {
        logger.info({
          message: '/categoryAndSub failed to load',
          dateTime: new Date()
        });
        res.send({ error: 'Error' });
      }
    }
  );
});

// Get all categoris
router.get("/categoryAndSub/:id", verifyToken,(req, res) => { 
  sql.query(
    `CALL get_catByCatGroupId(${JSON.stringify(req.params.id)})`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/categoryAndSub/:id fetched successfully',
          dateTime: new Date()
        });
        res.json(rows[0]);
      } else {
        logger.info({
          message: '/categoryAndSub/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Get all categoris
router.get("/", (req, res) => { 
  logger.info({
    message: '/all categories api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_categories()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/all categories fetched successfully',
          dateTime: new Date()
        });
        res.json(rows);
      } else {
        logger.info({
          message: '/all categories failed load',
          dateTime: new Date()
        });
        res.send({ error: 'Error' });
      }
    }
  );
});

// Get all categoris
router.get("/getCategoryMetaData/:id", (req, res) => { 
  sql.query(
    `CALL get_catMetaDataBySlug(${JSON.stringify(req.params.id)})`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/getCategoryMetaData fetched successfully',
          dateTime: new Date()
        });
        res.json(rows[0]);
      } else {
        logger.info({
          message: '/getCategoryMetaData failed to load',
          dateTime: new Date()
        });
        res.send({ error: 'Error' });
      }
    }
  );
});

// Get all category heading by slug
router.get("/getCatHeadingByslug/:id", (req, res) => {
  sql.query(
    `CALL get_CatHeadingByCatname(${JSON.stringify(req.params.id)})`,
    (err, rows, fields) => {
      if (!err) {
        res.json(rows[0]);
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Get all specs
router.get("/getAllSpecs", (req, res) => { 
  logger.info({
    message: '/all specs api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_all_specs()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/all specs fetched successfully',
          dateTime: new Date()
        });
        res.json(rows[0]);
      } else {
        logger.info({
          message: '/all specs failed load',
          dateTime: new Date()
        });
        res.send({ error: 'Error' });
      }
    }
  );
});

router.get("/getAllAccs", (req, res) => { 
  logger.info({
    message: '/all specs api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_AllAccessories()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/all specs fetched successfully',
          dateTime: new Date()
        });
        res.json(rows[0]);
      } else {
        logger.info({
          message: '/all specs failed load',
          dateTime: new Date()
        });
        res.send({ error: 'Error' });
      }
    }
  );
});

// Get all specs
router.get("/getAllScrollersNames", (req, res) => { 
  logger.info({
    message: '/ getAllScrollersNames api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_Allscrollers()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/getAllScrollersNames fetched successfully',
          dateTime: new Date()
        });
        res.json(rows[0]);
      } else {
        logger.info({
          message: '/getAllScrollersNames failed load',
          dateTime: new Date()
        });
        res.send({ error: 'Error' });
      }
    }
  );
});

// Add new city
router.post('/postCategorySpecs',verifyToken, function(req, res) {
  sql.query(
      `INSERT INTO category_specs(cat_id, spec_id, status) VALUES (?, ?, ?)`, [req.body.cat_id, req.body.spec_id, 1],
      (err) => {
        if (!err) {
          res.send({message: 'category_specs Inserted Successfully'});
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

// Delete a tenure discounts by id
router.delete('/deleteCategorySpecs/:id', verifyToken,(req, res) => {
  sql.query('DELETE FROM category_specs where cs_id = ?', [req.params.id], (err) => {
    if (!err) {
        res.send('Deleted succesfully');
    }
     else{
      res.send({ error: 'Error' });
    }
      
  })
});

// Get all specs by cat id
router.get("/getCategorySpecs", (req, res) => {
  sql.query(
    `CALL get_CategorySpecs()`,
    (err, rows, fields) => {
      if (!err) {
        res.json(rows[0]);
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Get all specs by cat id
router.get("/getSpecsByCatId/:id",verifyToken, (req, res) => {
  sql.query(
    `CALL get_CategorySpecsByCatId(${req.params.id})`,
    (err, rows, fields) => {
      if (!err) {
        res.json(rows[0]);
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Get all pricing schemes
router.get("/getAllPricingSchemes",verifyToken, (req, res) => {
  sql.query(
    `CALL get_allPricingSchemes()`,
    (err, rows, fields) => {
      if (!err) {
        res.json(rows[0]);
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update spec name and image
router.put("/updateSpecNameAndImage",verifyToken,(req, res) => {

  var sqlUpdate = "UPDATE `specifications` SET `spec_image`= ? WHERE `spec_id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.spec_image,
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

// Update spec name and image
router.put("/updateAccsImage",verifyToken, (req, res) => {

  var sqlUpdate = "UPDATE `accessories` SET `accessory_image`= ? WHERE `id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.accs_image,
      req.body.id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'accs image updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});


// Update specValue
router.put("/updateSpecValue", verifyToken,(req, res) => {

  var sqlUpdate = "UPDATE `specification_value` SET `spec_value`= ? WHERE `id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.spec_value,
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

// Update users specValue
router.put("/updateAccsValue",verifyToken, (req, res) => {

  var sqlUpdate = "UPDATE `accessories` SET `acceesory_name`= ? WHERE `id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.acceesory_name,
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

router.post("/", verifyToken, function (req, res) {
  var sqlInsert =
    "INSERT INTO `category`(`cat_group`, `cat_name`,`cat_heading`,`cat_image`,`slug`,`metaTitle`,`metaDescription`, `cat_schema`, `createdBy`,`modifiedBy`,`createdAt`, `modifiedAt`, `cat_status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  sql.query(
    sqlInsert,
    [
      req.body.mainCatName,
      req.body.subCatName,
      req.body.catHeading,
      '',
      req.body.subCatSlug,
      req.body.subCatMetaTitle,
      req.body.subCatMetaDescription,
      '',
      1,
      1,
      new Date(),
      new Date(),
      req.body.status
    ],
    (err, results) => {
      if (!err) {
        let specs = req.body.specNames;

        for(let i=0;i<specs.length;i++){
          var specsInsert = "INSERT INTO `category_specs`(`cat_id`,`spec_id`, `status`) VALUES (?, ?, ?)";
          sql.query(
            specsInsert,
            [
              results.insertId,
              specs[i],
              1
            ]
          );
        }
        // res.send({message: 'Inserted Successfully'});
      } else {
        res.send({message: err});
      }
    }
  );
});

router.post("/addSpecValue", verifyToken,function (req, res) {
  var sqlInsert =
    "INSERT INTO `specification_value`(`spec_id`, `spec_value`, `status`) VALUES (?, ?, ?)";
  sql.query(
    sqlInsert,
    [
      req.body.specId,
      req.body.specValue,
      1,
    ],
    (err, results) => {
      if (!err) {
        
        res.send({message: 'Spec value Inserted Successfully'});
      } else {
        res.send({message: err});
      }
    }
  );
});

module.exports = router;
