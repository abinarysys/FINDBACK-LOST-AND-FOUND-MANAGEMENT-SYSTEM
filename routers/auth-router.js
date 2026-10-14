const router = require('express').Router();
const crypto = require('crypto');
const db = require('../config/db.js');

// Middleware
const upload = require('../middleware/upload-middleware.js');

// Register page
router.get('/register', (req, res) => {
    res.render('register');
});

// Register user
router.post(
    '/registerUser',
    upload.single('pfp'),
    (req, res) => {
        const { name, email, pw, num } = req.body;

        if (!name || !email || !pw || !num) {
            return res.status(400).send(
                'Please complete all required fields.'
            );
        }

        const password = crypto
            .createHash('sha256')
            .update(pw)
            .digest('hex');

        const profileImage = req.file
            ? '/uploads/' + req.file.filename
            : null;

        const registerUser = `
            INSERT INTO users (
                full_name,
                email,
                password_hash,
                profile_image,
                contact_number
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            registerUser,
            [name, email, password, profileImage, num],
            (err, result) => {
                if (err) {
                    console.log('Registration failed:', err);

                    return res.status(500).send(
                        'Registration failed. Please try again.'
                    );
                }

                console.log('Registration successful');

                req.flash(
                    'success',
                    'Account registered successfully!'
                );

                return res.redirect('/auth/register');
            }
        );
    }
);

// Login page
router.get('/login', (req, res) => {
    res.render('login');
});

// Login user
router.post('/loginUser', (req, res) => {
    const { email, pw } = req.body;

    // Validate required fields
    if (!email || !pw) {
        req.flash('error', 'Please enter your email and password.');
        return res.redirect('/auth/login');
    }

    const password = crypto
        .createHash('sha256')
        .update(pw)
        .digest('hex');

    const loginUser = `
        SELECT *
        FROM users
        WHERE email = ? AND password_hash = ?
    `;

    db.query(loginUser, [email, password], (err, result) => {
        if (err) {
            console.log('Login failed:', err);

            req.flash('error', 'Login failed. Please try again.');
            return res.redirect('/auth/login');
        }

        // Check credentials
        if (result.length === 0) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/auth/login');
        }

        const user = result[0];

        // Prevent inactive accounts from logging in
        if (user.account_status !== 'active') {
            req.flash(
                'error',
                'Your account is inactive. Please contact the administrator.'
            );

            return res.redirect('/auth/login');
        }

        // Store user details in the session
        req.session.user = {
            user_id: user.user_id,
            username: user.full_name,
            full_name: user.full_name,
            profile_image: user.profile_image,
            num: user.contact_number,
            role: user.role
        };

        // Save session
        req.session.save((err) => {
            if (err) {
                console.log('Session save failed:', err);

                return res.status(500).send(
                    'Could not save login session.'
                );
            }

            console.log('Login successful!');
            console.log('Session user:', req.session.user);

            req.flash(
                'success',
                `Welcome, ${user.full_name}!`
            );

            // Redirect based on user role
            if (user.role === 'admin') {
                return res.redirect('/admin');
            }

            return res.redirect('/');
        });
    });
});

// Logout user
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('Logout failed:', err);

            return res.status(500).send(
                'Could not log out. Please try again.'
            );
        }

        return res.redirect('/auth/login');
    });
});

module.exports = router;
