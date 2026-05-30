const FlightsPage = {
    render() {
        return `
            <div class="flights-container">
                <div>
                    <h2>Flights</h2>
                    ${AuthState.isVerified() ? '<a href="#flights/new" class="btn-secondary">New flight</a>' : ''}
                </div>
                
                <div class="filters-panel">
                    <div class="filter-group">
                        <label for="filterStatus">Status</label>
                        <select id="filterStatus">
                            <option value="">All statuses</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Flight">In Flight</option>
                            <option value="Arrived">Arrived</option>
                            ${AuthState.isVerified() ? '<option value="Crashed">Crashed</option>' : ''}
                        </select>
                    </div>

                    <div class="filter-group">
                        <label for="filterCity">City</label>
                        <select id="filterCity">
                            <option value="">All cities</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label for="filterDate">Departure date</label>
                        <input type="date" id="filterDate">
                    </div>

                    <button id="resetFiltersBtn" class="btn-secondary">Reset filters</button>
                </div>

                <div class="table-wrapper">
                    <table class="flights-table">
                        <thead>
                            <tr>
                                <th>Flight</th>
                                <th>Aircraft</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Departure</th>
                                <th>Arrival</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="flightsTableBody">
                            <tr>
                                <td colspan="7">Loading flights...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    init() {
        const tableBody = document.getElementById('flightsTableBody');
        const filterStatus = document.getElementById('filterStatus');
        const filterCity = document.getElementById('filterCity');
        const filterDate = document.getElementById('filterDate');
        const resetBtn = document.getElementById('resetFiltersBtn');

        let allFlights = [];

        function formatDateTime(isoString) {
            const dateObj = new Date(isoString);
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `${dateStr} ${timeStr}`;
        }

        function fillCityFilter(flights) {
            const citiesSet = new Set();
            
            flights.forEach(f => {
                if (f.departure_airport.city) citiesSet.add(f.departure_airport.city.strip ? f.departure_airport.city.strip() : f.departure_airport.city);
                if (f.arrival_airport.city) citiesSet.add(f.arrival_airport.city.strip ? f.arrival_airport.city.strip() : f.arrival_airport.city);
            });

            const sortedCities = Array.from(citiesSet).sort();
            
            let optionsHtml = '<option value="">All cities</option>';
            sortedCities.forEach(city => {
                optionsHtml += `<option value="${city}">${city}</option>`;
            });
            filterCity.innerHTML = optionsHtml;
        }

        function renderTable(flights) {
            if (!flights || flights.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7">
                            No flights found
                        </td>
                    </tr>`;
                return;
            }

            let rowsHtml = '';
            flights.forEach(flight => {
                let statusClass = 'status-scheduled';
                if (flight.status === 'In Flight') statusClass = 'status-inflight';
                if (flight.status === 'Arrived') statusClass = 'status-arrived';
                if (flight.status === 'Crashed') statusClass = 'status-crashed';
                const crashedStyle = flight.status === 'Crashed' ? 'background: #fff5f5; color: #c53030;' : '';

                rowsHtml += `
                    <tr class="clickable-row" data-id="${flight.id}" data-status="${flight.status}">
                        <td><strong>${flight.flight_number}</strong></td>
                        <td>${flight.airplane.model}</td>
                        <td><span class="airport-badge">${flight.departure_airport.code}</span> ${flight.departure_airport.city}</td>
                        <td><span class="airport-badge">${flight.arrival_airport.code}</span> ${flight.arrival_airport.city}</td>
                        <td>${formatDateTime(flight.departure_time)}</td>
                        <td>${formatDateTime(flight.arrival_time)}</td>
                        <td><span class="status-badge ${statusClass}">${flight.status}</span></td>
                    </tr>
                `;
            });
            tableBody.innerHTML = rowsHtml;
        }

        function applyFilters() {
            const selectedStatus = filterStatus.value;
            const selectedCity = filterCity.value;
            const selectedDate = filterDate.value;

            const filtered = allFlights.filter(flight => {
                if (selectedStatus && flight.status !== selectedStatus) {
                    return false;
                }

                if (selectedCity) {
                    const depCity = flight.departure_airport.city;
                    const arrCity = flight.arrival_airport.city;
                    if (depCity !== selectedCity && arrCity !== selectedCity) {
                        return false;
                    }
                }

                if (selectedDate) {
                    const flightDateStr = flight.departure_time.split('T')[0]; 
                    if (flightDateStr !== selectedDate) {
                        return false;
                    }
                }

                return true;
            });

            renderTable(filtered);
        }

        function loadInitialData() {
            fetch('/api/flights')
                .then(res => res.json())
                .then(data => {
                    allFlights = AuthState.isVerified()
                        ? data
                        : data.filter(flight => flight.status !== 'Crashed');
                    fillCityFilter(allFlights);
                    renderTable(allFlights);
                })
                .catch(err => {
                    console.error("Failed to load flights:", err);
                    tableBody.innerHTML = `<tr><td colspan="7">Server error</td></tr>`;
                });
        }

        filterStatus.addEventListener('change', applyFilters);
        filterCity.addEventListener('change', applyFilters);
        filterDate.addEventListener('change', applyFilters);

        resetBtn.addEventListener('click', () => {
            filterStatus.value = "";
            filterCity.value = "";
            filterDate.value = "";
            renderTable(allFlights);
        });

        tableBody.addEventListener('click', (e) => {
            const row = e.target.closest('.clickable-row');
            if (row) {
                const flightId = row.dataset.id;
                window.location.hash = row.dataset.status === 'Crashed'
                    ? `crashed-flight/${flightId}`
                    : `flight/${flightId}`;
            }
        });

        loadInitialData();
    }
};
