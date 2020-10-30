const url = 'http://localhost:3000/';
const appurl = 'http://localhost:4200';

// const url = 'http://iroapi.irentout.com/';
// const appurl = 'http://irentout.com';

module.exports = Object.freeze({
    frontendUrl: `${appurl}`,
    apiUrl: `${url}`,
    appFrontDashboard: `${appurl}dashboard`,
    appFrontLogin: `${appurl}auth/login`,
    facebookCallback: `/auth/facebook/callback`,
    facebookCallbackfullurl: `${url}auth/facebook/callback`,
    facebookOpenUrl: `/auth/facebook`
});