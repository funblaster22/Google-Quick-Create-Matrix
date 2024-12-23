import generateTable from "./Table.js";
import {default_settings, localizeHtmlPage, HEAD, resetSW} from "./global.js";

export function makeTablePreview() {
  chrome.storage.sync.get(['users', 'settings'], storage => {
    const settings = {...default_settings, ...storage.settings};
    document.body.style.setProperty('--bg', settings.dark ? "#171A1D" : "#FDFDFD");
    document.body.style.setProperty('--color', settings.dark ? "white" : "#555");

    // Ignore type coercion, want to match undefined and []
    if (storage.users != undefined) {  // Don't change first start page until an account has been added
      generateTable(false, false).then(newTable => {
        navigator.serviceWorker.controller?.postMessage({
          type: 'SAVE',
          url: chrome.runtime.getURL('popup.html'),
          body: '<!DOCTYPE html>' + HEAD + `<style>body {--bg: ${settings.dark ? "#171A1D" : "#FDFDFD"}; --color: ${settings.dark ? "white" : "#555"}}</style>` + newTable.outerHTML
        });
      });
    }

    generateTable(true).then(newTable => {
      if (location.pathname === '/options.html') {
        const existingTable = document.getElementsByClassName('grid-container')[0];
        existingTable?.replaceWith(newTable);

        // Remove links from table
        for (const link of document.querySelectorAll('.grid-container a'))
          link.removeAttribute('href');

        // Make icons draggable
        const selector = settings.invert ? 'sideHeader' : 'topHeader';
        new Sortable(document.getElementsByClassName(selector)[0], {
          animation: 150,
          ghostClass: "sortable-ghost", //somehow find a way to not show icon without being weird
          onEnd: saveNewState.bind(this, selector, 'services')
        });

        // Make user icons draggable
        const selector2 = settings.invert ? 'topHeader' : 'sideHeader';
        new Sortable(document.getElementsByClassName(selector2)[0], {
          animation: 150,
          ghostClass: "sortable-ghost", //somehow find a way to not show icon without being weird
          onEnd: saveNewState.bind(this, selector2, 'userOrder')
        });
      }

      // Add event listeners to radio buttons
      for (const input of document.getElementsByTagName('input')) {
        input.onchange = updateSettings;
        input.checked = settings[input.name];
      }
    });
  });
}

export function saveNewState(selector, storageName) {
  const services = [];
  for (const checkbox of document.querySelectorAll(`.${selector} input[type=checkbox]`)) {
    if (checkbox.name === "signin") continue;
    services.push(checkbox.name);
  }
  chrome.storage.sync.set({[storageName]: services}, makeTablePreview);
}

function updateSettings(ev) {
  const target = ev.target;
  if (target.name === "dark") {
    document.body.style.setProperty('--bg', target.checked ? "#171A1D" : "#FDFDFD");
    document.body.style.setProperty('--color', target.checked ? "white" : "#555");
  }
  chrome.storage.sync.get('settings', storage => {
    const settings = {...default_settings, ...storage.settings};
    console.log(target.checked, settings);
    settings[target.name] = target.checked;

    chrome.storage.sync.set({settings: settings}, makeTablePreview);
  });
}

if (location.pathname === '/options.html') {
  localizeHtmlPage();
  makeTablePreview();

  document.getElementById('signout').addEventListener("click", () =>
    chrome.storage.sync.remove(['users', 'userOrder'], () => {
      makeTablePreview();
      resetSW();
    })
  );
  document.getElementById('reset').addEventListener("click", () =>
    chrome.storage.sync.remove(['settings', 'services'], makeTablePreview)
  );
}
