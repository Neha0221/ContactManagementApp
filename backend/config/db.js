const {MongoClient}=require('mongodb');
require('dotenv').config();

const client=new MongoClient(process.env.MONGODB_URI);

let db;

const connectDB=async ()=>{
    client.connect();
    db=client.db();
}

const getDB=()=> db;

module.exports={connectDB,getDB};
 


