import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set a white background
scene.background = new THREE.Color(0xffffff);

// Camera position
camera.position.set(0, 15, 30);
camera.lookAt(0, 0, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Glass surface
const glassGeometry = new THREE.PlaneGeometry(50, 50);
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.1,
  roughness: 0.02,
  transmission: 0.95,
  thickness: 0.1,
});
const glass = new THREE.Mesh(glassGeometry, glassMaterial);
glass.rotation.x = -Math.PI / 2;
scene.add(glass);

// Water droplet class
class WaterDroplet {
  constructor(position, size) {
    this.position = position;
    this.size = size;
    this.velocity = new THREE.Vector3(0, -Math.random() * 2 - 1, 0);
    
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x3399ff,
      transparent: true,
      roughness: 0.02,
      transmission: 0.98,
      reflectivity: 0.9,
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(position.x, position.y, position.z);
    scene.add(this.mesh);
  }
  
  update(deltaTime) {
    this.position.addScaledVector(this.velocity, deltaTime);
    if (this.position.y < 0) {
      this.position.y = Math.random() * 10 + 10;
    }
    this.mesh.position.copy(this.position);
  }
  
  shatter(clickPoint) {
    scene.remove(this.mesh);
    for (let i = 0; i < 5; i++) {
      const shardSize = this.size * (Math.random() * 0.5 + 0.5);
      const shard = new WaterDroplet(this.position.clone(), shardSize);
      const direction = new THREE.Vector3().subVectors(this.position, clickPoint).normalize();
      shard.velocity.set(direction.x * (Math.random() * 2 + 1), direction.y * (Math.random() * 2 + 1), direction.z * (Math.random() * 2 + 1));
      shard.velocity.set(
        (Math.random() - 0.5) * 0.5, // Small horizontal variation
        -Math.random() * 2 - 1, // Downward motion
        (Math.random() - 0.5) * 0.5
      );
      droplets.push(shard);
    }
  }
}

// Create and animate droplets
const droplets = [];
let raining = true;
function createDroplet() {
  const x = Math.random() * 20 - 10;
  const z = Math.random() * 20 - 10;
  const size = Math.random() * 0.1 + 0.05;
  const droplet = new WaterDroplet(new THREE.Vector3(x, Math.random() * 10 + 10, z), size);
  droplets.push(droplet);
}

for (let i = 0; i < 100; i++) createDroplet();

// Toggle rain on click
document.addEventListener('click', () => {
  raining = !raining;
});

// Shatter droplets on click
document.addEventListener('pointerdown', (event) => {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(droplets.map(d => d.mesh));
  if (intersects.length > 0) {
    const clickedDroplet = droplets.find(d => d.mesh === intersects[0].object);
    if (clickedDroplet) {
      clickedDroplet.shatter(intersects[0].point);
      droplets.splice(droplets.indexOf(clickedDroplet), 1);
    }
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  const deltaTime = 0.016;
  
  if (raining) {
    for (const droplet of droplets) {
      droplet.update(deltaTime);
    }
  }
  
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
