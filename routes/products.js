var express = require("express");
var multer = require("multer");
// const TokenGenerator = require("uuid-token-generator");
const constants = require("../constant/constUrl");
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
 

// Verify token 
function verifyToken(req, res, next) {
  if(req.headers.origin===`${constants.frontendUrl}`){
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
//   // const reqCameTime = new Date(
//   //   reqTimeSplit[0],
//   //   reqTimeSplit[1],
//   //   reqTimeSplit[2],
//   //   reqTimeSplit[3],
//   //   reqTimeSplit[4],
//   //   reqTimeSplit[5],
//   //   reqTimeSplit[6]
//   // );

//   if (token === "null") {
//     return res.status(401).send("Unauthorized request");
//   }

//   sql.query(
//     "select customer_id, token from customer where login_type='admin' AND token LIKE CONCAT('%', ?, '%')",
//     [token],
//     (err, rows) => {
//       if (!err) {
//         if (rows.length > 0) {
//           const customer_id = rows[0].customer_id;
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
//               "update customer set token = ? where customer_id = ? AND login_type = ?  AND token LIKE CONCAT('%', ?, '%')",
//               [refreshToken, customer_id,'admin', token],
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

// Get product by filters
// router.get("/filterProducts", (req, res) => {
//   let specs;
//   let singleFilter = `SELECT * FROM(
//     select * from prod_details where id IN(SELECT product_id FROM product_specs 
//   WHERE spec_id IN(select spec_id from specifications where spec_name ="RAM")
//   AND spec_value IN("4 GB"))
//   )t1`;

//   let multipleFilter = `INNER JOIN(
//     select * from prod_details where id IN(SELECT product_id FROM product_specs 
//     WHERE spec_id IN(select spec_id from specifications where spec_name ="diskSize")
//     AND spec_value IN("500 GB")))t2 on t1.id = t2.id`;

//   let length = specs.length;

//   if(length==1){
//     singleFilter
//   }else if(length>1){
//     for(let i=0;i<specs.length;i++){

//     }  
//   }

  

//   sql.query(queryDta, [req.params.id], (err, rows) => {
//     if (!err) {
//       res.send(rows);
//     } else {
//         res.send({ error: 'Error' });
//     }
//   });
// });

// Get all products
router.get("/getCityTimelineProduct/:id", (req, res) => { 
  logger.info({
    message: '/getCityTimelineProduct/:id api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_CityTimelineProductsById(${req.params.id})`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/getCityTimelineProduct/:id fetched successfully',
          dateTime: new Date()
        });
          res.send(rows[0]);
      } else {
        logger.info({
          message: '/getCityTimelineProduct/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Get all products
router.get("/", (req, res) => { 
  logger.info({
    message: '/products api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_products()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/products fetched successfully',
          dateTime: new Date()
        });
          res.send(rows[0]);
      } else {
        logger.info({
          message: '/products failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Get all products excluding city,qty,delivery_timeline
router.get("/getAllProducts", (req, res) => { 
  logger.info({
    message: '/products api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_AllProducts()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/products fetched successfully',
          dateTime: new Date()
        });
          res.send(rows[0]);
      } else {
        logger.info({
          message: '/products failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

router.get("/getAllProductsLite", (req, res) => { 
  logger.info({
    message: '/products api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_AllProductsLite()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/products fetched successfully',
          dateTime: new Date()
        });
          res.send(rows[0]);
      } else {
        logger.info({
          message: '/products failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

router.get("/prodById/:id", (req, res) => { 
  let products=[];
  var pro2=[];
  var len=0;
  var len2=0;
  logger.info({
    message: '/:id api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_productById(${req.params.id})`,
    (err, rows, fields) => {
      if (!err) {
        rows[0].forEach((res)=>{
          products.push(res);
          
        });
        logger.info({
          message: '/:id fetched successfully',
          dateTime: new Date()
        });
      } else {
        logger.info({
          message: '/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
      products.forEach((products,i,ele) => {
        sql.query(
          `CALL get_ProductSpecById(${products.product_id})`,
          (err1, rows1, fields) => {
            if (!err1) {  
              len++;
              // rows1[0].forEach((specs,i,el)=>{
              //   let specifics=[];
              //   len2++;
              //   specifics.push(specs.spec_value);
              //   if(len2===el.length){
              //     products.specs=specifics;
              //   }                
              // });
              let specObj={};
              for(let i=0;i<rows1[0].length;i++){
                // products[rows1[0][i].spec_name ] = rows1[0][i].spec_value;
                Object.assign(specObj, {[rows1[0][i].spec_name]:rows1[0][i].spec_value});
                // products.specs = specObj;
              }
              products.specs = specObj;
              // products.specs = rows1[0];  
              pro2.push(products); 
              if(len===ele.length){
                res.send(pro2);
              }
            }
          }
        ); 
        
      });
      
        
      
    }
  );
});

router.get("/adminProdById/:id", (req, res) => { 
  let products=[];
  var pro2=[];
  var len=0;
  var len2=0;
  logger.info({
    message: '/:id api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_productById(${req.params.id})`,
    (err, rows, fields) => {
      if (!err) {
        rows[0].forEach((res)=>{
          products.push(res);
          
        });
        logger.info({
          message: '/:id fetched successfully',
          dateTime: new Date()
        });
      } else {
        logger.info({
          message: '/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
      products.forEach((products,i,ele) => {
        sql.query(
          `CALL get_ProductSpecById(${products.product_id})`,
          (err1, rows1, fields) => {
            if (!err1) {  
              len++;
              // rows1[0].forEach((specs,i,el)=>{
              //   let specifics=[];
              //   len2++;
              //   specifics.push(specs.spec_value);
              //   if(len2===el.length){
              //     products.specs=specifics;
              //   }                
              // });
              let specObj={};
              for(let i=0;i<rows1[0].length;i++){
                // products[rows1[0][i].spec_name ] = rows1[0][i].spec_value;
                Object.assign(specObj, {[rows1[0][i].spec_id]:rows1[0][i].Spec_Value_Id});
                // products.specs = specObj;
              }
              products.specs = specObj;
              // products.specs = rows1[0];  
              pro2.push(products); 
              if(len===ele.length){
                res.send(pro2);
              }
            }
          }
        ); 
        
      });
      
        
      
    }
  );
});

// Get all product highlights by id
router.get("/getHighlights/:id", (req, res) => { 
  logger.info({
    message: '/getHighlights/:id api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_HighlitsByProductId(${req.params.id})`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/getHighlights/:id fetched successfully',
          dateTime: new Date()
        });
        res.json(rows[0]);
      } else {
        logger.info({
          message: '/getHighlights/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Get all products tenures
router.get("/getAllTenures", (req, res) => { 
  logger.info({
    message: '/getAllTenures api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_AllTenures()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/getAllTenures fetched successfully',
          dateTime: new Date()
        });
        res.json(rows[0]);
      } else {
        logger.info({
          message: '/getAllTenures failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Add new city
router.post('/postTenureDiscounts',verifyToken, function(req, res) {
  sql.query(
      `INSERT INTO tenure_discounts(priority, tenure_id, discount, discount_status) VALUES (?, ?, ?, ?)`, [req.body.priority, req.body.tenure_id, 0,1],
      (err) => {
        if (!err) {
          res.send({message: 'City Inserted Successfully'});
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

// Update users specValue
router.put("/productStocksAndTimeline",verifyToken, (req, res) => {

  var sqlUpdate = "UPDATE `products` SET `quantity` = ?, `delivery_timeline` = ? WHERE `id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.quantity,
      req.body.delivery_timeline,
      req.body.id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'productStocksAndTimeline updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update users specValue
router.put("/updateTenureDiscounts",verifyToken, (req, res) => {

  var sqlUpdate = "UPDATE `tenure_discounts` SET `discount`= ?, `default_tenure`=? WHERE `id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.discount,
      req.body.default_tenure,
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

// Delete a tenure discounts by id
router.delete('/deleteTenureDiscount/:id', (req, res) => {
  sql.query('DELETE FROM tenure_discounts where id = ?', [req.params.id], (err) => {
    if (!err) {
        res.send('Deleted succesfully');
    }
     else{
      res.send({ error: 'Error' });
    }
      
  })
});

// Get all products tenures
router.get("/getAllHighlights", (req, res) => { 
  logger.info({
    message: '/getAllHighlights api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_AllHighlights()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/getAllHighlights fetched successfully',
          dateTime: new Date()
        });
        res.json(rows[0]);
      } else {
        logger.info({
          message: '/getAllHighlights failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Get all products tenures
router.get("/tenures", (req, res) => { 
  logger.info({
    message: '/tenures api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_AllPriorityTenuresDiscounts()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/tenures fetched successfully',
          dateTime: new Date()
        });
        res.json(rows[0]);
      } else {
        logger.info({
          message: '/tenures failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Get all products tenures
router.get("/tenures/:id", (req, res) => { 
  logger.info({
    message: '/tenures/:id api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_tenure_by_priority(${req.params.id})`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/tenures/:id fetched successfully',
          dateTime: new Date()
        });
        res.json(rows);
      } else {
        logger.info({
          message: '/tenures/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Get all products tenures
router.get("/tenure/:id", (req, res) => { 
  logger.info({
    message: '/tenure/:id api started',
    dateTime: new Date()
  });
  let id = req.params.id;
  sql.query(
    `SELECT tenure_id, tenure, tenure_period, tenure_desc, tenure_status FROM tenure WHERE tenure=${id};`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/tenure/:id fetched successfully',
          dateTime: new Date()
        });
        res.json(rows);
      } else {
        logger.info({
          message: '/tenure/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

router.post("/postAccs",verifyToken, function (req, res) {
  productImgArr = [];

  var sqlInsert =
    "INSERT INTO `accessories`(`acceesory_name`, `accessory_image`, `status`) VALUES ( ?, ?, ?)";
  sql.query(
    sqlInsert,
    [
      req.body.accsName,
      req.body.accsIMage,
      req.body.accsStatus
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

router.post("/postSpecs",verifyToken, function (req, res) {
  productImgArr = [];

  var sqlInsert =
    "INSERT INTO `specifications`( `spec_name`, `spec_image`, `spec_status`) VALUES ( ?, ?, ?)";
  sql.query(
    sqlInsert,
    [
      req.body.spec_name,
      req.body.specIMage,
      req.body.spec_status
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

router.post("/postScroller",verifyToken, function (req, res) {

  var sqlInsert =
    "INSERT INTO `promotions`( `promotion_name`, `status`) VALUES (?, ?)";
  sql.query(
    sqlInsert,
    [
      req.body.scroller_name,
      req.body.scroller_status
    ],
    (err) => {
      if (!err) {
        res.send({message: 'Scroller Inserted Successfully'});
      } else {
        res.send({message: err});
      }
    }
  );
});

router.post("/postPromotionalProducts", verifyToken,function (req, res) {

  var sqlInsert =
    "INSERT INTO `promotional_products`( `promotion_id`, `product_id`, `position`, `status`) VALUES (?, ?, ?, ?)";
  sql.query(
    sqlInsert,
    [
      req.body.promotion_id,
      req.body.product_id,
      0,
      1
    ],
    (err) => {
      if (!err) {
        res.send({message: 'Scroller Inserted Successfully'});
      } else {
        res.send({message: err});
      }
    }
  );
});

// Delete a tenure discounts by id
router.delete('/deletePromotionProduct/:id', (req, res) => {
  sql.query('DELETE FROM promotional_products where id=?', 
  [
    req.params.id
  ], 
  (err) => {
    if (!err) {
        res.send('Deleted succesfully');
    }
     else{
      res.send({ error: 'Error' });
    }
      
  })
});
// router.post("/postSpecs", function (req, res) {
//   productImgArr = [];

//   var query = "INSERT INTO `specifications` SET ?",
//     values = {
//       spec_image: req.body.specIMage
//     };
//   sql.query(
//     query,
//     values,
//     (err) => {
//       if (!err) {
//         res.send({message: 'Inserted Successfully'});
//       } else {
//         res.send({message: err});
//       }
//     }
//   );
// });

// Get all products specs
router.get("/specs", (req, res) => {
  logger.info({
    message: '/specs api started',
    dateTime: new Date()
  }); 
  sql.query(
    `CALL get_product_specs()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/specs fetched successfully',
          dateTime: new Date()
        });
        res.json(rows[0]);
      } else {
        logger.info({
          message: '/specs failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Get all tenure by id
router.get("/getAllSpecValues", (req, res) => { 
  logger.info({
    message: '/getAllSpecValues api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_AllSpecValues()`,
    (err, rows, fields) => {
      if (!err) {
        res.json(rows[0]);
        logger.info({
          message: '/getAllSpecValues fetched successfully',
          dateTime: new Date()
        });
      } else {
        logger.info({
          message: '/getAllSpecValues failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Get all products specs by id
router.get("/specs/:id", (req, res) => { 
  logger.info({
    message: '/specs/:id api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_ProductSpecById(${req.params.id})`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/specs/:id fetched successfully',
          dateTime: new Date()
        });
        res.json(rows);
      } else {
        logger.info({
          message: '/specs/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Get all products specs by id
router.get("/getSpecsValuesById/:id", (req, res) => { 
  logger.info({
    message: '/specs/:id api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_specValueById(${req.params.id})`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/getSpecsValuesById/:id fetched successfully',
          dateTime: new Date()
        });
        res.json(rows[0]);
      } else {
        logger.info({
          message: '/getSpecsValuesById/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});


// Get all tenure by id
router.get("/getAllScrollerValues", (req, res) => { 
  logger.info({
    message: '/getAllScrollerValues api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_AllScrollerValues()`,
    (err, rows, fields) => {
      if (!err) {
        res.json(rows[0]);
        logger.info({
          message: '/getAllScrollerValues fetched successfully',
          dateTime: new Date()
        });
      } else {
        logger.info({
          message: '/getAllScrollerValues failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// // Get all get_AllScrollerValues2. this api call to be used only for admin part where product_id AS id
router.get("/getAllScrollerValues2", (req, res) => { 
  logger.info({
    message: '/get_AllScrollerValues2 api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_AllScrollerValues2()`,
    (err, rows, fields) => {
      if (!err) {
        res.json(rows[0]);
        logger.info({
          message: '/get_AllScrollerValues2 fetched successfully',
          dateTime: new Date()
        });
      } else {
        logger.info({
          message: '/get_AllScrollerValues2 failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});


// Get all tenure by id
// router.get("/:id", (req, res) => { 
//   logger.info({
//     message: '/get_tenureById/:id api started',
//     dateTime: new Date()
//   });
//   sql.query(
//     `CALL get_tenureById(${req.params.id})`,
//     (err, rows, fields) => {
//       if (!err) {
//         res.json(rows);
//         logger.info({
//           message: '/get_tenureById/:id fetched successfully',
//           dateTime: new Date()
//         });
//       } else {
//         logger.info({
//           message: '/get_tenureById/:id failed to load',
//           dateTime: new Date()
//         });
//         res.send({ error: err });
//       }
//     }
//   );
// });

//getProductsByCityId
router.get("/productsByCity/:id", (req, res) => { 
  let products=[];
  var pro2=[];
  var len=0;
  var len2=0;
  logger.info({
    message: '/productsByCity/:id api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_products_by_city(${req.params.id})`,
    (err, rows, fields) => {
      if (!err) {
        rows[0].forEach((res)=>{
          products.push(res);
          
        });
        logger.info({
          message: '/productsByCity/:id fetched successfully',
          dateTime: new Date()
        });
      } else {
        logger.info({
          message: '/productsByCity/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
      products.forEach((products,i,ele) => {
        if(products.priority){
          sql.query(
            `CALL get_ProductSpecById(${products.product_id})`,
            (err1, rows1, fields) => {
              if (!err1) {  
                sql.query(
                  `CALL get_DefaultTenurePrice(${products.priority}, ${products.tenure_base_price})`,
                  (err2, rows2) => {
                    if (!err2) {                      
                      len++;
                      let disPrice = rows2[0][0].discountPrice;                      
                      let specObj={};
                      for(let i=0;i<rows1[0].length;i++){
                        // products[rows1[0][i].spec_name ] = rows1[0][i].spec_value;
                        Object.assign(specObj, {[rows1[0][i].spec_name]:rows1[0][i].spec_value});
                        // products.specs = specObj;
                      }
                      products.specs = specObj;
                      if(disPrice){
                        products.defaultTenurePrice = disPrice;
                      } else{
                        products.defaultTenurePrice = 0;
                      }
                      // products.specs = rows1[0];  
                      pro2.push(products); 
                      if(len===ele.length){
                        res.send(pro2);
                      }
                    }
                  }
                );
                // rows1[0].forEach((specs,i,el)=>{
                //   let specifics=[];
                //   len2++;
                //   specifics.push(specs.spec_value);
                //   if(len2===el.length){
                //     products.specs=specifics;
                //   }                
                // });
                
              }
            }
          ); 
        }
        
      });
      
        
      
    }
  );
});

//getProductsByCityAndCatId
router.get("/productsByCityAndCatId/:id/:catslug", (req, res) => { 
  let products=[];
  var pro2=[];
  var len=0;
  var len2=0;
  logger.info({
    message: '/productsByCity/:id api started',
    dateTime: new Date()
  });
  console.log(req.params);
  sql.query(
    `CALL getProductByCityAndCatId(${req.params.id},${JSON.stringify(req.params.catslug)} )`,
    (err, rows, fields) => {
      if (!err) {
        rows[0].forEach((res)=>{
          products.push(res);
          
        });
        logger.info({
          message: '/productsByCity/:id fetched successfully',
          dateTime: new Date()
        });
      } else {
        logger.info({
          message: '/productsByCity/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
      if(products.length>0){
        products.forEach((products,i,ele) => {
          if(products.priority){
            sql.query(
              `CALL get_ProductSpecById(${products.product_id})`,
              (err1, rows1, fields) => {
                if (!err1) {  
                  sql.query(
                    `CALL get_DefaultTenurePrice(${products.priority}, ${products.tenure_base_price})`,
                    (err2, rows2) => {
                      if (!err2) {                      
                        len++;
                        let disPrice = rows2[0][0].discountPrice;                      
                        let specObj={};
                        for(let i=0;i<rows1[0].length;i++){
                          // products[rows1[0][i].spec_name ] = rows1[0][i].spec_value;
                          Object.assign(specObj, {[rows1[0][i].spec_name]:rows1[0][i].spec_value});
                          // products.specs = specObj;
                        }
                        products.specs = specObj;
                        if(disPrice){
                          products.defaultTenurePrice = disPrice;
                        } else{
                          products.defaultTenurePrice = 0;
                        }
                        // products.specs = rows1[0];  
                        pro2.push(products); 
                        if(len===ele.length){
                          res.send(pro2);
                        }
                      }
                    }
                  );
                  // rows1[0].forEach((specs,i,el)=>{
                  //   let specifics=[];
                  //   len2++;
                  //   specifics.push(specs.spec_value);
                  //   if(len2===el.length){
                  //     products.specs=specifics;
                  //   }                
                  // });
                  
                }
              }
            ); 
          }
          
        });
      } else{
        res.send(pro2);
      }
      
        
      
    }
  );
});

//getProductsByCityId
router.get("/productsDetailsByCityIdAndSlug/:id/:slug", (req, res) => { 
  let products=[];
  var pro2=[];
  var len=0;
  var len2=0;
  logger.info({
    message: '/productsDetailsByCityIdAndSlug/:id/:slug api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_ProductDetailsByCityIdAndSlug(${req.params.id}, ${JSON.stringify(req.params.slug)})`,
    (err, rows, fields) => {
      if (!err) {
        rows[0].forEach((res)=>{
          products.push(res);          
        });
        logger.info({
          message: '/productsDetailsByCityIdAndSlug/:id/:slug fetched successfully',
          dateTime: new Date()
        });
      } else {
        logger.info({
          message: '/productsDetailsByCityIdAndSlug/:id/:slug failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
      products.forEach((products,i,ele) => {
        if(products.priority){
          sql.query(
            `CALL get_ProductSpecById(${products.product_id})`,
            (err1, rows1, fields) => {
              if (!err1) {  
                sql.query(
                  `CALL get_DefaultTenurePrice(${products.priority}, ${products.tenure_base_price})`,
                  (err2, rows2) => {
                    if (!err2) {                                            
                      sql.query(
                        `CALL get_tenure_by_priority(${products.priority})`,
                        (err3, rows3) => {
                          if (!err3) {                      
                            len++;
                            let disPrice = rows2[0][0].discountPrice;                      
                            let specObj={};
                            for(let i=0;i<rows1[0].length;i++){
                              // products[rows1[0][i].spec_name ] = rows1[0][i].spec_value;
                              Object.assign(specObj, {[rows1[0][i].spec_name]:rows1[0][i].spec_value});
                              // products.specs = specObj;
                            }

                            products.tenures = rows3[0];
                            products.specs = specObj;
                            if(disPrice){
                              products.defaultTenurePrice = disPrice;
                            } else{
                              products.defaultTenurePrice = 0;
                            }
                            // products.specs = rows1[0];  
                            pro2.push(products); 
                            if(len===ele.length){
                              res.send(pro2);
                            }
                          }
                        }
                      );
                    }
                  }
                );
                
              }
            }
          ); 
        }
        
      });
      
        
      
    }
  );
});

router.get("/productsMetaDetailsByCityIdAndSlug/:id/:slug", (req, res) => { 
  let products=[];
  var pro2=[];
  var len=0;
  var len2=0;
  logger.info({
    message: '/productsMetaDetailsByCityIdAndSlug/:id/:slug api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_ProductMetaDetailsByCityIdAndSlug(${req.params.id}, ${JSON.stringify(req.params.slug)})`,
    (err, rows, fields) => {
      if (!err) {        
        logger.info({
          message: '/productsDetailsByCityIdAndSlug/:id/:slug fetched successfully',
          dateTime: new Date()
        });
        res.send(rows[0]);
      } else {
        logger.info({
          message: '/productsDetailsByCityIdAndSlug/:id/:slug failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
      
        
      
    }
  );
});


// Update users name
router.put("/updateProductQuantity/:id", verifyToken,(req, res) => {
  logger.info({
    message: '/updateProductQuantity/:id api started',
    dateTime: new Date()
  });
  var sqlUpdate = `CALL updateProductQty(${req.body.quantity},${req.params.id})`;
  sql.query(
    sqlUpdate,
    (err, rows) => {
      if (!err) {
        logger.info({
          message: '/updateProductQuantity/:id fetched successfully',
          dateTime: new Date()
        });
        res.send({'message': 'Product quantity updated'});
      } else {
        logger.info({
          message: '/updateProductQuantity/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});


// Get all products tenures
router.get("/blob/:id", (req, res) => { 
  logger.info({
    message: '/promotions/:id api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL getBlobById(${req.params.id})`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/promotions/:id fetched successfully',
          dateTime: new Date()
        });
        res.json(rows[0]);
      } else {
        logger.info({
          message: '/promotions/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Get all products
router.get("/accessories", (req, res) => { 
  logger.info({
    message: '/accessories api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_AllAccessories()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/accessories fetched successfully',
          dateTime: new Date()
        });
          res.send(rows[0]);
      } else {
        logger.info({
          message: '/accessories failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Get all products tenures
router.get("/accessories/:id", (req, res) => { 
  logger.info({
    message: '/accessories/:id api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_accessoriesByProductId(${req.params.id})`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/accessories/:id fetched successfully',
          dateTime: new Date()
        });
        res.send(rows);
      } else {
        logger.info({
          message: '/accessories/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Get all products tenures
router.get("/promos/promoNames", (req, res) => { 
  logger.info({
    message: '/promos/promoNames api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_allPromotionalNames()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/promos/promoNames fetched successfully',
          dateTime: new Date()
        });
        res.json(rows[0]);
      } else {
        logger.info({
          message: '/promos/promoNames failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Get all products tenures
router.get("/promos/promotions", (req, res) => { 
  var products=[];
  var pro2=[];
  var len=0;
  logger.info({
    message: '/promos/promotions api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_allPromotions()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/promos/promotions fetched successfully',
          dateTime: new Date()
        });
        // res.json(rows[0]);
        rows[0].forEach((res)=>{
          products.push(res);
          
        });
      } else {
        logger.info({
          message: '/promos/promotions failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
      products.forEach((products,i,ele) => {
        if(products.priority){
          sql.query(
            `CALL get_ProductSpecById(${products.product_id})`,
            (err1, rows1, fields) => {
              if (!err1) {  
                sql.query(
                  `CALL get_DefaultTenurePrice(${products.priority}, ${products.tenure_base_price})`,
                  (err2, rows2) => {
                    if (!err2) {                      
                      len++;
                      let disPrice = rows2[0][0].discountPrice;                      
                      let specObj={};
                      for(let i=0;i<rows1[0].length;i++){
                        // products[rows1[0][i].spec_name ] = rows1[0][i].spec_value;
                        Object.assign(specObj, {[rows1[0][i].spec_name]:rows1[0][i].spec_value});
                        // products.specs = specObj;
                      }
                      products.specs = specObj;
                      if(disPrice){
                        products.defaultTenurePrice = disPrice;
                      } else{
                        products.defaultTenurePrice = 0;
                      }
                      // products.specs = rows1[0];  
                      pro2.push(products); 
                      if(len===ele.length){
                        res.send(pro2);
                      }
                    }
                  }
                );
                // rows1[0].forEach((specs,i,el)=>{
                //   let specifics=[];
                //   len2++;
                //   specifics.push(specs.spec_value);
                //   if(len2===el.length){
                //     products.specs=specifics;
                //   }                
                // });
                
              }
            }
          ); 
        }
        
      });
    }
  );
});

// Get all products tenures
router.get("/promosScroll/:id", (req, res) => { 
  var products=[];
  var pro2=[];
  var len=0;
  logger.info({
    message: '/promotions/:id api started',
    dateTime: new Date()
  });
  sql.query(
    `CALL get_promotionsByID(${req.params.id})`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/promotions/:id fetched successfully',
          dateTime: new Date()
        });
        // res.json(rows[0]);
        rows[0].forEach((res)=>{
          products.push(res);
          
        });
      } else {
        logger.info({
          message: '/promotions/:id failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
      products.forEach((products,i,ele) => {
        if(products.priority){
          sql.query(
            `CALL get_ProductSpecById(${products.product_id})`,
            (err1, rows1, fields) => {
              if (!err1) {  
                sql.query(
                  `CALL get_DefaultTenurePrice(${products.priority}, ${products.tenure_base_price})`,
                  (err2, rows2) => {
                    if (!err2) {                      
                      len++;
                      let disPrice = rows2[0][0].discountPrice;                      
                      let specObj={};
                      for(let i=0;i<rows1[0].length;i++){
                        // products[rows1[0][i].spec_name ] = rows1[0][i].spec_value;
                        Object.assign(specObj, {[rows1[0][i].spec_name]:rows1[0][i].spec_value});
                        // products.specs = specObj;
                      }
                      products.specs = specObj;
                      if(disPrice){
                        products.defaultTenurePrice = disPrice;
                      } else{
                        products.defaultTenurePrice = 0;
                      }
                      // products.specs = rows1[0];  
                      pro2.push(products); 
                      if(len===ele.length){
                        res.send(pro2);
                      }
                    }
                  }
                );
                // rows1[0].forEach((specs,i,el)=>{
                //   let specifics=[];
                //   len2++;
                //   specifics.push(specs.spec_value);
                //   if(len2===el.length){
                //     products.specs=specifics;
                //   }                
                // });
                
              }
            }
          ); 
        }
        
      });
    }
  );
});

// Get all products by city
// router.get("/productsByCity/:city", (req, res) => {
//   let arr = [];
//   sql.query(
//     `get_products_by_city(${req.params.city})`,
//     (err, rows, fields) => {
//       if (!err) {
//         var tags = [];
//         rows.forEach((row, i) => {
//           tags.push(row.brand_name, row.prod_ram, row.prod_disksize, row.prod_processor, row.prod_disktype, row.prod_name, row.cat_name);
//           var splitPath = row.prod_img.split("[--split--]");
//           row.prod_img = splitPath;
//           row['prod_tags'] = tags;
//           tags = [];
//         });
//         rows.forEach((row) => {
//           tenureSplit = row.prod_tenure.split("[--split--]");
//           tenureSplit.forEach((a) => {
//             arr.push(a.split(":"));
//           });
//           row.prod_tenure = arr;
//           arr = [];
//         });
//         var collection = [];
//         rows.forEach((row, i) => {
//           if(row.prod_featured==1 && row.prod_bestseller==1 && row.prod_newproducts==1){
//             collection.push('Featured','Best Seller', 'New Arrival');
//           } else if(row.prod_featured==0 && row.prod_bestseller==1 && row.prod_newproducts==1){
//             collection.push('Best Seller', 'New Arrival');
//           } else if(row.prod_featured==0 && row.prod_bestseller==0 && row.prod_newproducts==1){
//             collection.push('New Arrival');
//           } else if(row.prod_featured==1 && row.prod_bestseller==1 && row.prod_newproducts==0){
//             collection.push('Featured','Best Seller');
//           } else if(row.prod_featured==1 && row.prod_bestseller==0 && row.prod_newproducts==0){
//             collection.push('Featured');
//           } else if(row.prod_featured==0 && row.prod_bestseller==1 && row.prod_newproducts==0){
//             collection.push('Best Seller');
//           }
//           row['collection'] = collection;
//           collection = [];
//         });
//         res.send(rows);
//       } else {
//         res.send({ error: err });
//       }
//     }
//   );
// });

// Get product by product id
// router.get("/:id", (req, res) => {
//   let queryDta = `SELECT * FROM products a, prod_details b, brand c WHERE a.prod_id = "${req.params.id}" && a.prod_id = b.prod_id && c.brand_id = a.prod_brand_id`;

//   let arr = [];
//   sql.query(queryDta, [req.params.id], (err, rows) => {
//     if (!err) {
//       rows.forEach((row) => {
//         var splitPath = row.prod_img.split("[--split--]");
//         row.prod_img = splitPath;
//       });

//       rows.forEach((row) => {
//         tenureSplit = row.prod_tenure.split("[--split--]");
//         tenureSplit.forEach((a) => {
//           arr.push(a.split(":"));
//         });
//         row.prod_tenure = arr;
//       });
//       res.send(rows[0]);
//     } else {
//       res.send({ error: err });
//     }
//   });
// });

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
        res.send({ error: err });
      }
    }
  );
});

// Update a product information
router.put("/:id",verifyToken, (req, res) => {
  var id = req.params.id;
  var specsLength = req.body.specs;
  var highlightLength = req.body.highlightType;
  var accessoriesLength = req.body.accessory;
  var prodUpdate =
  `UPDATE products SET cat_id=? WHERE product_id=?`;
  var prodDetailsUpdate =
    `UPDATE prod_details SET prod_name=?,metaTitle=?,metaDescription=?,metaKeywords=?,slug=?,prod_description=?, prod_image=?, securityDeposit=?,tenure_base_price=?,prod_status=?,priority=?, position=? WHERE id=?`;
  var prodSpecsDelete = `DELETE FROM product_specs WHERE product_id=?`;
  var prodSpecsInsert = "INSERT INTO `product_specs`(`product_id`, `spec_id`, `status`, `Spec_Value_id`) values (?, ?, ?, ?)";
  var prodHighlightsDelete =  `DELETE FROM prod_highlights WHERE product_id=?`;
  var prodHighlightsInsert = "INSERT INTO `prod_highlights`(`product_id`, `highlight_type`, `status`) values ( ?, ?, ?)";
  var accessoryDelete =  `DELETE FROM product_accessories WHERE product_id=?`;
  var accessoryInsert = "INSERT INTO `product_accessories`(`product_id`, `accessory_id`, `status`) values ( ?, ?, ?)";
  sql.query(
    prodDetailsUpdate,
    [
      req.body.productName,
      req.body.metaTitle,
      req.body.metaDescription,
      req.body.metaKeywords,
      req.body.slug,
      req.body.prodDescription,
      req.body.prodImage,
      req.body.securityDeposit,
      req.body.tenureBasePrice,
      req.body.prodStatus,
      req.body.priority,
      req.body.position,
      id
    ],
    (err) => {
      if (!err) {
        sql.query(
          prodUpdate,
          [
            req.body.subCatId,
            id
          ],
          (err6) => {
          }
        );

        sql.query(
          prodSpecsDelete,
          [
            id
          ],
          (err2) => {
          }
        );
      
        sql.query(
          prodHighlightsDelete,
          [
            id
          ],
          (err3) => {
          }
        );
      
        sql.query(
          accessoryDelete,
          [
            id
          ],
          (err4) => {
          }
        );
      
        for(let s in specsLength){
          if(specsLength[s]!=null){
            sql.query(
              prodSpecsInsert,
              [id, s, 1,specsLength[s]],
              (err5) => {
                if (!err5) {
                  // res.send({ res: "Inserted succesfully" });
                } else{
                  res.send({error:err5});
                }
              }
            );
          }
        }
        
        for(let j=0;j<highlightLength.length;j++){
          sql.query(
            prodHighlightsInsert,
            [id, highlightLength[j], 1],
            (err6) => {
              if (!err6) {
                // res.send({ res: "Inserted succesfully" });
              } else{
                res.send({error:err6});
              }
            }
          );
        }
      
        for(let k=0;k<accessoriesLength.length;k++){
          sql.query(
            accessoryInsert,
            [id, accessoriesLength[k], 1],
            (err7) => {
              if (!err7) {
                // res.send({ res: "Inserted succesfully" });
              } else{
                res.send({error:err7});
              }
            }
          );
        }
        res.send({ message: "Update Successfully" });
      } else {
        res.send({"Error": err});
      }
    }
  );

  

});

// Insert product
router.post("/",  verifyToken,function (req, res, next) {
  // var imgName = productImgArr.join("[--split--]");
  // productImgArr = [];

  // let prodModel = req.body.name.split(' ');
  // prodModel = prodModel.reverse();
  // prodModel = prodModel[0];

  // let categoryCode = req.body.categoryName;
  // categoryCode = categoryCode.substr(0, 3).toLocaleUpperCase();

  // const tokgen = new TokenGenerator(256, TokenGenerator.BASE71);
  // const prodId = `irentout-${tokgen.generate()}`;
  var dte = new Date();
  var rand = Math.floor(Math.random() * 9999 + 1);
  // var unqProdId =
  //   "fci" +
  //   rand +
  //   "-" +
  //   dte.getDate() +
  //   ":" +
  //   (dte.getMonth() + 1) +
  //   ":" +
  //   dte.getFullYear() +
  //   "-" +
  //   dte.getHours() +
  //   "-" +
  //   dte.getMinutes() ;

  // const prodCode = `IRO${categoryCode}${prodModel}${rand}`;

  var prodDetailsInsert =
    "INSERT INTO `prod_details`(`prod_id`, `offer_id`, `prod_name`, `metaTitle`,`metaDescription`,`metaKeywords`, `slug`, `prod_image`, `prod_description`, `prod_qty`, `securityDeposit`, `tenure_base_price`, `prod_status`, `publishedAt`, `startsAt`, `endsAt`, `priority`,`position`, `createdBy`, `modifiedBy`, `createdAt`, `modifiedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  var updateProdId = 'UPDATE prod_details SET `prod_id`=? WHERE id=?';
  var productsInsert =
    "INSERT INTO `products`( `product_id`, `quantity`, `prod_code`, `cat_id`, `brand_id`, `city_id`, `delivery_timeline`) values (?, ?, ?, ?, ?, ?, ?)";
  var prodSpecsInsert = "INSERT INTO `product_specs`(`product_id`, `spec_id`, `status`, `Spec_Value_Id`) values (?, ?, ?, ?)";  
  var prodHighlightsInsert = "INSERT INTO `prod_highlights`(`product_id`, `highlight_type`, `status`) values ( ?, ?, ?)";
  var accessoryInsert = "INSERT INTO `product_accessories`(`product_id`, `accessory_id`, `status`) values ( ?, ?, ?)";
  sql.query(
    prodDetailsInsert,
    [
      0,
      1,
      req.body.productName,
      req.body.metaTitle,
      req.body.metaDescription,
      req.body.metaKeywords,
      req.body.slug,
      req.body.prodImage,
      req.body.prodDescription,
      req.body.prodQty,
      req.body.securityDeposit,
      req.body.tenureBasePrice,
      req.body.prodStatus,
      new Date(),
      new Date(),
      new Date(),
      // req.body.publishedAt,
      // req.body.startsAt,
      // req.body.endsAt,
      req.body.priority,
      req.body.position,
      req.body.createdBy,
      req.body.modifiedBy,
      new Date(),
      new Date()
    ],
    (err, results) => {
      if (!err) {
        // let citiesLength = req.body.cityId;
        let citiesLength = ["1", "2", "3","4"];
        let specsLength = req.body.specs;
        let highlightLength = req.body.highlightType;
        let accessoriesLength = req.body.accessory;
        
        for(let i=0;i<citiesLength.length;i++){
          sql.query(
            productsInsert,
            [results.insertId, req.body.prodQty, '', req.body.subCatId, req.body.brandId, citiesLength[i], req.body.deliveryTimeline],
            (err1) => {
              if (!err1) {
                // res.send({ res: "Inserted succesfully" });
              } else{
                res.send({error:err1});
              }
            }
          );
        }

        for(let s in specsLength){
          if(specsLength[s]){
            sql.query(
              prodSpecsInsert,
              [results.insertId, s, 1, specsLength[s]],
              (err2) => {
                if (!err2) {
                  // res.send({ res: "Inserted succesfully" });
                } else{
                  res.send({error:err2});
                }
              }
            );
          }          
        }
        
        for(let j=0;j<highlightLength.length;j++){
          sql.query(
            prodHighlightsInsert,
            [results.insertId, highlightLength[j], 1],
            (err3) => {
              if (!err3) {
                // res.send({ res: "Inserted succesfully" });
              } else{
                res.send({error:err3});
              }
            }
          );
        }

        for(let k=0;k<accessoriesLength.length;k++){
          sql.query(
            accessoryInsert,
            [results.insertId, accessoriesLength[k], 1],
            (err4) => {
              if (!err4) {
                // res.send({ res: "Inserted succesfully" });
              } else{
                res.send({error:err4});
              }
            }
          );
        }
        
        let unqProdId = 'IRO'+results.insertId;
        sql.query(
          updateProdId,
          [unqProdId, results.insertId],
          (err0) => {
            if (!err0) {
              // res.send({ res: "Inserted succesfully" });
            } else{
              res.send({error:err0});
            }
          }
        );

      } else {
        logger.info({
          message: `failed to post products load. error:${err}`,
          dateTime: new Date()
        });
        res.send({error:err});
      }
    }
  );
});


// Get order by txn id
router.get("/ordDetails/:txnid", (req, res) => {
  let queryDta = `SELECT * FROM orders WHERE txnid = "${req.params.txnid}"`;

  let prodDetails = [];
  let prodid = [];
  sql.query(queryDta, (err, rows) => {
    if (!err) {
      rows.forEach((row) => {
        var orderDate = JSON.parse(row.orderdate);
        row['orderedProducts'] = JSON.parse(row.orderedProducts);
        var prodInf = JSON.parse(row.checkoutItemData);
        var pinf = JSON.parse(row.pinfo);
        row.orderdate = orderDate;
        row.checkoutItemData = prodInf;
        row.pinfo = pinf;
        row.selfpickup = row.selfpickup === '0' ? 'False' : 'True';

        row.prodIds = row.pinfo.join('","');

        let prodDta = `SELECT prod_img, prod_price, prod_name FROM prod_details Where prod_id IN ("${row.prodIds}")`;

        sql.query(prodDta, (err, rows1) => {
          if(!err ){
            rows1.forEach((row1) => {
              prodDetails.push(row1);
              row1.prod_img = row1.prod_img.split("[--split--]");
            });
          }
          // row.prdts = prodDetails;
          prodDetails.forEach((res, i) => {
            row.checkoutItemData[i]['imgArr'] = res.prod_img;
            row.checkoutItemData[i]['prodPrice'] = res.prod_price;
            row.checkoutItemData[i]['prodName'] = res.prod_name;
          });
          res.send(rows);
        });

      });
      
    } else {
      res.send({ error: err });
    }
  });
});

module.exports = router;
