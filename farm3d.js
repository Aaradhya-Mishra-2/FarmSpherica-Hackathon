// farm3d.js — FarmSpherica 3D Biodome & Sprawling Farmland Simulation
// Built procedurally using Three.js for maximum performance, responsiveness and offline support

(function () {
  'use strict';

  // ─── Core State ───
  let scene, camera, renderer, controls;
  let activeMode = 'biodome'; // 'biodome' or 'farmland'
  
  // Scene Parent Groups
  let biodomeGroup, farmlandGroup;
  
  // Lights
  let ambientLight, directionalLight;
  
  // Shared Components
  let gridHelper, selectionHighlight;
  
  // Biodome elements
  let domeFrame, domeGlass, growLightsGroup, cropsGroup;
  let domeOn = true;
  let growLightsOn = true;

  // Farmland elements
  let farmTerrain, windmillBlades, tractor, cloudsGroup, waterDroplets = [];
  let irrigationOn = true;
  let weatherState = 'sunny'; // 'sunny' or 'stormy'
  let lightningTimer = 0;

  // Rooftop Farm elements
  let rooftopFans = [];
  let rooftopCrops = [];

  // Interaction State
  const interactiveObjects = [];
  let activeSelectIndex = -1;
  let pointerDownX = 0;
  let pointerDownY = 0;
  let targetPivot = new THREE.Vector3(0, 1, 0);

  // ─── Crop Telemetry Databases ───
  
  // 1. Hydroponic Biodome Crop Database
  const biodomeCrops = [
    {
      id: 'lettuce',
      name: 'Butterhead Lettuce',
      emoji: '🥬',
      moisture: '82%',
      growRate: 'Optimal',
      harvest: '12 days',
      ec: '1.6 mS/cm',
      yield: '+24%',
      status: 'Thriving',
      desc: 'Grown in aerated shallow water channels. Monitored with high-resolution moisture and EC sensors. Prefers cooler root zones.'
    },
    {
      id: 'basil',
      name: 'Sweet Basil',
      emoji: '🌿',
      moisture: '78%',
      growRate: 'Active',
      harvest: '8 days',
      ec: '1.8 mS/cm',
      yield: '+15%',
      status: 'Thriving',
      desc: 'High-aromatic herb grown under target LED wavelengths (blue-heavy) to enhance terpene and essential oil concentration.'
    },
    {
      id: 'tomatoes',
      name: 'Vine Tomatoes',
      emoji: '🍅',
      moisture: '85%',
      growRate: 'Heavy Feeder',
      harvest: '22 days',
      ec: '2.5 mS/cm',
      yield: '+30%',
      status: 'Flowering',
      desc: 'Climbing vines supported by vertical trellis wires. Feed lines deliver elevated potassium and calcium for fruit development.'
    },
    {
      id: 'mint',
      name: 'Peppermint',
      emoji: '🍃',
      moisture: '80%',
      growRate: 'Prolific',
      harvest: '5 days',
      ec: '1.4 mS/cm',
      yield: '+18%',
      status: 'Thriving',
      desc: 'Highly aggressive root systems contained in separate aerated channels to avoid crossover. Harvested continuously.'
    },
    {
      id: 'cucumber',
      name: 'English Cucumber',
      emoji: '🥒',
      moisture: '88%',
      growRate: 'Rapid',
      harvest: '15 days',
      ec: '2.2 mS/cm',
      yield: '+28%',
      status: 'Fruiting',
      desc: 'Heavy transpiration rate requires elevated relative humidity controls. Suspended wire supports enable vertical climbing.'
    },
    {
      id: 'broccoli',
      name: 'Broccoli Microgreens',
      emoji: '🌱',
      moisture: '92%',
      growRate: 'Accelerated',
      harvest: '3 days',
      ec: '1.0 mS/cm',
      yield: '+10%',
      status: 'Sprouting',
      desc: 'High-density sprouting grown in 10-day short cycles on organic coconut coir mats. Highly loaded with antioxidants.'
    }
  ];

  // 2. Outdoor Farmland Telemetry Database
  const farmlandCrops = [
    {
      id: 'wheat-field',
      name: 'Wheat Field (Field A)',
      emoji: '🌾',
      moisture: '64%',
      growRate: 'Normal',
      harvest: '45 days',
      ec: 'N/A (Soil)',
      yield: '+18%',
      status: 'Sprouting',
      desc: 'Sprawling acres of winter wheat. Monitored via localized moisture probes and autonomous drone surveying.'
    },
    {
      id: 'barn-storage',
      name: 'Barn Storage Silo',
      emoji: '🛖',
      moisture: '45% RH',
      growRate: 'Stable',
      harvest: 'Dry Stock',
      ec: 'N/A',
      yield: '88% Cap',
      status: 'Nominal',
      desc: 'Central sorting warehouse and automated steel silo. Climate controls prevent moisture ingress and spoilage.'
    },
    {
      id: 'vegetable-field',
      name: 'Vegetable Field (Field B)',
      emoji: '🥕',
      moisture: '72%',
      growRate: 'Rapid',
      harvest: '18 days',
      ec: 'N/A (Soil)',
      yield: '+22%',
      status: 'Maturing',
      desc: 'Soil cultivation bed growing organic carrots and root crops. Overhead sprinkler system provides precise irrigation.'
    },
    {
      id: 'wind-turbine',
      name: 'Eco Wind Turbine',
      emoji: '🌀',
      moisture: 'Wind: 18km/h',
      growRate: 'Active',
      harvest: 'Power: 4.8 kW',
      ec: 'Grid: Nom',
      yield: '100% Eff',
      status: 'Generating',
      desc: 'Direct-drive wind turbine generating clean electricity for irrigation pumps, soil sensor grids, and lighting hubs.'
    },
    {
      id: 'autonomous-tractor',
      name: 'Autonomous Tractor 01',
      emoji: '🚜',
      moisture: 'Fuel: 94%',
      growRate: 'Active Paths',
      harvest: 'Speed: 4 km/h',
      ec: 'GPS: Locked',
      yield: 'Scanning',
      status: 'Nominal',
      desc: 'Solar-assisted autonomous tractor patrolling crop borders. Performs weeding, seedbed prep, and infrared crop health checks.'
    },
    {
      id: 'overhead-irrigation',
      name: 'Smart Sprinkler Line',
      emoji: '🌧',
      moisture: 'Flow: 12L/min',
      growRate: 'Operating',
      harvest: 'Water: Rain',
      ec: 'Pump: Active',
      yield: 'Active',
      status: 'Nominal',
      desc: 'Low-evaporation linear spray bar. Synchronized with soil sensors to spray only when soil moisture falls below 65%.'
    },
    {
      id: 'rooftop-farm',
      name: 'Rooftop Garden Hub',
      emoji: '🏙️',
      moisture: '76%',
      growRate: 'Steady',
      harvest: '10 days',
      ec: '1.5 mS/cm',
      yield: '+20%',
      status: 'Thriving',
      desc: 'Elevated rooftop planters growing leafy greens and herbs above the processing building. Ventilation fans regulate airflow and solar arrays offset power draw.'
    }
  ];

  // ─── Theme Colors Mapping ───
  const themeColorsMap = {
    'light': { bg: 0xe2e6e2, dome: 0x2e7d32, grid: 0xbbccbb, light: 0x333333, accent: 0x2e7d32 },
    'dark': { bg: 0x050b07, dome: 0x4caf50, grid: 0x144d18, light: 0x8fa88f, accent: 0x4caf50 },
    'glassmorphic': { bg: 0xebf3ef, dome: 0x1e824c, grid: 0xbbddcc, light: 0x3b5a40, accent: 0x1e824c },
    'cyber': { bg: 0x06050b, dome: 0xff007f, grid: 0x221030, light: 0x00ffcc, accent: 0xff007f },
    'tech': { bg: 0x0b0f19, dome: 0x0ea5e9, grid: 0x1e293b, light: 0x38bdf8, accent: 0x0ea5e9 },
    'low-contrast': { bg: 0xf2ede4, dome: 0x5e725e, grid: 0xd4cbbd, light: 0x4a473f, accent: 0x5e725e },
    'high-contrast': { bg: 0x000000, dome: 0xffffff, grid: 0x333333, light: 0xffffff, accent: 0xffff00 },
    'sunset': { bg: 0x1b0a22, dome: 0xff8b6a, grid: 0x4c2842, light: 0xffd3b6, accent: 0xff8b6a },
    'nexus': { bg: 0x11100e, dome: 0xe0a96d, grid: 0x332e29, light: 0xe8d8c8, accent: 0xe0a96d }
  };

  // ─── Outdoor Farmland Theme Colors Mapping ───
  const farmlandColorsMap = {
    'light': { grass: 0x55aa44, dirt: 0x5a483a, barn: 0xc0392b, foliage: 0x2e7d32, trunk: 0x795548, wheat: 0xecc94b, sky: 0xaaddee },
    'dark': { grass: 0x1b5e20, dirt: 0x3d2b1f, barn: 0x962d22, foliage: 0x144d18, trunk: 0x5d4037, wheat: 0xd69e2e, sky: 0x050b07 },
    'glassmorphic': { grass: 0x34c759, dirt: 0x5d4037, barn: 0xe74c3c, foliage: 0x27ae60, trunk: 0x8d6e63, wheat: 0xf6e05e, sky: 0xebf3ef },
    'cyber': { grass: 0x0a0618, dirt: 0x221030, barn: 0xff007f, foliage: 0x00ffcc, trunk: 0x78709e, wheat: 0xffff00, sky: 0x06050b },
    'tech': { grass: 0x0b132b, dirt: 0x1c2541, barn: 0x0284c7, foliage: 0x00bcff, trunk: 0x1e293b, wheat: 0x38bdf8, sky: 0x0b0f19 },
    'low-contrast': { grass: 0x7a8f7a, dirt: 0x8d8376, barn: 0xa66c6c, foliage: 0x5e725e, trunk: 0x9c8f80, wheat: 0xd4c090, sky: 0xf2ede4 },
    'high-contrast': { grass: 0x000000, dirt: 0x111111, barn: 0xffffff, foliage: 0x00ff00, trunk: 0xffffff, wheat: 0xffff00, sky: 0x000000 },
    'sunset': { grass: 0x3a152d, dirt: 0x4c2842, barn: 0xe65c00, foliage: 0xb52b65, trunk: 0x5d2b1f, wheat: 0xffaa66, sky: 0x1b0a22 },
    'nexus': { grass: 0x26211c, dirt: 0x3d3025, barn: 0xe0a96d, foliage: 0x73675f, trunk: 0x473d36, wheat: 0xf5c493, sky: 0x11100e }
  };

  // ─── Initialization ───
  function init() {
    const container = document.getElementById('canvas3d');
    if (!container) return;

    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050b07, 0.025);

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 12, 22);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't look under floor
    controls.minDistance = 4;
    controls.maxDistance = 45;
    controls.target.set(0, 1, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Groups
    biodomeGroup = new THREE.Group();
    farmlandGroup = new THREE.Group();
    scene.add(biodomeGroup);
    scene.add(farmlandGroup);

    // Build Sub-Scenes
    buildCommonEnvironment();
    buildBiodomeScene();
    buildFarmlandScene();

    setupLighting();
    setupInteraction();

    // Default mode setup
    setMode('biodome');

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    
    // UI Button bindings
    document.getElementById('btnHome').addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    // Tab bindings
    const tabBiodome = document.getElementById('tabBiodome');
    const tabFarmland = document.getElementById('tabFarmland');
    
    tabBiodome.addEventListener('click', () => {
      tabBiodome.classList.add('active');
      tabFarmland.classList.remove('active');
      setMode('biodome');
    });

    tabFarmland.addEventListener('click', () => {
      tabFarmland.classList.add('active');
      tabBiodome.classList.remove('active');
      setMode('farmland');
    });
    
    // Biodome controls binding
    const btnDome = document.getElementById('btnDome');
    btnDome.addEventListener('click', () => {
      domeOn = !domeOn;
      domeFrame.visible = domeOn;
      domeGlass.visible = domeOn;
      btnDome.classList.toggle('active', domeOn);
      btnDome.textContent = `🌐 Glass Dome: ${domeOn ? 'ON' : 'OFF'}`;
    });

    const btnLights = document.getElementById('btnLights');
    btnLights.addEventListener('click', () => {
      growLightsOn = !growLightsOn;
      btnLights.classList.toggle('active', growLightsOn);
      btnLights.textContent = `💡 Grow Lights: ${growLightsOn ? 'ON' : 'OFF'}`;
      
      // Toggle spotlight/LED components
      growLightsGroup.traverse((child) => {
        if (child instanceof THREE.SpotLight || child instanceof THREE.PointLight) {
          child.intensity = growLightsOn ? child.userData.baseIntensity : 0.0;
        }
        if (child.userData.isGlowCone) {
          child.visible = growLightsOn;
        }
        if (child.userData.isLEDStrip) {
          child.material.emissiveIntensity = growLightsOn ? 1.0 : 0.05;
        }
      });
    });

    // Farmland controls binding
    const btnIrrigation = document.getElementById('btnIrrigation');
    btnIrrigation.addEventListener('click', () => {
      irrigationOn = !irrigationOn;
      btnIrrigation.classList.toggle('active', irrigationOn);
      btnIrrigation.textContent = `🌧️ Irrigation: ${irrigationOn ? 'ON' : 'OFF'}`;
    });

    const btnWeather = document.getElementById('btnWeather');
    btnWeather.addEventListener('click', () => {
      weatherState = weatherState === 'sunny' ? 'stormy' : 'sunny';
      btnWeather.classList.toggle('active', weatherState === 'stormy');
      btnWeather.textContent = weatherState === 'sunny' ? '☀️ Weather: SUNNY' : '⛈️ Weather: STORMY';
      
      // Trigger instant weather lighting sync
      const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
      apply3DTheme(initialTheme);
    });

    // Rotate binding
    const btnRotate = document.getElementById('btnRotate');
    btnRotate.addEventListener('click', () => {
      controls.autoRotate = !controls.autoRotate;
      btnRotate.classList.toggle('active', controls.autoRotate);
      btnRotate.textContent = `🔄 Auto Rotate: ${controls.autoRotate ? 'ON' : 'OFF'}`;
    });

    // Theme observation
    const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
    apply3DTheme(initialTheme);

    const themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const currentTheme = document.documentElement.getAttribute('data-theme');
          apply3DTheme(currentTheme);
        }
      });
    });
    themeObserver.observe(document.documentElement, { attributes: true });

    // Hide Loader
    setTimeout(() => {
      const loader = document.getElementById('loaderOverlay');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
      }
    }, 800);

    // Start render loop
    animate();
  }

  // ─── Mode Switching Logic ───
  function setMode(mode) {
    activeMode = mode;
    deselectCrop();

    // Toggle parent groups visibility
    biodomeGroup.visible = (mode === 'biodome');
    farmlandGroup.visible = (mode === 'farmland');

    // Toggle control button displays
    document.querySelectorAll('.biodome-ctrl').forEach(el => {
      el.style.display = (mode === 'biodome') ? 'inline-flex' : 'none';
    });
    document.querySelectorAll('.farmland-ctrl').forEach(el => {
      el.style.display = (mode === 'farmland') ? 'inline-flex' : 'none';
    });

    // Update Titles and Instruction Overlay DOMs
    const titleText = document.getElementById('hudTitleText');
    const subTitleText = document.getElementById('hudSubTitleText');
    const instructionsCard = document.querySelector('.hud-instructions-card');
    
    if (mode === 'biodome') {
      if (titleText) titleText.textContent = 'FarmSpherica Smart-Dome';
      if (subTitleText) subTitleText.textContent = 'Precision Hydroponic Telemetry';
      if (instructionsCard) {
        instructionsCard.innerHTML = `
          <div class="instructions-title">💡 Controls</div>
          <ul class="instructions-list">
            <li><strong>Drag</strong> to rotate camera viewport</li>
            <li><strong>Scroll</strong> or pinch to zoom</li>
            <li><strong>Right-click drag</strong> to pan</li>
            <li><strong>Click trays</strong> to open detailed telemetry</li>
            <li>Toggle LED / dome elements below</li>
          </ul>
        `;
      }
      
      // Reset targets
      targetPivot.set(0, 1, 0);
      camera.position.set(0, 12, 22);
    } else {
      if (titleText) titleText.textContent = 'FarmSpherica Farmland';
      if (subTitleText) subTitleText.textContent = 'Outdoor Agro-Field Simulation';
      if (instructionsCard) {
        instructionsCard.innerHTML = `
          <div class="instructions-title">💡 Controls</div>
          <ul class="instructions-list">
            <li><strong>Drag</strong> to rotate farm layout</li>
            <li><strong>Scroll</strong> to zoom out for big view</li>
            <li><strong>Right-click drag</strong> to pan scene</li>
            <li><strong>Click fields/structures</strong> for sensor stats</li>
            <li>Toggle irrigation & weather below</li>
          </ul>
        `;
      }
      
      // Reposition camera for broader outdoor view
      targetPivot.set(0, 0, 0);
      camera.position.set(0, 16, 28);
    }

    // Rebuild active interaction objects list
    interactiveObjects.length = 0;
    
    if (mode === 'biodome') {
      biodomeGroup.traverse(child => {
        if (child.userData && child.userData.cropIndex !== undefined && child.userData.isClickTarget) {
          interactiveObjects.push(child);
        }
      });
    } else {
      farmlandGroup.traverse(child => {
        if (child.userData && child.userData.cropIndex !== undefined && child.userData.isClickTarget) {
          interactiveObjects.push(child);
        }
      });
    }

    controls.target.copy(targetPivot);
    controls.update();

    // Reapply theme colors to sync materials
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    apply3DTheme(currentTheme);
  }

  // ─── Common Environment ───
  function buildCommonEnvironment() {
    // Shared Selection Highlight Box
    const hlGeo = new THREE.BoxGeometry(1.9, 0.8, 6.2);
    const hlMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    selectionHighlight = new THREE.Mesh(hlGeo, hlMat);
    selectionHighlight.visible = false;
    scene.add(selectionHighlight);

    // Initial Grid Helper (will be updated dynamically by theme)
    gridHelper = new THREE.GridHelper(30, 30, 0x00ff66, 0x144d18);
    gridHelper.position.y = 0.01;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.2;
    scene.add(gridHelper);
  }

  // ─── Lighting Setup ───
  function setupLighting() {
    // Ambient
    ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    // Sun Simulator
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(15, 25, 12);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);
  }

  // ─── Theme Adaptation ───
  function apply3DTheme(themeName) {
    const colors = themeColorsMap[themeName] || themeColorsMap['dark'];
    const landColors = farmlandColorsMap[themeName] || farmlandColorsMap['dark'];

    // Update clear color and fog
    renderer.setClearColor(colors.bg, 1);
    scene.fog.color.setHex(colors.bg);

    // Handle weather lighting adjustments in farmland
    if (activeMode === 'farmland' && weatherState === 'stormy') {
      // Stormy weather lighting overrides
      ambientLight.color.setHex(0x1a2238);
      ambientLight.intensity = 0.15;
      directionalLight.color.setHex(0x2d3a54);
      directionalLight.intensity = 0.15;
      scene.fog.color.setHex(themeName === 'light' ? 0x6e7a8f : 0x0c0f16);
      renderer.setClearColor(themeName === 'light' ? 0x6e7a8f : 0x0c0f16);
    } else {
      // Normal weather lighting
      ambientLight.color.setHex(colors.light);
      ambientLight.intensity = activeMode === 'biodome' ? 0.35 : 0.45;
      directionalLight.color.setHex(0xffffff);
      directionalLight.intensity = activeMode === 'biodome' ? 0.8 : 0.95;
    }

    // Update Grid Helper
    scene.remove(gridHelper);
    gridHelper = new THREE.GridHelper(30, 30, colors.accent, colors.grid);
    gridHelper.position.y = 0.01;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = themeName === 'high-contrast' ? 0.6 : 0.2;
    scene.add(gridHelper);

    // Update Selection wireframe color
    selectionHighlight.material.color.setHex(colors.accent);

    // Apply colors to Biodome structures
    domeFrame.material.color.setHex(colors.dome);

    // Apply Farmland specific material colors
    farmTerrain.material.color.setHex(landColors.grass);
    
    // Update Farmland models by searching child materials
    farmlandGroup.traverse((child) => {
      if (child.userData) {
        if (child.userData.isBarnBody) {
          child.material.color.setHex(landColors.barn);
        }
        if (child.userData.isFoliage) {
          child.material.color.setHex(landColors.foliage);
        }
        if (child.userData.isTrunk) {
          child.material.color.setHex(landColors.trunk);
        }
        if (child.userData.isWheatStalk) {
          child.material.color.setHex(landColors.wheat);
        }
        if (child.userData.isDirtRow) {
          child.material.color.setHex(landColors.dirt);
        }
        if (child.userData.isSiloDome && themeName === 'nexus') {
          child.material.color.setHex(0x8c6d4f); // antique copper
        } else if (child.userData.isSiloDome) {
          child.material.color.setHex(0xa9b0b3); // silver dome
        }
        if (child.userData.isCloud) {
          if (weatherState === 'stormy') {
            child.material.color.setHex(0x3a3d45); // dark storm clouds
          } else {
            child.material.color.setHex(0xffffff); // fluffy white clouds
          }
        }
        if (child.userData.isRoofGreenery) {
          child.material.color.setHex(landColors.foliage);
        }
      }
    });

    // Sync HTML badge color
    const badge = document.getElementById('cropStatus');
    if (badge) {
      badge.style.borderColor = `var(--accent)`;
      badge.style.color = `var(--accent)`;
    }
  }

  // ════════════════════════════════════════
  // ─── 1. BUILD BIODOME SCENE (MODEL 1) ───
  // ════════════════════════════════════════
  
  function buildBiodomeScene() {
    // Base platform
    const baseGeo = new THREE.CylinderGeometry(14, 14.5, 0.4, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1f2124,
      roughness: 0.5,
      metalness: 0.7
    });
    const basePlatform = new THREE.Mesh(baseGeo, baseMat);
    basePlatform.position.y = -0.2;
    basePlatform.receiveShadow = true;
    biodomeGroup.add(basePlatform);

    // Dome frames & glass
    const domeRadius = 14;
    const frameGeo = new THREE.SphereGeometry(domeRadius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const frameMat = new THREE.MeshBasicMaterial({
      color: 0x4caf50,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    domeFrame = new THREE.Mesh(frameGeo, frameMat);
    biodomeGroup.add(domeFrame);

    const glassGeo = new THREE.SphereGeometry(domeRadius - 0.05, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.08,
      roughness: 0.1,
      metalness: 0.9,
      side: THREE.DoubleSide
    });
    domeGlass = new THREE.Mesh(glassGeo, glassMat);
    biodomeGroup.add(domeGlass);

    // Grow lights group and crops channels group
    growLightsGroup = new THREE.Group();
    cropsGroup = new THREE.Group();
    biodomeGroup.add(growLightsGroup);
    biodomeGroup.add(cropsGroup);

    // Coordinates for the 6 rows of trays
    const xCoords = [-6.25, -3.75, -1.25, 1.25, 3.75, 6.25];
    const trayDepth = 5.6;

    // Build center walk path
    const walkwayGeo = new THREE.BoxGeometry(2, 0.05, 12);
    const walkwayMat = new THREE.MeshStandardMaterial({
      color: 0x2e3033,
      roughness: 0.7,
      metalness: 0.6
    });
    const centerWalkway = new THREE.Mesh(walkwayGeo, walkwayMat);
    centerWalkway.position.set(0, 0.025, 0);
    biodomeGroup.add(centerWalkway);

    biodomeCrops.forEach((crop, index) => {
      const x = xCoords[index];
      
      const channelGroup = new THREE.Group();
      channelGroup.position.set(x, 0, 0);
      channelGroup.userData = { cropIndex: index, cropId: crop.id };
      cropsGroup.add(channelGroup);

      // Hydroponic Tray
      const trayGeo = new THREE.BoxGeometry(1.6, 0.4, trayDepth);
      const trayMat = new THREE.MeshStandardMaterial({
        color: 0x3c3f41,
        roughness: 0.3,
        metalness: 0.8
      });
      const trayMesh = new THREE.Mesh(trayGeo, trayMat);
      trayMesh.position.y = 0.2;
      trayMesh.castShadow = true;
      trayMesh.receiveShadow = true;
      channelGroup.add(trayMesh);

      // Water/Nutrient solution
      const waterGeo = new THREE.BoxGeometry(1.5, 0.05, trayDepth - 0.1);
      const waterMat = new THREE.MeshPhongMaterial({
        color: 0x00aacc,
        transparent: true,
        opacity: 0.55,
        shininess: 90
      });
      const waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.position.set(0, 0.38, 0);
      channelGroup.add(waterMesh);

      // Overhead posts
      const supportGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.2);
      const supportMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
      
      const postBack = new THREE.Mesh(supportGeo, supportMat);
      postBack.position.set(0, 1.6, -(trayDepth/2 - 0.1));
      channelGroup.add(postBack);
      
      const postFront = new THREE.Mesh(supportGeo, supportMat);
      postFront.position.set(0, 1.6, (trayDepth/2 - 0.1));
      channelGroup.add(postFront);

      // LED Bar
      const barGeo = new THREE.BoxGeometry(0.2, 0.1, trayDepth);
      const barMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
      const lightBar = new THREE.Mesh(barGeo, barMat);
      lightBar.position.set(0, 3.1, 0);
      channelGroup.add(lightBar);

      // LED strip glowing
      const ledGeo = new THREE.BoxGeometry(0.12, 0.02, trayDepth - 0.2);
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0xff33cc,
        emissive: 0xff33cc,
        emissiveIntensity: 1.0,
        roughness: 0.2
      });
      const ledStrip = new THREE.Mesh(ledGeo, ledMat);
      ledStrip.position.set(0, 3.04, 0);
      ledStrip.userData = { isLEDStrip: true };
      channelGroup.add(ledStrip);

      // Spot light
      const spotlight = new THREE.SpotLight(0xff33aa, 1.8, 8, Math.PI / 5, 0.6, 1.0);
      spotlight.position.set(0, 3.0, 0);
      spotlight.target = trayMesh;
      spotlight.castShadow = true;
      spotlight.shadow.mapSize.width = 512;
      spotlight.shadow.mapSize.height = 512;
      spotlight.userData = { baseIntensity: 1.8 };
      channelGroup.add(spotlight);
      growLightsGroup.add(spotlight);

      // Visual cone overlay
      const coneGeo = new THREE.CylinderGeometry(0.12, 0.9, 2.7, 16, 1, true);
      coneGeo.translate(0, -1.35, 0);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xff22bb,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const lightCone = new THREE.Mesh(coneGeo, coneMat);
      lightCone.position.set(0, 3.0, 0);
      lightCone.userData = { isGlowCone: true };
      channelGroup.add(lightCone);
      growLightsGroup.add(lightCone);

      // Grow plants
      const numPlants = 5;
      const zStep = (trayDepth - 1.2) / (numPlants - 1);
      const zStart = -(trayDepth - 1.2) / 2;

      for (let p = 0; p < numPlants; p++) {
        const pz = zStart + p * zStep;
        let plantMesh;
        
        switch (crop.id) {
          case 'lettuce': plantMesh = createLettuce(); break;
          case 'basil': plantMesh = createBasil(); break;
          case 'tomatoes': plantMesh = createTomatoes(); break;
          case 'mint': plantMesh = createMint(); break;
          case 'cucumber': plantMesh = createCucumber(); break;
          case 'broccoli': plantMesh = createBroccoliGrid(); break;
          default: plantMesh = createLettuce();
        }

        if (crop.id !== 'broccoli') {
          plantMesh.position.set((Math.random() - 0.5) * 0.1, 0.38, pz);
          plantMesh.rotation.y = Math.random() * Math.PI * 2;
          const scaleOffset = 0.85 + Math.random() * 0.3;
          plantMesh.scale.multiplyScalar(scaleOffset);
        } else {
          plantMesh.position.set(0, 0.38, 0);
        }

        channelGroup.add(plantMesh);
      }

      // Invisible Raycast Box
      const interactGeo = new THREE.BoxGeometry(2.0, 3.2, trayDepth + 0.2);
      const interactMat = new THREE.MeshBasicMaterial({ visible: false });
      const interactVolume = new THREE.Mesh(interactGeo, interactMat);
      interactVolume.position.set(0, 1.6, 0);
      interactVolume.userData = { cropIndex: index, isClickTarget: true };
      channelGroup.add(interactVolume);
    });
  }

  // ══════════════════════════════════════════
  // ─── 2. BUILD FARMLAND SCENE (MODEL 2) ───
  // ══════════════════════════════════════════
  
  function buildFarmlandScene() {
    // Base landscape terrain (Plane with perturbed vertices for rolling hills)
    const size = 32;
    const terrainGeo = new THREE.PlaneGeometry(30, 30, size, size);
    terrainGeo.rotateX(-Math.PI / 2);

    // Apply soft procedural hill displacement
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      
      // mathematical waves representing soft landscape contours
      let y = Math.sin(x * 0.18) * Math.cos(z * 0.18) * 0.8;
      // Add secondary detail layer
      y += Math.sin(x * 0.4) * Math.sin(z * 0.4) * 0.25;
      
      // Flatten the paths where buildings/fields are located
      if (Math.abs(x) < 8 && Math.abs(z) < 5) {
        y *= 0.2; // flatten central fields
      }
      if (x < -6 && z < -4) {
        y = 0; // flatten barn floor
      }
      if (x > 6 && z < -5) {
        y = 0; // flatten windmill floor
      }
      if (x > 5 && z > 7) {
        y = 0; // flatten rooftop farm building floor
      }

      pos.setY(i, y);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x55aa44,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true
    });
    farmTerrain = new THREE.Mesh(terrainGeo, terrainMat);
    farmTerrain.receiveShadow = true;
    farmlandGroup.add(farmTerrain);

    // Add visual crop fields
    buildFarmlandFields();

    // Red Barn and Silo
    buildBarnModel();

    // Windmill Turbine
    buildWindmillModel();

    // Low-poly Trees
    buildFarmlandTrees();

    // Clouds Group
    buildClouds();

    // Autonomous Tractor
    buildTractorModel();

    // Overhead Sprinkler Irrigation pipe
    buildSprinklerModel();

    // Rooftop Farming Building
    buildRooftopFarmModel();
  }

  // Helper: Farmland Fields Layout
  function buildFarmlandFields() {
    // 1. Wheat Field (Field A, left side)
    const fieldAGroup = new THREE.Group();
    fieldAGroup.position.set(-4.5, 0.05, 0);
    farmlandGroup.add(fieldAGroup);

    // Brown soil beds
    const soilRowGeo = new THREE.BoxGeometry(3.6, 0.05, 7.5);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x5a483a, roughness: 0.9 });
    const soilA = new THREE.Mesh(soilRowGeo, soilMat);
    soilA.userData = { isDirtRow: true };
    soilA.receiveShadow = true;
    fieldAGroup.add(soilA);

    // Dense grid of wheat stalks
    const wheatGeo = new THREE.ConeGeometry(0.035, 0.42, 4);
    const wheatMat = new THREE.MeshLambertMaterial({ color: 0xecc94b });
    const stalksCount = 48;
    for (let i = 0; i < stalksCount; i++) {
      const wheat = new THREE.Mesh(wheatGeo, wheatMat);
      const wx = (Math.random() - 0.5) * 3.2;
      const wz = (Math.random() - 0.5) * 7.0;
      wheat.position.set(wx, 0.22, wz);
      wheat.rotation.y = Math.random() * Math.PI;
      wheat.rotation.x = (Math.random() - 0.5) * 0.15; // slight wind lean
      wheat.userData = { isWheatStalk: true };
      fieldAGroup.add(wheat);
    }

    // Interactive target box for Wheat Field
    const targetA = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 1.2, 8.0),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    targetA.position.set(0, 0.6, 0);
    targetA.userData = { cropIndex: 0, isClickTarget: true };
    fieldAGroup.add(targetA);

    // 2. Vegetable Field (Field B, right side)
    const fieldBGroup = new THREE.Group();
    fieldBGroup.position.set(4.5, 0.05, 0);
    farmlandGroup.add(fieldBGroup);

    const soilB = new THREE.Mesh(soilRowGeo, soilMat);
    soilB.userData = { isDirtRow: true };
    soilB.receiveShadow = true;
    fieldBGroup.add(soilB);

    // Dense rows of carrots (small orange cones with tiny green leafy tops)
    const carrotGeo = new THREE.ConeGeometry(0.04, 0.18, 5);
    const carrotMat = new THREE.MeshLambertMaterial({ color: 0xff7a00 });
    const leafGeo = new THREE.DodecahedronGeometry(0.04, 0);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x27ae60 });

    const carrotCount = 28;
    for (let i = 0; i < carrotCount; i++) {
      const carrotUnit = new THREE.Group();
      
      const cone = new THREE.Mesh(carrotGeo, carrotMat);
      cone.rotation.x = Math.PI; // upside down cone representing carrot in soil
      cone.position.y = 0.04;
      carrotUnit.add(cone);

      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 0.12;
      leaf.userData = { isFoliage: true };
      carrotUnit.add(leaf);

      const cx = (index => {
        // Arrange in 3 clean parallel rows inside Field B
        const row = index % 3;
        return -1.0 + row * 1.0 + (Math.random() - 0.5) * 0.15;
      })(i);
      
      const cz = -3.2 + (i / carrotCount) * 6.4 + (Math.random() - 0.5) * 0.15;
      carrotUnit.position.set(cx, 0.01, cz);
      fieldBGroup.add(carrotUnit);
    }

    // Interactive target box for Vegetable Field
    const targetB = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 1.2, 8.0),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    targetB.position.set(0, 0.6, 0);
    targetB.userData = { cropIndex: 2, isClickTarget: true };
    fieldBGroup.add(targetB);
  }

  // Helper: Red Barn and Silo
  function buildBarnModel() {
    const barnGroup = new THREE.Group();
    barnGroup.position.set(-11.5, 0, -5.5);
    barnGroup.rotation.y = Math.PI / 4;
    farmlandGroup.add(barnGroup);

    // Barn main building structure (Red Box)
    const bodyGeo = new THREE.BoxGeometry(2.8, 2.0, 3.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.6 });
    const barnBody = new THREE.Mesh(bodyGeo, bodyMat);
    barnBody.position.y = 1.0;
    barnBody.userData = { isBarnBody: true };
    barnBody.castShadow = true;
    barnBody.receiveShadow = true;
    barnGroup.add(barnBody);

    // Barn roof (sloped sides using rotated boxes)
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xeaeaea, roughness: 0.4, metalness: 0.3 });
    const roofL = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 4.0), roofMat);
    roofL.position.set(-0.7, 2.3, 0);
    roofL.rotation.z = 0.55;
    roofL.castShadow = true;
    barnGroup.add(roofL);

    const roofR = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 4.0), roofMat);
    roofR.position.set(0.7, 2.3, 0);
    roofR.rotation.z = -0.55;
    roofR.castShadow = true;
    barnGroup.add(roofR);

    // Barn white trim door cross lines
    const doorGeo = new THREE.BoxGeometry(0.04, 1.2, 0.9);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const barnDoor = new THREE.Mesh(doorGeo, doorMat);
    barnDoor.position.set(1.41, 0.6, 0); // on front side face
    barnDoor.rotation.y = Math.PI / 2;
    barnGroup.add(barnDoor);

    // Circular Grain Silo adjacent
    const siloGroup = new THREE.Group();
    siloGroup.position.set(-1.8, 0, -0.6);
    
    // Silo tower (grey metallic cylinder)
    const siloCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 2.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x8e9499, metalness: 0.8, roughness: 0.25 })
    );
    siloCyl.position.y = 1.4;
    siloCyl.castShadow = true;
    siloGroup.add(siloCyl);

    // Silo Dome Cap
    const siloDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xa9b0b3, metalness: 0.7, roughness: 0.2 })
    );
    siloDome.position.y = 2.8;
    siloDome.userData = { isSiloDome: true };
    siloDome.castShadow = true;
    siloGroup.add(siloDome);

    barnGroup.add(siloGroup);

    // Interactive target box for Barn Area
    const targetBarn = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 3.2, 5.0),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    targetBarn.position.set(-0.6, 1.6, 0);
    targetBarn.userData = { cropIndex: 1, isClickTarget: true };
    barnGroup.add(targetBarn);
  }

  // Helper: Windmill / Wind Turbine
  function buildWindmillModel() {
    const windmillGroup = new THREE.Group();
    windmillGroup.position.set(11.5, 0, -6.5);
    farmlandGroup.add(windmillGroup);

    // Tower shaft
    const towerGeo = new THREE.CylinderGeometry(0.08, 0.24, 5.2, 12);
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4, metalness: 0.2 });
    const tower = new THREE.Mesh(towerGeo, whiteMat);
    tower.position.y = 2.6;
    tower.castShadow = true;
    windmillGroup.add(tower);

    // Rotor hub casing
    const hubCasing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8),
      whiteMat
    );
    hubCasing.rotation.x = Math.PI / 2;
    hubCasing.position.set(0, 5.2, 0.15);
    windmillGroup.add(hubCasing);

    // Rotor nose sphere
    const rotorHub = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.5 })
    );
    rotorHub.position.set(0, 5.2, 0.4);
    windmillGroup.add(rotorHub);

    // Spinning blades group
    windmillBlades = new THREE.Group();
    windmillBlades.position.set(0, 5.2, 0.42);
    windmillGroup.add(windmillBlades);

    // Add 3 blades spaced by 120 deg
    const bladeGeo = new THREE.BoxGeometry(0.1, 2.2, 0.02);
    bladeGeo.translate(0, 1.1, 0); // shift pivot to root
    const greyMat = new THREE.MeshStandardMaterial({ color: 0xe5e5e5, roughness: 0.5 });
    
    for (let b = 0; b < 3; b++) {
      const blade = new THREE.Mesh(bladeGeo, greyMat);
      blade.rotation.z = b * (Math.PI * 2 / 3);
      windmillBlades.add(blade);
    }

    // Interactive target box for Windmill
    const targetWindmill = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 7.5, 3.5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    targetWindmill.position.set(0, 3.75, 0);
    targetWindmill.userData = { cropIndex: 3, isClickTarget: true };
    windmillGroup.add(targetWindmill);
  }

  // Helper: Low-poly Trees
  function buildFarmlandTrees() {
    // We will place 5 simple trees on the perimeter coordinates
    const treeCoords = [
      { x: -11.5, z: 8.5 },
      { x: -12.5, z: 2.0 },
      { x: 12.0, z: 7.5 },
      { x: 12.5, z: 0.5 },
      { x: 11.0, z: -11.0 }
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.08, 0.14, 1.2, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.95 });
    trunkMat.userData = { isTrunk: true };

    const leafGeo = new THREE.DodecahedronGeometry(0.65, 0);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8, flatShading: true });
    leafMat.userData = { isFoliage: true };

    treeCoords.forEach(pos => {
      const tree = new THREE.Group();
      tree.position.set(pos.x, 0, pos.z);
      farmlandGroup.add(tree);

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.6;
      trunk.castShadow = true;
      tree.add(trunk);

      // Low poly puffy foliage canopy (3 overlapping offset dodecahedrons)
      const canopy = new THREE.Group();
      canopy.position.y = 1.4;
      
      const c1 = new THREE.Mesh(leafGeo, leafMat);
      c1.castShadow = true;
      canopy.add(c1);

      const c2 = new THREE.Mesh(leafGeo, leafMat);
      c2.position.set(0.2, 0.35, -0.15);
      c2.scale.set(0.85, 0.85, 0.85);
      canopy.add(c2);

      const c3 = new THREE.Mesh(leafGeo, leafMat);
      c3.position.set(-0.25, 0.25, 0.2);
      c3.scale.set(0.8, 0.8, 0.8);
      canopy.add(c3);

      tree.add(canopy);

      // Random scale offset
      tree.scale.multiplyScalar(0.85 + Math.random() * 0.3);
    });
  }

  // Helper: Low-poly Clouds Group
  function buildClouds() {
    cloudsGroup = new THREE.Group();
    farmlandGroup.add(cloudsGroup);

    const cloudCount = 3;
    const cloudGeo = new THREE.SphereGeometry(1.0, 8, 8);
    
    // We will place clouds at Y = 9.0 to 12.0
    for (let c = 0; c < cloudCount; c++) {
      const cloud = new THREE.Group();
      
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85
      });
      mat.userData = { isCloud: true };

      // Cluster of 4 spheres
      const s1 = new THREE.Mesh(cloudGeo, mat);
      cloud.add(s1);

      const s2 = new THREE.Mesh(cloudGeo, mat);
      s2.position.set(1.2, -0.25, 0.1);
      s2.scale.set(0.75, 0.75, 0.75);
      cloud.add(s2);

      const s3 = new THREE.Mesh(cloudGeo, mat);
      s3.position.set(-1.0, -0.15, -0.2);
      s3.scale.set(0.7, 0.7, 0.7);
      cloud.add(s3);

      const s4 = new THREE.Mesh(cloudGeo, mat);
      s4.position.set(0.4, 0.3, -0.1);
      s4.scale.set(0.85, 0.85, 0.85);
      cloud.add(s4);

      // Distribute
      cloud.position.set(
        -12 + c * 11 + (Math.random() - 0.5) * 3,
        9.0 + Math.random() * 2.0,
        -10 + Math.random() * 14
      );
      
      cloud.scale.set(1.4, 0.8, 1.1); // flatten them slightly
      cloudsGroup.add(cloud);
    }
  }

  // Helper: Autonomous Tractor
  function buildTractorModel() {
    tractor = new THREE.Group();
    // Start position coordinates
    tractor.position.set(0, 0.35, 7.5);
    farmlandGroup.add(tractor);

    // Chassis Box (Green)
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.4 });
    baseMat.userData = { isBarnBody: true }; // adapt color to green/barn theme
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 1.2), baseMat);
    chassis.castShadow = true;
    tractor.add(chassis);

    // Cab (Black Glass and frames)
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.5, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 })
    );
    cab.position.set(0, 0.4, -0.2);
    cab.castShadow = true;
    tractor.add(cab);

    // Wheels (4 cylinders rotating on X-axis)
    const wheelGeoBig = new THREE.CylinderGeometry(0.32, 0.32, 0.18, 12);
    wheelGeoBig.rotateZ(Math.PI / 2);
    const wheelGeoSmall = new THREE.CylinderGeometry(0.2, 0.2, 0.14, 12);
    wheelGeoSmall.rotateZ(Math.PI / 2);

    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.9 });

    // Rear big wheels
    const wheelRL = new THREE.Mesh(wheelGeoBig, wheelMat);
    wheelRL.position.set(-0.45, -0.05, -0.35);
    wheelRL.castShadow = true;
    tractor.add(wheelRL);

    const wheelRR = new THREE.Mesh(wheelGeoBig, wheelMat);
    wheelRR.position.set(0.45, -0.05, -0.35);
    wheelRR.castShadow = true;
    tractor.add(wheelRR);

    // Front small wheels
    const wheelFL = new THREE.Mesh(wheelGeoSmall, wheelMat);
    wheelFL.position.set(-0.42, -0.15, 0.4);
    wheelFL.castShadow = true;
    tractor.add(wheelFL);

    const wheelFR = new THREE.Mesh(wheelGeoSmall, wheelMat);
    wheelFR.position.set(0.42, -0.15, 0.4);
    wheelFR.castShadow = true;
    tractor.add(wheelFR);

    // Top antennae / solar panel
    const solarPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.02, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0055ff, metalness: 0.9, roughness: 0.1 })
    );
    solarPanel.position.set(0, 0.66, -0.2);
    tractor.add(solarPanel);

    // Interactive click target box for Tractor
    const targetTractor = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.1, 1.5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    targetTractor.position.set(0, 0.15, 0);
    targetTractor.userData = { cropIndex: 4, isClickTarget: true };
    tractor.add(targetTractor);
  }

  // Helper: Overhead Sprinkler Sprayer System
  function buildSprinklerModel() {
    const sprinklerGroup = new THREE.Group();
    sprinklerGroup.position.set(4.5, 0, 0);
    farmlandGroup.add(sprinklerGroup);

    // Support framework posts at Z endpoints of Field B
    const postGeo = new THREE.CylinderGeometry(0.035, 0.035, 2.3, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    
    const postBack = new THREE.Mesh(postGeo, postMat);
    postBack.position.set(0, 1.15, -3.75);
    sprinklerGroup.add(postBack);

    const postFront = new THREE.Mesh(postGeo, postMat);
    postFront.position.set(0, 1.15, 3.75);
    sprinklerGroup.add(postFront);

    // Overhead pipe line spanning Z axis
    const pipeGeo = new THREE.CylinderGeometry(0.045, 0.045, 7.5, 12);
    pipeGeo.rotateX(Math.PI / 2);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.9, roughness: 0.1 });
    const mainPipe = new THREE.Mesh(pipeGeo, pipeMat);
    mainPipe.position.set(0, 2.3, 0);
    sprinklerGroup.add(mainPipe);

    // Overhead nozzles (tiny boxes)
    const nozzleGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const nozzlesCount = 8;
    for (let n = 0; n < nozzlesCount; n++) {
      const nozzle = new THREE.Mesh(nozzleGeo, postMat);
      const nz = -3.2 + (n / (nozzlesCount - 1)) * 6.4;
      nozzle.position.set(0, 2.22, nz);
      sprinklerGroup.add(nozzle);
    }

    // Build the Water Droplet Particles Pool
    const dropGeo = new THREE.SphereGeometry(0.02, 4, 4);
    const dropMat = new THREE.MeshBasicMaterial({ color: 0x5cd6ff, transparent: true, opacity: 0.5 });
    
    const dropletCount = 50;
    for (let d = 0; d < dropletCount; d++) {
      const droplet = new THREE.Mesh(dropGeo, dropMat);
      // Spawn heights distributed
      droplet.position.set(
        (Math.random() - 0.5) * 0.1,
        0.05 + Math.random() * 2.1,
        -3.4 + Math.random() * 6.8
      );
      droplet.visible = false;
      sprinklerGroup.add(droplet);
      waterDroplets.push(droplet);
    }

    // Interactive target box for Sprinkler
    const targetSprinkler = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.5, 7.8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    targetSprinkler.position.set(0, 1.25, 0);
    targetSprinkler.userData = { cropIndex: 5, isClickTarget: true };
    sprinklerGroup.add(targetSprinkler);
  }

  // Helper: Rooftop Farming Building
  function buildRooftopFarmModel() {
    const roofGroup = new THREE.Group();
    roofGroup.position.set(8.5, 0, 9.5);
    roofGroup.rotation.y = -Math.PI / 6;
    farmlandGroup.add(roofGroup);

    // Main building block (multi-story processing facility)
    const buildingGeo = new THREE.BoxGeometry(4.2, 2.6, 3.4);
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c4, roughness: 0.75, metalness: 0.1 });
    buildingMat.userData = { isBarnBody: true }; // tie into theme color updates loosely
    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.y = 1.3;
    building.castShadow = true;
    building.receiveShadow = true;
    roofGroup.add(building);

    // Window strip bands for visual interest
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x8fb8c9, metalness: 0.6, roughness: 0.2 });
    for (let f = 0; f < 3; f++) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(4.22, 0.25, 3.42), windowMat);
      band.position.y = 0.5 + f * 0.75;
      roofGroup.add(band);
    }

    // Rooftop slab (flat roof deck sitting atop the building)
    const slabGeo = new THREE.BoxGeometry(4.4, 0.12, 3.6);
    const slabMat = new THREE.MeshStandardMaterial({ color: 0x555a5e, roughness: 0.8, metalness: 0.2 });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = 2.66;
    slab.castShadow = true;
    slab.receiveShadow = true;
    roofGroup.add(slab);

    // Roof access housing (small box where stairs/elevator emerge)
    const hatchGeo = new THREE.BoxGeometry(0.7, 0.6, 0.7);
    const hatchMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.6, metalness: 0.3 });
    const hatch = new THREE.Mesh(hatchGeo, hatchMat);
    hatch.position.set(-1.6, 3.02, -1.2);
    hatch.castShadow = true;
    roofGroup.add(hatch);

    // ─── Rooftop Planter Rows ───
    const plantersGroup = new THREE.Group();
    plantersGroup.position.y = 2.72;
    roofGroup.add(plantersGroup);

    const plantRowZCoords = [-1.1, -0.35, 0.4, 1.15];
    const plantBoxGeo = new THREE.BoxGeometry(3.4, 0.22, 0.55);
    const plantBoxMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.85 });
    const soilCapGeo = new THREE.BoxGeometry(3.3, 0.05, 0.48);
    const soilCapMat = new THREE.MeshStandardMaterial({ color: 0x3e2b22, roughness: 0.95 });

    plantRowZCoords.forEach((z, rowIdx) => {
      const planterBox = new THREE.Mesh(plantBoxGeo, plantBoxMat);
      planterBox.position.set(0.4, 0.11, z);
      planterBox.castShadow = true;
      planterBox.receiveShadow = true;
      plantersGroup.add(planterBox);

      const soilCap = new THREE.Mesh(soilCapGeo, soilCapMat);
      soilCap.position.set(0.4, 0.225, z);
      plantersGroup.add(soilCap);

      // Rows of small leafy crop tufts that sway in the breeze
      const tuftCount = 9;
      for (let t = 0; t < tuftCount; t++) {
        const tx = 0.4 + (-1.55 + (t / (tuftCount - 1)) * 3.1);
        const tuft = createRooftopCropTuft(rowIdx);
        tuft.position.set(tx + (Math.random() - 0.5) * 0.06, 0.26, z);
        tuft.userData.swayPhase = Math.random() * Math.PI * 2;
        tuft.userData.swaySpeed = 0.0018 + Math.random() * 0.0012;
        plantersGroup.add(tuft);
        rooftopCrops.push(tuft);
      }
    });

    // ─── Rooftop Ventilation Fans ───
    const fanPositions = [
      { x: -1.6, z: 0.3 },
      { x: 1.55, z: -1.3 },
      { x: 1.55, z: 1.4 }
    ];

    fanPositions.forEach(pos => {
      const fanUnit = new THREE.Group();
      fanUnit.position.set(pos.x, 2.72, pos.z);
      roofGroup.add(fanUnit);

      // Fan housing ring
      const housingGeo = new THREE.TorusGeometry(0.26, 0.05, 8, 16);
      const housingMat = new THREE.MeshStandardMaterial({ color: 0xb0b6ba, metalness: 0.7, roughness: 0.3 });
      const housing = new THREE.Mesh(housingGeo, housingMat);
      housing.rotation.x = Math.PI / 2;
      housing.castShadow = true;
      fanUnit.add(housing);

      // Base cylinder beneath fan
      const baseGeo = new THREE.CylinderGeometry(0.27, 0.3, 0.18, 16);
      const baseMatFan = new THREE.MeshStandardMaterial({ color: 0x44494d, metalness: 0.5, roughness: 0.5 });
      const fanBase = new THREE.Mesh(baseGeo, baseMatFan);
      fanBase.position.y = -0.1;
      fanUnit.add(fanBase);

      // Spinning blade hub
      const bladeHub = new THREE.Group();
      bladeHub.position.y = 0.01;
      fanUnit.add(bladeHub);

      const bladeGeo = new THREE.BoxGeometry(0.05, 0.02, 0.22);
      bladeGeo.translate(0, 0, 0.11);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.4, metalness: 0.3 });

      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.rotation.y = b * (Math.PI / 2);
        bladeHub.add(blade);
      }

      const hubCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6 })
      );
      bladeHub.add(hubCap);

      rooftopFans.push(bladeHub);
    });

    // ─── Rooftop Solar Panel Array ───
    const solarGroup = new THREE.Group();
    solarGroup.position.set(-1.2, 2.74, -1.95);
    roofGroup.add(solarGroup);

    const panelGeo = new THREE.BoxGeometry(0.9, 0.04, 1.4);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1c2b4a, metalness: 0.8, roughness: 0.15 });
    for (let p = 0; p < 2; p++) {
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(p * 1.0, 0.18, 0);
      panel.rotation.x = -0.25;
      panel.rotation.z = (Math.random() - 0.5) * 0.02;
      panel.castShadow = true;
      solarGroup.add(panel);

      const standGeo = new THREE.BoxGeometry(0.06, 0.18, 0.06);
      const standMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 });
      const standBack = new THREE.Mesh(standGeo, standMat);
      standBack.position.set(p * 1.0, 0.08, -0.6);
      solarGroup.add(standBack);

      const standFront = new THREE.Mesh(standGeo, standMat);
      standFront.scale.y = 0.4;
      standFront.position.set(p * 1.0, 0.0, 0.6);
      solarGroup.add(standFront);
    }

    // ─── Low railing around roof edge ───
    const railMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.6, roughness: 0.4 });
    const railGeoLong = new THREE.BoxGeometry(4.4, 0.18, 0.04);
    const railGeoShort = new THREE.BoxGeometry(0.04, 0.18, 3.6);

    const railFront = new THREE.Mesh(railGeoLong, railMat);
    railFront.position.set(0, 2.81, 1.8);
    roofGroup.add(railFront);

    const railBack = new THREE.Mesh(railGeoLong, railMat);
    railBack.position.set(0, 2.81, -1.8);
    roofGroup.add(railBack);

    const railLeft = new THREE.Mesh(railGeoShort, railMat);
    railLeft.position.set(-2.2, 2.81, 0);
    roofGroup.add(railLeft);

    const railRight = new THREE.Mesh(railGeoShort, railMat);
    railRight.position.set(2.2, 2.81, 0);
    roofGroup.add(railRight);

    // Interactive target box for Rooftop Farm
    const targetRoof = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 4.0, 3.8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    targetRoof.position.set(0, 1.6, 0);
    targetRoof.userData = { cropIndex: 6, isClickTarget: true };
    roofGroup.add(targetRoof);
  }

  // Helper: Small leafy crop tuft for rooftop planters
  function createRooftopCropTuft(rowIdx) {
    const tuftGroup = new THREE.Group();

    // Alternate crop colors per row for variety (greens / reds / purples)
    const leafColors = [0x4caf50, 0x66bb6a, 0xa5d6a7, 0x8e6bbf];
    const baseColor = leafColors[rowIdx % leafColors.length];

    const leafGeo = new THREE.DodecahedronGeometry(0.05, 0);
    const leafMat = new THREE.MeshLambertMaterial({ color: baseColor, flatShading: true });
    leafMat.userData = { isRoofGreenery: true };

    const blobCount = 3;
    for (let i = 0; i < blobCount; i++) {
      const blob = new THREE.Mesh(leafGeo, leafMat);
      const angle = (i / blobCount) * Math.PI * 2;
      blob.position.set(Math.cos(angle) * 0.035, 0.04 + Math.random() * 0.01, Math.sin(angle) * 0.035);
      blob.scale.setScalar(0.8 + Math.random() * 0.35);
      tuftGroup.add(blob);
    }

    return tuftGroup;
  }

  // ─── Procedural Mesh Elements (For Biodome) ───

  function createLeafGeometry(radius, length) {
    const geom = new THREE.SphereGeometry(radius, 8, 8);
    geom.scale(1.0, 0.08, length);
    return geom;
  }

  function createLettuce() {
    const lettuceGroup = new THREE.Group();
    
    const coreGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const coreMat = new THREE.MeshLambertMaterial({ color: 0x98e379, flatShading: true });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.08;
    lettuceGroup.add(core);

    const leafGeo = new THREE.DodecahedronGeometry(0.24, 0);
    const numLeaves = 10;
    
    for (let i = 0; i < numLeaves; i++) {
      const angle = (i / numLeaves) * Math.PI * 2 + Math.random();
      const dist = 0.06 + Math.random() * 0.04;
      const leafColor = i % 2 === 0 ? 0x2e7d32 : 0x4caf50;
      
      const leafMat = new THREE.MeshLambertMaterial({
        color: leafColor,
        flatShading: true
      });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      
      leaf.scale.set(1.4, 0.4, 0.9);
      leaf.rotation.x = 0.3 + Math.random() * 0.25;
      leaf.rotation.y = angle;
      leaf.rotation.z = 0.15;
      
      leaf.position.set(Math.cos(angle) * dist, 0.08 + Math.random() * 0.04, Math.sin(angle) * dist);
      lettuceGroup.add(leaf);
    }
    
    lettuceGroup.scale.set(1.2, 1.2, 1.2);
    return lettuceGroup;
  }

  function createBasil() {
    const basilGroup = new THREE.Group();
    
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.7, 8);
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.35;
    basilGroup.add(stem);

    const leafGeo = createLeafGeometry(0.12, 1.8);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x1b5e20, side: THREE.DoubleSide });

    const levels = 3;
    for (let l = 0; l < levels; l++) {
      const height = 0.18 + l * 0.18;
      const baseRotation = l * (Math.PI / 2);
      
      const leafL = new THREE.Mesh(leafGeo, leafMat);
      leafL.position.set(0, height, 0);
      leafL.rotation.y = baseRotation;
      leafL.rotation.x = 0.5;
      leafL.translateZ(0.08);
      basilGroup.add(leafL);

      const leafR = new THREE.Mesh(leafGeo, leafMat);
      leafR.position.set(0, height, 0);
      leafR.rotation.y = baseRotation + Math.PI;
      leafR.rotation.x = 0.5;
      leafR.translateZ(0.08);
      basilGroup.add(leafR);
    }
    
    basilGroup.scale.set(1.3, 1.3, 1.3);
    return basilGroup;
  }

  function createTomatoes() {
    const vineGroup = new THREE.Group();
    
    const stakeGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.9, 8);
    const stakeMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 });
    
    const stakeL = new THREE.Mesh(stakeGeo, stakeMat);
    stakeL.position.set(-0.4, 0.95, 0);
    vineGroup.add(stakeL);

    const stakeR = new THREE.Mesh(stakeGeo, stakeMat);
    stakeR.position.set(0.4, 0.95, 0);
    vineGroup.add(stakeR);

    const wireGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.8, 8);
    wireGeo.rotateZ(Math.PI / 2);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
    
    for (let h = 0.4; h <= 1.6; h += 0.4) {
      const wire = new THREE.Mesh(wireGeo, wireMat);
      wire.position.set(0, h, 0);
      vineGroup.add(wire);
    }

    const vineStemGeo = new THREE.CylinderGeometry(0.015, 0.025, 1.6, 8);
    const vineMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    
    const vine = new THREE.Mesh(vineStemGeo, vineMat);
    vine.position.set(0, 0.8, 0);
    vine.rotation.z = 0.08;
    vineGroup.add(vine);

    const leafGeo = createLeafGeometry(0.1, 1.5);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x1b5e20 });
    
    for (let i = 0; i < 10; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const h = 0.25 + i * 0.13;
      const angle = i * 2.4;
      
      leaf.position.set(Math.cos(angle) * 0.1, h, Math.sin(angle) * 0.1);
      leaf.rotation.y = angle;
      leaf.rotation.x = 0.4;
      vineGroup.add(leaf);
    }

    const tomatoGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const tomatoMat = new THREE.MeshPhongMaterial({
      color: 0xff2200,
      shininess: 120,
      specular: 0xffffff
    });

    const tomatoPositions = [
      { x: -0.1, y: 0.6, z: 0.08 },
      { x: 0.08, y: 0.8, z: -0.1 },
      { x: -0.12, y: 1.1, z: -0.05 },
      { x: 0.12, y: 1.25, z: 0.08 },
      { x: -0.05, y: 1.45, z: 0.12 }
    ];

    tomatoPositions.forEach(pos => {
      const tomato = new THREE.Mesh(tomatoGeo, tomatoMat);
      tomato.position.set(pos.x, pos.y, pos.z);
      
      const connGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 4);
      const conn = new THREE.Mesh(connGeo, vineMat);
      conn.position.set(pos.x, pos.y + 0.04, pos.z);
      vineGroup.add(conn);
      vineGroup.add(tomato);
    });

    return vineGroup;
  }

  function createMint() {
    const mintGroup = new THREE.Group();
    const leafGeo = createLeafGeometry(0.08, 1.5);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x27ae60 });
    
    const numStems = 4;
    for (let s = 0; s < numStems; s++) {
      const stemAngle = (s / numStems) * Math.PI * 2;
      const tilt = 0.25 + Math.random() * 0.2;
      
      const stemGroup = new THREE.Group();
      stemGroup.rotation.y = stemAngle;
      stemGroup.rotation.x = tilt;
      
      const stemGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.45, 8);
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x78e08f });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.22;
      stemGroup.add(stem);

      for (let l = 0; l < 5; l++) {
        const height = 0.08 + l * 0.07;
        const leafRot = l * 1.5;
        
        const leafL = new THREE.Mesh(leafGeo, leafMat);
        leafL.position.set(0, height, 0);
        leafL.rotation.y = leafRot;
        leafL.rotation.x = 0.6;
        leafL.translateZ(0.06);
        stemGroup.add(leafL);

        const leafR = new THREE.Mesh(leafGeo, leafMat);
        leafR.position.set(0, height, 0);
        leafR.rotation.y = leafRot + Math.PI;
        leafR.rotation.x = 0.6;
        leafR.translateZ(0.06);
        stemGroup.add(leafR);
      }

      mintGroup.add(stemGroup);
    }
    
    mintGroup.scale.set(1.4, 1.4, 1.4);
    return mintGroup;
  }

  function createCucumber() {
    const cucGroup = new THREE.Group();

    const postGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.8, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x4f4f4f, metalness: 0.6 });

    const poleL = new THREE.Mesh(postGeo, postMat);
    poleL.position.set(-0.45, 0.9, 0);
    cucGroup.add(poleL);

    const poleR = new THREE.Mesh(postGeo, postMat);
    poleR.position.set(0.45, 0.9, 0);
    cucGroup.add(poleR);

    const latticeGeo = new THREE.CylinderGeometry(0.006, 0.006, 1.2, 8);
    const latticeMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d });

    for (let w = 0; w < 4; w++) {
      const height = 0.35 + w * 0.45;
      
      const horizontalWire = new THREE.Mesh(latticeGeo, latticeMat);
      horizontalWire.rotation.z = Math.PI / 2;
      horizontalWire.position.set(0, height, 0);
      cucGroup.add(horizontalWire);
    }

    const vineStemGeo = new THREE.CylinderGeometry(0.015, 0.022, 1.5, 8);
    const vineMat = new THREE.MeshLambertMaterial({ color: 0x1e824c });
    const vine = new THREE.Mesh(vineStemGeo, vineMat);
    vine.position.set(0, 0.75, 0.01);
    vine.rotation.z = -0.05;
    cucGroup.add(vine);

    const leafGeo = createLeafGeometry(0.15, 1.4);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x115e33 });

    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const h = 0.3 + i * 0.18;
      const angle = i * 2.9;
      
      leaf.position.set(Math.cos(angle) * 0.12, h, Math.sin(angle) * 0.12);
      leaf.rotation.y = angle;
      leaf.rotation.x = 0.5;
      cucGroup.add(leaf);
    }

    const cucBodyGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.45, 12);
    const cucCapGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const cucMat = new THREE.MeshLambertMaterial({ color: 0x0f5132 });

    const cucumberPositions = [
      { x: -0.18, y: 0.65, z: 0.05 },
      { x: 0.2, y: 0.95, z: -0.05 },
      { x: -0.15, y: 1.25, z: -0.02 }
    ];

    cucumberPositions.forEach(pos => {
      const cucumberUnit = new THREE.Group();
      
      const body = new THREE.Mesh(cucBodyGeo, cucMat);
      body.castShadow = true;
      cucumberUnit.add(body);
      
      const capTop = new THREE.Mesh(cucCapGeo, cucMat);
      capTop.position.y = 0.225;
      cucumberUnit.add(capTop);

      const capBottom = new THREE.Mesh(cucCapGeo, cucMat);
      capBottom.position.y = -0.225;
      cucumberUnit.add(capBottom);

      const connGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.06, 4);
      const conn = new THREE.Mesh(connGeo, vineMat);
      conn.position.y = 0.25;
      cucumberUnit.add(conn);

      cucumberUnit.position.set(pos.x, pos.y, pos.z);
      cucumberUnit.rotation.z = 0.1;
      cucGroup.add(cucumberUnit);
    });

    return cucGroup;
  }

  function createBroccoliGrid() {
    const microGroup = new THREE.Group();
    
    const matGeo = new THREE.BoxGeometry(1.5, 0.04, 5.4);
    const matMat = new THREE.MeshStandardMaterial({
      color: 0x5a483a,
      roughness: 0.9,
      metalness: 0.1
    });
    const matMatMesh = new THREE.Mesh(matGeo, matMat);
    matMatMesh.position.y = 0.02;
    microGroup.add(matMatMesh);

    const rows = 12;
    const cols = 4;
    const zStart = -2.5;
    const zEnd = 2.5;
    const xStart = -0.6;
    const xEnd = 0.6;

    const stemGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.18, 4);
    const stemMat = new THREE.MeshLambertMaterial({ color: 0xc1ff72 });
    const leafGeo = new THREE.SphereGeometry(0.02, 4, 4);
    leafGeo.scale(1, 0.2, 1);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x27ae60 });

    for (let r = 0; r < rows; r++) {
      const pctZ = r / (rows - 1);
      const baseZ = zStart + pctZ * (zEnd - zStart);

      for (let c = 0; c < cols; c++) {
        const pctX = c / (cols - 1);
        const baseX = xStart + pctX * (xEnd - xStart);

        const px = baseX + (Math.random() - 0.5) * 0.08;
        const pz = baseZ + (Math.random() - 0.5) * 0.08;
        const py = 0.04;

        const sprout = new THREE.Group();
        sprout.position.set(px, py, pz);

        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.09;
        sprout.add(stem);

        const leafL = new THREE.Mesh(leafGeo, leafMat);
        leafL.position.set(-0.015, 0.18, 0);
        leafL.rotation.z = -0.4;
        sprout.add(leafL);

        const leafR = new THREE.Mesh(leafGeo, leafMat);
        leafR.position.set(0.015, 0.18, 0);
        leafR.rotation.z = 0.4;
        sprout.add(leafR);

        sprout.scale.set(1, 0.85 + Math.random() * 0.3, 1);
        microGroup.add(sprout);
      }
    }

    return microGroup;
  }

  // ─── Interaction / Raycasting Handler ───
  function setupInteraction() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const canvasContainer = document.getElementById('canvas3d');

    canvasContainer.addEventListener('pointerdown', (e) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    });

    canvasContainer.addEventListener('pointerup', (e) => {
      if (
        e.target.closest('.hud-header') ||
        e.target.closest('.hud-details-panel') ||
        e.target.closest('.hud-instructions-card') ||
        e.target.closest('.hud-controls-bar') ||
        e.target.closest('.theme-select-container')
      ) {
        return;
      }

      const deltaX = e.clientX - pointerDownX;
      const deltaY = e.clientY - pointerDownY;
      const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (dragDistance < 4) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveObjects);

        if (intersects.length > 0) {
          const index = intersects[0].object.userData.cropIndex;
          selectItem(index);
        } else {
          deselectCrop();
        }
      }
    });

    canvasContainer.addEventListener('pointermove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);

      canvasContainer.style.cursor = intersects.length > 0 ? 'pointer' : 'auto';
    });
  }

  function selectItem(index) {
    if (index === activeSelectIndex) return;

    activeSelectIndex = index;
    const db = (activeMode === 'biodome') ? biodomeCrops : farmlandCrops;
    const itemData = db[index];

    // Highlight positioning
    if (activeMode === 'biodome') {
      const xCoords = [-6.25, -3.75, -1.25, 1.25, 3.75, 6.25];
      selectionHighlight.position.set(xCoords[index], 0.25, 0);
      selectionHighlight.scale.set(1, 1, 1);
      gsapPivotTarget(xCoords[index], 0.4, 0);
    } else {
      // Farmland highlights shapes based on selected asset
      if (index === 0) { // Wheat field
        selectionHighlight.position.set(-4.5, 0.2, 0);
        selectionHighlight.scale.set(2.2, 1, 1.25);
      } else if (index === 1) { // Barn
        selectionHighlight.position.set(-11.5, 1.6, -5.5);
        selectionHighlight.scale.set(2.6, 4.0, 1.2);
      } else if (index === 2) { // Vegetable field
        selectionHighlight.position.set(4.5, 0.2, 0);
        selectionHighlight.scale.set(2.2, 1, 1.25);
      } else if (index === 3) { // Windmill
        selectionHighlight.position.set(11.5, 3.2, -6.5);
        selectionHighlight.scale.set(2.0, 7.8, 0.6);
      } else if (index === 4) { // Tractor
        selectionHighlight.position.copy(tractor.position);
        selectionHighlight.position.y += 0.2;
        selectionHighlight.scale.set(0.8, 1.4, 0.3);
      } else if (index === 5) { // Irrigation
        selectionHighlight.position.set(4.5, 1.25, 0);
        selectionHighlight.scale.set(0.8, 3.5, 1.3);
      } else if (index === 6) { // Rooftop Farm
        selectionHighlight.position.set(8.5, 2.9, 9.5);
        selectionHighlight.scale.set(2.3, 0.5, 1.9);
      }
      gsapPivotTarget(selectionHighlight.position.x, selectionHighlight.position.y, selectionHighlight.position.z);
    }
    selectionHighlight.visible = true;

    // Update details DOM Elements
    document.getElementById('cropEmoji').textContent = itemData.emoji;
    document.getElementById('cropName').textContent = itemData.name;
    document.getElementById('cropStatus').textContent = itemData.status;
    document.getElementById('cropMoisture').textContent = itemData.moisture;
    document.getElementById('cropGrowRate').textContent = itemData.growRate;
    document.getElementById('cropHarvest').textContent = itemData.harvest;
    document.getElementById('cropEc').textContent = itemData.ec;
    document.getElementById('cropYield').textContent = itemData.yield;
    document.getElementById('cropDesc').textContent = itemData.desc;

    // Style Status badge depending on telemetry status
    const statusPill = document.getElementById('cropStatus');
    if (itemData.status === 'Growing' || itemData.status === 'Maturing' || itemData.status === 'Fruiting' || itemData.status === 'Flowering') {
      statusPill.style.color = '#ffaa00';
      statusPill.style.borderColor = '#ffaa00';
      statusPill.style.background = 'rgba(255, 170, 0, 0.08)';
    } else if (itemData.status === 'Generating' || itemData.status === 'Sprouting') {
      statusPill.style.color = '#38bdf8';
      statusPill.style.borderColor = '#38bdf8';
      statusPill.style.background = 'rgba(56, 189, 248, 0.08)';
    } else {
      statusPill.style.color = 'var(--accent)';
      statusPill.style.borderColor = 'var(--accent)';
      statusPill.style.background = 'var(--accent-soft)';
    }

    document.getElementById('detailsPanel').classList.add('show');
  }

  function deselectCrop() {
    activeSelectIndex = -1;
    selectionHighlight.visible = false;
    document.getElementById('detailsPanel').classList.remove('show');
    
    // Reset pivot target
    if (activeMode === 'biodome') {
      gsapPivotTarget(0, 1, 0);
    } else {
      gsapPivotTarget(0, 0, 0);
    }
  }

  function gsapPivotTarget(tx, ty, tz) {
    targetPivot.set(tx, ty, tz);
  }

  // ─── Rendering and Animating Loops ───

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);

    // Update Orbit controls damping
    controls.update();

    // Lerp controls target smoothly to targetPivot
    controls.target.lerp(targetPivot, 0.05);

    const time = Date.now();

    // Pulsing selection highlight
    if (selectionHighlight.visible) {
      const pulse = 0.55 + 0.3 * Math.sin(time * 0.006);
      selectionHighlight.material.opacity = pulse;
      
      // If the tractor is selected in Farmland mode, the outline box should lock on/move with it!
      if (activeMode === 'farmland' && activeSelectIndex === 4) {
        selectionHighlight.position.copy(tractor.position);
        selectionHighlight.position.y += 0.2;
        selectionHighlight.rotation.copy(tractor.rotation);
      } else {
        selectionHighlight.rotation.set(0, 0, 0);
      }
    }

    // ─── Biodome Animations ───
    if (activeMode === 'biodome') {
      // Gentle nutrient solution ripple
      cropsGroup.children.forEach(group => {
        const water = group.children[1]; // water index
        if (water) {
          water.position.y = 0.38 + 0.003 * Math.sin(time * 0.0016 + group.position.x);
        }
      });
    }

    // ─── Farmland Animations ───
    if (activeMode === 'farmland') {
      // 1. Rotate Windmill sails
      if (windmillBlades) {
        windmillBlades.rotation.z += 0.016;
      }

      // 2. Animate Autonomous Tractor driving path (Oval route around fields)
      if (tractor) {
        const radiusX = 8.5;
        const radiusZ = 6.2;
        const tSpeed = 0.00025;
        const tAngle = time * tSpeed;
        
        const tx = Math.cos(tAngle) * radiusX;
        const tz = Math.sin(tAngle) * radiusZ;
        tractor.position.set(tx, 0.05, tz);

        // Heading tangent rotation angle
        const dx = -Math.sin(tAngle);
        const dz = Math.cos(tAngle);
        tractor.rotation.y = Math.atan2(dx, dz);

        // Spin wheels
        tractor.children.forEach(child => {
          if (child instanceof THREE.Mesh && child.geometry.type === "CylinderGeometry" && child !== tractor.children[1]) {
            child.rotation.x += 0.055;
          }
        });
      }

      // 3. Move Clouds slowly across farm sky
      if (cloudsGroup) {
        cloudsGroup.children.forEach((cloud, index) => {
          cloud.position.x += 0.008 + index * 0.002;
          // Loop clouds back when they float past bounds
          if (cloud.position.x > 16) {
            cloud.position.x = -16;
            cloud.position.z = -10 + Math.random() * 14;
          }
        });
      }

      // 4. Irrigation Sprinkler falling water particles
      waterDroplets.forEach((drop) => {
        if (irrigationOn) {
          drop.visible = true;
          // Move droplet down
          drop.position.y -= 0.058;
          
          // Reset when droplet hits ground
          if (drop.position.y < 0.02) {
            drop.position.y = 2.22;
            drop.position.x = (Math.random() - 0.5) * 0.1;
            drop.position.z = -3.4 + Math.random() * 6.8;
          }
        } else {
          drop.visible = false;
        }
      });

      // 5. Weather lightning overlay (Random flashes during Stormy Weather)
      if (weatherState === 'stormy') {
        lightningTimer++;
        if (Math.random() < 0.006 && lightningTimer > 80) {
          lightningTimer = 0;
          // Trigger Flash
          ambientLight.intensity = 1.8;
          directionalLight.intensity = 1.5;
          setTimeout(() => {
            // Restore dim stormy lighting
            ambientLight.intensity = 0.15;
            directionalLight.intensity = 0.15;
          }, 60 + Math.random() * 80);
        }
      }

      // 6. Spin rooftop ventilation fans
      rooftopFans.forEach((fanHub, idx) => {
        fanHub.rotation.y += 0.12 + idx * 0.03;
      });

      // 7. Sway rooftop crop tufts in the breeze
      rooftopCrops.forEach((tuft) => {
        const phase = tuft.userData.swayPhase || 0;
        const speed = tuft.userData.swaySpeed || 0.002;
        const sway = Math.sin(time * speed + phase) * 0.12;
        tuft.rotation.z = sway;
        tuft.rotation.x = sway * 0.5;
      });
    }

    // Render Frame
    renderer.render(scene, camera);
  }

  // Setup initial DOM bindings
  window.addEventListener('DOMContentLoaded', init);

})();