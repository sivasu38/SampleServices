var express = require('express');
var app = express();
var envDetails = require('./routes/users.js');
var configDB = require('./config/dbconfig.js');
var r = require('rethinkdbdash')({servers : [{host:configDB.dbHost, port:configDB.dbPort}]});
var jsonResponseSuccesssMeta = "{meta : 200}";
var underscore = require('underscore');
var Q = require('q');

module.exports = app;

function midd(req,resp3,next){
    req.r = r;
    next();
}


app.get('/envlist',function(req,res){
  r.db('test').table('Environment').run().then(function (results) {
      res.json({Environment:results});
  });
});

app.get('/servicedetails/:env',function(req,res){
    console.log(req.params.env);
    r.db('test').table('EndPoints').filter({envName:req.params.env}).run().then (function(results)
    {
        res.json({EndPoints:results});
    });
});

app.get('/apidetails/:service',function(req,res){
    console.log(req.params.service);
    r.db('test').table('ApiNames').filter({serviceName:req.params.service}).run().then (function(results)
    {
        res.json({ApiNames:results});
    });
});

app.get('/dbdetails/:env',function(req,res){
    console.log(req.params.env);
    r.db('test').table('DataBase').filter({envName:req.params.env}).run().then (function(results)
    {
        res.json({DbDetails:results});
    });
});

app.get('/Urldetails/:env',function(req,res){
    console.log(req.params.env);
    r.db('test').table('Url').filter({envName:req.params.env}).run().then (function(results)
    {
        res.json({DbDetails:results});
    });
});


app.use('/servicedetails1',midd,envDetails);


app.get('/getAllDetails/:env',function(req,res){

    r.db('test').table('DataBase').filter({envName:req.params.env}).run().then (function (results,err) {
     if(err)
     {
         console.log(err);
     }
     else
     {
         r.db('test').table('EndPoints').filter({envName:req.params.env}).run().then (function (results1,err) {
             if (!err) {

                 var final = {};
                 final.Database = results;
                 final.EndPoints = results1;
                 res.json({Configuration:final});
             } else {
                 console.log(err);
             }
         });
     }
    });
});


app.get('/getPromise/:env',function(req,res) {

   getpromise(req,"DataBase").then(function(val)
   {
       getpromise(req,"EndPoints").then(function(val1)
       {
          console.log(val+val1);
       });
   });

});

app.get('/getapidetails/:env/:apiName', function (req,response) {
    var apiresults = {};
    var requestMethod;
    var serviceName;
    Q.allSettled([r.db('test').table('ApiNames').filter({apiName:req.params.apiName}).run(),
                  r.db('test').table('ApiNames').filter({apiName:req.params.apiName}).getField('serviceName'),
                  r.db('test').table('ApiNames').filter({apiName:req.params.apiName}).getField('requestmethod')])
                  .then(function(res,err) {
        if(!err)
        {
            console.log(res[0].value);
            apiresults.apiDetails=res[0].value;
            requestMethod=res[2].value;
            serviceName=res[1].value;
            if(requestMethod === "POST" || requestMethod === "PUT" || requestMethod === "DELETE")
            {
                Q.allSettled([r.db('test').table('EndPoints').filter({serviceName:serviceName}).without('id').run(),
                              r.db('test').table('FormDataJson').filter({apiName:req.params.apiName}).run()])
                              .then(function(res1,err1)
                {
                    if(!err1)
                    {
                        apiresults.endPointDetails=res1[0].value;
                        apiresults.payload=res1[1].value;
                        response.json({apiAllDetails:apiresults});
                    }
                    else
                    {
                        response.writeHead(500,"Not Found");
                        response.send("Something broken ..Please check"+err);
                    }
                });
            }
            else
            {
                r.db('test').table('EndPoints').filter({serviceName:serviceName.toString()}).without('id').run()
                    .then(function(res1,err1) {
                    if(!err1)
                    {
                        apiresults.endPointDetails=res1;
                        response.json({apiAllDetails:apiresults});
                    }
                    else
                    {
                        console.log(err);
                        response.writeHead(500,"Not Found");
                        response.send("Something broken ..Please check"+err);
                    }
                });
            }
        }
        else
        {
            response.writeHead(500,"Not Found");
            response.send("Something broken ..Please check"+err);
        }
    });

});

function getpromise(req,dbName) {

    var deferred = Q.defer();
    //return Q.fcall(function () {
    //    return 5;
    //});

    r.db('test').table(dbName).filter({envName:req.params.env}).run().then(function(res,err)
    {
        if(err)
            deferred.err(err);
        else
            deferred.resolve(res);
    });
    return deferred.promise;
}




//app.get("/",function(req,res)
//{
//  res.send("Hello World")
//});



app.listen(3000);


