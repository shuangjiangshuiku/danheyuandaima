(function() {

	"use strict";

	var d = document;

	var tableWrappers = d.querySelectorAll(".table-wrapper");

	var tablesVisibleCheckbox = d.querySelectorAll('.table-visible-checkbox');

	tablesVisibleCheckbox[0].addEventListener('change', function() { showHideTables(this); });
	tablesVisibleCheckbox[1].addEventListener('change', function() { showHideTables(this); });
	tablesVisibleCheckbox[2].addEventListener('change', function() { showHideTables(this); });
	tablesVisibleCheckbox[3].addEventListener('change', function() { showHideTables(this); });

	var copyButtons = d.querySelectorAll('.copy-btn');
	
	copyButtons[0].addEventListener('click', function() { copyText(rawDisplay, this) });
	copyButtons[1].addEventListener('click', function() { copyText(beautifiedDisplay, this) });
	copyButtons[2].addEventListener('click', function() { copyText(renderedDisplay, this) });
	copyButtons[3].addEventListener('click', function() { copyText(diffDisplay, this) });
	
	var fetchAsMobile = d.getElementById('as-mobile-checkbox');
	var fetchAsGoogle = d.getElementById('as-google-checkbox');
	var fetchAsBtn = d.getElementById('fetch-as-btn');
	
	//all 4 tables'
	var tables = d.querySelectorAll('table');
	
	//individual
	var rawDisplay = d.getElementById('raw-display');
	var beautifiedDisplay = d.getElementById('beautified-display');
	var renderedDisplay = d.getElementById('rendered-display');
	var diffDisplay = d.getElementById('diff-display');
	
	//all table headings
	var tableHeadElAll = d.querySelectorAll('.table-head');
	var tableTop = tableHeadElAll[0].getBoundingClientRect().top;

	var urlInput = d.getElementById('url-input');
	var viewCodeBtn = d.getElementById('view-code-btn');
	var openPageLink = d.getElementById('open-page-link');
	var originalURL = null; // 原始标签页的 URL
	var inputMode = false;  // 是否为输入网址模式（无渲染后数据）
	
	var rawStatus = d.getElementById('raw-status');
	var beautifiedStatus = d.getElementById('beautified-status');
	var renderedStatus = d.getElementById('rendered-status');
	var diffStatus = d.getElementById('diff-status');


	// var fetchTypeRaw = d.getElementById('fetch-type-raw');
	// var fetchTypeRendered = d.getElementById('fetch-type-rendered');


	//get tabID from URL parameter
	var thisURL = new URL(window.location.href);
	var tabID = thisURL.searchParams.get("tabID");

	// 无 tabID 时，设置为纯输入模式
	if (!tabID) {
		inputMode = true;
		originalURL = null;
		rawURL = '';
		d.title = '单合源代码';
		updateOpenPageLink('');
		renderedStatus.innerHTML = '<span style="color:#888;">输入网址模式不支持渲染后对比，请点击"打开网页"在页面中启动插件</span>';
		showHideTables();
	}

	var doctype, userAgent, responseRaw, responseRendered, rawURL;
	var allDiffItems, allDiffItemsPos = [];

	var diffWorker = new Worker('diffWorker.js');

	//var highlightStyle = d.getElementById('highlight-style')
	//var theme = d.getElementById('theme');

	var backToTop = d.getElementById('back-to-top');
	backToTop.addEventListener('click', function() { window.scrollTo(0, 0); });

	var tipsArr = [
		'提示：也可以通过 Ctrl+Shift+U 快捷键启动单合源代码',
		'提示：右键任意页面选择"查看单合源代码"即可',
		'提示：可以通过"显示/隐藏"来隐藏不需要的面板',
		'提示：渲染源码在扩展启动时捕获',
		'提示：初级规范面板经过格式化，显示格式可能与实际源码不完全一致'
	];

	
	//restore settings from storage
	chrome.storage.sync.get({
		//defaults
		tableActiveRaw: false,
		tableActiveBeautified: true,
		tableActiveRendered: false,
		tableActiveDiff: false
	}, function(items) {
		tablesVisibleCheckbox[0].checked = items.tableActiveRaw;
		tablesVisibleCheckbox[1].checked = items.tableActiveBeautified;
		tablesVisibleCheckbox[2].checked = items.tableActiveRendered;
		tablesVisibleCheckbox[3].checked = items.tableActiveDiff;
		showHideTables();
	});

	
	if (tabID) {
	chrome.tabs.get(parseInt(tabID), function (tab) {

		//for some reason there's no way to query if a tab still exists so have to look for error
		if (chrome.runtime.lastError) {
			alert('错误：原始标签页已关闭。请重新加载原始标签页并再次启动扩展。');
			return
		}

		//get URL of tab that opened us so we can fetch raw source
		rawURL = tab.url;
		originalURL = tab.url;
		urlInput.value = tab.url;
		d.title = '单合源代码: ' + rawURL.substring(0, 150);
		updateOpenPageLink(rawURL);
		inputMode = false;

		var doctypeKey = "danheyuandaimadoctype|" + tabID;
		var userAgentKey = "danheyuandaimaua|" + tabID;
		var renderedDOMKey = "danheyuandaima|" + tabID;

		chrome.storage.local.get(doctypeKey, function(result) {
			doctype = result[doctypeKey];
		});

		chrome.storage.local.get(userAgentKey, function(result) {
			userAgent = result[userAgentKey];

			//Detect if mobile
			if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0,4))) {
				
				// fetchTypeRendered.innerHTML = 'Chrome, Mobile <div class="tooltip" style="width:15px; height:15px; font-size:14px; font-weight:800">i <span class="tooltiptext">To render as a mobile device, <a href="https://developers.google.com/web/tools/chrome-devtools/device-mode/emulate-mobile-viewports" target="_blank">change the device in Chrome DevTools</a> and re-launch extension</span></div>';
				// fetchAsMobile.checked = true;
			} else {
				// fetchTypeRendered.innerHTML = 'Chrome, Desktop <div class="tooltip" style="width:15px; height:15px; font-size:14px; font-weight:800">i <span class="tooltiptext">To render as a mobile device, <a href="https://developers.google.com/web/tools/chrome-devtools/device-mode/emulate-mobile-viewports" target="_blank">change the device in Chrome DevTools</a> and re-launch extension</span></div>';
			}
			
		});


		//now get Blob URL of rendered source 
		chrome.storage.local.get(renderedDOMKey, function(result) {
			var renderedBlobURL = result[renderedDOMKey];
			fetchSource(renderedBlobURL, 'rendered');
			fetchSource(rawURL, 'raw');
		});
	});
	} // end if (tabID)


	//show a random tip
	d.getElementById('tips').innerHTML = tipsArr[Math.floor(Math.random() * tipsArr.length)];

	function saveSettings() {
		chrome.storage.sync.set({
			tableActiveRaw: tablesVisibleCheckbox[0].checked,
			tableActiveBeautified: tablesVisibleCheckbox[1].checked,
			tableActiveRendered: tablesVisibleCheckbox[2].checked,
			tableActiveDiff: tablesVisibleCheckbox[3].checked
		});
	}

	
	function createXHRRetry() {
		var xhrRetry = d.getElementById('xhr-retry');
		xhrRetry.addEventListener('click', function(e) {
			e.preventDefault();
			fetchSource(rawURL, 'raw');
		});
	}


	function calcDiffItemsPos() {

		//there may be no diff items yet, so don't try and grab their positions until that array exists (in doDiff())
		if(typeof allDiffItems == "undefined") {
			return;
		}

		//an empty array
		allDiffItemsPos = [];

		//loop and grab vertical position of all differences so we can know know when we scroll past them
		for(var i=0; i<allDiffItems.length; i++) {
			allDiffItemsPos.push(allDiffItems[i].getBoundingClientRect().top);
		}
	}


	//show/hide tables based on checkboxes preference (max 3 of 4)
	function showHideTables(changedCheckbox) {

		// Enforce max 3 selections
		var checkedCount = 0;
		tablesVisibleCheckbox.forEach(function(c) {
			if(c.checked) checkedCount++;
		});

		if(checkedCount > 3) {
			if(changedCheckbox) {
				changedCheckbox.checked = false;
			} else {
				// When restoring from storage, uncheck the last one
				var lastChecked = null;
				tablesVisibleCheckbox.forEach(function(c) {
					if(c.checked) lastChecked = c;
				});
				if(lastChecked) lastChecked.checked = false;
			}
			checkedCount = 3;
		}

		// 输入模式下，强制取消渲染后和差异的勾选
		if (inputMode) {
			tablesVisibleCheckbox[2].checked = false; // 渲染后
			tablesVisibleCheckbox[3].checked = false; // 差异
		}

		saveSettings();

		var n = checkedCount;

		// 输入模式下，渲染后和差异不算入已选数量
		if (inputMode) {
			n = 0;
			tablesVisibleCheckbox.forEach(function(c, i) {
				if (c.checked && i < 2) n++; // 只统计源代码和初级规范
			});
		}

		if(n == 0) {
			d.getElementById('no-panels-selected').innerHTML = '未选择任何面板';
		} else {
			d.getElementById('no-panels-selected').innerHTML = '';
		}

		if(n == 1) {
			var width = 99.2;
		} else {
			var width = 97.5 / n;
		}

		tablesVisibleCheckbox.forEach(function(c, i) {
			if(c.checked) {
				tableWrappers[i].style.width = width + '%';
				tableHeadElAll[i].style.width = width + '%';
				tableWrappers[i].style.display = '';
			} else {
				tableWrappers[i].style.display = 'none';
			}
		});

		// 输入模式下，额外强制隐藏渲染后和差异面板
		if (inputMode) {
			tableWrappers[2].style.display = 'none';
			tableWrappers[3].style.display = 'none';
		}

		//recalculate new vertical positions of <ins>/<del> as they will have shifted
		calcDiffItemsPos();

	};


	/*
	theme.addEventListener('change', function() {
		if(this.checked) {
			highlightStyle.setAttribute('href', 'dark.css');
		} else {
			highlightStyle.setAttribute('href', 'light.css');
		}
	});
	*/

	function copyText(el, buttonClicked) {
		var range = d.createRange();
		var sel = window.getSelection();
		sel.removeAllRanges();
		range.selectNodeContents(el);
		sel.addRange(range);
		d.execCommand('copy');
		sel.removeAllRanges();
		buttonClicked.innerHTML = '已复制';
		setTimeout(function() {
			buttonClicked.innerHTML = '复制';
		}, 1300);
	}


	// fetchAsBtn.addEventListener('click', function(e) {
	// 	fetchSource(rawURL, 'raw');
	// });

	function changeClassAll(elArr, type, classname) {

		for(var i=0; i < elArr.length; i++) {
			
			if(type == 'add') {
				elArr[i].classList.add(classname);
			} else {
				elArr[i].classList.remove(classname);
			}
		}
	}

	function nowScrolling() {

		//if(allDiffItemsPos.length === 0) {
		//	return;
		//}
		
		var count = 0;

		//stick/remove headings on scroll
		if (window.pageYOffset >= tableTop - 26) {

			//stick headings
			changeClassAll(tableHeadElAll, 'add', 'sticky');

			//sticky headings (position:fixed) leave page flow so add fake margin to top of table to prevent weird jump 
			changeClassAll(tables, 'add', 'table-prevent-jump');

		} else {
			changeClassAll(tableHeadElAll, 'remove', 'sticky');
			changeClassAll(tables, 'remove', 'table-prevent-jump');
		}

		//check current scroll pos againt position of each diff to update count
		for(var i=0; i < allDiffItemsPos.length; i++) {
			if(window.pageYOffset + 43 >= allDiffItemsPos[i]) {
				count++;
				d.getElementById('diff-count-current').innerHTML = count;
			} else {
				d.getElementById('diff-count-current').innerHTML = count;
				count = 0;
				
				//stop looking ahead as there can't be any more til next scroll
				break;
			}
		}

		//back to top
		if (window.pageYOffset >= 800) {
			backToTop.style.display = 'block';
		} else {
			backToTop.style.display = 'none';
		}
	};

	//execute when window is scrolled
	window.onscroll = nowScrolling;

	// 动态计算顶部栏高度，设置 CSS 变量供 sticky 表头使用
	function updateStickyVars() {
		var topBar = d.getElementById('top');
		if (!topBar) return;
		var topBarH = topBar.offsetHeight;
		var tableHeadH = tableHeadElAll[0] ? tableHeadElAll[0].offsetHeight : 37;
		document.documentElement.style.setProperty('--top-bar-h', topBarH + 'px');
		document.documentElement.style.setProperty('--sticky-offset', tableHeadH + 'px');
	}
	updateStickyVars();
	window.addEventListener('resize', updateStickyVars);


	function decodeHtml(html) {
		// 如果原始HTML已经包含DOCTYPE，直接返回；否则补上
		if (/^\s*<!DOCTYPE/i.test(html)) {
			return html;
		}
		return (doctype || '') + "\n" + html;
	}

	function strContains(haystack, needle) {
		if(haystack.indexOf(needle) == -1) {
			return false;
		} else {
			return true;
		}
	}

	//raw and rendered could be ready in any order. This is called after each one loaded to check if both are ready to perform diff. Bit of a hack but hey.
	function readyToDiff() {
		if(responseRaw && responseRendered) {
			return true;
		}
		return false;
	}

	function highlightHtml(line) {
		// 0. 先提取URL，替换为占位符，避免后续HTML转义和高亮破坏URL
		var urls = [];
		var urlRegex = new RegExp('((?:https?:)?//[^\\s"\'<>]+)', 'g');
		line = line.replace(urlRegex, function(match) {
			urls.push(match);
			return '\u0000URL' + (urls.length - 1) + '\u0000';
		});

		// 1. HTML转义
		var escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

		// 1.5 高亮注释: <!-- ... --> 或 /* ... */
		var comments = [];
		escaped = escaped.replace(/&lt;!--.*?--&gt;/g, function(match) {
			comments.push(match);
			return '\u0000COMMENT' + (comments.length - 1) + '\u0000';
		});
		escaped = escaped.replace(/\/\*.*?\*\//g, function(match) {
			comments.push(match);
			return '\u0000COMMENT' + (comments.length - 1) + '\u0000';
		});

		// 2. 高亮标签名: &lt;tagname 或 &lt;/tagname
		escaped = escaped.replace(/(&lt;\/?)([\w:-]+)/g, '$1<span class="hl-tag">$2</span>');

		// 3. 高亮属性名: 空格+属性名=  (属性名后跟 &quot; 或 &#39;)
		escaped = escaped.replace(/(\s)([\w:-]+)(=&quot;|=&#39;)/g, '$1<span class="hl-attr">$2</span>$3');

		// 4. 高亮style属性内联样式中的CSS属性和值
		// 先提取style属性的值，用占位符替换
		var inlineStyles = [];
		escaped = escaped.replace(/(<span class="hl-attr">style<\/span>=&quot;)(.*?)(&quot;)/g, function(match, prefix, styleValue, suffix) {
			var idx = inlineStyles.length;
			inlineStyles.push(styleValue);
			return prefix + '\u0000STYLE' + idx + '\u0000' + suffix;
		});

		// 5. 高亮属性值(双引号): ="value"
		escaped = escaped.replace(/(=&quot;)(.*?)(&quot;)/g, '$1<span class="hl-value">$2</span>$3');

		// 6. 高亮属性值(单引号): ='value'
		escaped = escaped.replace(/(=&#39;)(.*?)(&#39;)/g, '$1<span class="hl-value">$2</span>$3');

		// 7. 恢复style内联样式的CSS高亮（在属性值高亮之后）
		if (inlineStyles.length > 0) {
			var stylePlaceholderRegex = new RegExp('\\u0000STYLE(\\d+)\\u0000', 'g');
			escaped = escaped.replace(stylePlaceholderRegex, function(match, idx) {
				var styleValue = inlineStyles[parseInt(idx)];
				// 对style值进行CSS属性/值的高亮
				var highlightedStyle = highlightInlineStyle(styleValue);
				return '<span class="hl-value">' + highlightedStyle + '</span>';
			});
		}

		// 8. 恢复注释高亮
		if (comments.length > 0) {
			var commentRegex = new RegExp('\\u0000COMMENT(\\d+)\\u0000', 'g');
			escaped = escaped.replace(commentRegex, function(match, idx) {
				return '<span class="hl-comment">' + comments[parseInt(idx)] + '</span>';
			});
		}

		// 9. 将URL占位符替换为可点击的链接
		if (urls.length > 0) {
			var placeholderRegex = new RegExp('\\u0000URL(\\d+)\\u0000', 'g');
			escaped = escaped.replace(placeholderRegex, function(match, idx) {
				var url = urls[parseInt(idx)];
				var href = (/^https?:\/\//.test(url)) ? url : ('https:' + url);
				var escHref = href.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
				var escText = url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
				return '<a href="' + escHref + '" target="_blank" rel="noopener" class="url-link">' + escText + '</a>';
			});
		}

		return escaped;
	}

	// 内联style属性的CSS高亮辅助函数
	function highlightInlineStyle(styleValue) {
		// styleValue 已经是HTML转义后的内容（但不含引号）
		// 进行CSS属性名和值的区分高亮
		var result = styleValue;
		
		// 匹配CSS属性名: 冒号前的属性名
		// 格式: 属性名:值;属性名:值;...
		result = result.replace(/([\w-]+)(:)/g, function(match, propName, colon) {
			return '<span class="hl-attr">' + propName + '</span>' + colon;
		});
		
		// 匹配CSS属性值: 冒号后到分号前的值
		// 排除已经被属性名高亮覆盖的部分
		result = result.replace(/(<\/span>:)([^;<]+)([;]|$)/g, function(match, colonPart, value, endChar) {
			return colonPart + '<span class="hl-value">' + value + '</span>' + endChar;
		});
		
		return result;
	}

	// CSS 语法高亮函数
	function highlightCss(line) {
		// 0. 先提取URL，替换为占位符
		var urls = [];
		var urlRegex = new RegExp('((?:https?:)?//[^\\s"\'<>]+)', 'g');
		line = line.replace(urlRegex, function(match) {
			urls.push(match);
			return '\u0000URL' + (urls.length - 1) + '\u0000';
		});

		// 1. HTML转义
		var escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

		// 2. 高亮CSS注释: /* ... */
		var comments = [];
		escaped = escaped.replace(/\/\*.*?\*\//g, function(match) {
			comments.push(match);
			return '\u0000COMMENT' + (comments.length - 1) + '\u0000';
		});

		// 3. 高亮CSS选择器（在 { 之前的内容）
		// 选择器可以包含: tag名, #id, .class, :pseudo, [attr], >, +, ~, 空格, ,
		// 匹配从行首到 { 之间的内容
		escaped = escaped.replace(/^([\s]*)([^{}]+)(\{)/, function(match, prefix, selector, brace) {
			// 高亮选择器中的每一个选择器部分
			var highlightedSelector = selector.replace(/([.#]?[\w-]+)([:\[\(][^\s,{]*)?/g, function(selMatch, selName, selSuffix) {
				// 只高亮真正的选择器名称（排除逗号、空格等分隔符）
				if (/^[.#]?[\w-]+$/.test(selName) || /^[.#]?[\w-]+[:\[]/.test(selMatch)) {
					return '<span class="hl-tag">' + selMatch + '</span>';
				}
				return selMatch;
			});
			return prefix + highlightedSelector + brace;
		});

		// 4. 高亮CSS属性名: property:value
		// 属性名格式: {、;或空格+属性名+冒号
		escaped = escaped.replace(/([{\s;])([\w-]+)(:)/g, function(match, prefix, propName, colon) {
			return prefix + '<span class="hl-attr">' + propName + '</span>' + colon;
		});

		// 5. 高亮CSS属性值（双引号字符串）: "value"
		escaped = escaped.replace(/:&quot;(.*?)(&quot;)/g, ':<span class="hl-value">$1</span>$2');

		// 6. 高亮CSS属性值（单引号字符串）: 'value'
		escaped = escaped.replace(/:&#39;(.*?)(&#39;)/g, ':<span class="hl-value">$1</span>$2');

		// 7. 高亮CSS属性值（无引号值）: 值部分（在 : 后面，; 前面）
		// 匹配:冒号后面，到分号或}之间的内容
		escaped = escaped.replace(/(:)([^:;{}&"]+)([;}])/g, function(match, colon, value, endChar) {
			// 排除已经处理过的（包含引号的情况）
			if (!value.includes('&quot;') && !value.includes('&#39;')) {
				return colon + '<span class="hl-value">' + value + '</span>' + endChar;
			}
			return match;
		});

		// 8. 恢复注释高亮
		if (comments.length > 0) {
			var commentRegex = new RegExp('\\u0000COMMENT(\\d+)\\u0000', 'g');
			escaped = escaped.replace(commentRegex, function(match, idx) {
				return '<span class="hl-comment">' + comments[parseInt(idx)] + '</span>';
			});
		}

		// 9. 替换URL占位符为可点击链接
		if (urls.length > 0) {
			var placeholderRegex = new RegExp('\\u0000URL(\\d+)\\u0000', 'g');
			escaped = escaped.replace(placeholderRegex, function(match, idx) {
				var url = urls[parseInt(idx)];
				var href = (/^https?:\/\//.test(url)) ? url : ('https:' + url);
				var escHref = href.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
				var escText = url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
				return '<a href="' + escHref + '" target="_blank" rel="noopener" class="url-link">' + escText + '</a>';
			});
		}

		return escaped;
	}

	function intoTableRows(str, type) {

		var rows = '';
		var openInsTag = false;
		var openDelTag = false;
		var inStyleTag = false;  // 跟踪是否在 <style> 标签内

		var diffLines = '';

		//split by new line into array
		str = str.split("\n");

		//loop lines and concatenate table rows string
		str.forEach(function(line, index) {

			// 跟踪 style 标签状态
			if (type != 'diff') {
				if (/<style[\s>]/i.test(line) || /<style[^>]*>$/i.test(line)) {
					// 开始 style 标签，从这里开始在 style 内
					inStyleTag = true;
				}
				if (/<\/style>/i.test(line)) {
					// 结束 style 标签
					inStyleTag = false;
				}
			}

			//diff string has <ins> / <del> we want to preserve, so simply wrap line in table rows without escaping
			if(type == 'diff') {

				if(openInsTag) {
					if(!strContains(line, '</ins>')) {
						line = '<ins>' + line + '</ins>';
					} else {

						//prevent lines with empty <ins></ins> which mess up the difference count
						if(line.trim().indexOf("</ins>") > 0) {
							line = '<ins>' + line;
						}
						openInsTag = false;
					}
				}

				if(openDelTag) {
					if(!strContains(line, '</del>')) {
						line = '<del>' + line + '</del>';
					} else {
						if(line.trim().indexOf("</del>") > 0) {
							line = '<del>' + line;
						}
						openDelTag = false;
					}
				}

				//if we have an open <ins>, but no closing </ins> on this line then it must be closed on later lines
				//Set flag that <ins> is open so we know to wrap later lines in <ins> too  
				if(strContains(line, '<ins>') && !strContains(line, '</ins>')) {
					openInsTag = true;
				}

				if(strContains(line, '<del>') && !strContains(line, '</del>')) {
					openDelTag = true;
				}

				rows += '<tr><td class="line-html-diff"><span class="line-num">' + (index + 1) + '</span><div class="line-content">' + line + "\n</div></td></tr>";
				diffLines += line + "\n";
		
			//else it's raw, beautified or rendered table
			} else {
				// 如果在 style 标签内，使用 CSS 高亮
				if (inStyleTag) {
					rows += '<tr><td class="line-html"><span class="line-num">' + (index + 1) + '</span><div class="line-content">' + highlightCss(line) + "\n</div></td></tr>";
				} else {
					rows += '<tr><td class="line-html"><span class="line-num">' + (index + 1) + '</span><div class="line-content">' + highlightHtml(line) + "\n</div></td></tr>";
				}
			}
		});

		return rows;
	}

	
	function fetchSource(url, type) {

		var loadingMessage = '<img src="loading.gif" />';

		//cache buster
		if(type === 'raw') {
			if(url.indexOf('?') == -1) {
				var separator = '?';
			} else {
				var separator = '&';
			}
			//url = url + separator + Math.round(new Date().getTime() / 1000);
			
			//emulate HTTP status codes
			//url = 'https://httpstat.us/200?sleep=5000';
		}

		
		//ajax request
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.timeout = 10000;
		xhr.responseType = 'text';

		//set header flag for background page to pick up to know what UA to set.
		//Can't just set UA here due to browser restriction. Have to modify existing headers just before sent.
		// if(fetchAsMobile.checked && fetchAsGoogle.checked) {
		// 	xhr.setRequestHeader('X-VRS-Override-UA', 'Google-Mobile');
		// 	fetchTypeRaw.innerHTML = 'Googlebot Mobile';
		
		// } else if(fetchAsMobile.checked) {
		// 	xhr.setRequestHeader('X-VRS-Override-UA', 'Chrome-Mobile');
		// 	fetchTypeRaw.innerHTML = 'Chrome, Mobile';
		
		// } else if(fetchAsGoogle.checked) {
		// 	xhr.setRequestHeader('X-VRS-Override-UA', 'Google-Desktop');
		// 	fetchTypeRaw.innerHTML = 'Googlebot Desktop';
		// } else {
		// 	fetchTypeRaw.innerHTML = 'Chrome, Desktop';
		// }


		if(type === 'raw') {
			rawDisplay.innerHTML = '';
			beautifiedDisplay.innerHTML = '';
			diffDisplay.innerHTML = '';
			rawStatus.innerHTML = loadingMessage;
			beautifiedStatus.innerHTML = loadingMessage;
			diffStatus.innerHTML = loadingMessage;

		} else if(type === 'rendered') {
			renderedStatus.innerHTML = loadingMessage;
		}
		
		xhr.onload = function(e) {

			if(type === 'raw') {
				rawStatus.innerHTML = '&nbsp;';
				beautifiedStatus.innerHTML = '&nbsp;';
				
			} else if(type === 'rendered') {
				renderedStatus.innerHTML = '&nbsp;';
			}

			if (this.readyState === 4 && this.status === 200) {

				// 源代码面板：未经美化，只做 decodeHtml（DOM 序列化）
				var rawResponse = decodeHtml(this.response);
				
				// 初级规范面板：经过格式化
				var beautifiedResponse = html_beautify(rawResponse, {
											  "indent_size": "1",
											  "indent_char": "\t",
											  "max_preserve_newlines": "-1",
											  "preserve_newlines": false,
											  "keep_array_indentation": false,
											  "break_chained_methods": false,
											  "indent_scripts": "normal",
											  "brace_style": "collapse",
											  "space_before_conditional": true,
											  "unescape_strings": false,
											  "jslint_happy": false,
											  "end_with_newline": false,
											  "wrap_line_length": "0",
											  "indent_inner_html": true,
											  "comma_first": false,
											  "e4x": false
											});	
				
				if(type === 'raw') {
					responseRaw = beautifiedResponse;
					rawDisplay.innerHTML = intoTableRows(rawResponse, 'raw');
					beautifiedDisplay.innerHTML = intoTableRows(beautifiedResponse, 'beautified');

				} else if(type === 'rendered') {
					responseRendered = beautifiedResponse;
					renderedDisplay.innerHTML = intoTableRows(beautifiedResponse, 'rendered');
				}

				if(readyToDiff()) {
					doDiff(responseRaw, responseRendered);
				}


			//there was a response but not a 200 OK, must be an error
			} else {


				if(type === 'raw') {
					//Cloudflare block user-agent spoofing as Google.
					if(this.getResponseHeader("server").toLowerCase() === 'cloudflare') {
						rawStatus.innerHTML = '<span class="error">获取原始源码出错。"HTTP ' + this.status + '"。被 Cloudflare 拦截。<a href="https://support.cloudflare.com/hc/en-us/articles/217074967-How-do-I-control-IP-access-to-my-site-" target="_blank">在此将 IP 加入白名单</a>。</span>';
						beautifiedStatus.innerHTML = '';
					} else {
						rawStatus.innerHTML = '<span class="error">获取原始源码出错。"HTTP ' + this.status + '": ' + this.statusText + '"。<a id="xhr-retry" href="#">重试？</a></span>';
						beautifiedStatus.innerHTML = '';
						//bind Retry event to new Retry link
						createXHRRetry();
					}
					
					//clear loading message
					diffStatus.innerHTML = '';
				}
				
			}
		}

		xhr.ontimeout = function(e) {
			if(type === 'raw') {
				rawStatus.innerHTML = '<span class="error">超时。10 秒内未获取到原始源码响应。<a id="xhr-retry" href="#">重试？</a></span>';
				beautifiedStatus.innerHTML = '';
				diffStatus.innerHTML = '';
				createXHRRetry();
			}
		};

		xhr.onerror = function(e) {
			if(type === 'raw') {
				rawStatus.innerHTML = '<span class="error">获取原始源码时网络错误。请确认已联网。<a id="xhr-retry" href="#">重试？</a></span>';
				beautifiedStatus.innerHTML = '';
				diffStatus.innerHTML = '';
				createXHRRetry();
	
			} else if(type === 'rendered') {
				renderedStatus.innerHTML = '<span class="error">获取渲染后源码出错。请返回页面重新启动"单合源代码"</span>';
				diffStatus.innerHTML = '';
			}
		};

		xhr.send();
	}



	function doDiff(str1, str2) {

		diffWorker.postMessage([str1, str2]);

		diffWorker.onmessage = function(e) {

			var diffs = e.data;

			var fragment = d.createDocumentFragment();

			for(var i=0; i < diffs.length; i++) {

				if (diffs[i].added && diffs[i + 1] && diffs[i + 1].removed) {
					var swap = diffs[i];
					diffs[i] = diffs[i + 1];
					diffs[i + 1] = swap;
				}

				var node;
				if (diffs[i].removed) {
					node = d.createElement('del');
					node.appendChild(d.createTextNode(diffs[i].value));

				} else if (diffs[i].added) {
					node = d.createElement('ins');
					node.appendChild(d.createTextNode(diffs[i].value));

				} else {
					node = d.createTextNode(diffs[i].value);
				}
				fragment.appendChild(node);
			}

			//create temporary <div> and append the fragment, then grab the innerHTML
			var tempDiv = d.createElement('div');
			tempDiv.appendChild(fragment);
			var diffHTML = tempDiv.innerHTML;
			diffStatus.innerHTML = '';

			diffDisplay.innerHTML = intoTableRows(diffHTML, 'diff');

		/*
			//raw and rendered now ready for syntax highlighting
			var highlight = d.querySelectorAll('.line-html'); //only highlight raw and rendered, not diff due to performance issues when scrolling
			highlight.forEach(function(line) {
				hljs.highlightBlock(line);
			});
		*/

			//count and differences, display count, and get their position from top
			allDiffItems = d.querySelectorAll('ins, del');
			d.getElementById('diff-count-total').innerHTML = allDiffItems.length;
			
			//calculate vertical positions of <ins>/<del>
			calcDiffItemsPos();
		};

	}

	// 更新"打开网页"链接的 href
	function updateOpenPageLink(url) {
		var fullURL = url.trim();
		if (fullURL && !/^https?:\/\//i.test(fullURL)) {
			fullURL = 'https://' + fullURL;
		}
		openPageLink.href = fullURL || '#';
		openPageLink.title = fullURL || '';
	}

	// 从输入框获取有效 URL
	function getInputURL() {
		var url = urlInput.value.trim();
		if (!url) return null;
		if (!/^https?:\/\//i.test(url)) {
			url = 'https://' + url;
		}
		return url;
	}

	// 设置输入模式（无渲染后数据）
	function setInputMode(enabled) {
		inputMode = enabled;
		if (enabled) {
			// 清空渲染后和差异面板内容，显示提示
			renderedDisplay.innerHTML = '';
			diffDisplay.innerHTML = '';
			renderedStatus.innerHTML = '<span style="color:#888;">输入网址模式不支持渲染后对比，请点击"打开网页"在页面中启动插件</span>';
			diffStatus.innerHTML = '';
		} else {
			renderedStatus.innerHTML = '';
			diffStatus.innerHTML = '';
		}
		showHideTables();
	}

	// "查看代码"按钮点击
	viewCodeBtn.addEventListener('click', function() {
		var url = getInputURL();
		if (!url) {
			alert('请输入有效的网址');
			return;
		}
		rawURL = url;
		d.title = '单合源代码: ' + rawURL.substring(0, 150);
		updateOpenPageLink(rawURL);

		// 判断是否为输入模式：URL 与原始标签页不同，或无原始标签页
		var isInputOnly = (originalURL !== null && rawURL !== originalURL) || (originalURL === null);
		setInputMode(isInputOnly);

		// 重新获取原始源码
		fetchSource(rawURL, 'raw');

		// 如果是 tab 模式且 URL 未变，重新获取渲染后数据
		if (!isInputOnly && tabID) {
			var rKey = "danheyuandaima|" + tabID;
			chrome.storage.local.get(rKey, function(result) {
				var renderedBlobURL = result[rKey];
				if (renderedBlobURL) {
					fetchSource(renderedBlobURL, 'rendered');
				}
			});
		}
	});

	// 回车也能触发查看代码
	urlInput.addEventListener('keydown', function(e) {
		if (e.key === 'Enter') {
			viewCodeBtn.click();
		}
	});

	// 输入框内容变化时实时更新"打开网页"链接
	urlInput.addEventListener('input', function() {
		var url = getInputURL();
		updateOpenPageLink(url || '');
	});

})();