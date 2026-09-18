import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { addParsedScheduleToCanvas } from '../entrypoints/content/canvasSession.ts';

beforeEach(() => {
  globalThis.window = { location: new URL('https://friendsseminary.instructure.com/courses/3565/files/259315') };
  globalThis.document = { cookie: 'other_csrf_token=wrong; _csrf_token=test%2Ftoken%3D' };
});

const note = (title, date = '2026-09-14') => ({ title, todo_date: date });

test('submits both rotations to Canvas using the session and CSRF token', async (t) => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, options });
    return new Response(null, { status: 201 });
  });
  const completed = new Set();
  await addParsedScheduleToCanvas({
    odd: [{ ...note('Odd assignment'), description: 'Study questions' }],
    even: [note('Even assignment', '2026-09-16')],
  }, completed);

  assert.equal(requests.length, 2);
  assert.deepEqual([...completed], [0, 1]);
  for (const { url, options } of requests) {
    assert.equal(url, 'https://friendsseminary.instructure.com/api/v1/planner_notes');
    assert.equal(options.method, 'POST');
    assert.equal(options.credentials, 'include');
    assert.equal(options.headers['X-CSRF-Token'], 'test/token=');
    assert.equal(options.headers['X-Requested-With'], 'XMLHttpRequest');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(JSON.parse(options.body).course_id, 3565);
  }
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    course_id: 3565, title: 'Odd assignment', todo_date: '2026-09-14', details: 'Study questions',
  });
  assert.equal(JSON.parse(requests[1].options.body).todo_date, '2026-09-16');
});

test('stops on failure and retries without resubmitting confirmed successes', async (t) => {
  const titles = [];
  let fail = true;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const { title } = JSON.parse(options.body);
    titles.push(title);
    if (fail && title === 'Even 1') return new Response(null, { status: 500 });
    return new Response('unused response', { status: 201 });
  });
  const schedule = { odd: [note('Odd 1'), note('Odd 2')], even: [note('Even 1'), note('Even 2')] };
  const completed = new Set();
  await assert.rejects(addParsedScheduleToCanvas(schedule, completed), /500/);
  assert.deepEqual([...completed], [0, 1]);
  assert.deepEqual(titles, ['Odd 1', 'Odd 2', 'Even 1']);

  fail = false;
  await addParsedScheduleToCanvas(schedule, completed);
  assert.deepEqual(titles, ['Odd 1', 'Odd 2', 'Even 1', 'Even 1', 'Even 2']);
  assert.deepEqual([...completed], [0, 1, 2, 3]);
  await addParsedScheduleToCanvas(schedule, completed);
  assert.equal(titles.length, 5);
});

test('rejects entries without dates before creating any notes', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch');
  await assert.rejects(addParsedScheduleToCanvas({
    odd: [note('Valid'), note('Missing date', null)], even: [],
  }, new Set()), /date and title/);
  assert.equal(fetch.mock.callCount(), 0);
});

test('requires a course URL before creating notes', async (t) => {
  window.location = new URL('https://friendsseminary.instructure.com/files/259315');
  const fetch = t.mock.method(globalThis, 'fetch');
  await assert.rejects(addParsedScheduleToCanvas({ odd: [note('Assignment')], even: [] }, new Set()), /Canvas course/);
  assert.equal(fetch.mock.callCount(), 0);
});

test('requires a CSRF token before creating notes', async (t) => {
  document.cookie = 'other_csrf_token=wrong';
  const fetch = t.mock.method(globalThis, 'fetch');
  await assert.rejects(addParsedScheduleToCanvas({ odd: [note('Assignment')], even: [] }, new Set()), /restore your session/);
  assert.equal(fetch.mock.callCount(), 0);
});
