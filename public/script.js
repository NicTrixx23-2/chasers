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
  addBox(10, 15, 0xA9A9A9, [1.
