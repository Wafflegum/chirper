// this will add the notifications to SQL

const { pool } = require('./dbConfig')

async function Notify({ recipient_id, sender_id, post_id, type } = {}) {
	const currentTime = new Date()

	const notification = await pool.query('SELECT FROM notifications WHERE recipient_id = $1 AND post_id = $2', [
		recipient_id,
		post_id,
	])

	if (notification.rows.length > 0) {
		DeleteNotification(recipient_id, post_id)
	} else {
		await pool.query(
			`INSERT INTO notifications (recipient_id, sender_id, post_id, type, is_read, created_at)
        VALUES ($1, $2, $3, $4, FALSE, $5)`,
			[recipient_id, sender_id, post_id, type, currentTime]
		)
	}
}

async function DeleteNotification(sender_id, post_id, type) {
	await pool.query('DELETE FROM notifications WHERE sender_id = $1 AND post_id = $2 AND type = $3', [
		sender_id,
		post_id,
		type,
	])
}

module.exports = { Notify, DeleteNotification }
