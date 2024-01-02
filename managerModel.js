// Import the mongoose module to interact with MongoDB
const mongoose = require('mongoose');

// Define a schema for the Manager collection in MongoDB
const managerSchema = new mongoose.Schema({

  managerId: String,
  name: String,
  salary: Number,
});

// Create a model from the schema
// A model represents a collection in the database and allows us to interact with it
const Manager = mongoose.model('Manager', managerSchema);

// Export the Manager model
// This allows other files in our Node.js application to import the Manager model and interact with the Manager collection in MongoDB
module.exports = Manager;
