/**
 * Created by Vadym Yatsyuk on 11/06/16
 */
console.log('initialized');
var API = 'https://commtext.herokuapp.com';
var popup;
var markClass = 'commtext-marked';
var sendCommentCallback;
var sendTagsCallback;
var deleteMarkCallback;
var settings = {};
var monthNames = [
  "January", "February", "March",
  "April", "May", "June", "July",
  "August", "September", "October",
  "November", "December"
];
var createdMark; // fallback
var commentsLoaded = false;
var tagsLoaded = false;
var tagsCount = 0;
var commentsCount = 0;
var marksCount = 0;


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

chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
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
  settings = _settings || {};
  main();
}

function highlight() {
  var selObj = window.getSelection();
  var highlightedText = {};
  highlightedText.text = selObj.toString();
  highlightedText.xPath = getElementXPath();
  var range = selObj.getRangeAt(0);
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

  var closeButton = document.createElement('span');
  closeButton.setAttribute('id', 'commtext-popup__nav__close-btn');
  closeButton.innerHTML = 'X Close';

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
    var tagsArray = tagsTextarea.value.split(',')
      .filter(function (value) {
        return value.trim().length;
      })
      .map(function (tag) {
        return tag.trim();
      });

    if (tagsArray.length) {
      var str = document.querySelector('#popup-tags__tags_count').innerHTML.substr(1);
      document.querySelector('#popup-tags__tags_count').innerHTML = '(' + (parseInt(str.substr(0, str.length - 1), 10) + tagsArray.length) + ')';
      renderTags(tags, tagsArray);
      sendTagsCallback(tagsArray);
      tagsTextarea.value = '';
    }
  });

  tagsContainer.appendChild(buttonSendTags);

  popup.appendChild(tagsContainer);

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
  popup.appendChild(textareaContainer);

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

function createMark(highlightedText, node) {
  var request = new XMLHttpRequest();
  request.open('POST', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks', true);
  request.setRequestHeader('Content-Type', 'application/json');

  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      var data = JSON.parse(this.response);
      createdMark = data._id;
      node.dataset.mark = createdMark;
    }
  };

  request.send(JSON.stringify(Object.assign({}, highlightedText, {
    access: settings.access,
    user: settings.pseudonym,
    group: settings.group
  })));
}

function getMarks() {
  var request = new XMLHttpRequest();
  request.open('GET', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks?access='+
    settings.access +
    '&user=' + settings.pseudonym +
    '&group=' + settings.group, true);
  request.setRequestHeader('Content-Type', 'application/json');

  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      var marks = JSON.parse(this.response);
      renderHighlights(marks);

      marksCount++;
      updateCountLabel(marks.length);
    }
  };

  request.send();
}


function deleteMark(markId) {
  var request = new XMLHttpRequest();
  request.open('DELETE', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks/' + markId, true);
  request.setRequestHeader('Content-Type', 'application/json');

  // request.onload = function() {
  //   if (this.status >= 200 && this.status < 400) {
  //   }
  // };

  var $markedElem = document.querySelector('.' + markClass + '[data-mark="' + markId + '"]');
  
  if ($markedElem) {
    clearMarkFromElement($markedElem);
    closePopup();
  }

  request.send();
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
  var request = new XMLHttpRequest();
  request.open('GET', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks/' + markId + '/tags?access=' + settings.access +
    '&user=' + settings.pseudonym +
    '&group=' + settings.group, true);
  request.setRequestHeader('Content-Type', 'application/json');

  request.onload = function() {
    var count = 0;
    if (this.status >= 200 && this.status < 400) {
      var tags = JSON.parse(this.response);

      renderTags(document.querySelector('#popup-tags__tags'), tags
        .map(function (tag) {
          return tag.text;
        }));

      tagsLoaded = true;
      count = tags.length;
      tagsCount = count;
    }

    document.querySelector('#popup-tags__tags_count').innerHTML = '(' + count + ')';
  };

  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status >= 400) {
      document.querySelector('#popup-tags__tags_count').innerHTML = '(0)';
    }
  };

  request.send();
}


function getComments(markId) {
  var request = new XMLHttpRequest();
  request.open('GET', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks/' + markId + '/comments?access=' +
    settings.access +
    '&user=' + settings.pseudonym +
    '&group=' + settings.group, true);
  request.setRequestHeader('Content-Type', 'application/json');

  request.onload = function() {
    var count = 0;
    if (this.status >= 200 && this.status < 400) {
      var comments = JSON.parse(this.response);
      renderComments(comments);
      count = comments.length;
    }

    commentsLoaded = true;
    commentsCount = count;
    document.querySelector('#commtext-textarea-container__comments-count').innerHTML = '(' + count + ')';
  };


  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status >= 400) {
      document.querySelector('#commtext-textarea-container__comments-count').innerHTML = '(0)';
    }
  }

  request.send();
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
  return '<span data-mark="' + mark._id + '" class="' + markClass + '">' + mark.text + '</span>';
}

function sendComment(markId, comment) {
  var request = new XMLHttpRequest();
  request.open('POST', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks/' + markId +'/comments', true);
  request.setRequestHeader('Content-Type', 'application/json');

  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      var comment = JSON.parse(this.response);

      // renderComments([comment]); //takes too long
    }
  };
  renderComments([{
    text: comment,
    user: settings.pseudonym,
    created: new Date()
  }]);

  // update count + 1
  var str = document.querySelector('#commtext-textarea-container__comments-count').innerHTML.substr(1);
  document.querySelector('#commtext-textarea-container__comments-count').innerHTML = '(' + (parseInt(str.substr(0, str.length - 1), 10) + 1) + ')';

  request.send(JSON.stringify({
    comment: comment,
    access: settings.access,
    user: settings.pseudonym,
    group: settings.group
  }));
}

function sendTags(markId, tags) {
  var request = new XMLHttpRequest();
  request.open('POST', API + '/sites/' + encodeURIComponent(document.location.href) + '/marks/' + markId +'/tags', true);
  request.setRequestHeader('Content-Type', 'application/json');

  request.send(JSON.stringify({
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