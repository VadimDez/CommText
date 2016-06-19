/**
 * Created by Vadym Yatsyuk on 11/06/16
 */

var API = 'https://commtext.herokuapp.com';
var popup;
var markClass = 'commtext-marked';
var sendCommentCallback;
var sendTagsCallback;
var deleteMarkCallback;
var settings = { access: 'public', pseudonym: 'Unnamed' };
var monthNames = [
  "January", "February", "March",
  "April", "May", "June", "July",
  "August", "September", "October",
  "November", "December"
];
var createdMark; // fallback
var marksCount = 0;

window.addEventListener('load', main, false);

function main() {
  clearMarked();

  updateCountLabel(marksCount);
  if (!popup) {
    addPopup();
  }
  closePopup();
  getMarks();
}

function sendMessage(message, cb) {
  chrome.runtime.sendMessage(message, cb);
}

chrome.extension.onMessage.addListener(function (message) {
  switch (message.action) {
    case 'highlight':
      highlight();
      break;
    case 'settings':
      loadSettings(message.settings);
      break;
  }
});

function loadSettings(_settings) {
  settings = _settings || settings;
  main();
}

function highlight() {
  var selection = window.getSelection();
  var highlightedText = {
    text: selection.toString(),
    xPath: getElementXPath()
  };
  var range = selection.getRangeAt(0);
  var node = createNode(range.extractContents());
  range.insertNode(node);

  showPopup();
  createMark(highlightedText, node);
  marksCount++;
  updateCountLabel(marksCount);
}

function createNode(selectionContents) {
  var span = document.createElement("span");
  span.classList.add(markClass);
  span.appendChild(selectionContents);
  span.classList.add('commtext-extension');

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
      if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE) {
        continue;
      }

      if (sibling.nodeName == element.nodeName) {
        ++index;
      }
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
  document.querySelector('#commtext-textarea-container__comments-count').innerHTML = 'Loading...';
  document.querySelector('#popup-tags__tags_count').innerHTML = 'Loading...';
  clearTags();
  getTags(markId);
  clearComments();
  getComments(markId);
  sendCommentCallback = function (comment) {
    sendComment(markId || createdMark, comment);
  };
  sendTagsCallback = function (tags) {
    sendTags(markId || createdMark, tags);
  };
  deleteMarkCallback = function () {
    deleteMark(markId || createdMark);
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

  var content = document.createElement('div');
  content.setAttribute('id', 'commtext-popup__content');
  popup.appendChild(content);

  var closeButton = document.createElement('span');
  closeButton.setAttribute('id', 'commtext-popup__nav__close-btn');
  closeButton.innerHTML = 'x';

  closeButton.addEventListener('click', function () {
    closePopup();
  });

  nav.appendChild(closeButton);

  var deleteButton = document.createElement('button');
  deleteButton.setAttribute('id', 'popup__nav__delete-btn');
  deleteButton.innerHTML = 'Delete';

  deleteButton.addEventListener('click', function () {
    deleteMarkCallback()
  });

  nav.appendChild(deleteButton);
  nav.innerHTML += '<div id="popup__nav__icon-container"><div id="popup__nav__icon"></div></div>';

  var tagsContainer = document.createElement('div');
  tagsContainer.setAttribute('id', 'popup-tags');

  var tagsTitle = document.createElement('h5');
  tagsTitle.innerHTML = 'Tags <span id="popup-tags__tags_count">Loading...</span>';
  tagsContainer.appendChild(tagsTitle);

  var tags = document.createElement('div');
  tags.setAttribute('id', 'popup-tags__tags');
  tagsContainer.appendChild(tags);

  var tagsTextarea = document.createElement('textarea');
  tagsTextarea.setAttribute('id', 'popup-tags__textarea');
  tagsContainer.appendChild(tagsTextarea);

  var buttonSendTags = document.createElement('button');
  buttonSendTags.setAttribute('type', 'button');
  buttonSendTags.innerText = 'Send Tags';
  buttonSendTags.addEventListener('click', function () {
    var tagsArray = [];
    tagsTextarea.value.split(',').forEach(function (value) {
      value = value.trim();

      if (value.length) {
        tagsArray.push(value);
      }
    });

    if (tagsArray.length) {
      incrementCount(document.querySelector('#popup-tags__tags_count'));
      renderTags(tags, tagsArray);
      sendTagsCallback(tagsArray);
      tagsTextarea.value = '';
    }
  });

  tagsContainer.appendChild(buttonSendTags);

  content.appendChild(tagsContainer);

  var textareaContainer = document.createElement('div');
  textareaContainer.setAttribute('id', 'commtext-textarea-container');
  var textarea = document.createElement('textarea');

  var commentTitle = document.createElement('h5');
  commentTitle.innerHTML = 'Comments <span id="commtext-textarea-container__comments-count">Loading...</span>';
  textareaContainer.appendChild(commentTitle);

  var comments = document.createElement('div');
  comments.setAttribute('id', 'commtext-textarea-container-comments');
  textareaContainer.appendChild(comments);

  textareaContainer.appendChild(textarea);
  content.appendChild(textareaContainer);

  var button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.innerText = 'Comment';
  button.addEventListener('click', function () {
    sendCommentCallback(textarea.value);
    textarea.value = '';
  });

  textareaContainer.appendChild(button);


  document.body.appendChild(popup);
}

function renderTags(elem, tags) {
  tags.forEach(function (tag) {
    var tagElem = document.createElement('span');
    tagElem.innerHTML = tag + ' <span>x</span>';
    elem.appendChild(tagElem);
  })
}

function request(method, url) {
  var _request = new XMLHttpRequest();

  _request.open(method, url, true);
  _request.setRequestHeader('Content-Type', 'application/json');

  return _request;
}

function createMark(highlightedText, node) {
  var _request = request('POST', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks');

  _request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      var data = JSON.parse(this.response);
      createdMark = data._id;
      node.dataset.mark = createdMark;
    }
  };

  _request.send(JSON.stringify(Object.assign({}, highlightedText, {
    access: settings.access,
    user: settings.pseudonym,
    group: settings.group
  })));
}

function getMarks() {
  var _request = request('GET', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks?' + settingsAsParams());

  _request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      var marks = JSON.parse(this.response);
      renderHighlights(marks);

      marksCount++;
      updateCountLabel(marks.length);
    }
  };

  _request.send();
}


function deleteMark(markId) {
  var _request = request('DELETE', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks/' + markId);

  // request.onload = function() {
  //   if (this.status >= 200 && this.status < 400) {
  //   }
  // };

  var $markedElem = document.querySelector('.' + markClass + '[data-mark="' + markId + '"]');
  
  if ($markedElem) {
    clearMarkFromElement($markedElem);
    closePopup();
  }

  _request.send();
}

function clearTags() {
  clearAllChil(document.querySelector('#popup-tags__tags'));
}
function clearComments() {
  clearAllChil(document.querySelector('#commtext-textarea-container-comments'));
}

function clearAllChil(elem) {
  while (elem.firstChild) elem.removeChild(elem.firstChild);
}

function getTags(markId) {
  var _request = request('GET', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks/' + markId + '/tags?' + settingsAsParams());

  _request.onload = function() {
    var count = 0;
    if (this.status >= 200 && this.status < 400) {
      var tags = JSON.parse(this.response);

      renderTags(
        document.querySelector('#popup-tags__tags'),
        tags.map(function (tag) {
          return tag.text;
        })
      );

      count = tags.length;
    }

    document.querySelector('#popup-tags__tags_count').innerHTML = '(' + count + ')';
  };

  _request.onreadystatechange = function () {
    if (_request.readyState === 4 && _request.status >= 400) {
      document.querySelector('#popup-tags__tags_count').innerHTML = '(0)';
    }
  };

  _request.send();
}


function getComments(markId) {
  var _request = request('GET', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks/' + markId + '/comments?' + settingsAsParams());

  _request.onload = function() {
    var count = 0;
    if (this.status >= 200 && this.status < 400) {
      var comments = JSON.parse(this.response);
      renderComments(comments);
      count = comments.length;
    }

    document.querySelector('#commtext-textarea-container__comments-count').innerHTML = '(' + count + ')';
  };


  _request.onreadystatechange = function () {
    if (_request.readyState === 4 && _request.status >= 400) {
      document.querySelector('#commtext-textarea-container__comments-count').innerHTML = '(0)';
    }
  };

  _request.send();
}

function renderComments(comments) {
  var elem = document.querySelector('#commtext-textarea-container-comments');
  comments.forEach(function (comment) {
    var commentElem = document.createElement('div');

    var date = new Date(comment.created);
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    commentElem.classList.add('commtext-comment');
    commentElem.innerHTML = '<div><div><span class="commtext-comment-author">' + comment.user + '</span> <span class="commtext-comment-created">' + day + ' ' + monthNames[monthIndex] + ' ' + year + '</span></div><div class="commtext-comment-content">' + comment.text + '</div><div class="commtext-comment-tools"><span>Reply</span></div></div>';
    elem.appendChild(commentElem);
  });
}

function renderHighlights(marks) {
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
  return '<span data-mark="' + mark._id + '" class="' + markClass + '">' + mark.text + '</span>';
}

function sendComment(markId, comment) {
  var _request = request('POST', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks/' + markId +'/comments');

  // TAKES TOO LONG
  // request.onload = function() {
  //   if (this.status >= 200 && this.status < 400) {
  //     var comment = JSON.parse(this.response);
  //     renderComments([comment]); //takes too long
  //   }
  // };
  renderComments([{
    text: comment,
    user: settings.pseudonym,
    created: new Date()
  }]);

  incrementCount(document.querySelector('#commtext-textarea-container__comments-count'));

  _request.send(JSON.stringify({
    comment: comment,
    access: settings.access,
    user: settings.pseudonym,
    group: settings.group
  }));
}

function incrementCount($elem) {
  var str = $elem.innerHTML.substr(1);
  $elem.innerHTML = '(' + (parseInt(str.substr(0, str.length - 1), 10) + 1) + ')';
}

function sendTags(markId, tags) {
  var _request = request('POST', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks/' + markId +'/tags');

  _request.send(JSON.stringify({
    tags: tags,
    access: settings.access,
    user: settings.pseudonym,
    group: settings.group
  }));
}

function clearMarked() {
  var $elements = document.querySelectorAll('.' + markClass);
  var count = $elements.length;

  for (var i = 0; i < count; i++) {
    clearMarkFromElement($elements[i]);
  }
}

function clearMarkFromElement($element) {
  $element.classList.remove(markClass);
  $element.parentElement.innerHTML = $element.parentElement.innerHTML.replace($element.outerHTML, $element.innerHTML);
}

function updateCountLabel(count) {
  sendMessage({action: 'count', count: count});
}

// main listener
document.querySelector('body').addEventListener('click', function(evt) {
  if (evt.target.classList.contains(markClass)) { // LOL
    showPopup(evt.target.dataset.mark);
  }
}, true);

function settingsAsParams() {
  return 'access=' + settings.access +
  '&user=' + settings.pseudonym +
  '&group=' + settings.group;
}