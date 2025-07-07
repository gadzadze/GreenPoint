/**
 * Energy sharing functionality for request and provide energy modals
 */

/**
 * Show the energy request modal
 */
function showEnergyModal() {
    showModal('energyRequestModal');
}

/**
 * Show the energy provider modal
 */
function showProviderModal() {
    showModal('energyProviderModal');
}

/**
 * Energy request form submission
 */
document.getElementById('energyRequestForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const requestData = {
        energyAmount: document.getElementById('energyAmount').value,
        currentRange: document.getElementById('currentRange').value,
        targetRange: document.getElementById('targetRange').value,
        location: document.getElementById('energyLocation').value,
        urgency: document.getElementById('energyUrgency').value
    };

    console.log('Energy request:', requestData);
    await sendEmail(
        'g.gadzadze5@gmail.com',
        'New Energy Request',
        `New energy request:\n\n` +
        `Energy Needed: ${requestData.energyAmount} kWh\n` +
        `Current Range: ${requestData.currentRange} km\n` +
        `Target Range: ${requestData.targetRange} km\n` +
        `Location: ${requestData.location}\n` +
        `Urgency: ${requestData.urgency}`
    );
    alert('Energy request submitted! We will find donors near you. (This is a demo)');
    closeModal('energyRequestModal');
});

/**
 * Energy provider form submission
 */
document.getElementById('energyProviderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const providerData = {
        availableEnergy: document.getElementById('availableEnergy').value,
        location: document.getElementById('shareLocation').value,
        duration: document.getElementById('shareDuration').value,
        rate: document.getElementById('energyRate').value,
        connector: document.getElementById('connectorType').value
    };

    console.log('Energy sharing offer:', providerData);
    await sendEmail(
        'g.gadzadze5@gmail.com',
        'New Energy Sharing Offer',
        `New energy sharing offer:\n\n` +
        `Available Energy: ${providerData.availableEnergy} kWh\n` +
        `Location: ${providerData.location}\n` +
        `Duration: ${providerData.duration} minutes\n` +
        `Rate: ${providerData.rate} GEL/kWh\n` +
        `Connector: ${providerData.connector}`
    );
    alert('Energy sharing offer submitted! You are now listed as a donor. (This is a demo)');
    closeModal('energyProviderModal');
});

// Reuse auth.js functions for modal control and email
/**
 * Show a specific modal (from auth.js)
 * @param {string} modalId - ID of the modal to show
 */
function showModal(modalId) {
    closeAllModals();
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Close a specific modal (from auth.js)
 * @param {string} modalId - ID of the modal to close
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

/**
 * Close all modals (from auth.js)
 */
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

/**
 * Send email via server (from auth.js)
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
        return false;
    }
}