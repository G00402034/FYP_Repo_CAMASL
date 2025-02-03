import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

let client;
let clientPromise;
if (!process.env.MONGODB_URI) {
  throw new Error("Please add the correct Mongo URI to .env.local"); 
}

client = new MongoClient(uri);
clientPromise = client.connect(); 

export default clientPromise;
