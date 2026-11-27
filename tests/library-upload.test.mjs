import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeLibraryUpload } from '../server/libraryUploadFormat.ts';

const dataUrl = (bytes) => 'data:application/octet-stream;base64,' + Buffer.from(bytes).toString('base64');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lH0AAAAASUVORK5CYII=', 'base64');

test('library accepts a mobile image upload with an empty MIME type', () => {
  const result = decodeLibraryUpload('Scene.PNG', '', dataUrl(png));
  assert.equal(result.mime, 'image/png');
  assert.equal(result.category, 'image');
  assert.deepEqual(result.bytes, png);
});

test('library recognizes subtitle, animation and grading files', () => {
  assert.equal(decodeLibraryUpload('captions.srt', '', dataUrl('1\n00:00:00,000 --> 00:00:02,000\nನಮಸ್ಕಾರ\n')).category, 'subtitle');
  assert.equal(decodeLibraryUpload('style.cube', '', dataUrl('TITLE "Test"\nLUT_3D_SIZE 2\n')).category, 'color');
  assert.equal(decodeLibraryUpload('motion.json', '', dataUrl('{"layers":[]}')).mime, 'application/json');
});

test('library rejects disguised HTML and corrupt payloads before saving', () => {
  assert.throws(() => decodeLibraryUpload('forged.png', 'image/png', dataUrl('<html>not an image</html>')), /contents do not match/);
  assert.throws(() => decodeLibraryUpload('shot.png', '', 'data:image/png;base64,@@@@'), /Invalid file data/);
  assert.throws(() => decodeLibraryUpload('file.html', 'text/html', dataUrl('<img>')), /Unsupported file type/);
});
