import generateTable from "./Table.js";
import {default_settings, default_services} from "./defaults.js";

// Adapted from https://stackoverflow.com/a/25612056
function localizeHtmlPage() {
  //Localize by replacing __MSG_***__ meta tags
  var objects = document.getElementsByTagName('html');
  for (var j = 0; j < objects.length; j++)
  {
    var obj = objects[j];

    var valStrH = obj.innerHTML.toString();
    var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1)
    {
      return v1 ? chrome.i18n.getMessage(v1) : "";
    });

    if(valNewH != valStrH)
    {
      obj.innerHTML = valNewH;
    }
  }
}
localizeHtmlPage();

let settings;
function makeTablePreview() {
  generateTable().then(() => {
    // Remove links from table
    for (const link of document.getElementsByTagName('a'))
      link.removeAttribute('href');

    // Make icons draggable
    new Sortable(document.getElementsByClassName('row-1')[0], {
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
  });
}
makeTablePreview();


function updateSettings(ev) {
  const target = ev.target;
  console.log(target.checked, settings);
  settings[target.name] = target.checked;

  chrome.storage.sync.set({settings: settings}, makeTablePreview);
}


chrome.storage.sync.get(['settings', 'services'], storage => {
  console.log(storage);
  settings = {...default_settings, ...storage.settings};

  /* Load in services
  for (const service of storage.services || default_services) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = service;
    label.appendChild(input);
    label.append(chrome.i18n.getMessage(service));
    document.getElementById('services').appendChild(label);
  }*/

  // Add event listeners to radio buttons
  for (const input of document.getElementsByTagName('input')) {
    input.onchange = updateSettings;
    input.checked = settings[input.name];
  }
});

document.getElementById('signout').onclick = () => chrome.storage.sync.remove('users', () => location.reload());
document.getElementById('reset').onclick = () => chrome.storage.sync.remove(['settings', 'services'], () => location.reload());
