// Header scroll effect
const header = document.getElementById('main-header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Modal handling functions (these are now handled by auth.js)
// We keep the specific modal show functions that are unique to main.js or used elsewhere.
// The general showModal and closeModal are now expected to come from auth.js.

// Ensure global access to showModal and closeModal from auth.js if they are not already.
// These functions are defined in auth.js and should be available globally.
// If not, they would need to be explicitly imported or managed.
// For now, assuming auth.js loads first and makes them available.

// Show specific modals (these will now call the showModal from auth.js)
// The showLoginModal, showRegisterModal, showForgotPasswordModal are also defined in auth.js,
// so we can remove them here to avoid conflicts and ensure auth.js's versions are used.
function showBookingModal(service) {
    // This function is specific to booking services, not directly related to auth modals.
    // It should still call the global showModal.
    if (typeof showModal === 'function') {
        showModal('bookingModal');
    } else {
        console.error("showModal function not available. Ensure auth.js is loaded.");
    }
}
function showEnergyModal() {
    if (typeof showModal === 'function') {
        showModal('energyRequestModal');
    } else {
        console.error("showModal function not available. Ensure auth.js is loaded.");
    }
}
function showProviderModal() {
    if (typeof showModal === 'function') {
        showModal('energyProviderModal');
    } else {
        console.error("showModal function not available. Ensure auth.js is loaded.");
    }
}
function showChargerBookingModal(charger) {
    if (typeof showModal === 'function') {
        showModal('chargerBookingModal');
    } else {
        console.error("showModal function not available. Ensure auth.js is loaded.");
    }
}


// Bottom bar active state management
document.querySelectorAll('.bottom-bar a').forEach(link => {
    link.addEventListener('click', (e) => {
        // Prevent default link behavior if it's the profile link
        if (link.getAttribute('href') === '#profile') {
            e.preventDefault();
            // Call the showLoginModal function from auth.js
            if (typeof showLoginModal === 'function') {
                showLoginModal();
            } else {
                console.error("showLoginModal function not available. Ensure auth.js is loaded.");
            }
        }

        document.querySelectorAll('.bottom-bar a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
    });
});

// User menu toggle (desktop only)
// This logic remains as it controls the desktop user dropdown.
const userMenu = document.querySelector('.user-menu');
const userDropdown = document.querySelector('.user-dropdown');
if (userMenu && userDropdown) {
    userMenu.addEventListener('click', () => {
        userDropdown.classList.toggle('active');
    });
}

// Hide auth-buttons on mobile based on window width
document.addEventListener('DOMContentLoaded', () => {
    const authButtons = document.querySelector('.auth-buttons');
    if (window.innerWidth <= 767 && authButtons) {
        authButtons.style.display = 'none';
    }
});

// Update on resize
window.addEventListener('resize', () => {
    const authButtons = document.querySelector('.auth-buttons');
    if (window.innerWidth <= 767 && authButtons) {
        authButtons.style.display = 'none';
    } else if (authButtons) {
        authButtons.style.display = 'flex';
    }
});







// Add this to your existing main.js file
function showServiceBookingModal(serviceName) {
    document.getElementById('serviceName').value = serviceName;
    document.getElementById('serviceModalTitle').textContent = `Book ${serviceName}`;
    
    // In a real app, you would fetch booked times from your backend here
    const bookedTimesList = document.getElementById('serviceBookedTimesList');
    bookedTimesList.innerHTML = '';
    
    // Sample booked times - in a real app, this would come from your database
    const sampleBookedTimes = [
        'March 25, 2024 - 9:00 AM',
        'March 25, 2024 - 10:30 AM',
        'March 25, 2024 - 2:00 PM',
        'March 26, 2024 - 11:00 AM',
        'March 26, 2024 - 3:30 PM'
    ];
    
    sampleBookedTimes.forEach(time => {
        const li = document.createElement('li');
        li.textContent = time;
        bookedTimesList.appendChild(li);
    });
    
    // Populate time slots
    const timeSelect = document.getElementById('serviceBookingTime');
    timeSelect.innerHTML = '<option value="">Select time</option>';
    
    // Generate time slots from 9AM to 5PM in 30-minute increments
    const startHour = 9;
    const endHour = 17;
    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const displayTime = `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
            
            // Skip times that are already booked
            if (!sampleBookedTimes.some(bookedTime => bookedTime.includes(displayTime))) {
                const option = document.createElement('option');
                option.value = timeString;
                option.textContent = displayTime;
                timeSelect.appendChild(option);
            }
        }
    }
    
    // Show the modal
    if (typeof showModal === 'function') {
        showModal('serviceBookingModal');
    }
}

// Set minimum date to today when the page loads
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('serviceBookingDate');
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
    }
});

// Sophisticated modal functions with animations
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Reset any previous animation states
        modal.classList.remove('hiding');
        modal.style.display = 'flex';
        
        // Trigger animation by adding show class
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Add hiding class for exit animation
        modal.classList.add('hiding');
        modal.classList.remove('show');
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('hiding');
        }, 400); // Match the animation duration
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Global functions
window.showModal = showModal;
window.closeModal = closeModal;

// --- Improved automatic smooth horizontal scroll for services-carousel ---
document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.services-carousel');
    if (!carousel) return;
    let autoScrollActive = false;
    let autoScrollPaused = false;
    let autoScrollFrame;
    const scrollStep = 1; // px per frame

    function autoScroll() {
        if (!autoScrollActive || autoScrollPaused) return;
        if (carousel.scrollLeft + carousel.offsetWidth >= carousel.scrollWidth - 1) {
            carousel.scrollLeft = 0;
        } else {
            carousel.scrollLeft += scrollStep;
        }
        autoScrollFrame = requestAnimationFrame(autoScroll);
    }

    // Pause on hover or touch
    carousel.addEventListener('mouseenter', () => { autoScrollPaused = true; });
    carousel.addEventListener('mouseleave', () => { autoScrollPaused = false; if (autoScrollActive) autoScroll(); });
    carousel.addEventListener('touchstart', () => { autoScrollPaused = true; });
    carousel.addEventListener('touchend', () => { autoScrollPaused = false; if (autoScrollActive) autoScroll(); });

    // Intersection Observer to start/stop auto-scroll when in view
    const observer = new window.IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                autoScrollActive = true;
                autoScroll();
            } else {
                autoScrollActive = false;
                cancelAnimationFrame(autoScrollFrame);
            }
        });
    }, { threshold: 0.2 });
    observer.observe(carousel);
});

