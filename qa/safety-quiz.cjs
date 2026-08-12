const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const safetyPath = path.join(root, 'safety', 'index.html');

function readSafetyContent() {
  const html = fs.readFileSync(safetyPath, 'utf8');
  const start = html.indexOf('const SAFETY_MODULES');
  const end = html.indexOf('/* ═', start);
  assert(start >= 0 && end > start, 'Could not locate the safety content declarations.');
  const declarations = html.slice(start, end);
  return vm.runInNewContext(
    `(function(){${declarations};return { modules:SAFETY_MODULES, questions:SAFETY_QUESTIONS };})()`,
  );
}

function installedBrowser() {
  return [
    process.env.PLAYWRIGHT_BROWSER_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean).find((candidate) => fs.existsSync(candidate));
}

function validateQuestionBank({ modules, questions }) {
  assert(modules.length > 0, 'Safety module bank is empty.');
  assert(questions.length > 0, 'Safety question bank is empty.');

  const moduleIds = new Set();
  for (const module of modules) {
    assert(module.id && !moduleIds.has(module.id), `Duplicate or missing module id: ${module.id}`);
    moduleIds.add(module.id);
  }

  const prompts = new Set();
  for (const [index, question] of questions.entries()) {
    const label = `Question ${index + 1}`;
    assert(moduleIds.has(question.module), `${label} references unknown module "${question.module}".`);
    assert(question.q && !prompts.has(question.q), `${label} has a missing or duplicate prompt.`);
    prompts.add(question.q);
    assert(Array.isArray(question.grades) && question.grades.length === 2, `${label} has an invalid grade range.`);
    assert(question.grades[0] >= 6 && question.grades[1] <= 12 && question.grades[0] <= question.grades[1], `${label} has an out-of-range grade range.`);
    assert(Array.isArray(question.options) && question.options.length >= 2, `${label} needs at least two options.`);
    assert.strictEqual(new Set(question.options).size, question.options.length, `${label} has duplicate answer text.`);
    assert(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length, `${label} has an invalid answer index.`);
    assert(question.options[question.answer].trim(), `${label} has an empty correct answer.`);
    assert(question.why && question.why.trim(), `${label} is missing its answer explanation.`);
  }

  const gradeCounts = {};
  for (let grade = 6; grade <= 12; grade += 1) {
    const activeModules = modules.filter((module) => !module.grades || (grade >= module.grades[0] && grade <= module.grades[1]));
    const activeIds = new Set(activeModules.map((module) => module.id));
    const activeQuestions = questions.filter((question) => grade >= question.grades[0]
      && grade <= question.grades[1] && activeIds.has(question.module));
    for (const module of activeModules) {
      assert(activeQuestions.some((question) => question.module === module.id), `Grade ${grade} module "${module.id}" has no quiz question.`);
    }
    gradeCounts[grade] = activeQuestions.length;
  }
  return gradeCounts;
}

(async () => {
  const content = readSafetyContent();
  const gradeCounts = validateQuestionBank(content);
  const executablePath = installedBrowser();
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  try {
    await page.goto('http://127.0.0.1:8099/safety/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.evaluate(() => { window.SDSCPA = null; });

    const outcomes = await page.evaluate(() => {
      const results = [];
      for (let questionIndex = 0; questionIndex < SAFETY_QUESTIONS.length; questionIndex += 1) {
        const question = SAFETY_QUESTIONS[questionIndex];
        for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
          quiz = { grade: 6, qs: [question, question], at: 0, responses: [] };
          show('viewQuiz');
          renderQuestion();
          const option = document.querySelectorAll('#qCard .q-opt')[optionIndex];
          option.click();
          const selectedText = document.querySelector('#quizResponse').textContent;
          const next = document.querySelector('#quizNextBtn');
          next.click();
          next.click();
          results.push({
            questionIndex,
            optionIndex,
            selectedText,
            responseCount: quiz.responses.length,
            selectedIndex: quiz.responses[0] && quiz.responses[0].selectedIndex,
            correct: quiz.responses[0] && quiz.responses[0].correct,
          });
        }
      }
      return results;
    });

    assert.strictEqual(outcomes.length, content.questions.reduce((total, question) => total + question.options.length, 0));
    for (const outcome of outcomes) {
      const question = content.questions[outcome.questionIndex];
      assert.strictEqual(outcome.responseCount, 1, `Question ${outcome.questionIndex + 1} advanced more than once.`);
      assert.strictEqual(outcome.selectedIndex, outcome.optionIndex, `Question ${outcome.questionIndex + 1} recorded the wrong option.`);
      assert.strictEqual(outcome.correct, outcome.optionIndex === question.answer, `Question ${outcome.questionIndex + 1} graded option ${outcome.optionIndex} incorrectly.`);
      assert(outcome.selectedText.includes(question.options[outcome.optionIndex]), `Question ${outcome.questionIndex + 1} did not confirm the selected answer text.`);
    }

    const passResults = await page.evaluate(() => {
      const results = [];
      for (let selectedGrade = 6; selectedGrade <= 12; selectedGrade += 1) {
        localStorage.setItem(GRADE_KEY, String(selectedGrade));
        state = stateForGrade(selectedGrade);
        state.trained = Object.fromEntries(
          SAFETY_MODULES
            .filter((module) => !module.grades || (selectedGrade >= module.grades[0] && selectedGrade <= module.grades[1]))
            .map((module) => [module.id, true]),
        );
        state.retrain = {};
        state.passed = false;
        save();
        show('viewHome');
        renderHome();
        const startEnabled = !document.querySelector('#quizStartBtn').disabled;
        document.querySelector('#quizStartBtn').click();
        const gradeLocked = document.querySelector('#gradeBadge').disabled;
        const expectedQuestions = quiz.qs.length;
        while (quiz.at < quiz.qs.length) {
          const question = quiz.qs[quiz.at];
          document.querySelectorAll('#qCard .q-opt')[question.answer].click();
          document.querySelector('#quizNextBtn').click();
        }
        results.push({
          grade: selectedGrade,
          startEnabled,
          gradeLocked,
          expectedQuestions,
          responses: quiz.responses.length,
          passed: state.passed,
          resultText: document.querySelector('#qCard').textContent,
        });
      }
      return results;
    });

    for (const result of passResults) {
      assert(result.startEnabled, `Grade ${result.grade} quiz did not unlock after training.`);
      assert(result.gradeLocked, `Grade ${result.grade} could be changed during an active quiz.`);
      assert.strictEqual(result.expectedQuestions, gradeCounts[result.grade], `Grade ${result.grade} loaded the wrong number of questions.`);
      assert.strictEqual(result.responses, result.expectedQuestions, `Grade ${result.grade} did not record every response.`);
      assert(result.passed && /100%/.test(result.resultText), `Grade ${result.grade} did not pass with every correct answer.`);
    }

    const failure = await page.evaluate(() => {
      localStorage.setItem(GRADE_KEY, '6');
      state = stateForGrade(6);
      state.trained = Object.fromEntries(
        SAFETY_MODULES
          .filter((module) => !module.grades || (6 >= module.grades[0] && 6 <= module.grades[1]))
          .map((module) => [module.id, true]),
      );
      state.retrain = {};
      state.passed = true;
      save();
      const question = SAFETY_QUESTIONS[0];
      const wrongIndex = question.answer === 0 ? 1 : 0;
      quiz = { grade: 6, qs: [question], at: 0, responses: [] };
      show('viewQuiz');
      renderQuestion();
      const nextInitiallyDisabled = document.querySelector('#quizNextBtn').disabled;
      document.querySelectorAll('#qCard .q-opt')[wrongIndex].click();
      document.querySelector('#quizNextBtn').click();
      const text = document.querySelector('#qCard').textContent;
      document.querySelector('#backHomeBtn').click();
      return {
        text,
        selected: question.options[wrongIndex],
        correct: question.options[question.answer],
        nextInitiallyDisabled,
        quizLocked: document.querySelector('#quizStartBtn').disabled,
        gateNote: document.querySelector('#gateNote').textContent,
      };
    });
    assert(failure.nextInitiallyDisabled, 'An unanswered question could be submitted.');
    assert(failure.text.includes(failure.selected), 'Failure review does not show the student answer.');
    assert(failure.text.includes(failure.correct), 'Failure review does not show the correct answer.');
    assert(failure.quizLocked && /Retrain/.test(failure.gateNote), 'A failed retake did not require retraining or showed contradictory pass status.');

    await page.evaluate(({ gradeSixModules }) => {
      localStorage.clear();
      localStorage.setItem('sdscpa_grade', '6');
      localStorage.setItem('sdscpa-safety-v1', JSON.stringify({
        trained: Object.fromEntries(gradeSixModules.map((id) => [id, true])),
        retrain: {},
        passed: false,
      }));
    }, {
      gradeSixModules: content.modules
        .filter((module) => !module.grades || (6 >= module.grades[0] && 6 <= module.grades[1]))
        .map((module) => module.id),
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert(await page.locator('#quizStartBtn').isEnabled(), 'Legacy Grade 6 progress was not migrated.');
    await page.locator('#gradeBadge').click();
    await page.locator('#gradeGrid button', { hasText: /^8$/ }).click();
    assert(await page.locator('#quizStartBtn').isDisabled(), 'Grade 6 training incorrectly unlocked the Grade 8 quiz.');
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert(await page.locator('#quizStartBtn').isDisabled(), 'Grade progress isolation did not survive reload.');

    assert.deepStrictEqual(errors, [], `Safety page emitted errors: ${errors.join('; ')}`);
    console.log(JSON.stringify({
      questionBank: `${content.questions.length} questions / ${outcomes.length} answer choices verified`,
      gradeQuestionCounts: gradeCounts,
      gradePassPaths: passResults.map((result) => result.grade),
      gradeProgressIsolation: 'verified',
    }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
