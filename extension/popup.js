document.addEventListener('DOMContentLoaded', function () {
  var settings = { access: 'public' };

  chrome.storage.local.get('settings', function (result) {
    settings = result.settings;

    document.querySelector('#commtext-settings [name="pseudonym"]').value = settings.pseudonym;
    document.querySelector('#commtext-settings [name="access"][value="' + settings.access + '"]').checked = true;
  });

  document.querySelector('#commtext-settings__save').addEventListener('click', function () {
    settings = {
      pseudonym: document.querySelector('#commtext-settings [name="pseudonym"]').value,
      access: getSelectedAccess()
    };

    chrome.storage.local.set({settings: settings});
    sendMessage({
      action: 'settings',
      settings: settings
    });
  });

  function getSelectedAccess() {
    var elements = document.querySelectorAll('#commtext-settings [name="access"]');

    for (var i = 0; i < elements.length; i++) {
      if (elements[i].checked) {
        return elements[i].value;
      }
    }
  }

  function sendMessage(message) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    );
  };
});