var express = require('express');
var router = express.Router();

var sql = require("../db.js");

/* GET all users */
router.get('/', function(req, res) {
  sql.query(
      `SELECT uid, uname, email, logintype, cart, address,billingaddress FROM users`,
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
    `SELECT uid, uname, email, cart, address,billingaddress FROM users where uid = ?`,
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

/* GET cart details */
router.get('/:id', function(req, res, next) {
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

// Delete a address by id
router.delete('/deleteaddress/:id', (req, res) => {
  mysqlConnection.query('delete from users where uid = ?', [req.params.id], (err) => {
    if (!err) {
        res.send('Deleted succesfully');
    }
     else{
      res.send({ error: 'Error' });
    }
      
  })
});


module.exports = router;
