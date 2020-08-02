const express = require('express');
const router = express.Router();
// const request = require('request');
const nodemailer = require('nodemailer');
const cors = require('cors');
var crypto = require("crypto");

var sql = require("../db.js");

router.options('/send', cors());
router.post('/send', cors(), (req, res) => {
    const emailId = req.body.email;
    city = req.body.city;
    const query = `SELECT uid AS userId FROM users where email= '${emailId}' and logintype = 'web'`;

    const timeRef = new Date();
    const year = timeRef.getFullYear();
    let month = timeRef.getMonth();
    month = ("0" + (month + 1)).slice(-2);
    let curdate = timeRef.getDate();
    curdate = ("0" + (curdate)).slice(-2);
    let curhours = timeRef.getHours();
    curhours = ("0" + (curhours)).slice(-2);
    let curmin = timeRef.getMinutes();
    curmin = ("0" + (curmin)).slice(-2);
    let cursec = timeRef.getSeconds();
    cursec = ("0" + (cursec)).slice(-2);
    // const curmilsec = timeRef.getMilliseconds();

    const finalCurTime = `${year}${month}${curdate}${curhours}${curmin}${cursec}`;

    const encryptedTime = crypto.createCipher('aes-128-cbc', 'irent@key*');
    let finalEncrpt = encryptedTime.update(finalCurTime, 'utf8', 'hex')
    finalEncrpt += encryptedTime.final('hex');

    

    sql.query(query,
        (err, rows) => {
            if (!err) {
                if (rows[0].userId) {
                    const outputData = `<p>Please click the below link to reset your password</p>
                <a href="http://localhost:4200/${city}/resetpassword/${rows[0].userId}/${finalEncrpt}">Click here</a>
            `;

                    let transporter = nodemailer.createTransport({
                        host: 'mail.irentout.com',
                        port: 587, //Note: change to port:465 when website runs in https://localhost:4200
                        secure: false, //Note: may be true
                        auth: {
                            user: 'passwordreset@irentout.com',
                            pass: 'iro@fci123'
                        },
                        tls: {
                            rejectUnauthorized: false,
                            ignoreTLS: false,
                            requireTLS: true
                        }
                    });

                    let HelperOptions = {
                        from: '"Irentout" <passwordreset@irentout.com>',
                        to: emailId,
                        subject: 'Irentout - Reset Password link',
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
                   
                } else {
                    res.send({ message: `Email Id doesn't exist`, status: false });
                }
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
    const finalTime = hoursDycp + " Hour " + minutesDycp + " Minutes";
  
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