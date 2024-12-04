const sqlite = require('sqlite3').verbose();
const path = require('path');
// Define the path to the SQLite database
const dbPath = path.join(__dirname, 'database.db');

// Create the SQLite database instance
const db = new sqlite.Database(dbPath, (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
    } else {
        console.log('\x1b[32mConnected to database successfully!\x1b[0m');
    }
});

// Function to ensure the users table exists
function dbConnection() {
    // Create the 'users' table if it doesn't already exist
    const userTableSql = `CREATE TABLE IF NOT EXISTS users (username TEXT , nationalCode TEXT PRIMARY KEY , password TEXT)`;
    db.run(userTableSql, (err) => {
        if (err) {
            console.error("Error creating the table:", err.message);
        } else {
            console.log("\x1b[32mUsers table ensured.\x1b[0m");
        }
    });
}

// Export the db instance and dbConnection function
module.exports = { db, dbConnection };
