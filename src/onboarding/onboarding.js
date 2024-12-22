import "../options.js";

function autoConnect() {
  chrome.permissions.request({origins: ["https://accounts.google.com/o/oauth2/*"]});
}

function generateAccounts() {
  chrome.storage.sync.get(['users'], storage => {
    const users = storage.users || [];
    let accountsHtml = '';
    for (const user of Object.values(users)) {
      accountsHtml +=
`<div class="account" style="flex: 1; padding: 0.5rem 0;">
    <input class="checkbox-img" type="checkbox" name="${user.email}" title="${user.name}" style="background-image: url('${user.icon}');">
    <div>
        ${user.name}<br />
        id: <input type="number" min="0" value="${user.ID}" />
    </div>
</div>`;
    }
    accountsHtml += `<button style="width: 50%">Log in</button><button style="width: 50%">Add manually</button>`
    document.getElementById('accounts').innerHTML = accountsHtml;
  });
}

generateAccounts();
