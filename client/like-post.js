const likeButtons = document.querySelectorAll('.like-btn')

likeButtons.forEach((button) => {
	const postID = button.getAttribute('data-postid')

	button.addEventListener('click', (e) => {
		axios.post('/like-post', { postID: postID }).then((response) => {
			const data = response.data

			if (data.success) {
				console.log('Successfully liked post ' + postID)
			}
		})
	})
})
