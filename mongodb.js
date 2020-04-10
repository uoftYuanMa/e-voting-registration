

exports.mongoDB = function(){

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'govDB';


// Create a new MongoClient
const client = new MongoClient(url);

// Use connect method to connect to the Server
client.connect(function(err) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

  const db = client.db(dbName);
  findDocuments(db, function() {
    client.close();
  });
  
});


  const insertDocuments = function(db, callback) {
    // Get the documents collection
    const collection = db.collection('validVoters');
    // Insert some documents
    collection.insertOne(
      {id : 1,}, function(err, result) {
      assert.equal(err, null); 
      console.log("Inserted 1 valid voter");
      callback(result);
    });
  }
}