const DURATION_UNITS_MS = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
};

function durationToMilliseconds(duration) {
    const match = /^(\d+)(ms|s|m|h|d)$/.exec(duration);

    if (!match) {
        throw new Error(`Invalid duration: ${duration}`);
    }

    const [, amount, unit] = match;

    return Number(amount) * DURATION_UNITS_MS[unit];
}

module.exports = {
    durationToMilliseconds,
};
