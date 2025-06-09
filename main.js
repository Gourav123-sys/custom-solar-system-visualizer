// Scene setup
const scene = new THREE.Scene();
const container = document.getElementById("container");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(0, 150, 400);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 0, 2);
scene.add(sunLight);

// Sun
const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfdb813 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Background stars
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.1,
  transparent: true,
});

const starsVertices = [];
for (let i = 0; i < 10000; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 2000;
  starsVertices.push(x, y, z);
}

starsGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starsVertices, 3)
);
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Planets data
const PLANETS = [
  { name: "Mercury", color: 0xb1b1b1, size: 3, dist: 60, speed: 4.8 },
  { name: "Venus", color: 0xeccc9a, size: 5, dist: 85, speed: 3.5 },
  { name: "Earth", color: 0x2a6bd6, size: 6, dist: 110, speed: 2.98 },
  { name: "Mars", color: 0xc1440e, size: 4, dist: 135, speed: 2.41 },
  { name: "Jupiter", color: 0xd2b48c, size: 12, dist: 170, speed: 1.31 },
  { name: "Saturn", color: 0xf5deb3, size: 10, dist: 205, speed: 0.97 },
  { name: "Uranus", color: 0x7fffd4, size: 8, dist: 240, speed: 0.68 },
  { name: "Neptune", color: 0x4166f5, size: 8, dist: 275, speed: 0.54 },
];

// Create planets and their orbits
const planets = [];
const planetOrbits = [];
const planetSpeeds = {};
const orbitRings = [];

PLANETS.forEach((p, i) => {
  // Orbit group
  const orbit = new THREE.Object3D();
  scene.add(orbit);
  planetOrbits.push(orbit);

  // Planet mesh
  const geometry = new THREE.SphereGeometry(p.size, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: p.color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = p.dist;
  orbit.add(mesh);
  planets.push(mesh);

  // Orbit ring
  const ringGeometry = new THREE.RingGeometry(p.dist - 0.2, p.dist + 0.2, 64);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x888888,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);
  orbitRings.push(ring);

  // Initial speed
  planetSpeeds[p.name] = p.speed;
});

// Speed controls
const speedControls = document.getElementById("speed-controls");
PLANETS.forEach((p) => {
  const label = document.createElement("label");
  label.textContent = p.name;
  const input = document.createElement("input");
  input.type = "range";
  input.min = 0.1;
  input.max = 5;
  input.step = 0.1;
  input.value = 1;
  input.addEventListener("input", (e) => {
    planetSpeeds[p.name] = p.speed * parseFloat(e.target.value);
  });
  speedControls.appendChild(label);
  speedControls.appendChild(input);
});

// Theme toggle
let isDarkTheme = true;
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
  isDarkTheme = !isDarkTheme;
  document.body.style.background = isDarkTheme ? "#000" : "#fff";
  document.body.style.color = isDarkTheme ? "#fff" : "#000";
  scene.background = new THREE.Color(isDarkTheme ? 0x000000 : 0xffffff);
  themeToggle.textContent = isDarkTheme ? "Light Mode" : "Dark Mode";

  // Update orbit ring materials
  orbitRings.forEach((ring) => {
    ring.material.color.set(isDarkTheme ? 0x888888 : 0x444444);
    ring.material.opacity = isDarkTheme ? 0.3 : 0.4;
  });
});

// Pause/Resume
let isPaused = false;
const pauseBtn = document.getElementById("pause-btn");
pauseBtn.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
});

// Tooltip
const tooltip = document.getElementById("tooltip");
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);

  if (intersects.length > 0) {
    const planet = intersects[0].object;
    const planetIndex = planets.indexOf(planet);
    if (planetIndex !== -1) {
      tooltip.textContent = PLANETS[planetIndex].name;
      tooltip.style.display = "block";
      tooltip.style.left = event.clientX + 10 + "px";
      tooltip.style.top = event.clientY + 10 + "px";
    }
  } else {
    tooltip.style.display = "none";
  }
});

// Camera zoom on click
window.addEventListener("click", (event) => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);

  if (intersects.length > 0) {
    const planet = intersects[0].object;
    const planetIndex = planets.indexOf(planet);
    if (planetIndex !== -1) {
      const planetData = PLANETS[planetIndex];
      const targetPosition = new THREE.Vector3(
        planetData.dist * 1.5,
        30,
        planetData.dist * 1.5
      );
      camera.position.lerp(targetPosition, 0.1);
    }
  }
});

// Responsive resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    const delta = clock.getDelta();

    // Update planet positions
    PLANETS.forEach((p, i) => {
      const orbit = planetOrbits[i];
      orbit.rotation.y += (planetSpeeds[p.name] * delta) / 20;
      planets[i].rotation.y += 0.03;
    });

    // Rotate sun
    sun.rotation.y += 0.005;
  }

  renderer.render(scene, camera);
}

animate();
