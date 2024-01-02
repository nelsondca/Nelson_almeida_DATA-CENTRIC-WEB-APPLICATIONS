const express = require('express');//framework for creating server
const mongoose = require('mongoose');// MongoDB interactions
const bodyParser = require('body-parser');//Parsing incoming request bodies
const path = require('path');//File path manipulations
const mySQL = require('./mySQL');// Importing a custom module for MySQL database operations

// Initialize the express application
const app = express();
const port = 3000; // Define the port number the server will listen on

// Middlewares to parse JSON and data
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

//Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/proj2023MongoDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,

});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define the Manager schema
const managerSchema = new mongoose.Schema({
  _id: String,
  name: String,
  salary: Number,
});

// Compile the model from the schema
const Manager = mongoose.model('Manager', managerSchema);


// Set the view engine for the application to use EJS templates
app.set('view engine', 'ejs');
// Set the views directory where the template files are located
app.set('views', path.join(__dirname, 'views'));

// MySQL route hadnlers
// Add this to handle GET requests to the root URL
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'home.html');
  res.sendFile(filePath);
});

app.get('/products/delete/:pid', async (req, res) => {
  const productId = req.params.pid;

  try {
    // Check if the product is sold in any store
    const isSold = await mySQL.checkIfProductIsSold(productId);

    if (isSold) {
      // If the product is sold, send an error message
      res.render('error', { message: `${productId} is currently in stores and cannot be deleted` });
    } else {
      // If the product is not sold, delete the product and redirect to the products page
      await mySQL.deleteProduct(productId);
      res.redirect('/products');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});


// Handler for the '/product' endpoint that retrieves product data from MySQL and renders it using EJS
app.get('/product', async (req, res) => {
  try {
    const products = await mySQL.getJoinedProductData(); // Replace with your actual function to execute the query
    res.render("product", { "products": products });
  } catch (error) {
    console.error('Error fetching product data:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

// Handler for the '/store' endpoint that retrieves store data from MySQL and renders it using EJS
app.get('/store', (req, res) => {
  mySQL.getStore()
    .then((data) => {
      res.render("store", { "store": data });
    })
    .catch((error) => res.send(error));
});

// Handler for the '/product_store' endpoint that retrieves product-store relationship data from MySQL and renders it using EJS
app.get('/product_store', (req, res) => {
  mySQL.getProduct_Store()
    .then((data) => {
      res.render("product_store", { "product_store": data });
    })
    .catch((error) => res.send(error));
});

// MongoDB route
app.get('/managers', async (req, res) => {
  try {
    const managers = await Manager.find({}).lean().exec();
    res.render('managers', { managers });
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});
//Route
app.get('/managers/add', (req, res) => {
  res.render('add');
});

app.post('/managers/add', async (req, res) => {
  const { managerId, name, salary } = req.body;
  // Perform your validation here
  if (managerId.length !== 4 || name.length <= 5 || salary < 30000 || salary > 70000) {
    // If validation fails, render the form again with error messages
    res.render('add', { error: "Validation failed." });
  } else {
    // If validation passes, create a new manager in the database
    const newManager = new Manager({ _id: managerId, name: name, salary: salary });
    try {
      await newManager.save();
      res.redirect('/managers'); // Redirect to the managers list page
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
});



// Update STORE information
app.get('/editStore', async (req, res) => {
  const storeId = req.query.storeId;

  try {
    // Fetch storeData using storeId
    const storeData = await mySQL.getStoreById(storeId);
    // Render the editStore.ejs template with storeData
    res.render('editStore', { storeData });
  } catch (error) {
    console.error('Error fetching store data:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

//Route to handle the addition of new store
app.post('/editStore/:storeId', async (req, res) => {
  const storeId = req.params.storeId;
  const newData = req.body.newData;

  try {
    await mySQL.updateStore(storeId, newData);
    res.status(200).send('Store updated successfully!');
  } catch (error) {
    console.error('Error updating store:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});
// Update STORE END

// ADD STORE START
app.get('/addStore', (req, res) => {
  res.render('addStore', { errorMessage: null });
});

app.post('/addStore', async (req, res) => {
  const sid = req.body.sid;
  const location = req.body.location;
  const mgrid = req.body.mgrid;

  try {
    // Check if the manager ID already exists in another store
    const managerExists = await mySQL.isManagerAlreadyInStore(mgrid);

    if (managerExists) {
      // Pass an error message to the template
      return res.render('addStore', { errorMessage: `Manager ${mgrid} is already managing another store.` });
    }

    // If manager does not exist in another store, proceed with adding the new store
    await mySQL.addStore(sid, location, mgrid);

    // Redirect back to the store page after adding a store
    res.redirect('/store');
  } catch (error) {
    console.error('Error adding store:', error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});
// ADD STORE END

//Start the server and listen on the defined port
app.listen(3000, () => {
  console.log('Listening on port 3000');
});