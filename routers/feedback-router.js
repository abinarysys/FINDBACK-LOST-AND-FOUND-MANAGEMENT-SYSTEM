const router = require('express').Router();
const db = require('../config/db.js');

router.post("/feedback", (req, res) => {
const { rate, msg } = req.body;
if (!req.session.user) {
    req.flash('error', 'Please log in to submit feedback.');
    return res.redirect('/auth/login');
}

const userId = req.session.user.id;

const giveFeedback = `INSERT INTO feedback (user_id, rating, message) VALUES (?, ?, ?)`;

db.query(giveFeedback, [userId, rate, msg], (err) => {
    if (err) {
        console.log('Feedback error:', err);
        req.flash("error", "Feedback failed");
        return res.redirect("/");
    }

    req.flash("success", "Feedback Succeeded");
    return res.redirect("/");
});

});


module.exports = router;
