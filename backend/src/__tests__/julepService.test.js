/**
 * Tests: julepService — smart rule-based response engine
 * These run entirely in-process, no HTTP, no external API needed.
 */

'use strict';

const { smartRespond } = require('../../src/services/julepService');
const { STADIUMS, CROWD_DATA } = require('../../src/data/stadiums');

const metlife = STADIUMS.find(s => s.id === 'metlife');
const metlifeCrowd = CROWD_DATA['metlife'];

describe('smartRespond', () => {
  it('greets the user', () => {
    const reply = smartRespond('hello', metlife, metlifeCrowd);
    expect(reply.toLowerCase()).toMatch(/welcome|hello|stadiumai/i);
  });

  it('answers restroom queries', () => {
    const reply = smartRespond('where are the restrooms?', metlife, metlifeCrowd);
    expect(reply.toLowerCase()).toMatch(/restroom|bathroom|toilet|facility/i);
  });

  it('answers seat navigation queries', () => {
    const reply = smartRespond('how do I find my seat?', metlife, metlifeCrowd);
    expect(reply.toLowerCase()).toMatch(/seat|section|lower|upper/i);
  });

  it('answers accessibility queries', () => {
    const reply = smartRespond('I need wheelchair access', metlife, metlifeCrowd);
    expect(reply.toLowerCase()).toMatch(/accessible|wheelchair|entrance/i);
    expect(reply).toContain('Gate A'); // MetLife accessible entrance
  });

  it('answers medical queries', () => {
    const reply = smartRespond('where is the medical station?', metlife, metlifeCrowd);
    expect(reply.toLowerCase()).toMatch(/medical|first aid|station/i);
  });

  it('answers food queries', () => {
    const reply = smartRespond('where can I get food?', metlife, metlifeCrowd);
    expect(reply.toLowerCase()).toMatch(/food|concession|eat|beverage/i);
  });

  it('answers transport queries', () => {
    const reply = smartRespond('how do I get home after the match?', metlife, metlifeCrowd);
    expect(reply.toLowerCase()).toMatch(/transport|transit|subway|bus|rideshare/i);
  });

  it('answers crowd queries with live data', () => {
    const reply = smartRespond('how crowded is it right now?', metlife, metlifeCrowd);
    expect(reply).toMatch(/occupancy|crowded|gate|busy|wait/i);
    expect(reply).toContain('MetLife Stadium');
  });

  it('answers sustainability queries', () => {
    const reply = smartRespond('how can I recycle?', metlife, metlifeCrowd);
    expect(reply.toLowerCase()).toMatch(/recycle|sustainability|green|eco/i);
  });

  it('answers prayer room queries', () => {
    const reply = smartRespond('is there a prayer room?', metlife, metlifeCrowd);
    expect(reply.toLowerCase()).toMatch(/prayer|worship|room/i);
  });

  it('returns a generic fallback for unknown input', () => {
    const reply = smartRespond('xkzq14blorp', metlife, metlifeCrowd);
    expect(typeof reply).toBe('string');
    expect(reply.length).toBeGreaterThan(10);
  });

  it('works without stadium context', () => {
    const reply = smartRespond('where is the restroom?', null, null);
    expect(typeof reply).toBe('string');
    expect(reply.length).toBeGreaterThan(10);
  });
});
