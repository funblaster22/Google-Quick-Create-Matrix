if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('ServiceWorker registered')
      }, err => {
        console.error('ServiceWorker registration failed:', err)
      });
  });
}

export const default_settings = {
  doc: true, sheet: true, prez: true, draw: true, form: true
};

export const default_services = [
  'doc', 'sheet', 'prez', 'draw', 'form', 'script', 'drive', 'gmail', 'cal', 'class', 'photo'
];

// Adapted from https://stackoverflow.com/a/25612056
export function localizeHtmlPage() {
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
