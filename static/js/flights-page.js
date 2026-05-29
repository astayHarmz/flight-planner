const FlightsPage = {
    render() {
        return `
            <div class="flights-container">
                <h2>Табло рейсов</h2>
                
                <div class="filters-panel">
                    <div class="filter-group">
                        <label for="filterStatus">Статус</label>
                        <select id="filterStatus">
                            <option value="">Все статусы</option>
                            <option value="Scheduled">Scheduled (Запланирован)</option>
                            <option value="In Flight">In Flight (В полете)</option>
                            <option value="Arrived">Arrived (Прибыл)</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label for="filterCity">Город (Вылет/Прилет)</label>
                        <select id="filterCity">
                            <option value="">Все города</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label for="filterDate">Дата вылета</label>
                        <input type="date" id="filterDate">
                    </div>

                    <button id="resetFiltersBtn" class="btn-secondary">Сбросить</button>
                </div>

                <div class="table-wrapper">
                    <table class="flights-table">
                        <thead>
                            <tr>
                                <th>Рейс</th>
                                <th>Самолет</th>
                                <th>Откуда</th>
                                <th>Куда</th>
                                <th>Вылет</th>
                                <th>Прилет</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody id="flightsTableBody">
                            <tr>
                                <td colspan="7" style="text-align: center; color: #718096;">Загрузка рейсов...</td>
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
            const dateStr = dateObj.toLocaleDateString('ru-RU');
            const timeStr = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            return `${dateStr} в ${timeStr}`;
        }

        function fillCityFilter(flights) {
            const citiesSet = new Set();
            
            flights.forEach(f => {
                if (f.departure_airport.city) citiesSet.add(f.departure_airport.city.strip ? f.departure_airport.city.strip() : f.departure_airport.city);
                if (f.arrival_airport.city) citiesSet.add(f.arrival_airport.city.strip ? f.arrival_airport.city.strip() : f.arrival_airport.city);
            });

            const sortedCities = Array.from(citiesSet).sort();
            
            let optionsHtml = '<option value="">Все города</option>';
            sortedCities.forEach(city => {
                optionsHtml += `<option value="${city}">${city}</option>`;
            });
            filterCity.innerHTML = optionsHtml;
        }

        function renderTable(flights) {
            if (!flights || flights.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 20px; color: #718096;">
                            Рейсы не найдены
                        </td>
                    </tr>`;
                return;
            }

            let rowsHtml = '';
            flights.forEach(flight => {
                let statusClass = 'status-scheduled';
                if (flight.status === 'In Flight') statusClass = 'status-inflight';
                if (flight.status === 'Arrived') statusClass = 'status-arrived';

                rowsHtml += `
                    <tr class="clickable-row" data-id="${flight.id}" style="cursor: pointer;">
                        <td><strong>${flight.flight_number}</strong></td>
                        <td style="color: #4a5568;">${flight.airplane.model}</td>
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
                    allFlights = data;
                    fillCityFilter(allFlights);
                    renderTable(allFlights);
                })
                .catch(err => {
                    console.error("Ошибка загрузки данных:", err);
                    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Ошибка сервера</td></tr>`;
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
                window.location.hash = `flight/${flightId}`;
            }
        });

        loadInitialData();
    }
};