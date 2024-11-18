import { init } from 'z3-solver';

const { Context } = await init();
const { Solver, Int, And, Or, Distinct } = new Context("main");
const solver = new Solver();

// Fence boundaries
const leftFenceX = 5;
const rightFenceX = 10;
const topFenceY = 15;
const bottomFenceY = 25;

// inside fence
const x = Int.const('x');
const y = Int.const('y');

solver.add(And(Or(x.gt(leftFenceX), x.lt(rightFenceX)), Or(y.gt(topFenceY), y.lt(bottomFenceY))))

console.log("Inside Fence:");
if (await solver.check() === "sat") {
    let model = solver.model();
    console.log(`x = ${model.eval(x)}, y = ${model.eval(y)}`);
} else {
    console.log("No solution found.");
}

// on the top or left side of the fence
solver.reset();

const xOn = Int.const('xOn');
const yOn = Int.const('yOn');

solver.add(Or(And(yOn.eq(topFenceY), xOn.ge(leftFenceX), xOn.le(rightFenceX)),And(xOn.eq(leftFenceX), yOn.ge(topFenceY), yOn.le(bottomFenceY))));

console.log("On Fence:");
if (await solver.check() === "sat") {
    let model = solver.model();
    console.log(`xOn = ${model.eval(xOn)}, yOn = ${model.eval(yOn)}`);
} else {
    console.log("No solution found.");
}

// tree outside fence area
solver.reset()

const treeX = Int.const('treeX');
const treeY = Int.const('treeY');

solver.add(And(Or(treeX.lt(leftFenceX), treeX.gt(rightFenceX)), Or(treeY.lt(topFenceY), treeY.gt(bottomFenceY))))
solver.add(treeX.ge(8));
solver.add(treeY.ge(20));

console.log("Tree Outside Fence:");
if (await solver.check() === "sat") {
    let model = solver.model();
    console.log(`xOut = ${model.eval(treeX)}, yOut = ${model.eval(treeY)}`);
} else {
    console.log("No solution found.");
}
