
const { MongoClient } = require("mongodb");
const crypto = require("crypto");

const uri = "mongodb+srv://comp263:c4paJkdsceytNEbr@lab2cluster.yub3wro.mongodb.net/";

const client = new MongoClient(uri);

const baseObjects = Array.from({ length: 10 }, (_, i) => i + 1).map(id => ({
    id,
    sensorId: "S" + id,
    reading: Math.floor(Math.random() * 100),
    timestamp: new Date(Date.now() + id * 1000).toISOString(),
    notes: "Record for sensor " + id,
}));

const metadata = {
    author: "Pavan Sriram Kodati",
    last_sync: new Date().toISOString(),
    uuid_source: crypto.randomUUID()
};

const preparedObjects = baseObjects.map(obj => ({
    ...obj,
    timestamp: new Date(obj.timestamp).toISOString(),
    metadata
}));

async function main() {
    try {
        await client.connect();
        console.log("Connected to MongoDB Atlas");

        const db = client.db("Lab2");
        const collection = db.collection("Agriculture");

        await preparedObjects.reduce(
            (p, obj) => p.then(() => collection.insertOne(obj)),
            Promise.resolve()
        );

        const count = await collection.countDocuments();
        console.log(`Inserted documents: ${count}`);

        if (count === 10) console.log("Exactly 10 documents inserted with metadata and UTC timestamps!");
        const sample = await collection.findOne({});
        console.log("Sample document:", sample);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.close();
    }
}

main();
