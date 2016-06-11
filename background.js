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
  console.log('selected:', info.selectionText.trim());
  console.log('on:', info.pageUrl);
}