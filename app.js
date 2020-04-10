const express = require("express");
const bodyParser = require("body-parser");
const SHA256 = require("crypto-js/sha256");
const CryptoJS = require("crypto-js");

/////////////////////////////////////////MONGO DB///////////////////////////////////////
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

//connect to MongoDB
const connect = async function (client) {
  await client.connect();
  console.log("Connected correctly to server");
};

//we want to see if this user is a valid candidate vote before adding him into second table
const findDocuments = async function (db, id, collectionId) {
  // Get the documents collection
  const collection = db.collection(collectionId);
  // Find document
  const doc = await collection.findOne({ _id: id });
  console.log(doc, "query outcome in 'Voters'");
  return doc;
};

//insert
const insertOne = async function (db, data, collectionId) {
  // Get the documents collection
  const collection = db.collection(collectionId);
  // Insert some documents
  let r = await collection.insertOne(data);
  return r;
};
////////////////////////////////////////MONGO DB////////////////////////////////////////////

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
app.post("/", async function (req, res) {
  //if password ！= repassword return fail
  if (req.body.password != req.body.repassword) {
    res.redirect("/fail");
  } else {
    let sinNumber = Number(req.body.sinNumber);
    let name = req.body.name;
    let password = req.body.password;
    let eth = req.body.ethNumber;
    //hash for db1
    let hashDB1 = SHA256(password).toString(CryptoJS.enc.Base64);
    //hash(id+name+passward)
    let hashString = sinNumber + name + password;
    // Hash for db2
    let hashDB2 = SHA256(hashString).toString(CryptoJS.enc.Base64);
    //MongoDB successfully connected
    await connect(client);
    const db = client.db(dbName);
    let docInVoters = await findDocuments(db, sinNumber, "voters");
    console.log(docInVoters);
    console.log(typeof docInVoters);
    //if there is no record in 'Voters'
    if (docInVoters === null) {
      // Close connection
      client.close();
      res.redirect("/fail");
    }
    //query db1
    let docInVoterdb1 = await findDocuments(db, sinNumber, "db1");
    //if already registered
    if (docInVoterdb1 != null) {
      // Close connection
      console.log("User exist in db1");
      client.close();
      res.redirect("/fail");
    } else {
      let data1 = {
        _id: sinNumber,
        name: name,
        hash: hashDB1,
      };
      insertOne(db, data1, "db1").then(r => console.log(r.ops,"ciasnvganicwvhiegashfclnwhcfagiuhbcnialhufasuhcfalsn"));
      
      let data2 = {
        _id: hashDB2,
        eth: eth,
      };
      insertOne(db, data2, "db2");
      client.close();
      res.redirect("/success");
    }
  }
});

app.get("/voters", function (req, res) {});

app.listen(3000, () =>
  console.log(`App is listening at http://localhost:3000`)
);
