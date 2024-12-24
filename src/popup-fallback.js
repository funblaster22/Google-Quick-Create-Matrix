import generateTable from "./Table.js";
import {makeTablePreview} from "./options.js";

makeTablePreview();

generateTable(false, false).then(table => {
  document.body.appendChild(table);
});

chrome.storage.sync.get(['userOrder'], storage => {
  if (!storage.userOrder?.length) {
    chrome.tabs.create({ url: 'onboarding/1.html' });
    window.close();
  }
});
