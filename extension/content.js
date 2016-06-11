/**
 * Created by Vadym Yatsyuk on 11/06/16
 */
console.log('initialized');
var API = 'https://commtext.herokuapp.com';
var popup;
var markClass = 'commtext-marked';
var sendCommentCallback;

main();

function main() {
  addPopup();
  getMarks();
}

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
  createMark(JSON.stringify(highlightedText));
}

function createNode(selectionContents) {
  var span = document.createElement("span");
  span.classList.add(markClass);
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


function showPopup(markId) {
  popup.style.display = 'block';

  sendCommentCallback = function (comment) {
    sendComment(markId, comment);
  }
}

function closePopup() {
  popup.style.display = 'none';
}

function addPopup() {
  popup = document.createElement('div');
  popup.setAttribute('id', 'commtext-popup');
  
  var nav = document.createElement('div');
  nav.setAttribute('id', 'commtext-popup__nav');
  popup.appendChild(nav);

  var closeButton = document.createElement('button');
  closeButton.setAttribute('type', 'button');
  closeButton.setAttribute('id', 'commtext-popup__nav__close-btn');
  closeButton.innerHTML = 'Close';

  closeButton.addEventListener('click', function () {
    closePopup();
  });

  nav.appendChild(closeButton);

  var logo = document.createElement('img');
  logo.setAttribute('id', 'popup__nav__logo');
  logo.setAttribute('src', 'http://d26uhratvi024l.cloudfront.net/gsc/89SNOO/24/85/8b/24858bc532264f72b51616d95a0e3ab4/images/artikelpage_leser/u42.png?token=7846536d56bfe40733345eee074692f4');
  nav.appendChild(logo);

  var textareaContainer = document.createElement('div');
  textareaContainer.setAttribute('id', 'commtext-textarea-container');
  var textarea = document.createElement('textarea');

  var commentTitle = document.createElement('h5');
  commentTitle.innerHTML = 'Comment';
  textareaContainer.appendChild(commentTitle);

  textareaContainer.appendChild(textarea);
  popup.appendChild(textareaContainer);

  var button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.innerText = 'Comment';
  button.addEventListener('click', function () {
    sendCommentCallback(textarea.value);
  });

  textareaContainer.appendChild(button);


  document.body.appendChild(popup);
}

function createMark(data) {
  var request = new XMLHttpRequest();
  request.open('POST', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks', true);
  request.setRequestHeader('Content-Type', 'application/json');

  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      var data = JSON.parse(this.response);
    }
  };

  request.send(data);
}

function getMarks() {
  var request = new XMLHttpRequest();
  request.open('GET', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks', true);
  request.setRequestHeader('Content-Type', 'application/json');

  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      renderHighlights(JSON.parse(this.response));
    }
  };

  request.send();
}

function renderHighlights(marks) {
  console.log(marks);

  marks.forEach(mark => {
    if (!mark.xPath) {
      return;
    }
    var elem = document.evaluate(mark.xPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

    if (elem.singleNodeValue) {
      elem.singleNodeValue.innerHTML = elem.singleNodeValue.innerHTML.replace(mark.text, replaceMark(mark));
    } else {
      elem.innerHTML = elem.innerHTML.replace(mark.text, replaceMark(mark));
    }
  });
}

function replaceMark(mark) {
  return '<span data-mark="' + mark._id + '" class="' + markClass + '" style="background-color: #FFFFAF">' + mark.text + '</span>';
}

function sendComment(markId, comment) {
  var request = new XMLHttpRequest();
  request.open('POST', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks/' + markId +'/comments', true);
  request.setRequestHeader('Content-Type', 'application/json');

  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      var comment = JSON.parse(this.response);
    }
  };

  request.send(JSON.stringify({comment: comment}));
}

// main listener
document.querySelector('body').addEventListener('click', function(evt) {
  if (evt.target.classList.contains(markClass)) { // LOL
    showPopup(evt.target.dataset.mark);
  }
}, true);