const cookie = require('./cookie');
const duration = require('./duration');
const email = require('./email');
const hash = require('./hash');
const otp = require('./otp');
const password = require('./password');
const passwordReset = require('./passwordReset');
const token = require('./token');
const user = require('./user');

module.exports = {
    ...cookie,
    ...duration,
    ...email,
    ...hash,
    ...otp,
    ...password,
    ...passwordReset,
    ...token,
    ...user,
};
