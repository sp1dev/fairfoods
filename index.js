const express = require('express');
const body_parser = require('body-parser');
const mongodb = require('mongodb');
const path = require('path');

const PORT = 3000;
const app = express();
app.set('view engine', 'ejs');

app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'));

let db_handler;
const DB_URL = 'mongodb://localhost:27017';
const FAIRFOODS_DB = 'fairFoods';
const ORDER_COLLECTION = 'order';
const LOCATION_COLLECTION = 'location';
let order_message = 'none';
let order_obj = {};

app.listen(PORT, () => {
    console.log(`Fair Foods server started on port: ${PORT}`);

    let mongo_client = mongodb.MongoClient;
    mongo_client.connect(DB_URL, (err, db_client) => {
        if (err) {
            console.log(`Error: ${err}`);
        } else {
            console.log(`Connected to ${FAIRFOODS_DB} database.`);
            db_handler = db_client.db(FAIRFOODS_DB);
        }
    })
});

app.get('/', (req, res) => {
    db_handler.collection(LOCATION_COLLECTION).find({}).toArray((err, result) => {
        if (err) {
            res.send("Error retrieving locations.");
            console.log(`Error retrieving all documents from ${LOCATION_COLLECTION}`);
        } else {
            res.render('index', {
                'all_locations': result,
            });
        }
    });
});

app.post('/order', (req, res) => {
    const form_data = req.body;
    const fname = form_data['fname'];
    const lname = form_data['lname'];
    const pickup_date = form_data['pickup-date'];
    const num_of_bags = parseInt(form_data['num-of-bags']);
    const loc_name = form_data['loc-name'];

    order_obj = {
        fname: fname,
        lname: lname,
        pickup_date: pickup_date,
        num_of_bags: num_of_bags,
        loc_name: loc_name
    }

    db_handler.collection(ORDER_COLLECTION).insertOne(order_obj, (err, result) => {
        if (err) {
            console.log(`Error inserting the order: ${err}`);
            order_message = "fail";
        } else {
            console.log("Order entered successfully.")
            order_message = "success";
            res.redirect(`/view/:${loc_name}`, {
                'order_message': order_message,
                'order_obj': order_obj
            });
            
        }
    });
});

app.get('/allorders', (req, res) => {

    db_handler.collection(ORDER_COLLECTION).find({}).sort({pickup_date: -1}).toArray((err, result) => {
        if (err) {
            console.log(`Error retrieving orders: ${err}`);
        } else {
            res.render('allorders', {
                'all_orders': result
            });
        }
    });

});

app.get('/view/:loc_name', (req, res) => {
    const params = req.params;
    const loc_name = params["loc_name"];

    db_handler.collection(LOCATION_COLLECTION).findOne({ locName: loc_name }, (err, result) => {
        if (err) {
            res.send("Location not found.");
            console.log(`Error retrieving locName from ${LOCATION_COLLECTION}: ${err}`);
        } else {
            res.render('location', {
                'single_location': result,
                'order_message': order_message
            });
            console.log(result);
        }
    });
});


