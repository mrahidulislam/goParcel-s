const express = require('express') //Server Setup
const cors = require('cors'); //Server Setup
const app = express()
require('dotenv').config();

// STRIPE ->
const stripe = require('stripe')(process.env.STRIPE_SECRET);


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 3000
const crypto = require("crypto");
const { send } = require('process');

function generateTrackingId() {
    const prefix = "PRCL";
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = crypto.randomBytes(3).toString("hex".toUpperCase());

    return `${prefix}-${date}-${random}`;
}

// MIDDLEWARE --> 

app.use(express.json()); //Server Setup
app.use(cors()); //Server Setup


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zrfyfih.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, { //Database Connection
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect(); //Database Connection


        const db = client.db('go_parcel_db'); //Database Connection
        const parcelsCollection = db.collection('parcels'); //Database Connection
        const paymentCollection = db.collection('payments'); //Database Connection


        // PARCEL API --------->
        app.get('/parcels', async (req, res) => {
            const query = {}
            const { email } = req.query;
            if (email) {
                query.senderEmail = email;
            }

            const options = { sort: { createdAt: -1 } }

            const cursor = parcelsCollection.find(query, options);
            const result = await cursor.toArray();
            res.send(result);

        })

        app.get('/parcels/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await parcelsCollection.findOne(query);
            res.send(result);
        })
        //Crete Parcel
        app.post('/parcels', async (req, res) => {
            const parcel = req.body;

            // PARCEL CREATED TIME -->
            parcel.createdAt = new Date();
            const result = await parcelsCollection.insertOne(parcel);
            res.send(result);
        })

        app.delete('/parcels/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const result = await parcelsCollection.deleteOne(query);
            res.send(result);
        })

        // PAYMENT RELATED API'S -->
        // CREATE NEW ->
        app.post('/payment-checkout-session', async (req, res) => {
            const paymentInfo = req.body;
            const amount = parseInt(paymentInfo.cost) * 100;
            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            unit_amount: amount,
                            product_data: {
                                name: `Please pay for: ${paymentInfo.parcelName}`
                            }
                        },
                        quantity: 1,
                    }
                ],
                mode: 'payment',
                metadata: {
                    parcelId: paymentInfo.parcelId
                },
                customer_email: paymentInfo.senderEmail,
                success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancelled`,
            })
            res.send({ url: session.url })
        })

        // OLD-->
        //Payment Related Code
        app.post('/create-checkout-session', async (req, res) => {
            const paymentInfo = req.body;
            const amount = parseInt(paymentInfo.cost) * 100;

            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency: 'USD',
                            unit_amount: amount,
                            product_data: {
                                name: paymentInfo.parcelName,
                            }

                        },
                        quantity: 1,
                    },
                ],
                customer_email: paymentInfo.senderEmail,
                mode: 'payment',
                metadata: {
                    parcelId: paymentInfo.parcelId,
                    parcelName: paymentInfo.parcelName
                },
                success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success`,
                cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancelled`,
            })

            console.log(session)
            res.send({ url: session.url })

        })

        // CHECK -->
        app.patch('/payment-success', async (req, res) => {
            const sessionId = req.query.session_id;
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            // console.log('Session Retrieve : ', session);

            const transactionId = session.payment_intent;
            const query = { transactionId: transactionId } 

            const paymentExists = await paymentCollection.findOne( query );
            console.log(paymentExists);

            if ( paymentExists ) {
                
                return res.send({ 
                    message: 'Already Exist', 
                    transactionId,
                    trackingId: paymentExists.trackingId
                })
            }

            const trackingId = generateTrackingId()

            if (session.payment_status === 'paid') {
                const id = session.metadata.parcelId;
                const query = { _id: new ObjectId(id) }
                const update = {
                    $set: {
                        paymentStatus: 'paid',
                        trackingId: trackingId
                    }
                }
                const result = await parcelsCollection.updateOne(query, update);

                const payment = {
                    amount: session.amount_total / 100,
                    currency: session.currency,
                    customerEmail: session.customer_email,
                    parcelId: session.metadata.parcelId,
                    parcelName: session.metadata.parcelName,
                    transactionId: session.payment_intent,
                    paymentStatus: session.payment_status,
                    paidAt: new Date(),
                    trackingId: trackingId
                    
                }

                if (session.payment_status === 'paid') {
                    const resultPayment = await paymentCollection.insertOne(payment);

                    res.send({ 
                        success: true, 
                        modifyParcel: result, 
                        trackingId: trackingId,
                        transactionId: session.payment_intent,
                        paymentInfo: resultPayment 
                    })
                }

            }

            res.send({ success: false })
        })

        // PAYMENT RELATED API'S -->
        app.get('/payments', async (req, res) => {
            const email = req.query.email;
            const query = {}
            if(email) {
                query.customerEmail = email
            }
            const cursor = paymentCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
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


app.get('/', (req, res) => {
    res.send('Go Parcel Is Parcel Parcel In The Whole World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
