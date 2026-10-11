const assert = require('node:assert/strict');
const g = require('./static/growth-core.js');
const session = (id, minutes, extra = {}) => ({id, minutes, date:'2026-10-11', ...extra});
const eligible = g.stats([
  session('one',60), session('one',60), session('manual',60,{source:'manual'}),
  session('break',25,{break:true}), session('abandoned',25,{abandoned:true}),
  session('invalid',NaN), session('too-long',241)
], '2026-10-11');
assert.equal(eligible.minutes,60);
assert.equal(eligible.flames,22); // 12 session Flames + 10 for first lifetime hour.
assert.equal(eligible.level,1);
assert.equal(g.evolution(.99).stage,0);
assert.equal(g.evolution(1).stage,1);
assert.equal(g.evolution(10).stage,2);
assert.equal(g.evolution(50).stage,3);
const ledger = g.economy({sessions:[session('a',240),session('b',240)],purchases:['star','star','cat','orb']},'2026-10-11');
assert.equal(ledger.earned,116);
assert.equal(ledger.spent,90);
assert.equal(ledger.balance,26);
assert.equal(ledger.owned.size,3);
assert.equal(g.economy({sessions:[],purchases:['cat']},'2026-10-11').spent,0);
assert.equal(g.stats([session('x',4)],'2026-10-11').flames,0);
assert.equal(g.stats([session('x',5)],'2026-10-11').flames,1);
assert.equal(g.stats([session('x',60,{date:'2026-09-01'})],'2026-10-11').month,0);
console.log('PASS: eligibility, duplicate exclusion, progression thresholds, currency rewards, purchase reconciliation, insufficient funds, and monthly totals');
