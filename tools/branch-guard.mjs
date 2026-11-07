// Safety guard for prototype branches.
// Cloudflare Workers Builds sets WORKERS_CI_BRANCH. This Worker uses a Durable Object, so Cloudflare
// cannot give it preview URLs; a build of any branch other than `main` would only upload an unused
// version of the live Worker (or, if the dashboard were misconfigured, replace the live game).
// So: stop here. Local builds (no WORKERS_CI_BRANCH) and `main` are unaffected.
const branch = process.env.WORKERS_CI_BRANCH;
if (branch && branch !== 'main') {
  console.error(`Branch "${branch}": Cloudflare builds are disabled on purpose for non-main branches.`);
  console.error('Run the prototype locally instead (see docs/prototype/HANDOFF.md).');
  process.exit(1);
}
