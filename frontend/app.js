class SatelliteCollisionPredictor {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.earth = null;
        this.satellites = new Map();
        this.orbits = new Map();
        this.stars = null;
        this.rotationEnabled = true;
        this.satelliteData = [];
        this.prominentSatellites = [];
        this.showAllSatellites = false;
        this.startTime = Date.now();
        this.animationId = null;
        this.missionStartTime = Date.now();
        this.orbitsVisible = true;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedSatellite = null;
        
        // API Configuration
        this.API_BASE = 'http://127.0.0.1:5000';
        
        // Prominent satellites for initial display
        this.PROMINENT_SATELLITES = [
            'ISS (ZARYA)',
            'HUBBLE SPACE TELESCOPE',
            'STARLINK-1007',
            'STARLINK-1019',
            'NOAA-20'
        ];
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    async init() {
        try {
            await this.showBootSequence();
            this.initMainApplication();
        } catch (error) {
            console.error('Initialization failed:', error);
            this.initMainApplication(); // Fallback to main app
        }
    }
    
    // Professional Boot Sequence
    async showBootSequence() {
        return new Promise((resolve) => {
            const progressBar = document.getElementById('boot-progress');
            const statusText = document.getElementById('boot-status');
            const bootLog = document.getElementById('boot-log');
            
            if (!progressBar || !statusText || !bootLog) {
                console.warn('Boot sequence elements not found, skipping to main app');
                this.transitionToMainApp();
                resolve();
                return;
            }
            
            const bootSteps = [
                { progress: 10, message: 'Loading kernel modules...', log: 'Kernel modules loaded successfully' },
                { progress: 25, message: 'Initializing orbital mechanics engine...', log: 'Orbital mechanics engine online' },
                { progress: 40, message: 'Establishing ground station link...', log: 'Ground station link established' },
                { progress: 60, message: 'Loading satellite ephemeris data...', log: 'Ephemeris data synchronized' },
                { progress: 75, message: 'Calibrating visualization systems...', log: 'Visualization systems calibrated' },
                { progress: 90, message: 'Finalizing system checks...', log: 'All systems nominal' },
                { progress: 100, message: 'System ready...', log: 'Orbital Analysis System online' }
            ];
            
            let currentStep = 0;
            
            const updateBootProgress = () => {
                if (currentStep >= bootSteps.length) {
                    setTimeout(() => {
                        this.transitionToMainApp();
                        resolve();
                    }, 1000);
                    return;
                }
                
                const step = bootSteps[currentStep];
                
                // Update progress bar
                progressBar.style.width = `${step.progress}%`;
                
                // Update status text
                statusText.textContent = step.message;
                
                // Add log entry
                const timestamp = new Date().toLocaleTimeString();
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';
                logEntry.textContent = `[${timestamp}] SYSTEM: ${step.log}`;
                bootLog.appendChild(logEntry);
                bootLog.scrollTop = bootLog.scrollHeight;
                
                currentStep++;
                
                // Schedule next update with random delay for realism
                const delay = 500 + Math.random() * 500;
                setTimeout(updateBootProgress, delay);
            };
            
            // Start boot sequence
            updateBootProgress();
        });
    }
    
    transitionToMainApp() {
        const splashScreen = document.getElementById('splash-screen');
        const mainApp = document.getElementById('main-app');
        
        if (!splashScreen || !mainApp) {
            console.warn('Splash screen or main app elements not found');
            return;
        }
        
        splashScreen.style.opacity = '0';
        splashScreen.style.transition = 'opacity 0.5s ease-out';
        
        setTimeout(() => {
            splashScreen.style.display = 'none';
            mainApp.classList.remove('hidden');
        }, 500);
    }
    
    // Main Application Initialization
    initMainApplication() {
        try {
            this.initThreeJS();
            this.initEventListeners();
            this.startMissionTimer();
            this.loadSatelliteData();
            this.addSystemLog('System fully operational', 'success');
        } catch (error) {
            console.error('Failed to initialize main application:', error);
            this.showAlert('Initialization Error', 'Failed to start 3D visualization', 'error');
        }
    }
    
    // Enhanced Three.js Initialization
    initThreeJS() {
        const canvas = document.getElementById('earth-canvas');
        const container = canvas.parentElement;
        
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
        
        // Renderer setup with enhanced settings
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create scene elements
        this.createRealisticEarth();
        this.createStarField();
        this.setupLighting();
        
        // Camera positioning
        this.camera.position.set(0, 0, 15);
        this.camera.lookAt(0, 0, 0);
        
        // Initialize controls
        this.initCameraControls();
        
        // Window resize handler
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start animation loop
        this.animate();
    }
    
    createRealisticEarth() {
        // Create Earth sphere with high resolution
        const geometry = new THREE.SphereGeometry(5, 128, 64);
        
        // Create realistic Earth texture
        const textureLoader = new THREE.TextureLoader();
        
        // In a real implementation, you would use high-resolution NASA textures
        // For this demo, we'll create a programmatic texture
        const earthTexture = this.createEarthTexture(2048, 1024);
        
        const material = new THREE.MeshPhongMaterial({
            map: earthTexture,
            specular: new THREE.Color(0x111111),
            shininess: 5,
            transparent: false
        });
        
        this.earth = new THREE.Mesh(geometry, material);
        this.earth.rotation.x = 23.5 * Math.PI / 180; // Earth's axial tilt
        this.scene.add(this.earth);
        
        // Add atmosphere
        this.createAtmosphere();
    }
    
    createEarthTexture(width, height) {
        // Create a canvas for the Earth texture
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Draw ocean background
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(0, 0, width, height);
        
        // Draw continents (simplified)
        this.drawContinents(ctx, width, height);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.flipY = false;
        
        return texture;
    }
    
    drawContinents(ctx, width, height) {
        ctx.fillStyle = '#2d5a27'; // Green for continents
        
        // Simplified continental shapes
        const continents = [
            // North America
            { x: width * 0.15, y: height * 0.25, w: width * 0.2, h: height * 0.25 },
            // South America
            { x: width * 0.18, y: height * 0.5, w: width * 0.12, h: height * 0.3 },
            // Africa
            { x: width * 0.48, y: height * 0.35, w: width * 0.2, h: height * 0.4 },
            // Europe/Asia
            { x: width * 0.65, y: height * 0.2, w: width * 0.3, h: height * 0.4 },
            // Australia
            { x: width * 0.75, y: height * 0.65, w: width * 0.15, h: height * 0.1 }
        ];
        
        continents.forEach(continent => {
            ctx.beginPath();
            ctx.ellipse(continent.x, continent.y, continent.w / 2, continent.h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Add ice caps
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(width / 2, 0, width * 0.4, height * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(width / 2, height, width * 0.4, height * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    createAtmosphere() {
        const atmosphereGeometry = new THREE.SphereGeometry(5.1, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                uniform float time;
                void main() {
                    float intensity = pow(0.8 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.scene.add(atmosphere);
    }
    
    createStarField() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            // Spherical distribution
            const radius = 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Star colors
            const temp = Math.random();
            if (temp < 0.7) {
                colors[i3] = 1;
                colors[i3 + 1] = 1;
                colors[i3 + 2] = 1;
            } else if (temp < 0.9) {
                colors[i3] = 0.7;
                colors[i3 + 1] = 0.8;
                colors[i3 + 2] = 1;
            } else {
                colors[i3] = 1;
                colors[i3 + 1] = 0.7;
                colors[i3 + 2] = 0.6;
            }
            
            sizes[i] = Math.random() * 2 + 0.5;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z) * (0.8 + 0.2 * sin(time + position.x));
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                    if (distanceToCenter > 0.5) discard;
                    
                    float alpha = 1.0 - distanceToCenter * 2.0;
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            vertexColors: true
        });
        
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
    }
    
    setupLighting() {
        // Clear existing lights
        const existingLights = this.scene.children.filter(child => child.isLight);
        existingLights.forEach(light => this.scene.remove(light));
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(30, 20, 20);
        sunLight.castShadow = true;
        this.scene.add(sunLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
        fillLight.position.set(-30, -10, -20);
        this.scene.add(fillLight);
    }
    
    createSatellite(name, orbitalData) {
        const group = new THREE.Group();
        group.name = name;
        
        // Satellite body
        const bodyGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xdddddd,
            emissive: 0x111111
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Solar panels
        const panelGeometry = new THREE.BoxGeometry(0.3, 0.01, 0.15);
        const panelMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a3e });
        
        const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        leftPanel.position.set(-0.2, 0, 0);
        
        const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        rightPanel.position.set(0.2, 0, 0);
        
        group.add(body);
        group.add(leftPanel);
        group.add(rightPanel);
        
        // Position based on orbital data
        this.positionSatelliteFromOrbit(group, orbitalData);
        
        group.userData = {
            name: name,
            orbital: orbitalData,
            selected: false
        };
        
        this.scene.add(group);
        return group;
    }
    
    positionSatelliteFromOrbit(satellite, orbitalData) {
        const altitude = orbitalData.altitude || (400 + Math.random() * 800);
        const inclination = orbitalData.inclination || (Math.random() * 180 - 90);
        const longitude = orbitalData.longitude || (Math.random() * 360 - 180);
        
        const earthRadius = 5;
        const altitudeScale = altitude / 1000;
        const totalRadius = earthRadius + Math.max(altitudeScale, 0.5);
        
        const phi = (90 - inclination) * Math.PI / 180;
        const theta = longitude * Math.PI / 180;
        
        satellite.position.set(
            totalRadius * Math.sin(phi) * Math.cos(theta),
            totalRadius * Math.cos(phi),
            totalRadius * Math.sin(phi) * Math.sin(theta)
        );
        
        satellite.userData.orbitRadius = totalRadius;
        satellite.userData.orbitSpeed = Math.sqrt(398600 / Math.pow(totalRadius * 1000, 3)) * 0.05;
        satellite.userData.orbitAngle = Math.random() * Math.PI * 2;
    }
    
    createOrbitPath(satellite) {
        const radius = satellite.userData.orbitRadius;
        const inclination = satellite.userData.orbital.inclination || 0;
        const points = [];
        const segments = 100;
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * Math.sin(inclination * Math.PI / 180) * radius;
            const z = Math.sin(angle) * Math.cos(inclination * Math.PI / 180) * radius;
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6,
            linewidth: 1
        });
        
        const orbit = new THREE.Line(geometry, material);
        orbit.visible = this.orbitsVisible;
        orbit.userData = { satellite: satellite.name };
        this.scene.add(orbit);
        return orbit;
    }
    
    // Event Listeners
    initEventListeners() {
        // Control buttons
        document.getElementById('pause-rotation').addEventListener('click', () => this.toggleRotation());
        document.getElementById('reset-camera').addEventListener('click', () => this.resetCamera());
        document.getElementById('toggle-orbits').addEventListener('click', () => this.toggleOrbits());
        document.getElementById('fullscreen-toggle').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('analyze-btn').addEventListener('click', () => this.analyzeCollision());
        document.getElementById('refresh-btn').addEventListener('click', () => this.refreshTLEData());
        document.getElementById('show-all-toggle').addEventListener('change', (e) => this.toggleAllSatellites(e.target.checked));
        document.getElementById('close-info').addEventListener('click', () => this.hideSatelliteInfo());
        
        // Satellite selectors
        document.getElementById('satellite-1').addEventListener('change', () => this.updateAnalysisButton());
        document.getElementById('satellite-2').addEventListener('change', () => this.updateAnalysisButton());
        
        // Mouse events for satellite selection
        const canvas = document.getElementById('earth-canvas');
        canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    handleCanvasClick(event) {
        const rect = event.target.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check for satellite intersections
        const satellites = Array.from(this.satellites.values());
        const intersects = this.raycaster.intersectObjects(satellites);
        
        if (intersects.length > 0) {
            const satellite = intersects[0].object;
            this.showSatelliteInfo(satellite.name);
        }
    }
    
    showSatelliteInfo(name) {
        const satellite = this.satellites.get(name);
        if (!satellite) return;
        
        // Highlight selected satellite
        if (this.selectedSatellite) {
            this.selectedSatellite.material.emissive.setHex(0x111111);
        }
        satellite.material.emissive.setHex(0x4444ff);
        this.selectedSatellite = satellite;
        
        // Show info panel
        const infoPanel = document.getElementById('satellite-info');
        infoPanel.classList.remove('hidden');
        
        // Populate with data (in a real app, this would come from the backend)
        document.getElementById('info-name').textContent = name;
        document.getElementById('info-id').textContent = 'SAT-' + Math.floor(Math.random() * 10000);
        document.getElementById('info-altitude').textContent = Math.round(satellite.userData.orbitRadius * 1000 - 5000) + ' km';
        document.getElementById('info-inclination').textContent = Math.round((satellite.userData.orbital.inclination || 45) * 10) / 10 + '°';
        document.getElementById('info-period').textContent = Math.round(2 * Math.PI / satellite.userData.orbitSpeed / 60) + ' min';
        
        const launchYear = 2000 + Math.floor(Math.random() * 22);
        document.getElementById('info-launch').textContent = `${launchYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
    }
    
    hideSatelliteInfo() {
        const infoPanel = document.getElementById('satellite-info');
        infoPanel.classList.add('hidden');
        
        if (this.selectedSatellite) {
            this.selectedSatellite.material.emissive.setHex(0x111111);
            this.selectedSatellite = null;
        }
    }
    
    initCameraControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        const canvas = document.getElementById('earth-canvas');
        
        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position);
            
            spherical.theta -= deltaMove.x * 0.01;
            spherical.phi += deltaMove.y * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
            
            this.camera.position.setFromSpherical(spherical);
            this.camera.lookAt(0, 0, 0);
            
            this.updateCoordinatesDisplay();
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoom = e.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(zoom);
            
            const distance = this.camera.position.length();
            if (distance < 8) this.camera.position.normalize().multiplyScalar(8);
            if (distance > 50) this.camera.position.normalize().multiplyScalar(50);
            
            this.updateCoordinatesDisplay();
        });
    }
    
    // Animation Loop
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        
        // Rotate Earth
        if (this.earth && this.rotationEnabled) {
            this.earth.rotation.y += 0.001;
        }
        
        // Animate stars
        if (this.stars && this.stars.material.uniforms) {
            this.stars.material.uniforms.time.value = time;
        }
        
        // Animate satellites
        this.satellites.forEach((satellite, name) => {
            if (satellite.userData.orbitSpeed) {
                satellite.userData.orbitAngle += satellite.userData.orbitSpeed;
                
                const radius = satellite.userData.orbitRadius;
                const angle = satellite.userData.orbitAngle;
                const inclination = (satellite.userData.orbital.inclination || 0) * Math.PI / 180;
                
                satellite.position.set(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * Math.sin(inclination) * radius,
                    Math.sin(angle) * Math.cos(inclination) * radius
                );
            }
        });
        
        // Update mission time
        this.updateMissionTime();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    updateCoordinatesDisplay() {
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(this.camera.position);
        
        const lat = (Math.PI / 2 - spherical.phi) * 180 / Math.PI;
        const lon = ((spherical.theta * 180 / Math.PI) + 360) % 360 - 180;
        const alt = (spherical.radius - 5) * 1000;
        
        document.getElementById('lat-value').textContent = `${lat.toFixed(2)}°`;
        document.getElementById('lon-value').textContent = `${lon.toFixed(2)}°`;
        document.getElementById('alt-value').textContent = `${Math.max(0, alt).toFixed(0)} km`;
    }
    
    updateMissionTime() {
        const elapsed = Date.now() - this.missionStartTime;
        const seconds = Math.floor(elapsed / 1000) % 60;
        const minutes = Math.floor(elapsed / (1000 * 60)) % 60;
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        
        document.getElementById('mission-time').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    startMissionTimer() {
        setInterval(() => {
            const now = new Date();
            document.getElementById('system-time').textContent = 
                `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}:${now.getUTCSeconds().toString().padStart(2, '0')} UTC`;
        }, 1000);
    }
    
    // API Integration
    async loadSatelliteData() {
        try {
            this.showLoading('Loading satellite data...');
            console.log("Fetching satellite list from:", `${this.API_BASE}/list`);
            
            const response = await fetch(`${this.API_BASE}/list`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.satelliteData = data.satellites || [];
            
            // Filter prominent satellites
            this.prominentSatellites = this.satelliteData.filter(sat => 
                this.PROMINENT_SATELLITES.some(prominent => 
                    sat.toLowerCase().includes(prominent.toLowerCase())
                )
            );
            
            // Ensure we have enough satellites
            if (this.prominentSatellites.length < 5) {
                const additional = this.satelliteData.slice(0, Math.max(0, 5 - this.prominentSatellites.length));
                this.prominentSatellites = [...this.prominentSatellites, ...additional];
            }
            
            this.updateSatelliteStats(data.count || this.satelliteData.length);
            this.populateSelectors();
            this.createSatelliteVisualizations();
            this.updateConnectionStatus(true);
            this.addSystemLog(`Loaded ${this.satelliteData.length} satellite objects`, 'success');


            
        } catch (error) {
            console.error('Failed to load satellite data:', error);
            this.handleBackendError(error);
            // Use mock data as fallback
            this.useMockSatelliteData();
        } finally {
            this.hideLoading();
        }
    }
    
    handleBackendError(error) {
        let message = 'Failed to connect to backend server';
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            message = 'Backend server not running on localhost:5000';
        } else if (error.message.includes('HTTP')) {
            message = `Backend error: ${error.message}`;
        }
        
        this.showAlert('Connection Error', message, 'error');
        this.updateConnectionStatus(false);
        this.addSystemLog(`Backend connection failed: ${error.message}`, 'error');
    }
    
    useMockSatelliteData() {
        // Fallback mock data when backend is unavailable
        this.satelliteData = [
            'ISS (ZARYA)',
            'HUBBLE SPACE TELESCOPE',
            'STARLINK-1007',
            'STARLINK-1019',
            'NOAA-20',
            'GOES-16',
            'SENTINEL-1A',
            'LANDSAT-8',
            'TERRA',
            'AQUA'
        ];
        
        this.prominentSatellites = this.satelliteData.slice(0, 5);
        
        this.updateSatelliteStats(this.satelliteData.length);
        this.populateSelectors();
        this.createSatelliteVisualizations();
        this.updateConnectionStatus(false);
        this.addSystemLog('Using mock satellite data (backend unavailable)', 'warning');
    }
    
    populateSelectors() {
        const sat1Select = document.getElementById('satellite-1');
        const sat2Select = document.getElementById('satellite-2');
        
        // Clear existing options
        sat1Select.innerHTML = '<option value="">Select satellite...</option>';
        sat2Select.innerHTML = '<option value="">Select satellite...</option>';
        
        const satellitesToShow = this.showAllSatellites ? this.satelliteData : this.prominentSatellites;
        
        satellitesToShow.forEach(satellite => {
            const option1 = new Option(satellite, satellite);
            const option2 = new Option(satellite, satellite);
            sat1Select.add(option1);
            sat2Select.add(option2);
        });
    }
    
    createSatelliteVisualizations() {
        // Clear existing satellites
        this.satellites.forEach(sat => this.scene.remove(sat));
        this.orbits.forEach(orbit => this.scene.remove(orbit));
        this.satellites.clear();
        this.orbits.clear();
        
        // Create visual representations for prominent satellites
        this.prominentSatellites.slice(0, 5).forEach((satName, index) => {
            const orbitalData = {
                altitude: 400 + index * 150,
                inclination: index * 30,
                longitude: index * 72
            };
            
            const satellite = this.createSatellite(satName, orbitalData);
            const orbit = this.createOrbitPath(satellite);
            
            this.satellites.set(satName, satellite);
            this.orbits.set(satName, orbit);
        });
        
        document.getElementById('visible-sats').textContent = this.satellites.size;
    }
    
    async analyzeCollision() {
    const sat1 = document.getElementById('satellite-1').value;
    const sat2 = document.getElementById('satellite-2').value;
    
    if (!sat1 || !sat2) {
        this.showAlert('Selection Required', 'Please select both satellites for analysis', 'warning');
        return;
    }
    
    if (sat1 === sat2) {
        this.showAlert('Invalid Selection', 'Please select two different satellites', 'warning');
        return;
    }
    
    try {
        this.showLoading('Analyzing orbital trajectories...');
        this.addSystemLog(`Analyzing collision risk: ${sat1} ↔ ${sat2}`, 'warning');
        
        const response = await fetch(`${this.API_BASE}/predict?sat1=${encodeURIComponent(sat1)}&sat2=${encodeURIComponent(sat2)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        this.displayAnalysisResults(data);

        // AI SUMMARY AREA AFAJWFA"
        document.getElementById("approach-time").textContent = data.closest_approach_time 
            ? new Date(data.closest_approach_time).toUTCString()
            : "--";

        const riskLevel = document.querySelector("#risk-indicator .risk-level");
        riskLevel.textContent = data.risk_category;
        riskLevel.className = `risk-level ${data.risk_category.toLowerCase()}`;

        const riskPercentage = document.querySelector("#risk-indicator .risk-percentage");
        riskPercentage.textContent = data.risk_message || "N/A";

        this.addSystemLog(`Analysis complete - Min distance: ${data.min_distance_km.toFixed(2)} km`, 'success');
        
    } catch (error) {
        console.error('Collision analysis failed:', error);
        // Fallback to mock analysis
        this.performMockAnalysis(sat1, sat2);
    } finally {
        this.hideLoading();
    }
}

    
    performMockAnalysis(sat1, sat2) {
        // Mock analysis when backend is unavailable
        const mockDistance = Math.random() * 1000 + 50;
        const mockData = {
            min_distance_km: mockDistance,
            time_to_approach: Date.now() + (Math.random() * 86400000),
            satellite_1: sat1,
            satellite_2: sat2
        };
        
        this.displayAnalysisResults(mockData);
        this.showAlert('Mock Analysis', 'Backend unavailable - showing simulated results', 'warning');
        this.addSystemLog('Mock analysis performed (backend offline)', 'warning');
    }
    
  displayAnalysisResults(data) {
    // Minimum distance
    document.getElementById('min-distance').textContent =
        `${data.min_distance_km.toFixed(2)} km`;

    // Closest approach time (from backend)
    let approachTime = "--";
    if (data.closest_approach_time) {
        const dt = new Date(data.closest_approach_time);
        approachTime = dt.toUTCString();
    } else {
        // fallback estimate if backend didn’t provide
        approachTime = this.calculateTimeToApproach(data.min_distance_km);
    }
    document.getElementById('approach-time').textContent = approachTime;

    // Risk assessment (use backend if provided, else fallback)
    const riskLevel = data.risk_category || this.calculateRiskLevel(data.min_distance_km);
    const riskMessage = data.risk_message || "No message available";
    const riskPercentage = this.calculateRiskPercentage(data.min_distance_km);

    // Update risk indicator UI
    const riskLevelEl = document.querySelector("#risk-indicator .risk-level");
    riskLevelEl.textContent = riskLevel;
    riskLevelEl.className = `risk-level ${riskLevel.toLowerCase()}`;

    const riskPercentageEl = document.querySelector("#risk-indicator .risk-percentage");
    riskPercentageEl.textContent = `${riskPercentage}%`;

    // Professional AI-style narrative with formatting
    const actionMessage = (() => {
        if (riskLevel === "SAFE") return "No immediate action is required.";
        if (riskLevel === "CAUTION") return "Monitoring is advised as the satellites will pass relatively close.";
        if (riskLevel === "WARNING" || riskLevel === "DANGER") return "Mission control should monitor trajectories closely.";
        if (riskLevel === "CRITICAL") return "Immediate evasive maneuvers may be required to mitigate collision risk.";
        return "";
    })();

    const aiMessage = `
        <strong>Closest Approach:</strong> ${approachTime}<br>
        <strong>Minimum Distance:</strong> ${data.min_distance_km.toFixed(2)} km<br>
        <strong>Collision Risk:</strong> ${riskLevel} (${riskPercentage}% probability)<br>
        <br>
        ${riskMessage} ${actionMessage}
    `;

    // Update AI narrative section (now using innerHTML for formatting)
    document.getElementById('ai-narrative-text').innerHTML = aiMessage;

    // Show results panel
    document.getElementById('results-panel').style.display = 'block';
   }

    calculateTimeToApproach(distance) {
        const avgOrbitalSpeed = 7.8;
        const timeInSeconds = distance / avgOrbitalSpeed;
        
        if (timeInSeconds < 60) return `${Math.round(timeInSeconds)}s`;
        if (timeInSeconds < 3600) return `${Math.round(timeInSeconds / 60)}m`;
        return `${Math.round(timeInSeconds / 3600)}h`;
    }
    
    calculateRiskLevel(distance) {
        if (distance < 10) return 'CRITICAL';
        if (distance < 50) return 'DANGER';
        if (distance < 100) return 'WARNING';
        if (distance < 500) return 'CAUTION';
        return 'SAFE';
    }
    
    calculateRiskPercentage(distance) {
        if (distance < 1) return 95;
        if (distance < 5) return 85;
        if (distance < 10) return 70;
        if (distance < 25) return 45;
        if (distance < 50) return 25;
        if (distance < 100) return 10;
        if (distance < 500) return 3;
        return 1;
    }
    
    async refreshTLEData() {
        try {
            this.showLoading('Refreshing TLE data...');
            this.addSystemLog('Refreshing satellite data from CelesTrak', 'info');
            
            const response = await fetch(`${this.API_BASE}/refresh`, { method: 'POST' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.addSystemLog(`TLE data refreshed successfully: ${data.count} objects`, 'success');
            
            // Reload satellite data
            await this.loadSatelliteData();
            
        } catch (error) {
            console.error('Failed to refresh TLE data:', error);
            this.showAlert('Refresh Failed', 'Could not refresh satellite data', 'error');
            this.addSystemLog('TLE refresh failed', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // Utility Methods
    showLoading(message) {
        document.getElementById('loading-text').textContent = message;
        document.getElementById('loading-overlay').classList.remove('hidden');
    }
    
    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }
    
    showAlert(title, message, type) {
        // In a real implementation, you would use a proper alert system
        alert(`${title}: ${message}`);
    }
    
    updateSatelliteStats(count) {
        document.getElementById('total-sats').textContent = count;
    }
    
    updateConnectionStatus(isConnected) {
        const statusEl = document.getElementById('connection-status');
        statusEl.className = isConnected ? 'status-indicator connected' : 'status-indicator disconnected';
    }
    
    addSystemLog(message, type = 'info') {
        const logContainer = document.getElementById('system-log');
        const timestamp = new Date().toLocaleTimeString();
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-message">${message}</span>
        `;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Keep only last 50 entries
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }
    
    updateAnalysisButton() {
        const sat1 = document.getElementById('satellite-1').value;
        const sat2 = document.getElementById('satellite-2').value;
        const analyzeBtn = document.getElementById('analyze-btn');
        
        analyzeBtn.disabled = !sat1 || !sat2 || sat1 === sat2;
    }
    
    // Control Methods
    toggleRotation() {
        this.rotationEnabled = !this.rotationEnabled;
        const btn = document.getElementById('pause-rotation');
        btn.textContent = this.rotationEnabled ? 'Pause Rotation' : 'Resume Rotation';
        
        this.addSystemLog(`Earth rotation ${this.rotationEnabled ? 'enabled' : 'paused'}`, 'info');
    }
    
    resetCamera() {
        this.camera.position.set(0, 0, 15);
        this.camera.lookAt(0, 0, 0);
        this.updateCoordinatesDisplay();
        this.addSystemLog('Camera position reset', 'info');
    }
    
    toggleOrbits() {
        this.orbitsVisible = !this.orbitsVisible;
        this.orbits.forEach(orbit => {
            orbit.visible = this.orbitsVisible;
        });
        
        this.addSystemLog(`Orbit paths ${this.orbitsVisible ? 'enabled' : 'disabled'}`, 'info');
    }
    
    toggleFullscreen() {
        const canvas = document.getElementById('earth-canvas');
        if (!document.fullscreenElement) {
            canvas.requestFullscreen().catch(err => {
                console.error('Fullscreen failed:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    toggleAllSatellites(showAll) {
        this.showAllSatellites = showAll;
        this.populateSelectors();
        this.addSystemLog(`Satellite list ${showAll ? 'expanded' : 'filtered'}`, 'info');
    }
    
    handleKeyboard(event) {
        switch(event.key) {
            case ' ':
                event.preventDefault();
                this.toggleRotation();
                break;
            case 'r':
            case 'R':
                this.resetCamera();
                break;
            case 'o':
            case 'O':
                this.toggleOrbits();
                break;
            case 'f':
            case 'F':
                this.toggleFullscreen();
                break;
        }
    }
    
    onWindowResize() {
        const canvas = document.getElementById('earth-canvas');
        const container = canvas.parentElement;
        
        if (!container || !this.camera || !this.renderer) return;
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    // Cleanup
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Initialize the application
let satelliteApp;

function initializeSatelliteApp() {
    try {
        satelliteApp = new SatelliteCollisionPredictor();
    } catch (error) {
        console.error('Failed to initialize Satellite Collision Predictor:', error);
        alert(`Initialization failed: ${error.message}`);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSatelliteApp);
} else {
    initializeSatelliteApp();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (satelliteApp) {
        satelliteApp.destroy();
    }
});