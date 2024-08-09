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

const PORT = process.env.PORT || 4000

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))

const path = require('path')
app.set('views', path.join(__dirname, 'views'))
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
		const results = await pool.query('SELECT * FROM posts')

		const unsortedData = await Promise.all(
			results.rows.map(async (entry) => {
				const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [entry.userid])

				const user = userResult.rows[0]

				return {
					username: user.username,
					content: entry.content,
					date: formatDate(entry.date),
				}
			})
		)

		const postsData = unsortedData.sort()

		console.log(req.user.username)

		res.render('home', { userData: req.user.username, data: postsData })
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

app.post('/create-post', (req, res) => {
	let { content } = req.body

	let date = formatDate()

	let user = req.user

	if (req.isAuthenticated()) {
		pool.query('INSERT INTO posts (userid, content, date) VALUES ($1, $2, $3)', [user.id, content, date])
		res.redirect('/')
	}
})

app.get('/dev/user', (req, res) => {
	if (req.isAuthenticated()) {
		let user = req.user
		res.send(user)
	}
})

app.get('/:username', async (req, res) => {
	const username = req.params.username

	const userData = await pool.query('SELECT * FROM users WHERE username = $1', [username])

	if (userData.rows.length > 0) {
		const rawPostsData = await pool.query('SELECT * FROM posts WHERE userid = $1', [userData.rows[0].id])

		const postsData = rawPostsData.rows.map((post) => {
			return {
				username: userData.rows[0].username,
				content: post.content,
				date: formatDate(rawPostsData.date),
			}
		})

		res.render('profile', { userData: userData.rows[0], postsData: postsData })
	} else {
		res.send('No users found')
	}
})

app.listen(PORT, (err, res) => {
	console.log('Now listening on port ' + PORT)
	console.log(`http://localhost:4000/ <= Click here!`)
})
