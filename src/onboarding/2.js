import "../options.js";
import {default_settings, app_icons, localizeHtmlPage} from "../global.js";
import {makeTablePreview, saveNewState} from "../options.js";

function generateServices() {
  chrome.storage.sync.get(['services', 'settings'], storage => {
    const settings = {...default_settings, ...storage.settings};
    const icons = app_icons(settings.newIcons);
    const services = storage.services || Object.keys(icons);
    let servicesHtml = '';
    for (const serviceName of services) {
      const service = icons[serviceName];
      servicesHtml +=
        `<input class="checkbox-img" type="checkbox" name="${serviceName}" title="${service.name}" style="background-image: url('${service.icon}');">`;
    }
    document.getElementById('services').innerHTML = servicesHtml;
  });

  const selector = 'services';
  new Sortable(document.getElementsByClassName(selector)[0], {
    animation: 150,
    ghostClass: "sortable-ghost", //somehow find a way to not show icon without being weird
    onEnd: saveNewState.bind(this, selector, 'services')
  });
}

localizeHtmlPage();
generateServices();
makeTablePreview();
