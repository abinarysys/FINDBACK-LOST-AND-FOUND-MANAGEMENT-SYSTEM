
const query = require('../config/query');
const { imgUrl } = require('../config/admin-ui');
const { logAdminAction } = require('../middleware/admin-activity');
const { notifyUser } = require('../config/notify');

const OFFICE_NOTE = '';

const toId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

// Get all claims for the admin claims page
exports.getClaims = async (req, res) => {
    try {
        const sql = `
            SELECT
                c.claim_id,
                c.user_id AS claimant_id,
                c.found_item_id,
                c.claim_details,
                c.status,
                c.created_at,
                c.reviewed_at,
                c.admin_note,

                fi.item_name,
                fi.description,
                fi.location,
                fi.date_found,
                fi.photo_path,
                fi.status AS item_status,
                fi.user_id AS finder_id,

                cat.category_name,

                u.full_name AS claimant,
                u.email AS claimant_email,
                u.contact_number AS claimant_contact,
                u.profile_image AS claimant_image,

                f.full_name AS finder

            FROM claims c

            INNER JOIN found_items fi
                ON fi.found_item_id = c.found_item_id

            INNER JOIN users u
                ON u.user_id = c.user_id

            LEFT JOIN users f
                ON f.user_id = fi.user_id

            LEFT JOIN item_categories cat
                ON cat.category_id = fi.category_id

            ORDER BY
                CASE WHEN c.status = 'pending' THEN 0 ELSE 1 END,
                c.created_at DESC
        `;

        const rows = await query(sql);

        const claims = rows.map((row) => ({
            ...row,
            photo: imgUrl(row.photo_path)
        }));

        res.render('admin/admin-claims', {
            title: 'Claims',
            activePage: 'claims',
            claims
        });
    } catch (error) {
        console.error('Error loading admin claims:', error);

        req.flash('error', 'Unable to load claims.');
        res.redirect('/admin');
    }
};

// Verify or reject a pending claim
exports.updateClaimStatus = async (req, res) => {
    try {
        const claimId = toId(req.params.id);
        const status = String(req.body.status || '').trim().toLowerCase();
        const note = String(req.body.note || '').trim();

        if (!claimId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid claim ID.'
            });
        }

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be verified or rejected.'
            });
        }

        // Load the claim, claimant, found item, and finder.
        const claimRows = await query(
            `SELECT
                c.claim_id,
                c.user_id AS claimant_id,
                c.found_item_id,
                c.claim_details,
                c.status AS claim_status,

                fi.item_name,
                fi.status AS item_status,
                fi.user_id AS finder_id,

                u.full_name AS claimant_name

             FROM claims c

             INNER JOIN found_items fi
                ON fi.found_item_id = c.found_item_id

             INNER JOIN users u
                ON u.user_id = c.user_id

             WHERE c.claim_id = ?
             LIMIT 1`,
            [claimId]
        );

        if (!claimRows.length) {
            return res.status(404).json({
                success: false,
                message: 'Claim not found.'
            });
        }

        const claim = claimRows[0];

        if (claim.claim_status !== 'pending') {
            return res.status(409).json({
                success: false,
                message: 'This claim has already been reviewed.'
            });
        }

        if (status === 'verified' && claim.item_status !== 'available') {
            return res.status(409).json({
                success: false,
                message: 'This item is no longer available.'
            });
        }

        // Update only if the claim is still pending.
        const updateResult = await query(
            `UPDATE claims
             SET status = ?,
                 reviewed_at = NOW(),
                 admin_note = ?
             WHERE claim_id = ?
               AND status = 'pending'`,
            [status, note || null, claimId]
        );

        if (!updateResult.affectedRows) {
            return res.status(409).json({
                success: false,
                message: 'The claim was already reviewed. Refresh the page.'
            });
        }

        // Reserve the found item when the claim is verified.
        if (status === 'verified') {
            const itemResult = await query(
                `UPDATE found_items
                 SET status = 'claimed'
                 WHERE found_item_id = ?
                   AND status = 'available'`,
                [claim.found_item_id]
            );

            if (!itemResult.affectedRows) {
                // Restore pending status if the item could not be reserved.
                await query(
                    `UPDATE claims
                     SET status = 'pending',
                         reviewed_at = NULL,
                         admin_note = NULL
                     WHERE claim_id = ?
                       AND status = 'verified'`,
                    [claimId]
                );

                return res.status(409).json({
                    success: false,
                    message: 'The item is no longer available. Refresh and try again.'
                });
            }
        }

        // Notify the claimant and associate the notification with the item.
        const io = req.app.get('io');

        const notificationMessage = status === 'verified'
            ? `Your claim for "${claim.item_name}" was verified. You can now claim it at the office.${OFFICE_NOTE ? ` ${OFFICE_NOTE}` : ''}${note ? ` Admin note: ${note}` : ''}`
            : `Your claim for "${claim.item_name}" could not be verified.${note ? ` Reason: ${note}` : ''}`;

        await notifyUser(io, claim.claimant_id, {
            type: status === 'verified'
                ? 'claim_verified'
                : 'claim_rejected',

            title: status === 'verified'
                ? 'Your claim was verified'
                : 'Your claim was not approved',

            message: notificationMessage,
            link: '/user/notifications',

            // These fields connect the notification to the actual found item.
            found_item_id: claim.found_item_id,
            claim_id: claim.claim_id,

            // The other person involved in the claim is the finder.
            related_user_id: claim.finder_id
        });

        // Record the admin action if the logger is available.
        if (typeof logAdminAction === 'function') {
            await logAdminAction(req, {
                action: status === 'verified'
                    ? 'Verified claim'
                    : 'Rejected claim',
                details: `Claim #${claim.claim_id} for "${claim.item_name}".`
            });
        }

        return res.json({
            success: true,
            message: status === 'verified'
                ? 'Claim verified successfully.'
                : 'Claim rejected successfully.'
        });
    } catch (error) {
        console.error('Error updating claim status:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to update claim status.'
        });
    }
};
