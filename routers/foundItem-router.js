const router = require('express').Router()
const db = require('../config/db.js');

// middlewares
const upload = require('../middleware/upload-middleware.js');
const authMiddleware = require('../middleware/auth-middleware.js')

router.get("/", authMiddleware, (req,res) =>{
    res.render("submitFoundItem")
})

router.post("/submit", authMiddleware, upload.single('foundPhoto'), (req, res) => {
    console.log(req.body)
    const { name, category_id, description, locFound, dateFound} = req.body;
    if (!req.session.user) {
        req.flash('error', 'Please log in to submit feedback.')
    return res.redirect('/auth/login')
    }
    const userId = req.session.user.user_id;
    if (!name || !category_id || !req.file || !locFound || !dateFound) {
        req.flash("error",'Please complete all required fields.')
        return res.redirect("/found")
    }
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