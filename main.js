import './style.css'
import { init } from 'z3-solver';

const { Context } = await init();
const { Solver, Int, And, Or, Distinct } = new Context("main");


var cursors;
const SCALE = 2.0;
var my = {sprite: {}, Context : Context};

let config = {
  parent: 'phaser-game',
  type: Phaser.CANVAS,
  render: {
      pixelArt: true  // prevent pixel art from getting blurred when scaled
  },
  width: 1200,
  height: 700,
  scene: {
    create: create,
  }
}

function create() {
  this.scene.add('Load', new Load(my), true); // Start the scene and pass myData
}

const game = new Phaser.Game(config);

// document.querySelector('#app').innerHTML = `
//   <div>
//     <p>Check the console</p>
//     <p>I guess I could've just put the results here too...</p>
//   </div>
// `