const express = require('express');
const router = express.Router();
// const request = require('request');
const nodemailer = require('nodemailer');
const cors = require('cors');

var sql = require("../db.js");

emailId: String;
token: String;

router.options('/send', cors());
router.post('/send', cors(), (req, res) => {
    const emailId = req.body.email;
    city = req.body.city;
    const query = `SELECT uid AS userId FROM users where email= '${emailId}' and logintype = 'web'`;

    sql.query(query,
        (err, rows) => {
            if (!err) {
                if (rows[0].userId) {
                    const outputData = `<p>Please click the below link to reset your password</p>
                <a href="http://localhost:4200/${city}/resetpassword/${rows[0].userId}">Click here</a>
            `;

                    let transporter = nodemailer.createTransport({
                        host: 'mail.irentout.com',
                        port: 587, //Note: change to port:465 when website runs in https://irentout.com
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
                        from: '"Manjesh" <passwordreset@irentout.com>',
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
module.exports = router;