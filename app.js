const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { db, dbConnection } = require('./db/database.js');  // Assuming you have a valid dbConnection function
const session = require('express-session')
const app = express();

// Session setup
app.use(session({
    secret: 'mySession',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 60000 }  // Set to true if using HTTPS
}));

const mainFolderPath = path.join(__dirname, 'main');

const routes = require('./routes');
app.use(routes);  // This could be the cause of the error if 'routes' is not a middleware function

// Set views directory and view engine
app.set('views', path.join(__dirname, 'public', 'views'));  // Correct views path
app.set('view engine', 'ejs');  // Use EJS for templating

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));
// parsing all the data that we get from body
app.use(bodyParser.urlencoded({ extended: true }));

// Creating main folder if it doesn't exist
if (!fs.existsSync(mainFolderPath)) {
    fs.mkdirSync(mainFolderPath, { recursive: true });
    console.log("\x1b[32mMainFolder created\x1b[0m");
}

// Setting main folder read-only permission
exec(`icacls "${mainFolderPath}" /grant Everyone:R`, (err) => {
    if (err) {
        console.error("Failed to set main folder permissions", err.message);
    } else {
        console.log("\x1b[32mMain folder permissions set.\x1b[0m");
    }
});

// setting main folder as shared folder 
let shareName = 'Main';
let shareDescribtion = "This is availible for all";
const shareCommand = `net share ${shareName}="${mainFolderPath}" /grant:everyone,full /remark:"${shareDescribtion}"`
exec(shareCommand, (err, stdout, stderr) => {
    if (err) {
        console.error(`Error sharing Main folder : ${err.message}`);
    }
    if (stderr) {
        // Showing detailed system Error : (stderr)
        console.error(`stderr: ${stderr}`);
        return;
    }
    // Showing detailed success message : (stdout)
    // console.log(`stdout : ${stdout}`);
});


dbConnection(); // Initialize DB connection

// Function to fetch users
function getUsers(callback) {
    db.all(`SELECT * FROM users`, [], (err, rows) => {
        if (err) {
            console.error("Error fetching users:", err.message);
            callback(err, null);
        } else {
            // console.log(rows);
            callback(null, rows);
        }

        if (rows) {
            rows.forEach((row) => {
                const userFolderPath = path.join(mainFolderPath, row.username);

                // Check if the folder already exists
                if (!fs.existsSync(userFolderPath)) {
                    try {
                        fs.mkdirSync(userFolderPath, { recursive: true });
                        console.log(`\x1b[32mFolder created for user: ${row.username}\x1b[0m`);
                    } catch (err) {
                        console.error(`Error creating folder for ${row.username}:`, err.message);
                    }
                }

                const userAddCommand = `net user ${row.username} ${row.password} /add`;

                // Run the user creation command
                exec(userAddCommand, (err, stdout, stderr) => {
                    if (err) {
                        console.error(`Error creating user ${row.username}: ${stderr}`);
                    } else {
                        console.log(`\x1b[32mUser ${row.username} created successfully!\x1b[0m`);

                        // Now that the user is created, set the permissions for the folder
                        const icaclsCommand = `icacls "${userFolderPath}" /grant ${row.username}:(OI)(CI)M /deny ${row.username}:D /inheritance:r`;

                        // Run the icacls command to set folder permissions
                        exec(icaclsCommand, (err, stdout, stderr) => {
                            if (err) {
                                console.error(`Error setting permissions for ${row.username}: ${stderr}`);
                            } else {
                                console.log(`\x1b[32mPermissions set for ${row.username}\x1b[0m`);
                            }
                        });

                        // giving administrators group full countrol to users files
                        const adminControlCommand = `icacls "${userFolderPath}" /grant Administrators:F`;
                        exec(adminControlCommand, (error, stdout, stderror) => {
                            if (error) {
                                console.error(`Error setting permission to Administrators`);
                            }
                            else {
                                console.log(`\x1b[32mPersmissions set for Administrators group successfuly\x1b[0m`);
                            }
                        })
                    }
                });
            });
        }
    });
}


const port = 3000;
const ipAddress = '192.168.1.101';
// ! setting ip and the port of running app
app.listen(port, ipAddress, () => {
    // console.log(`App is running on http://localhost:${port}`);
    console.log(`\x1b[32mApp is running on http://${ipAddress}:${port}\x1b[0m`);
});


