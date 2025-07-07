class ChargerHostPanel {
    constructor() {
        this.chargersData = [];
        this.bookingsData = [];
        this.promotionsData = [];
        this.defaultSettings = {
            hostName: "EV Charger Host Inc.",
            hostEmail: "host@evchargers.com",
            hostPhone: "+1 (555) 123-4567",
            defaultPrice: 0.25,
            defaultPower: 50,
            emailNotifications: true,
            smsNotifications: false,
        };

        this.loadDataFromLocalStorage();
        this.initEventListeners();
    }

    loadDataFromLocalStorage() {
        const storedChargers = localStorage.getItem('charger_host_chargers');
        if (storedChargers) {
            this.chargersData = JSON.parse(storedChargers);
        } else {
            this.chargersData = [
                { id: 'c1', name: 'Downtown Charger A', location: '123 Main St, Anytown USA', type: 'Type 2', status: 'Online', price: 0.25, power: 22, workingHours: { start: '08:00', end: '22:00' } },
                { id: 'c2', name: 'Downtown Garage Unit B', location: '456 Central Ave, Anytown, USA', type: 'CCS', status: 'Charging', price: 0.30, power: 50, workingHours: { start: '09:00', end: '18:00' } },
                { id: 'c3', name: 'Suburb Fast Charger', location: '789 Park Rd, Suburbia, USA', type: 'CHAdeMO', status: 'Offline', price: 0.28, power: 75, workingHours: { start: '06:00', end: '23:00' } }
            ];
        }

        const storedBookings = localStorage.getItem('charger_host_bookings');
        if (storedBookings) {
            this.bookingsData = JSON.parse(storedBookings);
        } else {
            this.bookingsData = [
                { id: 'BKG001', charger: 'c1', date: '2025-06-10', time: '10:00', duration: '2 hours', customer: 'John Doe', status: 'Pending' },
                { id: 'BKG002', charger: 'c2', date: '2025-06-08', time: '14:30', duration: '1 hour', customer: 'Jane Smith', status: 'Completed' },
                { id: 'BKG003', charger: 'c3', date: '2025-06-12', time: '11:00', duration: '3 hours', customer: 'Peter Jones', status: 'Pending' },
                { id: 'BKG004', charger: 'c1', date: '2025-06-05', time: '09:00', duration: '1.5 hours', customer: 'Alice Brown', status: 'Cancelled' }
            ];
        }

        const storedPromotions = localStorage.getItem('charger_host_promotions');
        if (storedPromotions) {
            this.promotionsData = JSON.parse(storedPromotions);
        } else {
            this.promotionsData = [
                { id: 'P001', code: 'SUMMER20', description: '20% off all charges', type: 'percentage', value: 20, expiryDate: '2025-08-31', usageLimit: 100 },
                { id: 'P002', code: 'NEWUSER5', description: '$5 off first charge', type: 'fixed', value: 5, expiryDate: '2025-12-31', usageLimit: null }
            ];
        }
        this.showNotification('Data loaded from local storage.');
    }

    saveDataToLocalStorage() {
        localStorage.setItem('charger_host_chargers', JSON.stringify(this.chargersData));
        localStorage.setItem('charger_host_bookings', JSON.stringify(this.bookingsData));
        localStorage.setItem('charger_host_promotions', JSON.stringify(this.promotionsData));
        this.showNotification('Data saved to local storage.');
    }

    initEventListeners() {
        document.getElementById('chargerForm')?.addEventListener('submit', (e) => this.handleChargerForm(e));
        document.getElementById('bookingForm')?.addEventListener('submit', (e) => this.handleBookingForm(e));
        document.getElementById('promotionForm')?.addEventListener('submit', (e) => this.handlePromotionForm(e));
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const content = document.getElementById('content');
        sidebar.classList.toggle('active');
        if (sidebar.classList.contains('active')) {
            content.style.marginLeft = '220px';
        } else {
            content.style.marginLeft = '0';
        }
    }

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
        document.getElementById(pageId).style.display = 'block';
        document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
        document.querySelector(`.sidebar a[onclick="showPage('${pageId}')"]`).classList.add('active');
        document.getElementById('page-title').textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1);

        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('active');
            document.getElementById('content').style.marginLeft = '0';
        }

        // Re-initialize charts and tables
        if (pageId === 'dashboard') {
            this.initDashboardCharts();
            this.updateRecentBookingsTable();
            this.updateChargerStatusOverview();
        }
        if (pageId === 'chargers') this.updateChargersTable(this.chargersData);
        if (pageId === 'bookings') {
            this.populateChargerSelect(); // Populate charger dropdown for bookings
            this.updateBookingsTable(this.bookingsData);
        }
        if (pageId === 'analytics') this.initAnalyticsCharts();
        if (pageId === 'promotions') this.updatePromotionsTable();
        if (pageId === 'settings') this.loadSettings();
    }

    // Dashboard Functions
    initDashboardCharts() {
        if (this.hourlyUsageChartInstance) {
            this.hourlyUsageChartInstance.destroy();
        }
        const hourlyUsageCtx = document.getElementById('hourlyUsageChart').getContext('2d');
        this.hourlyUsageChartInstance = new Chart(hourlyUsageCtx, {
            type: 'line',
            data: {
                labels: ['12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'],
                datasets: [{
                    label: 'Number of Sessions',
                    data: [10, 8, 6, 4, 5, 7, 12, 18, 22, 20, 15, 12, 18, 20, 24, 23, 19, 15, 12, 10, 8, 7, 6, 5], // Dummy data
                    borderColor: '#2e5a50',
                    backgroundColor: 'rgba(46, 90, 80, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
        this.updateDashboardMetrics();
    }

    updateDashboardMetrics() {
        const totalChargers = this.chargersData.length;
        const onlineChargers = this.chargersData.filter(c => c.status === 'Online').length;
        const totalBookings = this.bookingsData.length;
        const estimatedRevenue = this.calculateEstimatedMonthlyRevenue();

        document.getElementById('totalChargers').textContent = totalChargers;
        document.getElementById('onlineChargers').textContent = onlineChargers;
        document.getElementById('totalBookings').textContent = totalBookings;
        document.getElementById('estimatedRevenue').textContent = `$${estimatedRevenue.toFixed(2)}`;
    }

    calculateEstimatedMonthlyRevenue() {
        // This is a simplified estimation. A real calculation would involve:
        // - actual session data (duration, power, price)
        // - completed bookings only
        // For demonstration, let's assume an average booking value and frequency
        const avgBookingValue = 5; // e.g., $5 per booking
        const monthlyBookingEstimate = this.bookingsData.filter(b => b.status === 'Completed' && new Date(b.date).getMonth() === new Date().getMonth()).length;
        return monthlyBookingEstimate * avgBookingValue * 1.2; // Add some buffer for unrecorded sessions
    }

    updateRecentBookingsTable() {
        const table = document.getElementById('recentBookingsTable');
        table.innerHTML = `<tr><th>ID</th><th>Charger</th><th>Customer</th><th>Date</th><th>Status</th></tr>`; // Reset table
        const recentBookings = this.bookingsData
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .slice(0, 5); // Get top 5 recent bookings

        recentBookings.forEach(booking => {
            const row = table.insertRow();
            const chargerName = this.chargersData.find(c => c.id === booking.charger)?.name || 'N/A';
            row.innerHTML = `
                <td>${booking.id}</td>
                <td>${chargerName}</td>
                <td>${booking.customer}</td>
                <td>${booking.date}</td>
                <td><span class="booking-status-${booking.status}">${booking.status}</span></td>
            `;
        });
    }

    updateChargerStatusOverview() {
        const table = document.getElementById('chargerStatusTable');
        table.innerHTML = `<tr><th>Charger Name</th><th>Location</th><th>Status</th></tr>`; // Reset table
        this.chargersData.forEach(charger => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${charger.name}</td>
                <td>${charger.location}</td>
                <td><span class="status-${charger.status}">${charger.status}</span></td>
            `;
        });
    }

    // Charger Management
    updateChargersTable(data) {
        const table = document.getElementById('chargersTable');
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
        data.forEach(charger => {
            const row = table.insertRow();
            const statusIcon = charger.status === 'Online' ? 'fa-toggle-on' : 'fa-toggle-off';
            row.innerHTML = `
                <td>${charger.id}</td>
                <td>${charger.name}</td>
                <td>${charger.location}</td>
                <td>${charger.type}</td>
                <td>${charger.power}</td>
                <td>$${charger.price.toFixed(2)}</td>
                <td>${charger.workingHours.start} - ${charger.workingHours.end}</td>
                <td><span class="status-${charger.status}">${charger.status}</span></td>
                <td class="action-icons">
                    <i class="fas fa-edit" title="Edit" onclick="hostPanel.editCharger('${charger.id}')"></i>
                    <i class="fas fa-trash" title="Delete" onclick="hostPanel.deleteCharger('${charger.id}')"></i>
                    <i class="fas ${statusIcon}" title="Toggle Status" onclick="hostPanel.toggleChargerStatus('${charger.id}', '${charger.status}')"></i>
                </td>`;
        });
    }

    searchChargers() {
        const input = document.querySelector('#chargers .search-bar');
        const filter = input.value.toLowerCase();
        const filteredData = this.chargersData.filter(charger =>
            charger.name.toLowerCase().includes(filter) ||
            charger.location.toLowerCase().includes(filter) ||
            charger.type.toLowerCase().includes(filter) ||
            charger.status.toLowerCase().includes(filter)
        );
        this.updateChargersTable(filteredData);
    }

    showAddChargerForm(chargerId = null) {
        const formDiv = document.getElementById('addChargerForm');
        const chargerForm = document.getElementById('chargerForm');
        chargerForm.reset();
        formDiv.style.display = 'block';
        chargerForm.dataset.editingId = '';

        if (chargerId) {
            const charger = this.chargersData.find(c => c.id === chargerId);
            if (charger) {
                document.getElementById('chargerName').value = charger.name;
                document.getElementById('chargerLocation').value = charger.location;
                document.getElementById('chargerType').value = charger.type;
                document.getElementById('chargerPower').value = charger.power;
                document.getElementById('chargerPrice').value = charger.price;
                document.getElementById('chargerWorkingHoursStart').value = charger.workingHours.start;
                document.getElementById('chargerWorkingHoursEnd').value = charger.workingHours.end;
                document.getElementById('chargerStatus').value = charger.status;
                chargerForm.dataset.editingId = charger.id;
            }
        }
    }

    hideAddChargerForm() {
        document.getElementById('addChargerForm').style.display = 'none';
        document.getElementById('chargerForm').reset();
        document.getElementById('chargerForm').dataset.editingId = '';
    }

    handleChargerForm(e) {
        e.preventDefault();
        const form = document.getElementById('chargerForm');
        const editingId = form.dataset.editingId;

        const newCharger = {
            name: form.elements['name'].value,
            location: form.elements['location'].value,
            type: form.elements['type'].value,
            power: parseFloat(form.elements['power'].value),
            price: parseFloat(form.elements['price'].value),
            workingHours: {
                start: form.elements['workingHoursStart'].value,
                end: form.elements['workingHoursEnd'].value
            },
            status: form.elements['status'].value
        };

        if (isNaN(newCharger.power) || newCharger.power <= 0 || isNaN(newCharger.price) || newCharger.price < 0) {
            this.showNotification('Please enter valid positive numbers for power and price.');
            return;
        }

        if (editingId) {
            const chargerIndex = this.chargersData.findIndex(c => c.id === editingId);
            if (chargerIndex !== -1) {
                Object.assign(this.chargersData[chargerIndex], newCharger);
                this.showNotification(`Charger ${editingId} updated successfully!`);
            }
        } else {
            newCharger.id = 'c' + (this.chargersData.length > 0 ? Math.max(...this.chargersData.map(c => parseInt(c.id.substring(1)))) + 1 : 1);
            this.chargersData.push(newCharger);
            this.showNotification('New charger added successfully!');
        }
        this.saveDataToLocalStorage();
        this.updateChargersTable(this.chargersData);
        this.updateDashboardMetrics();
        this.hideAddChargerForm();
    }

    editCharger(id) {
        this.showAddChargerForm(id);
    }

    deleteCharger(id) {
        if (confirm(`Are you sure you want to delete charger ${id}?`)) {
            this.chargersData = this.chargersData.filter(c => c.id !== id);
            this.saveDataToLocalStorage();
            this.updateChargersTable(this.chargersData);
            this.updateDashboardMetrics();
            this.showNotification(`Charger ${id} deleted.`);
        }
    }

    toggleChargerStatus(id, currentStatus) {
        const charger = this.chargersData.find(c => c.id === id);
        if (charger) {
            // Simplified toggle logic: Online <-> Offline
            if (currentStatus === 'Online') {
                charger.status = 'Offline';
                this.showNotification(`Charger ${id} set to Offline.`);
            } else if (currentStatus === 'Offline') {
                charger.status = 'Online';
                this.showNotification(`Charger ${id} set to Online.`);
            } else {
                // For Charging/Maintenance, toggle to Online/Offline explicitly or prompt for choice
                charger.status = 'Online'; // Default to Online if not already Offline
                this.showNotification(`Charger ${id} status adjusted to Online.`);
            }
            this.saveDataToLocalStorage();
            this.updateChargersTable(this.chargersData);
            this.updateDashboardMetrics();
        }
    }


    // Booking Management
    populateChargerSelect() {
        const select = document.getElementById('bookingCharger');
        select.innerHTML = '<option value="">Select Charger</option>';
        this.chargersData.forEach(charger => {
            const option = document.createElement('option');
            option.value = charger.id;
            option.textContent = `${charger.name} (${charger.location})`;
            select.appendChild(option);
        });
    }

    updateBookingsTable(data) {
        const table = document.getElementById('bookingsTable');
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
        data.forEach(booking => {
            const row = table.insertRow();
            const chargerName = this.chargersData.find(c => c.id === booking.charger)?.name || 'N/A';
            row.innerHTML = `
                <td>${booking.id}</td>
                <td>${chargerName}</td>
                <td>${booking.date}</td>
                <td>${booking.time}</td>
                <td>${booking.duration}</td>
                <td>${booking.customer}</td>
                <td><span class="booking-status-${booking.status}">${booking.status}</span></td>
                <td class="action-icons">
                    <i class="fas fa-edit" title="Edit" onclick="hostPanel.editBooking('${booking.id}')"></i>
                    <i class="fas fa-trash" title="Delete" onclick="hostPanel.deleteBooking('${booking.id}')"></i>
                    ${booking.status === 'Pending' ? `<i class="fas fa-check-circle" title="Mark as Completed" onclick="hostPanel.markBookingStatus('${booking.id}', 'Completed')"></i>` : ''}
                    ${booking.status === 'Pending' ? `<i class="fas fa-times-circle" title="Mark as Cancelled" onclick="hostPanel.markBookingStatus('${booking.id}', 'Cancelled')"></i>` : ''}
                </td>`;
        });
    }

    filterBookings(status) {
        const filteredData = status === 'All' ? this.bookingsData : this.bookingsData.filter(b => b.status === status);
        this.updateBookingsTable(filteredData);
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`.tab[onclick="filterBookings('${status}')"]`).classList.add('active');
    }

    searchBookings() {
        const input = document.querySelector('#bookings .search-bar');
        const filter = input.value.toLowerCase();
        const filteredData = this.bookingsData.filter(booking =>
            booking.customer.toLowerCase().includes(filter) ||
            booking.charger.toLowerCase().includes(filter) ||
            booking.date.includes(filter)
        );
        this.updateBookingsTable(filteredData);
    }

    showAddBookingForm(bookingId = null) {
        const formDiv = document.getElementById('addBookingForm');
        const bookingForm = document.getElementById('bookingForm');
        bookingForm.reset();
        this.populateChargerSelect(); // Ensure dropdown is populated
        formDiv.style.display = 'block';
        bookingForm.dataset.editingId = '';

        if (bookingId) {
            const booking = this.bookingsData.find(b => b.id === bookingId);
            if (booking) {
                document.getElementById('bookingCharger').value = booking.charger;
                document.getElementById('bookingCustomerName').value = booking.customer;
                document.getElementById('bookingDate').value = booking.date;
                document.getElementById('bookingTime').value = booking.time;
                document.getElementById('bookingDuration').value = booking.duration;
                bookingForm.dataset.editingId = booking.id;
            }
        }
    }

    hideAddBookingForm() {
        document.getElementById('addBookingForm').style.display = 'none';
        document.getElementById('bookingForm').reset();
        document.getElementById('bookingForm').dataset.editingId = '';
    }

    handleBookingForm(e) {
        e.preventDefault();
        const form = document.getElementById('bookingForm');
        const editingId = form.dataset.editingId;

        const newBooking = {
            charger: form.elements['charger'].value,
            customer: form.elements['customer'].value,
            date: form.elements['date'].value,
            time: form.elements['time'].value,
            duration: form.elements['duration'].value,
            status: 'Pending' // New bookings are always pending
        };

        if (editingId) {
            const bookingIndex = this.bookingsData.findIndex(b => b.id === editingId);
            if (bookingIndex !== -1) {
                // Preserve original status if editing
                newBooking.status = this.bookingsData[bookingIndex].status;
                Object.assign(this.bookingsData[bookingIndex], newBooking);
                this.showNotification(`Booking ${editingId} updated successfully!`);
            }
        } else {
            newBooking.id = 'BKG' + (this.bookingsData.length > 0 ? (parseInt(this.bookingsData[this.bookingsData.length - 1].id.substring(3)) + 1).toString().padStart(3, '0') : '001');
            this.bookingsData.push(newBooking);
            this.showNotification('New booking added successfully!');
        }
        this.saveDataToLocalStorage();
        this.updateBookingsTable(this.bookingsData);
        this.updateDashboardMetrics();
        this.hideAddBookingForm();
    }

    editBooking(id) {
        this.showAddBookingForm(id);
    }

    deleteBooking(id) {
        if (confirm(`Are you sure you want to delete booking ${id}?`)) {
            this.bookingsData = this.bookingsData.filter(b => b.id !== id);
            this.saveDataToLocalStorage();
            this.updateBookingsTable(this.bookingsData);
            this.updateDashboardMetrics();
            this.showNotification(`Booking ${id} deleted.`);
        }
    }

    markBookingStatus(id, status) {
        const booking = this.bookingsData.find(b => b.id === id);
        if (booking) {
            booking.status = status;
            this.saveDataToLocalStorage();
            this.updateBookingsTable(this.bookingsData);
            this.updateDashboardMetrics();
            this.showNotification(`Booking ${id} marked as ${status}.`);
        }
    }

    // Analytics
    initAnalyticsCharts() {
        if (this.monthlyRevenueChartInstance) this.monthlyRevenueChartInstance.destroy();
        if (this.chargerTypeUsageChartInstance) this.chargerTypeUsageChartInstance.destroy();
        if (this.peakUsageHoursChartInstance) this.peakUsageHoursChartInstance.destroy();

        const monthlyRevenueCtx = document.getElementById('monthlyRevenueChart').getContext('2d');
        this.monthlyRevenueChartInstance = new Chart(monthlyRevenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Monthly Revenue ($)',
                    data: [1500, 2000, 1800, 2500, 2200, 2800], // Dummy data
                    borderColor: '#2e5a50',
                    fill: false,
                    tension: 0.1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        const chargerTypeUsageCtx = document.getElementById('chargerTypeUsageChart').getContext('2d');
        this.chargerTypeUsageChartInstance = new Chart(chargerTypeUsageCtx, {
            type: 'pie',
            data: {
                labels: ['Type 2', 'CCS', 'CHAdeMO'],
                datasets: [{
                    data: [40, 35, 25], // Dummy data based on usage
                    backgroundColor: ['#2e5a50', '#f4a261', '#e76f51']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        const peakUsageHoursCtx = document.getElementById('peakUsageHoursChart').getContext('2d');
        this.peakUsageHoursChartInstance = new Chart(peakUsageHoursCtx, {
            type: 'bar',
            data: {
                labels: ['8-9 AM', '12-1 PM', '5-6 PM', '7-8 PM'], // Dummy peak hours
                datasets: [{
                    label: 'Average Sessions',
                    data: [15, 20, 25, 18], // Dummy data
                    backgroundColor: '#2e5a50'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    async predictDemand() {
        this.showNotification('Generating demand forecast (simulated)...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('Simulated demand prediction data for chargers.');
        this.showNotification('Demand forecast generated!');
    }

    async optimizePricing() {
        this.showNotification('Optimizing pricing (simulated)...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('Simulated pricing optimization data.');
        this.showNotification('Pricing optimization complete!');
    }

    async identifyUnderperformingChargers() {
        this.showNotification('Identifying underperforming chargers (simulated)...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('Simulated underperforming charger data.');
        this.showNotification('Underperforming chargers identified!');
    }

    // Promotions Management
    updatePromotionsTable() {
        const table = document.getElementById('promotionsTable');
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
        this.promotionsData.forEach(promo => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${promo.id}</td>
                <td>${promo.code}</td>
                <td>${promo.description}</td>
                <td>${promo.type === 'percentage' ? 'Percentage Off' : 'Fixed Amount Off'}</td>
                <td>${promo.type === 'percentage' ? `${promo.value}%` : `$${promo.value.toFixed(2)}`}</td>
                <td>${promo.expiryDate || 'N/A'}</td>
                <td>${promo.usageLimit !== null ? promo.usageLimit : 'Unlimited'}</td>
                <td class="action-icons">
                    <i class="fas fa-edit" title="Edit" onclick="hostPanel.editPromotion('${promo.id}')"></i>
                    <i class="fas fa-trash" title="Delete" onclick="hostPanel.deletePromotion('${promo.id}')"></i>
                </td>`;
        });
    }

    showAddPromotionForm(promotionId = null) {
        const formDiv = document.getElementById('addPromotionForm');
        const promotionForm = document.getElementById('promotionForm');
        promotionForm.reset();
        formDiv.style.display = 'block';
        promotionForm.dataset.editingId = '';

        if (promotionId) {
            const promo = this.promotionsData.find(p => p.id === promotionId);
            if (promo) {
                document.getElementById('promoCode').value = promo.code;
                document.getElementById('promoDescription').value = promo.description;
                document.getElementById('promoType').value = promo.type;
                document.getElementById('promoValue').value = promo.value;
                document.getElementById('promoExpiryDate').value = promo.expiryDate;
                document.getElementById('promoUsageLimit').value = promo.usageLimit !== null ? promo.usageLimit : '';
                promotionForm.dataset.editingId = promo.id;
            }
        }
    }

    hideAddPromotionForm() {
        document.getElementById('addPromotionForm').style.display = 'none';
        document.getElementById('promotionForm').reset();
        document.getElementById('promotionForm').dataset.editingId = '';
    }

    handlePromotionForm(e) {
        e.preventDefault();
        const form = document.getElementById('promotionForm');
        const editingId = form.dataset.editingId;

        const usageLimitVal = form.elements['usageLimit'].value;
        const newPromotion = {
            code: form.elements['code'].value,
            description: form.elements['description'].value,
            type: form.elements['type'].value,
            value: parseFloat(form.elements['value'].value),
            expiryDate: form.elements['expiryDate'].value || null,
            usageLimit: usageLimitVal ? parseInt(usageLimitVal) : null
        };

        if (isNaN(newPromotion.value) || newPromotion.value < 0 || (newPromotion.usageLimit !== null && (isNaN(newPromotion.usageLimit) || newPromotion.usageLimit < 0))) {
            this.showNotification('Please enter valid positive numbers for value and usage limit.');
            return;
        }

        if (editingId) {
            const promoIndex = this.promotionsData.findIndex(p => p.id === editingId);
            if (promoIndex !== -1) {
                Object.assign(this.promotionsData[promoIndex], newPromotion);
                this.showNotification(`Promotion ${editingId} updated successfully!`);
            }
        } else {
            newPromotion.id = 'P' + (this.promotionsData.length > 0 ? (parseInt(this.promotionsData[this.promotionsData.length - 1].id.substring(1)) + 1).toString().padStart(3, '0') : '001');
            this.promotionsData.push(newPromotion);
            this.showNotification('New promotion added successfully!');
        }
        this.saveDataToLocalStorage();
        this.updatePromotionsTable();
        this.hideAddPromotionForm();
    }

    editPromotion(id) {
        this.showAddPromotionForm(id);
    }

    deletePromotion(id) {
        if (confirm(`Are you sure you want to delete promotion ${id}?`)) {
            this.promotionsData = this.promotionsData.filter(p => p.id !== id);
            this.saveDataToLocalStorage();
            this.updatePromotionsTable();
            this.showNotification(`Promotion ${id} deleted.`);
        }
    }

    // Settings Management
    saveSettings() {
        const settings = {
            hostName: document.getElementById('hostName').value,
            hostEmail: document.getElementById('hostEmail').value,
            hostPhone: document.getElementById('hostPhone').value,
            defaultPrice: parseFloat(document.getElementById('defaultPrice').value),
            defaultPower: parseFloat(document.getElementById('defaultPower').value),
            emailNotifications: document.getElementById('emailNotifications').checked,
            smsNotifications: document.getElementById('smsNotifications').checked,
        };
        localStorage.setItem('hostSettings', JSON.stringify(settings));
        console.log('Settings saved:', settings);
        this.showNotification('Settings saved successfully!');
    }

    loadSettings() {
        const storedSettings = localStorage.getItem('hostSettings');
        let currentSettings = { ...this.defaultSettings };
        if (storedSettings) {
            try {
                Object.assign(currentSettings, JSON.parse(storedSettings));
            } catch (e) {
                console.error("Error parsing stored settings:", e);
            }
        }
        document.getElementById('hostName').value = currentSettings.hostName;
        document.getElementById('hostEmail').value = currentSettings.hostEmail;
        document.getElementById('hostPhone').value = currentSettings.hostPhone;
        document.getElementById('defaultPrice').value = currentSettings.defaultPrice;
        document.getElementById('defaultPower').value = currentSettings.defaultPower;
        document.getElementById('emailNotifications').checked = currentSettings.emailNotifications;
        document.getElementById('smsNotifications').checked = currentSettings.smsNotifications;
        this.showNotification('Settings loaded.');
    }

    resetSettings() {
        document.getElementById('hostName').value = this.defaultSettings.hostName;
        document.getElementById('hostEmail').value = this.defaultSettings.hostEmail;
        document.getElementById('hostPhone').value = this.defaultSettings.hostPhone;
        document.getElementById('defaultPrice').value = this.defaultSettings.defaultPrice;
        document.getElementById('defaultPower').value = this.defaultSettings.defaultPower;
        document.getElementById('emailNotifications').checked = this.defaultSettings.emailNotifications;
        document.getElementById('smsNotifications').checked = this.defaultSettings.smsNotifications;
        localStorage.removeItem('hostSettings');
        this.showNotification('Settings reset to defaults.');
    }

    // Utility
    showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

// Dummy authentication object for local testing purposes
const auth = {
    tokenKey: 'charger_host_auth_token',
    roleKey: 'charger_host_user_role',
    logout: function() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.roleKey);
        alert('Logged out. Redirecting to login page.');
        window.location.href = 'index.html'; // Redirect to your login page
    }
};

const hostPanel = new ChargerHostPanel();

window.onload = () => {
    // Simulate successful login for demonstration
    localStorage.setItem(auth.tokenKey, 'dummy_host_token_456');
    localStorage.setItem(auth.roleKey, 'charger_host');

    const token = localStorage.getItem(auth.tokenKey);
    const role = localStorage.getItem(auth.roleKey);

    if (!token || role !== 'charger_host') {
        alert('Unauthorized access. Please log in as a charger host.');
        // window.location.href = 'index.html'; // Uncomment in a real application
        return;
    }

    hostPanel.showPage('dashboard');
    setInterval(() => {
        hostPanel.updateDashboardMetrics();
        console.log('Dashboard metrics refreshed.');
    }, 60000); // Refresh every minute
};

// Expose functions to global scope for HTML event handlers
window.showPage = (pageId) => hostPanel.showPage(pageId);
window.toggleSidebar = () => hostPanel.toggleSidebar();
window.searchChargers = () => hostPanel.searchChargers();
window.showAddChargerForm = (id) => hostPanel.showAddChargerForm(id);
window.hideAddChargerForm = () => hostPanel.hideAddChargerForm();
window.editCharger = (id) => hostPanel.editCharger(id);
window.deleteCharger = (id) => hostPanel.deleteCharger(id);
window.toggleChargerStatus = (id, status) => hostPanel.toggleChargerStatus(id, status);

window.filterBookings = (status) => hostPanel.filterBookings(status);
window.searchBookings = () => hostPanel.searchBookings();
window.showAddBookingForm = (id) => hostPanel.showAddBookingForm(id);
window.hideAddBookingForm = () => hostPanel.hideAddBookingForm();
window.editBooking = (id) => hostPanel.editBooking(id);
window.deleteBooking = (id) => hostPanel.deleteBooking(id);
window.markBookingStatus = (id, status) => hostPanel.markBookingStatus(id, status);

window.predictDemand = () => hostPanel.predictDemand();
window.optimizePricing = () => hostPanel.optimizePricing();
window.identifyUnderperformingChargers = () => hostPanel.identifyUnderperformingChargers();

window.showAddPromotionForm = (id) => hostPanel.showAddPromotionForm(id);
window.hideAddPromotionForm = () => hostPanel.hideAddPromotionForm();
window.editPromotion = (id) => hostPanel.editPromotion(id);
window.deletePromotion = (id) => hostPanel.deletePromotion(id);

window.saveSettings = () => hostPanel.saveSettings();
window.loadSettings = () => hostPanel.loadSettings(); // Not directly called by HTML but good to have
window.resetSettings = () => hostPanel.resetSettings();

// Expose auth for logout
window.auth = auth;