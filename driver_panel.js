// driver.js

console.log('Driver Panel JS: Initializing...');

// Ensure global functions from auth.js and main.js are accessible
// These are assumed to be loaded before driver.js in the HTML.
const showModal = window.showModal;
const closeModal = window.closeModal;
const sendEmail = window.sendEmail;
const auth = window.auth;
const toggleSidebar = window.toggleSidebar;

// --- Mock Data for Demonstration ---
let chargers = [
    { id: 'ch1', name: 'City Center Fast Charge', location: '41.7151, 44.7925', type: 'CCS, Type 2', price: 0.35, power: 50, availability: ['09:00', '17:00', '18:00'], status: 'available' },
    { id: 'ch2', name: 'Mall Plaza Charger', location: '41.7200, 44.8000', type: 'Type 2', price: 0.25, power: 22, availability: ['10:00', '11:00', '14:00'], status: 'occupied' },
    { id: 'ch3', name: 'Suburban Hub', location: '41.7000, 44.7800', type: 'CCS', price: 0.40, power: 100, availability: ['13:00', '16:00'], status: 'available' },
    { id: 'ch4', name: 'Downtown Parking', location: '41.7050, 44.7900', type: 'CHAdeMO', price: 0.30, power: 50, availability: [], status: 'offline' }
];

let servicePartners = [
    { id: 'sp1', name: 'Green EV Mechanics', type: 'Mechanic', location: '10 EV Service Rd', rating: 4.8, acceptsPoints: true, img: 'https://via.placeholder.com/60?text=Mech1' },
    { id: 'sp2', name: 'Sparkle Car Wash', type: 'Car Wash', location: '25 Clean St', rating: 4.5, acceptsPoints: false, img: 'https://via.placeholder.com/60?text=Wash1' },
    { id: 'sp3', name: 'Battery Experts', type: 'Battery Service', location: '30 Power Ave', rating: 4.9, acceptsPoints: true, img: 'https://via.placeholder.com/60?text=Batt1' }
];

class Driver {
    constructor() {
        this.chargerBookings = [];
        this.serviceBookings = [];
        this.myVehicles = [];
        this.energyRequests = []; // For sharing/requesting energy
        this.greenPointsData = []; // NEW: Array for GreenPoints transactions

        // Load data from local storage on instantiation
        this.loadDataFromLocalStorage();
        this.loadGreenPointsData(); // NEW: Load GreenPoints data
    }

    loadDataFromLocalStorage() {
        const storedChargerBookings = localStorage.getItem('greenpoint_driver_charger_bookings');
        if (storedChargerBookings) {
            this.chargerBookings = JSON.parse(storedChargerBookings);
        } else {
            this.chargerBookings = [
                { id: 'cb1', type: 'charging', item: 'City Center Fast Charge', date: '2025-06-15', time: '10:00', status: 'upcoming', cost: 12.50, kWh: 30 },
                { id: 'cb2', type: 'charging', item: 'Mall Plaza Charger', date: '2025-05-20', time: '14:00', status: 'completed', cost: 7.50, kWh: 25 }
            ];
        }

        const storedServiceBookings = localStorage.getItem('greenpoint_driver_service_bookings');
        if (storedServiceBookings) {
            this.serviceBookings = JSON.parse(storedServiceBookings);
        } else {
            this.serviceBookings = [
                { id: 'sb1', type: 'service', item: 'Battery Diagnostics (Green EV Mechanics)', date: '2025-07-01', time: '09:00', status: 'upcoming' },
                { id: 'sb2', type: 'service', item: 'Tire Rotation (Green EV Mechanics)', date: '2025-05-10', time: '11:00', status: 'completed' }
            ];
        }

        const storedVehicles = localStorage.getItem('greenpoint_driver_vehicles');
        if (storedVehicles) {
            this.myVehicles = JSON.parse(storedVehicles);
        } else {
            this.myVehicles = [
                { id: 'v1', make: 'Tesla', model: 'Model 3', year: 2022, battery: 75, plate: 'ELEC-123' },
                { id: 'v2', make: 'Nissan', model: 'Leaf', year: 2020, battery: 40, plate: 'EV-456' }
            ];
        }

        const storedEnergyRequests = localStorage.getItem('greenpoint_energy_requests');
        if (storedEnergyRequests) {
            this.energyRequests = JSON.parse(storedEnergyRequests);
        } else {
            this.energyRequests = [
                { id: 'er1', type: 'offer', vehicle: 'Tesla Model 3', amount: 15, location: '41.7100, 44.7950', status: 'active', expires: '2025-06-12' },
                { id: 'er2', type: 'request', vehicle: 'Nissan Leaf', amount: 10, location: '41.7250, 44.8100', status: 'pending', expires: '2025-06-11' }
            ];
        }
    }

    saveDataToLocalStorage() {
        localStorage.setItem('greenpoint_driver_charger_bookings', JSON.stringify(this.chargerBookings));
        localStorage.setItem('greenpoint_driver_service_bookings', JSON.stringify(this.serviceBookings));
        localStorage.setItem('greenpoint_driver_vehicles', JSON.stringify(this.myVehicles));
        localStorage.setItem('greenpoint_energy_requests', JSON.stringify(this.energyRequests));
        this.showNotification('Data saved.');
    }

    // NEW: GreenPoints Data Management
    loadGreenPointsData() {
        const storedGreenPoints = localStorage.getItem('greenpoint_loyalty_data_driver');
        if (storedGreenPoints) {
            this.greenPointsData = JSON.parse(storedGreenPoints);
        } else {
            // Initial dummy data for GreenPoints
            this.greenPointsData = [
                { id: 1, type: 'earned', amount: 200, description: 'Welcome Bonus', timestamp: new Date().toISOString() },
                { id: 2, type: 'earned', amount: 50, description: 'First Charging Session', timestamp: new Date(Date.now() - 86400000 * 3).toISOString() } // 3 days ago
            ];
        }
    }

    saveGreenPointsData() {
        localStorage.setItem('greenpoint_loyalty_data_driver', JSON.stringify(this.greenPointsData));
        this.showNotification('GreenPoints updated.');
    }

    getCurrentGreenPoints() {
        return this.greenPointsData.reduce((sum, transaction) => {
            return transaction.type === 'earned' ? sum + transaction.amount : sum - transaction.amount;
        }, 0);
    }

    updateGreenPointsUI() {
        const currentPointsElement = document.getElementById('currentGreenPoints');
        const dashboardPointsElement = document.getElementById('dashboardGreenPoints');
        const historyTableBody = document.getElementById('greenPointsHistoryTableBody');

        const currentPoints = this.getCurrentGreenPoints();
        currentPointsElement.textContent = currentPoints;
        if (dashboardPointsElement) { // Update dashboard card if it exists
            dashboardPointsElement.textContent = currentPoints;
        }
        
        // Clear existing history rows
        historyTableBody.innerHTML = ''; 

        // Sort transactions by newest first
        this.greenPointsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        this.greenPointsData.forEach(transaction => {
            const row = historyTableBody.insertRow();
            const date = new Date(transaction.timestamp).toLocaleString();
            const pointsClass = transaction.type === 'earned' ? 'points-earned' : 'points-spent';
            const sign = transaction.type === 'earned' ? '+' : '-';
            row.innerHTML = `
                <td>${date}</td>
                <td class="${pointsClass}">${sign}${transaction.amount}</td>
                <td>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>
                <td>${transaction.description}</td>
            `;
        });
    }

    earnPoints(amount, description) {
        if (amount <= 0) {
            this.showNotification('Points to earn must be positive.');
            return;
        }
        const newTransaction = {
            id: this.greenPointsData.length > 0 ? Math.max(...this.greenPointsData.map(t => t.id)) + 1 : 1,
            type: 'earned',
            amount: amount,
            description: description,
            timestamp: new Date().toISOString()
        };
        this.greenPointsData.push(newTransaction);
        this.saveGreenPointsData();
        this.updateGreenPointsUI();
        this.showNotification(`+${amount} GreenPoints! ${description}`);
    }

    spendPoints(amount, description) {
        if (amount <= 0) {
            this.showNotification('Points to spend must be positive.');
            return false;
        }
        if (this.getCurrentGreenPoints() < amount) {
            this.showNotification('Not enough GreenPoints to complete this action.');
            return false;
        }
        const newTransaction = {
            id: this.greenPointsData.length > 0 ? Math.max(...this.greenPointsData.map(t => t.id)) + 1 : 1,
            type: 'spent',
            amount: amount,
            description: description,
            timestamp: new Date().toISOString()
        };
        this.greenPointsData.push(newTransaction);
        this.saveGreenPointsData();
        this.updateGreenPointsUI();
        this.showNotification(`-${amount} GreenPoints! ${description}`);
        return true;
    }

    // --- Simulated Earning Actions ---
    earnChargingPoints(basePoints, kWh) {
        const pointsPerKWh = 2; // Example rule: 2 points per kWh
        const earned = basePoints + (kWh * pointsPerKWh);
        this.earnPoints(earned, `Charged ${kWh} kWh at partner station`);
    }

    earnServiceVisitPoints(basePoints, serviceName) {
        const earned = basePoints; // Fixed or variable points
        this.earnPoints(earned, `Visited partner service: ${serviceName}`);
    }

    earnReferralPoints(amount) {
        this.earnPoints(amount, 'New Driver/Service Referral Bonus');
    }

    earnBookingPoints(amount) {
        this.earnPoints(amount, 'Booked through GreenPoint Platform');
    }

    // --- Simulated Spending Actions ---
    redeemChargingDiscount(points) {
        const discountValue = points / 10; // Example: 10 points = $1 discount
        if (this.spendPoints(points, `Redeemed for $${discountValue.toFixed(2)} charging discount`)) {
            // Apply discount logic in a real system (e.g., generate a coupon code, update balance)
            console.log(`Applied $${discountValue.toFixed(2)} charging discount.`);
        }
    }

    redeemServicePartnerVoucher(points) {
        const voucherValue = points / 5; // Example: 5 points = $1 voucher
        if (this.spendPoints(points, `Redeemed for $${voucherValue.toFixed(2)} service partner voucher`)) {
            // Logic to issue a voucher for a service partner
            console.log(`Issued $${voucherValue.toFixed(2)} service partner voucher.`);
        }
    }

    exchangeForVoucher(points) {
        const voucherType = prompt(`Exchange ${points} points for what type of platform benefit (e.g., Premium Feature Access, Exclusive Content)?`);
        if (voucherType && voucherType.trim() !== '') {
            if (this.spendPoints(points, `Exchanged for: ${voucherType} benefit`)) {
                // Logic to unlock a platform benefit
                console.log(`Exchanged for ${voucherType} benefit.`);
            }
        } else if (voucherType !== null) {
            this.showNotification('Please specify a benefit type.');
        }
    }

    // --- End GreenPoints Logic ---

    showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }

    updateDashboardMetrics() {
        const totalCharges = this.chargerBookings.filter(b => b.status === 'completed').length;
        const totalSpent = this.chargerBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.cost, 0);
        // Dummy average efficiency
        const avgEfficiency = (totalCharges > 0) ? (this.chargerBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.kWh, 0) / totalCharges).toFixed(2) : 0;

        document.getElementById('totalCharges').textContent = totalCharges;
        document.getElementById('totalSpent').textContent = `$${totalSpent.toFixed(2)}`;
        document.getElementById('avgEfficiency').textContent = `${avgEfficiency} kWh/session`; // Adjusted metric

        this.renderRecentCharges();
        this.renderUpcomingBookings();
        this.updateGreenPointsUI(); // Ensure dashboard points are updated
    }

    renderRecentCharges() {
        const tableBody = document.getElementById('recentChargesTableBody');
        tableBody.innerHTML = ''; // Clear existing rows

        const recentCharges = this.chargerBookings
            .filter(b => b.type === 'charging' && b.status === 'completed')
            .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))
            .slice(0, 5); // Show last 5

        if (recentCharges.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">No recent charging sessions.</td></tr>';
            return;
        }

        recentCharges.forEach(charge => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${charge.item}</td>
                <td>${charge.date} ${charge.time}</td>
                <td>${charge.kWh}</td>
                <td>$${charge.cost.toFixed(2)}</td>
            `;
        });
    }

    renderUpcomingBookings() {
        const tableBody = document.getElementById('upcomingBookingsTableBody');
        tableBody.innerHTML = ''; // Clear existing rows

        const allBookings = [...this.chargerBookings, ...this.serviceBookings];
        const upcomingBookings = allBookings
            .filter(b => b.status === 'upcoming')
            .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
            .slice(0, 5); // Show next 5

        if (upcomingBookings.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">No upcoming bookings.</td></tr>';
            return;
        }

        upcomingBookings.forEach(booking => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${booking.type === 'charging' ? 'Charging' : 'Service'}</td>
                <td>${booking.item}</td>
                <td>${booking.date} ${booking.time}</td>
                <td><span class="status-${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></td>
            `;
        });
    }

    // --- Charger Management ---
    initMap() {
        // Only initialize map if it hasn't been initialized
        if (!this.map) {
            this.map = L.map('map').setView([41.7151, 44.7925], 13); // Default view
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);
            this.chargerMarkers = {}; // To store markers
        }
        this.updateChargerMarkers();
    }

    updateChargerMarkers() {
        // Clear existing markers
        for (const id in this.chargerMarkers) {
            this.map.removeLayer(this.chargerMarkers[id]);
        }
        this.chargerMarkers = {};

        chargers.forEach(charger => {
            const [lat, lng] = charger.location.split(',').map(Number);
            const marker = L.marker([lat, lng]).addTo(this.map)
                .bindPopup(`<b>${charger.name}</b><br>Type: ${charger.type}<br>Price: $${charger.price}/kWh<br>Status: <span class="status-${charger.status}">${charger.status.charAt(0).toUpperCase() + charger.status.slice(1)}</span><br><button onclick="driver.showBookingModal('${charger.id}')">Book Now</button>`);
            this.chargerMarkers[charger.id] = marker;
        });
    }

    renderChargersTable() {
        const tableBody = document.getElementById('chargersTableBody');
        tableBody.innerHTML = ''; // Clear existing rows

        chargers.forEach(charger => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${charger.name}</td>
                <td>${charger.location}</td>
                <td>${charger.type}</td>
                <td>$${charger.price.toFixed(2)}</td>
                <td>${charger.power}</td>
                <td><span class="status-${charger.status}">${charger.status.charAt(0).toUpperCase() + charger.status.slice(1)}</span></td>
                <td>
                    <button onclick="driver.showBookingModal('${charger.id}')" ${charger.status === 'available' ? '' : 'disabled'}>Book</button>
                </td>
            `;
        });
    }

    filterChargers() {
        const searchTerm = document.getElementById('chargerSearch').value.toLowerCase();
        const filteredChargers = chargers.filter(charger =>
            charger.name.toLowerCase().includes(searchTerm) ||
            charger.type.toLowerCase().includes(searchTerm) ||
            charger.status.toLowerCase().includes(searchTerm)
        );
        this.renderChargersTableFiltered(filteredChargers);
        this.updateChargerMarkersFiltered(filteredChargers);
    }

    renderChargersTableFiltered(filteredData) {
        const tableBody = document.getElementById('chargersTableBody');
        tableBody.innerHTML = '';
        if (filteredData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No matching chargers found.</td></tr>';
            return;
        }
        filteredData.forEach(charger => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${charger.name}</td>
                <td>${charger.location}</td>
                <td>${charger.type}</td>
                <td>$${charger.price.toFixed(2)}</td>
                <td>${charger.power}</td>
                <td><span class="status-${charger.status}">${charger.status.charAt(0).toUpperCase() + charger.status.slice(1)}</span></td>
                <td>
                    <button onclick="driver.showBookingModal('${charger.id}')" ${charger.status === 'available' ? '' : 'disabled'}>Book</button>
                </td>
            `;
        });
    }

    updateChargerMarkersFiltered(filteredData) {
        // Clear existing markers
        for (const id in this.chargerMarkers) {
            this.map.removeLayer(this.chargerMarkers[id]);
        }
        this.chargerMarkers = {};

        filteredData.forEach(charger => {
            const [lat, lng] = charger.location.split(',').map(Number);
            const marker = L.marker([lat, lng]).addTo(this.map)
                .bindPopup(`<b>${charger.name}</b><br>Type: ${charger.type}<br>Price: $${charger.price}/kWh<br>Status: <span class="status-${charger.status}">${charger.status.charAt(0).toUpperCase() + charger.status.slice(1)}</span><br><button onclick="driver.showBookingModal('${charger.id}')">Book Now</button>`);
            this.chargerMarkers[charger.id] = marker;
        });
    }

    showBookingModal(chargerId) {
        const charger = chargers.find(c => c.id === chargerId);
        if (!charger) return;

        showModal('bookingConfirmationModal'); // Reusing modal for simplicity
        document.getElementById('bookingConfirmationMessage').innerHTML = `
            <h3>Book Charger: ${charger.name}</h3>
            <p>Location: ${charger.location}</p>
            <p>Type: ${charger.type}</p>
            <p>Price: $${charger.price}/kWh</p>
            <div class="form-group">
                <label for="chargerBookingVehicle">Select Vehicle:</label>
                <select id="chargerBookingVehicle" required></select>
            </div>
            <div class="form-group">
                <label for="chargerBookingDate">Date:</label>
                <input type="date" id="chargerBookingDate" required>
            </div>
            <div class="form-group">
                <label for="chargerBookingTime">Time:</label>
                <input type="time" id="chargerBookingTime" required>
            </div>
            <div class="modal-buttons">
                <button onclick="driver.bookCharger('${charger.id}')">Confirm Booking</button>
                <button class="button-secondary" onclick="closeModal('bookingConfirmationModal')">Cancel</button>
            </div>
        `;
        this.populateVehicleDropdown('chargerBookingVehicle');

        // Set min date for booking forms to today
        const today = new Date().toISOString().split('T')[0];
        const chargerBookingDate = document.getElementById('chargerBookingDate');
        if (chargerBookingDate) {
            chargerBookingDate.min = today;
        }
    }

    bookCharger(chargerId) {
        const charger = chargers.find(c => c.id === chargerId);
        const selectedVehicleId = document.getElementById('chargerBookingVehicle').value;
        const selectedVehicle = this.myVehicles.find(v => v.id === selectedVehicleId);
        const bookingDate = document.getElementById('chargerBookingDate').value;
        const bookingTime = document.getElementById('chargerBookingTime').value;

        if (!charger || !selectedVehicle || !bookingDate || !bookingTime) {
            this.showNotification('Please fill all booking details.');
            return;
        }

        const newBooking = {
            id: 'cb' + (this.chargerBookings.length + 1),
            type: 'charging',
            item: charger.name,
            date: bookingDate,
            time: bookingTime,
            status: 'upcoming',
            cost: (Math.random() * 20 + 5).toFixed(2), // Simulate cost
            kWh: (Math.random() * 30 + 10).toFixed(0), // Simulate kWh
            chargerId: charger.id,
            vehicleId: selectedVehicle.id
        };
        this.chargerBookings.push(newBooking);
        this.saveDataToLocalStorage();
        closeModal('bookingConfirmationModal');
        this.showNotification(`Booking for ${charger.name} on ${bookingDate} at ${bookingTime} confirmed!`);
        this.updateDashboardMetrics();
        this.filterMyBookings('upcoming'); // Refresh bookings table
        this.earnPoints(20, `Booked charging session for ${charger.name}`); // NEW: Earn points for booking
    }

    // --- My Bookings Management ---
    filterMyBookings(status) {
        const tableBody = document.getElementById('myBookingsTableBody');
        tableBody.innerHTML = '';

        const allBookings = [...this.chargerBookings, ...this.serviceBookings];
        let filteredBookings = [];

        if (status === 'all') {
            filteredBookings = allBookings;
        } else if (status === 'upcoming') {
            const now = new Date();
            filteredBookings = allBookings.filter(b => {
                const bookingDateTime = new Date(`${b.date}T${b.time}`);
                return b.status === 'upcoming' && bookingDateTime > now;
            });
        } else {
            filteredBookings = allBookings.filter(b => b.status === status);
        }

        filteredBookings.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

        if (filteredBookings.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6">No ${status} bookings found.</td></tr>`;
            return;
        }

        filteredBookings.forEach(booking => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${booking.id}</td>
                <td>${booking.type.charAt(0).toUpperCase() + booking.type.slice(1)}</td>
                <td>${booking.item}</td>
                <td>${booking.date} ${booking.time}</td>
                <td><span class="status-${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></td>
                <td>
                    <button onclick="driver.cancelBooking('${booking.type}', '${booking.id}')" ${booking.status === 'upcoming' ? '' : 'disabled'}>Cancel</button>
                    ${booking.type === 'charging' && booking.status === 'upcoming' ? `<button onclick="driver.completeChargingSession('${booking.id}', ${booking.kWh})" style="margin-left: 5px;">Simulate Complete</button>` : ''}
                </td>
            `;
        });

        // Update active tab styling
        document.querySelectorAll('#my-bookings .tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`#my-bookings .tab[onclick="driver.filterMyBookings('${status}')"]`).classList.add('active');
    }

    cancelBooking(type, id) {
        if (confirm(`Are you sure you want to cancel ${type} booking ${id}?`)) {
            let bookingArray = type === 'charging' ? this.chargerBookings : this.serviceBookings;
            const bookingIndex = bookingArray.findIndex(b => b.id === id);
            if (bookingIndex > -1) {
                bookingArray[bookingIndex].status = 'cancelled';
                this.saveDataToLocalStorage();
                this.showNotification(`${type} booking ${id} cancelled.`);
                this.filterMyBookings('all'); // Refresh table
                this.updateDashboardMetrics();
            }
        }
    }

    completeChargingSession(bookingId, kWhCharged) {
        const booking = this.chargerBookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'completed';
            this.saveDataToLocalStorage();
            this.showNotification(`Charging session ${bookingId} marked as completed!`);
            this.earnChargingPoints(50, kWhCharged); // Earn points for completed charging
            this.filterMyBookings('all');
            this.updateDashboardMetrics();
        }
    }

    // --- My Vehicles Management ---
    renderMyVehiclesTable() {
        const tableBody = document.getElementById('myVehiclesTableBody');
        tableBody.innerHTML = ''; // Clear existing rows

        if (this.myVehicles.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No vehicles added yet.</td></tr>';
            return;
        }

        this.myVehicles.forEach(vehicle => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${vehicle.make}</td>
                <td>${vehicle.model}</td>
                <td>${vehicle.year}</td>
                <td>${vehicle.battery} kWh</td>
                <td>${vehicle.plate}</td>
                <td>
                    <button onclick="driver.editVehicle('${vehicle.id}')">Edit</button>
                    <button class="button-secondary" onclick="driver.deleteVehicle('${vehicle.id}')">Delete</button>
                </td>
            `;
        });
    }

    showAddVehicleForm(vehicleId = null) {
        showModal('addVehicleModal');
        const form = document.getElementById('vehicleForm');
        form.reset(); // Clear form
        form.dataset.editingId = ''; // Clear editing ID

        if (vehicleId) {
            const vehicle = this.myVehicles.find(v => v.id === vehicleId);
            if (vehicle) {
                document.getElementById('vehicleMake').value = vehicle.make;
                document.getElementById('vehicleModel').value = vehicle.model;
                document.getElementById('vehicleYear').value = vehicle.year;
                document.getElementById('vehicleBattery').value = vehicle.battery;
                document.getElementById('vehiclePlate').value = vehicle.plate;
                form.dataset.editingId = vehicle.id;
                document.querySelector('#addVehicleModal h3').textContent = 'Edit Vehicle';
            }
        } else {
            document.querySelector('#addVehicleModal h3').textContent = 'Add New Vehicle';
        }
    }

    handleVehicleFormSubmit(event) {
        event.preventDefault();
        const form = document.getElementById('vehicleForm');
        const editingId = form.dataset.editingId;

        const newVehicleData = {
            make: document.getElementById('vehicleMake').value,
            model: document.getElementById('vehicleModel').value,
            year: parseInt(document.getElementById('vehicleYear').value),
            battery: parseInt(document.getElementById('vehicleBattery').value),
            plate: document.getElementById('vehiclePlate').value
        };

        if (editingId) {
            // Edit existing vehicle
            const vehicleIndex = this.myVehicles.findIndex(v => v.id === editingId);
            if (vehicleIndex > -1) {
                this.myVehicles[vehicleIndex] = { ...this.myVehicles[vehicleIndex], ...newVehicleData };
                this.showNotification('Vehicle updated successfully!');
            }
        } else {
            // Add new vehicle
            const newId = 'v' + (this.myVehicles.length + 1);
            this.myVehicles.push({ id: newId, ...newVehicleData });
            this.showNotification('Vehicle added successfully!');
        }

        this.saveDataToLocalStorage();
        this.renderMyVehiclesTable();
        this.populateVehicleDropdown('chargerBookingVehicle'); // Update vehicle dropdowns
        this.populateEnergyRequestVehicles(); // Update energy sharing vehicle dropdown
        closeModal('addVehicleModal');
    }

    editVehicle(id) {
        this.showAddVehicleForm(id);
    }

    deleteVehicle(id) {
        if (confirm(`Are you sure you want to delete vehicle ${id}?`)) {
            this.myVehicles = this.myVehicles.filter(v => v.id !== id);
            this.saveDataToLocalStorage();
            this.showNotification('Vehicle deleted.');
            this.renderMyVehiclesTable();
            this.populateVehicleDropdown('chargerBookingVehicle'); // Update vehicle dropdowns
            this.populateEnergyRequestVehicles(); // Update energy sharing vehicle dropdown
        }
    }

    populateVehicleDropdown(selectId) {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) return;

        selectElement.innerHTML = ''; // Clear existing options
        if (this.myVehicles.length === 0) {
            selectElement.innerHTML = '<option value="">No vehicles added</option>';
            selectElement.disabled = true;
            return;
        }
        selectElement.disabled = false;
        this.myVehicles.forEach(vehicle => {
            const option = document.createElement('option');
            option.value = vehicle.id;
            option.textContent = `${vehicle.make} ${vehicle.model} (${vehicle.plate})`;
            selectElement.appendChild(option);
        });
    }

    // --- Energy Sharing ---
    renderEnergyRequestsTable() {
        const tableBody = document.getElementById('energyRequestsTableBody');
        tableBody.innerHTML = '';

        if (this.energyRequests.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No energy offers or requests.</td></tr>';
            return;
        }

        this.energyRequests.forEach(request => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${request.type.charAt(0).toUpperCase() + request.type.slice(1)}</td>
                <td>${request.vehicle}</td>
                <td>${request.amount} kWh</td>
                <td>${request.location}</td>
                <td><span class="status-${request.status}">${request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span></td>
                <td>${request.expires}</td>
                <td>
                    <button onclick="driver.viewEnergyRequest('${request.id}')">View</button>
                </td>
            `;
        });
    }

    filterEnergyRequests(status) {
        const tableBody = document.getElementById('energyRequestsTableBody');
        tableBody.innerHTML = '';

        let filteredRequests = [];
        if (status === 'all') {
            filteredRequests = this.energyRequests;
        } else if (status === 'my-offers') {
            filteredRequests = this.energyRequests.filter(req => req.type === 'offer' /* && req.userId === auth.user.id */); // Add user ID check in real app
        } else if (status === 'my-requests') {
            filteredRequests = this.energyRequests.filter(req => req.type === 'request' /* && req.userId === auth.user.id */); // Add user ID check in real app
        }

        if (filteredRequests.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7">No ${status} energy requests found.</td></tr>`;
            return;
        }

        filteredRequests.forEach(request => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${request.type.charAt(0).toUpperCase() + request.type.slice(1)}</td>
                <td>${request.vehicle}</td>
                <td>${request.amount} kWh</td>
                <td>${request.location}</td>
                <td><span class="status-${request.status}">${request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span></td>
                <td>${request.expires}</td>
                <td>
                    <button onclick="driver.viewEnergyRequest('${request.id}')">View</button>
                </td>
            `;
        });

        // Update active tab styling
        document.querySelectorAll('#energy-sharing .tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`#energy-sharing .tab[onclick="driver.filterEnergyRequests('${status}')"]`).classList.add('active');
    }

    showEnergyRequestModal(requestId = null) {
        showModal('energyRequestModal');
        const form = document.getElementById('energyRequestForm');
        form.reset();
        form.dataset.editingId = '';

        this.populateEnergyRequestVehicles();

        if (requestId) {
            const request = this.energyRequests.find(r => r.id === requestId);
            if (request) {
                document.getElementById('requestType').value = request.type;
                document.getElementById('requestVehicle').value = this.myVehicles.find(v => `${v.make} ${v.model}` === request.vehicle)?.id || '';
                document.getElementById('requestAmount').value = request.amount;
                document.getElementById('requestLocation').value = request.location;
                document.getElementById('requestExpires').value = request.expires;
                form.dataset.editingId = request.id;
            }
        }
        // Set min date for requestExpires to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('requestExpires').min = today;
    }

    populateEnergyRequestVehicles() {
        this.populateVehicleDropdown('requestVehicle');
    }

    handleEnergyRequestForm(event) {
        event.preventDefault();
        const form = document.getElementById('energyRequestForm');
        const editingId = form.dataset.editingId;

        const requestType = document.getElementById('requestType').value;
        const selectedVehicleId = document.getElementById('requestVehicle').value;
        const selectedVehicle = this.myVehicles.find(v => v.id === selectedVehicleId);
        const requestAmount = parseInt(document.getElementById('requestAmount').value);
        const requestLocation = document.getElementById('requestLocation').value;
        const requestExpires = document.getElementById('requestExpires').value;

        if (!selectedVehicle || isNaN(requestAmount) || requestAmount <= 0 || !requestLocation || !requestExpires) {
            this.showNotification('Please fill all energy request details correctly.');
            return;
        }

        const newRequestData = {
            type: requestType,
            vehicle: `${selectedVehicle.make} ${selectedVehicle.model}`,
            amount: requestAmount,
            location: requestLocation,
            expires: requestExpires,
            status: 'active'
        };

        if (editingId) {
            const reqIndex = this.energyRequests.findIndex(r => r.id === editingId);
            if (reqIndex > -1) {
                this.energyRequests[reqIndex] = { ...this.energyRequests[reqIndex], ...newRequestData };
                this.showNotification('Energy request updated!');
            }
        } else {
            const newId = 'er' + (this.energyRequests.length + 1);
            this.energyRequests.push({ id: newId, ...newRequestData });
            this.showNotification('Energy request submitted!');
        }

        this.saveDataToLocalStorage();
        this.renderEnergyRequestsTable();
        closeModal('energyRequestModal');
    }

    viewEnergyRequest(id) {
        const request = this.energyRequests.find(r => r.id === id);
        if (!request) return;

        alert(`Energy Request Details:\nType: ${request.type}\nVehicle: ${request.vehicle}\nAmount: ${request.amount} kWh\nLocation: ${request.location}\nStatus: ${request.status}\nExpires: ${request.expires}`);
        // In a real app, this would open a more detailed view/modal
    }

    // --- Book Services ---
    renderServicePartners() {
        const listContainer = document.getElementById('servicePartnersList');
        listContainer.innerHTML = '';

        if (servicePartners.length === 0) {
            listContainer.innerHTML = '<p>No service partners available.</p>';
            return;
        }

        servicePartners.forEach(partner => {
            const partnerDiv = document.createElement('div');
            partnerDiv.classList.add('service-partner-item');
            partnerDiv.innerHTML = `
                <img src="${partner.img}" alt="${partner.name}">
                <div class="service-partner-details">
                    <h4>${partner.name} (${partner.type})</h4>
                    <p>${partner.location} | Rating: ${partner.rating} <i class="fas fa-star" style="color: gold;"></i></p>
                    <p style="font-size: 0.85em; color: ${partner.acceptsPoints ? '#4CAF50' : '#D32F2F'};">
                        ${partner.acceptsPoints ? 'Accepts GreenPoints' : 'Does Not Accept GreenPoints'}
                    </p>
                </div>
                <div class="service-partner-actions">
                    <button onclick="driver.showBookServiceModal('${partner.id}')">Book Service</button>
                </div>
            `;
            listContainer.appendChild(partnerDiv);
        });
    }

    filterServicePartners() {
        const searchTerm = document.getElementById('serviceSearch').value.toLowerCase();
        const filteredPartners = servicePartners.filter(partner =>
            partner.name.toLowerCase().includes(searchTerm) ||
            partner.type.toLowerCase().includes(searchTerm) ||
            partner.location.toLowerCase().includes(searchTerm)
        );
        this.renderFilteredServicePartners(filteredPartners);
    }

    renderFilteredServicePartners(filteredData) {
        const listContainer = document.getElementById('servicePartnersList');
        listContainer.innerHTML = '';
        if (filteredData.length === 0) {
            listContainer.innerHTML = '<p>No matching service partners found.</p>';
            return;
        }
        filteredData.forEach(partner => {
            const partnerDiv = document.createElement('div');
            partnerDiv.classList.add('service-partner-item');
            partnerDiv.innerHTML = `
                <img src="${partner.img}" alt="${partner.name}">
                <div class="service-partner-details">
                    <h4>${partner.name} (${partner.type})</h4>
                    <p>${partner.location} | Rating: ${partner.rating} <i class="fas fa-star" style="color: gold;"></i></p>
                    <p style="font-size: 0.85em; color: ${partner.acceptsPoints ? '#4CAF50' : '#D32F2F'};">
                        ${partner.acceptsPoints ? 'Accepts GreenPoints' : 'Does Not Accept GreenPoints'}
                    </p>
                </div>
                <div class="service-partner-actions">
                    <button onclick="driver.showBookServiceModal('${partner.id}')">Book Service</button>
                </div>
            `;
            listContainer.appendChild(partnerDiv);
        });
    }


    showBookServiceModal(partnerId) {
        const partner = servicePartners.find(p => p.id === partnerId);
        if (!partner) return;

        showModal('bookServiceModal');
        document.getElementById('bookServiceModalTitle').textContent = `Book Service with ${partner.name}`;
        document.getElementById('servicePartnerName').value = partner.name;

        this.populateVehicleDropdown('serviceVehicle');
        this.updateServiceBookingOptions(partner.type); // Populate services based on partner type (simplified)

        // Set min date for service booking to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('serviceDate').min = today;
    }

    updateServiceBookingOptions(partnerType) {
        const selectService = document.getElementById('selectedService');
        selectService.innerHTML = '<option value="">Select a service</option>';
        let availableServices = [];

        // Dummy services based on partner type
        if (partnerType === 'Mechanic' || partnerType === 'Battery Service') {
            availableServices = [
                { value: 'battery-diagnostics', text: 'Battery Diagnostics' },
                { value: 'motor-check', text: 'Electric Motor Check' },
                { value: 'software-update', text: 'Software Update' },
                { value: 'brake-inspection', text: 'Brake Inspection' }
            ];
        } else if (partnerType === 'Car Wash') {
            availableServices = [
                { value: 'premium-wash', text: 'Premium Car Wash' },
                { value: 'standard-wash', text: 'Standard Car Wash' },
                { value: 'interior-clean', text: 'Interior Detailing' }
            ];
        } else {
            availableServices = [
                { value: 'general-service', text: 'General Service' }
            ];
        }

        availableServices.forEach(service => {
            const option = document.createElement('option');
            option.value = service.value;
            option.textContent = service.text;
            selectService.appendChild(option);
        });
    }

    handleServiceBookingForm(event) {
        event.preventDefault();
        const partnerName = document.getElementById('servicePartnerName').value;
        const selectedVehicleId = document.getElementById('serviceVehicle').value;
        const selectedVehicle = this.myVehicles.find(v => v.id === selectedVehicleId);
        const selectedService = document.getElementById('selectedService').value;
        const serviceDate = document.getElementById('serviceDate').value;
        const serviceTime = document.getElementById('serviceTime').value;
        const serviceNotes = document.getElementById('serviceNotes').value;

        if (!selectedVehicle || !selectedService || !serviceDate || !serviceTime) {
            this.showNotification('Please fill all required service booking details.');
            return;
        }

        const newBooking = {
            id: 'sb' + (this.serviceBookings.length + 1),
            type: 'service',
            item: `${selectedService} (${partnerName})`,
            date: serviceDate,
            time: serviceTime,
            status: 'upcoming',
            partnerId: servicePartners.find(p => p.name === partnerName)?.id,
            vehicleId: selectedVehicle.id,
            notes: serviceNotes
        };
        this.serviceBookings.push(newBooking);
        this.saveDataToLocalStorage();
        closeModal('bookServiceModal');
        this.showNotification(`Service booking with ${partnerName} for ${selectedService} on ${serviceDate} at ${serviceTime} confirmed!`);
        this.updateDashboardMetrics();
        this.filterMyBookings('upcoming'); // Refresh bookings table
        this.earnPoints(30, `Booked service with ${partnerName} via platform`); // NEW: Earn points for service booking
    }

    // --- Profile Management ---
    loadProfile() {
        document.getElementById('userDisplayName').textContent = auth.user.displayName;
        document.getElementById('profilePhoto').src = auth.user.photoUrl;
        document.getElementById('profilePhotoPreview').src = auth.user.photoUrl;
        document.getElementById('profileName').value = auth.user.displayName;
        document.getElementById('profileEmail').value = auth.user.email;
        document.getElementById('profilePhone').value = auth.user.phone;
        document.getElementById('profileAddress').value = auth.user.address;
        document.getElementById('membershipTier').value = auth.user.membershipTier;
    }

    saveProfile() {
        auth.user.displayName = document.getElementById('profileName').value;
        auth.user.email = document.getElementById('profileEmail').value;
        auth.user.phone = document.getElementById('profilePhone').value;
        auth.user.address = document.getElementById('profileAddress').value;
        // Membership tier is read-only for demo
        this.showNotification('Profile updated successfully!');
        this.loadProfile(); // Re-render updated profile info
        // In a real app, send data to backend API
    }

    handleProfilePhotoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                auth.user.photoUrl = e.target.result; // Update in dummy auth object
                document.getElementById('profilePhoto').src = e.target.result;
                document.getElementById('profilePhotoPreview').src = e.target.result;
                driver.showNotification('Profile photo updated!');
                // In a real app, upload to server and save URL
            };
            reader.readAsDataURL(file);
        }
    }

    toggleProfileDropdown() {
        document.getElementById('profileDropdown').classList.toggle('active');
    }
}

const driver = new Driver();

// Event listeners for form submissions
document.getElementById('vehicleForm')?.addEventListener('submit', (e) => driver.handleVehicleFormSubmit(e));
document.getElementById('energyRequestForm')?.addEventListener('submit', (e) => driver.handleEnergyRequestForm(e));
document.getElementById('serviceBookingForm')?.addEventListener('submit', (e) => driver.handleServiceBookingForm(e));

// Ensure driver object is globally accessible
window.driver = driver;

// Initial calls when script loads
document.addEventListener('DOMContentLoaded', () => {
    // Dummy authentication for demonstration
    localStorage.setItem(auth.tokenKey, 'dummy_token_driver_456');
    localStorage.setItem(auth.roleKey, 'driver');

    const token = localStorage.getItem(auth.tokenKey);
    const role = localStorage.getItem(auth.roleKey);
    if (!token || role !== 'driver') {
        alert('Unauthorized access. Please log in as a driver.');
        // In a real application, uncomment the line below to redirect
        // window.location.href = 'index.html';
        return;
    }

    // Set initial active page and update UI
    showPage('dashboard');
    document.getElementById('userDisplayName').textContent = auth.user.displayName;
    document.getElementById('profilePhoto').src = auth.user.photoUrl; // Set initial profile photo

    // Set min date for booking forms to today
    const today = new Date().toISOString().split('T')[0];
    const chargerBookingDate = document.getElementById('chargerBookingDate');
    if (chargerBookingDate) {
        chargerBookingDate.min = today;
    }
    const serviceDate = document.getElementById('serviceDate');
    if (serviceDate) {
        serviceDate.min = today;
    }

    // Attach photo upload listener (moved here to ensure element exists)
    const profilePhotoInput = document.getElementById('profilePhotoInput');
    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', driver.handleProfilePhotoUpload);
    }
});