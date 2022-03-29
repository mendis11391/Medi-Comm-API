const express = require('express');
const router = express.Router();
// const request = require('request');
const nodemailer = require('nodemailer');
const cors = require('cors');
var crypto = require("crypto");

var sql = require("../db.js");
const constants = require("../constant/constUrl");

router.options('/send', cors());

router.post('/send', cors(), (req, res) => {
    const emailId = req.body.email;
    const outputData = req.body.template;

    let transporter = nodemailer.createTransport({
        // host: 'mail.irentout.com',
        service: 'gmail',
        host:'smtp.gmail.com',
        port: 587, //Note: change to port:465 when website runs in https://irentout.com
        secure: true, //Note: may be true
        auth: {
            user: 'manjeshwar17@gmail.com',
            pass: 'timeisfast'
        }
    });

    let HelperOptions = {
        from: '"irentout.com"',
        to: emailId,
        subject: 'Irentout - Order Success',
        text: 'Hello',
        html: outputData
    };


    transporter.sendMail(HelperOptions, (error, info) => {
        if (error) {
            res.send({ message: 'Email sending failed', status: false, err: error });
        }
        else{
            res.send({ message: 'Email sending succedded', status: true })
        }                        
    });
});

/* GET all reviews */
router.get('/getEmailTemplates', function(req, res) {
    sql.query(
        `SELECT id, template_name, template, subject, status FROM email_template;`,
        (err, rows) => {
          if (!err) {
            res.send(rows[0]);
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