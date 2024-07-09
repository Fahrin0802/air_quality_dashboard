const { MongoClient, ObjectId } = require('mongodb');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // const name = (req.query.name || (req.body && req.body.name));

    // Connection URL and Database Name
    const uri = "mongodb://air-quality-database-prod:B4Ba5ujoB3f391pbs9sjyL7GQsynr6Ucd3Pxb0Ghxcfw0pSrkcrazI7O58fswh4Bdz6Jjlpzd712ACDbbAOm2w==@air-quality-database-prod.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@air-quality-database-prod@";
    const dbName = "air-quality-database-prod";

    if (!uri || !dbName) {
        context.res = {
            status: 500,
            body: "MongoDB connection string or database name is not configured properly."
        };
        return;
    }

    let client;

    try {
        client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db(dbName);
        const collection = db.collection('ACA_STATION_AQHI'); // Replace with your collection name

        let document = await collection.findOne({_id: new ObjectId("667cd19b3959c4a97312965d")});

        if (document) {
            context.log(document);
            context.res = {
                status: 200,
                body: document
            };
        } else {
            context.res = {
                status: 404,
                body: "Document not found"
            };
        }

    } catch (err) {
        context.log.error("Error connecting to MongoDB", err);
        context.res = {
            status: 500,
            body: "Error connecting to MongoDB"
        };
    } finally {
        if (client) {
            client.close();
        }
    }
};
