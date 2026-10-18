// MODULES
const router = require('express').Router();
const crypto = require('crypto');
const db = require('../config/db.js');

// MIDDLEWARE
const upload = require('../middleware/upload-middleware.js');

// RETRIEVE REGISTER PAGE
// register.ejs
router.get('/register', (req, res) => {
    res.render('register');
});

// FOR REGISTER FORM
// register.ejs
router.post('/registerUser', upload.single('pfp'), (req, res) => {
    const { name, email, pw, num } = req.body;

    // THIS MEANS IF THE INPUTS ARE EMPTY, IT'LL SEND VOID AND SEND A FLASH TO COMPLETE THE FIELDS
    if (!name || !email || !pw || !num) {
        req.flash("error", "Please complete all required task")
        res.redirect("auth/register")
        return res.status(400).send(
            'Please complete all required fields.'
        )}

    // HASHES THE PASSWORD WITH THE SHA-256 ALGORITHM 
    // TAKE NOTE: SHA-256 IS IRREVERSABLE SO IT IS SECURE. IN SHORT --> YOU CAN'T DECRYPT
    const password = crypto.createHash('sha256').update(pw).digest('hex');

    // FOLDER WHERE UPLOADED FILES WILL BE SENT
    // USED USING THE UPLOAD MIDDLEWARE
    const profileImage = req.file
        ? '/uploads/' + req.file.filename
        : null;

    // INSERT THE REQUEST BODY INSIDE THE USERS TABLE
    // USES PREPARED STATEMENT
    const registerUser = `INSERT INTO users (full_name, email, password_hash, profile_image, contact_number)
            VALUES (?, ?, ?, ?, ?)`
            
    // A FUNCTION FOR SQL QUERY AND ERROR HANDLING
    db.query(registerUser, [name, email, password, profileImage, num], (err, result) => {
        // ERROR HANDLING
        if (err) {
            console.log('Registration failed:', err);
            req.flash("error", "Registration failed. Please try again.")
            return res.status(500).send('Registration failed. Please try again.')
        }
        console.log('Registration successful')
        req.flash('success', 'Account registered successfully! Login now')
        return res.redirect('/auth/login');
            })
    })

// RETRIEVE LOGIN PAGE
// login.ejs
router.get('/login', (req, res) => {
    res.render('login');
});

// FOR LOGIN FORM
// login.ejs
router.post('/loginUser', (req, res) => {
    const { email, pw } = req.body;
    // IF THE EMAIL OR PASSWORD IS EMPTY, THIS BLOCK OF CODE WITH CHECK
    if (!email || !pw) {
        req.flash('error', 'Please enter your email and password.');
        return res.redirect('/auth/login');
    }
    // SHA-256 HASH
    const password = crypto.createHash('sha256').update(pw).digest('hex');
    // RETRIEVES LOGIN USER AND CHECKS EMAIL AND PASSWORD IF IT IS THE SAME WITH WHAT USER TYPED
    // I USED PREPARED SYSTEM, IT KEEPS SYSTEM OUT FOR SQL INJECTION
    const loginUser = `SELECT * FROM users WHERE email = ? AND password_hash = ?`
    // THIS BLOCK OF CODE EXECUTES THE SQL QUERY
    // DOES ERROR HANDLING
    db.query(loginUser, [email, password], (err, result) => {
        if (err) {
            console.log('Login failed:', err)
            req.flash('error', 'Login failed. Please try again.')
            return res.redirect('/auth/login')
        }

        // CHECKS IF THERE IS REALLY A USER
        // SQL QUERY RETURNS RESULT AS AN ARRAY OF OBJECTS THAT'S WHY WE'RE USING .LENGTH
        // LENGTH === 0 MEANS, "IS THERE 1 USER WHO HAS THIS EMAIL AND PASSWORD GIVEN?"
        // IF THE IF CONDITION IS CORRECT, THE RESULT WILL EXECUTE THE CONTENT INSIDE THE BLOCK OF CODE
        if (result.length === 0) {
            req.flash('error', 'Invalid email or password.')
            return res.redirect('/auth/login')
        }
        // IF THERE IS A RESULT, IT WILL BE PUT INSIDE A VARIABLE NAMED USER.
        // IT'S result[0] BECAUSE ARRAY USES INDEX THAT STARTS WITH 0
        const user = result[0]

        // THIS PREVENTS OLD OR INACTIVE ACCOUNT FROM LOGGING IN
        if (user.account_status !== 'active') {
            req.flash("error", "Your account is inactive. Please contact the administrator.")
            return res.redirect('/auth/login');
        }
        // STORE THE USER DETAILS INSIDE A SESSION
        // SESSION IS A WAY TO REMEBER INFO ABOUT THE USER
        // WHEN THE USER LOGS IN, IT'S INFORMATION IS SENT INSIDE A SESSION
        // WHEN THE USER LOGS OUT, ALL OF ITS INFORMATION WILL BE REMOVED IN THE SESSION AND WILL BE ENCRYPTED INSIDE THE SYSTEM
        // OTHERS CAN'T OPEN USER'S ACCOUNT ONCE THEY LOGGED OUT
        req.session.user = {
            user_id: user.user_id,
            username: user.full_name,
            full_name: user.full_name,
            profile_image: user.profile_image,
            num: user.contact_number,
            role: user.role
        };

        // SSAVE SESSION
        req.session.save((err) => {
            if (err) {
                console.log('Session save failed:', err);
                return res.status(500).send('Could not save login session.')
            }
            // THIS SHOWS TO THE SERVER'S CONSOLE
            // JUST A VERIFICATION I ADDED
            console.log('Login successful!');
            console.log('Session user:', req.session.user);
            // HERE I CAN USER user.full_name BECAUSE OF THE ABOVE BLOCK OF CODE IN THE SSESION AREA
            req.flash('success',`Welcome, ${user.full_name}!`)
            // IF TH USER IS AN ADMIN, USER WILL BE SENT IN ITS RESPECTIVE LOGIN AREA
            if (user.role === 'admin') {
                return res.redirect('admin/login');
            }
            return res.redirect('/');
        })
    })
})

// LOGOUT'S USER
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('Logout failed:', err);
            return res.status(500).send(
                'Could not log out. Please try again.'
            );
        }  
        return res.redirect('/auth/login');
    })
})

// EXPORT THE ROUTE SO IT CAN BE USED GLOBALLY
module.exports = router;
