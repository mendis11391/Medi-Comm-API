var express = require("express");
var router = express.Router();
const constants = require("../constant/constUrl");
var sql = require("../db.js");
const testFolder = 'D:\\iro-assets\\Product image\\AC';
const fs = require('fs');
var requestify = require('requestify'); 
var cron = require('node-cron');

// cron.schedule('* * * * *', () => {
//   console.log('running a task every minute');
//   testJob();
// });

function media(category){
  let catArr=[];
  const testFolder = `D:\\iro-assets\\Product image\\${category}`;
  fs.readdir(testFolder, (err, files) => {
    files.forEach(file => {
      catArr.push(file);
      console.log(file);
      return catArr;
    });
  });
}

// Verify token 
// Verify token 
function verifyToken(req, res, next) {
  if(req.headers.origin.includes(`${constants.frontendUrl}`)){
    next();
  } else{
    return res.status(401).send("Unauthorized request");
  }
}

function testJob(){
  var filteredOrders=[];
  var filteredOrderItems=[];
  var order;
  requestify.get(`${constants.apiUrl}orders/getAllOrderItems`).then(function(orderItems) {
    // Get the response body
    console.log(orderItems.body);
    let orderItemsParse = JSON.parse(orderItems.body);
    order = orderItemsParse.filter(item => item.status==true && item.delivery_status==4 );
    for(let o=0;o<order.length;o++){
      let otParse = JSON.parse(order[o].renewals_timline);
      
      requestify.get(`${constants.apiUrl}orders/renewals/${order[o].customer_id}`).then(function(orderItems2) {
        console.log(orderItems2);
      });
      for(let p=0;p<otParse.length;p++){
        if(otParse[p].order_item_id==order[o].order_item_id){
          otParse[p].firstName=order[o].firstName;
          otParse[p].mobile=order[o].mobile;
          otParse[p].customer_id = order[o].customer_id;
          otParse[p].order_id=order[o].order_id;
        }          
        filteredOrders.push(otParse[p]);
        filteredOrderItems = filteredOrders.filter(item=>item.renewed==0);
      }
      filteredOrderItems = filteredOrders.filter(item=>item.renewed==0);
      let myFromDate = addDays(new Date(), 5);
      filteredOrderItems = filteredOrderItems.filter(
      m => parseDate(m.startDate) <= new Date(myFromDate)
      );
      console.log(filteredOrderItems);
    }
  });
}

function addDays(theDate, days) {
  return new Date(theDate.getTime() + days*24*60*60*1000);
}

function parseDate(dateStr) {
  var date = dateStr.split('/');
  var day = date[0];
  var month = date[1] - 1; //January = 0
  var year = date[2];
  return new Date(year, month, day); 
}

/* GET all reviews */
router.get('/', verifyToken,function(req, res) {
    sql.query(
        `SELECT * FROM admin`,
        (err, rows) => {
          if (!err) {
            res.send(rows);
          } else {
            res.send({ error: 'Error' });
          }
        }
    );
});

router.get('/getCustomerRequests', function(req, res) {
  let len=0;
  sql.query(
      `CALL get_customerRequests() `,
      (err, rows) => {
        if (!err) {
          let requests = rows[0];
          for(let i=0;i<requests.length;i++){
            len++;
            requests[i].renewals_timline=JSON.parse(requests[i].renewals_timline); 
            if(len==requests.length){
              res.send(requests);   
            }
          }            
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

router.get('/getfolder', function(req, res) {
  let len=0;
  sql.query(
      `CALL get_customerRequests() `,
      (err, rows) => {
        if (!err) {
          let requests = rows[0];
          for(let i=0;i<requests.length;i++){
            len++;
            requests[i].renewals_timline=JSON.parse(requests[i].renewals_timline); 
            if(len==requests.length){
              let a =media('AC');
              res.sendFile(a);
              // res.send(requests);   
            }
          }            
        } else {
          res.send({ error: 'Error' });
        }
      }
    );
});

router.get('/:id', verifyToken,function(req, res, next) {
    sql.query(
      `SELECT user_id, uname, usertype, email FROM admin WHERE user_id = ?`,
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

  

// router.post("/", function (req, res) {
    
//     var sqlInsert =
//       "INSERT INTO `review`(`name`, `email`, `rating`, `review_desc`) VALUES (?, ?, ?, ?)";
//     sql.query(
//       sqlInsert,
//       [
//         req.body.name,
//         req.body.email,
//         req.body.rating,
//         req.body.reviewDescription,
//       ],
//       (err) => {
//         if (!err) {
//           res.send({message: 'Review Inserted Successfully'});
//         } else {
//           res.send({message: err});
//         }
//       }
//     );
//   });


  
  module.exports = router;
  