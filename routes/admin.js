var express = require("express");
var router = express.Router();
const constants = require("../constant/constUrl");
var sql = require("../db.js");
const testFolder = 'D:\\iro-assets\\Product image\\AC';
const fs = require('fs');
var requestify = require('requestify'); 
var cron = require('node-cron');
const config = require('../config.json');

const request = require('request');
const http = require("https");

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

function dateDiffInDays2(a) {
	var currentDate = new Date();

	var currentOffset = currentDate.getTimezoneOffset();

	var ISTOffset = 330;   // IST offset UTC +5:30 

	var ISTTime = new Date(currentDate.getTime() + (ISTOffset + currentOffset)*60000);

  let dateParts = a.split("/");

  // month is 0-based, that's why we need dataParts[1] - 1
  let dateObject = new Date(+dateParts[2], dateParts[1]-1, +dateParts[0]);	
  let dd= dateObject.getDate();
  let mm=dateObject.getMonth();
  let yy=dateObject.getFullYear();
  let db = mm+1+'/'+dd+'/'+yy;
  let expiryDate= new Date(db);
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
  const utc2 = Date.UTC(ISTTime.getFullYear(), ISTTime.getMonth(), ISTTime.getDate());
  // console.log(Math.floor((utc2 - utc1) / _MS_PER_DAY));
  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

function updateFields(productsArrData, prodAllData, oid){
  let cON;
  let order_item_id;
  let filteredProducts;
  let toBeRenewed=[];
  let productsArr=productsArrData;
  let prodAll=prodAllData;
    for(let i =0 ;i<productsArr.length;i++){
      let productExpiryDate = productsArr[i].expiryDate;
      let daysInDiff=dateDiffInDays2(productExpiryDate);
      if(daysInDiff<=0 && productsArr[i].overdew!=1){ //for multiple rows overdue of same product
        cON=productsArr[i].currentOrderNo;
        order_item_id = productsArr[i].order_item_id;
        filteredProducts=prodAll.filter(item => item.order_item_id == order_item_id);
        productsArr[i].ordered=0;   
        productsArr[i].overdew=0; 
        productsArr[i].renewed=4;   
        productsArr[i].currentOrderNo=oid;  
        toBeRenewed.push(productsArr[i]);
      } else{ //if overdue code
        cON=productsArr[i].currentOrderNo;
        order_item_id = productsArr[i].order_item_id;
        filteredProducts=prodAll.filter(item => item.order_item_id == order_item_id);
        productsArr[i].overdew=0;
        productsArr[i].renewed=4; 
        productsArr[i].currentOrderNo=oid;  
        toBeRenewed.push(productsArr[i]);          
      }
      filteredProducts.forEach((indexFilter)=>{
        for(let pi=0;pi<productsArr.length;pi++){
          if(indexFilter.startDate===productsArr[pi].startDate){
            if(dateDiffInDays2(indexFilter.startDate)<0){
              indexFilter.renewed=1;
            }else{
              indexFilter.renewed=4;
            }
            indexFilter.overdew=0;
            indexFilter.currentOrderNo=cON;
          }
        }
      });
      let productsToUpdate={
        checkoutProductsInfo:  JSON.stringify(filteredProducts),
        txnid: order_item_id
      }
      
    requestify.put(`${constants.apiUrl}payments/updateNewRenewOrder2`, productsToUpdate).then(function(response4) {
      response4.getBody();
    });
  }
}


router.get('/cashfree/:id',function(req, res) {
    var options = {
      method: 'GET',
      url: `https://sandbox.cashfree.com/pg/orders/${req.params.id}/payments`,
      headers: {
        Accept: 'application/json',
        'x-client-id': '9919345c947b577353500475a39199',
        'x-client-secret': '2c0442aa3d959d2ae48f1c2e17527a46cc35d1fa',
        'x-api-version': '2022-01-01'
      }
    };
    request(options, function (error, response, body) {
      var arr=[];
      arr = JSON.parse(body);
      res.send(arr);
    });
});
cron.schedule('0 0 */1 * * *', () => {
  console.log('1 hr');
});

cron.schedule('* * * * *', () => {  
  sql.query(
    `SELECT * FROM orders WHERE orderType_id=2 AND paymentStatus=8;`,
    (err, rows) => {
      if (!err) {
        var initiatedOrders = rows;
        initiatedOrders.forEach((orders)=>{
          logger.info({
            message: `Renewal order job running- order#: ${orders.order_id}`,
            dateTime: new Date()
          });
          var options = {
            method: 'GET',
            url: `${config.CashfreeAPI}/orders/${orders.order_id}/payments`,
            headers: {
              Accept: 'application/json',
              'x-client-id': config.appId,
              'x-client-secret': config.secretKey,
              'x-api-version': '2022-01-01'
            }
          };
          request(options, function (error, response, body) {
            // if (error) throw new Error(error);
            var data2 = JSON.parse(body);
            if(data2.code=='order_id_not_found'){
              var updateOrder2 = `UPDATE orders SET paymentStatus = ? where order_id= ?`;
              sql.query(updateOrder2,
              [
                11,
                orders.order_id,
              ]);
            } else{
              let orderStatus = [];        
              orderStatus = JSON.parse(body);
              let items = orderStatus.filter(item=>item.payment_status=='SUCCESS');
              if(items.length>0){
                logger.info({
                  message: `Renewal order success job executed- order#: ${orders.order_id}`,
                  dateTime: new Date()
                });
                var itemBody = items[0];
                var invoiceInsert = "INSERT INTO `invoice`(`invoice_id`, `order_id`, `invoice_description`, `status`) VALUES (?,?,?,?)";
                var sqlInsert = "INSERT INTO `transaction`(`transaction_id`, `order_id`,`order_amount`, `status`, `type`,`transaction_source`,`transaction_msg`, `createdAt`) VALUES (?,?,?,?,?,?,?,?)";  
                sql.query(sqlInsert,
                  [
                    itemBody.cf_payment_id,
                    orders.order_id,
                    itemBody.order_amount,
                    1,
                    itemBody.payment_group,
                    'Cashfree',
                    itemBody.payment_message,
                    new Date()
                  ],
                  (err1) => {
                  if (!err1) {
                    var updateOrder = `UPDATE orders SET paymentStatus = ? where order_id= ?`;
                    sql.query(updateOrder,
                    [
                      1,
                      orders.order_id,
                    ]);
                  } else {
                    res.send({message: err});
                  }
                  }
                );
          
                sql.query(invoiceInsert,
                  [
                  'N/A',
                  orders.order_id,
                  'N/A',
                  1
                  ],
                  (err1, results) => {
                  if (!err1) {
                    var invoiceNo = 'IRO/21-22/'+results.insertId;
                    var updateInvoice = `UPDATE invoice SET invoice_id = ? where id= ?`;
                    sql.query(updateInvoice,
                    [
                      invoiceNo,
                      results.insertId,
                    ]);
                  } else {
                    res.send({message: err});
                  }
                  }
                );
          
                var orderDetails;
                var products;
                var prodAll=[];
                var AllProductsOf=[];
                let cid = new Promise((resolve, reject) => {				
                  requestify.get(`${constants.apiUrl}orders/getOrderByMyOrderIdAPI/${orders.order_id}`).then(async function(response) {
                    // Get the response body
                    orderDetails = await response.getBody()[0];	
                    requestify.get(`${constants.apiUrl}orders/renewals2/${orderDetails.customer_id}`).then(async function(response2) {
                      // Get the response body
                      let renewalDetails = await response2.getBody();
                      let successOrders=renewalDetails.filter((successOrdersRes)=>{
                        // if(successOrders.overdue==1){
                        //   this.overdue=1;
                        // }
                      return successOrdersRes.paymentStatus=='1' && (successOrdersRes.orderType_id==1 || successOrdersRes.orderType_id==3);
                      });
                      let orders=await successOrders.reverse();
                      orders.forEach((res2)=>{
                        products=res2.renewals_timline;    
                        for(let p=0;p<products.length;p++){
                        let ucid={ 
                          indexs:products[p].indexs,
                          id: products[p].id,
                          prod_name:products[p].prod_name,
                          prod_price:products[p].prod_price,
                          prod_img:products[p].prod_img,
                          delvdate: products[p].delvdate,
                          actualStartDate:products[p].actualStartDate,
                          qty: products[p].qty, 
                          price: products[p].price, 
                          tenure: products[p].tenure,
                          primaryOrderNo:products[p].primaryOrderNo, 
                          currentOrderNo: products[p].currentOrderNo,
                          renewed:products[p].renewed,
                          startDate:products[p].startDate,
                          expiryDate:products[p].expiryDate,
                          nextStartDate:products[p].nextStartDate,
                          overdew:products[p].overdew,
                          ordered:products[p].ordered,
                          assetId:products[p].assetId,
                          deliveryStatus:'renewed',
                          dp:products[p].dp,
                          deliveryAssigned:products[p].deliveryAssigned,
                          replacement:products[p].replacement,
                          returnDate:products[p].returnDate,
                          billPeriod:products[p].billPeriod,
                          billAmount:products[p].billAmount,
                          damageCharges:products[p].damageCharges,
                          order_item_id:products[p].order_item_id,
                          p2Rent:products[p].p2Rent,
                          securityDepositDiff:products[p].securityDepositDiff,
                          returnedProduct: products[p].returnedProduct,
                          tenureBasePrice:products[p].tenureBasePrice,
                          tenure_id:products[p].tenure_id
                        }
                        AllProductsOf.push(ucid);
                        }  
                      });
                    
                      for(let i=0;i<AllProductsOf.length;i++){
                        prodAll.push(AllProductsOf[i]);
                      }
                      requestify.get(`${constants.apiUrl}orders/orderId/${orderDetails.id}`).then(async function(response3) {
          
                        let productsArr =[];
                        let prodLoop = await response3.getBody()[0].orderItem;
                        prodLoop.forEach((prodRenewals)=>{
                          productsArr.push(prodRenewals.renewals_timline[0]);
                        });
                        let oid = await response3.getBody()[0].order_id;
                        updateFields(productsArr, prodAll,oid);
                        resolve('cid success');
                        
                      });
                      
                    });			
                  });
                });
          
                
                cid.then((success)=>{
                  logger.info({
                    message: '/renewalsResult transaction successfull',
                    dateTime: new Date()
                  });
                });
              } else if(items.length!=0 && items[0].payment_status!='NOT_ATTEMPTED'){
                var updateOrder3 = `UPDATE orders SET paymentStatus = ? where order_id= ?`;
                sql.query(updateOrder3,
                [
                  11,
                  orders.order_id,
                ]);
              }
            }
            
          });
        });        
      }else {
        res.send({ error: 'Error' });
      }
  });
});

cron.schedule('* * * * *', () => {
  sql.query(
    `SELECT * FROM orders WHERE orderType_id=1 AND paymentStatus=8;`,
    (err, rows) => {
      if (!err) {
        // console.log(rows);
        var initiatedOrders = rows;
        initiatedOrders.forEach((orders)=>{
          console.log(orders);
          logger.info({
            message: `Primary order job running order#:${orders.order_id}`,
            dateTime: new Date()
          });
          var options = {
            method: 'GET',
            url: `${config.CashfreeAPI}/orders/${orders.order_id}/payments`,
            headers: {
              Accept: 'application/json',
              'x-client-id': config.appId,
              'x-client-secret': config.secretKey,
              'x-api-version': '2022-01-01'
            }
          };
        
          request(options, function (error, response, body) {
            // if (error) throw new Error(error);
            var data2 = JSON.parse(body);
            if(data2.code=='order_id_not_found'){
              var updateOrder2 = `UPDATE orders SET paymentStatus = ? where order_id= ?`;
              sql.query(updateOrder2,
              [
                11,
                orders.order_id,
              ]);
            } else{
              var cashreeData = [];
              cashreeData=JSON.parse(body);
              let successOrder = cashreeData.filter(item=>item.payment_status=='SUCCESS');
              if(successOrder.length>0){
                logger.info({
                  message: `Primary order success job execuetd order#:${orders.order_id}`,
                  dateTime: new Date()
                });
                var transactionData = successOrder[0];

                var invoiceInsert = "INSERT INTO `invoice`(`invoice_id`, `order_id`, `invoice_description`, `status`) VALUES (?,?,?,?)";
                var sqlInsert = "INSERT INTO `transaction`(`transaction_id`, `order_id`,`order_amount`, `status`, `type`,`transaction_source`,`transaction_msg`, `createdAt`) VALUES (?,?,?,?,?,?,?,?)";  
                sql.query(sqlInsert,
                  [
                  transactionData.cf_payment_id,
                  orders.order_id,
                  transactionData.payment_amount,
                  1,
                  transactionData.payment_group,
                  'Cashfree',
                  transactionData.payment_message,
                  new Date()
                  ],
                  (err1) => {
                    if (!err1) {
                      var updateOrder = `UPDATE orders SET paymentStatus = ? where order_id= ?`;
                      sql.query(updateOrder,
                      [
                        1,
                        orders.order_id,
                      ]);
                    } else {
                      res.send({message: err});
                    }
                  }
                );

                
                sql.query(invoiceInsert,
                  [
                  'N/A',
                  orders.order_id,
                  'N/A',
                  1
                  ],
                  (err1, results) => {
                  if (!err1) {
                    var invoiceNo = 'IRO/21-22/'+results.insertId;
                    var updateInvoice = `UPDATE invoice SET invoice_id = ? where id= ?`;
                    sql.query(updateInvoice,
                    [
                      invoiceNo,
                      results.insertId,
                    ]);
                  } else {
                    res.send({message: err});
                  }
                  }
                );

                requestify.get(`${constants.apiUrl}orders/getOrderByMyOrderIdAPI/${orders.order_id}`).then(function(response) {
                  // Get the response body
                  let orderDetails = response.getBody()[0];
                  requestify.post(`${constants.apiUrl}smsOrder`, {
                    customerName: orderDetails.firstName, mobile:orderDetails.mobile, orderId:orders.order_id
                  });
                  // requestify.post(`${constants.apiUrl}forgotpassword/send`, {
                  // 	email: orderDetails.email
                  // });
                });
              } else if(cashreeData.length!=0 && cashreeData[0].payment_status!='NOT_ATTEMPTED'){
                var updateOrder3 = `UPDATE orders SET paymentStatus = ? where order_id= ?`;
                sql.query(updateOrder3,
                [
                  11,
                  orders.order_id,
                ]);
              }
            }

          });
        });
      } else {
        res.send({ error: 'Error' });
      }
    }
);
});



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
  