import Phaser from "phaser";
import spriteSheetImage from "../assets/spritesheet.png";
import spriteSheetData from "../assets/spritesheet.json";
import physicsData from "../assets/physics.json";

const width = 600;
const height = 400;
const config = {
  type: Phaser.AUTO,
  parent: document.getElementById("phaser"),
  width,
  height,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  physics: {
    default: "matter",
    matter: {
      // debug: true,
      gravity: {
        y: 0,
      },
    },
  },
  render: {
    antialias: false,
    antialiasGL: false,
    pixelart: true,
  },
};

const game = new Phaser.Game(config);
let graphics = {};
let line;
let sprite;
let isDraggingSprite = false;
let target = {};
let objects = [];

function createTarget(scene, x, y) {
  target.ring1 = scene.matter.add.circle(x, y, 20, {
    isSensor: true,
  });
  target.ring2 = scene.matter.add.circle(x, y, 40, {
    isSensor: true,
  });
  target.ring3 = scene.matter.add.circle(x, y, 60, {
    isSensor: true,
  });
}

function drawTarget(scene) {
  graphics.target.fillStyle(0x0000ff);
  graphics.target.fillCircle(
    target.ring3.position.x,
    target.ring3.position.y,
    target.ring3.circleRadius
  );
  graphics.target.fillStyle(0xff0000);
  graphics.target.fillCircle(
    target.ring2.position.x,
    target.ring2.position.y,
    target.ring2.circleRadius
  );
  graphics.target.fillStyle(0xccdd00);
  graphics.target.fillCircle(
    target.ring1.position.x,
    target.ring1.position.y,
    target.ring1.circleRadius
  );
}

function createObject(
  scene,
  { x = 0, y = 0, shape = "rectangle", width = 0, height = 0, radius }
) {
  let newObject;

  if (shape === "rectangle") {
    newObject = scene.matter.add.rectangle(x, y, width, height, {
      isStatic: true,
      label: "rect",
    });
  }

  objects.push(newObject);
}

function drawObjects(scene) {
  graphics.objects.fillStyle(0x964b00);

  objects.forEach((object) => {
    if (object.label === "rect") {
      graphics.objects.fillRect(
        object.position.x - object.centerOffset.x,
        object.position.y - object.centerOffset.y,
        object.centerOffset.x * 2,
        object.centerOffset.y * 2
      );
    }
  });
}

function preload() {
  //  Load sprite sheet generated with TexturePacker
  this.load.atlas("fruits", spriteSheetImage, spriteSheetData);

  //  Load body shapes from JSON file generated using PhysicsEditor
  this.load.json("shapes", physicsData);
}

function create() {
  graphics.target = this.add.graphics();
  graphics.objects = this.add.graphics();
  createTarget(this, 250, 300);

  this.matter.world.setBounds(0, 0, width, height);
  const shapes = this.cache.json.get("shapes");

  sprite = this.matter.add.sprite(200, 50, "fruits", "tile-0", {
    shape: shapes["tile-0"],
  });
  sprite.setInteractive();

  isDraggingSprite = false;

  sprite.on("pointerdown", function (pointer) {
    this.setTint(0xff0000);
    isDraggingSprite = true;
  });

  graphics.line = this.add.graphics({
    lineStyle: { width: 2, color: 0x00ff00 },
  });
  line = new Phaser.Geom.Line(0, 0, 0, 0);

  createObject(this, {
    x: 300,
    y: 50,
    width: 20,
    height: 100,
    shape: "rectangle",
  });

  this.input.on("pointerup", function (pointer) {
    if (!isDraggingSprite) {
      return;
    }

    isDraggingSprite = false;

    const mousePosition = new Phaser.Math.Vector2(
      pointer.position.x,
      pointer.position.y
    );
    const spritePosition = new Phaser.Math.Vector2(
      sprite.body.position.x,
      sprite.body.position.y
    );

    const force = new Phaser.Math.Vector2();
    force.add(spritePosition); // start with sprite position
    force.subtract(mousePosition); // get direction vector between spritePosition and mousePosition
    force.normalize();

    const forceMagnitude = 0.05;
    force.scale(forceMagnitude);

    const distanceFromReleasePoint = spritePosition.distance(mousePosition);
    // It's alright if this is larger than 1, we just want values around 1.
    // The theoretical maximum value is the diagonal from opposing corners.
    const fractionOfWidth = distanceFromReleasePoint / width;

    force.scale(fractionOfWidth);

    sprite.clearTint();
    sprite.applyForceFrom(pointer.position, force);
  });
}

function update() {
  graphics.target.clear();
  graphics.line.clear();
  graphics.objects.clear();

  if (isDraggingSprite) {
    line.x1 = sprite.body.position.x;
    line.y1 = sprite.body.position.y;
    line.x2 = this.input.activePointer.x;
    line.y2 = this.input.activePointer.y;

    graphics.line.strokeLineShape(line);
  }

  drawTarget(this);
  drawObjects(this);
}
