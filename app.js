const express = require("express");
const app = express();

require('dotenv').config();

const cors = require("cors");
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iduz7rm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const productsCollection = client.db("findPeek").collection("products");

        app.get("/products", async (req, res) => {
            const itemsPerPage = parseInt(req.query.itemsPerPage);
            const currentPage = parseInt(req.query.currentPage) - 1;

            let query = {};
            const options = {}

            const result = await productsCollection.find(query, options).skip(itemsPerPage * currentPage).limit(itemsPerPage).toArray();
            res.send(result);
        })

        app.get("/products-count", async (req, res) => {
            const count = await productsCollection.countDocuments();
            res.send({ count })
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
    res.send("Server is running successfully");
})

module.exports = app;