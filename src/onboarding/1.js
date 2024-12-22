import "../options.js";
import {localizeHtmlPage} from "../global.js";
import {makeTablePreview} from "../options.js";
import signin from "../Signin.js";

window.autoConnect = () => {
  chrome.permissions.request({origins: ["https://accounts.google.com/o/oauth2/*"]});
}

function generateAccounts() {
  chrome.storage.sync.get(['users', 'userOrder'], storage => {
    const users = storage.users || {};
    const userOrder = storage.userOrder || [];
    let accountsHtml = '';
    for (const userEmail of userOrder) {
      const user = users[userEmail];
      accountsHtml +=
`<div class="account" style="flex: 1; padding: 0.5rem 0;">
    <input class="checkbox-img" type="checkbox" name="${user.email}" title="${user.name}" style="background-image: url('${user.icon}');">
    <div>
        ${user.name}<br />
        id: <input type="number" min="0" data-email="${user.email}" value="${user.ID}" style="width: 3em" />
        <button title="remove" class="remove" data-email="${user.email}">🗑️</button>
    </div>
</div>`;
    }
    if (accountsHtml === '')
      accountsHtml += `<button style="width: 100%" id="auto-connect">Auto-connect accounts</button>`;
    accountsHtml +=
`<div style="display: flex"><button style="width: 50%" id="login">Log in</button>
<button style="width: 50%"  id="manual-add">Add manually</button></div>`;
    document.getElementById('accounts').innerHTML = accountsHtml;

    // register listeners

    for (const button of document.getElementsByClassName('remove')) {
      button.addEventListener('click', async () => {
        const email = button.dataset.email;
        delete users[email];
        const index = userOrder.indexOf(email);
        if (index > -1) userOrder.splice(index, 1);
        await chrome.storage.sync.set({users: users, userOrder: userOrder});
        generateAccounts();
      });
    }

    document.getElementById('login').addEventListener('click', () => {
      signin().then(generateAccounts);
    });
  });
}

localizeHtmlPage();
generateAccounts();
makeTablePreview();
