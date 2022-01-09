import Phaser from "phaser";
import spriteSheetImage from "../assets/spritesheet.png";
import spriteSheetData from "../assets/spritesheet.json";
import physicsData from "../assets/physics.json";
import level1Data from "../assets/levels/level1.json";

const width = 640;
const height = 448;
const marginX = 64;
const marginY = 64;

const config = {
  type: Phaser.AUTO,
  parent: document.getElementById("phaser"),
  width: width + marginX * 2,
  height: height + marginY * 2,
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
let player;
let isDraggingSprite = false;
let target = {};
let objects = [];
let strokes = 0;

function createPlayer(scene, x, y) {
  const shapes = scene.cache.json.get("shapes");

  player = scene.matter.add.sprite(x, y, "fruits", "tile-0", {
    shape: shapes["tile-0"],
    label: "player",
  });
  player.setInteractive();
}

function createTarget(scene, x, y, radius) {
  // target.ring1 = scene.matter.add.circle(x, y, 20, {
  //   isSensor: true,
  //   label: "target-ring1",
  // });
  target.ring2 = scene.matter.add.circle(x, y, radius, {
    isSensor: true,
    label: "target-ring2",
  });
  // target.ring3 = scene.matter.add.circle(x, y, 60, {
  //   isSensor: true,
  //   label: "target-ring3",
  // });
}

function isPlayerInTarget(scene) {
  return scene.matter.intersectBody(player.body, [target.ring2]).length > 0;
}

function drawTarget(scene) {
  // graphics.target.fillStyle(0x0000ff);
  // graphics.target.fillCircle(
  //   target.ring3.position.x,
  //   target.ring3.position.y,
  //   target.ring3.circleRadius
  // );
  if (isPlayerInTarget(scene)) {
    graphics.target.fillStyle(0x226622);
    graphics.target.fillCircle(
      target.ring2.position.x,
      target.ring2.position.y,
      target.ring2.circleRadius
    );
  } else {
    graphics.target.clear();
  }
  graphics.target.lineStyle(2, 0x55aa66);
  graphics.target.strokeCircle(
    target.ring2.position.x,
    target.ring2.position.y,
    target.ring2.circleRadius
  );
  // graphics.target.fillStyle(0xccdd00);
  // graphics.target.fillCircle(
  //   target.ring1.position.x,
  //   target.ring1.position.y,
  //   target.ring1.circleRadius
  // );
}

function createObject(
  scene,
  { x = 0, y = 0, shape = "rectangle", width = 0, height = 0, radius }
) {
  let newObject;

  if (shape === "rectangle") {
    newObject = scene.matter.add.rectangle(x, y, width, height, {
      isStatic: true,
      label: "object-rect",
    });
  }

  objects.push(newObject);
}

function drawObjects(scene) {
  graphics.objects.fillStyle(0xffffff);

  objects.forEach((object) => {
    if (object.label === "object-rect") {
      graphics.objects.fillRect(
        object.position.x - object.centerOffset.x,
        object.position.y - object.centerOffset.y,
        object.centerOffset.x * 2,
        object.centerOffset.y * 2
      );
    }
  });
}

function loadLevel(scene, levelKey) {
  const level1 = scene.cache.json.get(levelKey);

  const objectLayers = level1.layers.filter(
    (layer) => layer.type === "objectgroup"
  );

  objectLayers.forEach((objectLayer) => {
    objectLayer.objects.forEach((object) => {
      if (object.type === "collider") {
        createObject(scene, {
          x: object.x + object.width / 2 + marginX,
          y: object.y + object.height / 2 + marginY,
          width: object.width,
          height: object.height,
          shape: "rectangle",
        });
      }

      if (object.type === "player") {
        // Matter.js places sprites at the center origin.
        // Tiled records sprites at the upper left corner origin
        // Our sprites are 32x32
        // We should offset by half this value so the point in
        // Tiled where the player is at the center of the
        // spawned player.
        createPlayer(scene, object.x + 16 + marginX, object.y + 16 + marginY);
      }

      if (object.type === "target") {
        createTarget(
          scene,
          object.x + object.width / 2 + marginX,
          object.y + object.height / 2 + marginY,
          object.width / 2
        );
      }
    });
  });
}

function preload() {
  //  Load sprite sheet generated with TexturePacker
  this.load.atlas("fruits", spriteSheetImage, spriteSheetData);

  //  Load body shapes from JSON file generated using PhysicsEditor
  this.load.json("shapes", physicsData);

  this.load.json("level1", level1Data);
}

function create() {
  graphics.background = this.add.graphics();
  graphics.background.fillStyle(0x000000);
  graphics.background.lineStyle(2, 0xffffff);
  graphics.background.fillRect(marginX, marginY, width, height);
  graphics.background.strokeRect(marginX, marginY, width, height);

  graphics.target = this.add.graphics();
  graphics.objects = this.add.graphics();

  loadLevel(this, "level1");

  this.matter.world.setBounds(marginX, marginY, width, height);

  isDraggingSprite = false;

  player.on("pointerdown", function (pointer) {
    this.setTint(0xff0000);
    isDraggingSprite = true;
  });

  graphics.line = this.add.graphics({
    lineStyle: { width: 2, color: 0x00ff00 },
  });
  line = new Phaser.Geom.Line(0, 0, 0, 0);

  this.input.on("pointerup", function (pointer) {
    if (!isDraggingSprite) {
      return;
    }

    isDraggingSprite = false;

    const mousePosition = new Phaser.Math.Vector2(
      pointer.position.x,
      pointer.position.y
    );
    const playerPosition = new Phaser.Math.Vector2(
      player.body.position.x,
      player.body.position.y
    );

    const force = new Phaser.Math.Vector2();
    force.add(playerPosition); // start with sprite position
    force.subtract(mousePosition); // get direction vector between playerPosition and mousePosition
    force.normalize();

    const forceMagnitude = 0.05;
    force.scale(forceMagnitude);

    const distanceFromReleasePoint = playerPosition.distance(mousePosition);
    // It's alright if this is larger than 1, we just want values around 1.
    // The theoretical maximum value is the diagonal from opposing corners.
    const fractionOfWidth = distanceFromReleasePoint / width;

    force.scale(fractionOfWidth);

    player.clearTint();
    player.applyForceFrom(pointer.position, force);

    strokes += 1;
    document.getElementById("strokes").innerText = strokes;
  });

  // this.matter.world.on("collisionstart", function (event) {
  //   event.pairs.forEach((pair) => {
  //     if (pair.isSensor) {
  //       // Player bodies are made out of many parts, so we want to check
  //       // if any part's parent is owned by the player vs. check
  //       // the actual body that collided.
  //       if (
  //         pair.bodyA.parent.label === "player" &&
  //         pair.bodyB.label === "target-ring2"
  //       ) {
  //         console.log("bodyA is player");
  //       }

  //       if (
  //         pair.bodyB.parent.label === "player" &&
  //         pair.bodyA.label === "target-ring2"
  //       ) {
  //         console.log("bodyB is player");
  //       }
  //     }
  //   });
  // });
}

function update() {
  graphics.target.clear();
  graphics.line.clear();
  graphics.objects.clear();

  if (isDraggingSprite) {
    line.x1 = player.body.position.x;
    line.y1 = player.body.position.y;
    line.x2 = this.input.activePointer.x;
    line.y2 = this.input.activePointer.y;

    graphics.line.strokeLineShape(line);
  }

  drawTarget(this);
  drawObjects(this);
}
