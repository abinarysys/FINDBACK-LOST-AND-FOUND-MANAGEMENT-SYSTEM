// MODULES AND EXPORTS
const router = require("express").Router();
const db = require("../config/db.js");

// MIDDLEWARES
const upload = require("../middleware/upload-middleware.js");
const authMiddleware = require("../middleware/auth-middleware.js");

// TAP THE BUTTON SUBMIT LOST ITEM IN THE LANDING PAGE
router.get("/", authMiddleware, (req, res) => {
  res.render("submitLostItem");
});

// SUBMIT A LOST ITEM REPORT
router.post(
  "/submit",
  authMiddleware,
  upload.single("lostPhoto"),
  (req, res) => {
    console.log(req.body);
    // REQ.BODY OF THE LOST ITEM FORM
    const { name, category_id, description, locLost, dateLost } = req.body;
    // IF NOT A USER BY CHANCE, GO BACK TO LOGIN PAGE
    if (!req.session.user) {
      req.flash("error", "Please log in to submit feedback.");
      return res.redirect("/auth/login");
    }
    const userId = req.session.user.user_id;
    // IF USER DID NOT PUT ANYRTHING TO THE REQUIRED INPUTS, THIS ERROR WILL BE SHOWN
    if (!name || !category_id || !req.file || !locLost || !dateLost) {
      req.flash("error", "Please complete all required fields.");
      return res.redirect("/lost");
    }
    // UPLOAD PICTURE
    const lostItemPic = req.file ? "/uploads/" + req.file.filename : null;
    console.log("FORM DATA:", req.body);
    console.log("UPLOADED FILE:", req.file);
    const submitLostItem = `INSERT INTO lost_items (user_id, category_id, 
    item_name, description, location, date_lost, photo_path) VALUES (?,?,?,?,?,?,?)`;
    db.query(submitLostItem, [userId, category_id, name, description, locLost, dateLost, lostItemPic], (err) => {
      if (err) {
        req.flash("error", "Unable to submit");
        return res.status(500).send("Error: " + err.message);
      }
      req.flash("success", "Submitted Successfully");
      return res.redirect("/lost");
      },
    );
  },
);

module.exports = router;
