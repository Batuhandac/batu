const fs = require('fs');
const path = require('path');

const root = process.cwd();
const fixtureDir = path.join(root, 'scan-fixtures');
const allowedStatuses = new Set(['verified', 'needs_review', 'unidentified', 'wrong']);

function normalize(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function readFixtures(dir) {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const fixtures = [];

  for (const entry of entries) {
    if (entry.name === 'reports') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) fixtures.push(...readFixtures(fullPath));
    if (entry.isFile() && entry.name.endsWith('.json')) fixtures.push(fullPath);
  }

  return fixtures;
}

function compareFixture(file) {
  const fixture = JSON.parse(fs.readFileSync(file, 'utf8'));
  const expected = fixture.expected ?? {};
  const actual = fixture.actual ?? {};
  const problems = [];

  if (!fixture.id) problems.push('missing id');
  if (!allowedStatuses.has(fixture.status)) problems.push(`invalid status "${fixture.status}"`);

  if (fixture.status === 'verified') {
    for (const key of ['game', 'name', 'setCode', 'number', 'rarity']) {
      if (expected[key] && normalize(expected[key]) !== normalize(actual[key])) {
        problems.push(`${key} mismatch: expected "${expected[key]}", got "${actual[key] ?? ''}"`);
      }
    }
  }

  return {
    file,
    status: fixture.status,
    game: expected.game ?? actual.game ?? 'unknown',
    problems,
  };
}

const fixtureFiles = readFixtures(fixtureDir);
const results = fixtureFiles.map(compareFixture);
const totals = {
  fixtures: results.length,
  verified: 0,
  needs_review: 0,
  unidentified: 0,
  wrong: 0,
  invalid: 0,
};

for (const result of results) {
  if (allowedStatuses.has(result.status)) totals[result.status] += 1;
  if (result.problems.length) totals.invalid += 1;
}

const exactAccuracy = totals.fixtures > 0
  ? ((totals.verified / totals.fixtures) * 100).toFixed(1)
  : '0.0';

console.log(`Scan fixtures: ${totals.fixtures}`);
console.log(`Verified: ${totals.verified}`);
console.log(`Needs review: ${totals.needs_review}`);
console.log(`Unidentified: ${totals.unidentified}`);
console.log(`Wrong: ${totals.wrong}`);
console.log(`Invalid fixtures: ${totals.invalid}`);
console.log(`Exact verified rate: ${exactAccuracy}%`);

for (const result of results.filter((item) => item.problems.length)) {
  console.log(`\n${path.relative(root, result.file)}`);
  for (const problem of result.problems) console.log(`- ${problem}`);
}

if (totals.wrong > 0 || totals.invalid > 0) process.exit(1);
