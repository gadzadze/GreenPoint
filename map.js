/**
 * Map functionality using Leaflet for charger and energy sharing sections
 */

// Global variables for Firebase (will be initialized in auth.js or similar)
// These are assumed to be available from the environment/other scripts.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebase imports (assuming these are loaded via script tags in index.html for module type)
// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
// import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Initialize Firebase App and Services (moved here for clarity, but assume initial setup in auth.js)
let app, db, auth;
let currentUserId = null; // To store the authenticated user ID

document.addEventListener('DOMContentLoaded', async () => {
    // Check if Firebase is already initialized to avoid re-initialization
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        try {
            app = firebase.initializeApp(firebaseConfig);
            auth = firebase.getAuth(app);
            db = firebase.getFirestore(app);

            // Sign in anonymously if no custom token is provided or if it's null
            if (initialAuthToken) {
                await firebase.signInWithCustomToken(auth, initialAuthToken);
            } else {
                await firebase.signInAnonymously(auth);
            }

            // Listen for auth state changes to get the userId
            firebase.onAuthStateChanged(auth, (user) => {
                if (user) {
                    currentUserId = user.uid;
                    console.log("Firebase user ID:", currentUserId);
                    // Now that we have a user ID, we can initialize maps and other features
                    // that might rely on user data or Firestore.
                    if (document.getElementById('map')) {
                        initChargerMap();
                    }
                    if (document.getElementById('energyMap')) {
                        initEnergyMap();
                    }
                } else {
                    currentUserId = crypto.randomUUID(); // Fallback for unauthenticated or anonymous user
                    console.log("No authenticated Firebase user. Using random ID:", currentUserId);
                    if (document.getElementById('map')) {
                        initChargerMap();
                    }
                    if (document.getElementById('energyMap')) {
                        initEnergyMap();
                    }
                }
            });
        } catch (error) {
            console.error("Firebase initialization or authentication error:", error);
            // Even if Firebase fails, try to initialize maps without data fetching
            if (document.getElementById('map')) {
                initChargerMap();
            }
            if (document.getElementById('energyMap')) {
                initEnergyMap();
            }
        }
    } else {
         // If Firebase is already initialized, get references
         app = firebase.app();
         auth = firebase.auth();
         db = firebase.firestore(); // Use firebase.firestore() for already initialized app

         firebase.onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUserId = user.uid;
                console.log("Firebase already initialized, user ID:", currentUserId);
            } else {
                currentUserId = crypto.randomUUID(); // Fallback for unauthenticated or anonymous user
                console.log("Firebase already initialized, no user. Using random ID:", currentUserId);
            }
            // Initialize maps only after auth state is determined
            if (document.getElementById('map')) {
                initChargerMap();
            }
            if (document.getElementById('energyMap')) {
                initEnergyMap();
            }
        });
    }
});

/**
 * Custom Message Box Modal functions (replaces alert() and confirm())
 * These functions are defined here to ensure they are available for map.js
 * and other scripts that might need them.
 */
function showMessageBox(message, type = 'info', iconClass = '', duration = 3000) {
    const messageBox = document.getElementById('messageBox');
    const messageBoxText = document.getElementById('messageBoxText');
    const messageBoxIcon = document.getElementById('messageBoxIcon');
    
    if (!messageBox || !messageBoxText) {
        console.warn('Message box elements not found');
        return;
    }
    
    messageBoxText.textContent = message;
    
    // Set icon if provided
    if (messageBoxIcon && iconClass) {
        messageBoxIcon.className = iconClass;
        messageBoxIcon.style.display = 'inline-block';
    } else if (messageBoxIcon) {
        messageBoxIcon.style.display = 'none';
    }
    
    // Set type-specific styling
    messageBox.className = `modal ${type}`;
    
    showModal('messageBox');
    
    // Auto-hide if duration is specified
    if (duration > 0) {
        setTimeout(() => {
            closeModal('messageBox');
        }, duration);
    }
}

/**
 * Show a specific modal
 * @param {string} modalId - ID of the modal to show
 */
function showModal(modalId) {
    closeAllModals(); // Close any open modals first
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling background
    }
}

/**
 * Close a specific modal
 * @param {string} modalId - ID of the modal to close
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
}

/**
 * Close all modals
 */
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

/**
 * Send email via server (from auth.js)
 * This function should ideally be handled server-side to prevent exposing API keys.
 * For this client-side demo, it makes a simple fetch request.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} [html] - HTML content (optional)
 * @returns {Promise<boolean>} - Success status
 */
async function sendEmail(to, subject, text, html) {
    try {
        const response = await fetch('http://localhost:3001/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to, subject, text, html }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send email');
        console.log('Email sent successfully');
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        showMessageBox('Failed to send email. Please try again later.', 'error');
        return false;
    }
}

// Global variables for filters and markers
let activeFilters = {
    type: [],
    connector: [],
    availability: []
};
let allMarkers = [];
let userLocationMarker = null;
let chargerMapInstance = null;

/**
 * Initialize the charger map for the "Find Charger" section
 */
function initChargerMap() {
    if (chargerMapInstance) {
        chargerMapInstance.remove();
    }
    chargerMapInstance = L.map('map').setView([41.7151, 44.8271], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(chargerMapInstance);

    // Initialize markers
    createMarkers();
    updateMapMarkers();

    // Refresh availability status every minute
    setInterval(refreshChargerAvailability, 60000);

    // Location button event
    document.getElementById('useLocationBtn').addEventListener('click', () => {
        getUserLocation(chargerMapInstance);
    });

    // Filter toggle button
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const closeFiltersBtn = document.getElementById('closeFiltersBtn');
    const mapFilters = document.getElementById('mapFilters');
    
    filterToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mapFilters.classList.add('show');
        document.body.classList.add('filter-open');
    });
    
    closeFiltersBtn.addEventListener('click', () => {
        closeMapFilters();
    });
    
    // Function to close map filters
    function closeMapFilters() {
        mapFilters.classList.remove('show');
        document.body.classList.remove('filter-open');
        // Reset any transform/opacity from swipe gestures
        mapFilters.style.transform = '';
        mapFilters.style.opacity = '';
    }
    
    // Add a fallback close button in case the original one is not visible
    const fallbackCloseBtn = document.createElement('button');
    fallbackCloseBtn.innerHTML = '<i class="fas fa-times"></i>';
    fallbackCloseBtn.className = 'close-filters fallback-close';
    fallbackCloseBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 10002;
        background: linear-gradient(135deg, #dc3545, #c82333);
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: none;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
    `;
    
    fallbackCloseBtn.addEventListener('click', closeMapFilters);
    mapFilters.appendChild(fallbackCloseBtn);
    
    // Show fallback close button after 3 seconds if filters are still open
    let fallbackTimer;
    filterToggleBtn.addEventListener('click', () => {
        clearTimeout(fallbackTimer);
        fallbackTimer = setTimeout(() => {
            if (mapFilters.classList.contains('show')) {
                fallbackCloseBtn.style.display = 'flex';
            }
        }, 3000);
    });
    
    // Hide fallback close button when filters are closed
    const originalCloseFilters = closeMapFilters;
    function closeMapFiltersWithFallback() {
        originalCloseFilters();
        fallbackCloseBtn.style.display = 'none';
        clearTimeout(fallbackTimer);
    }
    
    // Update all close references to use the new function
    closeFiltersBtn.addEventListener('click', closeMapFiltersWithFallback);
    fallbackCloseBtn.addEventListener('click', closeMapFiltersWithFallback);
    
    // Close filters when clicking on the overlay (outside content)
    mapFilters.addEventListener('click', (e) => {
        if (e.target === mapFilters) {
            closeMapFiltersWithFallback();
        }
    });
    
    // Add touch gesture support for mobile - swipe down to close
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    
    mapFilters.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
    });
    
    mapFilters.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        
        // Only allow downward swipe
        if (deltaY > 0) {
            e.preventDefault();
            mapFilters.style.transform = `translateY(${deltaY}px)`;
            mapFilters.style.opacity = Math.max(0.5, 1 - (deltaY / 300));
        }
    });
    
    mapFilters.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        
        const deltaY = currentY - startY;
        
        // If swiped down more than 100px, close the filters
        if (deltaY > 100) {
            closeMapFiltersWithFallback();
        } else {
            // Reset position
            mapFilters.style.transform = '';
            mapFilters.style.opacity = '';
        }
        
        isDragging = false;
    });

    // Auto-update filters when checkboxes change
    document.querySelectorAll('#mapFilters input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateActiveFilters();
            updateMapMarkers();
        });
    });

    // Clear all filters button
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        clearAllFilters();
        updateMapMarkers();
    });

    // Search input event
    document.getElementById('mapSearch').addEventListener('input', function() {
        updateMapMarkers();
    });

    // Close filters when pressing escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mapFilters.classList.contains('show')) {
            closeMapFiltersWithFallback();
            e.preventDefault();
            e.stopPropagation();
        }
    });
    
    // Additional escape key listener for better compatibility
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mapFilters.classList.contains('show')) {
            closeMapFiltersWithFallback();
            e.preventDefault();
            e.stopPropagation();
        }
    });

    // Prevent filter content from closing when scrolling
    const filterContent = document.querySelector('.filter-content');
    if (filterContent) {
        filterContent.addEventListener('scroll', (e) => {
            e.stopPropagation();
        });
        
        filterContent.addEventListener('touchmove', (e) => {
            e.stopPropagation();
        });
    }
}

/**
 * Create all markers (but don't add to map yet)
 */
function createMarkers() {
    // Sample charger data with availability times
    const chargers = [
        {
            id: 'downtown-charger',
            name: 'Downtown Charger',
            coords: [41.7151, 44.8271],
            type: 'level2',
            connector: 'j1772',
            available: true,
            free: false,
            price: '$0.25/kWh',
            power: '7.2 kW',
            workingHours: {
                start: '06:00',
                end: '22:00',
                days: 'Mon-Sun'
            },
            description: 'Level 2 Charger, J1772, $0.25/kWh'
        },
        {
            id: 'residential-charger',
            name: 'Residential Charger',
            coords: [41.7050, 44.8170],
            type: 'level1',
            connector: 'tesla',
            available: false,
            free: false,
            price: '$0.25/kWh',
            power: '1.4 kW',
            workingHours: {
                start: '00:00',
                end: '23:59',
                days: '24/7'
            },
            description: 'Level 1 Charger, Tesla, $0.25/kWh'
        },
        {
            id: 'fast-charger-hub',
            name: 'Fast Charger Hub',
            coords: [41.7252, 44.8372],
            type: 'dc-fast',
            connector: 'ccs',
            available: true,
            free: false,
            price: '$0.25/kWh',
            power: '50 kW',
            workingHours: {
                start: '07:00',
                end: '21:00',
                days: 'Mon-Sat'
            },
            description: 'DC Fast Charger, CCS, $0.25/kWh'
        },
        {
            id: 'mall-charger',
            name: 'Shopping Mall Charger',
            coords: [41.7100, 44.8300],
            type: 'level2',
            connector: 'j1772',
            available: true,
            free: false,
            price: '$0.25/kWh',
            power: '11 kW',
            workingHours: {
                start: '10:00',
                end: '22:00',
                days: 'Mon-Sun'
            },
            description: 'Level 2 Charger, J1772, $0.25/kWh'
        },
        {
            id: 'airport-charger',
            name: 'Airport Charger',
            coords: [41.6691, 44.9547],
            type: 'dc-fast',
            connector: 'ccs',
            available: false,
            free: false,
            price: '$0.25/kWh',
            power: '150 kW',
            workingHours: {
                start: '00:00',
                end: '23:59',
                days: '24/7'
            },
            description: 'DC Fast Charger, CCS, $0.25/kWh'
        },
        {
            id: 'university-charger',
            name: 'University Charger',
            coords: [41.7200, 44.7800],
            type: 'level2',
            connector: 'j1772',
            available: true,
            free: false,
            price: '$0.25/kWh',
            power: '7.2 kW',
            workingHours: {
                start: '08:00',
                end: '20:00',
                days: 'Mon-Fri'
            },
            description: 'Level 2 Charger, J1772, $0.25/kWh'
        },
        {
            id: 'park-charger',
            name: 'Central Park Charger',
            coords: [41.7000, 44.8000],
            type: 'level2',
            connector: 'tesla',
            available: false,
            free: false,
            price: '$0.25/kWh',
            power: '11 kW',
            workingHours: {
                start: '06:00',
                end: '23:00',
                days: 'Mon-Sun'
            },
            description: 'Level 2 Charger, Tesla, $0.25/kWh'
        },
        {
            id: 'hotel-charger',
            name: 'Hotel Charger',
            coords: [41.7300, 44.8200],
            type: 'level2',
            connector: 'j1772',
            available: true,
            free: false,
            price: '$0.25/kWh',
            power: '7.2 kW',
            workingHours: {
                start: '00:00',
                end: '23:59',
                days: '24/7'
            },
            description: 'Level 2 Charger, J1772, $0.25/kWh'
        }
    ];

    // Create markers for all chargers
    allMarkers = chargers.map(charger => {
        // Get current time and check if charger is currently open
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const [startHour, startMin] = charger.workingHours.start.split(':').map(Number);
        const [endHour, endMin] = charger.workingHours.end.split(':').map(Number);
        const startTime = startHour * 100 + startMin;
        const endTime = endHour * 100 + endMin;
        const isCurrentlyOpen = currentTime >= startTime && currentTime <= endTime;
        const isAvailable = charger.available && isCurrentlyOpen;
        charger.currentlyAvailable = isAvailable;
        charger.isOpen = isCurrentlyOpen;

        // Choose pin color based on status
        const isOccupied = isCurrentlyOpen && !isAvailable;
        const pinGradient = isOccupied
            ? `<linearGradient id='pinGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stop-color='#ffe259'/>
                <stop offset='60%' stop-color='#f6d365'/>
                <stop offset='100%' stop-color='#fda085'/>
            </linearGradient>`
            : `<linearGradient id='pinGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stop-color='#43e97b'/>
                <stop offset='30%' stop-color='#38f9d7'/>
                <stop offset='60%' stop-color='#43e97b'/>
                <stop offset='100%' stop-color='#0f3443'/>
            </linearGradient>`;

        const marker = L.marker(charger.coords, {
            icon: L.divIcon({
                className: 'custom-charger-pin',
                html: `
                    <svg width="44" height="56" viewBox="0 0 44 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#baffd9" stop-opacity="0.8"/>
                                <stop offset="70%" stop-color="#43e97b" stop-opacity="0.18"/>
                                <stop offset="100%" stop-color="#0f3443" stop-opacity="0"/>
                            </radialGradient>
                            ${pinGradient}
                            <radialGradient id="orbGradient" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#fff" stop-opacity="0.98"/>
                                <stop offset="60%" stop-color="#b2fff7" stop-opacity="0.7"/>
                                <stop offset="100%" stop-color="#43e97b" stop-opacity="0.3"/>
                            </radialGradient>
                            <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stop-color="#fff" stop-opacity="0.0"/>
                                <stop offset="50%" stop-color="#fff" stop-opacity="0.35"/>
                                <stop offset="100%" stop-color="#fff" stop-opacity="0.0"/>
                            </linearGradient>
                            <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#38f9d7" flood-opacity="0.25"/>
                            </filter>
                        </defs>
                        <ellipse cx="22" cy="42" rx="11" ry="5" fill="#38f9d7" opacity="0.13"/>
                        <circle cx="22" cy="24" r="20" fill="url(#pinGlow)"/>
                        <g filter="url(#pinShadow)">
                            <path d="M22 4C11.954 4 3.5 12.454 3.5 22.5c0 11.5 13.5 29.5 16.5 33.5a2 2 0 0 0 3 0c3-4 16.5-22 16.5-33.5C40.5 12.454 32.046 4 22 4zm0 23a8.5 8.5 0 1 1 0-17 8.5 8.5 0 0 1 0 17z" fill="url(#pinGradient)"/>
                            <rect x="7" y="7" width="28" height="32" rx="14" fill="url(#shimmer)" style="mix-blend-mode: lighten;" class="pin-shimmer"/>
                        </g>
                        <circle cx="22" cy="22" r="7" fill="url(#orbGradient)" style="mix-blend-mode: lighten;"/>
                        <ellipse cx="22" cy="19" rx="3.5" ry="1.5" fill="#fff" opacity="0.7"/>
                        <ellipse cx="22" cy="25" rx="2.2" ry="0.8" fill="#fff" opacity="0.3"/>
                    </svg>
                `,
                iconSize: [44, 56],
                iconAnchor: [22, 56],
                popupAnchor: [0, -56]
            })
        });
        
        const statusClass = isAvailable ? 'status-available' : (isCurrentlyOpen ? 'status-occupied' : 'status-closed');
        const statusText = isAvailable ? 'Available' : (isCurrentlyOpen ? 'Occupied' : 'Closed');
        
        // Generate dynamic button text based on status
        let buttonText, buttonIcon, buttonClass;
        if (isAvailable) {
            buttonText = 'Book Now';
            buttonIcon = 'fas fa-plug';
            buttonClass = 'btn-book btn-available';
        } else if (isCurrentlyOpen) {
            buttonText = 'View Schedule';
            buttonIcon = 'fas fa-calendar-alt';
            buttonClass = 'btn-book btn-occupied';
        } else {
            buttonText = 'Book Now';
            buttonIcon = 'fas fa-plug';
            buttonClass = 'btn-book';
        }
        
        marker.bindPopup(`
            <div class="charger-popup">
                <div class="popup-header">
                    <h3>${charger.name}</h3>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="popup-content">
                    <div class="key-info">
                        <div class="info-row">
                            <i class="fas fa-bolt"></i>
                            <span>${charger.type.toUpperCase()} • ${charger.connector.toUpperCase()}</span>
                        </div>
                        <div class="info-row">
                            <i class="fas fa-dollar-sign"></i>
                            <span>${charger.price}</span>
                        </div>
                        <div class="info-row">
                            <i class="fas fa-clock"></i>
                            <span>${charger.workingHours.start}-${charger.workingHours.end} (${charger.workingHours.days})</span>
                        </div>
                    </div>
                </div>
                <div class="popup-actions">
                    <button onclick="openChargerBookingModal('${charger.id}')" class="${buttonClass}">
                        <i class="${buttonIcon}"></i> ${buttonText}
                    </button>
                    <button onclick="getDirectionsToCharger(${charger.coords[0]}, ${charger.coords[1]})" class="btn-directions">
                        <i class="fas fa-directions"></i>
                    </button>
                </div>
            </div>
        `, {
            maxWidth: 280,
            className: 'charger-popup-container'
        });
        
        // Store charger data with marker
        marker.chargerData = charger;
        
        return marker;
    });
}

/**
 * Update active filters from checkboxes
 */
function updateActiveFilters() {
    activeFilters = {
        type: [],
        connector: [],
        availability: []
    };

    document.querySelectorAll('#mapFilters input[type="checkbox"]:checked').forEach(checkbox => {
        const filterType = checkbox.getAttribute('name');
        const filterValue = checkbox.value;
        
        if (filterType && filterValue) {
            activeFilters[filterType].push(filterValue);
        }
    });
}

/**
 * Update map markers based on current filters
 */
function updateMapMarkers() {
    // Clear existing markers from map
    allMarkers.forEach(marker => {
        chargerMapInstance.removeLayer(marker);
    });

    const searchQuery = document.getElementById('mapSearch').value.toLowerCase();
    let visibleCount = 0;

    // Filter and add markers
    allMarkers.forEach(marker => {
        const charger = marker.chargerData;
        let showMarker = true;

        // Search filter
        if (searchQuery && !charger.name.toLowerCase().includes(searchQuery)) {
            showMarker = false;
        }

        // Type filter
        if (activeFilters.type.length > 0 && !activeFilters.type.includes(charger.type)) {
            showMarker = false;
        }

        // Connector filter
        if (activeFilters.connector.length > 0 && !activeFilters.connector.includes(charger.connector)) {
            showMarker = false;
        }

        // Availability filter - check both availability and working hours
        if (activeFilters.availability.includes('available')) {
            // Check if charger is currently available (both available and open)
            if (!charger.currentlyAvailable) {
                showMarker = false;
            }
        }
        
        if (activeFilters.availability.includes('free') && !charger.free) {
            showMarker = false;
        }

        // Add to map if passed all filters
        if (showMarker) {
            marker.addTo(chargerMapInstance);
            visibleCount++;
        }
    });

    // Update results count
    document.getElementById('resultsCount').textContent = visibleCount;

    // Adjust map view if needed
    const visibleMarkers = allMarkers.filter(marker => chargerMapInstance.hasLayer(marker));
    if (visibleMarkers.length > 0) {
        const group = new L.featureGroup(visibleMarkers);
        chargerMapInstance.fitBounds(group.getBounds().pad(0.2));
    }
}

/**
 * Get user's current location and add a marker
 * @param {L.Map} map - The Leaflet map instance
 * @returns {Promise<L.LatLng | null>} - User's coordinates or null if failed
 */
async function getUserLocation(map) {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            showMessageBox('Geolocation is not supported by your browser.', 'error');
            resolve(null);
            return;
        }

        showMessageBox('Locating you...', 'info', 'fas fa-spinner fa-spin');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const userCoords = L.latLng(lat, lon);

                if (userLocationMarker) {
                    userLocationMarker.setLatLng(userCoords);
                } else {
                    userLocationMarker = L.marker(userCoords, {
                        icon: L.divIcon({
                            className: 'user-location-icon',
                            html: '<i class="fas fa-street-view" style="color: #007bff; font-size: 24px;"></i>',
                            iconSize: [24, 24],
                            iconAnchor: [12, 24]
                        })
                    }).addTo(map)
                    .bindPopup('Your Current Location').openPopup();
                }
                map.setView(userCoords, 15); // Center map on user's location
                closeModal('messageBox'); // Close the "Locating you" message
                resolve(userCoords);
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = 'Unable to retrieve your location.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Geolocation permission denied. Please allow location access in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'The request to get user location timed out.';
                        break;
                }
                showMessageBox(errorMessage, 'error');
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

/**
 * Prompts the user to use their current location for the map.
 */
function promptForGeolocation() {
    // Check if the geolocation prompt has been shown before in this session
    if (sessionStorage.getItem('geolocationPromptShown')) {
        return; // Don't show again if already shown
    }

    showMessageBox(
        'Would you like to use your current location to find nearby chargers?',
        'info',
        'fas fa-map-marker-alt',
        0 // Make the popup permanent until user action
    );

    // Create custom buttons for the message box
    const messageBox = document.getElementById('messageBox');
    const messageBoxContent = messageBox.querySelector('.modal-content');
    let actionButtons = messageBoxContent.querySelector('.action-buttons');
    if (!actionButtons) {
        actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons mt-4 flex justify-around';
        messageBoxContent.appendChild(actionButtons);
    }
    actionButtons.innerHTML = `
        <button class="button primary small" id="geolocationYes">Yes</button>
        <button class="button secondary small ml-2" id="geolocationNo">No</button>
    `;

    document.getElementById('geolocationYes').onclick = async () => {
        closeModal('messageBox');
        sessionStorage.setItem('geolocationPromptShown', 'true'); // Mark as shown
        if (chargerMapInstance) {
            await getUserLocation(chargerMapInstance);
        } else {
            console.warn("Charger map not initialized when 'Yes' clicked for geolocation.");
        }
    };

    document.getElementById('geolocationNo').onclick = () => {
        closeModal('messageBox');
        sessionStorage.setItem('geolocationPromptShown', 'true'); // Mark as shown
        showMessageBox('You can enable location services anytime from your browser settings.', 'info');
    };
}

/**
 * Opens Google Maps directions from user's current location to a given destination.
 * @param {number} destLat - Destination latitude
 * @param {number} destLon - Destination longitude
 */
async function getDirectionsToCharger(destLat, destLon) {
    showMessageBox('Getting your location for directions...', 'info', 'fas fa-spinner fa-spin');

    const userCoords = await getUserLocation(chargerMapInstance); // Pass the map instance
    if (userCoords) {
        const originLat = userCoords.lat;
        const originLon = userCoords.lng;
        // Construct Google Maps URL for directions
        const googleMapsUrl = `https://www.google.com/maps/dir/${originLat},${originLon}/${destLat},${destLon}`;
        window.open(googleMapsUrl, '_blank'); // Open in a new tab
        closeModal('messageBox'); // Close the "Getting your location" message
    } else {
        showMessageBox('Could not get your location for directions. Please ensure location services are enabled.', 'error');
    }
}

// Observe the #find-charger section to prompt for geolocation when it comes into view
document.addEventListener('DOMContentLoaded', () => {
    const findChargerSection = document.getElementById('find-charger');
    if (findChargerSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Section is now visible
                    promptForGeolocation();
                    observer.unobserve(entry.target); // Stop observing once shown
                }
            });
        }, { threshold: 0.5 }); // Trigger when 50% of the section is visible

        observer.observe(findChargerSection);
    }
});

let energyMapInstance = null; // Store the energy map instance globally

/**
 * Initialize the energy sharing map for the "Energy Sharing" section
 */
function initEnergyMap() {
    if (energyMapInstance) {
        energyMapInstance.remove();
    }
    energyMapInstance = L.map('energyMap').setView([41.7151, 44.8271], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(energyMapInstance);

    // Sample energy donors (can be extended with Firestore data)
    const donors = [
        {
            coords: [41.7100, 44.8200],
            title: "Energy Donor 1",
            description: "Tesla Model 3, 20 kWh available, $1.2/kWh",
            connector: "Tesla"
        },
        {
            coords: [41.7200, 44.8300],
            title: "Energy Donor 2",
            description: "BMW i4, 15 kWh available, $1.5/kWh",
            connector: "CCS"
        }
    ];

    // Add markers for energy donors
    donors.forEach(donor => {
        const marker = L.marker(donor.coords).addTo(energyMapInstance);
        marker.bindPopup(`
            <h3>${donor.title}</h3>
            <p>${donor.description}</p>
            <p><strong>Connector:</strong> ${donor.connector}</p>
            <button onclick="showEnergyModal()" class="button primary small">
                <i class="fas fa-bolt"></i> Request Energy
            </button>
        `);
    });

    // Refresh button listener
    document.querySelector('.energy-map-container .button').addEventListener('click', () => {
        console.log('Refreshing energy donors...');
        showMessageBox('Map refresh functionality to be implemented!', 'info');
        // Future: Refresh donor markers (e.g., by re-fetching from Firestore)
    });
}

/**
 * Open the charger booking modal and populate it
 * @param {string} chargerName - Name of the charger
 */
function openChargerBookingModal(chargerName) {
    showModal('chargerBookingModal');
    
    // Find the charger data
    const charger = allMarkers.find(marker => marker.chargerData.id === chargerName)?.chargerData;
    
    if (!charger) {
        showMessageBox('Charger not found.', 'error');
        return;
    }
    
    // Check current availability
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const [startHour, startMin] = charger.workingHours.start.split(':').map(Number);
    const [endHour, endMin] = charger.workingHours.end.split(':').map(Number);
    const startTime = startHour * 100 + startMin;
    const endTime = endHour * 100 + endMin;
    const isCurrentlyOpen = currentTime >= startTime && currentTime <= endTime;
    const isAvailable = charger.available && isCurrentlyOpen;
    
    // Update modal title and content based on status
    let modalTitle, statusMessage;
    if (isAvailable) {
        modalTitle = `Book ${charger.name}`;
        statusMessage = `<div class="status-info available">
            <i class="fas fa-check-circle"></i>
            <span>Available for booking now</span>
        </div>`;
    } else if (isCurrentlyOpen) {
        modalTitle = `View Schedule - ${charger.name}`;
        statusMessage = `<div class="status-info occupied">
            <i class="fas fa-clock"></i>
            <span>Currently occupied, but you can book future slots</span>
        </div>`;
    } else {
        modalTitle = `Check Hours - ${charger.name}`;
        statusMessage = `<div class="status-info closed">
            <i class="fas fa-times-circle"></i>
            <span>Currently closed. Opens ${charger.workingHours.start} - ${charger.workingHours.end} (${charger.workingHours.days})</span>
        </div>`;
    }
    
    document.getElementById('chargerModalTitle').innerHTML = modalTitle;
    document.getElementById('chargerName').value = chargerName;
    
    // Add status message to modal
    let statusContainer = document.getElementById('chargerStatusInfo');
    if (!statusContainer) {
        statusContainer = document.createElement('div');
        statusContainer.id = 'chargerStatusInfo';
        statusContainer.className = 'status-info-container';
        const modalContent = document.querySelector('#chargerBookingModal .modal-content');
        const modalTitle = modalContent.querySelector('.modal-title');
        modalTitle.insertAdjacentElement('afterend', statusContainer);
    }
    statusContainer.innerHTML = statusMessage;

    // Add live schedule information
    const scheduleInfo = document.createElement('div');
    scheduleInfo.className = 'live-schedule-info';
    scheduleInfo.innerHTML = `
        <div class="schedule-header">
            <i class="fas fa-calendar-alt"></i>
            <span>Live Schedule</span>
        </div>
        <div class="schedule-details">
            <div class="schedule-item">
                <i class="fas fa-clock"></i>
                <span>Hours: ${charger.workingHours.start} - ${charger.workingHours.end}</span>
            </div>
            <div class="schedule-item">
                <i class="fas fa-calendar-week"></i>
                <span>Days: ${charger.workingHours.days}</span>
            </div>
            <div class="schedule-item">
                <i class="fas fa-bolt"></i>
                <span>Power: ${charger.power}</span>
            </div>
            <div class="schedule-item">
                <i class="fas fa-dollar-sign"></i>
                <span>Rate: ${charger.price}</span>
            </div>
        </div>
    `;
    statusContainer.appendChild(scheduleInfo);

    // Populate booked times
    const bookedTimesContainer = document.getElementById('chargerBookedTimesContainer');
    const bookedTimesList = document.getElementById('chargerBookedTimesList');
    bookedTimesList.innerHTML = '';
    const bookedSlots = chargerData[chargerName]?.bookedSlots || [];

    if (bookedSlots.length > 0) {
        bookedTimesContainer.style.display = 'block';
        bookedSlots.forEach(slot => {
            const li = document.createElement('li');
            li.textContent = `${slot.date} at ${slot.time}`;
            bookedTimesList.appendChild(li);
        });
    } else {
        bookedTimesContainer.style.display = 'none';
    }

    // Populate time slots based on selected date
    const dateInput = document.getElementById('chargerBookingDate');
    const timeSelect = document.getElementById('chargerBookingTime');

    // Set min date to today for the booking date input
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    dateInput.setAttribute('min', minDate);

    dateInput.addEventListener('change', () => {
        timeSelect.innerHTML = '<option value="">Select time</option>';
        const selectedDate = dateInput.value;
        const workingHours = chargerData[chargerName]?.workingHours || { start: 8, end: 22 };
        const allSlots = generateTimeSlots(workingHours);
        const bookedTimes = bookedSlots
            .filter(slot => slot.date === selectedDate)
            .map(slot => slot.time);

        allSlots.forEach(slot => {
            // Only add slots that are not booked
            if (!bookedTimes.includes(slot)) {
                const option = document.createElement('option');
                option.value = slot;
                option.textContent = slot;
                timeSelect.appendChild(option);
            }
        });
    });

    // Trigger change event to populate times if date is already selected (e.g., on modal open)
    dateInput.dispatchEvent(new Event('change'));

    // Charger booking form submission
    document.getElementById('chargerBookingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check if charger is currently available for immediate booking
        const charger = allMarkers.find(marker => marker.chargerData.id === document.getElementById('chargerName').value)?.chargerData;
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const [startHour, startMin] = charger.workingHours.start.split(':').map(Number);
        const [endHour, endMin] = charger.workingHours.end.split(':').map(Number);
        const startTime = startHour * 100 + startMin;
        const endTime = endHour * 100 + endMin;
        const isCurrentlyOpen = currentTime >= startTime && currentTime <= endTime;
        const isAvailable = charger.available && isCurrentlyOpen;
        
        const bookingData = {
            charger: document.getElementById('chargerName').value,
            name: document.getElementById('chargerBookingName').value,
            email: document.getElementById('chargerBookingEmail').value,
            phone: document.getElementById('chargerBookingPhone').value,
            evModel: document.getElementById('chargerBookingEvModel').value,
            date: document.getElementById('chargerBookingDate').value,
            time: document.getElementById('chargerBookingTime').value,
            duration: document.getElementById('chargerBookingDuration').value,
            notes: document.getElementById('chargerBookingNotes').value,
            bookingType: isAvailable ? 'immediate' : 'scheduled'
        };

        // Simulate adding to booked slots (in a real app, this would be stored in a database)
        if (chargerData[bookingData.charger]) {
            chargerData[bookingData.charger].bookedSlots.push({
                date: bookingData.date,
                time: bookingData.time
            });
        }

        console.log('Charger booking:', bookingData);
        const emailSent = await sendEmail(
            'g.gadzadze5@gmail.com', // Replace with dynamic admin email or user's email
            'New Charger Booking',
            `New charger booking:\n\n` +
            `Charger: ${bookingData.charger}\n` +
            `Name: ${bookingData.name}\n` +
            `Email: ${bookingData.email}\n` +
            `Phone: ${bookingData.phone}\n` +
            `EV Model: ${bookingData.evModel}\n` +
            `Date: ${bookingData.date}\n` +
            `Time: ${bookingData.time}\n` +
            `Duration: ${bookingData.duration} hours\n` +
            `Notes: ${bookingData.notes || 'None'}`
        );

        if (emailSent) {
            const message = bookingData.bookingType === 'immediate' 
                ? `Charger ${bookingData.charger} booked successfully! You can start charging now.`
                : `Charger ${bookingData.charger} scheduled for ${bookingData.date} at ${bookingData.time}. You'll receive a confirmation email.`;
            showMessageBox(message, 'success');
            closeModal('chargerBookingModal');
        } else {
            showMessageBox('Booking failed. Please try again.', 'error');
        }
    });
}

/**
 * Generate time slots for a given charger's working hours
 * @param {Object} workingHours - { start: number, end: number }
 * @returns {string[]} - Array of time slots (e.g., ["08:00", "08:30", ...])
 */
function generateTimeSlots(workingHours) {
    const slots = [];
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
}

// Sample charger data with booked slots
const chargerData = {
    "Downtown Charger": {
        coords: [41.7151, 44.8271],
        bookedSlots: [
            { date: "2025-05-16", time: "09:00" },
            { date: "2025-05-16", time: "11:00" },
            { date: "2025-05-17", time: "14:00" }
        ],
        workingHours: { start: 8, end: 22 },
        description: "Level 2 Charger, J1772, $1.5/kWh",
        available: true
    },
    "Residential Charger": {
        coords: [41.7050, 44.8170],
        bookedSlots: [
            { date: "2025-05-16", time: "10:00" },
            { date: "2025-05-17", time: "15:00" }
        ],
        workingHours: { start: 9, end: 18 },
        description: "Level 1 Charger, Tesla, $1/kWh",
        available: false
    },
    "Fast Charger Hub": {
        coords: [41.7252, 44.8372],
        bookedSlots: [
            { date: "2025-05-16", time: "12:00" },
            { date: "2025-05-17", time: "13:00" }
        ],
        workingHours: { start: 6, end: 23 },
        description: "DC Fast Charger, CCS, $2/kWh",
        available: true
    }
};

/**
 * Clear all active filters and uncheck all checkboxes
 */
function clearAllFilters() {
    activeFilters = {
        type: [],
        connector: [],
        availability: []
    };
    
    // Uncheck all filter checkboxes
    document.querySelectorAll('#mapFilters input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

/**
 * Refresh charger availability status based on current time
 */
function refreshChargerAvailability() {
    allMarkers.forEach(marker => {
        const charger = marker.chargerData;
        
        // Get current time and check if charger is currently open
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const [startHour, startMin] = charger.workingHours.start.split(':').map(Number);
        const [endHour, endMin] = charger.workingHours.end.split(':').map(Number);
        const startTime = startHour * 100 + startMin;
        const endTime = endHour * 100 + endMin;
        
        const isCurrentlyOpen = currentTime >= startTime && currentTime <= endTime;
        const isAvailable = charger.available && isCurrentlyOpen;
        
        // Update charger availability based on current time
        charger.currentlyAvailable = isAvailable;
        charger.isOpen = isCurrentlyOpen;
        
        const statusClass = isAvailable ? 'status-available' : (isCurrentlyOpen ? 'status-occupied' : 'status-closed');
        const statusText = isAvailable ? 'Available' : (isCurrentlyOpen ? 'Occupied' : 'Closed');
        
        // Generate dynamic button text based on status
        let buttonText, buttonIcon, buttonClass;
        if (isAvailable) {
            buttonText = 'Book Now';
            buttonIcon = 'fas fa-plug';
            buttonClass = 'btn-book btn-available';
        } else if (isCurrentlyOpen) {
            buttonText = 'View Schedule';
            buttonIcon = 'fas fa-calendar-alt';
            buttonClass = 'btn-book btn-occupied';
        } else {
            buttonText = 'Book Now';
            buttonIcon = 'fas fa-plug';
            buttonClass = 'btn-book';
        }
        
        // Update popup content with new status
        marker.bindPopup(`
            <div class="charger-popup">
                <div class="popup-header">
                    <h3>${charger.name}</h3>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="popup-content">
                    <div class="key-info">
                        <div class="info-row">
                            <i class="fas fa-bolt"></i>
                            <span>${charger.type.toUpperCase()} • ${charger.connector.toUpperCase()}</span>
                        </div>
                        <div class="info-row">
                            <i class="fas fa-dollar-sign"></i>
                            <span>${charger.price}</span>
                        </div>
                        <div class="info-row">
                            <i class="fas fa-clock"></i>
                            <span>${charger.workingHours.start}-${charger.workingHours.end} (${charger.workingHours.days})</span>
                        </div>
                    </div>
                </div>
                <div class="popup-actions">
                    <button onclick="openChargerBookingModal('${charger.id}')" class="${buttonClass}">
                        <i class="${buttonIcon}"></i> ${buttonText}
                    </button>
                    <button onclick="getDirectionsToCharger(${charger.coords[0]}, ${charger.coords[1]})" class="btn-directions">
                        <i class="fas fa-directions"></i>
                    </button>
                </div>
            </div>
        `, {
            maxWidth: 280,
            className: 'charger-popup-container'
        });
    });
    
    // Update map markers to reflect new availability
    updateMapMarkers();
}