var express = require('express');
var router = express.Router();

//var r = app.r;

/* GET users listing. */
router.get('/:env', function(req, res, next) {
    var r = req.r;
  r.db('test').table('EndPoints').filter({envName:req.params.env}).run().then (function(results) {
    if (err) {
      console.error("Something went wrong while fetching records : " + err);
    }
    else {
      res.json({EndPoints: results});
    }
  });
});



module.exports = router;
