const express = require("express");
const bodyParser = require("body-parser");
const SHA256 = require("crypto-js/sha256");
const CryptoJS = require("crypto-js");

//init app
const app = express();

//init mongodb
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
// Connection URL
const url = "mongodb://localhost:27017";
// Database Name
const dbName = "govDB";
// Create a new MongoClient
const client = new MongoClient(url);
//we want to see if this user is a valid candidate vote before adding him into second table
const findDocuments = function (db, id, callback) {
  // Get the documents collection
  const collection = db.collection("voters");
  // Find some documents
  collection.find({ _id: id }).toArray(function (err, docs) {
    //assert.equal(err, null);
    console.log("Found the following records in Voters");
    console.log(docs);
    callback(docs);
  });
};
//检查是否已经注册在db1
const findDocumentsIndb1 = function (db, id, callback) {
  // Get the documents collection
  const collection = db.collection("db1");
  // Find some documents
  collection.find({ _id: id }).toArray(function (err, docs) {
    //assert.equal(err, null);
    console.log("Found the following records in DB1");
    console.log(docs);
    callback(docs);
  });
};
//如果通过db1的检测，直接insert to db2
const insertOneTodb2 = function (db, hash, eth, callback) {
  // Get the documents collection
  const collection = db.collection("db2");
  // Insert some documents
  collection.insertOne(
    {
      _id: hash,
      eth: eth,
    },
    function (err, result) {
      assert.equal(err, null);
      console.log("Successfully create one in db3");
      callback(result);
    }
  );
};
//css file
app.use(express.static(__dirname + "/public"));
//body parser
app.use(bodyParser.urlencoded({ extended: true }));

//home route
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
//register successfully
app.get("/success", function (req, res) {
  res.sendFile(__dirname + "/success.html");
});

//register fail
app.get("/fail", function (req, res) {
  res.sendFile(__dirname + "/fail.html");
});

//post
app.post("/", function (req, res) {
  //if password ！= repassword return fail
  if (req.body.password != req.body.repassword) {
    res.redirect("/fail");
  } else {
    let hash = SHA256(req.body.password).toString(CryptoJS.enc.Base64);
    console.log(hash);

    //turn string to number
    let sinNumber = Number(req.body.sinNumber);
    // Use connect method to connect to the mongodb Server and query
    client.connect(function (err) {
      assert.equal(null, err);
      console.log("Connected successfully to server");

      const db = client.db(dbName);
      let doc = "";
      //检查是否存在与政府网站
      findDocuments(db, sinNumber, function (docs) {
        doc = docs;

        if (doc.length != 0) {
          
          let doc1 = "";
          //检查是否已经注册于db1
          findDocumentsIndb1(db, sinNumber, function (docs1) {
            doc1 = docs1;
            //未注册，直接插入db2
            if (doc.length != 0) {
                //hash(id+name+passward)
              let hashString =
                req.body.sinNumber + req.body.name + req.body.password;
              let hash = SHA256(hashString).toString(CryptoJS.enc.Base64);
                //表单传参
              let eth = req.body.ethNumber;
              let doc2 = "";
              insertOneTodb2(db, hash, eth, function (docs2) {
                doc2 = docs2;
                console.log(doc2);
                res.redirect("/success");
                client.close();
              });
            } else {
              res.redirect("/fail");
              client.close();
            }
          });
        } else {
          res.redirect("/fail");
          client.close();
        }
      });
    });
  }
});

app.get("/voters", function (req, res) {});

app.listen(3000, () =>
  console.log(`App is listening at http://localhost:3000`)
);
