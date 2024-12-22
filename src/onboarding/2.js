import "../options.js";
import {default_settings, app_icons} from "../global.js";

function generateServices() {
  chrome.storage.sync.get(['services', 'settings'], storage => {
    const settings = {...default_settings, ...storage.settings};
    const icons = app_icons(settings.newIcons);
    const services = storage.services || Object.keys(icons);
    let servicesHtml = '';
    for (const serviceName of services) {
      const service = icons[serviceName];
      servicesHtml +=
        `<input class="checkbox-img" type="checkbox" name="${serviceName}" title="${service.name}" style="background-image: url('/${service.icon}');">`;
    }
    document.getElementById('services').innerHTML = servicesHtml;
  });
}

generateServices();
