import assert from 'node:assert/strict';
import test from 'node:test';
import { entriesForDay, moveDay } from '../src/components/day-agenda.ts';
import { sampleAgenda, sampleDay } from '../src/components/sample-agenda.ts';

test('Friday shows classes, work and commitments in Denver time order', () => {
  const reversed = { ...sampleAgenda, blocks: [...sampleAgenda.blocks].reverse() };
  const entries = entriesForDay(sampleDay, reversed);
  assert.deepEqual(entries.map(e => [e.kind, e.start]), [
    ['Class', '09:00'], ['Work session', '10:15'], ['Work session', '13:00'], ['Commitment', '18:00'],
  ]);
  assert.equal(entries[0].detail, 'North Hall 101');
});

test('changing days respects class recurrence, term boundaries and empty days', () => {
  assert.deepEqual(entriesForDay(moveDay(sampleDay, 2), sampleAgenda), []);
  assert.equal(entriesForDay('2026-12-11', sampleAgenda)[0].title, 'Algebra 101');
  assert.deepEqual(entriesForDay('2026-12-18', sampleAgenda), []);
  assert.equal(moveDay('2027-01-01', -1), '2026-12-31');
});

test('students see proposal status and split session labels, with rejected work hidden', () => {
  const rejected = { ...sampleAgenda.blocks[0], status: 'rejected' };
  const entries = entriesForDay(sampleDay, { ...sampleAgenda, blocks: [rejected, sampleAgenda.blocks[1]] });
  const work = entries.filter(e => e.kind === 'Work session');
  assert.equal(work.length, 1);
  assert.equal(work[0].title, 'Draft history reflection');
  assert.equal(work[0].detail, 'Proposed · AI suggestion · Session 1 of 2');
  assert.match(entriesForDay(sampleDay, sampleAgenda)[1].detail, /Accepted/);
});

test('a UTC session crossing Denver midnight appears only on the days it occupies', () => {
  const block = { ...sampleAgenda.blocks[0], start: '2026-11-21T06:30:00Z', end: '2026-11-21T07:30:00Z' };
  const data = { ...sampleAgenda, classes: [], commitments: [], blocks: [block] };
  assert.equal(entriesForDay(sampleDay, data)[0].start, '23:30');
  const [next] = entriesForDay(moveDay(sampleDay, 1), data);
  assert.deepEqual([next.start, next.end], ['00:00', '00:30']);
  block.end = '2026-11-21T07:00:00Z';
  assert.deepEqual(entriesForDay(moveDay(sampleDay, 1), data), []);
});
