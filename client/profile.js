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

		const inputField = document.createElement('input')
		inputField.className = 'bioField'
		inputField.type = 'text'
		inputField.value = bioBackup // this will put in the current bio to the input field

		bio.replaceChild(inputField, bio.firstChild)

		// When you click the cancel button, it basically resets
		cancelBtn.addEventListener('click', (e) => {
			profileButtonContainer.innerHTML = ''
			profileButtonContainer.appendChild(editProfileBtn)
			bio.innerHTML = bioBackup
		})

		saveBtn.addEventListener('click', (e) => {
			profileButtonContainer.innerHTML = ''
			profileButtonContainer.appendChild(editProfileBtn)
			bio.innerHTML = inputField.value
		})
	})
}
