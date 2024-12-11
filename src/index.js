const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const session = require('express-session');
const bcrypt = require('bcrypt');
const collection = require('./config'); // Make sure your MongoDB collection is properly configured

const app = express();



// Initialize multer with the storage options
//var upload = multer({ storage: storage });
const upload = multer({ dest: 'uploads/' })

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public')); // Serve static files from the 'public' directory

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
    secret: 'yourSecretKey', // Session secret key
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.message= req.session.message;
    delete req.session.message;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.render('home');
});
app.get('/guest', (req, res) => {
    res.render('guest');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/uploads', (req, res) => {
    res.render('uploads');
});

app.get('/edit', (req, res) => {
    res.render('edit');
});

app.get('/notes', (req, res) => {
    res.render('notes');
});

app.get('/note_upload', (req, res) => {
    res.render('note_upload');
});

// Personal Profile Route (Ensure user is logged in before showing profile)
app.get('/personal_profile', (req, res) => {
    console.log('Session in /personal_profile:', req.session);  // Debugging session

    if (!req.session.user) {
        return res.redirect('/login'); // Redirect if no user session found
    }

    const name = req.session.user.name; // Extract user name from session
    res.render('personal_profile', { name }); // Render personal profile with name
});

// Sign-up Route
app.post('/signup', async (req, res) => {
    try {
        const { name, department, intake, section, email, phone, password, retypePassword } = req.body;

        if (password !== retypePassword) {
            return res.status(400).send("Passwords do not match!");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const data = {
            name,
            department,
            intake,
            section,
            email,
            phone,
            password: hashedPassword
        };

        // Check if user already exists
        const existingUser = await collection.findOne({ email: data.email });
        if (existingUser) {
            return res.send("User already exists. Try another email");
        }

        // Insert user into the database (insertOne instead of insertMany for a single user)
        const userdata = await collection.insertMany(data); // Corrected to insertOne()
        console.log(userdata);

        res.redirect("/login");

    } catch (error) {
        console.error(error);
        res.status(500).send("Error occurred during signup");
    }
});

// Login Route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await collection.findOne({ email });
        
        if (!user) {
            return res.send('Invalid email or password.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.send('Invalid email or password.');
        }

        // Set user session after login
        req.session.user = { id: user._id.toString(), name: user.name }; 
        console.log('Session after login:', req.session); // Debugging session

        return res.redirect('/personal_profile'); // Redirect to personal profile
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server error.');
    }
});

// Edit Profile Route (Fetch user data from MongoDB)
app.get('/edit', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const userId = new ObjectId(req.session.user.id);
        const user = await collection.findOne({ _id: userId });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Send each field as an individual variable
        res.render('edit', { 
            name: user.name,
            department: user.department,
            intake: user.intake,
            section: user.section,
            email: user.email,
            phone: user.phone 
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.post('/save', async (req, res) => {
    try {
        const { name, department, intake, section, email, phone, password, retypePassword } = req.body;

        if (password && password !== retypePassword) {
            return res.status(400).send('Passwords do not match!');
        }

        const updatedData = {
            name,
            department,
            intake,
            section,
            email,
            phone,
        };

        // If a new password is provided, hash and update it
        if (password) {
            updatedData.password = await bcrypt.hash(password, 10);
        }

        // Update the user data in the database
        await collection.updateOne(
            { _id: req.session.user.id },
            { $set: updatedData }
        );

        // Update the session information if the name or email changes
        req.session.user.name = name;

        res.redirect('/personal_profile'); // Redirect to personal profile
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating user information.');
    }
});

app.get('/notes', (req, res) => {
    const uploadsDir = path.join(__dirname, '/uploads/');

    // Read all files in the uploads folder
    fs.readdir(uploadsDir, (err, file) => {
        if (err) {
            console.error('Error reading uploads folder:', err);
            return res.status(500).send('Could not retrieve files.');
        }

        // Send file names to the EJS template
        res.render('notes', { files:file });
    });
});

  app.post('/note_upload', upload.single('notefile'), function (req, res, next) {
    res.render('uploads');
  })

// Server Configuration
const port = 5000;
app.listen(port, () => {
    console.log(`Server running on Port: ${port}`);
});
