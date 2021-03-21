import generateTable from "./Table.js";
import {default_settings, localizeHtmlPage, HEAD} from "./global.js";

localizeHtmlPage();

let settings;
export function makeTablePreview() {
  chrome.storage.sync.get('users', storage => {
    // Ignore type coercion, want to match undefined and []
    if (storage.users == undefined) return;  // Don't change first start page until an account has been added
    generateTable(false, false).then(newTable => {
      navigator.serviceWorker.controller?.postMessage({
        type: 'SAVE',
        url: chrome.runtime.getURL('popup.html'),
        body: HEAD + newTable.outerHTML
      });
    });
  });

  generateTable(true).then(newTable => {
    const existingTable = document.getElementsByClassName('grid-container')[0];
    existingTable.replaceWith(newTable);

    // Remove links from table
    for (const link of document.querySelectorAll('.grid-container a'))
      link.removeAttribute('href');

    // Make icons draggable
    new Sortable(document.getElementsByClassName('topHeader')[0], {
      animation: 150,
      ghostClass: "sortable-ghost", //somehow find a way to not show icon without being weird
      onEnd: () => {
        const services = [];
        for (const checkbox of document.querySelectorAll('.topHeader input[type=checkbox]')) {
          services.push(checkbox.name);
        }
        chrome.storage.sync.set({services: services}, makeTablePreview);
      }
    });

    // Make user icons draggable
    new Sortable(document.getElementsByClassName('sideHeader')[0], {
      animation: 150,
      ghostClass: "sortable-ghost", //somehow find a way to not show icon without being weird
      onMove: () => {
        /*const services = [];
        for (const checkbox of document.querySelectorAll('#services input[type=checkbox]')) {
          services.push(checkbox.name);
        }
        chrome.storage.sync.set({services: services}, makeTablePreview);*/
      }
    });

    // Add event listeners to radio buttons
    for (const input of document.getElementsByTagName('input')) {
      input.onchange = updateSettings;
      input.checked = settings[input.name];
    }
  });
}


function updateSettings(ev) {
  const target = ev.target;
  console.log(target.checked, settings);
  settings[target.name] = target.checked;

  chrome.storage.sync.set({settings: settings}, makeTablePreview);
}


function load() {
  chrome.storage.sync.get(['settings', 'services'], storage => {
    console.log(storage);
    settings = {...default_settings, ...storage.settings};

    /* Unused code to generate settings checkboxes, maybe use later
    for (const [setting, enabled] of Object.entries(settings)) {
      if (document.getElementsByName(setting).length > 0) continue;  // Skip settings already in DOM
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = "checkbox";
      checkbox.name = setting;
      label.appendChild(checkbox);
      label.append(chrome.i18n.getMessage(setting));
    }*/

    makeTablePreview();
  });
}
load();

document.getElementById('signout').onclick = () => chrome.storage.sync.remove('users', () => {
  makeTablePreview();
  navigator.serviceWorker.controller?.postMessage({
    type: 'DELETE',
    url: chrome.runtime.getURL('popup.html')
  });  // Remove precached table
});
document.getElementById('reset').onclick = () => chrome.storage.sync.remove(['settings', 'services'], load);
