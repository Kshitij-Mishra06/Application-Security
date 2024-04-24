const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware to parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware for session management
app.use(session({
    secret: 'mySecretKey', // Choose a strong secret key
    resave: false,
    saveUninitialized: true,
}));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Dummy passwords
const dummyPasswords = ["password123", "letmein", "123456", "qwerty", "admin"];

// Function to detect script tags
function containsScript(input) {
    return /<script[^>]*>.*<\/script>/i.test(input);
}

// Route for login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check for script tags in the password
    if (containsScript(password)) {
        res.status(400).send(`Script detected. Dummy passwords:\n${dummyPasswords.join("\n")}`);
        return;
    }

    req.session.username = username; // Store username in session
    res.redirect('/'); // Redirect to the homepage after successful login
});

// Order route with session token check
app.post('/order', (req, res) => {
    const { crust, size, toppings, session_token } = req.body;

    if (containsScript(session_token)) {
        res.status(400).send(`Script detected. Dummy passwords:\n${dummyPasswords.join("\n")}`);
        return;
    }

    if (!session_token) {
        res.status(401).send('Unauthorized: No session token provided');
        return;
    }

    // Order details with timestamp
    const orderDetails = {
        username: session_token,
        crust,
        size,
        toppings,
        timestamp: new Date().toISOString(),
    };

    saveOrder(orderDetails); // Save order to a database or file
    res.send('Order placed successfully!');
});

// Save order to a simple database (e.g., JSON file)
function saveOrder(orderDetails) {
    fs.readFile('db.json', (err, data) => {
        let orders = [];

        if (!err && data.length > 0) {
            orders = JSON.parse(data);
        }

        orders.push(orderDetails);

        fs.writeFile('db.json', JSON.stringify(orders, null, 2), err => {
            if (err) {
                console.error('Error writing to db.json:', err);
                return;
            }
            console.log('Order details saved successfully:', orderDetails);
        });
    });
}

// Serve the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve the HTML homepage
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

{/* <script> alert(); </script> */}