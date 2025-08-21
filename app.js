const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static assets from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for form submissions
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ---------------- ROUTES ---------------- //

// Home Page
app.get('/home', (req, res) => {
    res.render('index', {
        title: 'Home Page',
        metaDescription: 'Hoffman’s Reptile Shop - Exotic reptiles, snakes, and lizards in Concord, CA.',
        metaKeywords: 'reptiles, snakes, lizards, Concord reptile shop, exotic pets California'
    });
});

// Animals Page
app.get('/animals', (req, res) => {
    res.render('animals', {
        title: 'Animals',
        metaDescription: 'Browse our collection of exotic animals including reptiles, lizards, and snakes.',
        metaKeywords: 'animals, reptiles, exotic pets, lizards, snakes, Concord CA'
    });
});

// Lizards Page (the button on Animals page goes here)
app.get('/lizards', (req, res) => {
    res.render('lizards', {
        title: 'Lizards',
        metaDescription: 'Explore exotic lizards for sale including monitors and iguanas.',
        metaKeywords: 'lizards, monitor lizards, iguanas, Concord reptiles, California reptile shop'
    });
});

// Monitor Lizard Inventory Page (linked from /lizards)
app.get('/monitor_lizard_inventory', (req, res) => {
    res.render('monitor_lizard_inventory', {
        title: 'Monitor Lizard Inventory',
        metaDescription: 'Monitor lizard inventory including Asian water monitors and other species.',
        metaKeywords: 'monitor lizards, Asian water monitor, reptiles for sale Concord CA'
    });
});

// Asian Water Monitor Page (linked from /monitor_lizard_inventory)
app.get('/asian_water_monitor', (req, res) => {
    res.render('asian_water_monitor', {
        title: 'Asian Water Monitor',
        metaDescription: 'Asian Water Monitors available at Hoffman’s Reptile Shop in Concord, CA.',
        metaKeywords: 'Asian water monitor, monitor lizards, reptiles Concord California'
    });
});

// Gallery Page
app.get('/gallery', (req, res) => {
    res.render('mainGallery', {
        title: 'Gallery',
        metaDescription: 'Photo gallery of reptiles and exotic animals available at Hoffman’s Reptile Shop.',
        metaKeywords: 'reptile gallery, exotic animals, lizards, snakes, Concord CA'
    });
});

// About Page
app.get('/about', (req, res) => {
    res.render('about', {
        title: 'About Us',
        metaDescription: 'Learn about Hoffman’s Reptile Shop in Concord, California.',
        metaKeywords: 'about Hoffman’s Reptiles, Concord CA reptile shop, exotic pet store'
    });
});

// Contact Page
app.get('/contact', (req, res) => {
    res.render('contact', {
        title: 'Contact',
        metaDescription: 'Contact Hoffman’s Reptile Shop in Concord, CA for exotic reptiles and supplies.',
        metaKeywords: 'contact Hoffman’s Reptiles, Concord CA reptile shop, exotic pet store'
    });
});

// ---------------- CONTACT FORM EMAIL ROUTE ---------------- //
app.post('/send-email', async (req, res) => {
    const { name, email, message } = req.body;

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'hudsonriver4151@gmail.com',
            pass: 'hols yaqs wxdk nfyl'  // 16-character Google App Password
        }
    });

    try {
        // 1. Send email to YOU
        await transporter.sendMail({
            from: email,
            to: 'hudsonriver4151@gmail.com',
            subject: `Message from ${name}`,
            text: message,
            replyTo: email
        });

        // 2. Auto-reply back to customer
        await transporter.sendMail({
            from: 'hudsonriver4151@gmail.com',
            to: email,
            subject: "🐍 Thanks for contacting Hoffman's Reptile Shop!",
            html: `
                <div style="font-family: Arial, sans-serif; color:#333; padding:20px; background:#f9f9f9; border-radius:8px;">
                    <h2 style="color:#28a745;">Thank you for your interest, ${name || "Friend"}! 🦎</h2>
                    <p>We’ve received your message and will get back to you as soon as possible.</p>
                    <p><strong>📍 Address:</strong> 2359 Concord Blvd, Concord, CA 94520</p>
                    <p><strong>📞 Phone:</strong> (925) 761-9106</p>
                    <p><strong>🕒 Hours:</strong><br/>Mon–Fri: 12 PM – 6:30 PM<br/>Sat: 10 AM – 5 PM<br/>Sun: Closed</p>
                    <p>
                        <a href="tel:+19257619106" style="display:inline-block; margin:10px 5px; padding:12px 20px; background:#28a745; color:#fff; text-decoration:none; border-radius:5px;">
                            📞 Call Now
                        </a>
                        <a href="https://www.google.com/maps?q=2359+Concord+Blvd,+Concord,+CA+94520" target="_blank"
                           style="display:inline-block; margin:10px 5px; padding:12px 20px; background:#007bff; color:#fff; text-decoration:none; border-radius:5px;">
                            📍 View Map
                        </a>
                    </p>
                    <p>🐊 Thanks again for reaching out — we appreciate reptile lovers like you!</p>
                    <p>– Hoffman's Reptile Shop</p>
                </div>
            `
        });

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Email Sent</title>
                <meta http-equiv="refresh" content="10;url=/contact" />
                <style>
                    body { font-family: Arial, sans-serif; background:#f4f4f4; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
                    .message-box { background:#fff; padding:30px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.2); text-align:center; max-width:500px; }
                    h1 { color:#28a745; }
                </style>
            </head>
            <body>
                <div class="message-box">
                    <h1>✅ Your Email Has Been Sent!</h1>
                    <p>Thank you for your interest in Hoffman's Reptiles.</p>
                    <p>You will be redirected back to the Contact page in <strong>10 seconds</strong>.</p>
                </div>
            </body>
            </html>
        `);

    } catch (err) {
        console.error("EMAIL ERROR:", err);
        res.status(500).send("❌ Error sending message: " + err.message);
    }
});

// ---------------- DEFAULT & STATIC ---------------- //

// Default route redirects to /home
app.get('/', (req, res) => {
    res.redirect('/home');
});

// Serve sitemap.xml explicitly
app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

// Serve robots.txt explicitly
app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

// ---------------- START SERVER ---------------- //
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
