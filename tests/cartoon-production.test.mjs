import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

function hasEncoder() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    execFileSync('ffprobe', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

test('an owned chapter progresses from preview through approval to a verified MP4', {
  skip: !process.env.CI && !hasEncoder(),
  timeout: 120_000,
}, async (t) => {
  const cwd = process.cwd();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zkmap-cartoon-production-'));
  process.chdir(directory);
  t.after(() => {
    process.chdir(cwd);
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const {
    addReferenceAssetsToProject, confirmFinalProjectApproval, createCartoonProject,
    getVerifiedRenderMp4Path, openCartoonStoryProduction, preparePlannedCartoonMedia,
    renderAndVerifyCartoonMp4, runCartoonWorkflowStep, saveCartoonStoryPlan, uploadCartoonSceneAudio,
    uploadCartoonSceneImage, uploadCartoonSceneVideo,
  } = await import('../server/cartoonWorkflowStore.ts');
  const { createCartoonStoryPlan, readCartoonStoryRequest } = await import('../server/cartoonStoryPlan.ts');

  const parent = createCartoonProject({ name: 'ಕಾಡಿನ ಕಥೆ', storyPrompt: 'ಹಕ್ಕಿಯ ಹುಡುಕಾಟ', ownerUserId: 'creator' });
  const plan = await createCartoonStoryPlan(
    readCartoonStoryRequest({ title: parent.name, premise: parent.storyPrompt, format: 'chapters', count: 1 }),
    { language: 'Kannada', style: '2D Cartoon', aspect: '16:9' },
  );
  assert.match(plan.units[0].scenes[0].action, /ಹಕ್ಕಿಯ ಹುಡುಕಾಟ/);
  saveCartoonStoryPlan(parent.id, plan);
  const chapter = openCartoonStoryProduction(parent.id, 1);
  assert.equal(chapter.ownerUserId, parent.ownerUserId);
  assert.equal(openCartoonStoryProduction(parent.id, 1).id, chapter.id);
  assert.equal(getVerifiedRenderMp4Path(chapter.id), null);
  assert.throws(() => runCartoonWorkflowStep(chapter.id, 12), /no available image/i);

  const ffmpeg = (...args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { timeout: 45_000 });
  const payload = (name, mimeType) => ({
    name, mimeType, dataUrl: 'data:' + mimeType + ';base64,' + fs.readFileSync(name).toString('base64'),
  });
  const voiceWithCloudDisabled = async () => { throw new Error('Uploaded dialogue is required for this fixture.'); };
  const providerKeys = ['OPENAI_API_KEY', 'STABILITY_API_KEY', 'BFL_API_KEY'];
  const savedKeys = providerKeys.map(key => process.env[key]);
  for (const key of providerKeys) delete process.env[key];
  try {
    const incomplete = await preparePlannedCartoonMedia(chapter.id, 6, voiceWithCloudDisabled);
    for (const scene of incomplete.scenes) {
      assert.equal(scene.imageStatus, 'failed');
      assert.equal(scene.storyImageUrl, '');
      assert.match(scene.lastError, /upload an image/i);
    }
  } finally {
    providerKeys.forEach((key, index) => {
      if (savedKeys[index] !== undefined) process.env[key] = savedKeys[index];
    });
  }

  ['red', 'blue', 'green'].forEach((color, index) => {
    const name = 'scene-' + index + '.png';
    ffmpeg('-f', 'lavfi', '-i', 'color=c=' + color + ':s=240x180', '-frames:v', '1', '-threads', '1', name);
    addReferenceAssetsToProject(chapter.id, [payload(name, 'image/png')]);
  });

  ffmpeg('-f', 'lavfi', '-i', 'testsrc2=s=240x180:r=24', '-t', '3', '-c:v', 'libx264', '-threads', '1', 'source.mp4');
  const withVideo = await uploadCartoonSceneVideo(chapter.id, 1, payload('source.mp4', 'video/mp4'));
  const importedClipUrl = withVideo.scenes[0].videoClipUrl;
  assert.equal(withVideo.scenes[0].videoClipStatus, 'ready');
  assert.match(withVideo.scenes[0].originalVideoUrl, /-source\.mp4$/);
  const withImage = await uploadCartoonSceneImage(chapter.id, 2, payload('scene-1.png', 'image/png'));
  const uploadedImageUrl = withImage.scenes[1].storyImageUrl;
  const images = await preparePlannedCartoonMedia(chapter.id, 6, voiceWithCloudDisabled);
  for (const scene of images.scenes) assert.equal(scene.imageStatus, 'ready', scene.lastError);
  assert.equal(images.scenes[0].videoClipUrl, importedClipUrl);
  assert.equal(images.scenes[1].storyImageUrl, uploadedImageUrl);
  const clips = await preparePlannedCartoonMedia(chapter.id, 7, voiceWithCloudDisabled);
  for (const scene of clips.scenes) assert.equal(scene.videoClipStatus, 'ready', scene.lastError);
  assert.throws(() => runCartoonWorkflowStep(chapter.id, 12), /generate the missing scene clips/i);

  ffmpeg('-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.7', '-c:a', 'pcm_s16le', 'dialogue.wav');
  for (const scene of clips.scenes) {
    await uploadCartoonSceneAudio(chapter.id, scene.sceneNumber, payload('dialogue.wav', 'audio/wav'), 'dialogue');
  }

  for (const step of [9, 10, 11, 12, 13, 14]) runCartoonWorkflowStep(chapter.id, step);
  assert.throws(() => confirmFinalProjectApproval(chapter.id, false), /watch the final preview/i);
  assert.equal(confirmFinalProjectApproval(chapter.id, true).finalApprovalConfirmed, true);
  assert.equal(getVerifiedRenderMp4Path(chapter.id), null);
  const result = await renderAndVerifyCartoonMp4(chapter.id, voiceWithCloudDisabled);
  assert.equal(result.renderJob.verified, true, result.renderJob.errorMessage);

  const verified = getVerifiedRenderMp4Path(chapter.id);
  assert.ok(verified);
  const { streams } = JSON.parse(execFileSync('ffprobe', [
    '-v', 'error', '-show_streams', '-of', 'json', verified.filePath,
  ], { encoding: 'utf8', timeout: 20_000 }));
  assert.ok(streams.some(stream => stream.codec_name === 'h264'));
  assert.ok(streams.some(stream => stream.codec_name === 'aac'));
  assert.ok(streams.some(stream => stream.codec_name === 'mov_text'));
  const frame = time => execFileSync('ffmpeg', ['-v', 'error', '-ss', time, '-i', verified.filePath,
    '-map', '0:v:0', '-frames:v', '1', '-f', 'framemd5', '-'], { encoding: 'utf8' }).trim().split('\n').at(-1).split(',').at(-1);
  assert.notEqual(frame('1'), frame('2'), 'the imported scene must retain motion in the final MP4');
});
