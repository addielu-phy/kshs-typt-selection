import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PRESENTATION_SECONDS,
  parseRoster,
  shuffleWithRandom,
  createSession,
  advanceStudent,
  previousStudent,
  remainingSeconds,
  formatTime,
} from '../presentation/logic.js';

test('parseRoster accepts line and CSV input while removing headers and duplicates', () => {
  const names = parseRoster('姓名\n01,王小明\n陳怡君\n王小明\n03;林大同');
  assert.deepEqual(names, ['王小明', '陳怡君', '林大同']);
});

test('shuffleWithRandom produces a deterministic permutation with injected random values', () => {
  const values = [0.1, 0.8, 0.3];
  let index = 0;
  const result = shuffleWithRandom(['甲', '乙', '丙', '丁'], () => values[index++]);
  assert.deepEqual(result, ['乙', '丁', '丙', '甲']);
  assert.deepEqual([...result].sort(), ['丁', '丙', '乙', '甲'].sort());
});

test('createSession starts the first student at exactly three minutes', () => {
  const state = createSession(['甲', '乙'], () => 0.999);
  assert.equal(PRESENTATION_SECONDS, 180);
  assert.equal(state.current, 0);
  assert.equal(state.secondsLeft, 180);
  assert.equal(state.finished, false);
  assert.deepEqual(state.completed, []);
});

test('advanceStudent marks completion and resets the next speaker timer', () => {
  const initial = { ...createSession(['甲', '乙'], () => 0.999), secondsLeft: 17 };
  const next = advanceStudent(initial);
  assert.deepEqual(next.completed, [initial.order[0]]);
  assert.equal(next.current, 1);
  assert.equal(next.secondsLeft, 180);
  assert.equal(next.finished, false);
  const done = advanceStudent(next);
  assert.equal(done.finished, true);
  assert.equal(done.current, 2);
});

test('previousStudent returns to the prior speaker and removes their completion mark', () => {
  const initial = createSession(['甲', '乙'], () => 0.999);
  const next = advanceStudent(initial);
  const back = previousStudent(next);
  assert.equal(back.current, 0);
  assert.deepEqual(back.completed, []);
  assert.equal(back.secondsLeft, 180);
});

test('remainingSeconds uses a deadline, rounds up, and never becomes negative', () => {
  assert.equal(remainingSeconds(181_000, 1_000), 180);
  assert.equal(remainingSeconds(180_001, 1_000), 180);
  assert.equal(remainingSeconds(1_000, 1_001), 0);
});

test('formatTime renders classroom-friendly mm:ss values', () => {
  assert.equal(formatTime(180), '3:00');
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(0), '0:00');
});
