class Z3Scene extends Phaser.Scene {
    constructor(my) {
        super("z3scene");
        this.my = my;
    }

    init() {
        this.tileSize = 16;
        this.scaleFactor = 1.5;
        this.mapWidth = 40;
        this.mapHeight = 25;
    }

    async findTilePosition(includeRules, excludeRules, tileLayer) {
        const { Solver, Int, And, Or, Distinct, Not } = new this.my.Context("main");
        const solver = new Solver();

        const xPos = Int.const('posX');
        const yPos = Int.const('posY');

        // Add inclusion constraints
        includeRules.forEach(rule => {
            if (rule.type === "box") {
                solver.add(
                    And(
                        xPos.ge(rule.center.x - rule.size.x / 2),
                        xPos.le(rule.center.x + rule.size.x / 2),
                        yPos.ge(rule.center.y - rule.size.y / 2),
                        yPos.le(rule.center.y + rule.size.y / 2)
                    )
                );
            }
            if (rule.type === "tile") {
                const tileConstraints = [];
                rule.tiles.forEach(tileIndex => {
                    let matchingCoords = this.getTilesByIndex(tileLayer, tileIndex);
                    matchingCoords.forEach(coord => {
                        tileConstraints.push(And(xPos.eq(coord.x), yPos.eq(coord.y)));
                    });
                });
                solver.add(tileConstraints.reduce((a, b) => a.or(b)));
            }
        });

        // Add exclusion constraints
        excludeRules.forEach(rule => {
            if (rule.type === "box") {
                solver.add(
                    Not(
                        And(
                            xPos.ge(rule.center.x - rule.size.x / 2),
                            xPos.le(rule.center.x + rule.size.x / 2),
                            yPos.ge(rule.center.y - rule.size.y / 2),
                            yPos.le(rule.center.y + rule.size.y / 2)
                        )
                    )
                );
            }
            if (rule.type === "tile") {
                rule.tiles.forEach(tileIndex => {
                    let matchingCoords = this.getTilesByIndex(tileLayer, tileIndex);
                    matchingCoords.forEach(coord => {
                        solver.add(Not(And(xPos.eq(coord.x), yPos.eq(coord.y))));
                    });
                });
            }
        });

        // Collect valid coordinates
        const validPositions = [];
        while ((await solver.check()) === "sat") {
            const model = solver.model();
            const x = parseInt(model.eval(xPos).asString());
            const y = parseInt(model.eval(yPos).asString());
            validPositions.push({ x, y });

            solver.add(Not(And(xPos.eq(x), yPos.eq(y))));
        }

        if (validPositions.length === 0) {
            console.warn("No valid tile positions found.");
            return null;
        }

        const chosenPosition = validPositions[Math.floor(Math.random() * validPositions.length)];
        console.log("Chosen tile position:", chosenPosition);
        return chosenPosition;
    }

    getTilesByIndex(layer, tileIndex) {
        const coordinates = [];
        layer.forEachTile(tile => {
            if (tile.index === tileIndex) {
                coordinates.push({ x: tile.x, y: tile.y });
            }
        });
        console.log(`Found ${coordinates.length} tiles of type ${tileIndex}`);
        return coordinates;
    }

    async create() {
        this.map = this.add.tilemap("three-farmhouses", this.tileSize, this.tileSize, this.mapHeight, this.mapWidth);

        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("kenney-tiny-town", "tilemap_tiles");

        // Create layers
        this.groundLayer = this.map.createLayer("Ground-n-Walkways", this.tileset, 0, 0);
        this.treesLayer = this.map.createLayer("Trees-n-Bushes", this.tileset, 0, 0);
        this.structuresLayer = this.map.createLayer("Houses-n-Fences", this.tileset, 0, 0);

        // Constraints for world bounds
        const worldConstraints = {
            type: "box",
            center: { x: 19, y: 12 },
            size: { x: 38, y: 24 }
        };

        // Constraints to avoid houses
        const houseConstraints = {
            type: "tile",
            tiles: [49, 50, 52, 51, 61, 62, 64, 63]
        };

        // Path tiles for sign placement
        const pathTiles = {
            type: "tile",
            tiles: [44, 40, 42, 43]
        };

        // Place 2 signs near paths
        for (let i = 0; i < 2; i++) {
            const signPosition = await this.findTilePosition([pathTiles], [], this.groundLayer);
            if (signPosition) {
                console.log(`Placing sign ${i + 1} at`, signPosition);
                this.structuresLayer.putTileAt(84, signPosition.x, signPosition.y);
            } else {
                console.warn(`Failed to place sign ${i + 1}`);
            }
        }

        // Place beehive avoiding houses
        const beehivePosition = await this.findTilePosition([worldConstraints], [houseConstraints], this.structuresLayer);
        if (beehivePosition) {
            console.log("Placing beehive at", beehivePosition);
            this.structuresLayer.putTileAt(95, beehivePosition.x, beehivePosition.y); 
        } else {
            console.warn("Failed to place beehive");
        }

        // Camera settings
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(this.scaleFactor);
    }
}

