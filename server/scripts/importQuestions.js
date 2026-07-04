const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { closeDb } = require('../db');
const { importQuestionsFromPayload } = require('../services/questionBankService');

async function main() {
    const sourcePath = path.join(__dirname, '..', 'questions', 'questions.json');
    const payload = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const result = await importQuestionsFromPayload(payload);

    console.log(`Imported ${result.imported} questions.`);
    console.log(`Rebuilt ${result.statsCount} question stat rows.`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closeDb();
    });
