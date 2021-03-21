import {css} from "./global.js";

window.addEventListener('load', () => {
  // TODO: depreciated, use window.performance.getEntries(). Fine for now, just debugging
  // See https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API & https://developer.mozilla.org/en-US/docs/Web/API/Performance
  const perf = window.performance.timing;
  console.log("Load Time:", perf.domComplete - perf.requestStart, 'ms');
});

// Make table interactable
chrome.tabs.query({
  active: true,
  currentWindow: true
}, function(tabs) {
  // Some of this code is taken from Table.js:makeCell, find a way to make more DRY
  for (const td of document.getElementsByClassName('cell')) {
    // TODO: store row/col in HTML data attrs?
    const selector = '.' + Array.from(td.classList).slice(0, 2).join(',.');  // Convert classList to a queryable string without the .cell selector (eg ".col0,.row0")
    const a = td.firstElementChild;
    td.onmouseenter = () => css(selector, 'backgroundColor', 'lightblue');
    td.onmouseleave = () => css(selector, 'backgroundColor', '');

    if (tabs[0].url === "chrome://newtab/") {
      a.removeAttribute('target');
      a.onclick = () => chrome.tabs.update({
        url: a.href
      }, window.close);
    }
  }
});
