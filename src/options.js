import generateTable from "./Table.js";
import {default_settings, localizeHtmlPage, HEAD} from "./global.js";

localizeHtmlPage();

export function makeTablePreview() {
  chrome.storage.sync.get(['users', 'settings'], storage => {
    // Ignore type coercion, want to match undefined and []
    if (storage.users != undefined) {  // Don't change first start page until an account has been added
      generateTable(false, false).then(newTable => {
        navigator.serviceWorker.controller?.postMessage({
          type: 'SAVE',
          url: chrome.runtime.getURL('popup.html'),
          body: HEAD + newTable.outerHTML
        });
      });
    }

    generateTable(true).then(newTable => {
      function saveNewState(selector, storageName) {
        const services = [];
        for (const checkbox of document.querySelectorAll(`.${selector} input[type=checkbox]`)) {
          services.push(checkbox.name);
        }
        chrome.storage.sync.set({[storageName]: services}, makeTablePreview);
      }

      const settings = {...default_settings, ...storage.settings};
      const existingTable = document.getElementsByClassName('grid-container')[0];
      existingTable.replaceWith(newTable);

      // Remove links from table
      for (const link of document.querySelectorAll('.grid-container a'))
        link.removeAttribute('href');

      // Make icons draggable
      const selector = settings.invert ? 'sideHeader' : 'topHeader';
      new Sortable(document.getElementsByClassName(selector)[0], {
        animation: 150,
        ghostClass: "sortable-ghost", //somehow find a way to not show icon without being weird
        onEnd: saveNewState.bind(this, selector, 'services')
        /*() => {
          const services = [];
          for (const checkbox of document.querySelectorAll(`.${selector} input[type=checkbox]`)) {
            services.push(checkbox.name);
          }
          chrome.storage.sync.set({services: services}, makeTablePreview);
        }*/
      });

      // Make user icons draggable
      const selector2 = settings.invert ? 'topHeader' : 'sideHeader';
      new Sortable(document.getElementsByClassName(selector2)[0], {
        animation: 150,
        ghostClass: "sortable-ghost", //somehow find a way to not show icon without being weird
        onEnd: saveNewState.bind(this, selector2, 'userOrder')
      });

      // Add event listeners to radio buttons
      for (const input of document.getElementsByTagName('input')) {
        input.onchange = updateSettings;
        input.checked = settings[input.name];
      }
    });
  });
}


function updateSettings(ev) {
  chrome.storage.sync.get('settings', storage => {
    const settings = {...default_settings, ...storage.settings};
    const target = ev.target;
    console.log(target.checked, settings);
    settings[target.name] = target.checked;

    chrome.storage.sync.set({settings: settings}, makeTablePreview);
  });
}


makeTablePreview();

document.getElementById('signout').onclick = () => chrome.storage.sync.remove(['users', 'userOrder'], () => {
  makeTablePreview();
  navigator.serviceWorker.controller?.postMessage({
    type: 'DELETE',
    url: chrome.runtime.getURL('popup.html')
  });  // Remove precached table
});
document.getElementById('reset').onclick = () => chrome.storage.sync.clear(makeTablePreview);
