/**
 * Created by Vadym Yatsyuk on 11/06/16
 */

var console = chrome.extension.getBackgroundPage().console;

chrome.contextMenus.create({
  title: 'Share a highlight of this!',
  contexts: ['all'],
  onclick: cb
});

function cb(info, tab) {
  console.log('here');
}