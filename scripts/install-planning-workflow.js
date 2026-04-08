#!/usr/bin/env node
/**
 * Install the planning workflow into a target project.
 *
 * Copies commands, templates, agents, and skills from this repository
 * into the target project directory.
 *
 * Usage:
 *   node scripts/install-planning-workflow.js /path/to/project
 *   node scripts/install-planning-workflow.js /path/to/project --dry-run
 *   node scripts/install-planning-workflow.js /path/to/project --skip-data-skills
 *   node scripts/install-planning-workflow.js /path/to/project --only-core
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// File manifest
// ---------------------------------------------------------------------------

const COMMANDS = [
  '.claude/commands/plan.md',
];

const TEMPLATES = [
  '.claude/templates/spec.md',
  '.claude/templates/plan.md',
  '.claude/templates/test.md',
  '.claude/templates/task.md',
];

const AGENTS = [
  // Phase 1: spec
  'agents/analyst.md',
  'agents/project-spec-reviewer.md',
  // Phase 2: plan — multi-agent architecture
  'agents/layer-detector.md',
  'agents/architect-backend.md',
  'agents/architect-database.md',
  'agents/architect-security.md',
  'agents/architect-frontend.md',
  'agents/architect-infra.md',
  'agents/plan-assembler.md',
  'agents/plan-reviewer.md',
  'agents/security-reviewer-plan.md',
  // Phase 3: test + tasks
  'agents/project-test-designer.md',
  'agents/project-planner.md',
  'agents/project-test-reviewer.md',
  'agents/project-task-reviewer.md',
  // Phase 4: implementation
  'agents/project-implementer.md',
  'agents/project-code-reviewer.md',
  // Phase 5: reconciliation
  'agents/project-reconciler.md',
];

// Domain skills — source in skills/<name>/SKILL.md,
// destination in .claude/skills/<name>/SKILL.md
const DOMAIN_SKILLS = [
  'analyze-requirement',
  'implementation-depth',
  'tdd-workflow',
  'api-design',
  'error-handling',
  'project-conventions',
  'backend-patterns',
  'frontend-patterns',
  'deployment-patterns',
  'writing-plans',
  'verification-before-completion',
];

// Data-layer skills — source in skills/<name>/SKILL.md,
// destination in .claude/skills/<name>/SKILL.md
const DATA_SKILLS = [
  'database-migrations',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    target: null,
    dryRun: false,
    skipDataSkills: false,
    onlyCore: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--skip-data-skills') {
      options.skipDataSkills = true;
    } else if (arg === '--only-core') {
      options.onlyCore = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (!arg.startsWith('-') && !options.target) {
      options.target = path.resolve(arg);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Usage: node scripts/install-planning-workflow.js <target-project> [options]

Options:
  --dry-run           Preview what will be copied (no changes)
  --skip-data-skills  Skip data-layer skills (mongo, es, db-migrations)
  --only-core         Only copy commands, templates, and agents (no skills)
  --help, -h          Show this help text

Examples:
  node scripts/install-planning-workflow.js /path/to/your-project
  node scripts/install-planning-workflow.js /path/to/your-project --dry-run
  node scripts/install-planning-workflow.js /path/to/your-project --skip-data-skills
  node scripts/install-planning-workflow.js /path/to/your-project --only-core
`);
}

/**
 * Copy a single file from source to destination.
 * Creates parent directories as needed.
 * Returns { src, dest, status } where status is 'copied', 'missing', or 'skipped'.
 */
function copyFile(srcRel, destRel, targetDir, dryRun) {
  const src = path.join(REPO_ROOT, srcRel);
  const dest = path.join(targetDir, destRel);

  if (!fs.existsSync(src)) {
    return { src: srcRel, dest: destRel, status: 'missing' };
  }

  if (!dryRun) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }

  return { src: srcRel, dest: destRel, status: 'copied' };
}

/**
 * Copy a skill SKILL.md from skills/<name>/ to .claude/skills/<name>/.
 */
function copySkill(name, sourceBase, targetDir, dryRun) {
  const srcRel = `${sourceBase}/${name}/SKILL.md`;
  const destRel = `.claude/skills/${name}/SKILL.md`;
  return [copyFile(srcRel, destRel, targetDir, dryRun)];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const options = parseArgs(process.argv);

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (!options.target) {
    console.error('Error: target project path is required.\n');
    showHelp();
    process.exit(1);
  }

  if (!fs.existsSync(options.target)) {
    console.error(`Error: target directory does not exist: ${options.target}`);
    process.exit(1);
  }

  const results = [];
  const target = options.target;
  const dryRun = options.dryRun;

  console.log(dryRun ? 'Dry-run mode — no files will be copied.\n' : '');

  // Core: commands
  for (const file of COMMANDS) {
    results.push(copyFile(file, file, target, dryRun));
  }

  // Core: templates
  for (const file of TEMPLATES) {
    results.push(copyFile(file, file, target, dryRun));
  }

  // Core: agents
  for (const file of AGENTS) {
    results.push(copyFile(file, file, target, dryRun));
  }

  // Skills (unless --only-core)
  if (!options.onlyCore) {
    // Domain skills
    for (const name of DOMAIN_SKILLS) {
      results.push(...copySkill(name, 'skills', target, dryRun));
    }

    // Data-layer skills (unless --skip-data-skills)
    if (!options.skipDataSkills) {
      for (const name of DATA_SKILLS) {
        results.push(...copySkill(name, 'skills', target, dryRun));
      }
    }
  }

  // Report
  const copied = results.filter(r => r.status === 'copied');
  const missing = results.filter(r => r.status === 'missing');

  console.log(`Target: ${target}`);
  console.log(`Files ${dryRun ? 'to copy' : 'copied'}: ${copied.length}`);

  if (copied.length > 0) {
    console.log('');
    for (const r of copied) {
      console.log(`  ${dryRun ? '[would copy]' : '[copied]'} ${r.src} -> ${r.dest}`);
    }
  }

  if (missing.length > 0) {
    console.log(`\nWarning: ${missing.length} source file(s) not found (skipped):`);
    for (const r of missing) {
      console.log(`  [missing] ${r.src}`);
    }
  }

  console.log(`\nDone.${dryRun ? ' (dry-run — no files were written)' : ''}`);
}

main();
