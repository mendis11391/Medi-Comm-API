const url = 'http://localhost:3000/';
const appurl = 'http://localhost:4200';

// const url = 'https://api.irentout.com/';
// const appurl = 'https://irentout.com';

module.exports = Object.freeze({
    frontendUrl: `${appurl}`,
    apiUrl: `${url}`,
    appFrontDashboard: `${appurl}dashboard`,
    appFrontLogin: `${appurl}auth/login`,
    facebookCallback: `/auth/facebook/callback`,
    facebookCallbackfullurl: `${url}auth/facebook/callback`,
    facebookOpenUrl: `/auth/facebook`,
    whatsappAPIKey: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyNmU4NDk4ZjM2YzRhMGVmMzg4NmU5OSIsIm5hbWUiOiJpcmVudG91dCIsImFwcE5hbWUiOiJBaVNlbnN5IiwiY2xpZW50SWQiOiI2MjZlODQ4YTQyZjVhZDBlZjEwMjRiMWEiLCJhY3RpdmVQbGFuIjoiQkFTSUNfTU9OVEhMWV9USUVSXzEiLCJpYXQiOjE2NTQ1Nzk0NzF9.-WnrlEHfylixxjlDdIZ8wsDutSTcRxp3mmIu1iFV2os`,
    imagePath:'../IROFrontGit/images'
});