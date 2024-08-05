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

app.get('/', (req, res) => {
	if (req.isAuthenticated()) {
		res.render('home')
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

		const emailQuery = await pool.query(
			'SELECT * FROM users WHERE email = $1',
			[email]
		)
		const usernameQuery = await pool.query(
			'SELECT * FROM users WHERE username = $1',
			[username]
		)

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

	let user = req.user

	if (req.isAuthenticated()) {
		pool.query('INSERT INTO posts (userid, content) VALUES ($1, $2)', [
			user.id,
			content,
		])
		res.redirect('/')
	}
})

app.listen(PORT, (err, res) => {
	console.log('Now listening on port ' + PORT)
	console.log(`http://localhost:4000/ <= Click here!`)
})
