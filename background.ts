import { Storage } from "@plasmohq/storage"
import { getArryByTree, getBookmarkPageStatus, getPageInfoStatus } from "~uitls";

const MAX_TIME = 7 * 24 * 60 * 60 * 1000
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

async function clearBookMarks(sendResponse) {
	const datas = await chrome.bookmarks.getTree()
	const [result, ] = getArryByTree(datas)
	const res = []
	if (Array.isArray(result)) {
		const promises = result.map(({ id, url }) => getPageInfoStatus(id, url) )
		await Promise.all(promises).then(async (data) => {
			if (Array.isArray(data)) {
				for(let i = 0; i < data.length; i++) { 
					const item = data[i] as any;
					const [, obj] = item
					const { isDeadBookmark, id } = obj;
					if (isDeadBookmark) {
						res.push(item)
						await chrome.bookmarks.remove(id)
					}
				}
			}
		})
	}
	sendResponse({ statue: true, data: res })
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