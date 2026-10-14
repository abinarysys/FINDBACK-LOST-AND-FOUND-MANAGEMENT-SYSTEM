const router = require('express').Router()
const db = require('../config/db.js');

// middleware
const authMiddleware = require('../middleware/auth-middleware.js')

router.get("/",  authMiddleware, (req,res) =>{
    res.render("submitFoundItem")
})


module.exports = router;