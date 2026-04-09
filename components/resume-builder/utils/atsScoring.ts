import type { ResumeData, ATSResult } from '../types';

// ─── Stop Words ────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'is','are','was','were','be','been','being','have','has','had','do','does','did',
  'will','would','could','should','may','might','must','can','it','its','this',
  'that','these','those','we','you','he','she','they','them','their','our','your',
  'as','if','into','from','up','about','all','both','each','very','just','any',
  'not','no','so','how','when','where','why','what','who','which','than',
  'then','also','more','than','such','same','after','before','through','between',
]);

// ─── Synonym Map ───────────────────────────────────────────────────────────────

const SYNONYMS: Record<string, string[]> = {
  javascript:    ['js', 'ecmascript', 'es6', 'es2015'],
  typescript:    ['ts'],
  react:         ['reactjs', 'react.js'],
  nodejs:        ['node', 'node.js'],
  restful:       ['rest', 'rest api', 'restapi'],
  graphql:       ['gql'],
  git:           ['github', 'gitlab', 'version control', 'vcs'],
  aws:           ['amazon web services', 'amazon cloud', 's3', 'ec2', 'lambda'],
  gcp:           ['google cloud', 'google cloud platform'],
  azure:         ['microsoft azure'],
  sql:           ['mysql', 'postgresql', 'postgres', 'sqlite'],
  nosql:         ['mongodb', 'dynamodb', 'cassandra', 'redis'],
  docker:        ['containerization', 'containers'],
  kubernetes:    ['k8s', 'container orchestration'],
  'ci/cd':       ['continuous integration', 'continuous deployment', 'devops', 'cicd'],
  'machine learning': ['ml', 'ai', 'deep learning', 'neural network'],
  python:        ['py'],
  developed:     ['built', 'created', 'implemented', 'engineered'],
  managed:       ['led', 'supervised', 'oversaw', 'owned'],
  improved:      ['optimized', 'enhanced', 'increased', 'boosted'],
  reduced:       ['decreased', 'cut', 'lowered', 'minimized'],
  designed:      ['architected', 'structured', 'modeled'],
  deployed:      ['shipped', 'released', 'launched', 'published'],
  collaborated:  ['worked with', 'partnered', 'cooperated'],
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function normalizeWord(word: string): string {
  word = word.toLowerCase().replace(/[^a-z0-9#+/.]/g, '').trim();
  for (const [canonical, syns] of Object.entries(SYNONYMS)) {
    if (word === canonical || syns.includes(word)) return canonical;
  }
  return word;
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s#.+/]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))
    .map(normalizeWord)
    .filter(Boolean);
  return [...new Set(words)];
}

function getResumeText(resume: ResumeData): string {
  return [
    resume.summary,
    resume.skills.flatMap(c => c.skills).join(' '),
    resume.experience.map(e => `${e.company} ${e.role} ${e.bullets.join(' ')}`).join(' '),
    resume.projects.map(p => `${p.title} ${p.description} ${p.techStack.join(' ')} ${p.bullets.join(' ')}`).join(' '),
    resume.education.map(e => `${e.institution} ${e.degree} ${e.field}`).join(' '),
  ].join(' ');
}

// ─── Main Scoring ──────────────────────────────────────────────────────────────

export function calculateATSScore(resume: ResumeData, jobDescription: string): ATSResult {
  const jdKeywords = extractKeywords(jobDescription);
  const resumeText = getResumeText(resume);
  const resumeKeywords = extractKeywords(resumeText);
  const resumeTextLower = resumeText.toLowerCase();

  // Filter meaningful JD keywords (top 50)
  const significant = jdKeywords
    .filter(k => k.length > 2 && !STOP_WORDS.has(k))
    .slice(0, 50);

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of significant) {
    if (resumeKeywords.includes(kw) || resumeTextLower.includes(kw)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const keywordMatch = significant.length > 0
    ? Math.round((matchedKeywords.length / significant.length) * 100)
    : 50;

  // Skills coverage (20%)
  const resumeSkills = resume.skills.flatMap(c => c.skills.map(s => s.toLowerCase()));
  const jdSkillKws = jdKeywords.filter(k => k.length > 2).slice(0, 20);
  const skillMatches = jdSkillKws.filter(k =>
    resumeSkills.some(s => s.includes(k) || k.includes(s))
  );
  const skillsCoverage = jdSkillKws.length > 0
    ? Math.round((skillMatches.length / jdSkillKws.length) * 100)
    : 60;

  // Experience relevance (25%)
  const expText = resume.experience.map(e =>
    `${e.role} ${e.company} ${e.bullets.join(' ')}`
  ).join(' ').toLowerCase();
  const jdRoleKws = jdKeywords.filter(k => k.length > 3).slice(0, 25);
  const expMatches = jdRoleKws.filter(k => expText.includes(k));
  const experienceRelevance = jdRoleKws.length > 0
    ? Math.round((expMatches.length / jdRoleKws.length) * 100)
    : 50;

  // Formatting / completeness (15%)
  let formatting = 50;
  if (resume.header.email) formatting += 6;
  if (resume.header.phone) formatting += 6;
  if (resume.header.name) formatting += 4;
  if (resume.summary.length > 80) formatting += 8;
  if (resume.experience.length > 0) formatting += 8;
  if (resume.skills.some(c => c.skills.length > 0)) formatting += 8;
  if (resume.education.length > 0) formatting += 6;
  const expWithBullets = resume.experience.filter(e => e.bullets.length >= 3).length;
  formatting += Math.min(expWithBullets * 2, 4);
  formatting = Math.min(100, formatting);

  // Projects section relevance
  const projText = resume.projects.map(p =>
    `${p.title} ${p.description} ${p.techStack.join(' ')}`
  ).join(' ').toLowerCase();
  const projMatches = jdKeywords.filter(k => projText.includes(k));
  const projectsRelevance = jdKeywords.length > 0
    ? Math.round((projMatches.length / Math.min(jdKeywords.length, 20)) * 100)
    : 50;

  // Overall (weighted)
  const overall = Math.min(100, Math.round(
    keywordMatch * 0.40 +
    experienceRelevance * 0.25 +
    Math.min(skillsCoverage, 100) * 0.20 +
    formatting * 0.15
  ));

  // Suggestions
  const suggestions: string[] = [];
  const top5Missing = missingKeywords.slice(0, 5);
  if (top5Missing.length > 0) {
    suggestions.push(`Add missing keywords to skills/summary: ${top5Missing.join(', ')}`);
  }
  if (resume.experience.some(e => e.bullets.length < 3)) {
    suggestions.push('Add 3–5 bullet points per experience role for better ATS coverage');
  }
  const actionVerbs = ['built','developed','led','managed','improved','optimized','designed','implemented','created','launched','scaled','reduced','increased','delivered','architected'];
  const allBullets = resume.experience.flatMap(e => e.bullets);
  const hasGoodVerbs = allBullets.some(b =>
    actionVerbs.some(v => b.toLowerCase().trim().startsWith(v))
  );
  if (!hasGoodVerbs && allBullets.length > 0) {
    suggestions.push('Start bullet points with strong action verbs (Built, Led, Optimized, Delivered…)');
  }
  const hasMetrics = allBullets.some(b => /\d+%|\$\d+|\d+[kKmMxX]|reduced|increased/.test(b));
  if (!hasMetrics && allBullets.length > 0) {
    suggestions.push('Quantify achievements — e.g. "Reduced API latency by 40%", "Served 50k+ users"');
  }
  if (resume.summary.length < 100) {
    suggestions.push('Expand your professional summary to 2–3 sentences (100+ characters)');
  }
  if (skillsCoverage < 50) {
    suggestions.push('Add more technical skills listed in the job description to Skills section');
  }
  if (resume.projects.length === 0) {
    suggestions.push('Add relevant projects to demonstrate hands-on experience with required technologies');
  }

  return {
    overall,
    keywordMatch: Math.min(100, keywordMatch),
    experienceRelevance: Math.min(100, experienceRelevance),
    skillsCoverage: Math.min(100, skillsCoverage),
    formatting: Math.min(100, formatting),
    matchedKeywords: matchedKeywords.slice(0, 20),
    missingKeywords: missingKeywords.slice(0, 15),
    suggestions: suggestions.slice(0, 6),
    sectionScores: {
      skills: Math.min(100, skillsCoverage),
      experience: Math.min(100, experienceRelevance),
      projects: Math.min(100, projectsRelevance),
    },
  };
}
