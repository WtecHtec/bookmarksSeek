import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import cssText from 'data-text:~content.css';
import { CLEAR_ICON, ICON_WEB_ITEM, LineSpinnerIcon } from './icons'
import { Command } from 'cmdk'
import { clearBookMarks, getBookmarkData, getPageStatus } from "~model";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}
export const getStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText;
	return style;
};





export default function InitContent() {
	const [open, setOpen] = useState(false)
	const [displayData, setDisplayData] = useState([])
	const [tip, setTip] = useState('default')
	const [searchKey, setSearchKey] = useState('')
	useEffect( () => {
		if (open) {
			setTip('loading');
			getBookmarkData().then((data: any) => {
				let [result,] = data || [];
				if (Array.isArray(result) && result.length) {
					result = result.sort((a, b ) => b.dateAdded - a.dateAdded)
					result = result.sort((a, b ) => b.dateLastUsed - a.dateLastUsed)	
					setDisplayData(result);
					setTip('default')
				}
			})
		}

		const handelMsgBybg = (request, sender, sendResponse) => {
			const { action } = request;
			if (action === 'active_extention_launcher') {
					setOpen(!open);
			}
			// 发送响应
				sendResponse({ result: 'Message processed in content.js' });
		};
		chrome.runtime.onMessage.addListener(handelMsgBybg);
		return  () => {
			chrome.runtime.onMessage.removeListener(handelMsgBybg);
		}
	}, [open])




	const closeMask = (e) => {
		e.target.className === 'snap-seek-mask' && setOpen(false);
	}

	const handleClear = async () => {
		setTip('loading')
		await clearBookMarks()
		setTip('default')
	}


	return ( <>
		 { !open ? null : <div className="snap-seek-mask" onClick={ closeMask }>
				<Command>
					<Command.Input onValueChange={ (value) => {  setSearchKey(value); }}  placeholder="Search content." />
					<Command.List>
						<Command.Empty> No results found. </Command.Empty>
						{
								displayData.length && !searchKey
								? displayData.slice(0, 12 ).map( (item) => <Command.Item hidden={ !!searchKey === true } key={item.id} value={item} onSelect={ ()=> {
									window.open(item.url, '_blank')
								}} keywords={[item.url, item.path, item.title]}>	
									<div className="snap-seek-item"> 
										<ICON_WEB_ITEM/>
										<div className="snap-seek-item-title">{item.title}</div>	
										<a href={item.url} target="_blank" className="snap-seek-item-url"> { item.url }</a> 
									</div>
									<div className="snap-seek-text-content">{item.path}</div>
								</Command.Item> )
								: null
						}
						{
								displayData.length 
								? displayData.map( (item) => <Command.Item hidden={ !!searchKey === false } key={item.id} value={item} onSelect={ ()=> {
									window.open(item.url, '_blank')
								}} keywords={[item.url, item.path, item.title]}>	
									<div className="snap-seek-item"> 
										<ICON_WEB_ITEM/>
										<div className="snap-seek-item-title">{item.title}</div>	
										<a href={item.url} target="_blank" className="snap-seek-item-url"> { item.url }</a> 
									</div>
									<div className="snap-seek-text-content">{item.path}</div>
								</Command.Item> )
								: null
						}
						{/* <Command.Group heading="Command">
							<Command.Item key="clear" onSelect={ () => handleClear()} keywords={['clear', 'Clear BookMarks']}>
							<div className="snap-seek-item"> 
										<CLEAR_ICON/>
										<div className="snap-seek-item-title">Clear</div>	
									</div>
									<div className="snap-seek-text-content">Clear invalid bookmarks with one click</div>
							</Command.Item>
						</Command.Group> */}
					</Command.List>
					<div cmdk-motionshot-footer="">
							<div  className="cmdk-motionshot-footer-tip">
								<AnimatePresence>
									 <motion.div
										key={tip}
										initial={{ opacity: 0}}
										animate={{ opacity: 1,}}
										exit={{ opacity: 0, }}
										transition={{ duration: 0.1 }}
									>
										{
											tip === 'default' ? 	<a href="https://github.com/WtecHtec/bookmarksSeek" target="_blank" rel="noopener noreferrer"> GitHub</a> : null
										}
										 {
										 	tip === 'loading' ?  <LineSpinnerIcon></LineSpinnerIcon> : null
										 }
									</motion.div> 
								</AnimatePresence>
							</div>
							<div onClick={ () => handleClear()} className="clear-icon" title="Clear invalid bookmarks with one click"> 	<CLEAR_ICON ></CLEAR_ICON></div>
					</div>
				</Command>
			</div>}
	 </>	
	)
}


