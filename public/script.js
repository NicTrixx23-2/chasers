const socket = io();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(20, 20, 20);
scene.add(light);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x228B22 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const players = {};
let myId = null;
let myPos = new THREE.Vector3(0, 0.5, 0);
let dir = new THREE.Vector3();
let cameraMode = "third";

function addPlayer(id, isChaser) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: isChaser ? 0xff0000 : 0x00ff00 });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return mesh;
}

socket.on("updatePlayers", (data) => {
  if (!myId) myId = socket.id;
  for (const id in data) {
    if (!players[id]) {
      players[id] = addPlayer(id, data[id].isChaser);
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
  myPos.add(dir.clone().multiplyScalar(0.2));
  socket.emit("playerMove", { x: myPos.x, z: myPos.z });

  if (cameraMode === "third") {
    camera.position.set(myPos.x, 15, myPos.z + 10);
    camera.lookAt(myPos.x, 0.5, myPos.z);
  } else {
    camera.position.set(myPos.x, 1.5, myPos.z);
    camera.lookAt(myPos.x + dir.x, 1.5, myPos.z + dir.z);
  }

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
