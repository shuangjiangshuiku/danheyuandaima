function launchVRS() {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			
		//get current tab position so we can open new tab next to it (at index + 1)
		var tabPosition = tabs[0].index;
		var tabID = tabs[0].id;
		
		chrome.tabs.sendMessage(tabs[0].id, {"message": "Gimme the rendered DOM"}, function(response) {

			if(chrome.runtime.lastError) {
				// Content script not ready or tab invalid, silently ignore
				return;
			}

			if(response) {

					var renderedObjURL = response.payload;
					var renderedStorageKey = "danheyuandaima|" + tabs[0].id;
					var doctypeKey = "danheyuandaimadoctype|" + tabs[0].id;
					var UAKey = "danheyuandaimaua|" + tabs[0].id;
					
					//add reference in storage to blobURL of rendered page
					chrome.storage.local.set({ [renderedStorageKey]: renderedObjURL });
					chrome.storage.local.set({ [doctypeKey]: response.doctype });
					chrome.storage.local.set({ [UAKey]: response.userAgent });

					chrome.tabs.create({ url: 'danheyuandaima.html?tabID=' + tabID, index: tabPosition + 1});
			}

		});
	});
}


//user clicked Browser Action button or used keyboard shortcut
chrome.action.onClicked.addListener(function (info) {
	launchVRS();
});

// create context menu (right click menu) - handle duplicate ID error on restart
chrome.contextMenus.create({
	id: "danheyuandaima_context_menu",
	title: "查看单合源代码 (Alt+U)", 
	contexts:["page"]
}, function() {
	if(chrome.runtime.lastError) {
		// Menu already exists (service worker restart), silently ignore
	}
});

// Listen for the context menu item click
chrome.contextMenus.onClicked.addListener(function(info, tab) {
	if (info.menuItemId === "danheyuandaima_context_menu") {
		launchVRS(); 
	}
});

// Listen for the keyboard shortcut
chrome.commands.onCommand.addListener(function(command) {
	if (command === "_execute_action") {
		launchVRS();
	}
});


function removeStorage(tabId) {
	var renderedDOMKey = "danheyuandaima|" + tabId;
	var doctypeKey = "danheyuandaimadoctype|" + tabId;
	var UAKey = "danheyuandaimaua|" + tabId;
	
	chrome.storage.local.remove([renderedDOMKey, doctypeKey, UAKey]);
}

//tab closed - clean up storage
chrome.tabs.onRemoved.addListener(function(tabId) {
	removeStorage(tabId);
});

chrome.runtime.onInstalled.addListener(function(details) {
	// no longer open install page
});


/*
chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {

	var overrideUA = false;
	
	//spoof a referer - might help one day
	//details.requestHeaders.push({name:'Referer', value:'https://www.example.com/'});
	
	for(var t=0, i = details.requestHeaders.length; t<i; ++t) {

		//looks for custom header to see if HTTP request came from extension, otherwise it will all override all requests made by the browser.
		if (details.requestHeaders[t].name === "X-VRS-Override-UA") {
			overrideUA = true;
			
			switch(details.requestHeaders[t].value) {
				case 'Chrome-Mobile':
					var newUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'; //iPhone X
					break;
				case 'Google-Desktop':
					var newUA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
					break;
				case 'Google-Mobile':
					var newUA = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
					break;
			}
		}

		//looks for custom header to see if request came from extension
		if (overrideUA && details.requestHeaders[t].name === "User-Agent") {
			details.requestHeaders[t].value = newUA;
		}

	}
	
	return { requestHeaders: details.requestHeaders }
}, {
	urls: ["<all_urls>"]
}, ["blocking", "requestHeaders"]);

*/