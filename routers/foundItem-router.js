// MODULES
const router = require('express').Router()
const db = require('../config/db.js');

//MIDDLEWARES
const upload = require('../middleware/upload-middleware.js');
const authMiddleware = require('../middleware/auth-middleware.js')

// RETRIEVE SUBMITFOUNDITEM PAGE
// submitFoundItem.ejs
router.get("/", authMiddleware, (req,res) =>{
    res.render("submitFoundItem")
})

// FOR THE FORM
// submitFoundItem.ejs
router.post("/submit", authMiddleware, upload.single('foundPhoto'), (req, res) => {
    console.log(req.body)
    const { name, category_id, description, locFound, dateFound} = req.body;

    //IF NOT USER, LOGIN
    if (!req.session.user) {
        req.flash('error', 'Please log in to submit feedback.')
    return res.redirect('/auth/login')
    }

    // USER'S ID
    const userId = req.session.user.user_id;

    // IF ONE FIELD IS EMPTY, IT WILL NOT BE ACCEPTED
    if (!name || !category_id || !req.file || !locFound || !dateFound) {
        req.flash("error",'Please complete all required fields.')
        return res.redirect("/found")
    }

    // FOLDER WHERE UPLOADED PICTURES WILL BE SENT OR DIRECTED
    const foundItemPic = req.file
        ? '/uploads/' + req.file.filename
        : null
    console.log("FORM DATA:", req.body);
        console.log("UPLOADED FILE:", req.file);
    const submitFoundItem = `INSERT INTO found_items (user_id, category_id, 
    item_name, description, location, date_found, photo_path) VALUES (?,?,?,?,?,?,?)`
    db.query(submitFoundItem, [userId, category_id, name, description, locFound, dateFound, foundItemPic], (err) =>{
        if(err){
            req.flash("error","Unable to submit")
            return res.status(500).send("Error: "+err.message)
        }
        req.flash("success", "Submitted Successfully")
        return res.redirect("/found")
    })
})

module.exports = router;