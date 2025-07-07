import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Global variables for Three.js components
let scene, camera, renderer, controls;
let skillsData;
let skillPoints = [];
let skillLabels = [];
let labelRenderer;
let sphereRadius = 100;
let colorMap = {};
let isSkillsInit = false;

// Interaction variables
let raycaster, mouse;
let hoveredPoint = null;
let tooltipElement;
let lineSegments = null;

// Animation and state variables
let animationSpeed = 0.001;
let isAnimating = true;
let frameId = null;

// Loading variables
let loadingManager;
let loadingScreen;
let isLoading = true;

/**
 * Updated init function with proper event setup order
 */
async function init() {
    if (isSkillsInit) cleanup();
    isSkillsInit = true;
    
    // Setup loading screen
    setupLoadingScreen();
    
    // Create the Three.js scene, camera, and renderer
    createScene();
    
    // Setup raycaster for mouse/touch interaction
    setupInteraction();
    
    // Load the skills data from JSON file
    await loadSkillsData();
    
    // Create the skills sphere with points and connections
    createSkillsSphere();
    
    // Setup event listeners for Three.js interaction
    setupEventListeners();
    
    // IMPORTANT: Setup skill list listeners AFTER sphere creation
    setupSkillListListeners();
    
    // Hide loading screen when everything is ready
    hideLoadingScreen();
    
    // Start the animation loop
    animate();
}

/**
 * Setup loading screen to provide visual feedback during initialization
 */
function setupLoadingScreen() {
    // Create loading screen container
    loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    
    // Create loading text
    const loadingText = document.createElement('h2');
    loadingText.textContent = 'Loading Skills Visualization...';
    loadingText.id = 'loading-text';
    
    // Create progress bar container
    const progressContainer = document.createElement('div');
    progressContainer.id = 'loading-progress-container';
    
    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.id = 'loading-progress';
    
    // Assemble loading screen elements
    progressContainer.appendChild(progressBar);
    loadingScreen.appendChild(loadingText);
    loadingScreen.appendChild(progressContainer);
    document.body.appendChild(loadingScreen);
    
    // Setup Three.js loading manager to track loading progress
    loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
        const progress = (itemsLoaded / itemsTotal) * 100;
        document.getElementById('loading-progress').style.width = progress + '%';
    };
    
    loadingManager.onLoad = function() {
        isLoading = false;
    };
}

/**
 * Hide loading screen with a fade-out animation
 */
function hideLoadingScreen() {
    // Add a slight delay to ensure everything is ready
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.5s ease-in-out';
        
        setTimeout(() => {
            document.body.removeChild(loadingScreen);
        }, 500);
    }, 500);
}

/**
 * Setup event listeners for user interaction
 */
function setupEventListeners() {
    // Window resize event to handle responsive layout
    window.addEventListener('resize', onWindowResize, false);
    
    // Mouse move for hover effects
    window.addEventListener('mousemove', onMouseMove, false);
    
    // Touch events for mobile devices
    window.addEventListener('touchstart', onTouchMove, false);
    window.addEventListener('touchmove', onTouchMove, false);
    
    // Toggle animation button
    const toggleAnimationBtn = document.getElementById('toggle-animation');
    if (toggleAnimationBtn) {
        toggleAnimationBtn.addEventListener('click', toggleAnimation);
    }
}

/**
 * Toggle animation on/off
 */
function toggleAnimation() {
    console.log('Toggling animation:', isAnimating);
    isAnimating = !isAnimating;
    const toggleAnimationBtn = document.getElementById('toggle-animation');
    if (toggleAnimationBtn) {
        toggleAnimationBtn.textContent = isAnimating ? 'Pause Rotation' : 'Start Rotation';
    }
}

/**
 * Setup raycaster for mouse/touch interaction
 */
function setupInteraction() {
    // Create raycaster for detecting intersections between mouse and objects
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Create tooltip element for displaying skill details
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'tooltip';
    document.body.appendChild(tooltipElement);
}

/**
 * Enhanced mouse move handler with better conflict prevention
 */
function onMouseMove(event) {
    // Get the renderer's canvas bounding rectangle
    const rect = renderer.domElement.getBoundingClientRect();
    
    // Calculate mouse position relative to the canvas
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Check for intersections with skill points
    checkIntersection(event);
}


/**
 * Enhanced touch move handler with better mobile support
 */
function onTouchMove(event) {
    if (event.touches.length > 0) {
        // Get the renderer's canvas bounding rectangle for touch events
        const rect = renderer.domElement.getBoundingClientRect();
        // Calculate touch position relative to the canvas
        const touch = event.touches[0];
        mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        // Check for intersections with skill points
        checkIntersection(touch);
    }
}

/**
 * Updated checkIntersection function with conflict prevention
 */
function checkIntersection(event) {
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(skillPoints);
    
    // Reset previously hovered point (only if not highlighted from HTML)
    if (hoveredPoint && (!intersects.length || intersects[0].object !== hoveredPoint)) {
        // Only reset if not highlighted from HTML
        if (!hoveredPoint.userData.highlightedFromHTML) {
            hoveredPoint.material.emissive.setHex(0x000000);
            hoveredPoint.material.emissiveIntensity = 0;
            hoveredPoint.scale.set(1, 1, 1);
        }
        hoveredPoint = null;
        tooltipElement.style.display = 'none';
        document.body.style.cursor = 'default';
    }
    
    // Set new hovered point
    if (intersects.length > 0) {
        const newHoveredPoint = intersects[0].object;
        
        // Only highlight if not already highlighted from HTML
        if (!newHoveredPoint.userData.highlightedFromHTML) {
            hoveredPoint = newHoveredPoint;
            hoveredPoint.material.emissive.setHex(0xffffff);
            hoveredPoint.material.emissiveIntensity = 0.5;
            hoveredPoint.scale.set(1.5, 1.5, 1.5);
            document.body.style.cursor = 'pointer';
            
            // Update tooltip content
            const userData = hoveredPoint.userData;
            tooltipElement.innerHTML = `
                <strong>${userData.name}</strong><br>
                Level: ${userData.level}<br>
                Area: ${userData.area}
            `;
            tooltipElement.style.display = 'block';
            
            // Position tooltip near the mouse/touch point
            const clientX = event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
            const clientY = event.clientY || (event.touches && event.touches[0] ? event.touches[0].clientY : 0);
            
            tooltipElement.style.left = (clientX + 15) + 'px';
            tooltipElement.style.top = (clientY + 15) + 'px';
        }
    }
}


/**
 * Load the skills data from JSON file
 * Uses aboutSketchPalette colors if available (as in particle-bg.js)
 */
async function loadSkillsData() {
    try {
        // Fetch skills data from JSON file
        const response = await fetch('assets/skills_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        skillsData = data.person;

        // Generate color map for each technology area
        const areas = Object.keys(skillsData);

        // Use aboutSketchPalette colors if available, fallback to aboutColors.json
        let colors = null;
        if (window.aboutSketchPalette && window.aboutSketchPalette.color1) {
            // Use color1 array from aboutSketchPalette
            colors = window.aboutSketchPalette.color1.map(c => {
                let hex = c.replace('#', '');
                if (hex.length === 8) hex = hex.substring(0, 6);
                if (hex.length === 4) hex = hex.substring(0, 3);
                return '#' + hex;
            });
        } else {
            // Fallback: fetch aboutColors.json and use a random palette
            const colorResponse = await fetch('assets/aboutColors.json');
            if (!colorResponse.ok) {
                throw new Error(`HTTP error loading colors! status: ${colorResponse.status}`);
            }
            const colorData = await colorResponse.json();
            const colorArrays = Object.entries(colorData)
                .filter(([key, value]) => key.startsWith('colors') && !key.endsWith('2') && Array.isArray(value))
                .map(([key, value]) => value);
            colors = colorArrays[Math.floor(Math.random() * colorArrays.length)].map(c => {
                let hex = c.replace('#', '');
                if (hex.length === 8) hex = hex.substring(0, 6);
                if (hex.length === 4) hex = hex.substring(0, 3);
                return '#' + hex;
            });
        }

        // Assign colors to each technology area
        areas.forEach((area, index) => {
            colorMap[area] = colors[index % colors.length];
        });

        // Create legend with color indicators
        createLegend();
    } catch (error) {
        console.error('Error loading skills data:', error);
        // Show error message to user
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.innerHTML = `<h3>Error Loading Data</h3><p>${error.message}</p>`;
        document.body.appendChild(errorMsg);
    }
}

/**
 * Create the legend with color indicators for each technology area
 */
function createLegend() {
    const legendElement = document.getElementById('legend');
    if (!legendElement) return;
    
    legendElement.innerHTML = '<h3>Technology Areas</h3>';
    
    // Create legend items for each technology area
    Object.entries(colorMap).forEach(([area, color]) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = color;
        colorBox.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.5)';
        
        const areaText = document.createElement('span');
        areaText.textContent = area;
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(areaText);
        legendElement.appendChild(legendItem);
        
        // Add hover effect to highlight skills in this area
        legendItem.addEventListener('mouseenter', () => {
            // Highlight all skills in this area
            skillPoints.forEach(point => {
                if (point.userData.area === area) {
                    point.material.emissive.setHex(0xffffff);
                    point.material.emissiveIntensity = 0.5;
                    point.scale.set(1.5, 1.5, 1.5);
                }
            });
        });
        
        legendItem.addEventListener('mouseleave', () => {
            // Reset highlighting
            skillPoints.forEach(point => {
                if (point.userData.area === area && point !== hoveredPoint) {
                    point.material.emissive.setHex(0x000000);
                    point.material.emissiveIntensity = 0;
                    point.scale.set(1, 1, 1);
                }
            });
        });
    });
}

/**
 * Create the Three.js scene, camera, and renderer
 */
function createScene() {
    // Create scene with dark background
    scene = new THREE.Scene();


    // Use the correct container for dynamic component
    const skillsSphereContainer = document.getElementById('skills-sphere');
    if (!skillsSphereContainer) {
        console.error('Skills sphere container not found!');
        return;
    }
    const width = skillsSphereContainer.clientWidth;
    const height = skillsSphereContainer.clientHeight;

    // Log container size for debugging
    console.log('[skills_visualization] skills-sphere container size:', width, height);

    // Create perspective camera with correct aspect ratio
    camera = new THREE.PerspectiveCamera(
        60, // Field of view
        width / height, // Aspect ratio
        1, // Near clipping plane
        1000 // Far clipping plane
    );
    camera.position.z = 250;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Create WebGL renderer with antialiasing and high performance settings
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: 'high-performance',
        alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '0';
    skillsSphereContainer.style.position = 'relative';
    skillsSphereContainer.appendChild(renderer.domElement);

    // Create CSS2D renderer for text labels
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.width = '100%';
    labelRenderer.domElement.style.height = '100%';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelRenderer.domElement.style.zIndex = '1';
    skillsSphereContainer.appendChild(labelRenderer.domElement);

    // Add orbit controls for camera interaction
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.7;
    controls.minDistance = sphereRadius * 1.1;
    controls.maxDistance = sphereRadius * 3;

    // Make controls available globally for UI controls
    window.camera = camera;
    window.controls = controls;

    // Add lighting to the scene
    setupLighting();
}

function onWindowResize() {
    const skillsSphereContainer = document.getElementById('skills-sphere');
    if (!skillsSphereContainer) return;
    
    const width = skillsSphereContainer.clientWidth;
    const height = skillsSphereContainer.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    labelRenderer.setSize(width, height);

    // Adjust for mobile devices
    if (width < 768) {
        camera.fov = 70;
        camera.updateProjectionMatrix();
        document.querySelectorAll('.label').forEach(label => {
            label.style.fontSize = '10px';
        });
    } else {
        camera.fov = 60;
        camera.updateProjectionMatrix();
        document.querySelectorAll('.label').forEach(label => {
            label.style.fontSize = '12px';
        });
    }
}


/**
 * Setup lighting for the scene
 */
function setupLighting() {
    // Add ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light for shadows and highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add colored point lights for visual interest
    const pointLight1 = new THREE.PointLight(0x3357FF, 0.5, 300);
    pointLight1.position.set(100, 100, 100);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xFF5733, 0.5, 300);
    pointLight2.position.set(-100, -100, -100);
    scene.add(pointLight2);
}

/**
 * Create the skills sphere with dots and connections
 */
function createSkillsSphere() {
    // Create a wireframe sphere for reference
    const isDarkMode = document.body.classList.contains('dark-mode');
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: isDarkMode ? 0xffffff : 0x333333,
        wireframe: true,
        transparent: true,
        opacity: 0.1
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);
    
    // Process skills data and create points
    let skillIndex = 0;
    const totalSkills = Object.values(skillsData).reduce(
        (sum, skills) => sum + skills.length, 0
    );
    
    // Create points for each skill
    Object.entries(skillsData).forEach(([area, skills]) => {
        skills.forEach(skillObj => {
            const skillName = Object.keys(skillObj)[0];
            const skillLevel = skillObj[skillName];
            
            // Calculate position using fibonacci sphere distribution
            const position = fibonacciSpherePoint(skillIndex, totalSkills, sphereRadius);
            
            // Create skill point with size based on skill level
            let pointSize = 2;
            switch(skillLevel) {
                case 'Expert': pointSize = 5; break;
                case 'Advanced': pointSize = 4; break;
                case 'Intermediate': pointSize = 3; break;
                case 'Beginner': pointSize = 2; break;
                default: pointSize = 2;
            }
            
            // Create sphere geometry for the skill point
            const pointGeometry = new THREE.SphereGeometry(pointSize, 16, 16);
            const pointMaterial = new THREE.MeshPhongMaterial({ 
                color: colorMap[area],
                shininess: 100,
                specular: 0x111111
            });
            const point = new THREE.Mesh(pointGeometry, pointMaterial);
            point.position.set(position.x, position.y, position.z);
            
            // Store skill data in the point's userData for interaction
            point.userData = {
                name: skillName,
                level: skillLevel,
                area: area,
                index: skillIndex
            };
            scene.add(point);
            skillPoints.push(point);
            
            // Create text label for the skill
            const labelDiv = document.createElement('div');
            labelDiv.className = 'label';
            labelDiv.textContent = skillName;
            
            const label = new CSS2DObject(labelDiv);
            label.position.copy(point.position);
            scene.add(label);
            skillLabels.push(label);
            
            skillIndex++;
        });
    });
    
    // Create connections between skills in the same area using LineSegments for better performance
    createSkillConnections();
}

/**
 * Create connections between skills in the same technology area
 */
function createSkillConnections() {
    const linePositions = [];
    const lineColors = [];

    // For each area, connect all points in that area with lines colored as the skill point color
    Object.entries(skillsData).forEach(([area, skills]) => {
        // Get all points in this area
        const areaPoints = skillPoints.filter(point => point.userData.area === area);
        // Create lines connecting points in the same area
        for (let i = 0; i < areaPoints.length; i++) {
            for (let j = i + 1; j < areaPoints.length; j++) {
                // Add line vertices
                linePositions.push(
                    areaPoints[i].position.x, areaPoints[i].position.y, areaPoints[i].position.z,
                    areaPoints[j].position.x, areaPoints[j].position.y, areaPoints[j].position.z
                );
                // Add line colors: use the color of the two skill points being connected
                const colorA = new THREE.Color(areaPoints[i].material.color);
                const colorB = new THREE.Color(areaPoints[j].material.color);
                lineColors.push(
                    colorA.r, colorA.g, colorA.b,
                    colorB.r, colorB.g, colorB.b
                );
            }
        }
    });

    // Create the line segments geometry
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

    // Create the line material
    const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        linewidth: 1
    });

    // Create the line segments and add to scene
    lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);
}

/**
 * Calculate point position using Fibonacci sphere distribution algorithm
 * This creates an evenly distributed set of points on a sphere
 * 
 * @param {number} index - Index of the point
 * @param {number} total - Total number of points
 * @param {number} radius - Radius of the sphere
 * @returns {Object} Position coordinates {x, y, z}
 */
function fibonacciSpherePoint(index, total, radius) {
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    const y = 1 - (index / (total - 1)) * 2; // y goes from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y); // radius at y
    
    const theta = phi * index; // Golden angle increment
    
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    
    return {
        x: x * radius,
        y: y * radius,
        z: z * radius
    };
}

/**
 * Animation loop
 * Updates the scene and renders each frame
 */
function animate() {
    frameId = requestAnimationFrame(animate);
    
    // Update orbit controls
    if (controls){
    controls.update();
    }
    // Auto-rotate the scene if animation is enabled
    if (isAnimating) {
        scene.rotation.y += animationSpeed;
    }
    
    // Update label visibility based on distance to camera
    updateLabelVisibility();
    
    // Render scene
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

/**
 * Update label visibility based on distance to camera
 * Shows labels only for points that are closer to the camera
 */
function updateLabelVisibility() {
    skillLabels.forEach((label, index) => {
        const point = skillPoints[index];
        const distance = camera.position.distanceTo(point.position);
        
        // Show labels only for points that are closer to the camera
        if (distance < 200) {
            // Fade in/out based on distance
            const opacity = 1 - (distance - 100) / 100;
            label.element.style.opacity = Math.max(0.1, Math.min(1, opacity));
        } else {
            label.element.style.opacity = 0;
        }
    });
}


function cleanup() {
    if (frameId) {
        cancelAnimationFrame(frameId);
    }

    // Remove event listeners
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('touchstart', onTouchMove);
    window.removeEventListener('touchmove', onTouchMove);
    
    // Remove skill list event listeners
    document.querySelectorAll('.skill-item').forEach(item => {
        // Clone and replace to remove all event listeners
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
    });

    // Remove all children from the scene and dispose their geometries/materials
    if (scene) {
        while (scene.children.length > 0) {
            const obj = scene.children[0];
            scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        }
    }

    // Remove renderer's canvas and labelRenderer's DOM element from the container
    const skillsSphereContainer = document.getElementById('skills-sphere');
    if (skillsSphereContainer) {
        if (renderer && renderer.domElement && skillsSphereContainer.contains(renderer.domElement)) {
            skillsSphereContainer.removeChild(renderer.domElement);
        }
        if (labelRenderer && labelRenderer.domElement && skillsSphereContainer.contains(labelRenderer.domElement)) {
            skillsSphereContainer.removeChild(labelRenderer.domElement);
        }
    }

    // Dispose of renderers
    if (renderer) renderer.dispose();
    // CSS2DRenderer does not have a dispose method, but clear reference
    labelRenderer = null;

    // Remove tooltip
    if (tooltipElement && tooltipElement.parentNode) {
        tooltipElement.parentNode.removeChild(tooltipElement);
    }

    // Clear arrays and references
    skillPoints = [];
    skillLabels = [];
    lineSegments = null;
    hoveredPoint = null;
    scene = null;
    renderer = null;
}

/**
 * Setup event listeners for HTML skill list items
 * This function should be called AFTER the Three.js sphere is created
 */
function setupSkillListListeners() {
    document.querySelectorAll('.skill-item').forEach(item => {
        const skillNameElement = item.querySelector('.skill-name');
        if (!skillNameElement) return;
        
        const skillName = skillNameElement.textContent.trim();
        
        // Desktop hover events
        item.addEventListener('mouseenter', (e) => {
            highlightSphereSkill(skillName, true);
        });
        
        item.addEventListener('mouseleave', (e) => {
            highlightSphereSkill(skillName, false);
        });
        
        // Mobile touch events for better mobile experience
        item.addEventListener('touchstart', (e) => {
            highlightSphereSkill(skillName, true);
        });
        
        item.addEventListener('touchend', (e) => {
            // Add a small delay to show the highlight effect
            setTimeout(() => {
                highlightSphereSkill(skillName, false);
            }, 150);
        });
        
        // Additional touch cancel event for better mobile handling
        item.addEventListener('touchcancel', (e) => {
            highlightSphereSkill(skillName, false);
        });
    });
}


/**
 * Highlight corresponding skill point in the sphere
 * Enhanced with conflict prevention and better matching
 */
function highlightSphereSkill(skillName, highlight) {
    if (!skillPoints || skillPoints.length === 0) return;
    
    // Find matching skill points with improved name matching
    const matchingPoints = skillPoints.filter(point => {
        if (!point.userData || !point.userData.name) return false;
        
        const pointName = point.userData.name.toLowerCase().trim();
        const searchName = skillName.toLowerCase().trim();
        
        // Exact match first
        if (pointName === searchName) return true;
        
        // Partial match for complex skill names
        if (pointName.includes(searchName) || searchName.includes(pointName)) return true;
        
        // Handle special cases like database names
        if (searchName.includes('database') && pointName.includes('database')) return true;
        if (searchName.includes('sql') && pointName.includes('sql')) return true;
        
        return false;
    });
    
    // Apply highlighting to all matching points
    matchingPoints.forEach(point => {
        if (highlight) {
            // Store original state for restoration
            if (!point.userData.originalEmissive) {
                point.userData.originalEmissive = point.material.emissive.getHex();
                point.userData.originalScale = point.scale.clone();
            }
            
            // Apply highlight effect
            point.material.emissive.setHex(0xffffff);
            point.material.emissiveIntensity = 0.7;
            point.scale.set(1.5, 1.5, 1.5);
            
            // Mark as highlighted from HTML to prevent raycaster conflicts
            point.userData.highlightedFromHTML = true;
        } else {
            // Restore original state
            if (point.userData.originalEmissive !== undefined) {
                point.material.emissive.setHex(point.userData.originalEmissive);
                point.material.emissiveIntensity = 0;
                point.scale.copy(point.userData.originalScale);
            }
            
            // Clear HTML highlight flag
            point.userData.highlightedFromHTML = false;
        }
    });
}

    // Dispose of renderers
    if (renderer) renderer.dispose();

    // Remove tooltip
    if (tooltipElement && tooltipElement.parentNode) {
        tooltipElement.parentNode.removeChild(tooltipElement);
    }

    // Clear skillPoints, skillLabels, and lineSegments
    skillPoints = [];
    skillLabels = [];
    lineSegments = null;
    hoveredPoint = null;
    // Optionally reset colorMap if you want to force reload
    // colorMap = {};

// Add cleanup on page unload to prevent memory leaks
window.addEventListener('unload', cleanup);

// Start the visualization when the page loads
window.addEventListener('load', init);

// Listen for dark mode toggling and reload visualization colors
document.addEventListener('darkModeToggled', () => {
    // Re-initialize the visualization with new palette
    setTimeout(() => {
        init();
    }, 100); // slight delay to allow aboutSketchPalette to update
});