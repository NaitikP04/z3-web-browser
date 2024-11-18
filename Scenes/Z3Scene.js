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

        // Define constraints for the world
        let world = {
            type: "box",
            center: { x: 19, y: 12 },
            size: { x: 38, y: 24 }
        };

        // Define inclusion areas for fenced-in regions, adjusted to exclude fences
        let fenceInclude1 = {
            type: "box",
            center: { x: 36, y: 4 }, // Center of first fenced area
            size: { x: 4, y: 4 }     // Shrink dimensions to exclude edges of the fence
        };
        let fenceInclude2 = {
            type: "box",
            center: { x: 25, y: 18 }, // Center of second fenced area
            size: { x: 9, y: 4 }      // Shrink dimensions to exclude edges of the fence
        };

        // Debug inclusion areas
        console.log("Fence 1 inclusion area:", fenceInclude1);
        console.log("Fence 2 inclusion area:", fenceInclude2);

        // Path tiles for sign placement
        let pathTiles = {
            type: "tile",
            tiles: [44, 40, 42, 43] // Path tile indices
        };

        // House tiles to avoid for beehive placement
        let houseTiles = {
            type: "tile",
            tiles: [49, 50, 52, 51, 61, 62, 64, 63]
        };

        // Place a sign near a path
        let signCoord = await this.placeTileConstraint([pathTiles], [], this.groundLayer);
        if (signCoord) {
            console.log("Placing sign at coordinate:", signCoord);
            this.housesLayer.putTileAt(84, signCoord.x, signCoord.y); // Tile index 84 for sign
        } else {
            console.warn("No valid position found for sign placement.");
        }

        // Place a wheelbarrow inside any fenced area, excluding fences
        let wheelbarrowCoord = await this.placeTileConstraint(
            [fenceInclude1, fenceInclude2],
            [], // No exclusion for this test
            this.housesLayer
        );

        if (wheelbarrowCoord) {
            console.log("Placing wheelbarrow at coordinate:", wheelbarrowCoord);
            this.housesLayer.putTileAt(58, wheelbarrowCoord.x, wheelbarrowCoord.y); // Tile index 58 for wheelbarrow
        } else {
            console.warn("No valid position found for wheelbarrow placement.");
            console.log("Fence 1 inclusion area:", fenceInclude1);
            console.log("Fence 2 inclusion area:", fenceInclude2);
        }

        // Place a beehive in the open world, avoiding houses
        let beehiveCoord = await this.placeTileConstraint([world], [houseTiles], this.housesLayer);
        if (beehiveCoord) {
            console.log("Placing beehive at coordinate:", beehiveCoord);
            this.housesLayer.putTileAt(95, beehiveCoord.x, beehiveCoord.y); // Tile index 95 for beehive
        } else {
            console.warn("No valid position found for beehive placement.");
        }

        // Camera settings
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(this.SCALE);
    }


}
