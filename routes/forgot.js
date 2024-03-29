const express = require('express');
const router = express.Router();
// const request = require('request');
const nodemailer = require('nodemailer');
const cors = require('cors');
var crypto = require("crypto");
var requestify = require('requestify'); 
var sql = require("../db.js");
const constants = require("../constant/constUrl");
const config = require('../config.json');

router.options('/send', cors());

router.post('/send', cors(), (req, res) => {
    const emailId = [];
    // config.emails.forEach((configEmails)=>{
    //     emailId.push(configEmails);
    // });
    emailId.push(req.body.email);
    var outputData = req.body.template.template;

    var subjectData = req.body.template.subject;

    subjectData = subjectData.replace("{orderNo}", req.body.orderNo);

    let orderDate = new Date(req.body.orderDate);

    outputData = outputData.replace("{orderNo}", req.body.orderNo);
    outputData = outputData.replace("{orderValue}", req.body.orderValue);
    outputData = outputData.replace("{orderDate}", orderDate.getDate() +"-"+(orderDate.getMonth()+1)+"-"+orderDate.getFullYear());
    outputData = outputData.replace("{paymentStatus}", req.body.paymentStatus);

    let transporter = nodemailer.createTransport({
        // host: 'mail.irentout.com',
        service: 'Microsoft 365',
        host:'smtp.office365.com',
        port: 587, //Note: change to port:465 when website runs in https://irentout.com
        secure: false, //Note: may be true
        requireTLC:true,
        auth: {
            user: 'support@irentout.com',
            pass: 'Rent@421'
        }
    });

    let HelperOptions = {
        from: '"Irentout" <support@irentout.com>',
        to: emailId, 
        subject: subjectData,
        text: 'Hello',
        html: outputData
    };


    transporter.sendMail(HelperOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send({ message: 'Email sending failed', status: false, err: error });
        }
        else{
            res.send({ message: 'Email sending succedded', status: true })
        }                        
    });
});

router.post('/pod', cors(), (req, res) => {
    const emailId = [];
    // config.emails.forEach((configEmails)=>{
    //     emailId.push(configEmails);
    // });
    emailId.push(req.body.email);
    var outputData = req.body.template.template;

    var subjectData = req.body.template.subject;

    subjectData = subjectData.replace("{orderNo}", req.body.orderNo);

    let orderDate = new Date(req.body.orderDate);

    outputData = outputData.replace("{orderNo}", req.body.orderNo);
    outputData = outputData.replace("{orderValue}", req.body.orderValue);
    outputData = outputData.replace("{orderDate}", orderDate.getDate() +"-"+(orderDate.getMonth()+1)+"-"+orderDate.getFullYear());
    outputData = outputData.replace("{paidAmount}", req.body.paidAmount);
    outputData = outputData.replace("{balanceAmount}", req.body.balanceAmount);

    let transporter = nodemailer.createTransport({
        // host: 'mail.irentout.com',
        service: 'Microsoft',
        host:'smtp.office365.com',
        port: 587, //Note: change to port:465 when website runs in https://irentout.com
        secure: false, //Note: may be true        
        requireTLC:true,
        auth: {
            user: 'support@irentout.com',
            pass: 'Rent@421'
        }
    });

    let HelperOptions = {
        from: '"Irentout" <support@irentout.com>',
        to: emailId, 
        subject: subjectData,
        text: 'Hello',
        html: outputData
    };


    transporter.sendMail(HelperOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send({ message: 'Email sending failed', status: false, err: error });
        }
        else{
            res.send({ message: 'Email sending succedded', status: true })
        }                        
    });
});

router.post('/notifyMailReturnOrder', cors(), (req, res) => {
  const emailId = req.body.email;
  requestify.get(`${constants.apiUrl}forgotpassword/getEmailTemplates/4`).then(function(templateRsponse) {
					
    let template = templateRsponse.getBody()[0];
    var outputData = template.template;

    var subjectData = template.subject;

    subjectData = subjectData.replace("{orderNo}", req.body.orderID);
    // let orderDate = new Date();

    // let ReturnedDate = new Date(req.body.returnDate);

    outputData = outputData.replace("{orderNo}", req.body.orderID);
    outputData = outputData.replace("{securityDeposit}", req.body.actualSecurityDeposit);
    // outputData = outputData.replace("{productName}", req.body.products);
    outputData = outputData.replace("{deductions}", req.body.subTotal);
    outputData = outputData.replace("{toBeRefunded}", req.body.currentRefundAmount);

    let transporter = nodemailer.createTransport({
        // host: 'mail.irentout.com',
        service: 'Microsoft',
        host:'smtp.office365.com',
        port: 587, //Note: change to port:465 when website runs in https://irentout.com
        secure: false, //Note: may be true        
        requireTLC:true,
        auth: {
            user: 'support@irentout.com',
            pass: 'Rent@421'
        }
    });

    let HelperOptions = {
        from: '"Irentout" <support@irentout.com>',
        to: emailId,
        subject: subjectData,
        text: 'Hello',
        html: outputData
    };


    transporter.sendMail(HelperOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send({ message: 'Email sending failed', status: false, err: error });
        }
        else{
            res.send({ message: 'Email sending succedded', status: true })
        }                        
    });
  });
  
});

router.post('/notifyMailReplaceOrder', cors(), (req, res) => {
  const emailId = req.body.email;
  requestify.get(`${constants.apiUrl}forgotpassword/getEmailTemplates/3`).then(function(templateRsponse) {
					
    let template = templateRsponse.getBody()[0];
    var outputData = template.template;
    var subjectData = template.subject;

    subjectData = subjectData.replace("{orderNo}", req.body.orderNo);
    // let orderDate = new Date();

    // let ReturnedDate = new Date(req.body.returnDate);

    outputData = outputData.replace("{orderNo}", req.body.orderNo);
    outputData = outputData.replace("{orderValue}", req.body.orderValue);
    // outputData = outputData.replace("{productName}", req.body.products);
    outputData = outputData.replace("{billPeriod}", req.body.billPeriod);
    outputData = outputData.replace("{subscription}", req.body.subscription);

    let transporter = nodemailer.createTransport({
        // host: 'mail.irentout.com',smtppro.zoho.com
        service: 'Microsoft',
        host:'smtp.office365.com',
        port: 587, //Note: change to port:465 when website runs in https://irentout.com
        secure: false, //Note: may be true
        requireTLC:true,
        auth: {
            user: 'support@irentout.com',
            pass: 'Rent@421'
        }
    });

    let HelperOptions = {
        from: '"Irentout" <support@irentout.com>',
        to: emailId,
        subject: subjectData,
        text: 'Hello',
        html: outputData
    };


    transporter.sendMail(HelperOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send({ message: 'Email sending failed', status: false, err: error });
        }
        else{
            res.send({ message: 'Email sending succedded', status: true })
        }                        
    });
  });
  
});

router.post('/rrRequest', cors(), (req, res) => {
  const emailId = req.body.email;
  var outputData = req.body.template.template;

  let product = JSON.parse(req.body.product);
  let requestDate = new Date();
  var currentOffset = requestDate.getTimezoneOffset();

  var ISTOffset = 330;   // IST offset UTC +5:30 

  var ISTTime = new Date(requestDate.getTime() + (ISTOffset + currentOffset)*60000);

    if(req.body.requestId==1){
        outputData = outputData.replace("{product}", product.prod_name);
        outputData = outputData.replace("{assetId}", product.assetId);
        outputData = outputData.replace("{requestedDate}", ISTTime.getDate() +"-"+(ISTTime.getMonth()+1)+"-"+ISTTime.getFullYear());
    } else{
        outputData = outputData.replace("{product}", product.prod_name);
        outputData = outputData.replace("{assetId}", product.assetId);
        outputData = outputData.replace("{requestedDate}", ISTTime.getDate() +"-"+(ISTTime.getMonth()+1)+"-"+ISTTime.getFullYear());
    }
  

  let transporter = nodemailer.createTransport({
      // host: 'mail.irentout.com',
      service: 'Microsoft',
      host:'smtp.office365.com',
      port: 587, //Note: change to port:465 when website runs in https://irentout.com
      secure: false, //Note: may be true
      requireTLC:true,
      auth: {
          user: 'support@irentout.com',
          pass: 'Rent@421'
      }
  });

  let HelperOptions = {
      from: '"Irentout" <support@irentout.com>',
      to: emailId,
      subject: req.body.template.subject,
      text: 'Irentout.com',
      html: outputData
  };


  transporter.sendMail(HelperOptions, (error, info) => {
      if (error) {
          console.log(error);
          res.send({ message: 'Email sending failed', status: false, err: error });
      }
      else{
          res.send({ message: 'Email sending succedded', status: true })
      }                        
  });
});

router.post('/depositRefundedMail', cors(), (req, res) => {
    const emailId = req.body.email;
    var outputData = req.body.template.template;
  
    let orderDate = new Date(req.body.orderDate);
  
    // outputData = outputData.replace("{orderNo}", req.body.orderNo);
  
    let transporter = nodemailer.createTransport({
        // host: 'mail.irentout.com',
        service: 'Microsoft',
        host:'smtp.office365.com',
        port: 587, //Note: change to port:465 when website runs in https://irentout.com
        secure: false, //Note: may be true
        requireTLC:true,
        auth: {
            user: 'support@irentout.com',
            pass: 'Rent@421'
        }
    });
  
    let HelperOptions = {
        from: '"Irentout" <support@irentout.com>',
        to: emailId,
        subject: 'Irentout - Request raised',
        text: 'Hello',
        html: outputData
    };
  
  
    transporter.sendMail(HelperOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send({ message: 'Email sending failed', status: false, err: error });
        }
        else{
            res.send({ message: 'Email sending succedded', status: true })
        }                        
    });
  });


router.post('/eKYCMail', cors(), (req, res) => {
  const emailId = req.body.email;
  var outputData = req.body.template.template;

  // let orderDate = new Date(req.body.orderDate);

  outputData = outputData.replace("{comments}", req.body.comments);

  let transporter = nodemailer.createTransport({
      // host: 'mail.irentout.com',
      service: 'Microsoft',
      host:'smtp.office365.com',
      port: 587, //Note: change to port:465 when website runs in https://irentout.com
      secure: false, //Note: may be true
      requireTLC:true,
      auth: {
          user: 'support@irentout.com',
          pass: 'Rent@421'
      }
  });

  let HelperOptions = {
      from: '"Irentout" <support@irentout.com>',
      to: emailId,
      subject: req.body.template.subject,
      text: 'Hello',
      html: outputData
  };


  transporter.sendMail(HelperOptions, (error, info) => {
      if (error) {
          console.log(error);
          res.send({ message: 'Email sending failed', status: false, err: error });
      }
      else{
          res.send({ message: 'Email sending succedded', status: true })
      }                        
  });
});

router.post('/renewalReminder', cors(), async (req, res) => {
    const emailId = req.body.email;
    var templateData = await requestify.get(`${constants.apiUrl}forgotpassword/getEmailTemplates/5`);  
    var template = JSON.parse(templateData.body);
    var outputData = template[0].template;
    let transporter = nodemailer.createTransport({
        // host: 'mail.irentout.com',
        service: 'Microsoft',
        host:'smtp.office365.com',
        port: 587, //Note: change to port:465 when website runs in https://irentout.com
        secure: false, //Note: may be true,
        requireTLC:true,
        auth: {
            user: 'support@irentout.com',
            pass: 'Rent@421'
        }
    });
  
    let HelperOptions = {
        from: '"Irentout" <support@irentout.com>',
        to: emailId,
        subject: `Irentout - Renewal reminder`,
        text: 'Hello',
        html: outputData
    };
  
  
    transporter.sendMail(HelperOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send({ message: 'Email sending failed', status: false, err: error });
        }
        else{
            res.send({ message: 'Email sending succedded', status: true })
        }                        
    });
});

router.post('/eKYCSubmitMail', cors(), (req, res) => {
    const emailId = 'support@irentout.com';
    var outputData = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
    <!--[if gte mso 9]>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
      <title></title>
      
      
    
    <!--[if !mso]><!--><link href="https://fonts.googleapis.com/css?family=Open+Sans:400,700&display=swap" rel="stylesheet" type="text/css"><link href="https://fonts.googleapis.com/css?family=Raleway:400,700&display=swap" rel="stylesheet" type="text/css"><!--<![endif]-->
    <style>
        table {
          font-family: arial, sans-serif;
          border-collapse: collapse;
          width: 100%;
        }
        
        td, th {
          border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;
        }
        
        tr:nth-child(even) {
          background-color: #dddddd;
        }
        </style>
    </head>
    
    <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #ffffff;color: #000000">
        <h2>eKYC submitted by Customer#: ${req.body.kycDetails.customer_id}</h2>
        <table>
            <tr>
              <th>Alternate Mobile no.</th>
              <th>Company</th>
              <th>occupation</th>
              <th>socialLink</th>
              <th>Aadhar No</th>
              <th>Address Type</th>
              <th>ref1 Name</th>
              <th>ref1 Relation</th>
              <th>ref1 Phone</th>
              <th>ref2 Name</th>
              <th>ref2 Relation</th>
              <th>ref2 Phone</th>
            </tr>
            <tr>
              <td>${req.body.kycDetails.alternateMobileNo}</td>
              <td>${req.body.kycDetails.company}</td>
              <td>${req.body.kycDetails.occupation}</td>
              <td>${req.body.kycDetails.socialLink}</td>
              <td>${req.body.kycDetails.aadharNo}</td>
              <td>${req.body.kycDetails.addressType}</td>
              <td>${req.body.kycDetails.ref1Name}</td>
              <td>${req.body.kycDetails.ref1Relation}</td>
              <td>${req.body.kycDetails.ref1Phone}</td>
              <td>${req.body.kycDetails.ref2Name}</td>
              <td>${req.body.kycDetails.ref2Relation}</td>
              <td>${req.body.kycDetails.ref2Phone}</td>
            </tr>
          </table>
    </body>
    
    </html>
    `;  
    

    var docs=[];
    var allDocs=[];
    docs=req.body.allImages;

    docs.forEach(element => {
        if(element.startsWith('JVB')){
            allDocs.push({path:'data:application/pdf;base64,'+element});
        } else{
            allDocs.push({path:'data:image/jpeg;base64,'+element});
        }
    });
    


    let transporter = nodemailer.createTransport({
        // host: 'mail.irentout.com',
        service: 'Microsoft',
        host:'smtp.office365.com',
        port: 587, //Note: change to port:465 when website runs in https://irentout.com
        secure: false, //Note: may be true
        requireTLC:true,
        auth: {
            user: 'support@irentout.com',
            pass: 'Rent@421'
        }
    });
  
    let HelperOptions = {
        from: '"Irentout" <support@irentout.com>',
        to: emailId,
        subject: `KYC submit Customer#: ${req.body.kycDetails.customer_id}`,
        text: 'Hello',
        html: outputData,
        attachments: allDocs
    };
  
  
    transporter.sendMail(HelperOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send({ message: 'Email sending failed', status: false, err: error });
        }
        else{
            res.send({ message: 'Email sending succedded', status: true })
        }                        
    });
});

/* GET all email templates */
router.get('/getEmailTemplates', function(req, res) {
    sql.query(
        `SELECT * FROM email_template`,
        (err, rows) => {
          if (!err) {
            res.send(rows);
          } else {
            res.send({ error: 'Error' });
          }
        }
    );
});

/* GET all email templates */
router.get('/getEmailTemplates/:id', function(req, res) {
    sql.query(
        `SELECT * FROM email_template where id = ${req.params.id}`,
        (err, rows) => {
          if (!err) {
            res.send(rows);
          } else {
            res.send({ error: 'Error' });
          }
        }
    );
});

router.get("/check/:enctime", function(req, res) {
    const tokenValue = req.params.enctime;
    const mykey = crypto.createDecipher('aes-128-cbc', 'irent@key*');
    var finalDecrptKey = mykey.update(tokenValue, 'hex', 'utf8');
    finalDecrptKey += mykey.final('utf8');
  
    const currentTime = new Date();
    const year = finalDecrptKey.slice(0, 4);
    let month = finalDecrptKey.slice(4, 6);
    month = parseInt(month);
    let date = finalDecrptKey.slice(6, 8);
    date = parseInt(date);
    const hours = parseInt(finalDecrptKey.slice(8, 10));
    const minutes = parseInt(finalDecrptKey.slice(10, 12));
    const sec = parseInt(finalDecrptKey.slice(12, 14));
    const tokenDate = `${year}-${month}-${date} ${hours}:${minutes}:${sec}`;
  
    const dbTime = new Date(tokenDate);
  
    const tokenDetail = {
        valid : false,
        time: ''
    };

    const minutesVal = isTimeValid(dbTime, currentTime);
  
    const hoursDycp = Math.floor(minutesVal / 60);  
    const minutesDycp = minutesVal % 60;
    const finalTime = (hoursDycp > 0) ? `${hoursDycp} Hour ${minutesDycp} Minutes` : `${minutesDycp} Minutes`;
  
    tokenDetail['valid'] = (isTimeValid(dbTime, currentTime) >= 10) ? false : true;
    tokenDetail['time'] = finalTime;
  
    res.send(tokenDetail);
  });
  
  function isTimeValid(tokenTime, currentTime) {
    let diff = (tokenTime.getTime() - currentTime.getTime()) / 1000;
    diff /= 60;
    return Math.abs(Math.round(diff));
  }


module.exports = router;