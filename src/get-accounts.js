const profileImgs = document.getElementsByTagName("img");
const profileNames = document.querySelectorAll("[data-email]");

const settings = await chrome.storage.sync.get(["settings", "userOrder", "users"]);
if (!settings.settings) settings.settings = {};
if (!settings.userOrder) settings.userOrder = [];
if (!settings.users) settings.users = {};

for (let i = 0; i < profileImgs.length; i++) {
  const profileImg = profileImgs[i].src;
  const profileName = profileNames[i].data.email;

  settings.users[profileName] = {
    ID: i,
    email: profileName,
    name: profileName,
    icon: profileImg,
  }
  settings.settings[profileName] = true;
  if (!settings.userOrder.includes(profileName))
    settings.userOrder.push(profileName);
}

try {
  chrome.storage.sync.set(settings);
  window.close();
} catch {
  alert("Could not automatically set accounts, please proceed manually");
}
