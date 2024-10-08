const express = require('express')
const app = express()
const { pool } = require('./dbConfig')

const bcrypt = require('bcrypt')
const flash = require('express-flash')
const session = require('express-session')

const passport = require('passport')
const initializePassport = require('./passportConfig')
initializePassport(passport)

require('dotenv')

const fetchPosts = require('./fetchPosts')
const notify = require('./notify')

const PORT = process.env.PORT || 4000

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const path = require('path')
const Notify = require('./notify')
const { type } = require('os')
app.set('views', path.join(__dirname, '/views'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'assets')))
app.use(express.static(path.join(__dirname, 'client')))

app.use(
	session({
		secret: 'secret',
		resave: false,
		saveUninitialized: false,
	})
)

app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

app.get('/', async (req, res) => {
	if (req.isAuthenticated()) {
		const postsData = await pool.query('SELECT * FROM posts')

		// const unsortedData = await Promise.all(
		// 	postsData.rows.map(async (entry) => {
		// 		const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [entry.user_id])

		// 		const user = userResult.rows[0]

		// 		let isLiked

		// 		const likedPost = await pool.query('SELECT * FROM likes WHERE post_id = $1 AND liker_id = $2', [
		// 			entry.id,
		// 			req.user.id,
		// 		])

		// 		if (likedPost.rows.length > 0) {
		// 			isLiked = true
		// 		} else {
		// 			isLiked = false
		// 		}

		// 		return {
		// 			username: user.username,
		// 			content: entry.content,
		// 			date: formatDate(entry.date),
		// 			postID: entry.id,
		// 			isLiked: isLiked,
		// 		}
		// 	})
		// )

		// const postsData = unsortedData.sort()

		const posts = await fetchPosts({ userID: req.user.id, postsData: postsData })

		res.render('home', { userData: req.user.username, data: posts })
	} else {
		res.redirect('login')
	}
})

app.get('/register', (req, res) => {
	if (!req.isAuthenticated()) {
		res.render('register')
	} else {
		res.redirect('/')
	}
})

// manages the register functionality.
app.post('/register', async (req, res) => {
	let { username, email, password, confPassword } = req.body

	let errors = []

	if (!username || !email || !password || !confPassword) {
		errors.push({ message: 'Please fill up all fields' })
	}
	if (password < 6) {
		errors.push({ message: 'Password must be atleast 6 characters' })
	}
	if (password != confPassword) {
		errors.push({ message: 'Password must match' })
	}

	if (errors.length > 0) {
		res.render('register', { errors })
	} else {
		const hashedPassword = await bcrypt.hash(password, 10)

		const emailQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email])
		const usernameQuery = await pool.query('SELECT * FROM users WHERE username = $1', [username])

		// Checks if the email and username is already taken. If true, push error messages in errors array
		if (emailQuery.rows.length > 0) {
			errors.push({ message: 'Email is already registered' })
		}
		if (usernameQuery.rows.length > 0) {
			errors.push({ message: 'Username is already taken' })
		}

		// if it's already taken, re-render the register page with the errors displayed
		if (errors.length > 0) {
			return res.render('register', { errors })
		}

		pool.query(
			`INSERT INTO users (username, email, password)
                VALUES ($1, $2, $3)`,
			[username, email, hashedPassword],
			(err, results) => {
				if (err) {
					throw err
				}

				req.flash('success_msg', 'You are now registered')
				res.redirect('/login')
			}
		)
	}
})

app.get('/login', (req, res) => {
	if (req.isAuthenticated()) {
		console.log('User is authenticated, redirecting to /')
		res.redirect('/')
	} else {
		console.log('User is not authenticated, rendering login page')
		res.render('login')
	}
})

// manages the login functionality
app.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/login',
		failureFlash: true,
	})
)

app.post('/display-following', async (req, res) => {
	if (req.isAuthenticated()) {
		const followingUsers = await pool.query('SELECT * FROM followers WHERE follower_id = $1', [req.user.id])
		let posts = []

		const postPromise = await Promise.all(
			followingUsers.rows.map(async (user) => {
				// fetches the post datas from the followed users
				const postsData = await pool.query('SELECT * FROM posts WHERE user_id = $1', [user.followed_id])

				posts = await fetchPosts({ userID: req.user.id, postsData: postsData })
			})
		)

		res.render('home', { userData: req.user.username, data: posts })
	} else {
		res.redirect('/login')
	}
})

app.post('/display-for-you', (req, res) => {
	res.redirect('/')
})

app.post('/create-post', (req, res) => {
	let { content } = req.body

	let date = formatDate()

	let user = req.user

	if (req.isAuthenticated()) {
		pool.query('INSERT INTO posts (user_id, content, date) VALUES ($1, $2, $3)', [user.id, content, date])
		res.redirect('/')
	}
})

app.post('/like-post', async (req, res) => {
	if (req.isAuthenticated()) {
		const postID = req.body.postID

		const likedPost = await pool.query('SELECT * FROM likes where post_id = $1 AND liker_id = $2', [
			postID,
			req.user.id,
		])
		if (likedPost.rows.length > 0) {
			await pool.query('DELETE FROM likes where post_id = $1 AND liker_id = $2', [postID, req.user.id])
			notify.DeleteNotification(parseInt(req.user.id), parseInt(postID), 'like')

			res.status(200).json({ success: true, isLiked: false })
		} else {
			await pool.query('INSERT INTO likes (post_id, liker_id) VALUES ($1, $2)', [postID, req.user.id])

			const recipient_id = await pool.query('SELECT * FROM posts WHERE id = $1', [postID])

			if (recipient_id.rows.length > 0) {
				notify.Notify({
					sender_id: req.user.id,
					recipient_id: recipient_id.rows[0].user_id,
					post_id: postID,
					type: 'like',
				})
			}

			res.status(200).json({ success: true, isLiked: true })
		}
	} else {
		res.redirect('/login')
	}
})

app.get('/dev/user', (req, res) => {
	if (req.isAuthenticated()) {
		let user = req.user
		res.send(user)
	}
})

app.get('/profile/:username', async (req, res) => {
	const username = req.params.username

	// Fetches the user you're viewing from database
	const userData = await pool.query('SELECT * FROM users WHERE username = $1', [username])

	if (userData.rows.length > 0) {
		// if user exists, fetches all the posts from that user
		const unsortedData = await pool.query('SELECT * FROM posts WHERE user_id = $1', [userData.rows[0].id])

		const postsData = await fetchPosts({ userID: req.user.id, postsData: unsortedData })

		const followingData = await pool.query('SELECT * FROM followers WHERE follower_id = $1', [userData.rows[0].id]) // Fetches the following data of the user you're viewing
		const followerData = await pool.query('SELECT * FROM followers WHERE followed_id = $1', [userData.rows[0].id]) // Fetches the follower data of the user you're viewing

		const bioData = await pool.query('SELECT * FROM bio WHERE user_id = $1', [userData.rows[0].id])

		let isOwnProfile = false
		let isFollowing = false

		if (req.isAuthenticated()) {
			if (userData.rows[0].username === req.user.username) {
				isOwnProfile = true
			} else {
				isOwnProfile = false

				// This checks if the visitor follows the user
				if (!isOwnProfile) {
					const viewingUser = await pool.query(
						'SELECT * FROM followers WHERE follower_id = $1 AND followed_id = $2',
						[req.user.id, userData.rows[0].id]
					)

					// Changes the button's text accordingly if the user follows or not
					if (viewingUser.rows.length > 0) {
						isFollowing = 'Following'
					} else {
						isFollowing = 'Follow'
					}
				}
			}
		}

		res.render('profile', {
			userData: userData.rows[0],
			postsData: postsData,
			postCount: postsData.length,
			isOwnProfile: isOwnProfile,
			isFollowing: isFollowing,
			followerCount: followerData.rows.length,
			followingCount: followingData.rows.length,
			bio: bioData.rows[0] ? bioData.rows[0].text : '',
		})
	} else {
		res.send('No users found')
	}
})

app.post('/follow', async (req, res) => {
	if (req.isAuthenticated()) {
		const toFollowID = req.body.user_id
		const follower = req.user.id

		// checks if user exists
		await pool.query('SELECT * FROM users WHERE id = $1', [toFollowID], (err, user) => {
			if (user.rows.length > 0) {
				// if it's true, it checks if the user is already following
				pool.query(
					'SELECT * FROM followers WHERE follower_id = $1 AND followed_id = $2',
					[follower, toFollowID],
					(err, result) => {
						if (err) throw err

						// if following, unfollow user
						if (result.rows.length > 0) {
							pool.query(
								'DELETE FROM followers WHERE follower_id = $1 AND followed_id = $2',
								[follower, toFollowID],
								(err, results) => {
									if (err) throw err

									return res.status(200).json({ success: true, isFollowing: false })
								}
							)
						} else {
							// if not, follow user
							pool.query(
								'INSERT INTO followers (follower_id, followed_id) VALUES ($1, $2)',
								[follower, toFollowID],
								(err, results) => {
									if (err) {
										throw err
										return res.status(500).json({
											success: false,
											message: 'Internal server error',
										})
									}

									return res.status(200).json({
										success: true,
										isFollowing: true,
									})
								}
							)
						}
					}
				)
			}
		})
	} else {
		res.status(400).json({ success: false, message: 'User not authenticated' })
		res.redirect('/login')
	}
})

app.get('/notifications', async (req, res) => {
	if (req.isAuthenticated()) {
		const notifications = await pool.query('SELECT * FROM notifications WHERE recipient_id = $1', [req.user.id])

		const notifData = await Promise.all(
			notifications.rows.map(async (notif) => {
				const user = await pool.query('SELECT * FROM users WHERE id = $1', [notif.sender_id])

				let content = ''

				if (notif.type === 'like') {
					content = 'liked your post'
				} else if (notif.type === 'follow') {
					content = 'followed you'
				}

				return {
					username: user.rows[0].username,
					content: content,
				}
			})
		)

		res.render('notifications', { userData: req.user.username, notifData: notifData })
	}
})

// Functionalities for Edit Profile / changing bio in profile page
app.post('/save-profile', async (req, res) => {
	const userID = req.user.id
	const userBio = await pool.query('SELECT * FROM bio WHERE user_id = $1', [userID])

	if (userBio.rows.length > 0) {
		pool.query('UPDATE bio SET text = $1 WHERE user_id = $2', [req.body.bioContent, userID])
		return res.status(200).json({ success: true })
	} else {
		pool.query('INSERT INTO BIO (user_id, text) VALUES ($1, $2)', [userID, req.body.bioContent])
		return res.status(200).json({ success: true })
	}
})

app.post('/logout', (req, res, next) => {
	req.logout((err) => {
		if (err) return next(err)

		res.redirect('/')
	})
})

app.listen(PORT, (err, res) => {
	console.log('Now listening on port ' + PORT)
	console.log(`http://localhost:4000/ <= Click here!`)
})
