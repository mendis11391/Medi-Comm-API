var express = require('express');
var router = express.Router();

var sql = require("../db.js");

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

/* GET orders By user id */
router.get('/:id', function(req, res, next) {
    var mainArr = [];
    var ids = [];
    var len = 0;
    var currDate = new Date;
    sql.query(
      `SELECT * FROM orders 
      INNER JOIN users ON orders.txnid=Customers.userId`,
      [req.params.id],
      (err, rows) => {
        if (!err) {
          rows.forEach((row, i) => {
            row['orderdate'] = JSON.parse(row.orderdate);
            row['pinfo'] = JSON.parse(row.pinfo);
            row['orderedProducts'] = JSON.parse(row.orderedProducts);
            row['checkoutItemData'] = JSON.parse(row.checkoutItemData);
            row['prodlists'] = [];
            row['damageProtection'] = JSON.parse(row.damageProtection);
            let dPI = JSON.parse(row.damageProtection);
            // console.log(row['txnid'])
            let cid=row.checkoutItemData;
            let od = row.orderedProducts;
            let delivered=[];
            let shipped=[];
            let others=[];
            cid.forEach((pi,i)=>{
              pi['indexs']=Math.floor((Math.random() * 9999) + 1);
              // pi['billPeriod'] = pi['startDate']+'-'+pi['expiryDate'];
              if(pi.deliveryStatus.includes('Delivered') && pi.ordered===1 ){
                delivered.push(1);              
              } else {
                delivered.push(0);
              }
              if(pi.deliveryStatus.includes('Shipped') && pi.ordered===1 ){
                shipped.push(1);              
              } else {
                shipped.push(0);
              }
              if((pi.deliveryStatus.includes('Delivery awaited') || pi.deliveryStatus.includes('Waiting for KYC')) && pi.ordered===1 ){
                others.push(1);              
              } else {
                others.push(0);
              }
              
            });
            var sqlUpdate = 'UPDATE orders SET delivery_status= ? WHERE txnid= ?';
            sql.query(
              sqlUpdate,
              [
                row['delivery_status'],
                row['txnid']
              ]
            );
            
            for(let i=0;i<cid.length;i++){
              // cid[i].indexs=Math.floor((Math.random() * 9999) + 1);
              
              let ucid={ 
                indexs:Math.floor((Math.random() * 9999) + 1),
                id: cid[i].id,
                prod_name:cid[i].prod_name,
                prod_price:cid[i].prod_price,
                prod_img:cid[i].prod_img,
                delvdate: cid[i].delvdate,
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
                damageCharges:cid[i].damageCharges
              }
              let ucidQty={ 
                indexs:Math.floor((Math.random() * 9999) + 1),
                id: cid[i].id,
                prod_name:cid[i].prod_name,
                prod_price:cid[i].prod_price,
                prod_img:cid[i].prod_img,
                delvdate: cid[i].delvdate,
                qty: 1, 
                price: cid[i].price, 
                tenure: cid[i].tenure,
                primaryOrderNo:cid[i].primaryOrderNo, 
                currentOrderNo: cid[i].currentOrderNo,
                renewed:cid[i].renewed,
                startDate:cid[i].startDate,
                expiryDate:cid[i].expiryDate,
                nextStartDate:cid[i].nextStartDate,
                overdew:cid[i].overdew,
                ordered:1,
                assetId:cid[i].assetId,
                deliveryStatus:cid[i].deliveryStatus,
                deliveryDateAssigned:cid[i].deliveryDateAssigned,
                deliveryAssigned:cid[i].deliveryAssigned,
                dp:cid[i].dp,
                replacement:cid[i].replacement,
                returnDate:cid[i].returnDate,
                billPeriod:cid[i].billPeriod,
                billAmount:cid[i].billAmount,
                damageCharges:cid[i].damageCharges
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
              let qtyLength=cid[i].qty;
              if(qtyLength>1 && cid[i].ordered==1){  
                for(let a=0;a<(qtyLength-1);a++){
                  cid[i].qty=1;
                  ucidQty.indexs=Math.floor((Math.random() * 9999) + a);
                  row['checkoutItemData'].push(JSON.parse(JSON.stringify(ucidQty)));
                }
                // row['checkoutItemData'].forEach((pi,i)=>{
                //   pi['indexs']=Math.floor((Math.random() * 9999) + 1);
                // });
                var sqlUpdate = 'UPDATE orders SET checkoutItemData= ? WHERE txnid= ?';
                sql.query(
                  sqlUpdate,
                  [
                    JSON.stringify(row['checkoutItemData']),
                    row['txnid']
                  ]
                );
                break;
              }
              od.forEach((odRes)=>{
                if(cid[i].assetId.length>0){
                  if(cid[i].ordered===1 && odRes.id===cid[i].id && row['order_type']=='Primary order'){
                    odRes.assetId.push(cid[i].assetId);
                    odRes.assetId = odRes.assetId.filter( function( item, index, inputArray ) {
                        return inputArray.indexOf(item) == index;
                    });
                  }
                  
                }
              });
              var sqlUpdate = 'UPDATE orders SET orderedProducts= ? WHERE txnid= ?';
                sql.query(
                  sqlUpdate,
                  [
                    JSON.stringify(od),
                    row['txnid']
                  ]
                );        
              
              if(daysInDiff>=0 && (cid[i].renewed!=4 && cid[i].overdew!=1)){
                if(cid[i].ordered==1){
                  cid[i].renewed=1
                }
                cid[i].overdew=1;
                row['overdue']=1;
                ucid.renewed=0;
                ucid.startDate=cid[i].nextStartDate;
                ucid.expiryDate=ISTDate(newED);
                ucid.nextStartDate=ISTDate(ned);
                ucid.billPeriod = ucid.startDate+'-'+ucid.expiryDate
                ucid.overdew=0;
                ucid.ordered=0;
                row['checkoutItemData'].push(ucid);
                var sqlUpdate = 'UPDATE orders SET checkoutItemData= ? WHERE txnid= ?';
                sql.query(
                  sqlUpdate,
                  [
                    JSON.stringify(row['checkoutItemData']),
                    row['txnid']
                  ]
                );
              }
  
              if(cid[i].renewed==1 || cid[i].renewed==4){
                
                var sqlUpdate = 'UPDATE assets SET startDate=?, expiryDate=?, nextStartDate=? WHERE assetId= ?';
                sql.query(
                  sqlUpdate,
                  [
                    cid[i].startDate,
                    cid[i].expiryDate,
                    cid[i].nextStartDate,
                    ucid.assetId
                  ]
                );
              }
              
            }
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
                  row1['prod_img'] = row1.prod_img;
                });
                mainArr[len-1]['prodlists'].push(rows1);
  
                if(len === ids.length) {
                  mainArr.forEach((res) => {
                    res.prodlists = res.prodlists[0];
                    res['checkoutItemData'].forEach((dta, j) => {
                      if(res.prodlists[j]){
                        res.prodlists[j]['id'] = dta["id"] ? dta["id"] : '';
                        res.prodlists[j]['delvdate'] = dta["delvdate"] ? dta["delvdate"] : '';
                        res.prodlists[j]['qty'] = dta["qty"] ? dta["qty"] : '';
                        res.prodlists[j]['price'] = dta["price"] ? dta["price"] : '';
                        res.prodlists[j]['tenure'] = dta["tenure"] ? dta["tenure"] : '';
                        res.prodlists[j]['renewed'] = dta["renewed"] ? dta["renewed"] : '0';
                        res.prodlists[j]['primaryOrderNo'] = dta["primaryOrderNo"] ? dta["primaryOrderNo"] : '';
                        res.prodlists[j]['expiryDate'] = dta["expiryDate"] ? dta["expiryDate"] : '';
                      }
                      
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
  
  //Update delivery Date
  router.put("/updateDelivery/:id", (req, res) => {
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
  router.put("/updateOD/:id", (req, res) => {
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
  router.put("/updateCID/:id", (req, res) => {
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
  
  
  router.get('/txn/:id', function(req, res, next) {
    sql.query(
      `SELECT * FROM orders where txnid = ?`,
      [req.params.id],
      (err, rows) => {
        if (!err) {
          rows.forEach((row, i) => {
            row['orderedProducts'] = JSON.parse(row.orderedProducts);
            row['checkoutItemData'] = JSON.parse(row.checkoutItemData);
          });
  
          res.send(rows);
        } else {
          res.send({ error: err });
        }
      }
    );
  });

module.exports = router;