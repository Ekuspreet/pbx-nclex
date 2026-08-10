const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { closeDb } = require('../db');
const { importQuestionsFromPayload } = require('../services/questionBankService');

async function main() {
    const sourcePath = path.join(__dirname, '..', 'questions', 'questions.json');
    const payload = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const questionCount = Array.isArray(payload?.questionList) ? payload.questionList.length : 0;

    if (questionCount === 0) {
        throw new Error(`No questions found in ${sourcePath}.`);
    }

    console.log(`Importing ${questionCount} questions from ${sourcePath}.`);
    console.log('Existing questionId values will be overwritten; new questionId values will be inserted.');

    const result = await importQuestionsFromPayload(payload);

    console.log(`Upserted ${result.imported} supported questions.`);
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
