const followBtn = document.getElementById('followBtn')
const editProfileBtn = document.getElementById('editProfileBtn')

const bio = document.getElementById('bio')
const profileButtonContainer = document.getElementById('profileButtonContainer')

if (followBtn != null) {
	followBtn.addEventListener('click', (e) => {
		const user_id = e.target.getAttribute('data-userid')

		axios
			.post('/follow', { user_id: user_id })
			.then((response) => {
				const data = response.data

				if (data.success) {
					followBtn.replaceChild(
						document.createTextNode(data.isFollowing ? 'Following' : 'Follow'),
						followBtn.firstChild
					)

					// if (data.isFollowing) {
					// 	console.log('test')
					// 	e.target.classList = 'button-normal'
					// } else {
					// 	e.target.classList = 'button-highlight'
					// }
				} else {
					alert(data.message)
				}
			})
			.catch((error) => {
				console.error(error)
			})
	})
}

if (editProfileBtn != null) {
	editProfileBtn.addEventListener('click', (e) => {
		// creates the save and cancel button components and sets the classes for styling
		const saveBtn = document.createElement('button')
		const cancelBtn = document.createElement('button')

		saveBtn.className = 'button-highlight'
		cancelBtn.className = 'button-normal'

		saveBtn.innerHTML = 'Save'
		cancelBtn.innerHTML = 'Cancel'

		// Clears up the profile button container, which contained the edit profile button then replaces it with the save and cancel buttons
		profileButtonContainer.innerHTML = ''
		profileButtonContainer.appendChild(saveBtn)
		profileButtonContainer.appendChild(cancelBtn)

		// Backups the current bio, then replaces it with an input field
		const bioBackup = bio.innerHTML

		// Create the input then apply all settings
		const inputField = document.createElement('textarea')
		inputField.className = 'bioField'
		inputField.type = 'text'
		inputField.innerHTML = bio.innerText // this will put in the current bio to the input field
		inputField.placeholder = 'Enter your bio here...'
		inputField.setAttribute('MaxLength', '160')

		if (bio.innerHTML !== null) {
			bio.replaceChildren(inputField)
		} else {
			bio.appendChild(inputField)
		}

		// When you click the cancel button, it basically resets
		cancelBtn.addEventListener('click', (e) => {
			profileButtonContainer.innerHTML = ''
			profileButtonContainer.appendChild(editProfileBtn)
			bio.innerText = bioBackup
		})

		saveBtn.addEventListener('click', (e) => {
			axios.post('/save-profile', { bioContent: inputField.value }).then((response) => {
				const data = response.data

				profileButtonContainer.innerHTML = ''
				bio.innerHTML = inputField.value
				profileButtonContainer.appendChild(editProfileBtn)
			})
		})
	})
}
