var express = require('express');
var router = express.Router();
var crypto = require("crypto");
const constants = require("../constant/constUrl");
var sql = require("../db.js");
var requestify = require('requestify'); 
const winston = require('winston');
var currentDate = new Date().toJSON().slice(0,10);

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

function ISTTime(){
  var currentTime = new Date();

  var currentOffset = currentTime.getTimezoneOffset();

  var ISTOffset = 330;   // IST offset UTC +5:30 

  var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);
  return ISTTime;
}

router.get('/:id',verifyToken, function(req, res, next) {
  sql.query(
    `CALL get_customersById(${req.params.id})`,
    (err, rows) => {
      if (!err) {
        res.send(rows[0]);
      } else {
        res.send({ error: err });
      }
    }
  );
});

router.get('/getCustomerAddressById/:id',verifyToken, function(req, res) {
  sql.query(
      `CALL get_addressById(${req.params.id}) `,
      (err, rows) => {
        if (!err) {
          res.send(rows[0]);
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

router.get('/getCartByCustomerId/:id', verifyToken,function(req, res) {
  let cart=[];
  let len=0;
  sql.query(
      `CALL get_cartByCustomerId(${req.params.id}) `,
      (err, rows) => {
        if (!err) {
          rows[0].forEach((res)=>{
            cart.push(res);              
          });
          
          // res.send(cart);
        } else {
          res.send({ error: 'Error' });
        }

        if(cart){
          cart.forEach((cartRes, i, ele)=>{
            len++
            cartRes.products = JSON.parse(cartRes.products);
            if(len===ele.length){          
              res.send(cart);
            }
          })
        }
      }
    );
});

//post address
router.post("/addresses", verifyToken,function (req, res) {
    
  var sqlInsert =
    "INSERT INTO `address`(`customer_id`, `display_name`,`nickName`, `addressMobile`, `address_line1`, `address_line2`,`landmark`, `city`, `state`, `pincode`, `address_type`, `default_address`,`status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?)";
  sql.query(
    sqlInsert,
    [
      req.body.uid,
      req.body.displayName,
      req.body.nickName,
      req.body.addressMobile,
      req.body.address1,
      req.body.address2,
      req.body.landmark,
      req.body.city,
      req.body.state,
      req.body.pincode,
      req.body.address_type,
      req.body.default_address,
      req.body.status
    ],
    (err) => {
      if (!err) {
        res.send({message: 'address Inserted Successfully'});
      } else {
        res.send({message: err});
      }
    }
  );
});

// Update user firstName, lastName, and email
router.put("/updateUsernotification/:id", verifyToken,(req, res) => {
  var sqlUpdate = "UPDATE `customer` SET `is_notification_enabled`= ? WHERE `customer_id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.is_notification_enabled,
      req.params.id
    ],
    (err) => {
      if (!err) {
        res.send({'message': 'user details updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update user firstName, lastName, and email
router.put("/updateBasicUserDetails/:id", verifyToken,(req, res) => {
  var sqlUpdate = "UPDATE `customer` SET `firstName`= ?, `lastName`=?, `email`=? WHERE `customer_id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.firstName,
      req.body.lastName,
      req.body.email,
      req.params.id
    ],
    (err) => {
      if (!err) {
        res.send({'message': 'user details updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update user firstName, lastName, and email
router.put("/updateUserLastActivity/:id", verifyToken,(req, res) => {
  var sqlUpdate = `UPDATE customer SET lastLogin= ? WHERE customer_id = ?`;
  sql.query(
    sqlUpdate,
    [
      new Date(),
      req.params.id
    ],
    (err) => {
      if (!err) {
        res.send({'message': 'user details updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update user firstName, lastName, and email
router.put("/updateUserDetail/:id", verifyToken,(req, res) => {
  var sqlUpdate = `UPDATE customer SET ${req.body.fieldName}= ? WHERE customer_id = ?`;
  sql.query(
    sqlUpdate,
    [
      req.body.value,
      req.params.id
    ],
    (err) => {
      if (!err) {
        res.send({'message': 'user details updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update user firstName, lastName, and email
router.put("/updateUserAddressFeild/:id", verifyToken,(req, res) => {
  var sqlUpdate = `UPDATE address SET ${req.body.fieldName}= ? WHERE address_id = ?`;
  sql.query(
    sqlUpdate,
    [
      req.body.value,
      req.params.id
    ],
    (err) => {
      if (!err) {
        res.send({'message': 'user details updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update address
router.put("/updateAddress/:id",verifyToken, (req, res) => {
  var sqlUpdate = "UPDATE `address` SET `nickName`= ?, `address_line1`=?, `address_line2`=?,`landmark`=?, `pincode`=?, `address_type`=? WHERE `address_id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.nickName,
      req.body.address1,
      req.body.address2,
      req.body.landmark,
      req.body.pincode,
      req.body.address_type,
      req.params.id
    ],
    (err) => {
      if (!err) {
        res.send({'message': 'Address updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Delete address
router.put("/deleteAddressById/:id", verifyToken, (req, res) => {
  sql.query(
    "UPDATE `address` SET `status`= ?, `default_address`= ? WHERE address_id = ?",
    [req.body.status,0,req.params.id],
    (err) => {
      if (!err) {
        res.send({'message':'Address disabled'})
      } else {
        res.send({ error: err });
      }
    }
  );
});



router.get('/getCustomerById/:id',verifyToken, function(req, res) {
  let id =req.params.id
  sql.query(
      `CALL get_customersById(${id}) `,
      (err, rows) => {
        if (!err) {
          res.send(rows[0]);
        } else {
          res.send({ error: err });
        }
      }
    );
});

router.post('/updateorderItem',verifyToken, function(req, res) {
	var sqlInsert = "INSERT INTO `customer_requests`( `order_item_id`, `order_id`,`renewals_timline`, `request_id`, `requested_date`, `request_reason`,`request_message`,`approval_status`, `approval_date`, `request_status`) VALUES (?, ?, ?,?,?,?,?,?,?,?)";    
	sql.query(sqlInsert,
    [
      req.body.order_item_id,
      req.body.order_id,
      req.body.renewals,
      req.body.request_id,
      new Date(req.body.requested_date),
      req.body.request_reason,
      req.body.request_message,
      req.body.approval_status,
      new Date(),
      req.body.request_status,
    ],
    (err) => {
      if (!err) {        
          let requestType=0;
          let campaign = '';
          let params = [];
          let requestedDate = new Date(req.body.requested_date);

          var currentOffset = requestedDate.getTimezoneOffset();

          var ISTOffset = 330;   // IST offset UTC +5:30 

          var ISTTime = new Date(requestedDate.getTime() + (ISTOffset + currentOffset)*60000);

          // Get the response body
          if(req.body.request_id==1){
            requestType=10;
            let repaceproduct = JSON.parse(req.body.renewals);
            campaign = "Replacement/ Upgrade requested";
            params.push(req.body.firstName);
            params.push(repaceproduct[0].prod_name);
          } else{
            requestType=9;   
            campaign = "Return Requested";
            params.push(req.body.firstName);
            params.push(ISTTime.getDate()+'/'+(ISTTime.getMonth()+1)+'/'+ISTTime.getFullYear());       
          }
          
          let template = {
            "apiKey": constants.whatsappAPIKey,
            "campaignName": campaign,
            "destination": req.body.mobile,
            "userName": "IRENTOUT",
            "source": campaign,
            "media": {
               "url": "https://irentout.com/assets/images/slider/5.png",
               "filename": "IROHOME"
            },
            "templateParams": params,
            "attributes": {
              "InvoiceNo": "1234"
            }
           }
        
           
           requestify.post(`https://backend.aisensy.com/campaign/t1/api`, template);
  
          requestify.get(`${constants.apiUrl}forgotpassword/getEmailTemplates/${requestType}`).then(function(templateRsponse) {
            
            let template = templateRsponse.getBody()[0]
            requestify.post(`${constants.apiUrl}forgotpassword/rrRequest`, {
              email: req.body.email,
              template: template,
              requestId:req.body.request_id,
              product:req.body.renewals,
              requestedDate: req.body.requested_date,
            });
          });
          res.send({message: 'Inserted Successfully'});
        
      } else {
        logger.info({
          message: `return or replace request error:${err}`,
          dateTime: new Date()
        });
        res.send({message: err});
      }
    }
  );
});

router.post('/updateorderItem2',verifyToken, function(req, res) {
	var sqlInsert = "INSERT INTO `customer_requests`( `order_item_id`, `order_id`,`renewals_timline`, `request_id`, `requested_date`, `request_reason`,`request_message`,`approval_status`, `approval_date`, `request_status`) VALUES (?, ?, ?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
    [
      req.body.order_item_id,
      req.body.order_id,
      req.body.renewals,
      req.body.request_id,
      new Date(req.body.requested_date),
      req.body.request_reason,
      req.body.request_message,
      req.body.approval_status,
      new Date(),
      req.body.request_status,
    ],
    (err) => {
      if (!err) {
        // let requestType=0;
        // if(req.body.request_id==1){
        //   requestType=10
        // } else{
        //   requestType=9
        // }
        // requestify.get(`${constants.apiUrl}forgotpassword/getEmailTemplates/${requestType}`).then(function(templateRsponse) {
					
        //   let template = templateRsponse.getBody()[0]
        //   requestify.post(`${constants.apiUrl}forgotpassword/rrRequest`, {
        //     email: req.body.email,
        //     template: template,
        //     requestId:req.body.request_id,
        //     product:req.body.renewals,
        //     requestedDate: req.body.requested_date,
        //   });
        // });
        let requestType=0;
          let campaign = '';
          let params = [];
          let requestedDate = new Date(req.body.requested_date);

          var currentOffset = requestedDate.getTimezoneOffset();

          var ISTOffset = 330;   // IST offset UTC +5:30 

          var ISTTime = new Date(requestedDate.getTime() + (ISTOffset + currentOffset)*60000);

          // Get the response body
          if(req.body.request_id==1){
            requestType=10;
            let repaceproduct = JSON.parse(req.body.renewals);
            campaign = "Replacement/ Upgrade requested";
            params.push(req.body.firstName);
            params.push(repaceproduct.prod_name);
          } else{
            requestType=9;   
            campaign = "Return Requested";
            params.push(req.body.firstName);
            params.push(ISTTime.getDate()+'/'+(ISTTime.getMonth()+1)+'/'+ISTTime.getFullYear());       
          }
          
          let template = {
            "apiKey": constants.whatsappAPIKey,
            "campaignName": campaign,
            "destination": req.body.mobile,
            "userName": "IRENTOUT",
            "source": campaign,
            "media": {
               "url": "https://irentout.com/assets/images/slider/5.png",
               "filename": "IROHOME"
            },
            "templateParams": params,
            "attributes": {
              "InvoiceNo": "1234"
            }
           }
        
           
           requestify.post(`https://backend.aisensy.com/campaign/t1/api`, template);
        res.send({message: 'Inserted Successfully'});
      } else {
        logger.info({
          message: `return or replace request error:${err}`,
          dateTime: new Date()
        });
        res.send({message: err});
      }
    }
  );
});

// Update status and damage charges in order item
router.put("/updatecustomerRequests/:id",verifyToken, (req, res) => {
  var id = req.params.id;
  var sqlUpdate = 'UPDATE customer_requests SET approval_status= ?, approval_date=?, request_status=? WHERE order_item_id= ?';
  sql.query(
    sqlUpdate,
    [
      req.body.approvalStatus,
      new Date(),
      req.body.requestStatus,
      id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'status updated for order item'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update status and damage charges in order item
router.put("/updatecustomerRequestsMessage/:id",verifyToken, (req, res) => {
  var id = req.params.id;
  var sqlUpdate = 'UPDATE customer_requests SET request_message=? WHERE order_item_id= ?';
  sql.query(
    sqlUpdate,
    [
      req.body.request_message,
      id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'status updated for order item'});
      } else {
        res.send({ error: err });
      }
    }
  );
});


router.get('/address/:id', verifyToken,function(req, res) {
  sql.query(
      `CALL get_addressByCustomerID(${req.params.id}) `,
      (err, rows) => {
        if (!err) {
          res.send(rows[0]);
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});


// Update address
router.put("/updateDefaultAddress/:auid", verifyToken,(req, res) => {
  var sqlUpdate = "UPDATE `address` SET `default_address`= ? WHERE `address_id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.default_address,
      req.params.auid
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'Address updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

/* GET all users */
router.get('/', verifyToken, function(req, res) {
  sql.query(
      `CALL get_AllCustomers()`,
      (err, rows) => {
        if (!err) {
          rows[0].forEach((items)=>{
            items.activeItems = JSON.parse(items.activeItems);
          });
          res.send(rows[0]);
        } else {
          res.send({ error:err });
        }
      }
    );
});



/* GET user details by id*/
router.get('/getUserAddressInfo/:getid',verifyToken, function(req, res, next) {
  sql.query(
    `CALL 	get_addressByCustomerID(${req.params.getid})`,
    (err, rows) => {
      if (!err) {
        res.send(rows[0]);
      } else {
        res.send({ error: err });
      }
    }
  );
});

/* GET user details by id*/
router.get('/getUserInfo/:getid',verifyToken, function(req, res, next) {
  sql.query(
    `SELECT customer_id, firstName, lastName, mobile, email, password, registeredAt, lastLogin, login_type, token FROM customer WHERE customer_id=?`,
    [req.params.getid],
    (err, rows) => {
      if (!err) {
        res.send(rows);
      } else {
        res.send({ error: err });
      }
    }
  );
});

/* GET users by id details */
router.get('/:id', verifyToken,function(req, res, next) {
  sql.query(
    `SELECT uid, uname, email, phone, wishlist, cart, address, billingaddress FROM users where uid = ?`,
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

router.get('/checkemail/:emailEx',verifyToken, function(req, res) {
  sql.query(
      `SELECT count(*) AS emailidCount FROM customer where email= ?`,
      [req.params.emailEx],
      (err, rows) => {
        if (!err) {
          if(rows[0].emailidCount > 0 ) {
            res.send({message: '', status: true})
          } else {
            res.send({message: `Email Id doesn't exist`, status: false});
          }
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});


router.get('/checkmobile/:mobile', verifyToken,function(req, res) {
  sql.query(
      `SELECT count(*) AS mobileCount, customer_id FROM customer where mobile= ? `,
      [req.params.mobile],
      (err, rows) => {
        if (!err) {
          if(rows[0].mobileCount > 0 ) {
            res.send({message: '', status: true, customerId:rows[0].customer_id})
          } else {
            res.send({message: `Email Id doesn't exist`, status: false});
          }
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

// Update users name
router.put("/updateOtp/:cid", verifyToken,(req, res) => {

  var sqlUpdate = "UPDATE `customer` SET `password`= ?, `lastLogin`=? WHERE `customer_id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.otp,
      new Date(),
      req.params.cid
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'users name updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});
/* GET cart details */
router.get('/cart/:id',  function(req, res, next) {
  sql.query(
    `SELECT customer_id, products, modifiedAt FROM cart where customer_id = ?`,
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

/* GET cart details */
router.get('/wishlist/:id', verifyToken,function(req, res, next) {

  sql.query(
    `SELECT customer_id, products FROM wishlist where customer_id = ?`,
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

// Update users name
router.put("/updateuser", verifyToken,(req, res) => {

  var sqlUpdate = "UPDATE `customer` SET `firstName`= ? , `lastName`= ? WHERE `customer_id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.firstName,
      req.body.lastName,
      req.body.id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'users name updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update users email
router.put("/updateemail", verifyToken,(req, res) => {

  var sqlUpdate = "UPDATE `customer` SET `email`= ? WHERE `customer_id` = ?";
  sql.query(
    sqlUpdate,
    [
      email=req.body.email,
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

// Update users mobile no
router.put("/updatemobile", verifyToken,(req, res) => {

  var sqlUpdate = "UPDATE `users` SET `phone`= ? WHERE `uid` = ?";
  sql.query(
    sqlUpdate,
    [
      email=req.body.mobile,
      req.body.id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'users mobile updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update users password
router.put("/updatepassword", verifyToken,(req, res) => {

  const encryptedTime = crypto.createCipher('aes-128-cbc', 'irent@key*');
  let cryptPassword = encryptedTime.update(req.body.upass, 'utf8', 'hex')
  cryptPassword += encryptedTime.final('hex');

  var sqlUpdate = "UPDATE `users` SET `upass`= ? WHERE `uid` = ?";
  sql.query(
    sqlUpdate,
    [
      upass=cryptPassword,
      req.body.id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'users updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update users password
router.put("/update", verifyToken,(req, res) => {
  // Encrypt Password
  const encryptedTime = crypto.createCipher('aes-128-cbc', 'irent@key*');
  let cryptPassword = encryptedTime.update(req.body.upass, 'utf8', 'hex')
  cryptPassword += encryptedTime.final('hex');

  var sqlUpdate = "UPDATE `users` SET `upass`= ? WHERE `uid` = ?";
  sql.query(
    sqlUpdate,
    [
      cryptPassword,
      req.body.id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'users updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update wishlist
router.put("/wishlist/:id", verifyToken,(req, res) => {
  var sqlUpdate = "UPDATE `wishlist` SET `products`= ? WHERE `customer_id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.wishlist,
      req.params.id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'wishlist updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update cart
router.put("/cart/:id", verifyToken,(req, res) => {
  var sqlUpdate = "UPDATE `cart` SET `products`= ?, `modifiedAt`=? WHERE `customer_id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.cart,
      new Date(),
      req.params.id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'cart updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

router.post('/kycSubmit', verifyToken,function(req, res) {
	var sqlInsert = "INSERT INTO `kyc`( `customer_id`, `first_name`, `last_name`, `mobile_no`, `alernate_mobile_no`, `email`, `aadhar_no`, `facebook_link`, `address_line1`, `address_line2`, `city`, `state`, `pincode`, `r1_first_name`, `r1_last_name`, `r1_mobile_no`, `r2_first_name`, `r2_last_name`, `r2_mobile_no`, `ref_verify`, `company`, `photo`, `id_proof`, `address_proof`, `created_at`, `kyc_status`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
    [
      req.body.customer_id,
      req.body.Name_First,
      req.body.Name_Last,
      req.body.PhoneNumber_countrycode,
      req.body.PhoneNumber1_countrycode,
      req.body.Email,
      req.body.Number,
      req.body.Website,
      req.body.Address_AddressLine1,
      req.body.Address_AddressLine2,
      req.body.Address_City,
      req.body.Address_Region,
      req.body.Address_ZipCode,
      req.body.Name1_First,
      req.body.Name1_Last,
      req.body.PhoneNumber2_countrycode,
      req.body.Name2_First,
      req.body.Name2_Last,
      req.body.PhoneNumber3_countrycode,
      req.body.Radio,
      req.body.SingleLine,
      req.body.ImageUpload,
      req.body.FileUpload,
      req.body.FileUpload1,
      new Date(),
      1
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

/* GET address details */
router.get('/address/:usrid',verifyToken, function(req, res, next) {
  sql.query(
    `SELECT address FROM users where uid = ?`,
    [req.params.usrid],
    (err, rows) => {
      if (!err) {
        res.send(rows);
      } else {
        res.send({ error: err });
      }
    }
  );
});

/* GET billing address details */
router.get('/billingaddress/:usrid',verifyToken, function(req, res, next) {
  sql.query(
    `SELECT billingaddress FROM users where uid = ?`,
    [req.params.usrid],
    (err, rows) => {
      if (!err) {
        res.send(rows);
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update address
router.put("/updateaddress/:auid", verifyToken,(req, res) => {
  var sqlUpdate = "UPDATE `users` SET `address`= ? WHERE `uid` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.address,
      req.params.auid
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'Address updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update billing address
router.put("/updatebilladdress/:bauid", verifyToken,(req, res) => {
  var sqlUpdate = "UPDATE `users` SET `billingaddress`= ? WHERE `uid` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.address,
      req.params.bauid
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'Billing address updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});


router.post('/kycDetailsSubmit', function(req, res) {
  
  var aadharImage = req.body.aadharImage;
  var selfieImage = req.body.selfieImage;
  var pgReceipt = req.body.pgReceipt ? req.body.pgReceipt : [];
  var collageId = req.body.collageId ? req.body.collageId : [];
  var permanentAddressProof = req.body.permanentAddressProof ? req.body.permanentAddressProof : [];
  var ownElectricitybill = req.body.ownElectricitybill ? req.body.ownElectricitybill : [];
  var rentedEletricityBill = req.body.rentedEletricityBill ? req.body.rentedEletricityBill : [];
  var retalAgreement = req.body.retalAgreement ? req.body.retalAgreement : [];
  var anyBill = req.body.anyBill ? req.body.anyBill : [];
  var allImages = [];
  var kycStatus = 'eKYC submitted';

  if(req.body.ref1Name==''){
    kycStatus = 'eKYC partially submitted';
  }

   
	var kycMain = "INSERT INTO `kyc_main_table`( `customer_id`, `customer_type`, `comments`, `kyc_status`, `editable`, `approved_date`,`expiry_date`,`created_at`, `modified_at`, `status`) VALUES (?,?,?,?,?,?,?,?,?,?)";  
	sql.query(kycMain,
    [
      req.body.customer_id,
      req.body.customerType,
      '',
      kycStatus,
      0,
      new Date(),
      new Date(),
      new Date(),
      new Date(),
      1
    ],
    (err,result) => {
      if (!err) {
        
        var kycIndividual = "INSERT INTO `kyc_individual`( `kyc_id`, `alternate_mobile`, `company`, `occupation`, `social_link`, `aadhar_no`, `address_type`, `ref1_name`, `ref1_relation`, `ref1_ph`, `ref2_name`, `ref2_relation`, `ref2_ph`, `created_at`, `modified_at`, `status`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";  
        sql.query(kycIndividual,
          [
            result.insertId,
            req.body.alternateMobileNo ? req.body.alternateMobileNo : '',
            req.body.company ? req.body.company : '',
            req.body.occupation ? req.body.occupation : '',
            req.body.socialLink ? req.body.socialLink : '',
            req.body.aadharNo ? req.body.aadharNo : '',
            req.body.addressType ? req.body.addressType : 0,
            req.body.ref1Name ? req.body.ref1Name : '',
            req.body.ref1Relation ? req.body.ref1Relation : '',
            req.body.ref1Phone ? req.body.ref1Phone : '',
            req.body.ref2Name ? req.body.ref2Name : '',
            req.body.ref2Relation ? req.body.ref2Relation : '',
            req.body.ref2Phone ? req.body.ref2Phone : '',
            new Date(),
            new Date(),
            1
          ]
        );

        var kycImage = "INSERT INTO `kyc_image`( `kyc_id`, `proofId`, `Image`, `created_at`, `modified_at`, `status`) VALUES (?,?,?,?,?,?)";  
        
        aadharImage.forEach((AIRes)=>{
          allImages.push(AIRes);
          sql.query(kycImage,
            [
              result.insertId,
              1,
              AIRes,
              new Date(),
              new Date(),
              1
            ]
          );
        });

        selfieImage.forEach((SIRes)=>{
          allImages.push(SIRes);
          sql.query(kycImage,
            [
              result.insertId,
              2,
              SIRes,
              new Date(),
              new Date(),
              1
            ]
          );
        });

        if(pgReceipt.length>0){
          pgReceipt.forEach((PGRes)=>{
            allImages.push(PGRes);
            sql.query(kycImage,
              [
                result.insertId,
                3,
                PGRes,
                new Date(),
                new Date(),
                1
              ]
            );
          });
        }
        

        if(collageId.length>0){
          collageId.forEach((CIRes)=>{
            allImages.push(CIRes);
            sql.query(kycImage,
              [
                result.insertId,
                4,
                CIRes,
                new Date(),
                new Date(),
                1
              ]
            );
          });
        }

        if(permanentAddressProof.length>0){
          permanentAddressProof.forEach((PARes)=>{
            allImages.push(PARes);
            sql.query(kycImage,
              [
                result.insertId,
                5,
                PARes,
                new Date(),
                new Date(),
                1
              ]
            );
          });
        }
        
        if(ownElectricitybill.length>0){
          ownElectricitybill.forEach((OEBRes)=>{
            allImages.push(OEBRes);
            sql.query(kycImage,
              [
                result.insertId,
                6,
                OEBRes,
                new Date(),
                new Date(),
                1
              ]
            );
          });
        }

        if(rentedEletricityBill.length>0){
          rentedEletricityBill.forEach((REBRes)=>{
            allImages.push(REBRes);
            sql.query(kycImage,
              [
                result.insertId,
                7,
                REBRes,
                new Date(),
                new Date(),
                1
              ]
            );
          });
        }
        
        if(retalAgreement.length>0){
          retalAgreement.forEach((RARes)=>{
            allImages.push(RARes);
            sql.query(kycImage,
              [
                result.insertId,
                8,
                RARes,
                new Date(),
                new Date(),
                1
              ]
            );
          });
        }
        
        if(anyBill.length>0){
          anyBill.forEach((ABRes)=>{
            allImages.push(ABRes);
            sql.query(kycImage,
              [
                result.insertId,
                9,
                ABRes,
                new Date(),
                new Date(),
                1
              ]
            );
          });
        }
        
        requestify.get(`${constants.apiUrl}orders/${req.body.customer_id}`).then(function(orders) {
          console.log(orders.getBody()[0]);
          let allOrders = [];
          let filteredOrders=[];
          allOrders=orders.getBody();
          filteredOrders=allOrders.filter(item=>(item.paymentStatus=='Success' && item.orderType_id==1) && item.deliveryStatus!='4');
          filteredOrders.forEach((resOrders)=>{
            requestify.put(`${constants.apiUrl}orders/updateAnyOrderField/${resOrders.order_id}`, {orderField: 'deliveryStatus', orderValue: 7}).then(function(updateOrder) {
              updateOrder.getBody();
            });
          });
        });

        requestify.post(`${constants.apiUrl}forgotpassword/eKYCSubmitMail`, {
          allImages:allImages,
          kycDetails:req.body
        });
        // requestify.get(`${constants.apiUrl}forgotpassword/getEmailTemplates/1`).then(function(templateRsponse) {
					
        //   let template = templateRsponse.getBody()[0]
        //   requestify.post(`${constants.apiUrl}forgotpassword/eKYCMail`, {
        //     email: req.body.profileEmail,
        //     template: template,
        //     // orderNo: req.body.order_id,
        //     // requestId:req.body.request_id,
        //     // requestedDate: req.body.requested_date,
        //   });
        // });
        
        res.send({message: 'Success'});
      } else {
        logger.info({
          message: `failed to post eKYC individual. error:${err}`,
          dateTime: new Date()
        });
        res.send({message: err});
      }
    }
  );
});

router.post('/kycSubmittedWhatsapp', function(req, res) {
  let template = {
    "apiKey": constants.whatsappAPIKey,
    "campaignName": "eKYC Submitted",
    "destination": req.body.mobile,
    "userName": "IRENTOUT",
    "source": "eKYC Submitted",
    "media": {
       "url": "https://irentout.com/assets/images/slider/5.png",
       "filename": "IROHOME"
    },
    "templateParams": [
      req.body.customerName, 
    ],
    "attributes": {
      "InvoiceNo": "1234"
    }
   }

   
   requestify.post(`https://backend.aisensy.com/campaign/t1/api`, template);
});

router.post('/kycCompanyDetailsSubmit', function(req, res) {
  
  var gstCertificate = req.body.gstCertificate;
  var moa = req.body.moa;
  var aoa = req.body.aoa;
  var purchaseOrder = req.body.purchaseOrder;
  var companyId = req.body.companyId;
  var selfie2 = req.body.selfie2;
  
	var kycMain = "INSERT INTO `kyc_main_table`( `customer_id`, `customer_type`, `comments`, `kyc_status`, `editable`, `approved_date`,`expiry_date`,`created_at`, `modified_at`, `status`) VALUES (?,?,?,?,?,?,?,?,?,?)";  
	sql.query(kycMain,
    [
      req.body.customer_id,
      req.body.customerType,
      '',
      'Awaiting eKYC',
      0,
      new Date(),
      new Date(),
      new Date(),
      new Date(),
      1
    ],
    (err,result) => {
      if (!err) {
        var kycIndividual = "INSERT INTO `kyc_company`(`kyc_id`, `type_of_org`, `company_name`, `gst_no`, `website`, `phone`, `firstName`, `lastName`, `designation`, `mobile`, `email`, `ref1_name`, `ref1_designation`, `ref1_mobile`, `ref1_officialMailId`, `ref2_name`, `ref2_designation`, `ref2_mobile`, `ref2_officialMailId`, `created_at`, `modified_at`, `status`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";  
        sql.query(kycIndividual,
          [
            result.insertId,
            req.body.typeOfOrg,
            req.body.companyName,
            req.body.gstNo,
            req.body.website,
            req.body.phoneNo,
            req.body.fname,
            req.body.lname,
            req.body.designation,
            req.body.mobileNo,
            req.body.officialEmail,
            req.body.ref1Name,
            req.body.ref1Designation,
            req.body.ref1MobileNo,
            req.body.ref1OfficialEmail,
            req.body.ref2Name,
            req.body.ref2Designation,
            req.body.ref2MobileNo,
            req.body.ref2OfficialEmail,
            new Date(),
            new Date(),
            1
          ],
          (err,result) => {
            if (!err) {
              // res.send({message: 'Inserted Successfully'});
            } else {
              res.send({message: err});
            }
          }
        );

        var kycImage = "INSERT INTO `kyc_image`( `kyc_id`, `proofId`, `Image`, `created_at`, `modified_at`, `status`) VALUES (?,?,?,?,?,?)";  
        
        if(companyId.length>0){
          companyId.forEach((OIRes)=>{
            sql.query(kycImage,
              [
                result.insertId,
                4,
                OIRes,
                new Date(),
                new Date(),
                1
              ]
            );
          });
        }
        
        if(selfie2.length>0){
          selfie2.forEach((SIRes)=>{
            sql.query(kycImage,
              [
                result.insertId,
                2,
                SIRes,
                new Date(),
                new Date(),
                1
              ]
            );
          });
        }

        if(gstCertificate.length>0){
          gstCertificate.forEach((gstRes)=>{
            sql.query(kycImage,
              [
                result.insertId,
                10,
                gstRes,
                new Date(),
                new Date(),
                1
              ]
            );
          });
        }
        

        if(moa.length>0){
          moa.forEach((moaRes)=>{
            sql.query(kycImage,
              [
                result.insertId,
                11,
                moaRes,
                new Date(),
                new Date(),
                1
              ]
            );
          });
        }

        if(aoa.length>0){
          aoa.forEach((aoaRes)=>{
            sql.query(kycImage,
              [
                result.insertId,
                12,
                aoaRes,
                new Date(),
                new Date(),
                1
              ]
            );
          });
        }
        
        if(purchaseOrder.length>0){
          purchaseOrder.forEach((PORes)=>{
            sql.query(kycImage,
              [
                result.insertId,
                13,
                PORes,
                new Date(),
                new Date(),
                1
              ]
            );
          });
        }

        res.send({message: 'Inserted Successfully'});
      } else {
        res.send({message: err});
      }
    }
  );
});

router.post('/insertUrlLogs', function(req, res) {
  sql.query(`CALL insertUrlLogs(${req.body.sessionId}, ${req.body.customerId}, ${JSON.stringify(req.body.url)}, ${JSON.stringify(req.body.tag)}, ${req.body.conversion})`,    
    (err) => {
      if (!err) {
        res.send({message: 'Inserted Successfully'});
      } else {
        res.send({message: err});
      }
    }
  );
});

/* GET kyc list */
router.get('/getAllKYC/kycList', function(req, res, next) {
  sql.query(
    `SELECT
    KM.id,
    KM.customer_id,
    C.firstName,
    C.lastName,
    C.mobile,
    C.email,
    KM.customer_type,
    KM.comments,
    KM.kyc_status,
    KM.editable,
    KM.approved_date,
    KM.expiry_date,
    KM.created_at,
    KM.modified_at,
    KM.status
FROM
    kyc_main_table KM
    LEFT JOIN customer C ON C.customer_id = KM.customer_id`,
    (err, rows) => {
      if (!err) {
        res.send(rows);
      } else {
        res.send({ error: err });
      }
    }
  );
});

router.get('/getAllKYC/kycMainTable/:id', function(req, res, next) {
  sql.query(
    `SELECT * FROM kyc_main_table WHERE id=${req.params.id}`,
    (err, rows) => {
      if (!err) {
        res.send(rows);
      } else {
        res.send({ error: err });
      }
    }
  );
});

router.get('/getAllKYC/kycBycustomerId/:id', function(req, res, next) {
  sql.query(
    `SELECT
    KMT.id,
    C.firstName,
    C.lastName,
    C.mobile,
    C.email,
    KMT.customer_id,
    KMT.customer_type,
    KMT.comments,
    KMT.kyc_status,
    KMT.editable,
    KMT.approved_date,
    KMT.expiry_date,
    KMT.created_at,
    KMT.modified_at,
    KMT.status
FROM
    kyc_main_table KMT
    LEFT JOIN customer C ON C.customer_id = KMT.customer_id
    where KMT.customer_id =${req.params.id}`,
    (err, rows) => {
      if (!err) {
        res.send(rows);
      } else {
        res.send({ error: err });
      }
    }
  );
});

router.get('/getAllKYC/kycIndividualDetails/:id', function(req, res, next) {
  sql.query(
    `SELECT * FROM kyc_individual WHERE kyc_id=${req.params.id}`,
    (err, rows) => {
      if (!err) {
        res.send(rows);
      } else {
        res.send({ error: err });
      }
    }
  );
});

/* GET kyc image details */
router.get('/getAllKYC/kycImage/:id', function(req, res, next) {
  sql.query(
    `SELECT
    KI.id,
    KI.kyc_id,
    KI.proofId,
    KD.document_name,
    KI.Image,
    KI.created_at,
    KI.modified_at,
	  KI.status
  FROM
    kyc_image KI
    LEFT JOIN kyc_documents KD ON KI.proofId = KD.id WHERE KI.kyc_id=${req.params.id} AND KI.status=1`,
    (err, rows) => {
      if (!err) {
        res.send(rows);
      } else {
        res.send({ error: err });
      }
    }
  );
});

/* GET kyc company details */
router.get('/getAllKYC/kycCompanyDetails/:id', function(req, res, next) {
  sql.query(
    `SELECT * FROM kyc_company WHERE kyc_id=${req.params.id}`,
    (err, rows) => {
      if (!err) {
        res.send(rows);
      } else {
        res.send({ error: err });
      }
    }
  );
});

/* GET kyc details for admin*/
router.get('/getAllKYC/getKycBycustomerId/:id', function(req, res, next) {
  sql.query(
    `CALL getKycByCustomerID(${req.params.id})`,
    (err, rows) => {
      if (!err) {
        res.send(rows[0]);
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update KYC status and comments
router.put("/getAllKYC/updateKYCMaintablefield/:id", verifyToken,(req, res) => {
  var sqlUpdate = `UPDATE kyc_main_table SET ${req.body.field}= ? WHERE id = ?`;
  sql.query(
    sqlUpdate,
    [
      req.body.value,
      req.params.id
    ],
    (err) => {
      if (!err) {
        logger.info({
          message: `/updateKYCMaintablefield: ${req}`,
          dateTime: new Date()
        });
        let campaignName = '';
        let params = [];
        if(req.body.value=='eKYC approved'){
          campaignName = 'eKYC Approved';
          params.push(req.body.fullName);
        } else if(req.body.value=='Query raised'){
          campaignName = 'eKYC Query Raised'
          params.push(req.body.fullName);
          // var html = req.body.comments.replace(/<\/?[^>]+(>|$)/g, "").replace("/\n/g", "").replace("/\t/g", "");
          
          params.push(req.body.comments);
        }
        let template = {
          "apiKey": constants.whatsappAPIKey,
          "campaignName": campaignName,
          "destination": req.body.mobile,
          "userName": "IRENTOUT",
          "source": "",
          "media": {
             "url": "https://irentout.com/assets/images/slider/5.png",
             "filename": "IROHOME"
          },
          "templateParams": params,
          "attributes": {
            "InvoiceNo": "1234"
          }
         }
      
         
        requestify.post(`https://backend.aisensy.com/campaign/t1/api`, template);
        res.send({'message': 'KYC status updated'});
      } else {
        logger.info({
          message: `/updateKYCMaintablefield: ${err}`,
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

router.put("/getAllKYC/updateKYCMaintableexpiryDatefield/:id", (req, res) => {
  var currentDateTime = new Date();
  let expiryDate = currentDateTime.setFullYear(currentDateTime.getFullYear() + 1);
  var sqlUpdate = `UPDATE kyc_main_table SET expiry_date= ? WHERE id = ?`;
  sql.query(
    sqlUpdate,
    [
      new Date(expiryDate),
      req.params.id
    ],
    (err) => {
      if (!err) {
        res.send({'message': 'KYC status updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update KYC fields
router.put("/getAllKYC/kycFields/:id", (req, res) => {
  var sqlUpdate = "UPDATE kyc_individual SET alternate_mobile= ?, company = ?, occupation = ?, social_link=?, aadhar_no=?, address_type=?, ref1_name=?, ref1_relation=?, ref1_ph=?, ref2_name=?, ref2_relation=?, ref2_ph=? WHERE `id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.alternateMobileNo,
      req.body.company,
      req.body.occupation,
      req.body.socialLink,
      req.body.aadharNo,
      req.body.addressType,
      req.body.ref1Name,
      req.body.ref1Relation,
      req.body.ref1Phone,
      req.body.ref2Name,
      req.body.ref2Relation,
      req.body.ref2Phone,
      req.params.id
    ],
    (err) => {
      if (!err) {
        res.send({'message': 'KYC status updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

router.put("/getAllKYC/updatekycDetailsTab/:id", (req, res) => {
  var aadharImage = req.body.aadharImage;
  var selfieImage = req.body.selfieImage;
  var pgReceipt = req.body.pgReceipt;
  var collageId = req.body.collageId;
  var permanentAddressProof = req.body.permanentAddressProof;
  var ownElectricitybill = req.body.ownElectricitybill;
  var rentedEletricityBill = req.body.rentedEletricityBill;
  var retalAgreement = req.body.retalAgreement;
  var anyBill = req.body.anyBill;
  var allImages = [];

  var sqlUpdate = "UPDATE kyc_individual SET alternate_mobile= ?, company = ?, occupation = ?, social_link=? WHERE kyc_id = ? AND status = 1";
  sql.query(
    sqlUpdate,
    [
      req.body.alternateMobileNo,
      req.body.company,
      req.body.occupation,
      req.body.socialLink,
      req.params.id
    ],
    (err) => {
      if (!err) {
        var sqlUpdateMainTable = `UPDATE kyc_main_table SET kyc_status= ? WHERE id = ?`;
        sql.query(
          sqlUpdateMainTable,
          [
            'eKYC submitted',
            req.params.id
          ]
        );


        aadharImage.forEach((AIRes)=>{
          allImages.push(AIRes);
        });

        selfieImage.forEach((SIRes)=>{
          allImages.push(SIRes);
        });

        if(pgReceipt.length>0){
          pgReceipt.forEach((PGRes)=>{
            allImages.push(PGRes);
          });
        }
        

        if(collageId.length>0){
          collageId.forEach((CIRes)=>{
            allImages.push(CIRes);
          });
        }

        if(permanentAddressProof.length>0){
          permanentAddressProof.forEach((PARes)=>{
            allImages.push(PARes);
          });
        }
        
        if(ownElectricitybill.length>0){
          ownElectricitybill.forEach((OEBRes)=>{
            allImages.push(OEBRes);
          });
        }

        if(rentedEletricityBill.length>0){
          rentedEletricityBill.forEach((REBRes)=>{
            allImages.push(REBRes);
          });
        }
        
        if(retalAgreement.length>0){
          retalAgreement.forEach((RARes)=>{
            allImages.push(RARes);
          });
        }
        
        if(anyBill.length>0){
          anyBill.forEach((ABRes)=>{
            allImages.push(ABRes);            
          });
        }

        // requestify.post(`${constants.apiUrl}forgotpassword/eKYCSubmitMail`, {
        //   allImages:allImages,
        //   kycDetails:req.body
        // });
        res.send({'message': 'KYC status updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

router.put("/getAllKYC/updatekycIdProofTab/:id", (req, res) => {
  var aadharImage = req.body.aadharImage;
  var selfieImage = req.body.selfieImage;

  var sqlUpdate = "UPDATE kyc_individual SET aadhar_no= ? WHERE kyc_id = ? AND status = 1";
  sql.query(
    sqlUpdate,
    [
      req.body.aadharNo,
      req.params.id
    ],
    (err) => {
      if (!err) {
        var updateImage = `UPDATE kyc_image SET status=0 where kyc_id=? AND (proofId = 1 OR proofId = 2);`
        sql.query(
          updateImage,
          [
            req.params.id
          ],
          (err2) => {
            if (!err2) {
              var kycImage = "INSERT INTO `kyc_image`( `kyc_id`, `proofId`, `Image`, `created_at`, `modified_at`, `status`) VALUES (?,?,?,?,?,?)";  
        
              aadharImage.forEach((AIRes)=>{
                sql.query(kycImage,
                  [
                    req.params.id,
                    1,
                    AIRes,
                    new Date(),
                    new Date(),
                    1
                  ]
                );
              });
      
              selfieImage.forEach((SIRes)=>{
                sql.query(kycImage,
                  [
                    req.params.id,
                    2,
                    SIRes,
                    new Date(),
                    new Date(),
                    1
                  ]
                );
              });
            }
        });
        res.send({'message': 'KYC status updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

router.put("/getAllKYC/updatekycAddressProofTab/:id", (req, res) => {
  var pgReceipt = req.body.pgReceipt;
  var collageId = req.body.collageId;
  var permanentAddressProof = req.body.permanentAddressProof;
  var ownElectricitybill = req.body.ownElectricitybill;
  var rentedEletricityBill = req.body.rentedEletricityBill;
  var retalAgreement = req.body.retalAgreement;
  var anyBill = req.body.anyBill;

  var sqlUpdate = "UPDATE kyc_individual SET address_type= ? WHERE kyc_id = ? AND status = 1";
  sql.query(
    sqlUpdate,
    [
      req.body.addressType,
      req.params.id
    ],
    (err) => {
      if (!err) {
        var updateImage = `UPDATE kyc_image SET status=0 where kyc_id=? AND (proofId = 3 OR proofId = 4 OR proofId = 5 OR proofId = 6 OR proofId = 7 OR proofId = 8 OR proofId = 9);`
        sql.query(
          updateImage,
          [
            req.params.id
          ],
          (err2) => {
            if (!err2) {
              var kycImage = "INSERT INTO `kyc_image`( `kyc_id`, `proofId`, `Image`, `created_at`, `modified_at`, `status`) VALUES (?,?,?,?,?,?)";  
        
              if(pgReceipt.length>0){
                pgReceipt.forEach((PGRes)=>{
                  sql.query(kycImage,
                    [
                      req.params.id,
                      3,
                      PGRes,
                      new Date(),
                      new Date(),
                      1
                    ]
                  );
                });
              }
              
      
              if(collageId.length>0){
                collageId.forEach((CIRes)=>{
                  sql.query(kycImage,
                    [
                      req.params.id,
                      4,
                      CIRes,
                      new Date(),
                      new Date(),
                      1
                    ]
                  );
                });
              }
      
              if(permanentAddressProof.length>0){
                permanentAddressProof.forEach((PARes)=>{
                  sql.query(kycImage,
                    [
                      req.params.id,
                      5,
                      PARes,
                      new Date(),
                      new Date(),
                      1
                    ]
                  );
                });
              }
              
              if(ownElectricitybill.length>0){
                ownElectricitybill.forEach((OEBRes)=>{
                  sql.query(kycImage,
                    [
                      req.params.id,
                      6,
                      OEBRes,
                      new Date(),
                      new Date(),
                      1
                    ]
                  );
                });
              }
      
              if(rentedEletricityBill.length>0){
                rentedEletricityBill.forEach((REBRes)=>{
                  sql.query(kycImage,
                    [
                      req.params.id,
                      7,
                      REBRes,
                      new Date(),
                      new Date(),
                      1
                    ]
                  );
                });
              }
              
              if(retalAgreement.length>0){
                retalAgreement.forEach((RARes)=>{
                  sql.query(kycImage,
                    [
                      req.params.id,
                      8,
                      RARes,
                      new Date(),
                      new Date(),
                      1
                    ]
                  );
                });
              }
              
              if(anyBill.length>0){
                anyBill.forEach((ABRes)=>{
                  sql.query(kycImage,
                    [
                      req.params.id,
                      9,
                      ABRes,
                      new Date(),
                      new Date(),
                      1
                    ]
                  );
                });
              }
            }
        });
        res.send({'message': 'KYC status updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

router.put("/getAllKYC/updatekycReferencesTab/:id", (req, res) => {
  var sqlUpdate = "UPDATE kyc_individual SET ref1_name = ?, ref1_relation = ?, ref1_ph = ?, ref2_name = ?, ref2_relation = ?, ref2_ph = ? WHERE kyc_id = ? AND status = 1";
  sql.query(
    sqlUpdate,
    [
      req.body.ref1Name,
      req.body.ref1Relation,
      req.body.ref1Phone,
      req.body.ref2Name,
      req.body.ref2Relation,
      req.body.ref2Phone,
      req.params.id
    ],
    (err) => {
      if (!err) {
        res.send({'message': 'KYC status updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

router.get('/customerLogs/logs',verifyToken, function(req, res, next) {
  sql.query(
    `CALL get_AllCustomerLogs()`,
    (err, rows) => {
      if (!err) {
        res.send(rows[0]);
      } else {
        res.send({ error: err });
      }
    }
  );
});

router.get('/customerLogs/logs/:id',verifyToken, function(req, res, next) {
  sql.query(
    `CALL get_LogsByCustomerId(${req.params.id})`,
    (err, rows) => {
      if (!err) {
        res.send(rows[0]);
      } else {
        res.send({ error: err });
      }
    }
  );
});


module.exports = router;
