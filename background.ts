import { Storage } from "@plasmohq/storage"
import { getArryByTree, getBookmarkPageStatus, getPageInfoStatus } from "~uitls";

const MAX_TIME = 7 * 24 * 60 * 60 * 1000

const trashFolder = {
  parentId: "1",
  title: "Trash",
}
const storage = new Storage({
	area: 'local',
});
const SNAPSEEK_KEY = "snapseek"
const GLOGA_PAGE_INFO_KEY = "GLOGA_PAGE_INFO"
/**
 *  监听快捷指令
 */
chrome.commands.onCommand.addListener((command) => {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			// 向content.js发送消息
			chrome.tabs.sendMessage(tabs[0].id, { action: command }, function (response) {
					console.log(response?.result);
			});
	});
});

async function getBookMarks(sendResponse) {
	const datas = await chrome.bookmarks.getTree()
	const [results, ids] = getArryByTree(datas)
	// console.log('getBookMarks---',datas, results, ids)
	sendResponse({ data: results, ids, statue: true})
}

async function saveSnapSeekData(request, sendResponse) { 
	await storage.set(SNAPSEEK_KEY, request.data)
	sendResponse({ statue: true})
}

async function  getPageStatus(request, sendResponse) {
	const { result, isRefesh } = request
	let res = {}
	const glpages = await storage.get(GLOGA_PAGE_INFO_KEY) || null
	if ((!glpages || isRefesh) && Array.isArray(result) && result.length) {
		const promises = result.map(({ id, url }) => getBookmarkPageStatus(id, url) )
		await Promise.all(promises).then((data) => {
			if (Array.isArray(data)) {
				data.forEach((item: any) => {
					const [, obj] = item
					res = {
						...res,
						...obj,
					}
				})
			}
		})
		await storage.set(GLOGA_PAGE_INFO_KEY, res)
	}
	sendResponse({ statue: true, data: glpages || res })
}

const moveToTrash = (bookmarkId: string, trashId: string) => {
  chrome.bookmarks.move(bookmarkId, { parentId: trashId })
}

async function clearBookMarks(sendResponse) {

	chrome.bookmarks.search({ title: trashFolder.title }, async (trashFolders) => {
    const trashFolderExists = trashFolders.length > 0
    if (trashFolderExists) {
      const trash = trashFolders[0]
      await checkBookmarkStatus(trash)
			sendResponse({status: true})
    } else {
      chrome.bookmarks.create(
        trashFolder,
        async (trash) => {
					await checkBookmarkStatus(trash);
					sendResponse({status: true});
				} 
      )
    }
		
  })

	const checkBookmarkStatus = async (trash: chrome.bookmarks.BookmarkTreeNode) => {
		const bookMarks = await chrome.bookmarks.getTree();
		if (Array.isArray(bookMarks)) {
			console.log('bookMarks---',bookMarks);
			let queues = [...bookMarks];
				while(queues.length > 0) {
					const item = queues.shift();
					if (item.title === 'title') continue;
					if (item.children) {
						queues = [...item.children, ...queues];
					}
					if (item.id && item.url) {
						const [err, res ] =	await getPageInfoStatus(item.id, item.url);
						if (!err && res && res.isDeadBookmark) {
							await moveToTrash(item.id, trash.id);
					}
				}
			}
			console.log('bookMarks--- finished',);
		}
	};

}



chrome.runtime.onMessage.addListener(  (request, sender, sendResponse) => {
	// 获取插件列表
	const { action, } = request;
	switch(action){
		case 'SAVE':
			saveSnapSeekData(request, sendResponse)
			break
		case 'GET_PAGE_STATUS':
			getPageStatus(request, sendResponse);
			break
		case 'GET_BOOKMARKS':
			getBookMarks(sendResponse)
			break
		case 'CLEAR_BOOKMARK':
			clearBookMarks(sendResponse)
			break
		default:
			console.log(`no action: ${action}`)
	}
	return true; // 表示我们将异步发送响应
});