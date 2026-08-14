import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

/** @typedef {{ title: string, grades?: [number, number], html?: string, type?: 'find'|'sort'|'order'|'pick', prompt?: string, items?: Array<{icon?: string,label: string,hazard?: boolean,why: string,bucket?: number}>, buckets?: string[], steps?: string[], options?: string[], answer?: number, why?: string }} SafetySection */
/** @typedef {{ id: string, icon: string, title: string, blurb: string, grades: [number, number], sections: SafetySection[] }} SafetyModule */
/** @typedef {{ module: string, grades: [number, number], q: string, options: string[], answer: number, why: string }} SafetyQuestion */
/** @typedef {{ modules: SafetyModule[], questions: SafetyQuestion[] }} SafetyContent */

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = dirname(SCRIPT_DIRECTORY);
const SOURCE_PATH = join(REPOSITORY_ROOT, 'safety', 'index.html');
const OUTPUT_DIRECTORY = join(SCRIPT_DIRECTORY, 'dist');
const TARGET_GRADES = Object.freeze([8, 9, 10]);
const CANVAS_NAMESPACE = 'http://canvas.instructure.com/xsd/cccv1p0';
const CANVAS_SCHEMA = 'https://canvas.instructure.com/xsd/cccv1p0.xsd';

/** @returns {string} */
function sanitizeAudienceText(value) {
  return String(value)
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\u200D\uFE0E\uFE0F]/gu, '')
    .replace(/&mdash;|&#8212;|&#x2014;/gi, '-')
    .replaceAll('—', '-');
}

/** @returns {string} */
function escapeXml(value) {
  return sanitizeAudienceText(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/** @returns {string} */
function escapeHtml(value) {
  return sanitizeAudienceText(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** @returns {string} */
function findArrayExpression(source, constantName) {
  const marker = `const ${constantName} = [`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error(`Unable to find ${constantName} in ${SOURCE_PATH}`);
  }

  const arrayStart = source.indexOf('[', markerIndex);
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = arrayStart; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1] ?? '';
    if (lineComment) {
      if (character === '\n') {
        lineComment = false;
      }
      continue;
    }
    if (blockComment) {
      if (character === '*' && nextCharacter === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = '';
      }
      continue;
    }
    if (character === '/' && nextCharacter === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === '/' && nextCharacter === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === '[') {
      depth += 1;
    } else if (character === ']') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(arrayStart, index + 1);
      }
    }
  }

  throw new Error(`Unable to find the end of ${constantName} in ${SOURCE_PATH}`);
}

/** @returns {SafetyContent} */
function readSafetyContent(source) {
  const moduleExpression = findArrayExpression(source, 'SAFETY_MODULES');
  const questionExpression = findArrayExpression(source, 'SAFETY_QUESTIONS');
  const modules = vm.runInNewContext(`(${moduleExpression})`, Object.create(null), { timeout: 1000 });
  const questions = vm.runInNewContext(`(${questionExpression})`, Object.create(null), { timeout: 1000 });
  if (!Array.isArray(modules) || !Array.isArray(questions)) {
    throw new TypeError('Safety content constants must both be arrays.');
  }
  return { modules, questions };
}

/** @returns {boolean} */
function appliesToGrade(item, grade) {
  return !item.grades || (grade >= item.grades[0] && grade <= item.grades[1]);
}

/** @returns {SafetyContent} */
function contentForGrade(content, grade) {
  const modules = content.modules
    .filter((module) => appliesToGrade(module, grade))
    .map((module) => ({
      ...module,
      sections: module.sections.filter((section) => appliesToGrade(section, grade)),
    }));
  const moduleIds = new Set(modules.map((module) => module.id));
  const questions = content.questions.filter(
    (question) => appliesToGrade(question, grade) && moduleIds.has(question.module),
  );
  return { modules, questions };
}

/** @returns {void} */
function validateContent(content, grade) {
  if (content.modules.length === 0) {
    throw new Error(`Grade ${grade} has no safety modules.`);
  }
  if (content.questions.length === 0) {
    throw new Error(`Grade ${grade} has no safety-test questions.`);
  }
  const moduleIds = new Set(content.modules.map((module) => module.id));
  for (const question of content.questions) {
    if (!moduleIds.has(question.module)) {
      throw new Error(`Grade ${grade} question references missing module ${question.module}.`);
    }
    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length) {
      throw new RangeError(`Grade ${grade} question has an invalid answer index: ${question.q}`);
    }
  }
}

/** @returns {string} */
function renderRainbowStripe() {
  const colors = ['#7AC143', '#F7941E', '#ED1C45', '#EC008C', '#92278F', '#2E3192', '#00AEEF'];
  return `<table role="presentation" style="width:100%;border-collapse:collapse;margin:0"><tr>${colors.map((color) => `<td style="height:5px;background:${color};padding:0;border:0"></td>`).join('')}</tr></table>`;
}

/** @returns {string} */
function renderWordmark() {
  const letters = [
    ['S', '#7AC143'],
    ['D', '#F7941E'],
    ['S', '#ED1C45'],
    ['C', '#EC008C'],
    ['P', '#92278F'],
    ['A', '#00AEEF'],
  ];
  return letters.map(([letter, color]) => `<span style="color:${color}">${letter}</span>`).join('');
}

/** @returns {string} */
function renderActivity(section) {
  if (!section.type) {
    return sanitizeAudienceText(section.html ?? '');
  }
  const prompt = section.prompt ? `<div style="margin-bottom:14px">${sanitizeAudienceText(section.prompt)}</div>` : '';

  if (section.type === 'find') {
    const rows = (section.items ?? []).map((item) => {
      const status = item.hazard ? 'HAZARD' : 'SAFE';
      const statusColor = item.hazard ? '#ef4444' : '#22c55e';
      return `<tr><td style="padding:10px;border-bottom:1px solid #333;color:#f0f0f0">${escapeHtml(item.icon ?? '')} ${escapeHtml(item.label)}</td><td style="padding:10px;border-bottom:1px solid #333;color:${statusColor};font-weight:800">${status}</td><td style="padding:10px;border-bottom:1px solid #333;color:#b8bdc7">${escapeHtml(item.why)}</td></tr>`;
    }).join('');
    return `${prompt}<table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:8px;text-align:left;color:#888;font-size:11px">ITEM</th><th style="padding:8px;text-align:left;color:#888;font-size:11px">CHECK</th><th style="padding:8px;text-align:left;color:#888;font-size:11px">WHY</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  if (section.type === 'sort') {
    const rows = (section.items ?? []).map((item) => {
      const bucket = section.buckets?.[item.bucket ?? -1] ?? 'Unassigned';
      return `<tr><td style="padding:10px;border-bottom:1px solid #333;color:#f0f0f0">${escapeHtml(item.label)}</td><td style="padding:10px;border-bottom:1px solid #333;color:#fbbf24;font-weight:700">${escapeHtml(bucket)}</td><td style="padding:10px;border-bottom:1px solid #333;color:#b8bdc7">${escapeHtml(item.why)}</td></tr>`;
    }).join('');
    return `${prompt}<table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:8px;text-align:left;color:#888;font-size:11px">ITEM</th><th style="padding:8px;text-align:left;color:#888;font-size:11px">CORRECT CATEGORY</th><th style="padding:8px;text-align:left;color:#888;font-size:11px">WHY</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  if (section.type === 'order') {
    const steps = (section.steps ?? []).map((step) => `<li style="margin:0 0 9px 0">${escapeHtml(step)}</li>`).join('');
    return `${prompt}<p style="color:#fbbf24;font-size:12px;font-weight:800;letter-spacing:1px">CORRECT ORDER</p><ol style="padding-left:24px;margin-bottom:0">${steps}</ol>`;
  }

  if (section.type === 'pick') {
    const choices = (section.options ?? []).map((option, index) => `<li style="margin:0 0 7px 0">${escapeHtml(option)}${index === section.answer ? ' <strong style="color:#22c55e">- Correct</strong>' : ''}</li>`).join('');
    return `${prompt}<ol type="A" style="padding-left:26px">${choices}</ol><div style="margin-top:14px;border-left:3px solid #22c55e;padding:10px 12px;background:#101014;color:#d6dae1"><strong>Why:</strong> ${escapeHtml(section.why ?? '')}</div>`;
  }

  throw new TypeError(`Unsupported safety activity type: ${section.type}`);
}

/** @returns {string} */
function renderModulePage(module, grade, pageId) {
  const accent = '#00AEEF';
  const sections = module.sections.map((section, index) => `
    <section style="background:#1a1a1a;border:1px solid #333;border-left:4px solid ${accent};border-radius:12px;padding:20px 22px;margin:0 0 18px 0;color:#d6dae1;line-height:1.6">
      <div style="color:#888;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:5px">SECTION ${index + 1} OF ${module.sections.length}</div>
      <h2 style="color:#f0f0f0;font-size:21px;margin:0 0 12px 0">${escapeHtml(section.title)}</h2>
      ${renderActivity(section)}
    </section>`).join('');

  const title = `Grade ${grade} Safety Lab - ${module.title}`;
  return `<!doctype html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>${escapeHtml(title)}</title>
  <meta name="identifier" content="${escapeHtml(pageId)}"/>
  <meta name="editing_roles" content="teachers"/>
  <meta name="workflow_state" content="active"/>
  <meta name="front_page" content="false"/>
</head>
<body>
  <div style="max-width:1000px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;border:1px solid #333;border-radius:14px;overflow:hidden">
    <header style="padding:34px 28px 28px;text-align:center;background:#0a0a0a">
      <div style="font-family:'Arial Black',Arial,sans-serif;font-size:36px;font-weight:900;letter-spacing:-2px;line-height:1">${renderWordmark()}</div>
      <div style="color:#888;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-top:7px">DESIGN &amp; PRODUCTION · SAFETY LAB</div>
      <div style="display:inline-block;border:1px solid #333;border-radius:999px;color:#fbbf24;font-size:11px;font-weight:800;letter-spacing:1px;padding:6px 12px;margin-top:17px">GRADE ${grade}</div>
    </header>
    ${renderRainbowStripe()}
    <main style="padding:28px">
      <div style="margin-bottom:24px">
        <h1 style="font-size:30px;line-height:1.15;margin:0 0 10px 0;color:#f0f0f0">${escapeHtml(module.title)}</h1>
        <p style="color:#a9adb4;font-size:15px;line-height:1.6;margin:0">${escapeHtml(module.blurb)}</p>
      </div>
      ${sections}
      <div style="border-left:3px solid #fbbf24;padding:12px 14px;background:#1a1a1a;color:#d6dae1;line-height:1.55">
        <strong style="color:#fbbf24">Certification reminder:</strong> Complete every page in this module, then earn 100% on the safety test. Passing the Canvas test does not replace instructor permission, hands-on demonstrations, or guided-practice sign-off.
      </div>
    </main>
    <footer style="padding:0 28px 28px;text-align:center;color:#888;font-family:'SF Mono',Consolas,monospace;font-size:11px">SDSCPA · DESIGN &amp; PRODUCTION · SAFETY LAB</footer>
  </div>
</body>
</html>`;
}

/** @returns {string} */
function renderQuestionMetadata(question, questionIndex) {
  const answerIds = question.options.map((unusedOption, answerIndex) => `g${questionIndex + 1}_a${answerIndex + 1}`);
  return `<qtimetadatafield><fieldlabel>question_type</fieldlabel><fieldentry>multiple_choice_question</fieldentry></qtimetadatafield>
<qtimetadatafield><fieldlabel>points_possible</fieldlabel><fieldentry>1</fieldentry></qtimetadatafield>
<qtimetadatafield><fieldlabel>original_answer_ids</fieldlabel><fieldentry>${answerIds.join(',')}</fieldentry></qtimetadatafield>`;
}

/** @returns {string} */
function renderCommonCartridgeQuestionMetadata(unusedQuestion, unusedQuestionIndex) {
  return `<qtimetadatafield><fieldlabel>cc_profile</fieldlabel><fieldentry>cc.multiple_choice.v0p1</fieldentry></qtimetadatafield>`;
}

/** @returns {string} */
function renderQtiQuestion(question, questionIndex, moduleTitles, renderMetadata) {
  const questionId = `question_${questionIndex + 1}`;
  const answerIds = question.options.map((unusedOption, answerIndex) => `g${questionIndex + 1}_a${answerIndex + 1}`);
  const correctAnswerId = answerIds[question.answer];
  const choices = question.options.map((option, answerIndex) => `
          <response_label ident="${answerIds[answerIndex]}">
            <material><mattext texttype="text/plain">${escapeXml(option)}</mattext></material>
          </response_label>`).join('');
  const moduleTitle = moduleTitles.get(question.module) ?? question.module;
  const feedback = `Review ${moduleTitle}. ${question.why}`;
  return `<item ident="${questionId}" title="Question ${questionIndex + 1}">
  <itemmetadata><qtimetadata>${renderMetadata(question, questionIndex)}</qtimetadata></itemmetadata>
  <presentation>
    <material><mattext texttype="text/html">${escapeXml(`<div>${question.q}</div>`)}</mattext></material>
    <response_lid ident="response1" rcardinality="Single">
      <render_choice>${choices}
      </render_choice>
    </response_lid>
  </presentation>
  <resprocessing>
    <outcomes><decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/></outcomes>
    <respcondition continue="No">
      <conditionvar><varequal respident="response1">${correctAnswerId}</varequal></conditionvar>
      <setvar action="Set" varname="SCORE">100</setvar>
      <displayfeedback feedbacktype="Response" linkrefid="correct_fb"/>
    </respcondition>
    <respcondition continue="No">
      <conditionvar><other/></conditionvar>
      <displayfeedback feedbacktype="Response" linkrefid="general_incorrect_fb"/>
    </respcondition>
  </resprocessing>
  <itemfeedback ident="correct_fb"><flow_mat><material><mattext texttype="text/plain">${escapeXml(question.why)}</mattext></material></flow_mat></itemfeedback>
  <itemfeedback ident="general_incorrect_fb"><flow_mat><material><mattext texttype="text/plain">${escapeXml(feedback)}</mattext></material></flow_mat></itemfeedback>
</item>`;
}

/** @returns {string} */
function renderAssessmentQti(content, grade, renderMetadata, schemaLocation) {
  const quizId = `sdscpa_safety_quiz_grade_${grade}`;
  const moduleTitles = new Map(content.modules.map((module) => [module.id, module.title]));
  const questions = content.questions.map(
    (question, index) => renderQtiQuestion(question, index, moduleTitles, renderMetadata),
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/ims_qtiasiv1p2 ${schemaLocation}">
  <assessment ident="${quizId}" title="Grade ${grade} Theatre Safety Certification Test">
    <qtimetadata>
      <qtimetadatafield><fieldlabel>cc_profile</fieldlabel><fieldentry>cc.exam.v0p1</fieldentry></qtimetadatafield>
      <qtimetadatafield><fieldlabel>qmd_assessmenttype</fieldlabel><fieldentry>Examination</fieldentry></qtimetadatafield>
      <qtimetadatafield><fieldlabel>qmd_scoretype</fieldlabel><fieldentry>Percentage</fieldentry></qtimetadatafield>
      <qtimetadatafield><fieldlabel>cc_maxattempts</fieldlabel><fieldentry>unlimited</fieldentry></qtimetadatafield>
    </qtimetadata>
    <section ident="root_section">
${questions}
    </section>
  </assessment>
</questestinterop>`;
}

/** @returns {string} */
function renderQuizMetadata(content, grade) {
  const quizId = `sdscpa_safety_quiz_grade_${grade}`;
  const assignmentId = `sdscpa_safety_assignment_grade_${grade}`;
  const points = content.questions.length;
  const description = `<div style="background:#0a0a0a;color:#f0f0f0;border:1px solid #333;border-radius:14px;padding:24px;font-family:Inter,Arial,sans-serif"><div style="font-family:Arial Black,Arial,sans-serif;font-size:30px;font-weight:900">${renderWordmark()}</div>${renderRainbowStripe()}<h2 style="color:#f0f0f0">Grade ${grade} Theatre Safety Certification Test</h2><p style="color:#d6dae1;line-height:1.6">This test covers every rule and tool assigned to Grade ${grade}. A score of <strong style="color:#22c55e">100%</strong> is required.</p><p style="color:#d6dae1;line-height:1.6"><strong style="color:#fbbf24">After an attempt:</strong> Review the module named in the feedback for every missed question. On your next attempt, correct answers carry forward and Canvas presents only the questions you still need to answer correctly. Repeat this review-and-retry process until you earn 100%.</p><p style="color:#fbbf24;line-height:1.6"><strong>Important:</strong> Passing this test does not authorize equipment use. Instructor permission, hands-on demonstrations, and guided-practice sign-off are still required.</p></div>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<quiz identifier="${quizId}" xmlns="${CANVAS_NAMESPACE}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="${CANVAS_NAMESPACE} ${CANVAS_SCHEMA}">
  <title>Grade ${grade} Theatre Safety Certification Test</title>
  <description>${escapeXml(description)}</description>
  <shuffle_answers>true</shuffle_answers>
  <scoring_policy>keep_highest</scoring_policy>
  <hide_results></hide_results>
  <quiz_type>assignment</quiz_type>
  <points_possible>${points}</points_possible>
  <show_correct_answers>true</show_correct_answers>
  <allowed_attempts>-1</allowed_attempts>
  <build_on_last_attempt>true</build_on_last_attempt>
  <one_question_at_a_time>true</one_question_at_a_time>
  <cant_go_back>false</cant_go_back>
  <available>true</available>
  <assignment identifier="${assignmentId}">
    <title>Grade ${grade} Theatre Safety Certification Test</title>
    <workflow_state>published</workflow_state>
    <points_possible>${points}</points_possible>
    <grading_type>points</grading_type>
    <submission_types>online_quiz</submission_types>
    <position>1</position>
    <quiz_identifierref>${quizId}</quiz_identifierref>
    <allowed_attempts>-1</allowed_attempts>
  </assignment>
</quiz>`;
}

/** @returns {string} */
function renderModuleMetadata(content, grade) {
  const moduleId = `sdscpa_safety_module_grade_${grade}`;
  const pageItems = content.modules.map((module, index) => {
    const pageId = `sdscpa_safety_g${grade}_${module.id}`;
    const itemId = `sdscpa_safety_g${grade}_${module.id}_item`;
    return `    <item identifier="${itemId}">
      <content_type>WikiPage</content_type>
      <workflow_state>active</workflow_state>
      <title>${escapeXml(`${module.icon} ${module.title}`)}</title>
      <identifierref>${pageId}</identifierref>
      <position>${index + 1}</position>
      <new_tab>false</new_tab>
      <indent>0</indent>
    </item>`;
  }).join('\n');
  const quizItemId = `sdscpa_safety_g${grade}_quiz_item`;
  const quizId = `sdscpa_safety_quiz_grade_${grade}`;
  const requirements = content.modules.map((module) => `    <completionRequirement type="must_view"><identifierref>sdscpa_safety_g${grade}_${module.id}_item</identifierref></completionRequirement>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<modules xmlns="${CANVAS_NAMESPACE}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="${CANVAS_NAMESPACE} ${CANVAS_SCHEMA}">
  <module identifier="${moduleId}">
    <title>Grade ${grade} · Theatre Safety Certification</title>
    <workflow_state>active</workflow_state>
    <position>1</position>
    <require_sequential_progress>true</require_sequential_progress>
    <items>
${pageItems}
    <item identifier="${quizItemId}">
      <content_type>Quizzes::Quiz</content_type>
      <workflow_state>active</workflow_state>
      <title>Grade ${grade} Theatre Safety Certification Test</title>
      <identifierref>${quizId}</identifierref>
      <position>${content.modules.length + 1}</position>
      <new_tab>false</new_tab>
      <indent>0</indent>
    </item>
    </items>
    <completionRequirements>
${requirements}
    <completionRequirement type="min_score"><min_score>${content.questions.length}</min_score><identifierref>${quizItemId}</identifierref></completionRequirement>
    </completionRequirements>
  </module>
</modules>`;
}

/** @returns {string} */
function renderManifest(content, grade) {
  const pageItems = content.modules.map((module) => {
    const pageId = `sdscpa_safety_g${grade}_${module.id}`;
    return `        <item identifier="${pageId}_org_item" identifierref="${pageId}"><title>${escapeXml(`${module.icon} ${module.title}`)}</title></item>`;
  }).join('\n');
  const pageResources = content.modules.map((module) => {
    const pageId = `sdscpa_safety_g${grade}_${module.id}`;
    return `    <resource identifier="${pageId}" type="webcontent" href="wiki_content/grade-${grade}-${module.id}.html"><file href="wiki_content/grade-${grade}-${module.id}.html"/></resource>`;
  }).join('\n');
  const quizId = `sdscpa_safety_quiz_grade_${grade}`;
  const quizMetaId = `${quizId}_canvas_meta`;
  const canvasResourceId = `sdscpa_safety_grade_${grade}_canvas_settings`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="sdscpa_safety_grade_${grade}" xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1" xmlns:lom="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource" xmlns:lomimscc="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd">
  <metadata>
    <schema>IMS Common Cartridge</schema>
    <schemaversion>1.1.0</schemaversion>
    <lomimscc:lom><lomimscc:general><lomimscc:title><lomimscc:string>SDSCPA Grade ${grade} Theatre Safety Certification</lomimscc:string></lomimscc:title></lomimscc:general></lomimscc:lom>
  </metadata>
  <organizations>
    <organization identifier="org_1" structure="rooted-hierarchy">
      <item identifier="LearningModules">
        <item identifier="sdscpa_safety_grade_${grade}_org_module">
          <title>Grade ${grade} · Theatre Safety Certification</title>
${pageItems}
          <item identifier="${quizId}_org_item" identifierref="${quizId}"><title>Grade ${grade} Theatre Safety Certification Test</title></item>
        </item>
      </item>
    </organization>
  </organizations>
  <resources>
${pageResources}
    <resource identifier="${quizId}" type="imsqti_xmlv1p2/imscc_xmlv1p1/assessment">
      <file href="${quizId}/assessment_qti.xml"/>
      <dependency identifierref="${quizMetaId}"/>
    </resource>
    <resource identifier="${quizMetaId}" type="associatedcontent/imscc_xmlv1p1/learning-application-resource" href="${quizId}/assessment_meta.xml">
      <file href="${quizId}/assessment_meta.xml"/>
      <file href="non_cc_assessments/${quizId}.xml.qti"/>
    </resource>
    <resource identifier="${canvasResourceId}" type="associatedcontent/imscc_xmlv1p1/learning-application-resource" href="course_settings/canvas_export.txt">
      <file href="course_settings/module_meta.xml"/>
      <file href="course_settings/canvas_export.txt"/>
    </resource>
  </resources>
</manifest>`;
}

/** @returns {void} */
function writePackageFiles(buildDirectory, content, grade) {
  const quizId = `sdscpa_safety_quiz_grade_${grade}`;
  mkdirSync(join(buildDirectory, 'wiki_content'), { recursive: true });
  mkdirSync(join(buildDirectory, 'course_settings'), { recursive: true });
  mkdirSync(join(buildDirectory, quizId), { recursive: true });
  mkdirSync(join(buildDirectory, 'non_cc_assessments'), { recursive: true });

  for (const module of content.modules) {
    const pageId = `sdscpa_safety_g${grade}_${module.id}`;
    writeFileSync(
      join(buildDirectory, 'wiki_content', `grade-${grade}-${module.id}.html`),
      renderModulePage(module, grade, pageId),
      'utf8',
    );
  }

  const commonCartridgeQti = renderAssessmentQti(
    content,
    grade,
    renderCommonCartridgeQuestionMetadata,
    'http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_qtiasiv1p2p1_v1p0.xsd',
  );
  const canvasQti = renderAssessmentQti(
    content,
    grade,
    renderQuestionMetadata,
    'http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd',
  );
  writeFileSync(join(buildDirectory, quizId, 'assessment_qti.xml'), commonCartridgeQti, 'utf8');
  writeFileSync(join(buildDirectory, quizId, 'assessment_meta.xml'), renderQuizMetadata(content, grade), 'utf8');
  writeFileSync(join(buildDirectory, 'non_cc_assessments', `${quizId}.xml.qti`), canvasQti, 'utf8');
  writeFileSync(join(buildDirectory, 'course_settings', 'module_meta.xml'), renderModuleMetadata(content, grade), 'utf8');
  writeFileSync(
    join(buildDirectory, 'course_settings', 'canvas_export.txt'),
    'SDSCPA Design & Production Canvas safety module export.\n',
    'utf8',
  );
  writeFileSync(join(buildDirectory, 'imsmanifest.xml'), renderManifest(content, grade), 'utf8');
}

/** @returns {string} */
function buildPackage(content, grade) {
  validateContent(content, grade);
  const buildDirectory = mkdtempSync(join(tmpdir(), `sdscpa-safety-grade-${grade}-`));
  const outputPath = join(OUTPUT_DIRECTORY, `SDSCPA-Safety-Lab-Grade-${grade}.imscc`);
  try {
    writePackageFiles(buildDirectory, content, grade);
    rmSync(outputPath, { force: true });
    execFileSync('zip', ['-q', '-r', outputPath, '.'], { cwd: buildDirectory });
  } finally {
    rmSync(buildDirectory, { recursive: true, force: true });
  }
  return outputPath;
}

/** @returns {void} */
function main() {
  const source = readFileSync(SOURCE_PATH, 'utf8');
  const safetyContent = readSafetyContent(source);
  mkdirSync(OUTPUT_DIRECTORY, { recursive: true });

  const summaries = TARGET_GRADES.map((grade) => {
    const gradeContent = contentForGrade(safetyContent, grade);
    const outputPath = buildPackage(gradeContent, grade);
    return {
      grade,
      modules: gradeContent.modules.length,
      sections: gradeContent.modules.reduce((total, module) => total + module.sections.length, 0),
      questions: gradeContent.questions.length,
      outputPath,
    };
  });

  for (const summary of summaries) {
    process.stdout.write(
      `Grade ${summary.grade}: ${summary.modules} pages, ${summary.sections} sections, ${summary.questions} questions -> ${summary.outputPath}\n`,
    );
  }
}

main();
