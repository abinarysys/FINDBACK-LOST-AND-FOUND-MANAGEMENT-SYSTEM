const router = require('express').Router();
const crypto = require('crypto')
const db = require('../config/db.js')

// middlewares
const authMiddleware = require('../middleware/auth-middleware.js')
const userMiddleware = require('../middleware/user-middleware.js')
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

router.post("/loginUser", (req,res) =>{
    const {email,pw} = req.body;
    const password = crypto.createHash("sha256").update(pw).digest("hex");
    const loginUser = `SELECT * FROM users WHERE email = ? AND password_hash = ?`;
    db.query(loginUser, [email, password], (err,result) =>{
        if(err){
            console.log("Login Failed: ", err);
            res.send("Login Failed: ", err.message);
        }
        if (result.length>0){
            console.log("Login Successful!")
            req.session.user = {
                id: result[0].user_id,
                username: result[0].full_name,
                profile_image: result[0].profile_image
            };
            res.redirect("/")
        }
    })
})

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