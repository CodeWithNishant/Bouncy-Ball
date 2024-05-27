import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import * as CANNON from "cannon-es";

// ------------------------------------ Basic Setup for renderer and camera -------------------------------------

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Scene setup
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const orbit = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 20, 35);
orbit.update();

// ---------------------------------------- 3D Components Setup -------------------------------------------------

// Box setup
const boxGeo = new THREE.BoxGeometry(2, 2, 2);
const boxMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const boxMesh = new THREE.Mesh(boxGeo, boxMat);
scene.add(boxMesh);

// Sphere setup
const sphereGeo = new THREE.SphereGeometry(2);
const sphereMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
});
const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(sphereMesh);

// Ground setup
const groundGeo = new THREE.PlaneGeometry(30, 30);
const groundMat = new THREE.MeshBasicMaterial({
  color: 0x808080,
  side: THREE.DoubleSide,
});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
scene.add(groundMesh);

// Physics world setup
const world = new CANNON.World();
world.gravity.set(0, -9.31, 0);

// Ground physics
const groundPhysMat = new CANNON.Material();
const groundBody = new CANNON.Body({
  shape: new CANNON.Box(new CANNON.Vec3(15, 15, 0.1)),
  type: CANNON.Body.STATIC,
  material: groundPhysMat,
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Box physics
const boxPhysMat = new CANNON.Material();
const boxBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
  position: new CANNON.Vec3(
    Math.floor(Math.random() * (-14 - 14 + 1)) + 14,
    20,
    Math.floor(Math.random() * (-14 - 14 + 1)) + 14
  ),
  material: boxPhysMat,
});
world.addBody(boxBody);
boxBody.angularDamping = 0.5;

// Contact materials
const groundBoxContactMat = new CANNON.ContactMaterial(
  groundPhysMat,
  boxPhysMat,
  { friction: 0.001 }
);
world.addContactMaterial(groundBoxContactMat);

// Sphere physics
const spherePhysMat = new CANNON.Material();
const sphereBody = new CANNON.Body({
  mass: 4,
  shape: new CANNON.Sphere(2),
  position: new CANNON.Vec3(0, 10, 0),
  material: spherePhysMat,
});
world.addBody(sphereBody);
sphereBody.linearDamping = 0.21;

const groundSphereContactMat = new CANNON.ContactMaterial(
  groundPhysMat,
  spherePhysMat,
  { restitution: 0.6 }
);
world.addContactMaterial(groundSphereContactMat);

// ----------------------------------------- Control for ball movement---------------------------------------
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  KeyR: false,
  KeyE: false,
};

window.addEventListener("keydown", (event) => {
  keys[event.code] = true;
});

window.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

function updateBallVelocity() {
  const forceMagnitude = 0.2;
  if (keys.ArrowUp) {
    sphereBody.velocity.z -= forceMagnitude;
  }
  if (keys.ArrowDown) {
    sphereBody.velocity.z += forceMagnitude;
  }
  if (keys.ArrowLeft) {
    sphereBody.velocity.x -= forceMagnitude;
  }
  if (keys.ArrowRight) {
    sphereBody.velocity.x += forceMagnitude;
  }
}

// -----------------------------------------------------Enemy logic-------------------------------------------
let elapsedTime = 0;
const blockSpawnInterval = 4;

function updateTimer() {
  elapsedTime++;
  if (elapsedTime % blockSpawnInterval === 0) {
    spawnBlock();
  }
}

function spawnBlock() {
  const boxGeo = new THREE.BoxGeometry(2, 2, 2);
  const boxMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const boxMesh = new THREE.Mesh(boxGeo, boxMat);
  scene.add(boxMesh);

  const boxBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
    position: new CANNON.Vec3(
      Math.floor(Math.random() * (-14 - 14 + 1)) + 14,
      20,
      Math.floor(Math.random() * (-14 - 14 + 1)) + 14
    ),
    material: boxPhysMat,
  });
  world.addBody(boxBody);

  // Updating all meshes
  boxes.push({ mesh: boxMesh, body: boxBody });
}

setInterval(updateTimer, 1000);

// Load font once
let loadedFont;
const loader = new FontLoader();
loader.load("Roboto_Regular.json", function (font) {
  loadedFont = font;
});

// ------------------------------------- Global text for game screen -------------------------------------------
let showingGlobalText = false;

function showGlobalText() {
  if (loadedFont && !showingGlobalText) {
    const globalTextGeometry = new TextGeometry(
      "Created By - Nishant Nagar " +
        "                                      Control : Arrow Keys",
      {
        font: loadedFont,
        size: 0.7, // Smaller size
        height: 0.1, // Adjusted height
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.02, // Reduced thickness
        bevelSize: 0.01, // Reduced bevel size
        bevelOffset: 0,
        bevelSegments: 3, // Fewer segments for less obvious bevel
      }
    );

    const globalTextMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White color for visibility
    const globalTextMesh = new THREE.Mesh(
      globalTextGeometry,
      globalTextMaterial
    );
    scene.add(globalTextMesh);

    // Position in the bottom corner, less conspicuous
    globalTextMesh.position.set(-34, -19, 0);

    showingGlobalText = true;
  }
}

// --------------------------------------------------Core game functions-----------------------------------------
let gameOverMessageShown = false;
let gameOver = false;

function coreGame() {
  if (sphereBody.position.y < 0) {
    if (!gameOverMessageShown) {
      showGameOverMessage();
      gameOverMessageShown = !gameOverMessageShown;
      gameOver = true;
    }
    if (keys.KeyR) {
      console.log("Resetting Game");
      location.reload();
    }
    if (keys.KeyE) {
      window.location.href = "index.html"; // Redirect to your home page
    }
  }
}

function showGameOverMessage() {
  if (loadedFont) {
    const textGeometry = new TextGeometry("Game Over", {
      font: loadedFont,
      size: 5,
      height: 0.2,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 5,
    });
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    scene.add(textMesh);
    textMesh.position.set(-15, 5, 0);

    const subTextGeometry = new TextGeometry(
      "press R to reload \n press E to exit",
      {
        font: loadedFont,
        size: 0.8,
        height: 0.1,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5,
      }
    );
    const subTextMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const subTextMesh = new THREE.Mesh(subTextGeometry, subTextMaterial);
    scene.add(subTextMesh);
    subTextMesh.position.set(-5, 3, 0);
  }
}

function update() {
  updateBallVelocity();
  coreGame();
  showGlobalText();
}

// Animation loop
const timeStep = 1 / 60;
const boxes = [];
let cameraAngle = 0;

function animate() {
  world.step(timeStep);
  update();

  groundMesh.position.copy(groundBody.position);
  groundMesh.quaternion.copy(groundBody.quaternion);

  boxMesh.position.copy(boxBody.position);
  boxMesh.quaternion.copy(boxBody.quaternion);

  sphereMesh.position.copy(sphereBody.position);
  sphereMesh.quaternion.copy(sphereBody.quaternion);

  // Update all spawned boxes
  boxes.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });

  // Special camera movement on game over
  if (gameOver) {
    cameraAngle += 0.01; // Speed of the camera movement
    camera.position.x = 30 * Math.cos(cameraAngle);
    camera.position.z = 30 * Math.sin(cameraAngle);
    camera.lookAt(new THREE.Vector3(-15, 5, 0)); // Point the camera at the game over text
  } else {
    orbit.update(); // Allow regular orbit controls if the game is not over
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// Window resize handling
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
