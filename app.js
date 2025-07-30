const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Dynamic port for Render

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Route for /home
app.get('/home', (req, res) => {
    res.render('index', { title: 'Home Page' });
});

// Default route (redirect / to /home)
app.get('/', (req, res) => {
    res.redirect('/home');
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
