/**
 * Authentication-related functionality
 */

/**
 * Show a specific modal and hide others
 * @param {string} modalId - ID of the modal to show
 */
function showModal(modalId) {
    closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        console.error(`Modal with ID ${modalId} not found`);
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
        document.body.style.overflow = 'auto';
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
 * Show the login modal
 */
function showLoginModal() {
    showModal('loginModal');
}

/**
 * Navigate to the registration page
 */
function showRegisterModal() {
    window.location.href = 'register.html';
}

/**
 * Show the forgot password modal
 */
function showForgotPasswordModal() {
    showModal('forgotPasswordModal');
}

/**
 * Update UI based on authentication state
 * @param {boolean} isAuthenticated - Whether the user is authenticated
 */
function updateAuthUI(isAuthenticated) {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');

    if (authButtons && userMenu) {
        if (isAuthenticated) {
            authButtons.style.display = 'none';
            userMenu.style.display = 'flex';
        } else {
            authButtons.style.display = 'flex';
            userMenu.style.display = 'none';
        }
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Header button listeners
    const loginButton = document.querySelector('.auth-buttons .button.secondary');
    const signupButton = document.querySelector('.auth-buttons .button.primary');

    if (loginButton) {
        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginModal();
        });
    }

    if (signupButton) {
        signupButton.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterModal();
        });
    }

    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            console.log('Login attempt:', { email, password, rememberMe });
            alert('Login successful! (This is a demo)');
            closeModal('loginModal');
            updateAuthUI(true);
        });
    }

    // Driver registration form (for index.html)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userData = {
                firstName: document.getElementById('regFirstName').value,
                lastName: document.getElementById('regLastName').value,
                email: document.getElementById('regEmail').value,
                phone: document.getElementById('regPhone').value,
                password: document.getElementById('regPassword').value,
                evModel: document.getElementById('regEvModel').value,
                vin: document.getElementById('regVin').value,
                plate: document.getElementById('regPlate').value
            };

            console.log('Driver Registration data:', userData);
            alert('Driver registration successful! Welcome to GreenPoint. (This is a demo)');
            closeModal('registerModal');
            updateAuthUI(true);
            window.location.href = 'driver-panel.html'; // Redirect to driver panel
        });
    }

    // Driver registration form (for index.html)
    const driverRegisterForm = document.getElementById('driverRegisterForm');
    if (driverRegisterForm) {
        driverRegisterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userData = {
                firstName: document.getElementById('regFirstName').value,
                lastName: document.getElementById('regLastName').value,
                email: document.getElementById('regEmail').value,
                phone: document.getElementById('regPhone').value,
                password: document.getElementById('regPassword').value,
                evModel: document.getElementById('regEvModel').value,
                vin: document.getElementById('regVin').value,
                plate: document.getElementById('regPlate').value
            };

            console.log('Driver Registration data:', userData);
            console.log('Driver registration successful (demo)');
            closeModal('registerModal');
            updateAuthUI(true);
            console.log('Redirecting to driver_panel.html');
            window.location.href = './driver-panel.html';
        });
    }

    // Host registration form (for register.html)
    const hostRegisterForm = document.getElementById('hostRegisterForm');
    if (hostRegisterForm) {
        hostRegisterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const hostData = {
                firstName: document.getElementById('hostFirstName').value,
                lastName: document.getElementById('hostLastName').value,
                email: document.getElementById('hostEmail').value,
                phone: document.getElementById('hostPhone').value,
                password: document.getElementById('hostPassword').value,
                chargerType: document.getElementById('hostChargerType').value,
                connectorType: document.getElementById('hostConnectorType').value,
                chargerLocation: document.getElementById('hostLocation').value
            };

            console.log('Host Registration data:', hostData);
            alert('Host registration successful! Welcome to GreenPoint. (This is a demo)');
            closeModal('hostRegisterModal');
            updateAuthUI(true);
            window.location.href = 'host_panel.html'; // Redirect to host panel
        });
    }

    // Service Center registration form (for register.html)
    const serviceRegisterForm = document.getElementById('serviceRegisterForm');
    if (serviceRegisterForm) {
        serviceRegisterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const serviceData = {
                businessName: document.getElementById('serviceBusinessName').value,
                email: document.getElementById('serviceEmail').value,
                phone: document.getElementById('servicePhone').value,
                address: document.getElementById('serviceAddress').value,
                password: document.getElementById('servicePassword').value,
                description: document.getElementById('serviceDescription').value
            };

            console.log('Service Center Registration data:', serviceData);
            alert('Service Center registration successful! Welcome to GreenPoint. (This is a demo)');
            closeModal('serviceRegisterModal');
            updateAuthUI(true);
            window.location.href = 'admin_panel.html'; // Redirect to service center panel
        });
    }

    // Forgot password form submission
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;

            console.log('Password reset requested for:', email);
            alert(`Password reset link sent to ${email} (This is a demo)`);
            closeModal('forgotPasswordModal');
        });
    }
});

// Initialize auth UI
updateAuthUI(false);