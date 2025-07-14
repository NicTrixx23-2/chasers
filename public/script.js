const socket = io();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Licht
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 100, 50);
scene.add(directionalLight);

// Boden
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x228B22 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Spieler
const players = {};
let myId = null;
let myPos = new THREE.Vector3(0, 0.5, 0);
let dir = new THREE.Vector3();
let cameraMode = "third";
let cameraAngle = 0;

// Capsule Geometry für Spieler
function createCapsule(height = 1.2, radius = 0.3, isChaser = false) {
  const capsule = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: isChaser ? 0xff0000 : 0x00ff00 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height - 2 * radius, 12), material);
  const capTop = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 12), material);
  const capBottom = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 12), material);

  capTop.position.y = (height - radius);
  capBottom.position.y = radius - height;

  capsule.add(body);
  capsule.add(capTop);
  capsule.add(capBottom);

  return capsule;
}

function addPlayer(id, isChaser) {
  const capsule = createCapsule(1.2, 0.3, isChaser);
  scene.add(capsule);
  return capsule;
}

socket.on("updatePlayers", (data) => {
  if (!myId) myId = socket.id;
  for (const id in data) {
    if (!players[id]) {
      players[id] = addPlayer(id, data[id].isChaser);
    }
    players[id].position.set(data[id].x, 0.5, data[id].z);
    players[id].children.forEach(part => {
      part.material.color.setHex(data[id].isChaser ? 0xff0000 : 0x00ff00);
    });
  }
  for (const id in players) {
    if (!data[id]) {
      scene.remove(players[id]);
      delete players[id];
    }
  }
});

// Kamera folgt Spieler + Rotation
function updateCamera() {
  const distance = 10;
  const offsetX = Math.sin(cameraAngle) * distance;
  const offsetZ = Math.cos(cameraAngle) * distance;

  if (cameraMode === "third") {
    camera.position.set(myPos.x + offsetX, myPos.y + 6, myPos.z + offsetZ);
    camera.lookAt(myPos.x, myPos.y + 1, myPos.z);
  } else {
    camera.position.set(myPos.x, myPos.y + 1.5, myPos.z);
    camera.lookAt(myPos.x + dir.x, myPos.y + 1.5, myPos.z + dir.z);
  }
}

function animate() {
  requestAnimationFrame(animate);
  myPos.add(dir.clone().multiplyScalar(0.2));
  socket.emit("playerMove", { x: myPos.x, z: myPos.z });

  updateCamera();
  renderer.render(scene, camera);
}
animate();

document.getElementById("switchCam").onclick = () => {
  cameraMode = cameraMode === "third" ? "first" : "third";
};

const joystick = nipplejs.create({
  zone: document.getElementById("joystickWrapper"),
  mode: "static",
  position: { left: "50px", bottom: "50px" },
  color: "white"
});

joystick.on("move", (evt, data) => {
  const angle = data.angle.radian;
  dir.x = Math.cos(angle);
  dir.z = Math.sin(angle);
});
joystick.on("end", () => dir.set(0, 0, 0));

// Kamera-Rotation per Touch + Maus
let isDragging = false;
let lastX = 0;
document.addEventListener("mousedown", e => { isDragging = true; lastX = e.clientX; });
document.addEventListener("mouseup", () => { isDragging = false; });
document.addEventListener("mousemove", e => {
  if (isDragging) {
    const delta = e.clientX - lastX;
    cameraAngle -= delta * 0.005;
    lastX = e.clientX;
  }
});
document.addEventListener("touchstart", e => {
  if (e.touches.length === 1) lastX = e.touches[0].clientX;
});
document.addEventListener("touchmove", e => {
  if (e.touches.length === 1) {
    const delta = e.touches[0].clientX - lastX;
    cameraAngle -= delta * 0.005;
    lastX = e.touches[0].clientX;
  }
});
