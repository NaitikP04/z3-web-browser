
// class Z3Scene extends Phaser.Scene {
//     constructor(my) {
//         super("z3Scene");
//         this.my = my;
//     }

//     init() {
//         this.TILESIZE = 16;
//         this.SCALE = 1.5;
//         this.TILEWIDTH = 40;
//         this.TILEHEIGHT = 25;
//     }

//     /*  
//         Procedural generation problems to solve using Z3 constraints:
//         Place a wheelbarrow inside a fenced-in area.
//         Place a mushroom inside the forested area, avoiding existing trees and mushrooms
//         Place 2-3 signs next to a path
//         Place a beehive anywhere there isn't already something present.

//         Pick a random element within a range of valid values (finding Answer Sets)

//         You may notice that Z3 doesn't randomly pick a value within a range of possible integer values. 
//         It typically picks a value at an edge of a range. However, for PCG in games, we'd like to randomly sample within the range of possible values.
//         Write an algorithm which determines all of the possible valid integers inside a finite range of integer constraints.
//         The way to approach this is to find a valid solution, then add that valid value to a list of good values (in a JavaScript variable) and add 
//         the value as a negative constraint in Z3, and re-solve. As you keep adding invalid value constraints, you'll generate new valid values. 
//         When you have exhausted al possible valid values, Z3 will return unsat. 
//         Then, randomly pick from the list of valid values (from the JavaScript list of valid values.
//     */

//     async placeTileConstraint(includes, excludes, layer) {
//         const { Solver, Int, And, Or, Distinct, Not } = new this.my.Context("main");
//         const solver = new Solver();

//         const xvar = Int.const('x');
//         const yvar = Int.const('y');

//         // Add constraints
//         includes.forEach(inc => {
//             if(inc.type == "box"){
//                 solver.add(And(xvar.ge(inc.center.x-inc.size.x/2), xvar.le(inc.center.x+inc.size.x/2),
//                 yvar.ge(inc.center.y-inc.size.y/2), yvar.le(inc.center.y+inc.size.y/2)));
//             }
//             if(inc.type == "tile"){
//                 const orConstraint = []
//                 inc.tiles.forEach(t =>{
//                     let coords = this.findTilesByType(layer, t)   
//                     coords.forEach(c => {
//                         orConstraint.push(And(xvar.eq(c.x), yvar.eq(c.y)));
//                     });
//                 });
//                 solver.add(orConstraint.reduce((a, b) => a.or(b)));
//             }
//         });
//         excludes.forEach(inc => {
//             if(inc.type == "box"){
//                 solver.add(Not(And(xvar.ge(inc.center.x-inc.size.x/2), xvar.le(inc.center.x+inc.size.x/2),
//                 yvar.ge(inc.center.y-inc.size.y/2), yvar.le(inc.center.y+inc.size.y/2))));
//             }
//             if(inc.type == "tile"){
//                 inc.tiles.forEach(t =>{
//                     let coords = this.findTilesByType(layer, t)   
//                     coords.forEach(c => {
//                         solver.add(Not(And(xvar.eq(c.x), yvar.eq(c.y))));
//                     });
//                 });
//             }
//         });

//         // Run Z3 solver, find solution and sat/unsat
//         console.log(await solver.check());

//         // Extract value for x
//         const model = solver.model();
//         const xVal = parseInt(model.eval(xvar).asString());
//         const yVal = parseInt(model.eval(yvar).asString());
//         const coord = {x:xVal, y:yVal}
//         console.log(coord);
//         return coord;
//     }

//     findTilesByType(layer, tileIndex){
//         const coordinates = [];
//         layer.forEachTile(tile => {
//             if(tile.index == tileIndex){
//                 coordinates.push({x:tile.x, y:tile.y});
//             }
//         });
//         console.log("found ", coordinates.length, " tiles of type ", tileIndex);
//         return coordinates;
//     }

//     async create(){
//         this.map = this.add.tilemap("three-farmhouses", this.TILESIZE, this.TILESIZE, this.TILEHEIGHT, this.TILEWIDTH);

//         // Add a tileset to the map
//         this.tileset = this.map.addTilesetImage("kenney-tiny-town", "tilemap_tiles");
        
//         // Create a new tilemap which uses 16x16 tiles, and is 40 tiles wide and 25 tiles tall
//         this.map = this.add.tilemap("three-farmhouses", this.TILESIZE, this.TILESIZE, this.TILEHEIGHT, this.TILEWIDTH);

//         // Add a tileset to the map
//         this.tileset = this.map.addTilesetImage("kenney-tiny-town", "tilemap_tiles");

//         let fenceInclude = {
//             type : "box",
//             center : {x : 36, y : 4},
//             size : {x : 4, y : 4}
//         }
//         let fenceInclude2 = {
//             type : "box",
//             center : {x : 25, y : 19},
//             size : {x : 3, y : 4}
//         }
//         let world = {
//             type : "box",
//             center : {x:19,y:12},
//             size : {x:38,y:24}
//         }
//         let pathTiles = {
//             type : "tile",
//             tiles : [44, 40, 42, 43]
//         }
//         let houseTiles = {
//             type : "tile",
//             tiles : [49,50,52,51,61,62,64,63,73,74,86,74,85,76,53,56,54,45,46,82,47,65,68,67,57,80,89,77,78,89,90,69]
//         }

//         // Create the layers
//         this.groundLayer = this.map.createLayer("Ground-n-Walkways", this.tileset, 0, 0);
//         this.treesLayer = this.map.createLayer("Trees-n-Bushes", this.tileset, 0, 0);
//         this.housesLayer = this.map.createLayer("Houses-n-Fences", this.tileset, 0, 0);

//         // console.log(this.findTilesByType(this.housesLayer, 49));
//         // Add z3
//         let sign = await this.placeTileConstraint([pathTiles], [], this.groundLayer);
//         this.housesLayer.putTileAt(sign.x,sign.y, 83)
//         let wheelbarrow = await this.placeTileConstraint([world, fenceInclude], [], this.housesLayer);
//         this.housesLayer.putTileAt(wheelbarrow.x,wheelbarrow.y, 57)

//         let bee = await this.placeTileConstraint([world], [houseTiles], this.housesLayer);

//         // label tiles
//         if(false){
//             for (var x = 0; x < this.map.widthInPixels/this.TILESIZE; x+=2) {
//                 for (var y = 0; y < this.map.heightInPixels/this.TILESIZE; y+=2) {
//                   let size = this.TILESIZE
//                   let a = this.add.text(x*size,y*size, ""+x+" "+y, {
//                       "fontSize" : 8,
//                       "backgroundColor" : "000000"
//                   })
                  
//                 }
//               }
//             }
        
//         // Camera settings
//         this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
//         this.cameras.main.setZoom(this.SCALE);
//     }
// }

class Z3Scene extends Phaser.Scene {
    constructor(my) {
        super("z3Scene");
        this.my = my;
    }

    init() {
        this.TILESIZE = 16;
        this.SCALE = 1.5;
        this.TILEWIDTH = 40;
        this.TILEHEIGHT = 25;
    }

    async placeTileConstraint(includes, excludes, layer) {
        const { Solver, Int, And, Or, Distinct, Not } = new this.my.Context("main");
        const solver = new Solver();

        const xvar = Int.const('x');
        const yvar = Int.const('y');

        // Add constraints for included areas
        includes.forEach(inc => {
            if (inc.type === "box") {
                solver.add(
                    And(
                        xvar.ge(inc.center.x - inc.size.x / 2),
                        xvar.le(inc.center.x + inc.size.x / 2),
                        yvar.ge(inc.center.y - inc.size.y / 2),
                        yvar.le(inc.center.y + inc.size.y / 2)
                    )
                );
            }
            if (inc.type === "tile") {
                const orConstraint = [];
                inc.tiles.forEach(t => {
                    let coords = this.findTilesByType(layer, t);
                    coords.forEach(c => {
                        orConstraint.push(And(xvar.eq(c.x), yvar.eq(c.y)));
                    });
                });
                solver.add(orConstraint.reduce((a, b) => a.or(b)));
            }
        });

        // Add constraints for excluded areas
        excludes.forEach(inc => {
            if (inc.type === "box") {
                solver.add(
                    Not(
                        And(
                            xvar.ge(inc.center.x - inc.size.x / 2),
                            xvar.le(inc.center.x + inc.size.x / 2),
                            yvar.ge(inc.center.y - inc.size.y / 2),
                            yvar.le(inc.center.y + inc.size.y / 2)
                        )
                    )
                );
            }
            if (inc.type === "tile") {
                inc.tiles.forEach(t => {
                    let coords = this.findTilesByType(layer, t);
                    coords.forEach(c => {
                        solver.add(Not(And(xvar.eq(c.x), yvar.eq(c.y))));
                    });
                });
            }
        });

        // Collect all valid positions
        const validCoords = [];
        while ((await solver.check()) === "sat") {
            const model = solver.model();
            const xVal = parseInt(model.eval(xvar).asString());
            const yVal = parseInt(model.eval(yvar).asString());
            validCoords.push({ x: xVal, y: yVal });

            // Exclude this solution for the next iteration
            solver.add(Not(And(xvar.eq(xVal), yvar.eq(yVal))));
        }

        if (validCoords.length === 0) {
            console.warn("No valid positions found for the given constraints.");
            return null;
        }

        // Pick a random solution
        const randomCoord = validCoords[Math.floor(Math.random() * validCoords.length)];
        console.log("Selected random valid coordinate:", randomCoord);
        return randomCoord;
    }

    findTilesByType(layer, tileIndex) {
        const coordinates = [];
        layer.forEachTile(tile => {
            if (tile.index === tileIndex) {
                coordinates.push({ x: tile.x, y: tile.y });
            }
        });
        console.log("Found", coordinates.length, "tiles of type", tileIndex);
        return coordinates;
    }

    async create() {
        this.map = this.add.tilemap("three-farmhouses", this.TILESIZE, this.TILESIZE, this.TILEHEIGHT, this.TILEWIDTH);

        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("kenney-tiny-town", "tilemap_tiles");

        // Create layers
        this.groundLayer = this.map.createLayer("Ground-n-Walkways", this.tileset, 0, 0);
        this.treesLayer = this.map.createLayer("Trees-n-Bushes", this.tileset, 0, 0);
        this.housesLayer = this.map.createLayer("Houses-n-Fences", this.tileset, 0, 0);

        // Define constraints
        let fenceInclude = {
            type: "box",
            center: { x: 36, y: 4 },
            size: { x: 4, y: 4 }
        };
        let world = {
            type: "box",
            center: { x: 19, y: 12 },
            size: { x: 38, y: 24 }
        };
        let pathTiles = {
            type: "tile",
            tiles: [44, 40, 42, 43]
        };

        // Place sign
        let signCoord = await this.placeTileConstraint([pathTiles], [], this.groundLayer);
        if (signCoord) this.housesLayer.putTileAt(83, signCoord.x, signCoord.y); // Tile index 83 for sign

        // Place wheelbarrow
        let wheelbarrowCoord = await this.placeTileConstraint([world, fenceInclude], [], this.housesLayer);
        if (wheelbarrowCoord) this.housesLayer.putTileAt(57, wheelbarrowCoord.x, wheelbarrowCoord.y); // Tile index 57 for wheelbarrow

        // Camera settings
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(this.SCALE);
    }
}
