const profileImgs = document.getElementsByTagName("img");
const profileNames = document.querySelectorAll("[data-email]");

chrome.storage.sync.get(["settings", "userOrder", "users"], storage => {
  if (!storage.settings) storage.settings = {};
  if (!storage.userOrder) storage.userOrder = [];
  if (!storage.users) storage.users = {};

  for (let i = 0; i < profileImgs.length; i++) {
    const profileImg = profileImgs[i].src;
    const profileName = profileNames[i].dataset.email;

    storage.users[profileName] = {
      ID: i,
      email: profileName,
      name: profileName,
      icon: profileImg,
    }
    storage.settings[profileName] = true;
    if (!storage.userOrder.includes(profileName))
      storage.userOrder.push(profileName);
  }

  try {
    chrome.storage.sync.set(storage);
    window.close();
  } catch {
    alert("Could not automatically set accounts, please proceed manually");
  }
});
