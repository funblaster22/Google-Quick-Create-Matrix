import "../options.js";

function autoConnect() {
  chrome.permissions.request({origins: ["https://accounts.google.com/o/oauth2/*"]});
}

function generateAccounts() {
  chrome.storage.sync.get(['users', 'userOrder'], storage => {
    const users = storage.users || [];
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
        <button title="remove" data-email="${user.email}">🗑️</button>
    </div>
</div>`;
    }
    accountsHtml += `<button style="width: 50%">Log in</button><button style="width: 50%">Add manually</button>`
    document.getElementById('accounts').innerHTML = accountsHtml;
  });
}

generateAccounts();
