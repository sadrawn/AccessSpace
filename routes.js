const express = require('express');
const router = express.Router();
// ! get routes 

// Main route
router.get('/', (req, res) => {
    getUsers((err, users) => {
        if (err) {
            res.render('index', { users: [] }); // Pass null if there's an error
        } else {
            res.render('index', { users }); // Pass the users list to the view
        }
    });
});

router.get('/adduser', (req, res) => {
    res.render("addUser");
});

router.get('/admin', (req, res) => {
    res.render('adminLogin');
})
router.get('admin/dashboard', (req, res) => {
    if (req.session.loggedIn == true) {
        res.render('admin', { users: [], message: '' });
    }
    else {
        res.render('adminLogin');
    }
})

// ! post routes 
router.post('/adduser', (req, res) => {
    let { username, password, id } = req.body;
    // console.log(username, password, id);

    // Insert the username into the 'users' table
    db.run(`INSERT INTO users (username , nationalCode , password) VALUES (?,?,?)`, [username, id, password], function (err) {
        if (err) {
            console.error("Error inserting data:", err.message);
            return res.status(500).send("Error inserting data");  // Send a response if there's an error
        }

        // After successful insertion, redirect to the home page
        res.redirect('/');
    });
});

const adminUser = "admin136";
const adminPass = "136admin";
router.post('/admin', (req, res) => {
    const { username, password } = req.body;
    if (username == adminUser && password == adminPass) {
        getUsers((err, users) => {
            if (err) {
                res.render('admin', { users: [], message: '' }); // Pass null if there's an error
            } else {
                req.session.loggedIn = true;
                res.render('admin', { users, message: '' }); // Pass the users list to the view
            }
        });
    }
    else {
        res.render('error');
    }
})

// removing user
router.post('/admin/remove/:id', (req, res) => {
    const { id } = req.params;
    const rmPath = path.join(mainFolderPath, id);
    const fileRemoveCommand = `rmdir /s /q "${rmPath}"`;  // Using rmdir for Windows
    db.get(`SELECT * FROM users WHERE username = ?`, [id], (err, row) => {
        if (err) {
            console.error(`Error getting user from db:`, err);
            return;
        }
        if (!row)
            console.log('User not found');
        const userRmCommand = `net user ${id} /delete`;
        // Removing the user
        exec(userRmCommand, (err) => {
            if (err) {
                console.error(`Error removing user: ${id}`, err);
                return res.status(500).json({ error: `Error removing user: ${id}` });
            }

            // Removing the user's folder
            exec(fileRemoveCommand, (err2) => {
                if (err2) {
                    console.error(`Error removing user ${id}'s folder`, err2);
                    return res.status(500).json({ error: `Error removing user ${id}'s folder` });
                }
                db.run(`DELETE FROM users WHERE username = ?`, [id], (err3) => {
                    if (err3) {
                        console.error(`Error removing user from db`);
                        return res.status(500).json({ error: `Error removing user from db` });
                    }
                });
                console.log(`User ${id} removed successfully`);
                req.session.message = `user ${id} removed successfuly`;
                res.redirect('/admin/dashboard');
            });
        });
    });
});

module.exports = router;