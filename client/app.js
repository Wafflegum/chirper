const createPost = document.getElementById('createPost')
const postCharCounter = document.getElementById('postCharCounter')
const postBtn = document.getElementById('postBtn')

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

function formatDate(date) {
	var d = new Date(date),
		month = '' + (d.getMonth() + 1),
		day = '' + d.getDate(),
		year = d.getFullYear()

	if (month.length < 2) month = '0' + month
	if (day.length < 2) day = '0' + day

	return [year, month, day].join('-')
}
