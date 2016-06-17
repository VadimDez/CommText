/**
 * Created by Vadym Yatsyuk on 11/06/16
 */

var console = chrome.extension.getBackgroundPage().console;

chrome.contextMenus.create({
  title: 'Mark',
  contexts: ['all'],
  onclick: cb
});

function cb(info) {
  if (!info.selectionText) {
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'highlight' });
  });
}

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo) {
  if (changeInfo.status == 'complete') {

    chrome.storage.local.get('settings', function (result) {
      if (!result.settings) {
        return;
      }

      chrome.tabs.sendMessage(tabId, {
        action: 'settings',
        settings: result.settings
      }, function(response) {
      });
    });
  }
});

chrome.runtime.onMessage.addListener(function(request) {
  if (request.action === 'count') {
    setCount(request.count);
  }
});

function setCount(count) {
  chrome.browserAction.setBadgeText({ text: '' + count });
}