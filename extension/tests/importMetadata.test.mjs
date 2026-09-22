import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getImportMetadata } from '../entrypoints/content/importMetadata.ts';

test('collects only diagnostic fields from Canvas metadata', async (t) => {
  globalThis.window = { location: new URL('https://canvas.test/courses/42/files/123') };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.credentials, 'include');
    const data = url.endsWith('/profile')
      ? { id: 7, name: 'Zoë Student', calendar: { ics: 'secret' } }
      : url.endsWith('/courses/42')
        ? { name: 'English 11' }
        : { display_name: 'Week 1 – schedule.pdf', url: 'secret-download-url' };
    return Response.json(data);
  });
  const metadata = await getImportMetadata();
  assert.deepEqual(metadata, {
    user_id: '7', user_name: 'Zoë Student',
    course_id: '42', course_name: 'English 11', file_id: '123',
    filename: 'Week 1 – schedule.pdf',
  });
});

test('metadata failures preserve local IDs and do not fail the import', async (t) => {
  globalThis.window = { location: new URL('https://canvas.test/courses/42/files/123') };
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  const metadata = await getImportMetadata();
  assert.equal(metadata.course_id, '42');
  assert.equal(metadata.file_id, '123');
  assert.equal(metadata.user_name, undefined);
});
