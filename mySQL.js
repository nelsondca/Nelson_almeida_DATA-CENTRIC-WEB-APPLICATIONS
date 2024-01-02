// Import the promise-mysql module which enables MySQL interactions with Promises
var pmysql = require('promise-mysql')
var pool;

// Create a connection pool to the MySQL database
pmysql.createPool({
    connectionLimit: 3, // Maximum number of connections in the pool
    host: 'localhost', // Database server host
    user: 'root', // Database user
    password: 'root', // Database password
    database: 'proj2023' // Database name

})
    .then((p) => {
        pool = p // Assign the created pool to the 'pool' variable
    })
    .catch((e) => {
        console.log("pool error:" + e) // Log any pool creation errors
    })

// Function to retrieve all products from the database
function getProduct() {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM product')// SQL query to select all products
            .then((data) => {
                resolve(data)// Resolve the promise with the query results
            })
            .catch(error => {
                reject(error)// Reject the promise if there's an error
            })
    })
}
// Define a function to retrieve joined product data from multiple related tables
function getJoinedProductData() {
    return new Promise((resolve, reject) => {
        // Perform a SQL query to join data from the 'product', 'product_store', and 'store' tables
        pool.query(`
        SELECT p.pid, p.productdesc, p.supplier, ps.sid, s.location, ps.Price
        FROM product p
        JOIN product_store ps ON p.pid = ps.pid
        JOIN store s ON ps.sid = s.sid;
      `, (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results);
        });
    });
}

//Function to retrieve all stores from the database
function getStore() {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM store')
            .then((data) => {
                resolve(data)
            })
            .catch(error => {
                reject(error)
            })
    })
}
// Function to retrieve all product-store relationships from the database
function getProduct_Store() {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM product_store')
            .then((data) => {
                resolve(data)
            })
            .catch(error => {
                reject(error)
            })
    })
}
// Function to retrieve a store by its ID
function getStoreById(storeId) {// SQL query with placeholder for store ID
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM store WHERE sid = ?', [storeId])
            .then((data) => {
                if (data.length > 0) {
                    resolve(data[0]); //Resolving with the first store assuming store_id is unique
                } else {
                    resolve(null); // Store not found
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}

// Function to update store information
function updateStore(storeId, newData) {
    return new Promise((resolve, reject) => {
        // Extract the location and mgrid values from newData
        const { location, mgrid } = newData;

        // Perform the update query with location and mgrid
        pool.query('UPDATE store SET location = ?, mgrid = ? WHERE sid = ?', [location, mgrid, storeId])
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                reject(error);
            });
    });
}
// Function to check if a manager is already assigned to a store
async function isManagerAlreadyInStore(mgrid) {
    try {
        const result = await pool.query('SELECT COUNT(*) AS count FROM store WHERE mgrid = ?', [mgrid]);
        return result[0].count > 0;
    } catch (error) {
        throw error;
    }
}
// Function to add a new store to the database
function addStore(sid, location, mgrid) {
    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO store (sid, location, mgrid) VALUES (?, ?, ?)', [sid, location, mgrid])
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

// Add this to your mySQL.js

function checkIfProductIsSold(productId) {
    return new Promise((resolve, reject) => {
        pool.query('SELECT COUNT(*) AS count FROM product_store WHERE pid = ?', [productId], (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results[0].count > 0);
        });
    });
}

function deleteProduct(productId) {
    return new Promise((resolve, reject) => {
        pool.query('DELETE FROM product WHERE pid = ?', [productId], (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results.affectedRows > 0);
        });
    });
}


// Export the functions for use in other modules
module.exports = { getProduct, getStore, getProduct_Store, updateStore, getStoreById, addStore, isManagerAlreadyInStore, getJoinedProductData, checkIfProductIsSold, deleteProduct }
