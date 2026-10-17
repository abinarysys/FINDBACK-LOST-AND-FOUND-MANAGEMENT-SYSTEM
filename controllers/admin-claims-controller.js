// controllers/admin-claims-controller.js
// Admin side of claims: list pending claims, verify or reject them, notify the claimant.
const query = require('../config/query');
const { imgUrl } = require('../config/admin-ui');
const { logAdminAction } = require('../middleware/admin-activity');
const { notifyUser } = require('../config/notify');

// Put your office name / hours here, it's added to the "verified" message.
// Example: 'Go to the Student Affairs Office, Mon-Fri 8AM-5PM.'
const OFFICE_NOTE = '';

const toId = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };

exports.getClaims = async (req, res) => {
    try {
        const rows = await query(`
            SELECT c.claim_id, c.claim_details, c.status, c.created_at, c.reviewed_at, c.admin_note,
                   fi.found_item_id, fi.item_name, fi.description, fi.location, fi.date_found,
                   fi.photo_path, fi.status AS item_status, cat.category_name,
                   u.user_id AS claimant_id, u.full_name AS claimant, u.email AS claimant_email,
                   u.contact_number AS claimant_contact, u.profile_image AS claimant_image,
                   f.full_name AS finder
              FROM claims c
              JOIN found_items fi ON fi.found_item_id = c.found_item_id
              JOIN users u ON u.user_id = c.user_id
              LEFT JOIN users f ON f.user_id = fi.user_id
              LEFT JOIN item_categories cat ON cat.category_id = fi.category_id
             ORDER BY CASE WHEN c.status = 'pending' THEN 0 ELSE 1 END, c.created_at DESC`);

        const claims = rows.map((r) => ({ ...r, photo: imgUrl(r.photo_path) }));
        res.render('admin/admin-claims', { title: 'Claims', activePage: 'claims', claims });
    } catch (err) {
        console.error('Load claims error:', err);
        res.status(500).render('admin/admin-error', {
            title: 'Something went wrong', code: 500, message: 'Could not load claims.'
        });
    }
};

exports.updateClaimStatus = async (req, res) => {
    const claimId = toId(req.params.id);
    const status = req.body.status;
    const note = String(req.body.note || '').trim().slice(0, 255);

    if (!claimId) return res.status(400).json({ success: false, message: 'Invalid claim ID.' });
    if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status must be verified or rejected.' });
    }

    try {
        const rows = await query(
            `SELECT c.claim_id, c.status, c.user_id, c.found_item_id,
                    fi.item_name, fi.status AS item_status
               FROM claims c JOIN found_items fi ON fi.found_item_id = c.found_item_id
              WHERE c.claim_id = ?`, [claimId]);
        const claim = rows[0];

        if (!claim) return res.status(404).json({ success: false, message: 'Claim not found.' });
        if (claim.status !== 'pending') {
            return res.status(409).json({ success: false, message: `This claim was already ${claim.status}.` });
        }
        if (status === 'verified' && claim.item_status !== 'available') {
            return res.status(409).json({ success: false, message: 'This item is already reserved for another claim.' });
        }

        // "AND status = 'pending'" stops two admins from reviewing the same claim at once
        const upd = await query(
            `UPDATE claims SET status = ?, reviewed_by = ?, reviewed_at = NOW(), admin_note = ?
              WHERE claim_id = ? AND status = 'pending'`,
            [status, req.admin.user_id, note || null, claimId]);
        if (!upd.affectedRows) {
            return res.status(409).json({ success: false, message: 'This claim was just reviewed by someone else.' });
        }

        const io = req.app.get('io');

        if (status === 'verified') {
            await query("UPDATE found_items SET status = 'reserved' WHERE found_item_id = ? AND status = 'available'",
                [claim.found_item_id]);

            await notifyUser(io, claim.user_id, {
                type: 'claim_verified',
                title: 'Your claim was verified',
                message: `Your claim for "${claim.item_name}" was verified. You can now claim it at the office.`
                    + (OFFICE_NOTE ? ` ${OFFICE_NOTE}` : '') + (note ? ` Note from admin: ${note}` : ''),
                link: '/user/notifications'
            });
        } else {
            await notifyUser(io, claim.user_id, {
                type: 'claim_rejected',
                title: 'Your claim was not approved',
                message: `Your claim for "${claim.item_name}" could not be verified.` + (note ? ` Reason: ${note}` : ''),
                link: '/user/notifications'
            });
        }

        await logAdminAction(req, status === 'verified' ? 'VERIFY_CLAIM' : 'REJECT_CLAIM', {
            targetType: 'claim', targetId: claimId, details: `${claim.item_name} → ${status}`
        });

        res.json({ success: true, message: `Claim ${status}. The user has been notified.` });
    } catch (err) {
        console.error('Update claim error:', err);
        res.status(500).json({ success: false, message: 'Could not update the claim.' });
    }
};
