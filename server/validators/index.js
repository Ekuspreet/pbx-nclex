const authValidator = require('./authValidator');
const appValidator = require('./appValidator');
const paymentValidator = require('./paymentValidator');

module.exports = {
    ...authValidator,
    ...appValidator,
    ...paymentValidator,
};
