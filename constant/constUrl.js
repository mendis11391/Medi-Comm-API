const url = 'http://localhost:3000/';
const appurl = 'http://localhost:4200/';

module.exports = Object.freeze({
    appFrontDashboard: `${appurl}dashboard`,
    appFrontLogin: `${appurl}auth/login`,
    facebookCallback: `/auth/facebook/callback`,
    facebookCallbackfullurl: `${url}auth/facebook/callback`,
    facebookOpenUrl: `/auth/facebook`,
    ANOTHER_CONSTANT: 'another value'
});