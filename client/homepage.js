const createPostInput = document.getElementById('createPost')
const postCharCounter = document.getElementById('postCharCounter')
const postBtn = document.getElementById('postBtn')

const createPostForm = document.getElementById('createPostForm')

// * navigations

let postCharCount = 0
let characterLimit = 200

createPostForm.addEventListener('keydown', (e) => {
	if (e.key == 'Enter' && !e.shiftKey) {
		e.preventDefault()
		createPostForm.submit()
		console.log('submitted')
	}
})

createPostInput.addEventListener('input', (e) => {
	postCharCount = createPostInput.textLength

	postCharCounter.innerHTML = postCharCount

	if (postCharCount >= characterLimit) {
		postCharCounter.style.color = '#ff3662'
	} else if (postCharCount >= characterLimit * 0.8) {
		postCharCounter.style.color = 'orange'
	} else {
		postCharCounter.style.color = '#444444'
	}

	if (postCharCount <= 0) {
		postBtn.setAttribute('disabled', 'disabled')
	} else {
		postBtn.removeAttribute('disabled')
	}
})

if (postCharCount <= 0) {
	postBtn.setAttribute('disabled', 'disabled')
} else {
	postBtn.removeAttribute('disabled')
}
