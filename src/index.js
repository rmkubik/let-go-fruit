import Phaser from "phaser";
import spriteSheetImage from "../assets/spritesheet.png";
import spriteSheetData from "../assets/spritesheet.json";
import physicsData from "../assets/physics.json";

const config = {
  type: Phaser.AUTO,
  parent: document.getElementById("phaser"),
  width: 600,
  height: 400,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    preload: preload,
    create: create,
  },
  physics: {
    default: "matter",
    matter: {
      // debug: true,
    },
  },
  render: {
    antialias: false,
    antialiasGL: false,
    pixelart: true,
  },
};

const game = new Phaser.Game(config);

function preload() {
  //  Load sprite sheet generated with TexturePacker
  this.load.atlas("fruits", spriteSheetImage, spriteSheetData);

  //  Load body shapes from JSON file generated using PhysicsEditor
  this.load.json("shapes", physicsData);
}

function create() {
  this.matter.world.setBounds(0, 0, 300, 400);
  const shapes = this.cache.json.get("shapes");
  // this.add.image(0, 0, "sheet", "background").setOrigin(0, 0);
  // var ground = this.matter.add.sprite(0, 0, "sheet", "ground", {
  //   shape: shapes.ground,
  // });
  // this.matter.alignBody(ground, 300, 800, Phaser.Display.Align.BOTTOM_CENTER);
  this.matter.add.sprite(200, 50, "fruits", "tile-0", {
    shape: shapes["tile-0"],
  });
  // var shapeKeys = ["crate", "banana", "orange", "cherries"];
  // this.input.on(
  //   "pointerdown",
  //   function (pointer) {
  //     var fruit = Phaser.Utils.Array.GetRandom(shapeKeys);
  //     this.matter.add.image(pointer.x, pointer.y, "sheet", fruit, {
  //       shape: shapes[fruit],
  //     });
  //   },
  //   this
  // );
}
