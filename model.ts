function getBookmarkData() {
	return new Promise(resolve => {
		chrome.runtime.sendMessage( { action: 'GET_BOOKMARKS',},).then( async (data) => {
			if (data && data.data) {
				resolve([data.data, data.ids])
			} else {
				resolve([])
			}
		}).catch((err) => {
			resolve([])
		})
	})	
}

function getPageStatus(results) {
	return new Promise(resolve => {
		chrome.runtime.sendMessage( { action: 'GET_PAGE_STATUS', result: results},).then( async (data) => {
			if (data && data.data) {
				resolve(['', data.data])
			} else {
				resolve(['', {}])
			}
		}).catch((err) => {
			resolve([err, {}])
		})
	})	
}

function clearBookMarks() {
	return new Promise(resolve => {
		chrome.runtime.sendMessage( { action: 'CLEAR_BOOKMARK',},).then( async (data) => {
			resolve(['', true])
		}).catch((err) => {
			resolve([err, false])
		})
	})	
}

export {
	getBookmarkData,
	getPageStatus,
	clearBookMarks
}