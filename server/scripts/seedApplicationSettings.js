const { applicationSettings, closeDb, db } = require('../db');

const settings = [
    ['test.maxQuestions', 85, 'Maximum number of questions that can be included in a test.'],
    ['test.secondsPerQuestion', 124, 'Time allotted per question in a timed test.'],
    ['payment.minimumPayablePaise', 100, 'Minimum amount payable through the payment provider, in paise.'],
    ['wallet.ledgerHistoryLimit', 50, 'Maximum wallet ledger entries returned in the default history view.'],
    ['referral.codeLength', 8, 'Number of characters in an automatically generated referral code.'],
    ['referral.codeAlphabet', 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 'Characters allowed in automatically generated referral codes.'],
].map(([key, value, description]) => ({ key, value, description }));

async function main() {
    for (const setting of settings) {
        await db.insert(applicationSettings).values(setting).onConflictDoUpdate({
            target: applicationSettings.key,
            set: { ...setting, updatedAt: new Date() },
        });
    }
    console.log(`Seeded ${settings.length} application settings.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}).finally(closeDb);
