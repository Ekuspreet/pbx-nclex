const authValidator = require('./authValidator');
const appValidator = require('./appValidator');
const paymentValidator = require('./paymentValidator');
const adminPromoValidator = require('./adminPromoValidator');

module.exports = {
    ...authValidator,
    ...appValidator,
    ...paymentValidator,
    ...adminPromoValidator,
};
