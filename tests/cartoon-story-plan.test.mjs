import assert from 'node:assert/strict';
import test from 'node:test';
import { createCartoonStoryPlan, readCartoonStoryRequest } from '../server/cartoonStoryPlan.ts';

const settings = { language: 'Kannada', style: '2D Cel-Shaded Cartoon', aspect: '9:16' };
const sample = count => readCartoonStoryRequest({
  title: 'ಮರಳಿ ಹಾಡಿದ ಕಾಡು', premise: 'ಹಳ್ಳಿಯ ಮಕ್ಕಳ ಕಾಡಿನ ಸಾಹಸ', format: 'chapters', count,
  unitTitles: 'ಮೊದಲ ಅಧ್ಯಾಯ\nಎರಡನೆಯ ಅಧ್ಯಾಯ',
});

test('Kannada series plans keep supplied chapter names and build complete scene instructions', async () => {
  const plan = await createCartoonStoryPlan(sample(4), settings);
  assert.equal(plan.source, 'studio_draft');
  assert.equal(plan.units.length, 4);
  assert.deepEqual(plan.units.slice(0, 2).map(unit => unit.title), ['ಮೊದಲ ಅಧ್ಯಾಯ', 'ಎರಡನೆಯ ಅಧ್ಯಾಯ']);
  for (const unit of plan.units) {
    assert.match(unit.story, new RegExp(unit.title));
    assert.equal(unit.scenes.length, 3);
    for (const scene of unit.scenes) {
      assert.match(scene.imagePrompt, /9:16/);
      assert.match(scene.dialogue, /[\u0c80-\u0cff]/u);
      assert.equal(scene.subtitle, scene.dialogue);
      assert.ok(scene.action && scene.location && scene.audioDirection && scene.effectsDirection);
    }
  }
});

test('invalid provider scenes fall back to a complete plan', async () => {
  const plan = await createCartoonStoryPlan(sample(2), settings, async () => '{"units":[]}');
  assert.equal(plan.source, 'studio_draft');
  assert.equal(plan.units.flatMap(unit => unit.scenes).length, 6);
});

test('valid provider scenes are used and custom titles remain authoritative', async () => {
  const draft = await createCartoonStoryPlan(sample(2), settings);
  const plan = await createCartoonStoryPlan(sample(2), settings, async () => JSON.stringify({
    units: draft.units.map(unit => ({ ...unit, title: 'Provider title' })),
  }));
  assert.equal(plan.source, 'gemini');
  assert.equal(plan.units[0].title, 'ಮೊದಲ ಅಧ್ಯಾಯ');
});

test('chapter counts and supplied titles are validated', () => {
  assert.throws(() => sample(26), /Choose between/);
  assert.throws(() => sample(1), /one title per line/);
});
