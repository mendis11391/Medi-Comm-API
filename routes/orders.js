var express = require('express');
var router = express.Router();
const constants = require("../constant/constUrl");
var sql = require("../db.js");

const winston = require('winston');
var currentDate = new Date().toJSON().slice(0,10);

// Verify token 
function verifyToken(req, res, next) {
  if(req.headers.origin===`${constants.frontendUrl}`){
    next();
  } else{
    return res.status(401).send("Unauthorized request");
  }
}

function verifyToken2(req, res, next) {
  if(req.headers.origin.includes(`${constants.frontendUrl}`)){
    next();
  } else{
    return res.status(401).send("Unauthorized request");
  }
}
 
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

function dateDiffInDays(a, b) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

function ISTDate(date){
  let ed = new Date(date);
            let dd= ed.getDate();
            let mm=ed.getMonth()+1;
            let yy=ed.getFullYear();

            return db = dd+'/'+mm+'/'+yy;
}

function getDates(date){
  let dateParts = date.split("/");

            // month is 0-based, that's why we need dataParts[1] - 1
            let dateObject = new Date(+dateParts[2], dateParts[1]-1, +dateParts[0]);	
            let dd= dateObject.getDate();
            let mm=dateObject.getMonth();
            let yy=dateObject.getFullYear();

            let Days=new Date(yy, mm+2, 0).getDate();

            if(Days<dd){             
              ned  = new Date(yy, mm+1, Days);
            }else{					
              ned = new Date(yy, mm+1, dd-1);
              
            }
            ned.setDate(ned.getDate() + 1);
            return ned;
}
function addOneDay(date){
  return date.setDate(ned.getDate() + 1);
}

// Get all orders
router.get("/", (req, res) => {
  logger.info({
    message: '/all orders api started',
    dateTime: new Date()
  });
  let orders=[];
  let orderAddress=[];
  let orderItem = [];
  let len=0;
  let delivered=[];
  let shipped=[];
  let others=[];
  sql.query(
    `CALL get_all_orders()`,
    (err, rows, fields) => {
      if (!err) {
        logger.info({
          message: '/all orders fetched successfully',
          dateTime: new Date()
        });
        rows[0].forEach((resp)=>{
          orders.push(resp);
          
        });
      } else {
        logger.info({
          message: '/all orders failed to load',
          dateTime: new Date()
        });
        res.send({ error: err });
      }
      orders.forEach((orders,i,ele) => {
        sql.query(
          `CALL get_addressById(${orders.billingAddress})`,
          (err1, rows1, fields) => {
            if (!err1) { 
              sql.query(
                `CALL get_orderItemByorder(${orders.id})`,
                (err2, rows2, fields) => {
                  if (!err2) { 
                    sql.query(
                      `CALL get_addressById(${orders.shippingAddress})`,
                      (err3, rows3, fields) => {
                        if(!err3){
                          len++;
                          orders.orderItem = rows2[0];  
                          orders.billingAddress = rows1[0];                           
                          orders.shippingAddress = rows3[0];
                          orderItem.push(orders); 
                          if(len===ele.length){
                            orderItem.forEach((ot, i)=>{
                              let forOT = ot.orderItem;
                              for(let i=0;i<forOT.length;i++){
                                forOT[i]['renewals_timline'] = JSON.parse(forOT[i].renewals_timline);
                                
                              }
                            });
                            if(len===ele.length){
                            
                              res.send(orderItem);
                            }
                          }
                        }
                         
                      });
                    
                    
                  }
                }
              );
              // orders.address = rows1[0];  
              // orderAddress.push(orders); 
              // if(len===ele.length){
              //   // res.send(orderAddress);
              // }
            }
          }
        ); 

        
        
      });
    }
  );
});

router.get('/orderItemsByorderId/:id', function(req, res) {
  logger.info({
    message: '/orderItemsByorderId/:id api started',
    dateTime: new Date()
  });
  sql.query(
      `CALL get_orderItemById(${req.params.id}) `,
      (err, rows) => {
        if (!err) {
          logger.info({
            message: '/orderItemsByorderId/:id fetched successfully',
            dateTime: new Date()
          });
          rows[0][0]['renewals_timline']=JSON.parse(rows[0][0].renewals_timline);
          res.send(rows[0]);
        } else {
          logger.info({
            message: '/orderItemsByorderId/:id failed to load',
            dateTime: new Date()
          });
          res.send({ error: 'Error' });
        }
      }
    );
});


router.get('/orderItems/:id', verifyToken,function(req, res) {
  logger.info({
    message: '/orderItems/:id api started',
    dateTime: new Date()
  });
  let orderItem=[];
  let len=0;
  sql.query(
      `CALL get_orderItemsByCustomerId(${req.params.id}) `,
      (err, rows) => {
        if (!err) {
          logger.info({
            message: '/orderItems/:id fetched successfully',
            dateTime: new Date()
          });
          rows[0].forEach((res)=>{
            orderItem.push(res);
            
          });
        } else {
          logger.info({
            message: '/orderItems/:id failed to load',
            dateTime: new Date()
          });
          res.send({ error: 'Error' });
        }

          orderItem.forEach((ot, i, ele)=>{
            len++;
            let forOT = ot;
            for(let i=0;i<forOT.length;i++){
              forOT[i]['renewals_timline'] = JSON.parse(forOT[i].renewals_timline);
            }
            if(len===ele.length){          
              res.send(orderItem);
            }
          });
          
      }
    );
});

// Update assetID in order item
router.put("/updateOrderItemAsset/:id", verifyToken,(req, res) => {
  var id = req.params.id;
  var sqlUpdate = 'UPDATE order_item SET asset_id= ?, renewals_timline=? WHERE order_item_id= ?';
  sql.query(
    sqlUpdate,
    [
      req.body.assetId,
      req.body.renewalTimeline,
      id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'asset updated for order item'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

// Update delivery status in order item
router.put("/updateRenewTimline/:id", verifyToken,(req, res) => {
  
  var delivered=[];
  var shipped=[];
  var others=[];
  var deliverStatus;
  var id = req.params.id;
  var sqlUpdate = 'UPDATE order_item SET delivery_status=? WHERE order_item_id= ?';
  sql.query(
    sqlUpdate,
    [
      req.body.deliveryStatus,
      // req.body.renewalTimeline,
      id
    ],
    (err, rows) => {
      if (!err) {
        var orderId = req.body.orderId;
        sql.query(
          `CALL get_orderItemsBYOrderId(${orderId}) `,
          (err2, rows2) => {
            if (!err2) {
              logger.info({
                message: '/updateRenewTimline/:id fetched successfully',
                dateTime: new Date()
              });
              let orderItems = rows2[0];
              // console.log(orderItems.length);
                for(let i=0; i<orderItems.length;i++){
                  if(orderItems[i].delivery_status==4 ){
                    delivered.push(1);              
                  } else {
                    delivered.push(0);
                  }
                  if(orderItems[i].delivery_status==3 ){
                    shipped.push(1);              
                  } else {
                    shipped.push(0);
                  }
                  if(orderItems[i].delivery_status==1 || orderItems[i].delivery_status==2 ){
                    others.push(1);              
                  } else {
                    others.push(0);
                  }
                }

                console.log(others);
                console.log(delivered);
                console.log(shipped);
                if(shipped.includes(1) && (others.includes(1) && !delivered.includes(1))){
                  deliverStatus = 2;
                } else if(shipped.includes(1) && !others.includes(1) && !delivered.includes(1)){
                  deliverStatus = 3;
                } else if(!shipped.includes(1) && delivered.includes(1) && !others.includes(1) ){
                  deliverStatus = 4;
                } else if(!shipped.includes(1) && delivered.includes(1) && others.includes(1) ){
                  deliverStatus = 5;
                } else if(shipped.includes(1) && delivered.includes(1) && others.includes(1) ){
                  deliverStatus = 5;
                }  else if(shipped.includes(1) && delivered.includes(1) && others.includes(0) ){
                  deliverStatus = 5;
                } else if(shipped.includes(0) && delivered.includes(1) && others.includes(0)){
                  deliverStatus = 4;
                }
                console.log(deliverStatus);
                var sqlUpdate = 'UPDATE orders SET deliveryStatus= ? WHERE id= ?';
                sql.query(
                  sqlUpdate,
                  [
                    deliverStatus,
                    orderId
                  ],(err3, rows3) => {
                    if (err3) {
                      logger.info({
                        message: '/updateRenewTimline/:id Error:'+err3,
                        dateTime: new Date()
                      });
                      res.send({ error: err3 });
                    }
                  }
                );
            }               
          }
        );
        logger.info({
          message: '/updateRenewTimline/:id delivery status updated for order item',
          dateTime: new Date()
        });
        res.send({'message': 'delivery status updated for order item'});
      } else {
        logger.info({
          message: '/updateRenewTimline/:id Error:'+err,
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

router.put("/updateRenewalTimeline/:id",verifyToken, (req, res) => {
  var id = parseInt(req.params.id);
  var sqlUpdate = 'UPDATE order_item SET asset_id=?, renewals_timline=?, status=? WHERE order_item_id= ?';
  sql.query(
    sqlUpdate,
    [
      req.body.assetId,
      req.body.renewalTimeline,
      req.body.status,
      id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'delivery date updated for order item'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

router.put("/updateRenewalTimelineByorderItemId/:id",verifyToken, (req, res) => {
    var sqlUpdate = 'UPDATE order_item SET renewals_timline= ? WHERE order_item_id= ?';
    sql.query(
      sqlUpdate,
      [
        req.body.renewals_timline,
        req.params.id
      ],
      (err, rows) => {
        if (!err) {
          res.send({'message': 'Renewals timline updated for order item'});
        } else {
          res.send({ error: err });
        }
      }
    );
});

//update any Transaction field
router.put("/updateAnytransactionField/:id", verifyToken,(req, res) => {
  var id = req.params.id;
  var sqlUpdate = `UPDATE transaction SET ${req.body.transactionField}= ? WHERE transaction_id= ?`;
  sql.query(
    sqlUpdate,
    [
      req.body.transactionValue,
      id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'Transaction field updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

//update any order field
router.put("/updateAnyOrderField/:id", verifyToken,(req, res) => {
  var id = req.params.id;
  var sqlUpdate = `UPDATE orders SET ${req.body.orderField}= ? WHERE primary_id= ?`;
  sql.query(
    sqlUpdate,
    [
      JSON.parse(req.body.orderValue),
      id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'Order field updated'});
      } else {
        res.send({ error: err });
      }
    }
  );
});

router.get('/getAllOrderStatus', function(req, res) {
  logger.info({
    message: 'getAllOrderStatus api started',
    dateTime: new Date()
  });
  sql.query(
      `SELECT * FROM order_status;`,
      (err, rows) => {
        if (!err) {
          logger.info({
            message: 'getAllOrderStatus fetched successfully',
            dateTime: new Date()
          });
          res.send(rows);
        } else {
          logger.info({
            message: 'getAllOrderStatus failed to load',
            dateTime: new Date()
          });
          res.send({ error: 'Error' });
        }

          
      }
    );
});

//get all payment status 
router.get('/getAllPaymentStatus', function(req, res) {
  logger.info({
    message: 'getAllPaymentStatus api started',
    dateTime: new Date()
  });
  sql.query(
      `SELECT * FROM payment_status;`,
      (err, rows) => {
        if (!err) {
          logger.info({
            message: 'getAllPaymentStatus fetched successfully',
            dateTime: new Date()
          });
          res.send(rows);
        } else {
          logger.info({
            message: 'getAllPaymentStatus failed to load',
            dateTime: new Date()
          });
          res.send({ error: 'Error' });
        }

          
      }
    );
});

//get all payment status 
router.get('/getAllPaymenttypes', function(req, res) {
  logger.info({
    message: 'getAllPaymentStatus api started',
    dateTime: new Date()
  });
  sql.query(
      `SELECT * FROM payment_type;`,
      (err, rows) => {
        if (!err) {
          logger.info({
            message: 'getAllPaymentStatus fetched successfully',
            dateTime: new Date()
          });
          res.send(rows);
        } else {
          logger.info({
            message: 'getAllPaymentStatus failed to load',
            dateTime: new Date()
          });
          res.send({ error: 'Error' });
        }

          
      }
    );
});

router.get('/getAllDeliveryStatus', verifyToken,function(req, res) {
  logger.info({
    message: 'getAllDeliveryStatus api started',
    dateTime: new Date()
  });
  sql.query(
      `SELECT * FROM delivery_status;`,
      (err, rows) => {
        if (!err) {
          logger.info({
            message: 'getAllDeliveryStatus fetched successfully',
            dateTime: new Date()
          });
          res.send(rows);
        } else {
          logger.info({
            message: 'getAllDeliveryStatus failed to load',
            dateTime: new Date()
          });
          res.send({ error: 'Error' });
        }

          
      }
    );
});

router.put("/updateOrderItemDeliveryDate/:id", verifyToken,(req, res) => {
  var id = req.params.id;
  var sqlUpdate = 'UPDATE order_item SET startDate= ?, endDate= ?, renewals_timline=? WHERE order_item_id= ?';
  sql.query(
    sqlUpdate,
    [
      new Date(req.body.deliveryDate),
      new Date(req.body.expiryDate),
      req.body.renewalTimeline,
      id
    ],
    (err, rows) => {
      if (!err) {
        res.send({'message': 'delivery date updated for order item'});
      } else {
        logger.info({
          message: 'Failed to update delivery date'+err,
          dateTime: new Date()
        });
        res.send({ error: err });
      }
    }
  );
});

// Update status and damage charges in order item
router.put("/updateOrderItemStatus/:id", verifyToken,(req, res) => {
  var id = req.params.id;
  var sqlUpdate = 'UPDATE order_item SET status= ?, damage_charges=? WHERE order_item_id= ?';
  sql.query(
    sqlUpdate,
    [
      req.body.status,
      req.body.damageCharges,
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

router.get('/renewals/:id', function(req, res) {
  let orderItem=[];
  let len=0;
  sql.query(
      `CALL get_renewalsByCustomerId(${req.params.id}) `,
      (err, rows) => {
        if (!err) {
          if(rows[0].length>0){
            rows[0].forEach((res)=>{
              orderItem.push(res);              
            });
          } else{
            res.send(rows[0]);
          }
          
        } else {
          res.send({ error: err });
        }

          if(orderItem){
            orderItem.forEach((ot, i, ele)=>{
              len++;
              let forOT = ot;
              let delivered=[];
              let shipped=[];
              let others=[];
              let currDate=new Date();
                
              forOT['renewals_timline'] = JSON.parse(forOT.renewals_timline);
              forOT['renewals_timline'] .forEach((resp)=>{              
                resp['indexs']=Math.floor((Math.random() * 9999) + 1);
                resp.order_item_id = forOT.order_item_id                     
                
              });            
              
              let cid = forOT.renewals_timline;
              
              for(let i=0;i<cid.length;i++){
                // cid[i].indexs=Math.floor((Math.random() * 9999) + 1);
                
                let ucid={ 
                  indexs:Math.floor((Math.random() * 9999) + 1),
                  id: cid[i].id,
                  order_item_id: forOT.order_item_id,
                  prod_name:cid[i].prod_name,
                  prod_price:cid[i].prod_price,
                  // prod_img:cid[i].prod_img,
                  delvdate: cid[i].delvdate,
                  actualStartDate:cid[i].actualStartDate,
                  qty: cid[i].qty, 
                  price: cid[i].price, 
                  tenure: cid[i].tenure,
                  primaryOrderNo:cid[i].primaryOrderNo, 
                  currentOrderNo: cid[i].currentOrderNo,
                  renewed:cid[i].renewed,
                  startDate:cid[i].startDate,
                  expiryDate:cid[i].startDate,
                  nextStartDate:cid[i].expiryDate,
                  overdew:cid[i].overdew,
                  assetId:cid[i].assetId,
                  deliveryStatus:cid[i].deliveryStatus,
                  deliveryDateAssigned:cid[i].deliveryDateAssigned,
                  deliveryAssigned:cid[i].deliveryAssigned,
                  dp:cid[i].dp,
                  replacement:cid[i].replacement,
                  returnDate:cid[i].returnDate,
                  billPeriod:cid[i].billPeriod,
                  billAmount:cid[i].billAmount,
                  damageCharges:cid[i].damageCharges,
                  tenure_id:cid[i].tenure_id,
                  tenureBasePrice:cid[i].tenureBasePrice
                }
                
                
                let ed = cid[i].nextStartDate;
                let dateParts = ed.split("/");
    
                // month is 0-based, that's why we need dataParts[1] - 1
                let dateObject = new Date(+dateParts[2], dateParts[1]-1, +dateParts[0]);	
                let dd= dateObject.getDate();
                let mm=dateObject.getMonth();
                let yy=dateObject.getFullYear();
    
                let db = mm+1+'/'+dd+'/'+yy;
                let expiryDate= new Date(db);
                let Days=new Date(yy, mm+2, 0).getDate();
    
                if(Days<dd){
                  newED = new Date(yy, mm+1, Days);              
                  ned  = new Date(yy, mm+1, Days);
                }else{					
                  newED = new Date(yy, mm+1, dd-1);
                  ned = new Date(yy, mm+1, dd-1);              
                }
                ned.setDate(ned.getDate() + 1);
                  
                let sd = cid[i].startDate;
                let sdateParts = sd.split("/");
    
                // month is 0-based, that's why we need dataParts[1] - 1
                let sDateObject = new Date(+sdateParts[2], sdateParts[1]-1, +sdateParts[0]);	
                let sdd= sDateObject.getDate();
                let smm=sDateObject.getMonth();
                let syy=sDateObject.getFullYear();
    
                let sdb = smm+1+'/'+sdd+'/'+syy;
                let startDate= new Date(sdb);
    
                let daysInDiff=dateDiffInDays(startDate, currDate); 
                if(daysInDiff>=0 && (cid[i].renewed!=4 && cid[i].overdew!=1)){
                  if(cid[i].ordered==1){
                    cid[i].renewed=1
                    cid[i].overdew=0
                  } else if(cid[i].renewed==1 || cid[i].renewed==4){
                    cid[i].overdew=0
                  }
  
                  cid[i].overdew=1;
                  // row['overdue']=1;
                  ucid.renewed=0;
                  ucid.startDate=cid[i].nextStartDate;
                  ucid.expiryDate=ISTDate(newED);
                  ucid.nextStartDate=ISTDate(ned);
                  ucid.billPeriod = ucid.startDate+'-'+ucid.expiryDate
                  ucid.overdew=0;
                  ucid.ordered=0;
                  forOT['renewals_timline'].push(ucid);
                  var sqlUpdate = 'UPDATE order_item SET renewals_timline= ? WHERE order_item_id= ?';
                  sql.query(
                    sqlUpdate,
                    [
                      JSON.stringify(forOT['renewals_timline']),
                      forOT['order_item_id']
                    ]
                  );
                }
  
                if(cid[i].ordered==1){
                  var sqlUpdate = 'UPDATE order_item SET overdue=? WHERE order_item_id= ?';
                  sql.query(
                    sqlUpdate,
                    [
                      0,
                      forOT['order_item_id']
                    ]
                  );
                } else if((cid[i].overdew==1)){
                  var sqlUpdate = 'UPDATE order_item SET overdue=? WHERE order_item_id= ?';
                  sql.query(
                    sqlUpdate,
                    [
                      1,
                      forOT['order_item_id']
                    ]
                  );
                }
  
                
    
                if((cid[i].renewed==1 || cid[i].renewed==4) && cid[i].ordered!=1){
                  
                  var sqlUpdate = 'UPDATE assets SET startDate=?, EndDate=?, nextStartDate=? WHERE asset_no= ?';
                  sql.query(
                    sqlUpdate,
                    [
                      cid[i].startDate,
                      cid[i].expiryDate,
                      cid[i].nextStartDate,
                      ucid.assetId
                    ]
                  );
  
                  var sqlUpdate = 'UPDATE order_item SET overdue=? WHERE order_item_id= ?';
                  sql.query(
                    sqlUpdate,
                    [
                      0,
                      forOT['order_item_id']
                    ]
                  );
  
                  
                }
                
              }
  
              cid.forEach((cidResults)=>{
                if(cidResults.overdew==1 && cidResults.ordered!=1){
                  var sqlUpdate = 'UPDATE order_item SET overdue=? WHERE order_item_id= ?';
                  sql.query(
                    sqlUpdate,
                    [
                      1,
                      forOT['order_item_id']
                    ]
                  );
                }
  
              })
  
              if(len===ele.length){          
                res.send(orderItem);
              }
            });
          }
          
      }
    );
});

router.get('/renewals2/:id', function(req, res) {
  let orderItem=[];
  let len=0;
  sql.query(
      `CALL get_renewalsByCustomerId(${req.params.id}) `,
      (err, rows) => {
        if (!err) {
          if(rows[0].length>0){
            rows[0].forEach((res)=>{
              orderItem.push(res);              
            });
          } else{
            res.send(rows[0]);
          }
          
        } else {
          res.send({ error: err });
        }

          if(orderItem){
            orderItem.forEach((ot, i, ele)=>{
              len++;
              let forOT = ot;
              let delivered=[];
              let shipped=[];
              let others=[];
              let currDate=new Date();
                
              forOT['renewals_timline'] = JSON.parse(forOT.renewals_timline);          
              
              
  
  
              if(len===ele.length){          
                res.send(orderItem);
              }
            });
          }
          
      }
    );
});

router.get('/getAllOrderItems', function(req, res) {
  sql.query(
    `CALL get_allOrderItems()`,
    (err, rows, fields) => {
      if(!err){
        res.send(rows[0]);
      } else{
        res.send(err);
      }
    });
});

router.get('/customerRequests/:id', verifyToken,function(req, res) {
  sql.query(
    `CALL getCustomerRequestsByOTID(${req.params.id})`,
    (err, rows, fields) => {
      if(!err){
        res.send(rows[0]);
      }
    });
});


router.get('/orderId/:id', function(req, res) {
  
  let orders=[];
  let orderItem = [];
  let len=0;
  sql.query(
      `CALL get_orderById(${req.params.id}) `,
      (err, rows) => {
        if (!err) {
          rows[0].forEach((res)=>{
            orders.push(res);            
          });
        } else {
          res.send({ error: err });
        }
        orders.forEach((orders,i,ele) => {
          sql.query(
            `CALL get_addressById(${orders.billingAddress})`,
            (err1, rows1, fields) => {
              if (!err1) { 
                sql.query(
                  `CALL get_orderItemByorder(${orders.id})`,
                  (err2, rows2, fields) => {
                    if (!err2) { 
                      sql.query(
                        `CALL get_addressById(${orders.shippingAddress})`,
                        (err3, rows3, fields) => {
                          if(!err3){
                            len++;
                            orders.orderItem = rows2[0];  
                            orders.billingAddress = rows1[0];                           
                            orders.shippingAddress = rows3[0];
                            orderItem.push(orders); 
                            if(len===ele.length){
                              orderItem.forEach((ot, i)=>{
                                let forOT = ot.orderItem;
                                for(let i=0;i<forOT.length;i++){
                                  forOT[i]['renewals_timline'] = JSON.parse(forOT[i].renewals_timline);
                                  
                                }
                              });
                              if(len===ele.length){
                              
                                res.send(orderItem);
                              }
                            }
                          }
                           
                        });
                      
                      
                    }
                  }
                );
                // orders.address = rows1[0];  
                // orderAddress.push(orders); 
                // if(len===ele.length){
                //   // res.send(orderAddress);
                // }
              }
            }
          ); 
  
          
          
        });
      }
    );
});



/* GET all orders */
// router.get('/', function(req, res) {
//   sql.query(
//       `SELECT * FROM orders`,
//       (err, rows) => {
//         if (!err) {
//           rows.forEach((row, i) => {
//             row['orderedProducts'] = JSON.parse(row.orderedProducts);
//             row['checkoutItemData'] = JSON.parse(row.checkoutItemData);
//           });
//           res.send(rows);
//         } else {
//           res.send({ error: 'Error' });
//         }
//       }
//     );
// });
router.get('/orderDetails2/:id',verifyToken, function(req, res) {
  
  let orders=[];
  let orderAddress=[];
  let orderItem = [];
  let len=0;
  let len2=0;
  let delivered=[];
  let shipped=[];
  let others=[];
  sql.query(
      `CALL getOrderByOrderId('${req.params.id}') `,
      (err, rows) => {
        if (!err) {
          rows[0].forEach((res)=>{
            orders.push(res);
            
          });
        } else {
          res.send({ error: err});
        }
        orders.forEach((orders,i,ele) => {
          sql.query(
            `CALL get_addressById(${orders.billingAddress})`,
            (err1, rows1, fields) => {
              if (!err1) { 
                sql.query(
                  `CALL get_orderItemByorder(${orders.id})`,
                  (err2, rows2, fields) => {
                    if (!err2) { 
                      sql.query(
                        `CALL get_addressById(${orders.shippingAddress})`,
                        (err3, rows3) => {
                          if(!err3){
                            len++;
                            orders.orderItem = rows2[0];  
                            orders.billingAddress = rows1[0]; 
                            orders.shippingAddress = rows3[0];
                            orderItem.push(orders); 
                            if(len===ele.length){
                              orderItem.forEach((ot, i)=>{
                                let forOT = ot.orderItem;
                                for(let i=0;i<forOT.length;i++){
                                  forOT[i]['renewals_timline'] = JSON.parse(forOT[i].renewals_timline);
                                  sql.query(
                                    `CALL getCustomerRequestsByOTID(${forOT[i].order_item_id})`,
                                    (err4, rows4, fields) => {
                                      if(!err4){
                                        forOT[i]['customerRequests'] = rows4[0];
                                      }
                                    })

                                  if(forOT[i].delivery_status.includes(4) ){
                                    delivered.push(1);              
                                  } else {
                                    delivered.push(0);
                                  }
                                  if(forOT[i].delivery_status.includes(3) ){
                                    shipped.push(1);              
                                  } else {
                                    shipped.push(0);
                                  }
                                  if(forOT[i].delivery_status.includes(1) || forOT[i].delivery_status.includes(2) ){
                                    others.push(1);              
                                  } else {
                                    others.push(0);
                                  }
                                }

                                // if(shipped.includes(1) && (others.includes(1) && !delivered.includes(1))){
                                //   ot['deliveryStatus'] = 5;
                                // } else if(shipped.includes(1) && !others.includes(1) && !delivered.includes(1)){
                                //   ot['deliveryStatus'] = 3;
                                // } else if(!shipped.includes(1) && delivered.includes(1) && !others.includes(1) ){
                                //   ot['deliveryStatus'] = 4;
                                // } else if(!shipped.includes(1) && delivered.includes(1) && others.includes(1) ){
                                //   ot['deliveryStatus'] = 5;
                                // } else if(shipped.includes(1) && delivered.includes(1) && others.includes(1) ){
                                //   ot['deliveryStatus'] = 5;
                                // }  else if(shipped.includes(1) && delivered.includes(1) && others.includes(0) ){
                                //   ot['deliveryStatus'] = 5;
                                // } else if(shipped.includes(0) && delivered.includes(1) && others.includes(0)){
                                //   ot['deliveryStatus'] = 4;
                                // }
                                // var sqlUpdate = 'UPDATE orders SET deliveryStatus= ? WHERE id= ?';
                                // sql.query(
                                //   sqlUpdate,
                                //   [
                                //     ot['deliveryStatus'],
                                //     ot['id']
                                //   ]
                                // );
                              });
                              if(len===ele.length){
                              
                                res.send(orderItem);
                              }
                            }
                          }
                        });
                      
                    }
                  }
                );
                // orders.address = rows1[0];  
                // orderAddress.push(orders); 
                // if(len===ele.length){
                //   // res.send(orderAddress);
                // }
              }
            }
          ); 

          
          
        });

        


      }
    );
});

router.get('/orderDetails/:id', verifyToken,function(req, res) {
  
  let orders=[];
  let orderAddress=[];
  let orderItem = [];
  let len=0;
  let len2=0;
  let delivered=[];
  let shipped=[];
  let others=[];
  sql.query(
      `CALL getOrderByOrderId('${req.params.id}') `,
      (err, rows) => {
        if (!err) {
          rows[0].forEach((res)=>{
            orders.push(res);
            
          });
        } else {
          res.send({ error: err});
        }
        orders.forEach((orders,i,ele) => {
          sql.query(
            `CALL get_addressById(${orders.billingAddress})`,
            (err1, rows1, fields) => {
              if (!err1) { 
                sql.query(
                  `CALL get_orderItemByorder(${orders.id})`,
                  (err2, rows2, fields) => {
                    if (!err2) { 
                      sql.query(
                        `CALL get_addressById(${orders.shippingAddress})`,
                        (err3, rows3) => {
                          if(!err3){
                            len++;
                            orders.orderItem = rows2[0];  
                            orders.billingAddress = rows1[0]; 
                            orders.shippingAddress = rows3[0];
                            orderItem.push(orders); 
                            if(len===ele.length){
                              orderItem.forEach((ot, i)=>{
                                let forOT = ot.orderItem;
                                for(let i=0;i<forOT.length;i++){
                                  forOT[i]['renewals_timline'] = JSON.parse(forOT[i].renewals_timline);
                                  sql.query(
                                    `CALL getCustomerRequestsByOTID(${forOT[i].order_item_id})`,
                                    (err4, rows4, fields) => {
                                      if(!err4){
                                        forOT[i]['customerRequests'] = rows4[0];
                                      }
                                    })

                                  // if(forOT[i].delivery_status.includes(4) ){
                                  //   delivered.push(1);              
                                  // } else {
                                  //   delivered.push(0);
                                  // }
                                  // if(forOT[i].delivery_status.includes(3) ){
                                  //   shipped.push(1);              
                                  // } else {
                                  //   shipped.push(0);
                                  // }
                                  // if(forOT[i].delivery_status.includes(1) || forOT[i].delivery_status.includes(2) ){
                                  //   others.push(1);              
                                  // } else {
                                  //   others.push(0);
                                  // }
                                }

                                // if(shipped.includes(1) && (others.includes(1) && !delivered.includes(1))){
                                //   ot['deliveryStatus'] = 5;
                                // } else if(shipped.includes(1) && !others.includes(1) && !delivered.includes(1)){
                                //   ot['deliveryStatus'] = 3;
                                // } else if(!shipped.includes(1) && delivered.includes(1) && !others.includes(1) ){
                                //   ot['deliveryStatus'] = 4;
                                // } else if(!shipped.includes(1) && delivered.includes(1) && others.includes(1) ){
                                //   ot['deliveryStatus'] = 5;
                                // } else if(shipped.includes(1) && delivered.includes(1) && others.includes(1) ){
                                //   ot['deliveryStatus'] = 5;
                                // }  else if(shipped.includes(1) && delivered.includes(1) && others.includes(0) ){
                                //   ot['deliveryStatus'] = 5;
                                // } else if(shipped.includes(0) && delivered.includes(1) && others.includes(0)){
                                //   ot['deliveryStatus'] = 4;
                                // }
                                // var sqlUpdate = 'UPDATE orders SET deliveryStatus= ? WHERE id= ?';
                                // sql.query(
                                //   sqlUpdate,
                                //   [
                                //     ot['deliveryStatus'],
                                //     ot['id']
                                //   ]
                                // );
                              });
                              if(len===ele.length){
                              
                                res.send(orderItem);
                              }
                            }
                          }
                        });
                      
                    }
                  }
                );
                // orders.address = rows1[0];  
                // orderAddress.push(orders); 
                // if(len===ele.length){
                //   // res.send(orderAddress);
                // }
              }
            }
          ); 

          
          
        });

        


      }
    );
});

router.get('/getOrderByMyOrderId/:id', verifyToken,function(req, res) {
  
  sql.query(
      `CALL get_OrderByMyOrderId(${JSON.stringify(req.params.id)}) `,
      (err, rows) => {
        if (!err) {          
          res.send(rows[0]);
        } else {
          res.send({ error: 'Error' });
        }

      }
    );
});

router.get('/getOrderByMyOrderIdAPI/:id', function(req, res) {
  
  sql.query(
      `CALL get_OrderByMyOrderId(${JSON.stringify(req.params.id)}) `,
      (err, rows) => {
        if (!err) {          
          res.send(rows[0]);
        } else {
          res.send({ error: 'Error' });
        }

      }
    );
});

router.get('/:id', verifyToken,function(req, res) {  
  let orders=[];
  let orderAddress=[];
  let orderItem = [];
  let len=0;
  let len2=0;
  let delivered=[];
  let shipped=[];
  let others=[];
  sql.query(
      `CALL get_ordersByCustomer(${req.params.id}) `,
      (err, rows) => {
        if (!err) {          
          if(rows[0].length>0){
            rows[0].forEach((res)=>{
                orders.push(res);            
            });
          } else{
            res.send(rows[0]);
          }
        } else {
          res.send({ error: 'Error' });
        }
        if(orders){
          orders.forEach((orders,i,ele) => {
            sql.query(
              `CALL get_addressById(${orders.billingAddress})`,
              (err1, rows1, fields) => {
                if (!err1) { 
                  sql.query(
                    `CALL get_orderItemByorder(${orders.id})`,
                    (err2, rows2, fields) => {
                      if (!err2) { 
                        sql.query(
                          `CALL get_addressById(${orders.shippingAddress})`,
                          (err3, rows3) => {
                            if(!err3){
                              len++;
                              // console.log(orders);
                              orders.orderItem = rows2[0];  
                              // let OrderItems= rows2[0][0];
                              // console.log(OrderItems.deliveryStatus_id);
                              // for(let ds=0; ds<orders.orderItem[0].length;ds++){
                              //   if(orders.orderItem[0][ds].deliveryStatus_id.includes(4) ){
                              //     delivered.push(1);              
                              //   } else {
                              //     delivered.push(0);
                              //   }
                              //   if(orders.orderItem[0][ds].deliveryStatus_id.includes(3) ){
                              //     shipped.push(1);              
                              //   } else {
                              //     shipped.push(0);
                              //   }
                              //   if(orders.orderItem[0][ds].deliveryStatus_id.includes(1) || orders.orderItem[0][ds].deliveryStatus_id.includes(2) ){
                              //     others.push(1);              
                              //   } else {
                              //     others.push(0);
                              //   }
                              // }
                              // console.log(shipped);
                              // console.log(delivered);
                              // console.log(others);
  
                              // if(shipped.includes('1') && (others.includes('1') && !delivered.includes('1'))){
                              //   orders['deliveryStatus'] = 2;
                              // } else if(shipped.includes('1') && !others.includes('1') && !delivered.includes('1')){
                              //   orders['deliveryStatus'] = 3;
                              // } else if(!shipped.includes('1') && delivered.includes('1') && !others.includes('1') ){
                              //   orders['deliveryStatus'] = 4;
                              // } else if(!shipped.includes('1') && delivered.includes('1') && others.includes('1') ){
                              //   orders['deliveryStatus'] = 5;
                              // } else if(shipped.includes('1') && delivered.includes('1') && others.includes('1') ){
                              //   orders['deliveryStatus'] = 5;
                              // }  else if(shipped.includes('1') && delivered.includes('1') && others.includes('0') ){
                              //   orders['deliveryStatus'] = 5;
                              // } else if(shipped.includes('0') && delivered.includes('1') && others.includes('0')){
                              //   orders['deliveryStatus'] = 4;
                              // }
                              // var sqlUpdate = 'UPDATE orders SET deliveryStatus= ? WHERE id= ?';
                              // sql.query(
                              //   sqlUpdate,
                              //   [
                              //     orders['deliveryStatus'],
                              //     orders['id']
                              //   ]
                              // );
  
                              orders.billingAddress = rows1[0]; 
                              orders.shippingAddress = rows3[0];
                              orderItem.push(orders); 
                              if(len===ele.length){
                                orderItem.forEach((ot, i)=>{
                                  let forOT = ot.orderItem;
                                  for(let i=0;i<forOT.length;i++){
                                    forOT[i]['renewals_timline'] = JSON.parse(forOT[i].renewals_timline);
                                    sql.query(
                                      `CALL getCustomerRequestsByOTID(${forOT[i].order_item_id})`,
                                      (err4, rows4, fields) => {
                                        if(!err4){
                                          forOT[i]['customerRequests'] = rows4[0];
                                        }
                                      })
  
                                  }
  
                                  // if(shipped.includes(1) && (others.includes(1) && !delivered.includes(1))){
                                  //   ot['deliveryStatus'] = 5;
                                  // } else if(shipped.includes(1) && !others.includes(1) && !delivered.includes(1)){
                                  //   ot['deliveryStatus'] = 3;
                                  // } else if(!shipped.includes(1) && delivered.includes(1) && !others.includes(1) ){
                                  //   ot['deliveryStatus'] = 4;
                                  // } else if(!shipped.includes(1) && delivered.includes(1) && others.includes(1) ){
                                  //   ot['deliveryStatus'] = 5;
                                  // } else if(shipped.includes(1) && delivered.includes(1) && others.includes(1) ){
                                  //   ot['deliveryStatus'] = 5;
                                  // }  else if(shipped.includes(1) && delivered.includes(1) && others.includes(0) ){
                                  //   ot['deliveryStatus'] = 5;
                                  // } else if(shipped.includes(0) && delivered.includes(1) && others.includes(0)){
                                  //   ot['deliveryStatus'] = 4;
                                  // }
                                  // var sqlUpdate = 'UPDATE orders SET deliveryStatus= ? WHERE id= ?';
                                  // sql.query(
                                  //   sqlUpdate,
                                  //   [
                                  //     ot['deliveryStatus'],
                                  //     ot['id']
                                  //   ]
                                  // );
                                });
                                if(len===ele.length){
                                
                                  res.send(orderItem);
                                }
                              }
                            }
                          });
                        
                      }
                    }
                  );
                  // orders.address = rows1[0];  
                  // orderAddress.push(orders); 
                  // if(len===ele.length){
                  //   // res.send(orderAddress);
                  // }
                }
              }
            ); 
  
            
            
          });
        }

        


      }
    );
});

/* GET orders By user id */
// router.get('/:id', function(req, res, next) {
//   var mainArr = [];
//   var ids = [];
//   var len = 0;
//   var currDate = new Date;
//   sql.query(
//     `SELECT * FROM orders where userId = ?`,
//     [req.params.id],
//     (err, rows) => {
//       if (!err) {
//         rows.forEach((row, i) => {
//           row['orderdate'] = JSON.parse(row.orderdate);
//           row['pinfo'] = JSON.parse(row.pinfo);
//           row['orderedProducts'] = JSON.parse(row.orderedProducts);
//           row['checkoutItemData'] = JSON.parse(row.checkoutItemData);
//           row['prodlists'] = [];
//           row['damageProtection'] = JSON.parse(row.damageProtection);
//           let dPI = JSON.parse(row.damageProtection);
//           // console.log(row['txnid'])
//           let cid=row.checkoutItemData;
//           let od = row.orderedProducts;
//           let delivered=[];
//           let shipped=[];
//           let others=[];
//           cid.forEach((pi,i)=>{
//             pi['indexs']=Math.floor((Math.random() * 9999) + 1);
//             // pi['billPeriod'] = pi['startDate']+'-'+pi['expiryDate'];
//             if(pi.deliveryStatus.includes('Delivered') && pi.ordered===1 ){
//               delivered.push(1);              
//             } else {
//               delivered.push(0);
//             }
//             if(pi.deliveryStatus.includes('Shipped') && pi.ordered===1 ){
//               shipped.push(1);              
//             } else {
//               shipped.push(0);
//             }
//             if((pi.deliveryStatus.includes('Delivery awaited') || pi.deliveryStatus.includes('Waiting for KYC')) && pi.ordered===1 ){
//               others.push(1);              
//             } else {
//               others.push(0);
//             }
            
//           });
//           if(shipped.includes(1) && (others.includes(1) && !delivered.includes(1))){
//             row['delivery_status'] = 'Partially shipped';
//           } else if(shipped.includes(1) && !others.includes(1) && !delivered.includes(1)){
//             row['delivery_status'] = 'Shipped';
//           } else if(!shipped.includes(1) && delivered.includes(1) && !others.includes(1) ){
//             row['delivery_status'] = 'Delivered';
//           } else if(!shipped.includes(1) && delivered.includes(1) && others.includes(1) ){
//             row['delivery_status'] = 'Partially Delivered';
//           } else if(shipped.includes(1) && delivered.includes(1) && others.includes(1) ){
//             row['delivery_status'] = 'Partially Delivered';
//           }  else if(shipped.includes(1) && delivered.includes(1) && others.includes(0) ){
//             row['delivery_status'] = 'Partially Delivered';
//           } else if(shipped.includes(0) && delivered.includes(1) && others.includes(0)){
//             row['delivery_status'] = 'Delivered';
//           }
//           var sqlUpdate = 'UPDATE orders SET delivery_status= ? WHERE txnid= ?';
//           sql.query(
//             sqlUpdate,
//             [
//               row['delivery_status'],
//               row['txnid']
//             ]
//           );
          
//           for(let i=0;i<cid.length;i++){
//             // cid[i].indexs=Math.floor((Math.random() * 9999) + 1);
            
//             let ucid={ 
//               indexs:Math.floor((Math.random() * 9999) + 1),
//               id: cid[i].id,
//               prod_name:cid[i].prod_name,
//               prod_price:cid[i].prod_price,
//               prod_img:cid[i].prod_img,
//               delvdate: cid[i].delvdate,
//               actualStartDate:cid[i].actualStartDate,
//               qty: cid[i].qty, 
//               price: cid[i].price, 
//               tenure: cid[i].tenure,
//               primaryOrderNo:cid[i].primaryOrderNo, 
//               currentOrderNo: cid[i].currentOrderNo,
//               renewed:cid[i].renewed,
//               startDate:cid[i].startDate,
//               expiryDate:cid[i].startDate,
//               nextStartDate:cid[i].expiryDate,
//               overdew:cid[i].overdew,
//               assetId:cid[i].assetId,
//               deliveryStatus:cid[i].deliveryStatus,
//               deliveryDateAssigned:cid[i].deliveryDateAssigned,
//               deliveryAssigned:cid[i].deliveryAssigned,
//               dp:cid[i].dp,
//               replacement:cid[i].replacement,
//               returnDate:cid[i].returnDate,
//               billPeriod:cid[i].billPeriod,
//               billAmount:cid[i].billAmount,
//               damageCharges:cid[i].damageCharges
//             }
//             let ucidQty={ 
//               indexs:Math.floor((Math.random() * 9999) + 1),
//               id: cid[i].id,
//               prod_name:cid[i].prod_name,
//               prod_price:cid[i].prod_price,
//               prod_img:cid[i].prod_img,
//               delvdate: cid[i].delvdate,
//               actualStartDate:cid[i].actualStartDate,
//               qty: 1, 
//               price: cid[i].price, 
//               tenure: cid[i].tenure,
//               primaryOrderNo:cid[i].primaryOrderNo, 
//               currentOrderNo: cid[i].currentOrderNo,
//               renewed:cid[i].renewed,
//               startDate:cid[i].startDate,
//               expiryDate:cid[i].expiryDate,
//               nextStartDate:cid[i].nextStartDate,
//               overdew:cid[i].overdew,
//               ordered:1,
//               assetId:cid[i].assetId,
//               deliveryStatus:cid[i].deliveryStatus,
//               deliveryDateAssigned:cid[i].deliveryDateAssigned,
//               deliveryAssigned:cid[i].deliveryAssigned,
//               dp:cid[i].dp,
//               replacement:cid[i].replacement,
//               returnDate:cid[i].returnDate,
//               billPeriod:cid[i].billPeriod,
//               billAmount:cid[i].billAmount,
//               damageCharges:cid[i].damageCharges
//             }
            
//             let ed = cid[i].nextStartDate;
//             let dateParts = ed.split("/");

//             // month is 0-based, that's why we need dataParts[1] - 1
//             let dateObject = new Date(+dateParts[2], dateParts[1]-1, +dateParts[0]);	
//             let dd= dateObject.getDate();
//             let mm=dateObject.getMonth();
//             let yy=dateObject.getFullYear();

//             let db = mm+1+'/'+dd+'/'+yy;
//             let expiryDate= new Date(db);
//             let Days=new Date(yy, mm+2, 0).getDate();

//             if(Days<dd){
//               newED = new Date(yy, mm+1, Days);              
//               ned  = new Date(yy, mm+1, Days);
//             }else{					
//               newED = new Date(yy, mm+1, dd-1);
//               ned = new Date(yy, mm+1, dd-1);              
//             }
//             ned.setDate(ned.getDate() + 1);
            
//             // rows.forEach((row, i) => { 
//         //   // row['orderdate'] = JSON.parse(row.orderdate);
//         //   // row['pinfo'] = JSON.parse(row.pinfo);
//         //   row['orderedProducts'] = JSON.parse(row.orderedProducts);
//         //   row['checkoutItemData'] = JSON.parse(row.checkoutItemData);
//         //   // console.log(row['txnid'])
//         //   // let cid=row.checkoutItemData;
//         //   // cid.forEach((pi,i)=>{
//         //   //   pi['indexs']=Math.floor((Math.random() * 9999) + 1);
//         //   // });
//         // });

//             let sd = cid[i].startDate;
//             let sdateParts = sd.split("/");

//             // month is 0-based, that's why we need dataParts[1] - 1
//             let sDateObject = new Date(+sdateParts[2], sdateParts[1]-1, +sdateParts[0]);	
//             let sdd= sDateObject.getDate();
//             let smm=sDateObject.getMonth();
//             let syy=sDateObject.getFullYear();

//             let sdb = smm+1+'/'+sdd+'/'+syy;
//             let startDate= new Date(sdb);

//             let daysInDiff=dateDiffInDays(startDate, currDate);
//             let qtyLength=cid[i].qty;
//             if(qtyLength>1 && cid[i].ordered==1){  
//               for(let a=0;a<(qtyLength-1);a++){
//                 cid[i].qty=1;
//                 ucidQty.indexs=Math.floor((Math.random() * 9999) + a);
//                 row['checkoutItemData'].push(JSON.parse(JSON.stringify(ucidQty)));
//               }
//               // row['checkoutItemData'].forEach((pi,i)=>{
//               //   pi['indexs']=Math.floor((Math.random() * 9999) + 1);
//               // });
//               var sqlUpdate = 'UPDATE orders SET checkoutItemData= ? WHERE txnid= ?';
//               sql.query(
//                 sqlUpdate,
//                 [
//                   JSON.stringify(row['checkoutItemData']),
//                   row['txnid']
//                 ]
//               );
//               break;
//             }
//             // od.forEach((odRes)=>{
//             //   odRes.assetId=[];
//             // });
//             // var sqlUpdate = 'UPDATE orders SET orderedProducts= ? WHERE txnid= ?';
//             //   sql.query(
//             //     sqlUpdate,
//             //     [
//             //       JSON.stringify(od),
//             //       row['txnid']
//             //     ]
//             //   );
//             od.forEach((odRes)=>{
//               if(cid[i].assetId.length>0){
//                 if(cid[i].ordered===1 && odRes.id===cid[i].id && row['order_type']=='Primary order'){
//                   odRes.assetId.push(cid[i].assetId);
//                   odRes.assetId = odRes.assetId.filter( function( item, index, inputArray ) {
//                       return inputArray.indexOf(item) == index;
//                   });
//                 }
                
//               }
//             });
//             var sqlUpdate = 'UPDATE orders SET orderedProducts= ? WHERE txnid= ?';
//               sql.query(
//                 sqlUpdate,
//                 [
//                   JSON.stringify(od),
//                   row['txnid']
//                 ]
//               );
//             // // console.log(daysInDiff);            
            
//             if(daysInDiff>=0 && (cid[i].renewed!=4 && cid[i].overdew!=1)){
//               if(cid[i].ordered==1){
//                 cid[i].renewed=1
//               }
//               cid[i].overdew=1;
//               row['overdue']=1;
//               ucid.renewed=0;
//               ucid.startDate=cid[i].nextStartDate;
//               ucid.expiryDate=ISTDate(newED);
//               ucid.nextStartDate=ISTDate(ned);
//               ucid.billPeriod = ucid.startDate+'-'+ucid.expiryDate
//               ucid.overdew=0;
//               ucid.ordered=0;
//               row['checkoutItemData'].push(ucid);
//               var sqlUpdate = 'UPDATE orders SET checkoutItemData= ? WHERE txnid= ?';
//               sql.query(
//                 sqlUpdate,
//                 [
//                   JSON.stringify(row['checkoutItemData']),
//                   row['txnid']
//                 ]
//               );
//             }

//             if((cid[i].renewed==1 || cid[i].renewed==4) && cid[i].ordered!=1){
              
//               var sqlUpdate = 'UPDATE assets SET startDate=?, expiryDate=?, nextStartDate=? WHERE assetId= ?';
//               sql.query(
//                 sqlUpdate,
//                 [
//                   cid[i].startDate,
//                   cid[i].expiryDate,
//                   cid[i].nextStartDate,
//                   ucid.assetId
//                 ]
//               );
//             }
            
//           }
//           var idsDta = row.pinfo.join('","');
//           let prodDta = `SELECT prod_img, prod_price, prod_name FROM prod_details Where prod_id IN ("${idsDta}")`;
//           ids.push(prodDta);

//           mainArr.push(row);
//         });
        
//       } else {
//         console.log(err);
//         res.send({ error: err });
//       }

//       ids.forEach((dta) => {
        
//         sql.query(dta, (err, rows1) => {
//             if(!err){
//               len++;
//               rows1.forEach((row1, i) => {
//                 row1['prod_img'] = row1.prod_img.split("[--split--]");
//                 row1['prod_img'] = row1.prod_img;
//               });
//               mainArr[len-1]['prodlists'].push(rows1);

//               if(len === ids.length) {
//                 mainArr.forEach((res) => {
//                   res.prodlists = res.prodlists[0];
//                   res['checkoutItemData'].forEach((dta, j) => {
//                     if(res.prodlists[j]){
//                       res.prodlists[j]['id'] = dta["id"] ? dta["id"] : '';
//                       res.prodlists[j]['delvdate'] = dta["delvdate"] ? dta["delvdate"] : '';
//                       res.prodlists[j]['qty'] = dta["qty"] ? dta["qty"] : '';
//                       res.prodlists[j]['price'] = dta["price"] ? dta["price"] : '';
//                       res.prodlists[j]['tenure'] = dta["tenure"] ? dta["tenure"] : '';
//                       res.prodlists[j]['renewed'] = dta["renewed"] ? dta["renewed"] : '0';
//                       res.prodlists[j]['primaryOrderNo'] = dta["primaryOrderNo"] ? dta["primaryOrderNo"] : '';
//                       res.prodlists[j]['expiryDate'] = dta["expiryDate"] ? dta["expiryDate"] : '';
//                     }
                    
//                   });
//                 });
//                 res.send(mainArr);
//               }
//             }
//           });
//       });
      
      
//     }
//   );

  
// });

// Update orders
router.put("/update/:id", verifyToken,(req, res) => {
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

//Update delivery Date
router.put("/updateDelivery/:id", verifyToken,(req, res) => {
  var id = req.params.id;
  var sqlUpdate = 'UPDATE orders SET orderedProducts= ?, checkoutItemData= ? WHERE txnid= ?';
  sql.query(
    sqlUpdate,
    [
      req.body.ordProducts,
      req.body.checkoutProducts,
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

//Update delivery Date
router.put("/updateOD/:id", verifyToken,(req, res) => {
  var id = req.params.id;
  var sqlUpdate = 'UPDATE orders SET orderedProducts= ? WHERE txnid= ?';
  sql.query(
    sqlUpdate,
    [
      req.body.ordProducts,
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

//Update delivery Date
router.put("/updateCID/:id", verifyToken,(req, res) => {
  var id = req.params.id;
  var sqlUpdate = 'UPDATE orders SET checkoutItemData= ? WHERE txnid= ?';
  sql.query(
    sqlUpdate,
    [
      req.body.checkoutProducts,
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


router.get('/txn/:id', verifyToken,function(req, res, next) {
  sql.query(
    `SELECT * FROM orders where txnid = ?`,
    [req.params.id],
    (err, rows) => {
      if (!err) {
        rows.forEach((row, i) => {
          row['orderedProducts'] = JSON.parse(row.orderedProducts);
          row['checkoutItemData'] = JSON.parse(row.checkoutItemData);
        });

        // rows.forEach((row, i) => {
        //   // row['orderdate'] = JSON.parse(row.orderdate);
        //   // row['pinfo'] = JSON.parse(row.pinfo);
        //   row['orderedProducts'] = JSON.parse(row.orderedProducts);
        //   row['checkoutItemData'] = JSON.parse(row.checkoutItemData);
        //   // console.log(row['txnid'])
        //   // let cid=row.checkoutItemData;
        //   // cid.forEach((pi,i)=>{
        //   //   pi['indexs']=Math.floor((Math.random() * 9999) + 1);
        //   // });
        // });
        res.send(rows);
      } else {
        res.send({ error: err });
      }
    }
  );
});

module.exports = router;
