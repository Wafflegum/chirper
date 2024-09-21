const likeButtons = document.querySelectorAll('.like-btn')

likeButtons.forEach((button) => {
	const postID = button.getAttribute('data-postid')
	const heartIcon = button.querySelector('.like-btn svg path')

	button.addEventListener('click', (e) => {
		axios.post('/like-post', { postID: postID }).then((response) => {
			const data = response.data

			if (data.success) {
				heartIcon.style.fill = data.isLiked ? '#ff5555' : 'var(--border-color)'
				console.log('Successfully liked post ' + postID)

				button.classList.add('click-animation')

				setTimeout(() => {
					button.classList.remove('click-animation')
				}, 400)
			}
		})
	})
})
