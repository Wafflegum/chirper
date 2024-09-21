const { pool } = require('./dbConfig')

// Formats the date to YYYY-MM-DD as per PSQL's date format.
function formatDate(date) {
	let d
	if (date === null || date === undefined) {
		d = new Date()
	} else {
		d = new Date(date)
	}

	let month = '' + (d.getMonth() + 1),
		day = '' + d.getDate(),
		year = d.getFullYear()

	if (month.length < 2) month = '0' + month
	if (day.length < 2) day = '0' + day

	return [year, month, day].join('-')
}

async function FetchPosts({ userID, postsData, includeLikes = true } = {}) {
	const unsortedData = await Promise.all(
		postsData.rows.map(async (entry) => {
			const userData = await pool.query('SELECT * FROM users WHERE id = $1', [entry.user_id])

			const user = userData.rows[0]

			let liked
			let likeCount

			if (includeLikes) {
				const likeData = await pool.query('SELECT * FROM likes WHERE post_id = $1 AND liker_id = $2', [
					entry.id,
					userID,
				])

				liked = likeData.rows.length > 0
				likeCount = likeData.rows.length
			}

			return {
				username: user.username,
				content: entry.content,
				date: formatDate(entry.date),
				postID: entry.id,
				isLiked: liked,
				likeCount: likeCount,
			}
		})
	)

	const sortedData = unsortedData.sort()

	return sortedData
}

module.exports = FetchPosts
