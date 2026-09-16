// Go to mongodb website
// Create a free MB Cluster
// Create a user
// Get the connection string 
// Install Mongo DB compass
// https://mongodb.github.io/node-mongodb-native/7.6/classes/Collection.html // Official Documentation

const { MongoClient, ObjectId } = require('mongodb')

// Connection URL (from MongoDB Atlas)
const URL = "mongodb+srv://carinoharshit_db_user:K7KdvWLd6RKV53WB@namastenodejs.punvrpg.mongodb.net/?appName=NamasteNodejs"
const client = new MongoClient(URL)

// Database Name
const dbName = "HelloWorld"

async function main() {
    // Step 1: Connect to the MongoDB server
    await client.connect();
    console.log("Database connected successfully");

    // Step 2: Select the database
    const db = client.db(dbName);

    // Step 3: Select a collection (like a table)
    const collection = db.collection("User");

    // Now you can perform CRUD operations on this collection!
    const data = {
        firstname: "Harshit",
        lastname: "Singh",
        city: "Uttar Pradesh",
        phoneNumber: "2233445566",
    }

    const players = [
        { firstname: "Virat", lastname: "Kohli", city: "Delhi", phoneNumber: "1122334455" },
        { firstname: "Dhoni", lastname: "Singh", city: "Ranchi", phoneNumber: "5566778899" },
        { firstname: "Bumrah", lastname: "Jasprit", city: "Ahmedabad", phoneNumber: "6677889900" },
    ];

    // Insert a SINGLE document
    const insertData = await collection.insertOne(data)
    console.log("data inserted = ", insertData)
    // Output: { acknowledged: true, insertedId: ObjectId("64a...") }

    // Insert MULTIPLE documents
    const insertMany = await collection.insertMany(players);
    console.log("Inserted:", insertMany);
    // Output: { acknowledged: true, insertedCount: 3, insertedIds: { ... } }



    // Find ALL documents in the collection
    const allUsers = await collection.find({}).toArray();
    console.log("All data:", allUsers);
    // Output: [{ _id: ..., firstname: "Rohit", ... }, { ... }, ...]

    // Find ONE document by a specific field
    const oneUser = await collection.findOne({ firstname: "Virat" });
    console.log("Found:", oneUser);
    // Output: { _id: ..., firstname: "Virat", lastname: "Kohli", city: "Delhi", ... }

    // Find with a FILTER (multiple conditions)
    const mumbaiPlayers = await collection.find({ city: "Mumbai" }).toArray();
    console.log("Mumbai players:", mumbaiPlayers);



    // Update ONE document (find by _id, set new value)
    const updateResult = await collection.updateOne(
        { _id: new ObjectId("6aaae49aae30db745a4b1917") },  // Filter
        { $set: { firstname: "Nitesh" } }                   // Update
    );
    console.log("Updated:", updateResult);
    // Output: { matchedCount: 1, modifiedCount: 1, ... }

    // Update by field value (not just _id)
    const updateByCity = await collection.updateOne(
        { firstname: "Dhoni" },
        { $set: { city: "Chennai" } }
    );

    // Update MANY documents at once
    const updateAll = await collection.updateMany(
        { city: "Mumbai" },                   // Filter: all Mumbai players
        { $set: { team: "Mumbai Indians" } }  // Set team for all of them
    );
    console.log("Updated count:", updateAll.modifiedCount);



    // Delete ONE document by _id
    const deleteResult = await collection.deleteOne(
        { _id: new ObjectId("6aaae49aae30db745a4b1917") }
    );
    console.log("Deleted:", deleteResult);
    // Output: { acknowledged: true, deletedCount: 1 }

    // Delete by field value
    const deleteByName = await collection.deleteOne({ firstname: "Bumrah" });

    // Delete MANY documents
    const deleteMany = await collection.deleteMany({ city: "Delhi" });
    console.log("Deleted count:", deleteMany.deletedCount);

    // ⚠️ DELETE ALL documents in a collection (dangerous!)
    // const deleteAll = await collection.deleteMany({});



    // Count documents in a collection
    const count = await collection.countDocuments({});
    console.log("Total documents:", count);

    // Count with a filter
    const mumbaiCount = await collection.countDocuments({ city: "Mumbai" });
    console.log("Mumbai players:", mumbaiCount);

    // Example: Using cursor (for large datasets)
    const cursor = collection.find({}).limit(10);  // Get first 10
    await cursor.forEach(doc => console.log(doc));

    // Close cursor when done
    await cursor.close();

    return 'done'
}

main().then(console.log)
    .catch(console.error)
    .finally(() => client.close());
