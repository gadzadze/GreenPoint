/**
 * Service booking functionality
 */

/**
 * Service data with duration, booked slots, prices, and working hours
 */
const serviceData = {
    "Tire Rotation & Alignment": {
        duration: 45,
        price: 100,
        bookedSlots: [
            { date: "2025-06-07", time: "08:30" },
            { date: "2025-06-07", time: "13:00" }
        ],
        workingHours: { start: 8, end: 18, breakStart: 12, breakEnd: 13 }
    },
    "Brake System Inspection": {
        duration: 30,
        price: 90,
        bookedSlots: [
            { date: "2025-06-07", time: "09:00" },
            { date: "2025-06-08", time: "14:00" }
        ],
        workingHours: { start: 8, end: 18, breakStart: 12, breakEnd: 13 }
    },
    "Coolant Flush": {
        duration: 40,
        price: 70,
        bookedSlots: [
            { date: "2025-06-07", time: "10:00" },
            { date: "2025-06-08", time: "15:00" }
        ],
        workingHours: { start: 8, end: 18, breakStart: 12, breakEnd: 13 }
    },
    "Battery Diagnostic": {
        duration: 60,
        price: 200,
        bookedSlots: [
            { date: "2025-06-07", time: "09:00" },
            { date: "2025-06-08", time: "11:00" }
        ],
        workingHours: { start: 9, end: 17, breakStart: 12, breakEnd: 13 }
    },
    "Firmware Update": {
        duration: 30,
        price: 100,
        bookedSlots: [
            { date: "2025-06-07", time: "10:00" },
            { date: "2025-06-08", time: "15:00" }
        ],
        workingHours: { start: 9, end: 17, breakStart: 12, breakEnd: 13 }
    },
    "Tire Service": {
        duration: 45,
        price: 150,
        bookedSlots: [
            { date: "2025-06-07", time: "08:30" },
            { date: "2025-06-07", time: "13:00" }
        ],
        workingHours: { start: 9, end: 17, breakStart: 12, breakEnd: 13 }
    },
    "Brake Maintenance": {
        duration: 60,
        price: 250,
        bookedSlots: [
            { date: "2025-06-07", time: "09:30" },
            { date: "2025-06-08", time: "11:00" }
        ],
        workingHours: { start: 9, end: 17, breakStart: 12, breakEnd: 13 }
    },
    "Charging System Check": {
        duration: 30,
        price: 120,
        bookedSlots: [
            { date: "2025-06-07", time: "10:30" },
            { date: "2025-06-08", time: "16:00" }
        ],
        workingHours: { start: 9, end: 17, breakStart: 12, breakEnd: 13 }
    },
    "Full Vehicle Inspection": {
        duration: 120,
        price: 400,
        bookedSlots: [
            { date: "2025-06-07", time: "08:00" },
            { date: "2025-06-08", time: "13:00" }
        ],
        workingHours: { start: 9, end: 17, breakStart: 12, breakEnd: 13 }
    }
};

/**
 * Open service booking modal and populate fields
 * @param {string} serviceName - Name of the service to book
 */
function openServiceModal(serviceName) {
    const modal = document.getElementById('bookingModal');
    const title = document.getElementById('serviceModalTitle');
    const dateInput = document.getElementById('bookingDate');
    const timeSelect = document.getElementById('bookingTime');
    const bookedTimesContainer = document.getElementById('bookedTimesContainer');
    const bookedTimesList = document.getElementById('bookedTimesList');
    const priceDisplay = document.getElementById('bookingPrice');
    const providerSelect = document.getElementById('bookingProvider');

    // Set modal title
    title.textContent = `Book ${serviceName}`;

    // Set minimum date to today (considering current time 01:11 AM, June 11, 2025)
    const now = new Date('2025-06-11T01:11:00+04:00');
    const today = new Date(now);
    dateInput.min = today.toISOString().split('T')[0];
    dateInput.value = today.toISOString().split('T')[0]; // Set default to today

    // Retrieve service center name from the page (e.g., from user-name or header)
    const serviceCenter = document.querySelector('.user-name')?.textContent || document.querySelector('h1')?.textContent.replace(' - GreenPoint', '') || 'Unknown Center';

    // Populate booked times
    const service = serviceData[serviceName];
    const bookedSlots = service.bookedSlots.filter(slot => slot.date === dateInput.value);
    if (bookedSlots.length > 0) {
        bookedTimesContainer.style.display = 'block';
        bookedTimesList.innerHTML = bookedSlots.map(slot => `<li>${slot.date} at ${slot.time}</li>`).join('');
        document.getElementById('noBookedSlotsMessage').style.display = 'none';
    } else {
        bookedTimesContainer.style.display = 'block';
        bookedTimesList.innerHTML = '';
        document.getElementById('noBookedSlotsMessage').style.display = 'block';
    }

    // Set price
    priceDisplay.textContent = `${service.price} GEL`;

    // Set service provider based on the service center name
    if (providerSelect) {
        providerSelect.value = serviceCenter;
        providerSelect.disabled = true; // Disable to prevent changes
    }

    // Generate available time slots
    generateTimeSlots(service, dateInput.value);

    // Show modal
    if (typeof showModal === 'function') {
        showModal('bookingModal');
    } else {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Generate available time slots for a given service and date
 * @param {Object} service - Service data
 * @param {string} selectedDate - Selected date in YYYY-MM-DD format
 */
function generateTimeSlots(service, selectedDate) {
    const timeSelect = document.getElementById('bookingTime');
    const { start, end, breakStart, breakEnd } = service.workingHours;
    const duration = service.duration;
    const bookedSlots = service.bookedSlots.filter(slot => slot.date === selectedDate);

    // Clear previous time options
    timeSelect.innerHTML = '<option value="">Select time</option>';

    // Generate time slots
    let currentTime = start * 60; // Convert to minutes
    const endTime = end * 60;
    const breakStartTime = breakStart * 60;
    const breakEndTime = breakEnd * 60;

    while (currentTime + duration <= endTime) {
        // Skip break time
        if (currentTime >= breakStartTime && currentTime < breakEndTime) {
            currentTime += 30;
            continue;
        }

        // Format time
        const hours = Math.floor(currentTime / 60);
        const minutes = currentTime % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const displayTime = `${hours > 12 ? hours - 12 : hours}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;

        // Check if slot is booked
        const isBooked = bookedSlots.some(slot => slot.time === timeString);

        if (!isBooked) {
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = displayTime;
            timeSelect.appendChild(option);
        }

        currentTime += 30; // Increment by 30 minutes
    }
}

// Event listener for date input changes in service booking modal
document.getElementById('bookingDate')?.addEventListener('change', (e) => {
    const serviceName = document.getElementById('serviceModalTitle').textContent.replace('Book ', '');
    const service = serviceData[serviceName];
    const selectedDate = e.target.value;

    const bookedSlots = service.bookedSlots.filter(slot => slot.date === selectedDate);
    const bookedTimesContainer = document.getElementById('bookedTimesContainer');
    const bookedTimesList = document.getElementById('bookedTimesList');
    const noBookedSlotsMessage = document.getElementById('noBookedSlotsMessage');

    if (bookedSlots.length > 0) {
        bookedTimesContainer.style.display = 'block';
        bookedTimesList.innerHTML = bookedSlots.map(slot => `<li>${slot.date} at ${slot.time}</li>`).join('');
        noBookedSlotsMessage.style.display = 'none';
    } else {
        bookedTimesContainer.style.display = 'block';
        bookedTimesList.innerHTML = '';
        noBookedSlotsMessage.style.display = 'block';
    }

    // Regenerate time slots
    generateTimeSlots(service, e.target.value);
});

// Handle booking form submission
document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        service: document.getElementById('serviceModalTitle').textContent.replace('Book ', ''),
        provider: document.getElementById('bookingProvider')?.value || 'Unknown Center',
        name: document.getElementById('bookingName').value,
        email: document.getElementById('bookingEmail').value,
        phone: document.getElementById('bookingPhone').value,
        evModel: document.getElementById('bookingEvModel').value,
        date: document.getElementById('bookingDate').value,
        time: document.getElementById('bookingTime').value,
        paymentMethod: document.getElementById('bookingPaymentMethod').value,
        cardNumber: document.getElementById('bookingPaymentCard').value,
        cardExpiry: document.getElementById('bookingCardExpiry').value,
        cardCvc: document.getElementById('bookingCardCvc').value,
        price: document.getElementById('bookingPrice').textContent,
        notes: document.getElementById('bookingNotes').value
    };

    console.log('Booking data:', formData);

    // Validate payment details
    if (formData.paymentMethod === 'card' && !validatePayment(formData.cardNumber, formData.cardExpiry, formData.cardCvc)) {
        alert('Please enter valid payment details');
        return;
    }

    // Simulate sending email notification
    const emailContent = `
        New Service Booking:
        Service: ${formData.service}
        Provider: ${formData.provider}
        Name: ${formData.name}
        Email: ${formData.email}
        Phone: ${formData.phone}
        EV Model: ${formData.evModel}
        Date: ${formData.date}
        Time: ${formData.time}
        Payment Method: ${formData.paymentMethod}
        Price: ${formData.price}
        Notes: ${formData.notes || 'None'}
    `;

    const success = true; // For demo purposes

    if (success) {
        alert(`Booking confirmed for ${formData.service} on ${formData.date} at ${formData.time}! You will receive a confirmation email.`);
        addTransaction(formData);
        if (typeof closeModal === 'function') {
            closeModal('bookingModal');
        } else {
            document.getElementById('bookingModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    } else {
        alert('Failed to confirm booking. Please try again.');
    }
});

/**
 * Validate payment card details
 * @param {string} cardNumber - Card number
 * @param {string} cardExpiry - Card expiry date (MM/YY)
 * @param {string} cardCvc - Card CVC
 * @returns {boolean} - True if valid, false otherwise
 */
function validatePayment(cardNumber, cardExpiry, cardCvc) {
    const cardRegex = /^\d{13,19}$/;
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    const cvcRegex = /^\d{3,4}$/;

    if (!cardRegex.test(cardNumber.replace(/\s/g, ''))) return false;
    if (!expiryRegex.test(cardExpiry)) return false;
    if (!cvcRegex.test(cardCvc)) return false;

    const [month, year] = cardExpiry.split('/').map(Number);
    const currentYear = new Date('2025-06-11T01:11:00+04:00').getFullYear() % 100;
    const currentMonth = new Date('2025-06-11T01:11:00+04:00').getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) return false;

    return true;
}

/**
 * Add a transaction to the history
 * @param {Object} bookingData - Booking data to log as a transaction
 */
function addTransaction(bookingData) {
    const transactionList = document.getElementById('transactionList');
    const transaction = document.createElement('li');
    transaction.textContent = `${new Date().toLocaleString()} - ${bookingData.service} (${bookingData.price}) at ${bookingData.provider}`;
    transactionList.appendChild(transaction);
}

/**
 * Show all transactions (placeholder for full history)
 */
function showAllTransactions() {
    alert('View all transactions feature is under development. Check console for current transactions.');
    console.log('All Transactions:', document.getElementById('transactionList').innerHTML);
}

// Initialize event listeners for "Book Now" buttons
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.service-card .button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const serviceName = button.parentElement.querySelector('h3').textContent;
            openServiceModal(serviceName);
        });
    });

    // Date change listener
    document.getElementById('bookingDate')?.addEventListener('change', (e) => {
        const serviceName = document.getElementById('serviceModalTitle').textContent.replace('Book ', '');
        const service = serviceData[serviceName];
        generateTimeSlots(service, e.target.value);
    });
});

// --- Charger Booking (from index.html context, but logic is here) ---

// Handle charger booking form submission
document.getElementById('chargerBookingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        chargerName: document.getElementById('chargerBookingChargerName').value,
        location: document.getElementById('chargerBookingLocation').value,
        name: document.getElementById('chargerBookingName').value,
        email: document.getElementById('chargerBookingEmail').value,
        phone: document.getElementById('chargerBookingPhone').value,
        evModel: document.getElementById('chargerBookingEvModel').value,
        date: document.getElementById('chargerBookingDate').value,
        time: document.getElementById('chargerBookingTime').value,
        duration: document.getElementById('chargerBookingDuration').value,
        notes: document.getElementById('chargerBookingNotes').value,
        paymentMethod: document.getElementById('chargerPaymentMethod').value,
        paymentCard: document.getElementById('chargerPaymentCard').value,
        paymentExpiry: document.getElementById('chargerPaymentExpiry').value,
        paymentCvv: document.getElementById('chargerPaymentCvv').value
    };

    console.log('Charger Booking data:', formData);

    // Simulate sending booking
    const success = true; // For demo purposes

    if (success) {
        alert('Charger booking confirmed! You will receive a confirmation. (This is a demo)');
        if (typeof closeModal === 'function') {
            closeModal('chargerBookingModal');
        } else {
            document.getElementById('chargerBookingModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    } else {
        alert('Failed to confirm charger booking. Please try again.');
    }
});