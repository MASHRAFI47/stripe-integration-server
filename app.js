const express = require("express");
const app = express();

require('dotenv').config();

const cors = require("cors");
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
            const brand = req.query.brand;
            const search = req.query.search;

            let query = {
                productName: { $regex: search, $options: 'i' }
            };
            if (brand) {
                query = { ...query, brand: brand };
            }

            const options = {}

            const result = await productsCollection.find(query, options).skip(itemsPerPage * currentPage).limit(itemsPerPage).toArray();
            res.send(result);
        })

        app.get("/products-count", async (req, res) => {
            const brand = req.query.brand;
            const search = req.query.search;

            let query = {
                productName: { $regex: search, $options: 'i' }
            };
            if (brand) {
                query = { ...query, brand: brand }
            }
            const count = await productsCollection.countDocuments(query);
            res.send({ count })
        })

        app.get("/product-details/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productsCollection.findOne(query);
            res.send(result)
        })

        app.post("/create-payment-intent", async (req, res) => {
            const price = req.body.price;
            const priceInCents = parseFloat(price) * 100;

            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: priceInCents,
                currency: "usd",
                // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

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