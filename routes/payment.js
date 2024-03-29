var express = require('express');
var crypto = require("crypto");
var router = express.Router();
const url = require('url');  

// var request = require('request');
var requestify = require('requestify'); 
const config = require('../config.json');
const helpers = require('../helpers/signatureCreation');
const enums = require('../helpers/enums');

var sql = require("../db.js");
const constants = require("../constant/constUrl");
const constUrl = require('../constant/constUrl');

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

var Razorpay = require('razorpay');

var instance = new Razorpay({
	key_id: config.razorKeyId,
	key_secret: config.razorPaySecret,
});

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
    //   this.us.updateNewRenewProducts(productsToUpdate).subscribe(()=>{
    //     localStorage.removeItem('prodAll');
    //     localStorage.removeItem('productsArr');
    //   });
    }
}

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

function dateDiffInDays(a, b) {
	const _MS_PER_DAY = 1000 * 60 * 60 * 24;
	const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
	const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  
	return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

function getDates(date){
	let dateParts = date.split("/");
  
	// month is 0-based, that's why we need dataParts[1] - 1
	let dateObject = new Date(+dateParts[2], dateParts[1]-1, +dateParts[0]);  
	dateObject.setHours(0,0,0,0);
	return dateObject;
}

// Verify token 
function verifyToken(req, res, next) {
	if(req.headers.origin===`${constants.frontendUrl}`){
	  next();
	} else{
	  return res.status(401).send("Unauthorized request");
	}
  }

router.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
  });


router.get('/',verifyToken, function(req, res) {
    var ord = JSON.stringify(Math.random()*1000);
	var i = ord.indexOf('.');
    ord = 'ORD'+ ord.substr(0,i);	
    res.render('checkout.html', {orderid:ord});
});

router.get('/getAllPaymentMethods',verifyToken, function(req, res) {
	sql.query(
		`CALL get_allPaymentMethods()`,
		(err, rows) => {
		  if (!err) {          
			res.send(rows[0]);
		  } else {
			res.send({ error: 'Error' });
		  }
		}
	);
});

/************New code************ */
router.post('/saveNewOrder',verifyToken, async function(req, res) {
	logger.info({
		message: '/saveNewOrder post orders api started',
		dateTime: new Date()
	});
	datetime = new Date();
	orderDate = (this.datetime.getMonth()+1)+'/'+this.datetime.getDate()+'/'+this.datetime.getFullYear();
	orderTime = this.datetime.getHours()+':'+this.datetime.getMinutes()+':'+this.datetime.getSeconds();

	orderDateTime=[this.orderDate, this.orderTime];
	orderdatetime=JSON.stringify(orderDateTime);

	var kycData= await requestify.get(`${constants.apiUrl}users/getAllKYC/kycBycustomerId/${req.body.uid}`);
	var kycParse = JSON.parse(kycData.body);
	var kyc = kycParse.filter(item=>item.status==1);
	var deliveryStatus=1;
	if(kyc.length>0){
		if(kyc[0].kyc_status=='eKYC submitted'){
			deliveryStatus=7;
		} else if(kyc[0].kyc_status=='Query raised'){
			deliveryStatus=8;
		} else if(kyc[0].kyc_status=='eKYC approved'){
			deliveryStatus=2;
		}
	}
	checkoutPInfo=JSON.parse(req.body.products);
	let dPI = req.body.damageProtection;
	checkoutPInfo.forEach((resp) => { //this loop is for expDate and nextStartDate calculation
		if(dPI>0){
			resp.dp=resp.price*(8/100);
		  } else{
			resp.dp=0;
		}
		
		let dateString = resp.delvdate;

		let dateParts = dateString.split("/");

		// month is 0-based, that's why we need dataParts[1] - 1
		let dateObject = new Date(+dateParts[2], dateParts[1]-1, +dateParts[0]);	
		let dd= dateObject.getDate();
		let mm=dateObject.getMonth();
		let yy=dateObject.getFullYear();

		// let db = mm+'/'+dd+'/'+yy;

		// let deliveredDate = new Date(db);
		// let sd=deliveredDate.getDate();
		// let nd = sd-0;
		// let ed = new Date(`${deliveredDate.getFullYear()}-${deliveredDate.getMonth()+3}-${nd}`);
			let Days=new Date(yy, mm+2, 0).getDate();

            if(Days<dd){
				newED = new Date(yy, mm+1, Days);              
				ned  = new Date(yy, mm+1, Days);
			  }else{					
				newED = new Date(yy, mm+1, dd-1);
				ned = new Date(yy, mm+1, dd-1);				
			  }
			ned.setDate(ned.getDate() + 1);
			let expDate = newED.getDate()+'/'+(newED.getMonth()+1)+'/'+newED.getFullYear();
			let nextStartDate = ned.getDate()+'/'+(ned.getMonth()+1)+'/'+ned.getFullYear();
		// resp.expiryDate=ned.toLocaleDateString();
		resp.startDate=resp.delvdate;
		resp.expiryDate=expDate;
		resp.nextStartDate=nextStartDate;
		resp.deliveryAssigned=0;
		resp.billPeriod = 'To be assigned';
	});

	var sqlInsert = "INSERT INTO `orders`( `primary_id`, `order_id`, `customer_id`, `subTotal`, `deliveryCharges`,`damageProtection`, `total`, `totalSecurityDeposit`, `discount`,`taxAmount`, `grandTotal`,`balanceAmount`, `promo`, `firstName`, `lastName`, `mobile`, `email`, `billingAddress`, `shippingAddress`, `orderType_id`, `orderStatus`,`paymentStatus`, `deliveryStatus`, `refundStatus`, `createdBy`, `modifiedBy`, `createdAt`, `modifiedAt`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
    [
      req.body.orderID,
	  req.body.orderID,
	  req.body.uid,
	  req.body.subTotal,
	  req.body.totalDeliveryCharges,
      req.body.damageProtection,
	  req.body.total,
	  req.body.securityDeposit,
	  req.body.discount,
	  (req.body.subTotal*0.18),	  
	  req.body.grandTotal,
	  req.body.balanceAmount,
	  '',
	  req.body.firstName,
	  req.body.lastName,
	  req.body.mobile,
	  req.body.email,
	  req.body.billingAddress,
	  req.body.shippingAddress,
	  req.body.orderType,
	  '1',
	  req.body.orderStatus,
	  deliveryStatus,
	  req.body.refundStatus,
	  req.body.createdBy,
	  req.body.modifiedBy,
	  new Date(),
	  new Date()
    ],
    (err, results) => {
      if (!err) {
		logger.info({
			message: '/saveNewOrder posted to orders query sucessfully',
			dateTime: new Date()
		  });
		var products = checkoutPInfo;



		products.forEach((resProduct)=>{
		  let renewalProduct = [];
		  resProduct.prod_img='';
		  renewalProduct.push(resProduct);
		  let startDate = getDates(resProduct.startDate);
		  let expiryDate = getDates(resProduct.expiryDate);
		  var sqlInsert = "INSERT INTO `order_item`(`primary_order_item_id`,`order_id`, `product_id`, `asset_id`, `discount`, `security_deposit`, `tenure_base_price`, `tenure_id`, `tenure_period`, `tenure_price`,`damage_protection`,`damage_charges`,`earlyReturnCharges`, `renewals_timline`,`overdue`,`delivery_status`, `startDate`, `endDate`, `fully_paid_tenure`,`status`, `createdAt`, `updatedAt`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
		  sql.query(sqlInsert,
			  [
			  0,
			  results.insertId,
			  resProduct.id,
			  'To be assigned',
			  0,
			  resProduct.prod_price,
			  resProduct.tenureBasePrice,
			  resProduct.tenure_id,
			  resProduct.tenure,
			  resProduct.price,	  
			  resProduct.dp,
			  0,
			  0,
			  JSON.stringify(renewalProduct),
			  0,
			  2,
			  startDate,
			  expiryDate,
			  req.body.fullyPaidTenure,
			  1,
			  new Date(),
			  new Date()
			  ]
		  );
		});

		var sqlUpdateOrderId = `UPDATE orders SET order_id=?, primary_id=? WHERE id = ${results.insertId}` ;
		var updatedOrderId=req.body.orderID+results.insertId;
		  sql.query(sqlUpdateOrderId,
			  [
				updatedOrderId,
				updatedOrderId
			  ]
		  );

        res.send({message: 'Inserted Successfully', txnid: updatedOrderId});
      } else {
		logger.info({
			message: 'failed to post /saveNewOrder'+err,
			dateTime: new Date()
		  });
        res.send({message: err});
      }
    }
  );

});

router.post('/newRenew', function(req, res) {
	logger.info({
		message: '/newRenew api post started',
		dateTime: new Date()
	});
	datetime = new Date();
	orderDate = (datetime.getMonth()+1)+'/'+datetime.getDate()+'/'+datetime.getFullYear();
	orderTime = datetime.getHours()+':'+datetime.getMinutes()+':'+datetime.getSeconds();

	orderDateTime=[orderDate, orderTime];
	orderdatetime=JSON.stringify(orderDateTime);

	checkoutPInfo=JSON.parse(req.body.products);
	let dPI = req.body.damageProtection;
	checkoutPInfo.forEach((resp) => { //this loop is for expDate and nextStartDate calculation
		if(resp.dp>0){
			resp.dp=resp.price*(8/100);
		  } else{
			resp.dp=0;
		}
		
		// let dateString = resp.delvdate;

		// let dateParts = dateString.split("/");

		// // month is 0-based, that's why we need dataParts[1] - 1
		// let dateObject = new Date(+dateParts[2], dateParts[1]-1, +dateParts[0]);	
		// let dd= dateObject.getDate();
		// let mm=dateObject.getMonth();
		// let yy=dateObject.getFullYear();

		// // let db = mm+'/'+dd+'/'+yy;

		// // let deliveredDate = new Date(db);
		// // let sd=deliveredDate.getDate();
		// // let nd = sd-0;
		// // let ed = new Date(`${deliveredDate.getFullYear()}-${deliveredDate.getMonth()+3}-${nd}`);
		// 	let Days=new Date(yy, mm+2, 0).getDate();

        //     if(Days<dd){
		// 		newED = new Date(yy, mm+1, Days);              
		// 		ned  = new Date(yy, mm+1, Days);
		// 	  }else{					
		// 		newED = new Date(yy, mm+1, dd-1);
		// 		ned = new Date(yy, mm+1, dd-1);				
		// 	  }
		// 	ned.setDate(ned.getDate() + 1);
		// 	let expDate = newED.getDate()+'/'+(newED.getMonth()+1)+'/'+newED.getFullYear();
		// 	let nextStartDate = ned.getDate()+'/'+(ned.getMonth()+1)+'/'+ned.getFullYear();
		// resp.expiryDate=ned.toLocaleDateString();
		// resp.startDate=resp.delvdate;
		// resp.expiryDate=expDate;
		// resp.nextStartDate=nextStartDate;
		// resp.deliveryAssigned=0;
	});

	var sqlInsert = "INSERT INTO `orders`( `primary_id`, `order_id`, `customer_id`, `subTotal`, `damageProtection`, `total`, `totalSecurityDeposit`, `discount`,`taxAmount`, `grandTotal`, `promo`, `firstName`, `lastName`, `mobile`, `email`, `billingAddress`, `shippingAddress`, `orderType_id`, `orderStatus`,`paymentStatus`, `deliveryStatus`, `refundStatus`, `createdBy`, `modifiedBy`, `createdAt`, `modifiedAt`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
    [
      req.body.primaryID,
	  req.body.orderID,
	  req.body.uid,
	  req.body.subTotal,
      req.body.damageProtection,
	  req.body.total,
	  req.body.securityDeposit,
	  req.body.discount,
	  (req.body.subTotal*0.18),	 	  
	  req.body.grandTotal,
	  '',
	  req.body.firstName,
	  req.body.lastName,
	  req.body.mobile,
	  req.body.email,
	  req.body.billingAddress,
	  req.body.shippingAddress,
	  req.body.orderType,
	  '1',
	  req.body.orderStatus,
	  req.body.deliveryStatus,
	  req.body.refundStatus,
	  req.body.createdBy,
	  req.body.modifiedBy,
	  new Date(),
	  new Date()
    ],
    (err, results) => {
      if (!err) {
		logger.info({
			message: '/newRenew posted to orders table successfully',
			dateTime: new Date()
		});
		var products = checkoutPInfo;

		products.forEach((resProduct)=>{
		  let renewalProduct = [];
		  renewalProduct.push(resProduct);
		//   let startDate = getDates(resProduct.startDate);
		//   let expiryDate = getDates(resProduct.expiryDate);
		  let startDate = resProduct.start_date;
		  let expiryDate = resProduct.end_date;
		  var sqlInsert = "INSERT INTO `order_item`(`primary_order_item_id`,`order_id`, `product_id`, `asset_id`, `discount`, `security_deposit`, `tenure_base_price`, `tenure_id`, tenure_period,`tenure_price`, `damage_protection`,`damage_charges`,`earlyReturnCharges`,`renewals_timline`,`overdue`,`delivery_status`, `startDate`, `endDate`, `status`, `createdAt`, `updatedAt`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
		  sql.query(sqlInsert,
			  [
			  resProduct.order_item_id,
			  results.insertId,
			  resProduct.product_id,
			  resProduct.asset_id,
			  0,
			  resProduct.security_deposit,
			  resProduct.tenure_base_price,
			  resProduct.tenure_id,
			  resProduct.tenure_period,
			  resProduct.tenure_price,	  
			  resProduct.damage_protection,
			  0,
			  0,
			  JSON.stringify(renewalProduct),
			  0,
			  4,
			  new Date(startDate),
			  new Date(expiryDate),
			  1,
			  new Date(),
			  new Date()
			  ]
		  );
		});

		var sqlUpdateOrderId = `UPDATE orders SET order_id=? WHERE id = ${results.insertId}` ;
		var updatedOrderId=req.body.orderID+results.insertId;
		sql.query(sqlUpdateOrderId,
			[
			updatedOrderId
			]
		);
        res.send({message: 'Inserted Successfully', txnid: updatedOrderId});
      } else {
		logger.info({
			message: '/newRenew failed to post in orders query',
			dateTime: new Date()
		});
        res.send({message: err});
      }
    }
  );

  


});

router.post('/newReturn', verifyToken,function(req, res) {
	logger.info({
		message: '/newReturn api post started',
		dateTime: new Date()
	});
	datetime = new Date();
	orderDate = (this.datetime.getMonth()+1)+'/'+this.datetime.getDate()+'/'+this.datetime.getFullYear();
	orderTime = this.datetime.getHours()+':'+this.datetime.getMinutes()+':'+this.datetime.getSeconds();

	orderDateTime=[this.orderDate, this.orderTime];
	orderdatetime=JSON.stringify(orderDateTime);

	checkoutPInfo=JSON.parse(req.body.products);

	var sqlInsert = "INSERT INTO `orders`( `primary_id`, `order_id`, `customer_id`, `subTotal`, `damageProtection`, `total`, `totalSecurityDeposit`, `discount`,`taxAmount`, `grandTotal`, `promo`, `firstName`, `lastName`, `mobile`, `email`, `billingAddress`, `shippingAddress`, `orderType_id`, `orderStatus`, `paymentStatus`, `deliveryStatus`, `refundStatus`, `createdBy`, `modifiedBy`, `createdAt`, `modifiedAt`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
    [
      req.body.primaryID,
	  req.body.orderID,
	  req.body.uid,
	  req.body.subTotal,
      req.body.damageProtection,
	  req.body.total,
	  req.body.securityDeposit,
	  req.body.discount,	  
	  (req.body.subTotal*0.18),	 
	  req.body.grandTotal,
	  '',
	  req.body.firstName,
	  req.body.lastName,
	  req.body.mobile,
	  req.body.email,
	  req.body.billingAddress,
	  req.body.shippingAddress,
	  req.body.orderType,
	  '1',
	  req.body.paymentStatus,
	  req.body.deliveryStatus,
	  req.body.refundStatus,
	  req.body.createdBy,
	  req.body.modifiedBy,
	  new Date(),
	  new Date()
    ],
    (err, results) => {
      if (!err) {
		var products = checkoutPInfo;
		var templateProds = '';
		
		products.forEach((resProduct)=>{
		  let renewalProduct = [];
		  renewalProduct.push(resProduct);
		  let startDate = getDates(resProduct.startDate);
		  let expiryDate = getDates(resProduct.expiryDate);
		  var sqlInsert = "INSERT INTO `order_item`(`primary_order_item_id`,`order_id`, `product_id`, `asset_id`, `discount`, `security_deposit`, `tenure_base_price`, `tenure_id`,`tenure_period`, `tenure_price`,`damage_protection`, `damage_charges`,`earlyReturnCharges`, `renewals_timline`,`overdue`,`delivery_status`, `startDate`, `endDate`, `status`, `createdAt`, `updatedAt`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
		  sql.query(sqlInsert,
			  [
			  resProduct.order_item_id,
			  results.insertId,
			  resProduct.id,
			  resProduct.assetId,
			  0,
			  resProduct.prod_price,
			  resProduct.tenureBasePrice,
			  resProduct.tenure_id,
			  resProduct.tenure,
			  resProduct.price,	 
			  resProduct.dp, 
			  resProduct.damageCharges,
			  resProduct.earlyReturnCharges,
			  JSON.stringify(renewalProduct),
			  0,
			  6,
			  startDate,
			  expiryDate,
			  0,
			  new Date(),
			  new Date()
			  ]
		  );
		});
		products.forEach((resProductItems)=>{			
			templateProds+='('+resProductItems.prod_name+')';	
		});

		let template = {
            "apiKey": constants.whatsappAPIKey,
            "campaignName": "Return Order Generated",
            "destination": req.body.mobile,
            "userName": "IRENTOUT",
            "source": "Return Order Generated",
            "media": {
               "url": "https://irentout.com/assets/images/slider/5.png",
               "filename": "IROHOME"
            },
            "templateParams": [req.body.firstName,req.body.orderID,templateProds],
            "attributes": {
              "InvoiceNo": "1234"
            }
           }
        
           
           requestify.post(`https://backend.aisensy.com/campaign/t1/api`, template);

		logger.info({
			message: '/newReturn posted in orders successfully',
			dateTime: new Date()
		});
        res.send({message: 'Inserted Successfully',order_id:req.body.orderID, txnid: req.body.txnid, orderDBId: results.insertId});
      } else {
		logger.info({
			message: '/newReturn failed to post in orders query',
			dateTime: new Date()
		});
        res.send({message: err});
      }
    }
  );
});

router.post('/newReplace',verifyToken, function(req, res) {
	logger.info({
		message: '/newReplace post api started',
		dateTime: new Date()
	});
	datetime = new Date();
	orderDate = (this.datetime.getMonth()+1)+'/'+this.datetime.getDate()+'/'+this.datetime.getFullYear();
	orderTime = this.datetime.getHours()+':'+this.datetime.getMinutes()+':'+this.datetime.getSeconds();

	orderDateTime=[this.orderDate, this.orderTime];
	orderdatetime=JSON.stringify(orderDateTime);

	checkoutPInfo=JSON.parse(req.body.products);

	var sqlInsert = "INSERT INTO `orders`( `primary_id`, `order_id`, `customer_id`, `subTotal`, `damageProtection`, `total`, `totalSecurityDeposit`, `discount`, `taxAmount`, `grandTotal`, `promo`, `firstName`, `lastName`, `mobile`, `email`, `billingAddress`, `shippingAddress`, `orderType_id`, `orderStatus`, `paymentStatus`, `deliveryStatus`, `refundStatus`, `createdBy`, `modifiedBy`, `createdAt`, `modifiedAt`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
    [
      req.body.primaryID,
	  req.body.orderID,
	  req.body.uid,
	  req.body.subTotal,
      req.body.damageProtection,
	  req.body.total,
	  req.body.securityDeposit,
	  req.body.discount,	
	  (req.body.subTotal*0.18),	   
	  req.body.grandTotal,
	  '',
	  req.body.firstName,
	  req.body.lastName,
	  req.body.mobile,
	  req.body.email,
	  req.body.billingAddress,
	  req.body.shippingAddress,
	  req.body.orderType,
	  '1',
	  req.body.orderStatus,
	  req.body.deliveryStatus,
	  req.body.refundStatus,
	  req.body.createdBy,
	  req.body.modifiedBy,
	  new Date(),
	  new Date()
    ],
    (err, results) => {
      if (!err) {
		var products = checkoutPInfo;

		products.forEach((resProduct)=>{
		  let renewalProduct = [];
		  renewalProduct.push(resProduct);
		  let startDate = getDates(resProduct.startDate);
		  let expiryDate = getDates(resProduct.expiryDate);
		  var sqlInsert = "INSERT INTO `order_item`(`primary_order_item_id`,`order_id`, `product_id`, `asset_id`, `discount`, `security_deposit`, `tenure_base_price`, `tenure_id`,`tenure_period`, `tenure_price`, `damage_protection`,`damage_charges`,`earlyReturnCharges`, `renewals_timline`,`overdue`,`delivery_status`, `startDate`, `endDate`, `status`, `createdAt`, `updatedAt`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
		  sql.query(sqlInsert,
			  [
			  0,
			  results.insertId,
			  resProduct.id,
			  resProduct.assetId,
			  0,
			  resProduct.prod_price,
			  resProduct.tenureBasePrice,
			  resProduct.tenure_id,
			  resProduct.tenure,
			  resProduct.price,	  
			  resProduct.dp,
			  resProduct.damageCharges,
			  0,
			  JSON.stringify(renewalProduct),
			  0,
			  4,
			  startDate,
			  expiryDate,
			  1,
			  new Date(),
			  new Date()
			  ],(errOT, OTResults)=>{
				if(!errOT){
					var sqlInsertORR =
						"INSERT INTO `order_renewals`(`order_item_id`,`rent`, `renewal_price`, `start_date`, `end_date`, `modified_at`, `modified_by`, `comments`, `is_renewed`,`is_renewal_created`) VALUES (?,?,?,?,?,?,?,?,?,?)";
						sql.query(
							sqlInsertORR,
							[
								OTResults.insertId,resProduct.price, resProduct.price, startDate, expiryDate, new Date(), 1, 'nil', 1, 0
							]
						);
						var updateOITStatus="UPDATE order_item SET status = 0 WHERE order_item_id=?";
						sql.query(updateOITStatus,
							[
								resProduct.returnedProduct.order_item_id
							]);
				}
			  }
		  );
		});
		logger.info({
			message: '/newReplace posted in orders successfully',
			dateTime: new Date()
		});
        res.send({message: 'Inserted Successfully',order_id:req.body.orderID, txnid: req.body.txnid});
      } else {
		logger.info({
			message: '/newReplace failed to post',
			dateTime: new Date()
		});
        res.send({message: err});
      }
    }
  );
});

router.post('/updateNewRenewOrder', verifyToken,function(req, res) {
	var updateOrder = `UPDATE order_item SET renewals_timline = ? where order_item_id = ?`;
	sql.query(updateOrder,
    [
		req.body.checkoutProductsInfo,
      	req.body.txnid,
    ],
    (err) => {
      if (!err) {
        res.send({message: 'Updated Successfully'});
      } else {
        res.send({message: err});
      }
    }
  );
});

router.put('/updateNewRenewOrder2', function(req, res) {
	var updateOrder = `UPDATE order_item SET renewals_timline = ? where order_item_id = ?`;
	sql.query(updateOrder,
    [
		req.body.checkoutProductsInfo,
      	req.body.txnid,
    ]
  );
});

router.post('/updateorderItem',verifyToken, function(req, res) {
	var sqlInsert = "INSERT INTO `customer_requests`( `order_item_id`, `order_id`, `request_id`, `requested_date`, `approval_status`, `approval_date`, `request_status`) VALUES (?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
    [
      req.body.order_item_id,
	  req.body.order_id,
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

/************renewals part*******************/
let key = '';
let salt = '';
let txnid = '';
let amount = '';
let status = '';

router.post('/hashRenew', (req, res) => {
    key = req.body.key;
    salt = req.body.salt;
    txnid = req.body.txnid;
    amount = req.body.amount;
    let prodinfo = req.body.prodinfo;
    let fname = req.body.fname;
    let email = req.body.email;
    let udf1 = req.body.udf1;
    let hashStr = key + "|" + txnid + "|" + amount + "|" + prodinfo + "|" + fname + "|" + email +  "|" + udf1 + "||||||||||" + salt;
    let hash = calcHash(hashStr);
    res.send({"hash": hash});
});

function calcHash(hashStr) {
    let cryp = crypto.createHash('sha512');
    cryp.update(hashStr);
    let hash = cryp.digest('hex');
    return hash;
}

router.post('/responseRenew', (req, res) => {
    txnid = req.body.txnid;
    amount = req.body.amount;
    let prodinfo = req.body.productinfo;
    let fname = req.body.firstname;
    let email = req.body.email;
    let udf1 = req.body.udf1;
    status = req.body.status;
    let hashStr = salt + "|" + status + "||||||||||" + udf1 + "|" + email + "|" + fname + "|" + prodinfo + "|" + amount + "|" + txnid + "|" + key;
    if(req.body.additionalCharges) {
        let addChrges = req.body.additionalCharges;
        hashStr = addChrges + "|" + hashStr;
    }
    let hash = calcHash(hashStr);
    if(hash == req.body.hash) {
        console.log('Success');
        res.redirect(`${constants.frontendUrl}/response`);
    } else {
        console.log('Failure');
    }
});

router.post('/renew', function(req, res) {
	datetime = new Date();
	orderDate = (this.datetime.getMonth()+1)+'/'+this.datetime.getDate()+'/'+this.datetime.getFullYear();
	orderTime = this.datetime.getHours()+':'+this.datetime.getMinutes()+':'+this.datetime.getSeconds();

	orderDateTime=[this.orderDate, this.orderTime];
	orderdatetime=JSON.stringify(orderDateTime);

	checkoutPInfo=JSON.parse(req.body.checkoutProductsInfo);
	checkoutPInfo.forEach((resp) => {
		let dateString = resp.nextStartDate;

		let dateParts = dateString.split("/");

		// month is 0-based, that's why we need dataParts[1] - 1
		let dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);	
		let dd= dateObject.getDate();
		let mm=dateObject.getMonth();
		let yy=dateObject.getFullYear();

		let db = mm+1+'/'+dd+'/'+yy;

		let renewedDate = new Date(db);
		let daysInDiff=dateDiffInDays(renewedDate,datetime);
		// if(daysInDiff<0 && resp.renewed!=4 && resp.renewed!=1){
		// 	let Days=new Date(yy, mm+2, 0).getDate();

        //     if(Days<dd){
		// 		ned  = new Date(yy, mm+1, Days);
		// 		newED = new Date(yy, mm+1, Days);
		// 	}else{					
		// 		ned = new Date(yy, mm+1, dd);
		// 		newED = new Date(yy, mm+1, dd-1);
		// 	}
		// 	resp.startDate=resp.nextStartDate;
		// 	resp.expiryDate=newED.toLocaleDateString('pt-PT');
		// 	resp.nextStartDate=ned.toLocaleDateString('pt-PT');
		// }
			
        //     let Days=new Date(yy, mm+2, 0).getDate();

        //     if(Days<dd){
		// 		ned  = new Date(yy, mm+1, Days);
		// 	}else{	
				
		// 		ned = new Date(yy, mm+1, dd-1);
		// 	}
		// resp.expiryDate=ned.toLocaleDateString('pt-PT');
	});

	var sqlInsert = "INSERT INTO `orders`(`userId`, `txnid`,`payuid`,`orderdate`, `amount`, `securitydeposit`, `damageProtection`, `orderedProducts`, `checkoutItemData`, `pinfo`, `fname`, `mobile`, `email`,`delivery_address`, `address`, `city`, `state`, `pincode`, `selfpickup`, `coupon`, `status`,`order_type`,`delivery_status`,`refund_status`,`overdue`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
    [
      req.body.uid,
	  req.body.txnid,
	  'N/A',
	  orderdatetime,
      req.body.amount,
	  req.body.securityDeposit,
	  req.body.damageProtection,
	  JSON.stringify(checkoutPInfo),
	  JSON.stringify(checkoutPInfo),
	  req.body.pinfo,
	  req.body.fname,
	  req.body.mobile,
	  req.body.email,
	  req.body.delvAddress,
	  req.body.address,
	  req.body.town,
	  req.body.state,
	  req.body.pincode,
	  'N/A',
	  'N/A',
	  'SUCCESS',
	  'Renewal order',
	  'Delivered',
	  'paid',
	  0
    ],
    (err) => {
      if (!err) {
        res.send({message: 'Inserted Successfully', txnid: req.body.txnid});
      } else {
        res.send({message: err});
      }
    }
  );
});

router.post('/updateRenewOrder', function(req, res) {
	var updateOrder = `UPDATE orders SET checkoutItemData = ? where txnid= ?`;
	sql.query(updateOrder,
    [
		req.body.checkoutProductsInfo,
      	req.body.txnid,
    ],
    (err) => {
      if (!err) {
        res.send({message: 'Updated Successfully', txnid: req.body.txnid});
      } else {
        res.send({message: err});
      }
    }
  );
});
/************End of renewals part**********/

/************Replacement part**************/
router.post('/replace', verifyToken,function(req, res) {
	datetime = new Date();
	orderDate = (this.datetime.getMonth()+1)+'/'+this.datetime.getDate()+'/'+this.datetime.getFullYear();
	orderTime = this.datetime.getHours()+':'+this.datetime.getMinutes()+':'+this.datetime.getSeconds();

	orderDateTime=[this.orderDate, this.orderTime];
	orderdatetime=JSON.stringify(orderDateTime);

	checkoutPInfo=req.body.checkoutProductsInfo;

	var sqlInsert = "INSERT INTO `orders`(`userId`, `txnid`,`payuid`,`orderdate`, `amount`, `securitydeposit`, `damageProtection`, `orderedProducts`, `checkoutItemData`, `pinfo`, `fname`, `mobile`, `email`,`delivery_address`, `address`, `city`, `state`, `pincode`, `selfpickup`, `coupon`, `status`,`order_type`,`delivery_status`,`refund_status`, `overdue`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
    [
      req.body.uid,
	  req.body.txnid,
	  'N/A',
	  orderdatetime,
      req.body.amount,
	  req.body.securityDeposit,
	  req.body.damageProtection,
	  JSON.stringify(checkoutPInfo),
	  JSON.stringify(checkoutPInfo),
	  JSON.stringify(req.body.pinfo),
	  req.body.fname,
	  req.body.mobile,
	  req.body.email,
	  req.body.delvAddress,
	  req.body.address,
	  req.body.town,
	  req.body.state,
	  req.body.pincode,
	  req.body.selfPickup,
	  'N/A',
	  'SUCCESS',
	  'Replacement order',
	  'Delivered',
	  'To be paid',
	  0
    ],
    (err) => {
      if (!err) {
        res.send({message: 'Inserted Successfully', txnid: req.body.txnid});
      } else {
        res.send({message: err});
      }
    }
  );
});
/************End of replacement part******/

/************Return part**************/
router.post('/return', verifyToken,function(req, res) {
	datetime = new Date();
	orderDate = (this.datetime.getMonth()+1)+'/'+this.datetime.getDate()+'/'+this.datetime.getFullYear();
	orderTime = this.datetime.getHours()+':'+this.datetime.getMinutes()+':'+this.datetime.getSeconds();

	orderDateTime=[this.orderDate, this.orderTime];
	orderdatetime=JSON.stringify(orderDateTime);

	checkoutPInfo=req.body.checkoutProductsInfo;

	var sqlInsert = "INSERT INTO `orders`(`userId`, `txnid`,`payuid`,`orderdate`, `amount`, `securitydeposit`, `damageProtection`, `orderedProducts`, `checkoutItemData`, `pinfo`, `fname`, `mobile`, `email`,`delivery_address`, `address`, `city`, `state`, `pincode`, `selfpickup`, `coupon`, `status`,`order_type`,`delivery_status`,`refund_status`, `overdue`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
    [
      req.body.uid,
	  req.body.txnid,
	  'N/A',
	  orderdatetime,
      req.body.amount,
	  req.body.securityDeposit,
	  req.body.damageProtection,
	  JSON.stringify(checkoutPInfo),
	  JSON.stringify(checkoutPInfo),
	  JSON.stringify(req.body.pinfo),
	  req.body.fname,
	  req.body.mobile,
	  req.body.email,
	  req.body.delvAddress,
	  req.body.address,
	  req.body.town,
	  req.body.state,
	  req.body.pincode,
	  req.body.selfPickup,
	  'N/A',
	  'SUCCESS',
	  'Return order',
	  'Returned',
	  req.body.refund_status,
	  0
    ],
    (err) => {
      if (!err) {
        res.send({message: 'Inserted Successfully', txnid: req.body.txnid});
      } else {
        res.send({message: err});
      }
    }
  );
});
/************End of return part******/

// router.get('/response', function(req, res) {
//     res.render('response.html', {key: 'test',salt: 'test',txnid: 'test',amount: 'test', productinfo: 'test', 
// 		firstname: 'test', email: 'test', mihpayid : 'test', status: 'test',resphash: 'test',msg:'test'});
// });


// router.get('/', function(req,res) {	
// 	var ord = JSON.stringify(Math.random()*1000);
// 	var i = ord.indexOf('.');
// 	ord = 'ORD'+ ord.substr(0,i);	
// 	//res.render(__dirname + '/checkout.html', {orderid:ord});
	
// });

/************Cashfree PG part******/
router.post('/calculateSecretKey', (req, res, next)=>{
	logger.info({
		message: '/calculateSecretKey api post started',
		dateTime: new Date()
	});
    const {paymentType} = req.body;
    var {formObj} = req.body;
    const secretKey = config.secretKey;
	const notify=""

    switch(paymentType){
        case enums.paymentTypeEnum.checkout: {
            const returnUrl = `${constUrl.apiUrl}payments/result`;
            formObj.returnUrl = returnUrl;
            formObj.notifyUrl = notify;
            formObj.appId = config.appId;
            const signature = helpers.signatureRequest1(formObj, secretKey);
            additionalFields = {
                returnUrl,
                notifyUrl:"",
                signature,
                appId: config.appId,
            };
			logger.info({
				message: '/calculateSecretKey success',
				dateTime: new Date()
			});
            return res.status(200).send({
                status:"success",
                additionalFields,
            });
        }
        case enums.paymentTypeEnum.merchantHosted: {
            var { formObj } = req.body;
            formObj.appId = config.appId;
            formObj.returnUrl = "";
            formObj.notifyUrl = notifyUrl;
            formObj.paymentToken = helpers.signatureRequest2(formObj, config.secretKey);
            return res.status(200).send({
                status: "success",
                paymentData: formObj,
            });
        }
        case enums.paymentTypeEnum.seamlessbasic: {
            //for now assume mode to be popup
            //TODO: add support for redirect
            var { formObj } = req.body;
            var additionalFields = {}; 
            formObj.appId = config.appId;
            additionalFields.paymentToken = helpers.signatureRequest3(formObj, config.secretKey);
            additionalFields.notifyUrl = notifyUrl;
            additionalFields.appId = config.appId;
            additionalFields.orderCurrency = "INR";
            return res.status(200).send({
                status: "success",
                additionalFields
            });
        }

        default: {
            console.log("incorrect payment option recieved");
            console.log("paymentOption:", paymentType);
            return res.status(200).send({
                status:"error",
                message:"incorrect payment type sent"
            });
        }
    }
});

//below will not be hit as server is not on https://
router.post('/notify', verifyToken,(req, res, next)=>{
    console.log("notify hit");
    console.log(req.body);
    return res.status(200).send({
        status: "success",
    })
});

router.get('/index' , (req, res, next)=>{
    console.log("index get hit");
    res.render('checkout',{ 
        postUrl: config.paths[config.enviornment].cashfreePayUrl
    });
});

router.post('/result',(req, res, next)=>{
	logger.info({
		message: `/result cashfree api started, order#: ${req.body.orderId}`,
		dateTime: new Date()
	});
    console.log("merchantHosted result hit");
    console.log(req.body);

	// let cDate=new Date(req.body.txTime).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
	// console.log(cDate);
    const txnTypes = enums.transactionStatusEnum;
    try{
    switch(req.body.txStatus){
        case txnTypes.cancelled: {
			var sqlInsert = "INSERT INTO `transaction`(`transaction_id`, `order_id`,`order_amount`, `status`, `type`,`transaction_source`,`transaction_msg`, `createdAt`) VALUES (?,?,?,?,?,?,?,?)";  
			sql.query(sqlInsert,
				[
				req.body.referenceId,
				req.body.orderId,
				req.body.orderAmount,
				2,
				req.body.paymentMode,
				'Cashfree',
				req.body.txMsg,
				new Date()
				],
				(err) => {
				if (!err) {
					logger.info({
						message: `/result cashfree posted successfully to transaction table with cancelled transaction#: ${req.body.referenceId}`,
						dateTime: new Date()
					});
					var updateOrder = `UPDATE orders SET orderStatus = ?, paymentStatus = ? where order_id= ?`;
					sql.query(updateOrder,
					[
						2,
						2,
						req.body.orderId,
					]);
				} else {
					logger.info({
						message: '/result cashfree failed to post in transaction table',
						dateTime: new Date()
					});
					res.send({message: err});
				}
				}
			);
            //buisness logic if payment was cancelled
            // return res.status(200).render('result',{data:{
            //     status: "failed",
            //     message: "transaction was cancelled by user",
            // }});
			res.redirect(url.format({
				pathname: `${constants.frontendUrl}/failure`,
				query: {
				   "transID": req.body.orderId,
				 }
			}));
			break;
        }
        case txnTypes.failed: {
            //buisness logic if payment failed
            const signature = req.body.signature;
            const derivedSignature = helpers.signatureResponse1(req.body, config.secretKey);
            if(derivedSignature !== signature){
                throw {name:"signature missmatch", message:"there was a missmatch in signatures genereated and received"}
            }

			res.redirect(url.format({
				pathname: `${constants.frontendUrl}/failure`,
				query: {
				   "transID": req.body.orderId,
				 }
			}));
            // return res.status(200).render('result',{data:{
            //     status: "failed",
            //     message: "payment failure",
            // }});
			break;
        }
        case txnTypes.success: {
            //buisness logic if payments succeed
            const signature = req.body.signature;
            const derivedSignature = helpers.signatureResponse1(req.body, config.secretKey);
			var status=1;
            if(derivedSignature !== signature){
                throw {name:"signature missmatch", message:"there was a missmatch in signatures genereated and received"}
            }
			if(req.body.txStatus=='SUCCESS'){
				status=1;
			} else{
				status=3;
			}
			var invoiceInsert = "INSERT INTO `invoice`(`invoice_id`, `order_id`, `invoice_description`, `status`) VALUES (?,?,?,?)";
			var sqlInsert = "INSERT INTO `transaction`(`transaction_id`, `order_id`,`order_amount`, `status`, `type`,`transaction_source`,`transaction_msg`, `createdAt`) VALUES (?,?,?,?,?,?,?,?)";  
			var checkTransaction = "SELECT * FROM transaction WHERE transaction_id = ? AND status=1";
			sql.query(checkTransaction,
				[
					req.body.referenceId,
				],(checkTransactionErr, checkTransactionRows)=>{
					if(!checkTransactionErr && checkTransactionRows.length==0){
						sql.query(sqlInsert,
							[
							req.body.referenceId,
							req.body.orderId,
							req.body.orderAmount,
							status,
							req.body.paymentMode,
							'Cashfree',
							req.body.txMsg,
							new Date()
							],
							(err1) => {
							if (!err1) {
								logger.info({
									message: `/result cashfree posted successfully to transaction table with transaction#: ${req.body.referenceId}`,
									dateTime: new Date()
								});
								// var updateOrder = `UPDATE orders SET paymentStatus = ? where order_id= ?`;
								// sql.query(updateOrder,
								// [
								// 	status,
								// 	req.body.orderId,
								// ]);

								var updateOrder = `UPDATE orders SET paidamount=(SELECT * FROM(SELECT paidAmount from orders WHERE order_id=${JSON.stringify(req.body.orderId)}) AS t)+${req.body.orderAmount} where order_id= ?`;
								sql.query(updateOrder,
								[
									req.body.orderId,
								],(errTransaction)=>{
									if(!errTransaction){
										requestify.get(`${constants.apiUrl}orders/getOrderByMyOrderIdAPI/${req.body.orderId}`).then(function(response) {
											// Get the response body
											var orderDetails = response.getBody()[0];
											let prodNames;
											var campaignName = 'Order Successful';
											var customerFullName = orderDetails.firstName+' '+orderDetails.lastName;
											var orderId = orderDetails.order_id;
											var paidAmount = JSON.stringify(orderDetails.grandTotal);
											var balanceAmount = 0;
											var emailTemplate = {templateNo:1, templateUrl:'send'};
											var templateParams = [customerFullName,paidAmount,orderId];
				
											requestify.post(`${constants.apiUrl}smsOrder`, {
												customerName: orderDetails.firstName, mobile:orderDetails.mobile, orderId:req.body.orderId
											});
											prodNames=orderDetails.orderItem.map((x) => x.prod_name).join(', ')
				
															
											if(orderDetails.balanceAmount>0){
												status=4;
												campaignName = 'Pay on Delivery Order Success';
												balanceAmount = JSON.stringify(orderDetails.balanceAmount);
												paidAmount = JSON.stringify(orderDetails.paidAmount);
												templateParams = [];
												templateParams = [customerFullName,paidAmount,orderId,balanceAmount];
												emailTemplate.templateNo = 12;
												emailTemplate.templateUrl = 'pod';
												logger.info({
													message: `/verifyRazorPayPrimary  templateparams: ${templateParams}, emailTemplate: ${emailTemplate}`,
													dateTime: new Date()
												});
											}
											var updateOrder = `UPDATE orders SET paymentStatus = ? where order_id= ?`;
											sql.query(updateOrder,
											[
												status,
												req.body.orderId,
											]);
				
											sql.query(`CALL insertSignalrQueue(${orderDetails.id},${orderDetails.grandTotal},${orderDetails.orderType_id},${JSON.stringify(prodNames)},${orderDetails.orderItem.length},${JSON.stringify(orderDetails.firstName)},${JSON.stringify(orderDetails.lastName)},${JSON.stringify(orderDetails.email)},${JSON.stringify(orderDetails.mobile)}, 0)`,
												(errSignalRQ, results) => {
													if (errSignalRQ) {						
														// res.send({message: errSignalRQ});
													}
												}
											);
											// requestify.post(`${constants.apiUrl}waOrderPlaced`, {
											// 	customerName: orderDetails.firstName, mobile:orderDetails.mobile, orderId:req.body.orderId, orderAmount:req.body.orderAmount
											// });
							
											let mobileNos=[];
											config.mobiles.forEach((configMobiles)=>{
												mobileNos.push(configMobiles);
											})
							
											// mobileNos = config.mobiles;
											mobileNos.push(orderDetails.mobile);
											mobileNos.forEach((mobileNumber)=>{
												let template = {
													"apiKey": constants.whatsappAPIKey,
													"campaignName": campaignName,
													"destination": mobileNumber,
													"userName": "IRENTOUT",
													"source": "Primary order",
													"media": {
														"url": "https://irentout.com/assets/images/slider/5.png",
														"filename": "IROHOME"
													},
													"templateParams": templateParams,
													"attributes": {
														"InvoiceNo": "1234"
													}
												}
												logger.info({
													message: `/cashfree primaryorder: Sending whatsapp message: order#: ${orderDetails.order_id}, mobile:${mobileNumber}`,
													dateTime: new Date()
												});
												requestify.post(`https://backend.aisensy.com/campaign/t1/api`, template);
											});
							
							
											logger.info({
												message: `/result primaryorder: whatsapp message sent: order#: ${req.body.orderId}`,
												dateTime: new Date()
											});
							
											requestify.get(`${constants.apiUrl}forgotpassword/getEmailTemplates/${emailTemplate.templateNo}`).then(function(templateRsponse) {
												
												let template = templateRsponse.getBody()[0];
												requestify.post(`${constants.apiUrl}forgotpassword/${emailTemplate.templateUrl}`, {
													email: orderDetails.email,
													template: template,
													orderNo: req.body.orderId,
													orderDate: orderDetails.createdAt,
													orderValue: orderDetails.grandTotal,
													paidAmount:paidAmount,
													balanceAmount:balanceAmount,
													paymentStatus: 'Success',
													orderType:orderDetails.orderType_id
												});
											});
							
										});
									}
								});

								
							} else {
								res.send({message: err});
							}
							}
						);			
						
						sql.query(invoiceInsert,
							[
							'N/A',
							req.body.orderId,
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
			
						
					}

				});
			
			
			
			res.redirect(url.format({
				pathname: `${constants.frontendUrl}/order-success`,
				query: {
				   "transID": req.body.orderId,
				   "PGtransId":req.body.referenceId
				 }
			}));
            // return res.status(200).render('result',{data:{
            //     status: "success",
            //     message: "payment success",
            // }});
			break;
        }
    }
    }
    catch(err){
        return res.status(500).render('result',{data:{
            status:"error",
            err: err,
            name: err.name,
            message: err.message,
        }});
    }

    const signature = req.body.signature;
    const derivedSignature = helpers.signatureResponse1(req.body, config.secretKey);
    if(derivedSignature === signature){
        console.log("works");
        // return res.status(200).send({
        //     status:req.body.txStatus,
        // })
    }
    else{
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
        return res.status(200).send({
            status: "error",
            message: "signature mismatch",
        })
    }
});
/************ End of Cashfree PG part *****************/


/************ Cashfree PG for renewals ***************/

router.post('/calculateSecretKeyForRenewals', (req, res, next)=>{
	logger.info({
		message: '/calculateSecretKeyForRenewals api post started',
		dateTime: new Date()
	});
    const {paymentType} = req.body;
    var {formObj} = req.body;
    const secretKey = config.secretKey;
	const notify=""

    switch(paymentType){
        case enums.paymentTypeEnum.checkout: {
            const returnUrl = `${constUrl.apiUrl}payments/renewalsResult`;
            formObj.returnUrl = returnUrl;
            formObj.notifyUrl = notify;
            formObj.appId = config.appId;
            const signature = helpers.signatureRequest1(formObj, secretKey);
            additionalFields = {
                returnUrl,
                notifyUrl:"",
                signature,
                appId: config.appId,
            };
			logger.info({
				message: '/calculateSecretKeyForRenewals api post started',
				dateTime: new Date()
			});
            return res.status(200).send({
                status:"success",
                additionalFields,
            });
        }
        case enums.paymentTypeEnum.merchantHosted: {
            var { formObj } = req.body;
            formObj.appId = config.appId;
            formObj.returnUrl = "";
            formObj.notifyUrl = notifyUrl;
            formObj.paymentToken = helpers.signatureRequest2(formObj, config.secretKey);
            return res.status(200).send({
                status: "success",
                paymentData: formObj,
            });
        }
        case enums.paymentTypeEnum.seamlessbasic: {
            //for now assume mode to be popup
            //TODO: add support for redirect
            var { formObj } = req.body;
            var additionalFields = {}; 
            formObj.appId = config.appId;
            additionalFields.paymentToken = helpers.signatureRequest3(formObj, config.secretKey);
            additionalFields.notifyUrl = notifyUrl;
            additionalFields.appId = config.appId;
            additionalFields.orderCurrency = "INR";
            return res.status(200).send({
                status: "success",
                additionalFields
            });
        }

        default: {
            console.log("incorrect payment option recieved");
            console.log("paymentOption:", paymentType);
            return res.status(200).send({
                status:"error",
                message:"incorrect payment type sent"
            });
        }
    }
});

router.post('/renewalsResult',(req, res, next)=>{
    console.log("merchantHosted result hit");
    console.log(req.body);
	logger.info({
		message: '/renewalsResult api post started',
		dateTime: new Date()
	});
    const txnTypes = enums.transactionStatusEnum;
    try{
    switch(req.body.txStatus){
        case txnTypes.cancelled: {

			var sqlInsert = "INSERT INTO `transaction`(`transaction_id`, `order_id`,`order_amount`, `status`, `type`,`transaction_source`,`transaction_msg`, `createdAt`) VALUES (?,?,?,?,?,?,?,?)";  
			sql.query(sqlInsert,
				[
				req.body.referenceId,
				req.body.orderId,
				req.body.orderAmount,
				2,
				req.body.paymentMode,
				'Cashfree',
				req.body.txMsg,
				new Date()
				],
				(err) => {
				if (!err) {
					logger.info({
						message: `/renewalsResult cashfree posted successfully to transaction table with cancelled transaction#: ${req.body.referenceId}`,
						dateTime: new Date()
					});
					var updateOrder = `UPDATE orders SET orderStatus = ?, paymentStatus = ? where order_id= ?`;
					sql.query(updateOrder,
					[
						2,
						2,
						req.body.orderId,
					]);
				} else {
					res.send({message: err});
				}
				}
			);
			logger.info({
				message: '/renewalsResult transaction cancelled',
				dateTime: new Date()
			});
			res.redirect(url.format({
				pathname: `${constants.frontendUrl}/failure`,
				query: {
				   "transID": req.body.orderId,
				 }
			}));
			break;
        }
        case txnTypes.failed: {
            //buisness logic if payment failed
            const signature = req.body.signature;
            const derivedSignature = helpers.signatureResponse1(req.body, config.secretKey);
            if(derivedSignature !== signature){
                throw {name:"signature missmatch", message:"there was a missmatch in signatures genereated and received"}
            }
			logger.info({
				message: '/renewalsResult transaction failed',
				dateTime: new Date()
			});
			res.redirect(url.format({
				pathname: `${constants.frontendUrl}/failure`,
				query: {
				   "transID": req.body.orderId,
				 }
			}));
			break;
            // return res.status(200).render('result',{data:{
            //     status: "failed",
            //     message: "payment failure",
            // }});
        }
        case txnTypes.success: {
            //buisness logic if payments succeed
            const signature = req.body.signature;
            const derivedSignature = helpers.signatureResponse1(req.body, config.secretKey);
			var status=1
            if(derivedSignature !== signature){
                throw {name:"signature missmatch", message:"there was a missmatch in signatures genereated and received"}
            }
			if(req.body.txStatus=='SUCCESS'){
				status=1;
			} else{
				status=3;
			}
			var invoiceInsert = "INSERT INTO `invoice`(`invoice_id`, `order_id`, `invoice_description`, `status`) VALUES (?,?,?,?)";
			var sqlInsert = "INSERT INTO `transaction`(`transaction_id`, `order_id`,`order_amount`, `status`, `type`,`transaction_source`,`transaction_msg`, `createdAt`) VALUES (?,?,?,?,?,?,?,?)";  
			sql.query(sqlInsert,
				[
				req.body.referenceId,
				req.body.orderId,
				req.body.orderAmount,
				status,
				req.body.paymentMode,
				'Cashfree',
				req.body.txMsg,
				new Date()
				],
				(err1) => {
				if (!err1) {
					logger.info({
						message: `/renewalsResult cashfree posted successfully to transaction table with transaction#: ${req.body.referenceId}`,
						dateTime: new Date()
					});
					// var updateOrder = `UPDATE orders SET paymentStatus = ? where order_id= ?`;
					// sql.query(updateOrder,
					// [
					// 	status,
					// 	req.body.orderId,
					// ]);
					var updateOrder = `UPDATE orders SET paymentStatus = ?, paidamount=(SELECT * FROM(SELECT paidAmount from orders WHERE order_id=${JSON.stringify(req.body.orderId)}) AS t)+${req.body.orderAmount} where order_id= ?`;
					sql.query(updateOrder,
					[
						status,
						req.body.orderId,
					]);
				} else {
					res.send({message: err});
				}
				}
			);

			sql.query(invoiceInsert,
				[
				'N/A',
				req.body.orderId,
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
				requestify.get(`${constants.apiUrl}orders/getOrderByMyOrderIdAPI/${req.body.orderId}`).then(async function(response) {
					// Get the response body
					orderDetails = await response.getBody()[0];	

					var updateRenewStatus=`UPDATE order_renewals SET is_renewed=1, modified_at=now(), modified_by=${orderDetails.customer_id}, comments='renewalsResult' WHERE order_item_id=? AND is_renewed=0`;
					orderDetails.orderItem.forEach((resOIT)=>{
						sql.query(updateRenewStatus,
							[
								resOIT.primary_order_item_id
							]);
					});
					
					let template = {
						"apiKey": constants.whatsappAPIKey,
						"campaignName": "Renewal Order Success",
						"destination": orderDetails.mobile,
						"userName": "IRENTOUT",
						"source": "Renewal Order Success",
						"media": {
						   "url": "https://irentout.com/assets/images/slider/5.png",
						   "filename": "IROHOME"
						},
						"templateParams": [
							orderDetails.firstName+' '+orderDetails.lastName,  req.body.orderId,req.body.orderAmount
						],
						"attributes": {
						  "InvoiceNo": "1234"
						}
					}
	
					requestify.post(`https://backend.aisensy.com/campaign/t1/api`, template);
					
					requestify.post(`${constants.apiUrl}smsOrder`, {
						customerName: orderDetails.firstName, mobile:orderDetails.mobile, orderId:req.body.orderId
					});
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
							console.log(productsArr);
							console.log(prodAll)
							console.log(oid);
							updateFields(productsArr, prodAll,oid);
							resolve('cid success');
							
						});

						requestify.get(`${constants.apiUrl}forgotpassword/getEmailTemplates/2`).then(function(templateRsponse) {
					
							let template = templateRsponse.getBody()[0]
							requestify.post(`${constants.apiUrl}forgotpassword/send`, {
								email: orderDetails.email,
								template: template,
								orderNo: req.body.orderId,
								orderDate: orderDetails.createdAt,
								orderValue: orderDetails.grandTotal,
								paymentStatus: 'Success',
								orderType:orderDetails.orderType_id
							});
						});
						
					});			
				});
			});

			
			cid.then((success)=>{
				logger.info({
					message: '/renewalsResult transaction successfully',
					dateTime: new Date()
				});
				// res.redirect(url.format({
				// 	pathname: `${constants.frontendUrl}/order-success`,
				// 	query: {
				// 	   "transID": req.body.orderId,
				// 	 }
				// }));
			});
			res.redirect(url.format({
				pathname: `${constants.frontendUrl}/Thank-you`,
				query: {
					"transID": req.body.orderId,
					"PGtransId":req.body.referenceId
				}
			}));
			break;
            // return res.status(200).render('result',{data:{
            //     status: "success",
            //     message: "payment success",
            // }});
        }
    }
    }
    catch(err){
        return res.status(500).render('result',{data:{
            status:"error",
            err: err,
            name: err.name,
            message: err.message,
        }});
    }

    const signature = req.body.signature;
    const derivedSignature = helpers.signatureResponse1(req.body, config.secretKey);
    if(derivedSignature === signature){
        console.log("works");
        return res.status(200).send({
            status:req.body.txStatus,
        })
    }
    else{
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
        return res.status(200).send({
            status: "error",
            message: "signature mismatch",
        })
    }
});


/************ End of Cashfree PG for renewals ********/


/*********** Cashfree PG for RR *********************/
router.post('/calculateSecretKeyForRR', (req, res, next)=>{
    const {paymentType} = req.body;
    var {formObj} = req.body;
    const secretKey = config.secretKey;
	const notify=""

    switch(paymentType){
        case enums.paymentTypeEnum.checkout: {
            const returnUrl = `${constUrl.apiUrl}payments/RRResult`;
            formObj.returnUrl = returnUrl;
            formObj.notifyUrl = notify;
            formObj.appId = config.appId;
            const signature = helpers.signatureRequest1(formObj, secretKey);
            additionalFields = {
                returnUrl,
                notifyUrl:"",
                signature,
                appId: config.appId,
            };
            return res.status(200).send({
                status:"success",
                additionalFields,
            });
        }
        case enums.paymentTypeEnum.merchantHosted: {
            var { formObj } = req.body;
            formObj.appId = config.appId;
            formObj.returnUrl = "";
            formObj.notifyUrl = notifyUrl;
            formObj.paymentToken = helpers.signatureRequest2(formObj, config.secretKey);
            return res.status(200).send({
                status: "success",
                paymentData: formObj,
            });
        }
        case enums.paymentTypeEnum.seamlessbasic: {
            //for now assume mode to be popup
            //TODO: add support for redirect
            var { formObj } = req.body;
            var additionalFields = {}; 
            formObj.appId = config.appId;
            additionalFields.paymentToken = helpers.signatureRequest3(formObj, config.secretKey);
            additionalFields.notifyUrl = notifyUrl;
            additionalFields.appId = config.appId;
            additionalFields.orderCurrency = "INR";
            return res.status(200).send({
                status: "success",
                additionalFields
            });
        }

        default: {
            console.log("incorrect payment option recieved");
            console.log("paymentOption:", paymentType);
            return res.status(200).send({
                status:"error",
                message:"incorrect payment type sent"
            });
        }
    }
});

router.post('/RRResult',(req, res, next)=>{
    console.log("merchantHosted result hit");
    console.log(req.body);

    const txnTypes = enums.transactionStatusEnum;
    try{
    switch(req.body.txStatus){
        case txnTypes.cancelled: {

			// var sqlInsert = "INSERT INTO `transaction`(`transaction_id`, `order_id`,`order_amount`, `status`, `type`,`transaction_source`,`transaction_msg`, `createdAt`) VALUES (?,?,?,?,?,?,?,?)";  
			// sql.query(sqlInsert,
			// 	[
			// 	req.body.referenceId,
			// 	req.body.orderId,
			// 	req.body.orderAmount,
			// 	2,
			// 	req.body.paymentMode,
			// 	'Cashfree',
			// 	req.body.txMsg,
			// 	new Date()
			// 	],
			// 	(err) => {
			// 	if (!err) {
			// 		var updateOrder = `UPDATE orders SET orderStatus = ?, paymentStatus = ? where order_id= ?`;
			// 		sql.query(updateOrder,
			// 		[
			// 			2,
			// 			4,
			// 			req.body.orderId,
			// 		]);
			// 	} else {
			// 		res.send({message: err});
			// 	}
			// 	}
			// );

			// sql.query(invoiceInsert,
			// 	[
			// 	'N/A',
			// 	req.body.orderId,
			// 	'N/A',
			// 	1
			// 	],
			// 	(err1, results) => {
			// 	if (!err1) {
			// 		var invoiceNo = 'IRO/21-22/'+results.insertId;
			// 		var updateInvoice = `UPDATE invoice SET invoice_id = ? where id= ?`;
			// 		sql.query(updateInvoice,
			// 		[
			// 			invoiceNo,
			// 			results.insertId,
			// 		]);
			// 	} else {
			// 		res.send({message: err});
			// 	}
			// 	}
			// );
			
			res.redirect(url.format({
				pathname: `${constants.frontendUrl}/failure`,
				query: {
				   "transID": req.body.orderId,
				 }
			}));
			break;
        }
        case txnTypes.failed: {
            //buisness logic if payment failed
            const signature = req.body.signature;
            const derivedSignature = helpers.signatureResponse1(req.body, config.secretKey);
            if(derivedSignature !== signature){
                throw {name:"signature missmatch", message:"there was a missmatch in signatures genereated and received"}
            }

			res.redirect(url.format({
				pathname: `${constants.frontendUrl}/failure`,
				query: {
				   "transID": req.body.orderId,
				 }
			}));
			break;
            // return res.status(200).render('result',{data:{
            //     status: "failed",
            //     message: "payment failure",
            // }});
        }
        case txnTypes.success: {
            //buisness logic if payments succeed
            const signature = req.body.signature;
            const derivedSignature = helpers.signatureResponse1(req.body, config.secretKey);
			var status =1;
            if(derivedSignature !== signature){
                throw {name:"signature missmatch", message:"there was a missmatch in signatures genereated and received"}
            }
			if(req.body.txStatus=='SUCCESS'){
				status=1;
			} else{
				status=3;
			}
			var invoiceInsert = "INSERT INTO `invoice`(`invoice_id`, `order_id`, `invoice_description`, `status`) VALUES (?,?,?,?)";
			var sqlInsert = "INSERT INTO `transaction`(`transaction_id`, `order_id`,`order_amount`, `status`, `type`,`transaction_source`,`transaction_msg`, `createdAt`) VALUES (?,?,?,?,?,?,?,?)";  
			sql.query(sqlInsert,
				[
				req.body.referenceId,
				req.body.orderId,
				req.body.orderAmount,
				status,
				req.body.paymentMode,
				'Cashfree',
				req.body.txMsg,
				new Date()
				],
				(err1) => {
				if (!err1) {
					logger.info({
						message: `/RRResult cashfree posted successfully to transaction table with transaction#: ${req.body.referenceId}`,
						dateTime: new Date()
					});
					if(req.body.txStatus=='SUCCESS'){
						var updateOrder = `UPDATE orders SET paymentStatus = ? where order_id= ?`;
						sql.query(updateOrder,
						[
							status,
							req.body.orderId,
						]);
					}
					
				} else {
					res.send({message: err});
				}
				}
			);

			sql.query(invoiceInsert,
				[
				'N/A',
				req.body.orderId,
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
			
			res.redirect(url.format({
				pathname: `${constants.frontendUrl}/Thank-you`,
				query: {
				   "transID": req.body.orderId,
				   "PGtransId":req.body.referenceId
				 }
			}));
            // return res.status(200).render('result',{data:{
            //     status: "success",
            //     message: "payment success",
            // }});
			break;
        }
    }
    }
    catch(err){
        return res.status(500).render('result',{data:{
            status:"error",
            err: err,
            name: err.name,
            message: err.message,
        }});
    }

    const signature = req.body.signature;
    const derivedSignature = helpers.signatureResponse1(req.body, config.secretKey);
    if(derivedSignature === signature){
        console.log("works");
        return res.status(200).send({
            status:req.body.txStatus,
        })
    }
    else{
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
        return res.status(200).send({
            status: "error",
            message: "signature mismatch",
        })
    }
});

/*********** End of Cashfree PG for RR *************/


router.put("/updateOrderId", verifyToken,(req, res) => {
    var updateOrder = `UPDATE orders SET order_id = ? where id= ?`;
	sql.query(updateOrder,
	[
		req.body.txnid,
		req.body.oid
	],
    (err) => {
      if (!err) {
        res.send({message: 'Inserted Successfully'});
      } else {
        res.send({message: err});
      }
    });
});

router.post('/', function(req, res){
	var strdat = '';
	var data = req.body;
	var cryp = crypto.createHash('sha512');
	var text = data.key+'|'+data.txnid+'|'+data.amount+'|'+data.pinfo+'|'+data.fname+'|'+data.email+'|||||'+data.udf5+'||||||'+data.salt;
	cryp.update(text);
	var hash = cryp.digest('hex');		
	res.setHeader("Content-Type", "text/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.end(JSON.stringify(hash));
});

router.post('/response', function(req, res){
	var urlRedirect = `${constants.frontendUrl}/failure`;
	var key = req.body.key;
	var salt = 'm5sx41HICr';
	var txnid = req.body.txnid;
	var amount = req.body.amount;
	var productinfo = req.body.productinfo;
	var firstname = req.body.firstname;
	var email = req.body.email;
	var udf5 = req.body.udf5;
	var mihpayid = req.body.mihpayid;
	var status = req.body.status;
	var resphash = req.body.hash;
	var uid = req.body.uid;
	
	var keyString 		=  	key+'|'+txnid+'|'+amount+'|'+productinfo+'|'+firstname+'|'+email+'|||||'+udf5+'|||||';
	var keyArray 		= 	keyString.split('|');
	var reverseKeyArray	= 	keyArray.reverse();
	var reverseKeyString=	salt+'|'+status+'|'+reverseKeyArray.join('|');
	
	var cryp = crypto.createHash('sha512');	
	cryp.update(reverseKeyString);
	var calchash = cryp.digest('hex');
	
	var msg = 'Payment failed for Hash not verified...';
	if(calchash == resphash){
		msg = 'Transaction Successful and Hash Verified...';
		urlRedirect = `${constants.frontendUrl}/order-success`;
	}
	// if(status=='success'){
	// 	msg = 'Transaction Successful and Hash Verified...';
	// 	urlRedirect = `${constants.frontendUrl}/order-success`;
	// }

	var updateOrder = `UPDATE orders SET payuid = ? where txnid= ?`;
	sql.query(updateOrder,
    [
		req.body.mihpayid,
      	req.body.txnid,
    ]);

	var sqlUpdate = "UPDATE `users` SET `cart`= ? WHERE `uid` = ?";
  	sql.query(
    sqlUpdate,
    [
      '[]',
      uid
    ],
    (err, rows) => {
      if (!err) {
        res.redirect(url.format({
			pathname: urlRedirect,
			query: {
			   "transID": txnid,
			 }
		}));
      } else {
        res.redirect(url.format({
			pathname: urlRedirect,
			query: {
			   "transID": txnid,
			 }
		}));
      }
    }
  );
	
	
});

router.post('/saveorder', function(req, res) {
	datetime = new Date();
	orderDate = (this.datetime.getMonth()+1)+'/'+this.datetime.getDate()+'/'+this.datetime.getFullYear();
	orderTime = this.datetime.getHours()+':'+this.datetime.getMinutes()+':'+this.datetime.getSeconds();

	orderDateTime=[this.orderDate, this.orderTime];
	orderdatetime=JSON.stringify(orderDateTime);

	checkoutPInfo=JSON.parse(req.body.checkoutProductsInfo);
	let dPI = JSON.parse(req.body.damageProtection);
	checkoutPInfo.forEach((resp) => { //this loop is for expDate and nextStartDate calculation
		if(dPI>0){
			resp.dp=resp.price*(8/100);
		  } else{
			resp.dp=0;
		}
		
		let dateString = resp.delvdate;

		let dateParts = dateString.split("/");

		// month is 0-based, that's why we need dataParts[1] - 1
		let dateObject = new Date(+dateParts[2], dateParts[1]-1, +dateParts[0]);	
		let dd= dateObject.getDate();
		let mm=dateObject.getMonth();
		let yy=dateObject.getFullYear();

		// let db = mm+'/'+dd+'/'+yy;

		// let deliveredDate = new Date(db);
		// let sd=deliveredDate.getDate();
		// let nd = sd-0;
		// let ed = new Date(`${deliveredDate.getFullYear()}-${deliveredDate.getMonth()+3}-${nd}`);
			let Days=new Date(yy, mm+2, 0).getDate();

            if(Days<dd){
				newED = new Date(yy, mm+1, Days);              
				ned  = new Date(yy, mm+1, Days);
			  }else{					
				newED = new Date(yy, mm+1, dd-1);
				ned = new Date(yy, mm+1, dd-1);				
			  }
			ned.setDate(ned.getDate() + 1);
			let expDate = newED.getDate()+'/'+(newED.getMonth()+1)+'/'+newED.getFullYear();
			let nextStartDate = ned.getDate()+'/'+(ned.getMonth()+1)+'/'+ned.getFullYear();
		// resp.expiryDate=ned.toLocaleDateString();
		resp.startDate=resp.delvdate;
		resp.expiryDate=expDate;
		resp.nextStartDate=nextStartDate;
		resp.deliveryAssigned=0;
		resp.billPeriod = 'To be assigned';
	});

	var sqlInsert = "INSERT INTO `orders`(`userId`, `txnid`,`payuid`,`orderdate`, `amount`, `securitydeposit`, `damageProtection`, `orderedProducts`, `checkoutItemData`, `pinfo`, `fname`, `mobile`, `email`,`delivery_address`, `address`, `city`, `state`, `pincode`, `selfpickup`, `coupon`, `status`,`order_type`,`delivery_status`,`refund_status`, `overdue`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
    [
      req.body.uid,
	  req.body.txnid,
	  'N/A',
	  orderdatetime,
      req.body.amount,
	  req.body.securityDeposit,
	  req.body.damageProtection,
	  JSON.stringify(checkoutPInfo),
	  JSON.stringify(checkoutPInfo),
	  req.body.pinfo,
	  req.body.fname,
	  req.body.mobile,
	  req.body.email,
	  req.body.delvAddress,
	  req.body.address,
	  req.body.town,
	  req.body.state,
	  req.body.pincode,
	  req.body.selfPickup,
	  'N/A',
	  'Initiated',
	  'Primary order',
	  'Delivery awaited',
	  'Paid',
	  0
    ],
    (err) => {
      if (!err) {
        res.send({message: 'Inserted Successfully', txnid: req.body.txnid});
      } else {
        res.send({message: err});
      }
    }
  );
});

router.post('/updateorder', function(req, res) {
	var updateOrder = `UPDATE orders SET status = ? where txnid= ?`;
	sql.query(updateOrder,
    [
		req.body.status,
      	req.body.txnid,
    ],
    (err) => {
      if (!err) {
        res.send({message: 'Updated Successfully', txnid: req.body.txnid});
      } else {
        res.send({message: err});
      }
    }
  );
});

/**
 * Deleting the transaction on failure or cancelling of payment
 */
router.post('/deleteorder', function(req, res) {
    var deleteOrder = `DELETE FROM orders WHERE txnid = ?`;
    sql.query(deleteOrder,
    [
          req.body.txnid,
    ],
    (err) => {
      if (!err) {
        res.send({message: 'Updated Successfully', txnid: req.body.txnid});
      } else {
        res.send({message: err});
      }
    }
  );
});

router.post('/postManualOrderTransaction', function(req, res) {
    var sqlInsert = "INSERT INTO `transaction`(`transaction_id`, `order_id`,`order_amount`, `status`, `type`,`transaction_source`,`transaction_msg`, `createdAt`) VALUES (?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
		[
			req.body.transactionNo,
			req.body.orderId,
			req.body.orderAmount,
			1,
			req.body.paymentMode,
			'Manual',
			req.body.txMsg,
			req.body.tDate
		],
		(err) => {
		if (!err) {
			logger.info({
				message: '/postManualOrderTransaction cashfree posted successfully to transaction table',
				dateTime: new Date()
			});	
			// var updateInvoice = `UPDATE orders SET paymentStatus = ? where order_id= ?`;
			// sql.query(updateInvoice,
			// [
			// 	req.body.paymentStatus,
			// 	req.body.orderId,
			// ]);	
			res.send({message: 'postManualOrderTransaction Successfully'});	
		} else {
			logger.info({
				message: '/postManualOrderTransaction cashfree failed to post in transaction table',
				dateTime: new Date()
			});
			res.send({message: err});
		}
		}
	);
});

router.post('/postManualOrderTransaction2', function(req, res) {
    var sqlInsert = "INSERT INTO `transaction`(`transaction_id`, `order_id`,`order_amount`, `status`, `type`,`transaction_source`,`transaction_msg`, `createdAt`) VALUES (?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
		[
		req.body.transactionNo,
		req.body.orderId,
		req.body.orderAmount,
		req.body.paymentStatus,
		req.body.paymentMode,
		'Manual',
		req.body.txMsg,
		req.body.tDate
		],
		(err) => {
		if (!err) {
			logger.info({
				message: '/postManualOrderTransaction cashfree posted successfully to transaction table',
				dateTime: new Date()
			});		
			res.send({message: 'postManualOrderTransaction Successfully'});	
		} else {
			logger.info({
				message: '/postManualOrderTransaction cashfree failed to post in transaction table',
				dateTime: new Date()
			});
			res.send({message: err});
		}
		}
	);
});

router.post('/postInvoice',(req, res, next)=>{
	var invoiceInsert = "INSERT INTO `invoice`(`invoice_id`, `order_id`, `invoice_description`, `status`) VALUES (?,?,?,?)";
	sql.query(invoiceInsert,
		[
		'N/A',
		req.body.orderId,
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
			res.send({message: err1});
		}
		}
	);
});

router.put('/updatePaymentStatus',(req, res, next)=>{
	var updateOrder = `UPDATE orders SET paymentStatus = ? where id= ?`;
	sql.query(updateOrder,
	[
		req.body.paymentStatus,
		req.body.orderId,
	],
	(err1) => {
		if (!err1) {
			res.send({message: 'payment status updated successfully'});
		} else {
			res.send({message: err1});
		}
	});
});

router.put('/updateBalanceAmount',(req, res, next)=>{
	var updateOrder = `UPDATE orders SET balanceAmount = ?, paidAmount = ? where order_id= ?`;
	sql.query(updateOrder,
	[
		req.body.balanceAmount,
		req.body.paidAmount,
		req.body.orderId,
	],
	(err1) => {
		if (!err1) {
			res.send({message: 'payment status updated successfully'});
		} else {
			res.send({message: err1});
		}
	});
});

router.put('/updatePGOrderId',(req, res, next)=>{
	var updateOrder = `UPDATE orders SET pg_order_id = ? where order_id= ?`;
	sql.query(updateOrder,
	[
		req.body.pg_order_id,
		req.body.orderId,
	],
	(err1) => {
		if (!err1) {
			res.send({message: '/updatePGOrderId updated successfully', status:'Success'});
		} else {
			res.send({message: err1, status:'Failed'});
		}
	});
});

router.put('/updateTransaction/:id',(req, res, next)=>{
	var updateOrder = `UPDATE transaction SET transaction_id=?,order_amount=?,status=?,type=?,transaction_msg=? WHERE id= ${req.params.id}`;
	sql.query(updateOrder,
	[
		req.body.transactionNo,
		req.body.orderAmount,
		req.body.paymentStatus,
		req.body.paymentMode,
		req.body.txMsg,
	],
	(err1) => {
		if (!err1) {
			res.send({message: 'transaction status updated successfully'});
		} else {
			res.send({message: err1});
		}
	});
});

router.post('/postManualRenewalOrderTransaction',(req, res, next)=>{
    console.log("merchantHosted result hit");
    console.log(req.body);
	logger.info({
		message: '/postManualRenewalOrderTransaction api post started',
		dateTime: new Date()
	});
    var invoiceInsert = "INSERT INTO `invoice`(`invoice_id`, `order_id`, `invoice_description`, `status`) VALUES (?,?,?,?)";
	var sqlInsert = "INSERT INTO `transaction`(`transaction_id`, `order_id`,`order_amount`, `status`, `type`,`transaction_source`,`transaction_msg`, `createdAt`) VALUES (?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
		[
			req.body.transactionNo,
			req.body.orderId,
			req.body.orderAmount,
			1,
			req.body.paymentMode,
			'Manual',
			req.body.txMsg,
			req.body.tDate
		],
		(err1) => {
		if (!err1) {
			var updateOrder = `UPDATE orders SET paymentStatus = ? where order_id= ?`;
			sql.query(updateOrder,
			[
				req.body.paymentStatus,
				req.body.orderId,
			]);

			requestify.get(`${constants.apiUrl}orders/getOrderByMyOrderIdAPI/${req.body.orderId}`).then(async function(response) {
				// Get the response body
				orderDetails = await response.getBody()[0];	

				var updateRenewStatus=`UPDATE order_renewals SET is_renewed=1, modified_at=now(), modified_by=${orderDetails.customer_id}, comments='postManualRenewalOrderTransaction' WHERE order_item_id=? AND is_renewed=0`;
				orderDetails.orderItem.forEach((resOIT)=>{
					sql.query(updateRenewStatus,
						[
							resOIT.primary_order_item_id
						]);
				});

				let template = {
					"apiKey": constants.whatsappAPIKey,
					"campaignName": "Renewal Order Success",
					"destination": orderDetails.mobile,
					"userName": "IRENTOUT",
					"source": "Renewal Order Success",
					"media": {
					   "url": "https://irentout.com/assets/images/slider/5.png",
					   "filename": "IROHOME"
					},
					"templateParams": [
						orderDetails.firstName+' '+orderDetails.lastName, req.body.orderId,JSON.stringify(req.body.orderAmount)
					],
					"attributes": {
					  "InvoiceNo": "1234"
					}
				}

				requestify.post(`https://backend.aisensy.com/campaign/t1/api`, template);
			});
			
		} else {
			res.send({message: err});
		}
		}
	);

	sql.query(invoiceInsert,
		[
		'N/A',
		req.body.orderId,
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
				res.send({message: 'Updated Successfully'});
			} else {
				res.send({message: err});
			}
		}
	);

    
});

router.post('/razorPayOrder', (req, res,next) =>{
	var options = {
		method:req.body.method,
		amount: req.body.amount,  // amount in the smallest currency unit
		currency: "INR",
		receipt: req.body.receipt,
		payment_capture: 0
	};
	instance.orders.create(options, function(err, order) {
		if(err){
			console.log(err);
			next(err);
		}

		if(order){
			console.log(order);
			res.json({success:true, status:'Order created successfully',name:req.body.name, value: order, key:config.razorKeyId})
		}
	});
});

router.post('/verifyRazorPayPrimary', (req, res) =>{

	let body=req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
   
	var crypto = require("crypto");
	var expectedSignature = crypto.createHmac('sha256', config.razorPaySecret)
									 .update(body.toString())
									 .digest('hex');
									 console.log("sig received " ,req.body.razorpay_signature);
									 console.log("sig generated " ,expectedSignature);
	 var response = {"signatureIsValid":"false"};
	 if(expectedSignature === req.body.razorpay_signature){		
		response={"signatureIsValid":"true"}
		requestify.request(`https://api.razorpay.com/v1/payments/${req.body.razorpay_payment_id}`, {
			method: 'GET',
			auth: {
				username: config.razorKeyId,
				password: config.razorPaySecret
			},
			dataType: 'json'		
		})
		.then(function(response) {
			// get the response body
			const razorPayResponse = response.getBody();
			var amount = razorPayResponse.amount.toString();
			if(razorPayResponse.status=='authorized'){
				status=1;
			} else{
				status=3;
			}
			
			var invoiceInsert = "INSERT INTO `invoice`(`invoice_id`, `order_id`, `invoice_description`, `status`) VALUES (?,?,?,?)";
			var sqlInsert = "INSERT INTO `transaction`(`transaction_id`, `order_id`,`order_amount`, `status`, `type`,`transaction_source`,`transaction_msg`, `createdAt`) VALUES (?,?,?,?,?,?,?,?)";  
			var checkTransaction = "SELECT * FROM transaction WHERE transaction_id = ? AND status=1";
			sql.query(checkTransaction,
				[
					req.body.referenceId,
				],(checkTransactionErr, checkTransactionRows)=>{
					if(!checkTransactionErr && checkTransactionRows.length==0){
						sql.query(sqlInsert,
							[
								razorPayResponse.id,
								req.body.orderId,
								amount.slice(0,-2),
								status,
								razorPayResponse.method,
								'RazorPay',
								razorPayResponse.order_id,
								new Date()
							],
							(err1) => {
							if (!err1) {
								logger.info({
									message: `/verifyRazorPayPrimary  posted successfully to transaction table with transaction#: ${razorPayResponse.id}`,
									dateTime: new Date()
								});
								if(req.body.selectedMode=='COD' && razorPayResponse.status=='authorized'){
									status=4;
								}else if(req.body.selectedMode=='orderPay' && razorPayResponse.status=='authorized'){
									let updateOrderBalanceAmount = `UPDATE orders SET balanceamount = ? where order_id= ?`;
									sql.query(updateOrderBalanceAmount,
									[
										0,
										req.body.orderId,
									]);
								}
								var updateOrder = `UPDATE orders SET paymentStatus = ?, paidamount=(SELECT * FROM(SELECT paidAmount from orders WHERE order_id=${JSON.stringify(req.body.orderId)}) AS t)+${amount.slice(0,-2)} where order_id= ?`;
								sql.query(updateOrder,
								[
									status,
									req.body.orderId,
								],
								(orderUpdateErr) => {
									if (!orderUpdateErr) {
										requestify.get(`${constants.apiUrl}orders/getOrderByMyOrderIdAPI/${req.body.orderId}`).then(function(response) {
											// Get the response body
											let orderDetails = response.getBody()[0];
											let prodNames;
											var campaignName = 'Order Successful';
											var customerFullName = orderDetails.firstName+' '+orderDetails.lastName;
											var orderId = orderDetails.order_id;
											var paidAmount = JSON.stringify(orderDetails.grandTotal);
											var balanceAmount = 0;
											var emailTemplate = {templateNo:1, templateUrl:'send'};
				
											var templateParams = [customerFullName,paidAmount,orderId];
											
											if(req.body.selectedMode=='COD'){
												campaignName = 'Pay on Delivery Order Success';
												balanceAmount = JSON.stringify(orderDetails.balanceAmount);
												paidAmount = JSON.stringify(orderDetails.paidAmount);
												templateParams = [];
												templateParams = [customerFullName,paidAmount,orderId,balanceAmount];
												emailTemplate.templateNo = 12;
												emailTemplate.templateUrl = 'pod';
												logger.info({
													message: `/verifyRazorPayPrimary  templateparams: ${templateParams}, emailTemplate: ${emailTemplate}`,
													dateTime: new Date()
												});
											}else if(req.body.selectedMode=='orderPay'){
												campaignName = 'Balance Payment Receipt';
												paidAmount = amount.slice(0,-2);
												templateParams = [];
												templateParams = [customerFullName,paidAmount,orderId];
											}
				
											requestify.post(`${constants.apiUrl}smsOrder`, {
												customerName: orderDetails.firstName, mobile:orderDetails.mobile, orderId:req.body.orderId
											});
											prodNames=orderDetails.orderItem.map((x) => x.prod_name).join(', ')
											
											sql.query(`CALL insertSignalrQueue(${orderDetails.id},${orderDetails.grandTotal},${orderDetails.orderType_id},${JSON.stringify(prodNames)},${orderDetails.orderItem.length},${JSON.stringify(orderDetails.firstName)},${JSON.stringify(orderDetails.lastName)},${JSON.stringify(orderDetails.email)},${JSON.stringify(orderDetails.mobile)}, 0)`,
												(errSignalRQ, results) => {
													if (errSignalRQ) {						
														// res.send({message: errSignalRQ});
													}
												}
											);
											// requestify.post(`${constants.apiUrl}waOrderPlaced`, {
											// 	customerName: orderDetails.firstName, mobile:orderDetails.mobile, orderId:req.body.orderId, orderAmount:req.body.orderAmount
											// });
							
											let mobileNos=[];
											config.mobiles.forEach((configMobiles)=>{
												mobileNos.push(configMobiles);
											})
							
											// mobileNos = config.mobiles;
											mobileNos.push(orderDetails.mobile);
											mobileNos.forEach((mobileNumber)=>{
												let template = {
													"apiKey": constants.whatsappAPIKey,
													"campaignName": campaignName,
													"destination": mobileNumber,
													"userName": "IRENTOUT",
													"source": "Primary order",
													"media": {
													   "url": "https://irentout.com/assets/images/slider/5.png",
													   "filename": "IROHOME"
													},
													"templateParams": templateParams,
													"attributes": {
													  "InvoiceNo": "1234"
													}
												}
												logger.info({
													message: `/verifyRazorPayPrimary primaryorder: Sending whatsapp message: order#: ${orderDetails.order_id}, mobile:${mobileNumber}`,
													dateTime: new Date()
												});
												requestify.post(`https://backend.aisensy.com/campaign/t1/api`, template);
											});
							
							
											logger.info({
												message: `/verifyRazorPayPrimary primaryorder: whatsapp message sent: order#: ${orderDetails.order_id}`,
												dateTime: new Date()
											});
							
											requestify.get(`${constants.apiUrl}forgotpassword/getEmailTemplates/${emailTemplate.templateNo}`).then(function(templateRsponse) {
												
												let template = templateRsponse.getBody()[0];
												requestify.post(`${constants.apiUrl}forgotpassword/${emailTemplate.templateUrl}`, {
													email: orderDetails.email,
													template: template,
													orderNo: orderDetails.order_id,
													orderDate: orderDetails.createdAt,
													orderValue: orderDetails.grandTotal,
													paidAmount:paidAmount,
													balanceAmount:balanceAmount,
													paymentStatus: 'Success',
													orderType:orderDetails.orderType_id
												});
											});
							
										});
									}
								});

								
							} else {
								res.send({message: err});
							}
							}
						);			
						
						if(req.body.selectedMode!='COD'){
							sql.query(invoiceInsert,
								[
								'N/A',
								req.body.orderId,
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
						}
						
			
						
					}

				});
			
			
			// res.redirect(url.format({
			// 	pathname: `${constants.frontendUrl}/order-success`,
			// 	query: {
			// 	   "transID": req.body.orderId,
			// 	 }
			// }));
		});
	 }
	 res.send(response);	 
});

router.post('/verifyRazorPayRenewal', (req, res) =>{

	let body=req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
   
	var crypto = require("crypto");
	var expectedSignature = crypto.createHmac('sha256', config.razorPaySecret)
									 .update(body.toString())
									 .digest('hex');
									 console.log("sig received " ,req.body.razorpay_signature);
									 console.log("sig generated " ,expectedSignature);
	 var response = {"signatureIsValid":"false"};
	 if(expectedSignature === req.body.razorpay_signature){		
		response={"signatureIsValid":"true"}
		requestify.request(`https://api.razorpay.com/v1/payments/${req.body.razorpay_payment_id}`, {
			method: 'GET',
			auth: {
				username: config.razorKeyId,
				password: config.razorPaySecret
			},
			dataType: 'json'		
		})
		.then(function(response) {
			// get the response body
			const razorPayResponse = response.getBody();
			var amount = razorPayResponse.amount.toString();
			if(razorPayResponse.status=='authorized'){
				status=1;
			} else{
				status=3;
			}

			var invoiceInsert = "INSERT INTO `invoice`(`invoice_id`, `order_id`, `invoice_description`, `status`) VALUES (?,?,?,?)";
			var sqlInsert = "INSERT INTO `transaction`(`transaction_id`, `order_id`,`order_amount`, `status`, `type`,`transaction_source`,`transaction_msg`, `createdAt`) VALUES (?,?,?,?,?,?,?,?)";  
			sql.query(sqlInsert,
				[
					razorPayResponse.id,
					req.body.orderId,
					amount.slice(0,-2),
					status,
					razorPayResponse.method,
					'RazorPay',
					razorPayResponse.order_id,
					new Date()
				],
				(err1) => {
				if (!err1) {
					logger.info({
						message: `/renewalsResult cashfree posted successfully to transaction table with transaction#: ${req.body.referenceId}`,
						dateTime: new Date()
					});
					// var updateOrder = `UPDATE orders SET paymentStatus = ? where order_id= ?`;
					// sql.query(updateOrder,
					// [
					// 	status,
					// 	req.body.orderId,
					// ]);
					var updateOrder = `UPDATE orders SET paymentStatus = ?, paidamount=(SELECT * FROM(SELECT paidAmount from orders WHERE order_id=${JSON.stringify(req.body.orderId)}) AS t)+${amount.slice(0,-2)} where order_id= ?`;
					sql.query(updateOrder,
					[
						status,
						req.body.orderId,
					]);
				} else {
					res.send({message: err});
				}
				}
			);

			sql.query(invoiceInsert,
				[
				'N/A',
				req.body.orderId,
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
				requestify.get(`${constants.apiUrl}orders/getOrderByMyOrderIdAPI/${req.body.orderId}`).then(async function(response) {
					// Get the response body
					orderDetails = await response.getBody()[0];	

					var updateRenewStatus=`UPDATE order_renewals SET is_renewed=1, modified_at=now(), modified_by=${orderDetails.customer_id}, comments='renewalsResult' WHERE order_item_id=? AND is_renewed=0`;
					orderDetails.orderItem.forEach((resOIT)=>{
						sql.query(updateRenewStatus,
							[
								resOIT.primary_order_item_id
							]);
					});
					
					let template = {
						"apiKey": constants.whatsappAPIKey,
						"campaignName": "Renewal Order Success",
						"destination": orderDetails.mobile,
						"userName": "IRENTOUT",
						"source": "Renewal Order Success",
						"media": {
						   "url": "https://irentout.com/assets/images/slider/5.png",
						   "filename": "IROHOME"
						},
						"templateParams": [
							orderDetails.firstName+' '+orderDetails.lastName,  orderDetails.order_id,JSON.stringify(orderDetails.grandTotal)
						],
						"attributes": {
						  "InvoiceNo": "1234"
						}
					}
	
					requestify.post(`https://backend.aisensy.com/campaign/t1/api`, template);
					
					requestify.post(`${constants.apiUrl}smsOrder`, {
						customerName: orderDetails.firstName, mobile:orderDetails.mobile, orderId:req.body.orderId
					});
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
							console.log(productsArr);
							console.log(prodAll)
							console.log(oid);
							updateFields(productsArr, prodAll,oid);
							resolve('cid success');
							
						});

						requestify.get(`${constants.apiUrl}forgotpassword/getEmailTemplates/2`).then(function(templateRsponse) {
					
							let template = templateRsponse.getBody()[0]
							requestify.post(`${constants.apiUrl}forgotpassword/send`, {
								email: orderDetails.email,
								template: template,
								orderNo: req.body.orderId,
								orderDate: orderDetails.createdAt,
								orderValue: orderDetails.grandTotal,
								paymentStatus: 'Success',
								orderType:orderDetails.orderType_id
							});
						});
						
					});			
				});
			});

			
			cid.then((success)=>{
				logger.info({
					message: '/renewalsResult transaction successfully',
					dateTime: new Date()
				});
				// res.redirect(url.format({
				// 	pathname: `${constants.frontendUrl}/order-success`,
				// 	query: {
				// 	   "transID": req.body.orderId,
				// 	 }
				// }));
			});
			
			
			
			
			// res.redirect(url.format({
			// 	pathname: `${constants.frontendUrl}/order-success`,
			// 	query: {
			// 	   "transID": req.body.orderId,
			// 	 }
			// }));
		});
	 }
	 res.send(response);	 
});

router.get('/razorPay/:id', function(req, res) {
	requestify.request(`https://api.razorpay.com/v1/payments/${req.params.id}`, {
		method: 'GET',
		auth: {
			username: config.razorKeyId,
			password: config.razorPaySecret
		},
		dataType: 'json'		
	})
	.then(function(response) {
		// get the response body
		response.getBody();
		res.json(response.getBody())
	});

});

module.exports = router