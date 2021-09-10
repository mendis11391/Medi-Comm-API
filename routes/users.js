var express = require('express');
var router = express.Router();
var crypto = require("crypto");

var sql = require("../db.js");

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
      `SELECT count(*) AS emailidCount FROM users where email= ? and logintype = 'web'`,
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
    `SELECT uid, uname, email, cart FROM users where uid = ?`,
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
    `SELECT uid, uname, email, wishlist FROM users where uid = ?`,
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
  var sqlUpdate = "UPDATE `users` SET `wishlist`= ? WHERE `uid` = ?";
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
  var sqlUpdate = "UPDATE `users` SET `cart`= ? WHERE `uid` = ?";
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
