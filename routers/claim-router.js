// MODULES
const router = require('express').Router();
const db = require('../config/db.js');

// MIDDLEWARE
const authMiddleware = require('../middleware/auth-middleware.js');

// SHOW CLAIM PAGE FOR A SPECIFIC "FOUND" ITEM THE USER TAPPED IN THE HOME AREA OR CATEGORY AREA
// claim.ejs
router.get('/:type/:item_id', authMiddleware, (req, res) => {

    // SO HERE, PARAMS MEAN PARAMETER. WE USED THE TYPE AND ID OF LOST ITEM AS PARAMETER INSIDE THE ENDPOINT OR URL
    const { type, item_id } = req.params;

    /* THESE ARE DICTIONARIES (IN PYTHON), WELL IN JS THIS ARE JUST OBJECTS.
        IF ITEM TYPE IS LOST, TABLES WILL BE 'lost_items', IF TYPE IS FOUND, THE TABLES WILL BE 'found_items'
    IF ITEM IS LOST, 'lost_item_id', IF FOUND, 'found_item_id'
    */
    const tables = {lost: 'lost_items', found: 'found_items'}
    const idColumns = {lost: 'lost_item_id', found: 'found_item_id'}

    // THIS CODE SAYS, "IT NEEDS TO BE FOUND ONLU"
    const table = tables[type];
    const idColumn = idColumns[type];

    // IF NOT FOUND, THEN IT IS AN INVALID ITEM TYPE
    if (!table) {
        return res.status(400).send('Invalid item type.');
    }

// RETRIEVE THE FOUND ID (MAKE IT ALIAS 'item_id') AND OTHER COLUMNS
    const sql = ` SELECT ${idColumn} AS item_id, item_name, description, location, photo_path
        FROM ${table} WHERE ${idColumn} = ?`
    db.query(sql, [item_id], (err, results) => {
        if (err) {
            console.error('Claim item query error:', err);
            req.flash("error", "Failed to retrieve item")
            return res.status(500).send('Failed to retrieve item.')
        }

        // IF THERE ARE NO ITEM, RETURN 'ITEM NOT FOUND'
        if (results.length === 0) {
            return res.status(404).send('Item not found.');
        }

        // PREPARE THE ITEM OBJECT
        // '...results[0] RETRIEVES THE ITEM'S DETAILS AS OBJECT
        // 'type' IS FOUND
        // PICTURE IS THE PICTURE OF FOUND ITEM
        const item = {
            ...results[0],
            type: type,
            picture: results[0].photo_path
        }

        res.render('claim', { item });
    });
});

// FOR A FORM CLAIM
//claim.ejs
router.post('/:type/:item_id/submit', authMiddleware, (req, res) => {
    const { type, item_id } = req.params;
    const { claim_details } = req.body;

    // MEANS ONLY FOUND ITEMS CAN BE CLAIMED
    // LOST ITEMS CAN'T BE CLAIMED BECAUSE IF A USER FOUND AN ITEM THEY SHOULD POST IT INSTEAD OF CLAIMING BECAUSE CLAIMING IS FOR FOUND ITEM ONLY
    // CLAIM MEANS TELLING THAT ITEM IS YOURS
    if (type !== 'found') {
        return res.status(400).send('Only found items can be claimed.');
    }

    // IF THERE IS NO CLAIM DETAILS OR EMPTY, THIS WILL WHAT BE RETURNED
    if (!claim_details || !claim_details.trim()) {
        req.flash("error", "Please provide your claim updates")
        return res.status(400).send('Please provide your claim details.');
    }

    // USER ID OF THE LOGGED IN USER
    const userId = req.session.user?.user_id;

    // IF NOT USER, WILL LOG IN
    if (!userId) {
        return res.status(401).send('Please log in first.');
    }

    // INSERT THE CLAIM INSIDE THE claims TABLE
    const sql = `
        INSERT INTO claims (found_item_id, user_id, claim_details)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [item_id, userId, claim_details.trim()], (err, result) => {
        if (err) {
            console.error('Submit claim error:', err);
            return res.status(500).send('Failed to submit claim.');
        }

        // GOES BACK TO THE HOME
        req.flash("success", "Claim submitted successfully! Please wait for the verification notif!")
        res.redirect('/');
    });
});

// EXPORT ROUTER GLOBALLY
module.exports = router;