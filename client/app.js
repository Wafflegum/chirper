const createPost = document.getElementById('createPost')
const postCharCounter = document.getElementById('postCharCounter')

let postCharCount = 0
let characterLimit = 200

createPost.addEventListener('input', (e) => {
	postCharCount = createPost.textLength

	postCharCounter.innerHTML = postCharCount

	if (postCharCount >= characterLimit) {
		postCharCounter.style.color = '#ff3662'
	} else if (postCharCount >= characterLimit * 0.8) {
		postCharCounter.style.color = 'orange'
	} else {
		postCharCounter.style.color = 'white'
	}
})
