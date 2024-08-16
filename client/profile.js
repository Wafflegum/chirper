const followBtn = document.getElementById('followBtn')

followBtn.addEventListener('click', (e) => {
	const user_id = e.target.getAttribute('data-userid')

	axios
		.post('/follow', { user_id: user_id })
		.then((response) => {
			const data = response.data

			console.log('test')

			if (data.success) {
				followBtn.replaceChild(
					document.createTextNode(data.isFollowing ? 'Following' : 'Follow'),
					followBtn.firstChild
				)
			} else {
				alert(data.message)
			}
		})
		.catch((error) => {
			console.error(error)
		})
})
