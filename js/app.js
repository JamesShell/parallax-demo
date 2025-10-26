const parallax_el = document.querySelectorAll('.parallax');

let xValue = 0, yValue = 0;
let animationsComplete = false;



    let tl = gsap.timeline({
        defaults: { ease: "power3.out" }
    });

function update(cursorPos) {
    // Only apply parallax if animations are complete
    if (tl.isActive()) return;

    parallax_el.forEach(el => {
        let speedX = el.dataset.speedx;
        let speedY = el.dataset.speedy || speedX;
        let speedZ = el.dataset.speedz;

        let zValue = cursorPos - parseFloat(getComputedStyle(el).left);
        let isInLeft = parseFloat(getComputedStyle(el).left) < window.innerWidth / 2 ? 1 : -1;

        el.style.transform = `translateX(calc(-50% + ${-xValue * speedX}px)) translateY(calc(-50% + ${yValue * speedY}px)) perspective(2300px) translateZ(${zValue * isInLeft * speedZ}px)`;
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
    gsap.set('.water', { y: 1200 });
    gsap.set('.mountain-0', { y: 1400 });
    gsap.set('.mountain-3', { y: 1300 });
    gsap.set('.mountain-4', { y: 1200 });
    gsap.set('.mountain-1', { x: -1200 });
    gsap.set('.mountain-2', { x: 1200 });
    gsap.set('.logo', { scale: 0, rotation: -180 });
    gsap.set('.text', { scale: 0.5, y: 50 });
    gsap.set('.fg-img, .fg-img-2', { scale: 2 });
    gsap.set('.fog-img, .fog-img-2', { scale: 2 });

    // Background first (with 1s delay for loading)
    tl.to('.bg-img', {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out"
    }, 1)


    // Water
    .to('.water', {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out"
    }, 1.2)


    // Buildings scrolling up at different speeds (furthest to closest)
    .to('.mountain-4', {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out"
    }, 1.3)

    .to('.mountain-3', {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out"
    }, 1.5)

    .to('.mountain-0', {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: "power3.out"
    }, 1.7)

    // Shine effect
    .to('.shine-2', {
        opacity: 1,
        duration: 0.6,
        ease: "power2.inOut"
    }, 1.9)

    // Fog layers
    .to('.fog-2', {
        opacity: 1,
        duration: 0.5,
        ease: "power2.inOut"
    }, 2.1)

    .to('.fog-1', {
        opacity: 1,
        duration: 0.5,
        ease: "power2.inOut"
    }, 2.3)

    // Buildings from sides
    .to('.mountain-2', {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: "power2.out"
    }, 2.4)

    .to('.mountain-1', {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: "power2.out"
    }, 2.6)

    .to('.fog-0', {
        opacity: 1,
        duration: 0.5,
        ease: "power2.inOut"
    }, 2.8)

    // Logo with rotation
    .to('.logo', {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.7,
        ease: "back.out(1.5)"
    }, 3.0)

    // Text
    .to('.text', {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.7,
        ease: "back.out(1.3)"
    }, 3.2)

    .to('.fog-water', {
        opacity: 1,
        duration: 0.6,
        ease: "power2.inOut"
    }, 3.5)

    .to('.fog-fg', {
        opacity: 1,
        duration: 0.6,
        ease: "power2.inOut"
    }, 3.7)

    // Foregrounds with scale
    .to('.fg-img-2', {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: "power2.out"
    }, 3.9)

    .to('.fg-img', {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: "power2.out"
    }, 4.1)

    .to('.fog-img', {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "power2.out"
    }, 4.3)

    .to('.fog-img-2', {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "power2.out"
    }, 4.5)

    // UI Overlay fade in last
    .to('.ui-overlay', {
        opacity: 1,
        duration: 0.8,
        ease: "power2.inOut",
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
    }, 4.7);
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