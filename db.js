'user strict';

var mysql = require('mysql');

var mysqlConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  port: '3306',
  database: 'irentout'
});

mysqlConnection.connect((err) => {
  if(!err)
      console.log('DB Connected successfully');
  else
      console.log('Error in connection:\n'+ JSON.stringify(err,undefined,2));
});

module.exports = mysqlConnection;