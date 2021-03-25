var express = require('express');
var router = express.Router();
var sql = require("../db.js");

router.get('/', function(req, res) {
    sql.query(
        `SELECT * FROM offers`,
        (err, rows) => {
          if (!err) {
            res.send(rows);
          } else {
            res.send({ error: 'Error' });
          }
        }
      );
  });

  module.exports = router;