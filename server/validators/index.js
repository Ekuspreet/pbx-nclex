const authValidator = require('./authValidator');
const appValidator = require('./appValidator');

module.exports = {
    ...authValidator,
    ...appValidator,
};
