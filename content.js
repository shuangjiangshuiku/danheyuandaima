var DOMLoaded = false;

document.addEventListener("DOMContentLoaded", function(event) {
	DOMLoaded = true;
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

	if(DOMLoaded) {
	
		//Get rendered DOM as string, turn it into an array, then a blob, then create an object URL of the blob which can be passed to background.js. Crikey.
		
		var outerHTML = document.documentElement.outerHTML;

		var doctypeNode = document.doctype;

		var doctype = '';

		if(doctypeNode !== null) {
			doctype =
			"<!DOCTYPE "
				+ doctypeNode.name
				+ (doctypeNode.publicId ? ' PUBLIC "' + doctypeNode.publicId + '"' : '')
				+ (!doctypeNode.publicId && doctypeNode.systemId ? ' SYSTEM' : '') 
				+ (doctypeNode.systemId ? ' "' + doctypeNode.systemId + '"' : '')
			+ '>';
		}

		var renderedDOMString = outerHTML;
		
		var renderedDomArray = [renderedDOMString];
		var renderedBlob = new Blob(renderedDomArray, { type: 'text/plain' });
		var renderedObjURL = URL.createObjectURL(renderedBlob);

		var userAgent = navigator.userAgent;

		//respond back to the background page that invoked us
		sendResponse({ "payload": renderedObjURL, "doctype": doctype, "userAgent": userAgent });
	}
});