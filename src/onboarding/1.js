import "../options.js";
import {localizeHtmlPage} from "../global.js";
import {makeTablePreview} from "../options.js";
import signin from "../Signin.js";

async function autoConnect() {
  const origins = ["https://accounts.google.com/o/oauth2/*"];
  const granted = await chrome.permissions.request({origins});
  if (!granted) {
    alert("Permission denied. Please try again.");
    return;
  }
  await loginOne();
  await chrome.permissions.remove({origins});
}

const loginOne = () => signin().then(generateAccounts).catch(generateAccounts);

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

    for (const idInput of document.querySelectorAll('input[type=number]')) {
      idInput.addEventListener('change', async () => {
        const email = idInput.dataset.email;
        const user = users[email];
        user.ID = parseInt(idInput.value);
        await chrome.storage.sync.set({users: users});
        generateAccounts();
      });
    }

    document.getElementById('login').addEventListener('click', loginOne);

    document.getElementById('auto-connect')?.addEventListener('click', autoConnect);

    document.getElementById('manual-add').addEventListener('click', () => {
      // open file picker
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => {
        /** @type {File} */
        const file = event.target.files[0];
        if (file) {
          // convert to base64 uri
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = async () => {
            const icon = await scaleImg(reader.result);
            const name = "user account";
            const email = "account" + Math.round(Math.random() * 1000);
            const ID = userOrder.length;
            users[email] = {name: name, email: email, ID: ID, icon: icon};
            userOrder.push(email);
            const settings = (await chrome.storage.sync.get(['settings'])).settings || {};
            settings[email] = true;
            try {
              await chrome.storage.sync.set({users: users, userOrder: userOrder, settings});
            } catch (e) {
              alert("Cannot add any more manual accounts.");
            }
            generateAccounts();
          }
        }
      };
      input.click();
    });

    // for checking/unchecking accounts
    makeTablePreview();
  });
}

/**
 * Scales an image to 50x50 pixels
 * @param {string} imgUri - the base64 uri to scale
 * @returns {Promise<string>} - the base64 uri of the scaled image
 */
function scaleImg(imgUri) {
  const img = new Image();
  img.src = imgUri;
  return new Promise(resolve => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // document.body.appendChild(img);
      // document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);
      resolve(canvas.toDataURL("image/webp"));
    }
  });
}

localizeHtmlPage();
generateAccounts();
