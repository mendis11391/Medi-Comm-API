var express = require('express');
var router = express.Router();

var sql = require("../db.js");

/* GET all orders */
router.get('/', function(req, res) {
  sql.query(
      `SELECT * FROM orders`,
      (err, rows) => {
        if (!err) {
          res.send(rows);
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

/* GET orders By user id */
router.get('/:id', function(req, res, next) {
  var mainArr = [];
  var ids = [];
  var len = 0;
  sql.query(
    `SELECT * FROM orders where userId = ?`,
    [req.params.id],
    (err, rows) => {
      if (!err) {
        rows.forEach((row, i) => {
          row['orderdate'] = JSON.parse(row.orderdate);
          row['pinfo'] = JSON.parse(row.pinfo);
          row['checkoutItemData'] = JSON.parse(row.checkoutItemData);
          row['prodlists'] = [];

          var idsDta = row.pinfo.join('","');
          let prodDta = `SELECT prod_img, prod_price, prod_name FROM prod_details Where prod_id IN ("${idsDta}")`;
          ids.push(prodDta);

          mainArr.push(row);
        });
        
      } else {
        console.log(err);
        res.send({ error: err });
      }

      ids.forEach((dta) => {
        
        sql.query(dta, (err, rows1) => {
            if(!err){
              len++;
              rows1.forEach((row1, i) => {
                row1['prod_img'] = row1.prod_img.split("[--split--]");
                row1['prod_img'] = row1.prod_img[0];
              });
              mainArr[len-1]['prodlists'].push(rows1);

              if(len === ids.length) {
                mainArr.forEach((res) => {
                  res.prodlists = res.prodlists[0];
                  res['checkoutItemData'].forEach((dta, j) => {
                    res.prodlists[j]['id'] = dta["id"] ? dta["id"] : '';
                    res.prodlists[j]['delvdate'] = dta["delvdate"] ? dta["delvdate"] : '';
                    res.prodlists[j]['qty'] = dta["qty"] ? dta["qty"] : '';
                    res.prodlists[j]['price'] = dta["price"] ? dta["price"] : '';
                    res.prodlists[j]['tenure'] = dta["tenure"] ? dta["tenure"] : '';
                  });
                });
                res.send(mainArr);
              }
            }
          });
      });
      
      
    }
  );

  
});

// Update orders
router.put("/update/:id", (req, res) => {
  var id = req.params.id;
  var sqlUpdate = 'UPDATE orders SET delivery_status= ?, refund_status= ? WHERE txnid= ?';
  sql.query(
    sqlUpdate,
    [
      req.body.deliveryStatus,
      req.body.refundStatus,
      id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'order status updated'});
        console.log('updated')
      } else {
        res.send({ error: err });
        console.log(err);
      }
    }
  );
});


router.get('/txn/:id', function(req, res, next) {
  sql.query(
    `SELECT * FROM orders where txnid = ?`,
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

module.exports = router;
