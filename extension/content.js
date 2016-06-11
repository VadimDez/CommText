/**
 * Created by Vadym Yatsyuk on 11/06/16
 */
console.log('initialized');
var API = 'https://commtext.herokuapp.com';
var popup;
addPopup();

function sendMessage(message, cb) {
  chrome.runtime.sendMessage(message, cb);
}

chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.action) {
    case 'highlight': highlight();
      break;
  }
});

function highlight() {
  var selObj = window.getSelection();
  var highlightedText = {};
  highlightedText.text = selObj.toString();
  highlightedText.xPath = getElementXPath();
  var range = selObj.getRangeAt(0);
  range.insertNode(createNode(range.extractContents()));

  showPopup();
  createLink();
}

function createNode(selectionContents) {
  var span = document.createElement("span");
  span.appendChild(selectionContents);
  span.classList.add('commtext-extension');
  span.style.backgroundColor = '#FFFFAE';

  span.addEventListener('click', function () {
    console.log('primary action');
  });

  return span;
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

function showPopup() {
  popup.style.display = 'block';
}

function addPopup() {
  popup = document.createElement('div');
  popup.style.position = 'fixed';
  popup.style.top = 0;
  popup.style.bottom = 0;
  popup.style.right = 0;
  popup.style.width = '300px';
  popup.style.backgroundColor = 'green';
  popup.style['z-index'] = 9999;
  popup.style.display = 'none';

  popup.setAttribute('id', 'commtext-popup');

  document.body.appendChild(popup);
}

function createLink(data) {
  var request = new XMLHttpRequest();
  request.open('POST', API + '/marks', true);
  request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      var data = JSON.parse(this.response);
    }
  };

  request.send(data);
}