var express = require('express');
var crypto = require("crypto");
var router = express.Router();
const url = require('url');  

var sql = require("../db.js");

router.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
  });


router.get('/', function(req, res) {
    var ord = JSON.stringify(Math.random()*1000);
	var i = ord.indexOf('.');
    ord = 'ORD'+ ord.substr(0,i);	
    res.render('checkout.html', {orderid:ord});
});

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
	var urlRedirect = `http://localhost:4200/${req.body.city}/failure`;
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
		urlRedirect = "http://localhost:4200/Bangalore/order-success";
	}
	
	// res.render('response.html', {key: key,salt: salt,txnid: txnid,amount: amount, productinfo: productinfo, 
	// firstname: firstname, email: email, mihpayid : mihpayid, status: status,resphash: resphash,msg:msg});
	
	res.redirect(url.format({
		pathname: urlRedirect,
		query: {
		   "transID": txnid,
		 }
		}));
});

router.post('/saveorder', function(req, res) {
	datetime = new Date();
	orderDate = this.datetime.getDate()+'/'+(this.datetime.getMonth()+1)+'/'+this.datetime.getFullYear();
	orderTime = this.datetime.getHours()+':'+this.datetime.getMinutes()+':'+this.datetime.getSeconds();

	orderDateTime=[this.orderDate, this.orderTime];
	orderdatetime=JSON.stringify(orderDateTime);

	var sqlInsert = "INSERT INTO `orders`(`userId`, `txnid`,`orderdate`, `amount`, `securitydeposit`, `checkoutItemData`, `pinfo`, `fname`, `lname`, `mobile`, `email`, `address`, `city`, `state`, `pincode`, `selfpickup`, `coupon`, `status`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";  
	sql.query(sqlInsert,
    [
      req.body.uid,
	  req.body.txnid,
	  orderdatetime,
      req.body.amount,
	  req.body.securityDeposit,
	  req.body.checkoutProductsInfo,
	  req.body.pinfo,
	  req.body.fname,
	  req.body.lname,
	  req.body.mobile,
	  req.body.email,
	  req.body.address,
	  req.body.town,
	  req.body.state,
	  req.body.pincode,
	  req.body.selfPickup,
	  'N/A',
	  'Initiated'
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

module.exports = router