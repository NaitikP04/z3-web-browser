import { init } from 'z3-solver';

const { Context } = await init();
const { Solver, Int, And, Or, Distinct } = new Context("main");
const solver = new Solver();

const bob = Int.const('bob');  
const mary = Int.const('mary');
const cathy = Int.const('cathy');
const sue = Int.const('sue');

solver.add(Distinct(bob, mary, cathy, sue))
solver.add(And(bob.ge(1), bob.le(4)));  
solver.add(And(mary.ge(1), mary.le(4)));  
solver.add(And(cathy.ge(1), cathy.le(4)));  
solver.add(And(sue.ge(1), sue.le(4)));  

solver.add(bob.eq(2));  
solver.add(sue.eq(3));  
solver.add(mary.le(3));
solver.add(cathy.ge(1));  


// Run Z3 solver, find solution and sat/unsat
console.log(await solver.check());

// Extract values for each variable
const model = solver.model();
const bobVal = model.eval(bob);
console.log(`${bobVal}`);
const maryVal = model.eval(mary);
console.log(`${maryVal}`);
const cathyVal = model.eval(cathy);
console.log(`${cathyVal}`);
const sueVal = model.eval(sue);
console.log(`${sueVal}`);