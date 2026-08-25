self.importScripts('diff.js');

self.onmessage = function(e) {
	var diffs = JsDiff.diffLines(e.data[0], e.data[1]);
	postMessage(diffs); 
};