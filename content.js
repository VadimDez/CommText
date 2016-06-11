/**
 * Created by Vadym Yatsyuk on 11/06/16
 */

chrome.storage.sync.get('Color', function (result) {
  color = result.Color;
});

function sendMessage(message, cb) {
  chrome.runtime.sendMessage(message, cb);
}

chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.action) {
    case "highlight": highlight();
      break;
  }
});

function highlight() {
  var selObj = window.getSelection();
  var highlightedText = {};
  highlightedText.text = selObj.toString();
  highlightedText.xPath = getElementXPath();
  var range = selObj.getRangeAt(0);
  var selectionContents = range.extractContents();
  var span = document.createElement("span");
  span.appendChild(selectionContents);
  span.style.backgroundColor = "yellow";
  range.insertNode(span);
}

function getElementXPath() {
  var element = window.getSelection().anchorNode.parentNode;
  if (element != null && element != undefined) {
    if (element && element.id) {
      return '//*[@id="' + element.id + '"]';
    }

    return getElementTreeXPath(element);
  }
}


function getElementTreeXPath(element) {
  var paths = [];

  // Use nodeName (instead of localName) so namespace prefix is included (if any).
  for (; element && element.nodeType == 1; element = element.parentNode) {
    var index = 0;
    for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
      // Ignore document type declaration.
      if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
        continue;

      if (sibling.nodeName == element.nodeName)
        ++index;
    }

    var tagName = element.nodeName.toLowerCase();
    var pathIndex = (index ? "[" + (index + 1) + "]" : "");
    paths.splice(0, 0, tagName + pathIndex);
  }

  // Save the xpath
  return paths.length ? "/" + paths.join("/") : null;
}