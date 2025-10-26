const parallax_el = document.querySelectorAll('.parallax');

let xValue = 0, yValue = 0;
let animationsComplete = false;
let screenScale = 1;

// Calculate scale based on screen width
function calculateScreenScale() {
    const width = window.innerWidth;
    if (width >= 1920) {
        screenScale = 1.25; // Large screens
    } else if (width >= 1440) {
        screenScale = 1.1; // Desktop
    } else if (width >= 1024) {
        screenScale = 0.9; // Laptop
    } else if (width >= 768) {
        screenScale = 0.85; // Tablet
    } else {
        screenScale = 0.8; // Mobile
    }
}

// Initial calculation
calculateScreenScale();

// Recalculate on resize
window.addEventListener('resize', () => {
    calculateScreenScale();
    update(0);
});

    let tl = gsap.timeline({
        defaults: { ease: "power2.inOut" }
    });

function update(cursorPos) {
    // Only apply parallax if animations are complete
    if (!animationsComplete) return;

    parallax_el.forEach(el => {
        let speedX = el.dataset.speedx;
        let speedY = el.dataset.speedy || speedX;
        let speedZ = el.dataset.speedz;

        let zValue = cursorPos - parseFloat(getComputedStyle(el).left);
        let isInLeft = parseFloat(getComputedStyle(el).left) < window.innerWidth / 2 ? 1 : -1;

        // Apply screen scale to parallax elements
        el.style.transform = `translateX(calc(-50% + ${-xValue * speedX}px)) translateY(calc(-50% + ${yValue * speedY}px)) scale(${screenScale}) perspective(2300px) translateZ(${zValue * isInLeft * speedZ}px)`;
    });
}

update(0);

window.addEventListener('mousemove', (e) => {
    xValue = e.clientX - window.innerWidth / 2;
    yValue = e.clientY - window.innerHeight / 2;

    update(e.clientX);
});


// GSAP Reveal Animation
window.addEventListener('load', () => {
    // Set initial states with CSS properties to avoid transform conflicts
    gsap.set('.ui-overlay', { opacity: 0 });
    gsap.set('.bg-img', { opacity: 0 });
    gsap.set('.water', { opacity: 0, y: 600 });
    gsap.set('.mountain-0', { opacity: 0, y: 800 });
    gsap.set('.mountain-3', { opacity: 0, y: 800 });
    gsap.set('.mountain-4', { opacity: 0, y: 800 });
    gsap.set('.mountain-1', { opacity: 0, x: -1000 });
    gsap.set('.mountain-2', { opacity: 0, x: 1000 });
    gsap.set('.logo', { opacity: 0, scale: 0});
    gsap.set('.text', { opacity: 0, scale: 0.5, y: 50 });
    gsap.set('.shine-2', { opacity: 0 });
    gsap.set('.fog-0', { opacity: 0 });
    gsap.set('.fog-1', { opacity: 0 });
    gsap.set('.fog-2', { opacity: 0 });
    gsap.set('.fog-water', { opacity: 0 });
    gsap.set('.fog-fg', { opacity: 0 });
    gsap.set('.fg-img', { opacity: 0, scale: 2 });
    gsap.set('.fg-img-2', { opacity: 0, scale: 2 });
    gsap.set('.fog-img', { opacity: 0, scale: 2 });
    gsap.set('.fog-img-2', { opacity: 0, scale: 2 });

    // Background first (with 1s delay for loading)
    tl.to('.bg-img', {
        opacity: 1,
        duration: 1.8,
        ease: "power1.inOut"
    }, 1)


    // Water
    .to('.water', {
        opacity: 1,
        y: 0,
        duration: 2,
        ease: "power2.out"
    }, 1.2)

    // Buildings from sides
    .to('.mountain-2', {
        opacity: 1,
        x: 0,
        duration: 4,
        ease: "power2.inOut"
    }, 1.3)

    .to('.mountain-1', {
        opacity: 1,
        x: 0,
        duration: 5,
        ease: "power2.inOut"
    }, 1.3)

    // Buildings scrolling up at different speeds (furthest to closest)
    .to('.mountain-4', {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power2.out"
    }, 1.5)

    .to('.mountain-3', {
        opacity: 1,
        y: 0,
        duration: 2.5,
        ease: "power2.out"
    }, 1.5)

    .to('.mountain-0', {
        opacity: 1,
        y: 0,
        duration: 3,
        ease: "power2.out"
    }, 1.5)

    // Shine effect
    .to('.shine-2', {
        opacity: 1,
        duration: 1.5,
        ease: "power1.inOut"
    }, 2)

    // Fog layers
    .to('.fog-2', {
        opacity: 1,
        duration: 1.2,
        ease: "power1.inOut"
    }, 2.2)

    .to('.fog-1', {
        opacity: 1,
        duration: 1.2,
        ease: "power1.inOut"
    }, 2.4)

    .to('.fog-0', {
        opacity: 1,
        duration: 1.2,
        ease: "power1.inOut"
    }, 2.8)

    // Logo with rotation
    .to('.logo', {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 1,
        ease: "back.out(1.2)"
    }, 3)

    // Text
    .to('.text', {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1,
        ease: "back.out(1.1)"
    }, 3.2)

    .to('.fog-water', {
        opacity: 1,
        duration: 1.3,
        ease: "power1.inOut"
    }, 3.4)

    .to('.fog-fg', {
        opacity: 1,
        duration: 1.3,
        ease: "power1.inOut"
    }, 3.6)

    // Foregrounds with scale
    .to('.fg-img-2', {
        opacity: 1,
        scale: 1,
        duration: 2.5,
        ease: "power2.inOut"
    }, 3.8)

    .to('.fg-img', {
        opacity: 1,
        scale: 1,
        duration: 2.5,
        ease: "power2.inOut"
    }, 4)

    .to('.fog-img', {
        opacity: 1,
        scale: 1,
        duration: 1.5,
        ease: "power2.inOut"
    }, 4.2)

    .to('.fog-img-2', {
        opacity: 1,
        scale: 1,
        duration: 1.5,
        ease: "power2.inOut"
    }, 4.4)

    // UI Overlay fade in last
    .to('.ui-overlay', {
        opacity: 1,
        duration: 1.5,
        ease: "power1.inOut",
        onComplete: () => {
            // Mark animations as complete
            document.querySelectorAll('.parallax').forEach(el => {
                el.classList.add('animated');
            });
            // Enable parallax effect
            animationsComplete = true;
            // Apply initial parallax state
            update(0);
        }
    }, 4.6);
});

// UI Interactions
document.addEventListener('DOMContentLoaded', () => {
    // Side Menu Toggle
    const sideMenu = document.querySelector('.side-menu');
    const menuToggleBtn = document.querySelector('.menu-toggle-btn');

    // Open/close side menu via menu toggle button
    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', () => {
            menuToggleBtn.classList.toggle('active');
            sideMenu.classList.toggle('active');
        });
    }

    // Close side menu when clicking on a menu item
    const sideMenuItems = document.querySelectorAll('.side-menu-item');
    sideMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            sideMenu.classList.remove('active');
            if (menuToggleBtn) {
                menuToggleBtn.classList.remove('active');
            }
        });
    });

    // UI Overlay Toggle (separate button)
    const uiToggleBtn = document.querySelector('.ui-toggle-btn');
    const uiOverlay = document.querySelector('.ui-overlay');

    if (uiToggleBtn) {
        uiToggleBtn.addEventListener('click', () => {
            uiToggleBtn.classList.toggle('hidden');
            uiOverlay.classList.toggle('hidden');
        });
    }

    // Watch Movie Button
    const watchBtn = document.querySelector('.watch-btn');
    if (watchBtn) {
        watchBtn.addEventListener('click', () => {
            console.log('Watch Movie clicked');
            // Add your video player logic here
        });
    }

    // Discover Button
    const discoverBtn = document.querySelector('.discover-btn');
    if (discoverBtn) {
        discoverBtn.addEventListener('click', () => {
            console.log('Discover clicked');
            // Add navigation or scroll logic here
        });
    }

    // Page Progress Bar
    const progressBar = document.querySelector('.page-progress-bar');
    const navItems = document.querySelectorAll('.nav-item');
    const totalPages = 4;

    // Function to update progress bar
    function updateProgress(pageNumber) {
        const percentage = (pageNumber / totalPages) * 100;
        if (progressBar) {
            progressBar.style.height = percentage + '%';
        }
    }

    // Navigation menu items
    navItems.forEach((item, index) => {
        const link = item.querySelector('a');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active class from all items
            navItems.forEach(navItem => {
                navItem.classList.remove('active');
            });
            // Add active class to clicked item
            item.classList.add('active');

            // Update progress bar based on nav item index (1-4)
            updateProgress(index + 1);

            console.log('Navigating to:', link.getAttribute('href'));
        });
    });

    // Initialize progress bar to first page (25%)
    updateProgress(1);
});