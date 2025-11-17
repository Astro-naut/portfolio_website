// Loader Animation
function initLoader() {
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('main-content');
    
    // Check navigation type using Performance Navigation API
    const navigationType = performance.getEntriesByType('navigation')[0]?.type || 
                          (performance.navigation ? 
                           (performance.navigation.type === 0 ? 'navigate' : 
                            performance.navigation.type === 1 ? 'reload' : 
                            performance.navigation.type === 2 ? 'back_forward' : 'navigate') : 
                           'navigate');
    
    // Show loader on:
    // - Initial page load (navigate)
    // - Page refresh/reload (reload)
    // - Link clicks (navigate)
    // Don't show loader on:
    // - Back/forward navigation (back_forward)
    const shouldShowLoader = navigationType === 'navigate' || navigationType === 'reload';
    
    if (shouldShowLoader) {
        // Show main content but keep it hidden behind loader
        mainContent.classList.remove('hidden');
        mainContent.classList.add('visible');
        
        // After 5 seconds, split the page
        setTimeout(() => {
            loader.classList.add('breaking');
            
            // After page splits, remove loader
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 1200);
        }, 5000);
    } else {
        // Skip loader for back/forward navigation - show content immediately
        loader.classList.add('hidden');
        mainContent.classList.remove('hidden');
        mainContent.classList.add('visible');
    }
}

// Three.js Abstract Free-Form Spiral Animation
let scene, camera, renderer, spiral;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;

function initSpiral() {
    if (typeof THREE === 'undefined') {
        console.error('Three.js failed to load');
        return;
    }

    const container = document.getElementById('spiral-container');
    if (!container) return;

    // Scene setup
    scene = new THREE.Scene();
    
    // Camera setup - side view
    camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 5);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
        alpha: true,
        antialias: true 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create abstract free-form spiral with organic variations
    const group = new THREE.Group();
    
    // Blue material for the spiral
    const material = new THREE.LineBasicMaterial({
        color: 0x4A90E2, // Blue color
        transparent: true,
        opacity: 0.6,
        linewidth: 2
    });

    // Create multiple abstract spiral curves with organic variations (flower petals)
    for (let j = 0; j < 15; j++) {
        const offset = (j - 7) * 0.04;
        const noiseOffset = j * 0.6;
        const curve = new THREE.CatmullRomCurve3(createAbstractSpiralPoints(offset, noiseOffset));
        const points = curve.getPoints(500);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        
        // Vary opacity for depth and petal layers
        const lineMaterial = material.clone();
        // Outer petals slightly more transparent, inner petals more opaque
        const petalLayer = j % 3;
        lineMaterial.opacity = 0.5 - petalLayer * 0.08;
        line.material = lineMaterial;
        
        group.add(line);
    }
    
    spiral = group;
    spiral.rotation.y = Math.PI / 4; // 45 degree tilt on vertical Y axis
    spiral.rotation.x = Math.PI / 4; // Tilt the rotation axis 45 degrees
    scene.add(spiral);

    // Mouse movement tracking for subtle interaction
    document.addEventListener('mousemove', onMouseMove);
    
    // Touch movement tracking for mobile devices
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
}

function createAbstractSpiralPoints(offset = 0, noiseOffset = 0) {
    const points = [];
    const baseRadius = 0.3; // Start smaller for flower center
    const maxRadius = 2.5; // Maximum expansion for flower petals
    const height = 6;
    const turns = 5;
    const segments = 500;

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * Math.PI * 2 * turns;
        
        // Flower opening effect - radius expands exponentially like petals opening
        const flowerOpen = Math.pow(t, 0.7); // Exponential opening curve
        const radiusExpansion = baseRadius + (maxRadius - baseRadius) * flowerOpen;
        
        // Organic variation using noise-like functions for petal irregularity
        const petalNoise = Math.sin(angle * 2 + noiseOffset) * 0.15 * flowerOpen;
        const petalWaviness = Math.cos(angle * 3 + noiseOffset * 1.5) * 0.12 * flowerOpen;
        const verticalNoise = Math.sin(t * Math.PI * 6 + noiseOffset) * 0.08 * (1 - flowerOpen);
        
        // Petal-like variations - each "petal" (turn) has slight variations
        const petalVariation = Math.sin(angle + noiseOffset * 0.5) * 0.2 * flowerOpen;
        
        // Radius with petal variations for flower-like appearance
        const r = (radiusExpansion + offset) * (1 + petalNoise + petalWaviness + petalVariation);
        
        // Add organic distortion that increases with expansion (petal edges)
        const edgeDistortion = flowerOpen * 0.25;
        const xDistortion = Math.cos(angle * 2 + noiseOffset) * edgeDistortion;
        const zDistortion = Math.sin(angle * 2 + noiseOffset * 0.8) * edgeDistortion;
        
        // Slight vertical curve upward as flower opens
        const verticalCurve = Math.sin(t * Math.PI) * 0.3 * flowerOpen;
        
        const x = r * Math.cos(angle) + xDistortion;
        const y = (t - 0.5) * height + verticalNoise + verticalCurve;
        const z = r * Math.sin(angle) + zDistortion;
        
        points.push(new THREE.Vector3(x, y, z));
    }

    return points;
}

function onMouseMove(event) {
    // Normalize mouse position to -1 to 1 range
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Calculate target rotation (subtle reaction)
    targetRotationX = mouseY * 0.08;
    targetRotationY = mouseX * 0.08;
}

// Handle touch events for mobile devices
function onTouchMove(event) {
    if (event.touches.length > 0) {
        const touch = event.touches[0];
        // Normalize touch position to -1 to 1 range
        mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
        
        // Calculate target rotation (subtle reaction)
        targetRotationX = mouseY * 0.08;
        targetRotationY = mouseX * 0.08;
    }
}

function onWindowResize() {
    const container = document.getElementById('spiral-container');
    if (!container || !camera || !renderer) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (spiral) {
        // Slow, smooth rotation
        spiral.rotation.y += 0.003;
        
        // Smooth cursor reaction using lerp
        const lerpFactor = 0.05;
        spiral.rotation.x += (targetRotationX - spiral.rotation.x) * lerpFactor;
        spiral.rotation.z += (targetRotationY - spiral.rotation.z) * lerpFactor;
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Name Toggle Function
function initNameToggle() {
    const mainName = document.querySelector('.main-name');
    if (!mainName) return;
    
    mainName.addEventListener('click', function() {
        mainName.classList.toggle('hindi-active');
    });
}

// Menu Item Click Toggle Function
function initMenuToggle() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(function(item) {
        // Only prevent default and toggle for same-page links (if needed)
        // For navigation, let the links work normally
        const href = item.getAttribute('href');
        if (href && !href.includes('.html') && !href.startsWith('http')) {
            // This is an anchor link, prevent default and toggle
            item.addEventListener('click', function(e) {
                e.preventDefault();
                item.classList.toggle('active');
            });
        } else {
            // This is a navigation link, allow normal navigation
            // Optional: You can add a class to indicate active page on load
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                // Current page is active (optional visual indicator)
                // item.classList.add('active');
            }
        }
    });
}

// Dark Theme Toggle Function
function initThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;
    
    if (!themeToggleBtn) return;
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
    }
    
    themeToggleBtn.addEventListener('click', function() {
        body.classList.toggle('dark-theme');
        
        // Save theme preference
        if (body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initLoader();
    
    // Initialize spiral immediately (it's behind the loader)
    initSpiral();
    
    // Initialize name toggle
    initNameToggle();
    
    // Initialize menu toggle
    initMenuToggle();
    
    // Initialize theme toggle
    initThemeToggle();
});
