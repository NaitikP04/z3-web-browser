import { init } from 'z3-solver';

const { Context } = await init();
const { Solver, Int, And, Or, Distinct } = new Context("main");

const solver = new Solver();

const x = Int.const('x');  // x is a Z3 integer
solver.add(And(x.le(10), x.ge(9)));  // x <= 10, x >=9

// Run Z3 solver, find solution and sat/unsat

if (await solver.check() === "sat") {

    // Extract value for x
    let model = solver.model();
    let xVal = parseInt(model.eval(x).toString());
    console.log(`sat. A valid value for x is: ${xVal}`);

} else {

    console.log("unsat. Could not find a valid value for x.");

}
