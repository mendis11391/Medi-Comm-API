var express = require('express');
var router = express.Router();
var crypto = require("crypto");

var sql = require("../db.js");

router.get('/getCustomerAddressById/:id', function(req, res) {
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

//post address
router.post("/addresses", function (req, res) {
    
  var sqlInsert =
    "INSERT INTO `address`(`customer_id`, `nickName`, `address_line1`, `address_line2`,`landmark`, `city`, `state`, `pincode`, `address_type`, `default_address`,`status`) VALUES (?,?, ?, ?, ?, ?, ?,?,?,?,?)";
  sql.query(
    sqlInsert,
    [
      req.body.uid,
      req.body.nickName,
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

// Update address
router.put("/updateAddress/:id", (req, res) => {
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
router.put("/deleteAddressById/:id",  (req, res) => {
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

router.get('/getCustomerRequests', function(req, res) {
  sql.query(
      `CALL get_customerRequests() `,
      (err, rows) => {
        if (!err) {
          res.send(rows[0]);
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

router.get('/getCustomerById/:id', function(req, res) {
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

router.post('/updateorderItem', function(req, res) {
	var sqlInsert = "INSERT INTO `customer_requests`( `order_item_id`, `order_id`,`renewals_timline`, `request_id`, `requested_date`, `approval_status`, `approval_date`, `request_status`) VALUES (?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
    [
      req.body.order_item_id,
      req.body.order_id,
      req.body.renewals,
      req.body.request_id,
      req.body.requested_date,
      req.body.approval_status,
      req.body.approval_date,
      req.body.request_status,
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

// Update status and damage charges in order item
router.put("/updatecustomerRequests/:id", (req, res) => {
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


router.get('/address/:id', function(req, res) {
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
router.put("/updateDefaultAddress/:auid", (req, res) => {
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
router.get('/', function(req, res) {
  sql.query(
      `SELECT uid, uname, email, phone, logintype, wishlist, cart, address,billingaddress FROM users`,
      (err, rows) => {
        if (!err) {
          res.send(rows);
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

/* GET user details by id*/
router.get('/getUserAddressInfo/:getid', function(req, res, next) {
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
router.get('/getUserInfo/:getid', function(req, res, next) {
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
router.get('/:id', function(req, res, next) {
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

router.get('/checkemail/:emailEx', function(req, res) {
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

/* GET cart details */
router.get('/cart/:id', function(req, res, next) {
  sql.query(
    `SELECT customer_id, products FROM cart where customer_id = ?`,
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
router.get('/wishlist/:id', function(req, res, next) {

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
router.put("/updateuser", (req, res) => {

  var sqlUpdate = "UPDATE `users` SET `uname`= ? WHERE `uid` = ?";
  sql.query(
    sqlUpdate,
    [
      uname=req.body.firstName+" "+req.body.lastName,
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
router.put("/updateemail", (req, res) => {

  var sqlUpdate = "UPDATE `users` SET `email`= ? WHERE `uid` = ?";
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
router.put("/updatemobile", (req, res) => {

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
router.put("/updatepassword", (req, res) => {

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
router.put("/update", (req, res) => {
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
router.put("/wishlist/:id", (req, res) => {
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
router.put("/cart/:id", (req, res) => {
  var sqlUpdate = "UPDATE `cart` SET `products`= ? WHERE `customer_id` = ?";
  sql.query(
    sqlUpdate,
    [
      req.body.cart,
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

/* GET address details */
router.get('/address/:usrid', function(req, res, next) {
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
router.get('/billingaddress/:usrid', function(req, res, next) {
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
router.put("/updateaddress/:auid", (req, res) => {
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
router.put("/updatebilladdress/:bauid", (req, res) => {
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

module.exports = router;
