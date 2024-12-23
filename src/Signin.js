// Check later https://developer.chrome.com/docs/extensions/reference/identity/#method-getAccounts to see if getAccounts comes to stable channel
// UPDATE: In the meantime, try https://stackoverflow.com/a/47763767. It was written 2017, so not much hope though :(

// See https://stackoverflow.com/a/54181225 for how to get user profile pic without OAuth if above is true
// Official docs: https://developer.chrome.com/docs/extensions/mv2/tut_oauth/

import {makeTablePreview} from "./options.js";


function getDetails(token) {
  // Does not work because can not choose user
  //chrome.identity.getAuthToken({interactive: true}, function(token) {
  const header = {
    method: 'GET',
    async: true,
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    'contentType': 'json'
  };

  // How to retrieve profile pic from google: https://stackoverflow.com/a/33166960
  return fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + token, header)
    .then(response => response.json())
    /*.then(function (data) {
      console.log(data)
    });*/
}


// Adapted from https://medium.com/swlh/oauth2-openid-chrome-extension-login-system-29285323882f
// Alternate: https://github.com/michaeloryl/oauth2-angularjs-chrome-extension-demo
// Official docs: https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#oauth-2.0-endpoints
function getAuthToken() {
  const isChromium = typeof browser === 'undefined';
  const CLIENT_ID = encodeURIComponent(
    isChromium ? '139485939671-6l2snujbfuvv87og8j6c5q0hb38qumr1.apps.googleusercontent.com'
      : "139485939671-lhbo35irrq9c8v528l3qrl9ps0net5n9.apps.googleusercontent.com"
  );
  const RESPONSE_TYPE = encodeURIComponent('token');
  const REDIRECT_URI = encodeURIComponent(chrome.identity.getRedirectURL())
  const SCOPE = encodeURIComponent('https://www.googleapis.com/auth/userinfo.email');
  const STATE = encodeURIComponent('meet' + Math.random().toString(36).substring(2, 15));
  const PROMPT = encodeURIComponent('consent');

  function create_auth_endpoint() {
    let nonce = encodeURIComponent(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

    let openId_endpoint_url =
      `https://accounts.google.com/o/oauth2/v2/auth
?client_id=${CLIENT_ID}
&response_type=${RESPONSE_TYPE}
&redirect_uri=${REDIRECT_URI}
&scope=${SCOPE}
&state=${STATE}
&prompt=${PROMPT}`.replaceAll("\n", "");

    console.log(openId_endpoint_url);
    return openId_endpoint_url;
  }

  return chrome.identity.launchWebAuthFlow({
      'url': create_auth_endpoint(),
      'interactive': true
    }).then(redirect_url => {
      console.log(redirect_url);
      let id_token = redirect_url.substring(redirect_url.indexOf('access_token=') + 13);
      id_token = id_token.substring(0, id_token.indexOf('&'));
      console.log("User successfully signed in.", id_token);
      return id_token;
    });
}


export default async function signin() {
  // TODO: loading animation & better UX if offline
  const user = await getDetails(await getAuthToken());
  console.log(user);
  const storage = await chrome.storage.sync.get(['users', 'userOrder', 'settings']);
  const users = {...storage.users};  // Use spread operator in case userOrder is undefined, guarantees an object, DOES NOT WORK with arrays
  if (user.email in users) return;  // user already exists
  const maxId = Math.max(-1, ...Object.values(users).map(item => item.ID));  // use b/c IDs can be skipped (eg. users 0, 1, and 3)
  users[user.email] = {name: user.email, email: user.email, ID: maxId + 1, icon: user.picture};
  await chrome.storage.sync.set({
    users: users,
    userOrder: [...(storage.userOrder || []), user.email],
    settings: {...storage.settings, [user.email]: true}
  });
  makeTablePreview();
}
