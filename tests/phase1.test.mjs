import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => fs.readFileSync(new URL('../'+p, import.meta.url),'utf8');
test('production starts TS using tsx runtime dependency',()=>{
 const p=JSON.parse(read('package.json'));
 assert.equal(p.scripts.start,'node --import tsx server.ts');
 assert.ok(p.dependencies.tsx);
});
test('OAuth tokens never use shared hard-coded encryption secret',()=>{
 const s=read('server/socialMediaStore.ts');
 assert.doesNotMatch(s,/film-video-studio-ultimate-token-vault-key/);
 assert.match(s,/NODE_ENV === 'production'/);
 assert.match(s,/randomBytes\(32\)/);
});
test('local secrets and application data are gitignored',()=>{
 const s=read('.gitignore');
 assert.match(s,/\.env\*/);
 assert.match(s,/\.data\//);
});
test('secure Firestore candidate disallows client-controlled credits and plan',()=>{
 const s=read('security/secure-firestore.rules');
 assert.doesNotMatch(s,/hasOnly\(\['displayName', 'plan', 'creditsRemaining'/);
 assert.match(s,/hasOnly\(\['displayName', 'updatedAt'\]\)/);
});
test('CI checks lint, test, build',()=>{
 const s=read('.github/workflows/phase1-ci.yml');
 for(const step of ['bun run lint','bun run test','bun run build'])assert.ok(s.includes(step));
});
