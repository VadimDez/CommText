document.addEventListener('DOMContentLoaded', function () {
  var settings = { access: 'public', pseudonym: 'Unnamed' };
  var $groupElem = document.querySelector('#commtext-settings__group');
  var $groupInputElem = document.querySelector('#commtext-settings__group input');
  var $privateAccessElem = document.querySelector('#commtext-settings [name="access"][value="private"]');
  var $nameElem = document.querySelector('#commtext-settings [name="pseudonym"]');

  var fn = function () {
    updateGroup(this.checked && this.value === 'private');
  };

  var updateGroup = function (display) {
    if (!display) {
      $groupInputElem.value = '';
      $groupElem.style.display = 'none';
      return;
    }

    $groupElem.style.display = 'block';
  };

  $privateAccessElem.addEventListener('change', fn);
  document.querySelector('#commtext-settings [name="access"][value="public"]').addEventListener('change', fn);

  chrome.storage.local.get('settings', function (result) {
    settings = result.settings;

    $nameElem.value = settings.pseudonym;
    document.querySelector('#commtext-settings [name="access"][value="' + settings.access + '"]').checked = true;
    $groupInputElem.value = settings.group;

    updateGroup($privateAccessElem.checked);
  });

  document.querySelector('#commtext-settings__save').addEventListener('click', function () {
    settings = {
      pseudonym: $nameElem.value,
      access: getSelectedAccess(),
      group: $groupInputElem.value || null
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
    console.log(message);
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    );
  };
});