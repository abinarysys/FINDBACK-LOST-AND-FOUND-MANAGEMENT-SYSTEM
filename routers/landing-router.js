const router = require('express').Router()
const db = require('../config/db.js')

// middlewares
const authMiddleware = require('../middleware/auth-middleware.js')
const userMiddleware = require('../middleware/user-middleware.js')
const upload = require('../middleware/upload-middleware.js');

router.get("/", (req, res) => {
    const getCategory = "SELECT * FROM item_categories";
    db.query(getCategory, (err, results) => {
        if (err) {
            console.log(err);
            res.send(err.message)
            return res.status(500).send("DB error");
        }

        return res.render("index", {
            categories: results,
            user: req.session.user
        });
    });
});

module.exports = router;