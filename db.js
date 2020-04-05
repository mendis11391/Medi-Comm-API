'user strict';

var mysql = require('mysql');
require('dotenv').config();

var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if(!err)
      console.log('DB Connected successfully');
  else
      console.log('Error in connection:\n'+ JSON.stringify(err,undefined,2));
});

module.exports = connection;
