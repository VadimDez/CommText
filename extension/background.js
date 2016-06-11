/**
 * Created by Vadym Yatsyuk on 11/06/16
 */

var console = chrome.extension.getBackgroundPage().console;

chrome.contextMenus.create({
  title: 'Mark',
  contexts: ['all'],
  onclick: cb
});

function cb(info, tab) {
  if (!info.selectionText) {
    return;
  }

  console.log('selected:', info.selectionText.trim());
  console.log('on:', info.pageUrl);

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'highlight'}, function(response) {
      console.log(response);
    });
  });

}

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    console.log('loaded');
  }
});