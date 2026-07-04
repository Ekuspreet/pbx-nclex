# Questions JSON Database Import Analysis

Source: `server/questions/questions.json`

## Scope

This analysis is for building our own question database, not recreating the source website's test/session model.

The source payload appears to be an exported test attempt wrapper from another testing platform. For our database, we should import only reusable question-bank data:

- question stem
- answer choices
- correct answer
- explanation/rationale
- question format
- subject/topic taxonomy
- exhibits and other question display assets

We should not import source test attempt state such as `testId`, `userAnswer`, timers, score state, visited question, submitted state, or source website session settings. Our own app should generate and own those records.

## Method

The file was not manually read end to end. I sampled the beginning of the file to understand the wrapper and record shape, then ran Node.js scans across the parsed JSON to count field presence, nullability, nested arrays, and inferred question-format variants.

Scan result:

| area | count |
| --- | ---: |
| root object | 1 |
| `questionList` records | 1,574 |
| `answerChoiceList` records | 6,296 |
| exhibit records | 125 |
| reference mapping records | 785 |
| standard records | 1,574 |

## Detected Question Formats

All scanned records are the same base question type:

| count | type ids | choices | correct answer shape | exhibits | meaning |
| ---: | --- | ---: | --- | --- | --- |
| 970 | `questionTypeId=1`, `formatTypeId=1`, `scoreTypeId=1` | 4 | single numeric string | no | standard MCQ |
| 499 | `questionTypeId=1`, `formatTypeId=1`, `scoreTypeId=1` | 4 | single numeric string | no | standard MCQ; `answerCharacterLimit=null` |
| 62 | `questionTypeId=1`, `formatTypeId=1`, `scoreTypeId=1` | 4 | single numeric string | yes | exhibit-backed MCQ |
| 43 | `questionTypeId=1`, `formatTypeId=1`, `scoreTypeId=1` | 4 | single numeric string | yes | exhibit-backed MCQ; `answerCharacterLimit=null` |

Conclusion: this dataset contains single-best-answer, four-option multiple-choice questions. I did not detect SATA, fill-in-blank, ordered response, hotspot, matrix, bow-tie, case study, or free-text questions. The only meaningful rendering variant is whether the question has exhibits.

## Recommended Database Shape

### `questions`

| column concept | source field | classification | notes |
| --- | --- | --- | --- |
| `stem_html` | `questionText` | Mandatory | Main question stem. HTML should be sanitized before rendering. |
| `explanation_html` | `explanationText` | Mandatory | Rationale/review content. HTML should be sanitized before rendering. |
| `question_type` | derived from `questionTypeId`, `formatTypeId`, `scoreTypeId` | Mandatory | Store as our enum, e.g. `single_choice`. Source ids are constant in this file. |
| `source_question_id` | `questionId` | Optional metadata | Useful for dedupe, tracing, and re-imports; not our primary key. |
| `source_question_index` | `questionIndex` | Optional metadata | Useful for traceability; often source-specific. |
| `source_sequence_id` | `sequenceId` | Optional metadata | Source ordering. We can use it for initial import order, but tests should use our own ordering. |
| `difficulty_level_id` | `difficultyLevelId` | Optional | Question-specific filter/adaptive metadata; populated for 779/1,574 questions. |
| `last_source_update` | `lastUpdatedDate` | Optional metadata | Source freshness only. |

### `question_choices`

| column concept | source field | classification | notes |
| --- | --- | --- | --- |
| `choice_html` or `choice_text` | `answerChoiceList[].choice` | Mandatory | User-facing answer option. |
| `position` | array order | Mandatory | Use source array order as display order. |
| `is_correct` | derived from `correctAnswer` | Mandatory | `correctAnswer` is `"1"`-`"4"` and should be treated as a 1-based display position. |
| `source_choice_number` | `answerChoiceList[].choiceNumber` | Optional metadata | Preserve only for traceability; values are source-specific and not simply 1-4. |

Important: `answerChoiceList[].choiceNumber` should not be used as the main correctness mapping. It contains source numbers like `6`, `7`, `8`, etc. The safest importer should preserve array order and map `correctAnswer` as the 1-based choice position.

### `question_taxonomy`

These are question-specific and useful for filtering, reporting, and building tests.

| column concept | source field | classification | notes |
| --- | --- | --- | --- |
| `subject` / `subject_id` | `subject`, `subjectId` | Optional | Present on almost all questions; one record is missing `subject`. |
| `system` / `system_id` | `system`, `systemId` | Optional | Present on all questions. |
| `topic` / `topic_id` | `topic`, `topicId` | Optional | Present on all questions. |
| `title` / `title_id` | `title`, `titleId` | Optional | Present on almost all questions; one record is missing `title`. |
| `standard_header` | `standards[].header` | Optional | One standard per question; examples use `NCSBN Client Need`. |
| `standard_description` | `standards[].description` | Optional | Useful NCLEX client-need category. |
| `standard_type_id` | `standards[].typeId` | Optional metadata | Source taxonomy id. |
| `competency_id` | `competencyId` | Optional metadata | Question-specific taxonomy id, but source-specific. |

I would not make taxonomy mandatory at the DB level unless your app requires every question to be filterable by that dimension. The source mostly has it, but the one missing `subject`/`title` means strict non-null constraints would need cleanup first.

### `question_exhibits`

Only create exhibit rows for questions where `exhibits` is non-null. This is the main optional display variant in the file.

| column concept | source field | classification | notes |
| --- | --- | --- | --- |
| `title` | `exhibits[].title` | Optional | User-facing exhibit tab/title. |
| `file_name` | `exhibits[].fileName` | Optional | Needed if importing exhibits. |
| `base_url` | `exhibits[].baseUrl` | Optional | Needed with `fileName` to resolve the asset. |
| `position` | `exhibits[].sequenceId` | Optional | Exhibit order. |
| `source_exhibit_id` | `exhibits[].id` | Optional metadata | Traceability. |
| `source_type_id` | `exhibits[].typeId` | Optional metadata | Constant `4` in scan. |

### `question_references`

These are question-specific source references. They are not needed for quiz rendering or grading, but can be useful for admin/provenance.

| column concept | source field | classification | notes |
| --- | --- | --- | --- |
| `reference_id` | `questionMappingReferencesList[].referenceId` | Optional metadata | Source reference id. |
| `title` | `questionMappingReferencesList[].title` | Optional | Human-readable reference title. |
| `reference_type_id` | `questionMappingReferencesList[].referenceTypeId` | Optional metadata | Source reference type. |

Most other reference mapping fields are zero/null source hierarchy ids and can be ignored unless you later need exact source-platform provenance.

## Field Classification For Import

### Mandatory Question Data

These are the only fields I would require to create a usable question in our DB:

| source field | why |
| --- | --- |
| `questionText` | Question stem. |
| `answerChoiceList[].choice` | Answer option text. |
| array position of each choice | Display order and correctness mapping. |
| `correctAnswer` | Correct option, mapped as 1-based position. |
| `explanationText` | Rationale/review content. |
| `questionTypeId`, `formatTypeId`, `scoreTypeId` | Used once during import to map source format to our `single_choice` type. |

### Optional Question Data

These are specific to the question and worth preserving, but the app can still function if they are missing:

| source field | why |
| --- | --- |
| `questionId` | External source id for dedupe/re-import. |
| `questionIndex` | External source index. |
| `sequenceId` | External source ordering. |
| `subject`, `subjectId` | Taxonomy/filtering. |
| `system`, `systemId` | Taxonomy/filtering. |
| `topic`, `topicId` | Taxonomy/filtering. |
| `title`, `titleId` | Taxonomy/filtering or display grouping. |
| `standards[]` | NCLEX client-need classification. |
| `difficultyLevelId` | Difficulty filter/adaptive selection. |
| `exhibits[]` | Exhibit-backed questions. |
| `additionalText` | Rare extra question content; non-null on 1 question. |
| `scoringGuide` | Rare extra rationale/scoring content; non-null on 1 question. |
| `answerHeader` | Rare extra answer area HTML; non-null on 1 question. |
| `questionMappingReferencesList[]` | Provenance/reference enrichment. |

### Source Metadata To Keep Only If Useful

These are question-adjacent, but source-platform specific:

| source field | recommendation |
| --- | --- |
| `qbankId` | Keep as `source_qbank_id` only if importing from multiple banks. |
| `activeStatusId` | Keep only for source lifecycle/audit. |
| `examYear` | Keep only if you want cohort/version filtering. |
| `lastUpdatedDate` | Keep only for source freshness/re-import logic. |
| `questionSourceId` | Keep only for source audit. |
| `abstractId`, `sectionId`, `topicAttributeId`, `newExamYearQuestionIndex` | Keep only if later source imports prove these meaningful. |
| `correctPercentile`, `peopleTaken`, `othersAvgTimeSpent`, `correctTaken` | External analytics. Usually ignore unless you want seeded popularity/difficulty stats. |

### Ignore For Our Database

These belong to the source website's test attempt/session/result model, or are null/constant fields not useful for our own implementation:

| source field group | examples |
| --- | --- |
| Root test/session wrapper | `testId`, `parentTestId`, `userId`, `testModeId`, `testModeName`, `testName`, `timeInSeconds`, `isStarted`, `isEnded`, `lastQuestionVisited`, `canResume`, `assignmentId`, `subscriptionId` |
| Root score/result fields | `totalQuestionCorrect`, `correctToIncorrect`, `incorrectToCorrect`, `incorrectToIncorrect`, `weightScored`, `passingScore`, `scoreMultiplier` |
| Root source test config | `questionModes`, `questionModeId`, `questionModeName`, `questionModeIds`, `testSource`, `testTypes`, `testTypeId`, `testTypeName`, `allottedTime`, `allottedTimeTypeId` |
| Per-question user/session state | `userAnswer`, `timeSpent`, `dailyTimeSpent`, `dailyTimeSpentReview`, `totalTimeSpentReview`, `isCorrect`, `isIncorrect`, `isMarked`, `isOmitted`, `isSubmitted`, `notes`, `highlights`, `isHintUsed` |
| Per-question source UI/editor state | `isQuestionDirty`, `isQuestionDisabled`, `isAnswerChoiceDisabled`, `questionHeader`, `mobileExcerpt`, `annotations`, `frequentHighlights`, `gradeDetails`, `gradeStatus` |
| Unsupported-format placeholders | `hotspotImageUrl`, `questionMedia`, `passageExcerpt`, `passageType`, `passageTypeId`, `answerCharacterLimit`, `maxAnswerSelection`, `questionSetCount`, `questionSetSequenceId`, `questionToAnswerBeforeThis`, `parentQuestionId`, `subParentQuestionId` |
| Empty/null taxonomy placeholders | `secondarySubject`, `section`, `skill`, `skillId`, `topicAttribute`, `vocabularyList`, `copyrightId`, `copyrightText`, `hint` |
| Choice-level attempt analytics | `answerChoiceList[].correctTaken` |
| Choice parent placeholders | `answerChoiceList[].questionId`, `answerChoiceList[].questionIndex`; both are `0` in scan. |

## Practical Import Recommendation

For the first importer, normalize each source question into:

```js
{
  sourceQuestionId,
  type: "single_choice",
  stemHtml,
  explanationHtml,
  choices: [
    { position: 1, text, isCorrect },
    { position: 2, text, isCorrect },
    { position: 3, text, isCorrect },
    { position: 4, text, isCorrect }
  ],
  taxonomy: {
    subject,
    system,
    topic,
    title,
    standard
  },
  difficultyLevelId,
  exhibits: []
}
```

Everything else should be treated as source metadata or ignored. Your own implementation should create tests, attempts, timers, answers, review state, scores, bookmarks, and analytics from your own tables.
