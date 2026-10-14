const router = require('express').Router();
const crypto = require('crypto')
const db = require('../config/db.js')

// middlewares
const upload = require('../middleware/upload-middleware.js');

router.get("/register", (req,res) =>{
    res.render("register")
})

router.post('/registerUser', (req, res, next) => {
    next();
}, upload.single('pfp'), (req, res) => {

    const { name, email, pw } = req.body;

    if (!name || !email || !pw) {
        return res.status(400).send('Please complete all required fields.');
    }

    const password = crypto
        .createHash('sha256')
        .update(pw)
        .digest('hex');

    const profileImage = req.file
        ? '/uploads/' + req.file.filename
        : null;

    const sql = `
        INSERT INTO users
        (full_name, email, password_hash, profile_image)
        VALUES (?, ?, ?, ?)
    `;

    console.log('3. Sending database query');

    db.query(sql, [name, email, password, profileImage], (err, result) => {
        if (err) {
            console.error('4. Database error:', err);
            return res.status(500).send('Registration failed: ' + err.message);
        }
        console.log("Reigstration Successful")
        req.flash('success', 'Account registered successfully!');
        return res.redirect('/auth/register');
    });
});

router.get("/login", (req,res) =>{
    res.render("login")
})

router.post("/loginUser", (req, res) => {
const { email, pw } = req.body;
const password = crypto
    .createHash("sha256")
    .update(pw)
    .digest("hex");

const loginUser = `
    SELECT * FROM users
    WHERE email = ? AND password_hash = ?
`;

db.query(loginUser, [email, password], (err, result) => {
    if (err) {
        console.log("Login Failed:", err);
        req.flash("error", "Login failed. Please try again.");
        return res.redirect("/auth/login");
    }

    if (result.length === 0) {
        req.flash("error", "Invalid email or password.");
        return res.redirect("/auth/login");
    }

    const user = result[0];

    req.session.user = {
        id: user.user_id,
        username: user.full_name,
        full_name: user.full_name,
        profile_image: user.profile_image
    };

    req.session.save((err) => {
        if (err) {
            console.log("Session save failed:", err);
            return res.status(500).send("Could not save login session.");
        }

        console.log("Login Successful!");
        console.log("Session user:", req.session.user);

        return res.redirect("/");
    });
});

});


router.get("/logout", (req,res) =>{
    req.session.destroy((err) =>{
        if(err){
            console.log("Log out failed")
        }else{
            res.redirect("/auth/login")
        }
    })
})

module.exports = router;