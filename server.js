const socket = io();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Licht
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(20, 20, 20);
scene.add(light);

// Boden
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Map Objekte
function addBox(x, z, color = 0x808080, scale = [2, 2, 2]) {
  const geo = new THREE.BoxGeometry(...scale);
  const mat = new THREE.MeshStandardMaterial({ color });
  const box = new THREE.Mesh(geo, mat);
  box.position.set(x, scale[1] / 2, z);
  scene.add(box);
}

function generateMap() {
  addBox(-15, -15, 0x8B4513, [4, 4, 4]);
  addBox(15, -10, 0x8B4513, [5, 5, 5]);
  addBox(-20, 20, 0x8B4513, [3, 3, 3]);

  addBox(0, -20, 0xA9A9A9, [2, 1, 2]);
  addBox(10, 15, 0xA9A9A9, [1.5, 1, 1.5]);

  for (let i = 0; i < 5; i++) {
    const x = Math.random() * 80 - 40;
    const z = Math.random() * 80 - 40;
    addBox(x, z, 0x8B4513, [0.5, 2, 0.5]);
    const geo = new THREE.SphereGeometry(1.5, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0x006400 });
    const leaves = new THREE.Mesh(geo, mat);
    leaves.position.set(x, 3.5, z);
    scene.add(leaves);
  }
}
generateMap();

const players = {};
let myId = null;
let myPos = { x: 0, z: 0 };
let dir = { x: 0, z: 0 };
let cameraMode = "third";

socket.on("updatePlayers", (data) => {
  if (!myId) myId = socket.id;
  for (const id in data) {
    if (!players[id]) {
      const color = data[id].isChaser ? 0xff0000 : 0x00ff00;
      const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color }));
      scene.add(cube);
      players[id] = cube;
    }
    players[id].position.set(data[id].x, 0.5, data[id].z);
    players[id].material.color.setHex(data[id].isChaser ? 0xff0000 : 0x00ff00);
  }

  for (const id in players) {
    if (!data[id]) {
      scene.remove(players[id]);
      delete players[id];
    }
  }
});

function animate() {
  requestAnimationFrame(animate);
  myPos.x += dir.x * 0.2;
  myPos.z += dir.z * 0.2;
  socket.emit("playerMove", myPos);

  if (cameraMode === "third") {
    camera.position.set(myPos.x, 15, myPos.z + 10);
    camera.lookAt(myPos.x, 0, myPos.z);
  } else {
    camera.position.set(myPos.x, 1.5, myPos.z);
    camera.lookAt(myPos.x + dir.x, 1.5, myPos.z + dir.z);
  }

  renderer.render(scene, camera);
}
animate();

document.getElementById("left").ontouchstart = () => dir.x = -1;
document.getElementById("right").ontouchstart = () => dir.x = 1;
document.getElementById("up").ontouchstart = () => dir.z = -1;
document.getElementById("down").ontouchstart = () => dir.z = 1;
["left", "right", "up", "down"].forEach(id => {
  document.getElementById(id).ontouchend = () => { dir.x = 0; dir.z = 0; };
});

document.getElementById("switchCam").onclick = () => {
  cameraMode = cameraMode === "third" ? "first" : "third";
};
