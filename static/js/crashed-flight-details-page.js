const CrashedFlightDetailsPage = {
    render(flightId) {
        return `
            <div class="flight-details-container">
                <div class="back-panel">
                    <button id="backToFlightsBtn" class="btn-secondary">Back to flights</button>
                </div>

                <div id="crashedFlightDetailsContent">
                    <div>Loading crash report...</div>
                </div>
            </div>
        `;
    },

    init(flightId) {
        const contentBlock = document.getElementById('crashedFlightDetailsContent');
        const backBtn = document.getElementById('backToFlightsBtn');

        function handleBackClick() {
            window.location.hash = '#flights';
        }

        function formatDateTime(isoString) {
            return new Date(isoString).toLocaleString('en-US', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        function statusBadge(status) {
            const cssClass = status === 'Dead' || status === 'Crashed'
                ? 'status-crashed'
                : 'status-arrived';

            return `<span class="status-badge ${cssClass}">${status}</span>`;
        }

        function avatarCell(imagePath, firstName, lastName, fallbackPath) {
            const src = imagePath || fallbackPath;

            return `
                <span>
                    <img src="${src}" alt="${firstName} ${lastName}">
                    <strong>${firstName} ${lastName}</strong>
                </span>
            `;
        }

        function renderCrewTable(crew) {
            if (!crew || crew.length === 0) {
                return '<p class="empty-list-text">Crew has not been assigned.</p>';
            }

            const canSeeContracts = crew.some(member => member.employee_number);

            return `
                <table class="details-list-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Role</th>
                            <th>Status</th>
                            ${canSeeContracts ? '<th>Contract number</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${crew.map(member => `
                            <tr>
                                <td>${avatarCell(member.image_path, member.first_name, member.last_name, '/static/img/crew/placeholder.png')}</td>
                                <td>${member.role}</td>
                                <td>${statusBadge(member.status || 'Alive')}</td>
                                ${canSeeContracts ? `<td class="muted-text">${member.employee_number}</td>` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        function renderPassengerTable(passengers) {
            if (!passengers || passengers.length === 0) {
                return '<p class="empty-list-text">There are no registered passengers for this flight.</p>';
            }

            const canSeePassports = passengers.some(passenger => passenger.passport_number);

            return `
                <table class="details-list-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Passenger</th>
                            <th>Status</th>
                            ${canSeePassports ? '<th>Passport number</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${passengers.map((passenger, index) => `
                            <tr>
                                <td class="muted-text">${index + 1}</td>
                                <td>${avatarCell(passenger.image_path, passenger.first_name, passenger.last_name, '/static/img/passengers/placeholder.png')}</td>
                                <td>${statusBadge(passenger.status || 'Alive')}</td>
                                ${canSeePassports ? `<td class="passport-text">${passenger.passport_number}</td>` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        function renderCrashReport(flight) {
            return `
                <div class="flight-main-card">
                    <div class="flight-header">
                        <h1>Crash Report: Flight ${flight.flight_number}</h1>
                        ${statusBadge(flight.status)}
                    </div>

                    <div class="flight-route-grid">
                        <div class="route-point">
                            <div class="airport-big-code">${flight.departure_airport.code}</div>
                            <div class="airport-city">${flight.departure_airport.city}</div>
                            <div class="airport-name">${flight.departure_airport.name}</div>
                            <div class="flight-time">${formatDateTime(flight.departure_time)}</div>
                        </div>

                        <div class="route-duration">
                            <div class="duration-line">→</div>
                            <div class="duration-value">Crashed before arrival</div>
                        </div>

                        <div class="route-point text-right">
                            <div class="airport-big-code">${flight.arrival_airport.code}</div>
                            <div class="airport-city">${flight.arrival_airport.city}</div>
                            <div class="airport-name">${flight.arrival_airport.name}</div>
                            <div class="flight-time">${formatDateTime(flight.arrival_time)}</div>
                        </div>
                    </div>

                    <div class="airplane-info-block">
                        <h3>Crash Cause</h3>
                        <p>${flight.crash_cause || 'Cause has not been recorded yet.'}</p>
                    </div>

                    <div class="airplane-info-block">
                        <h3>Aircraft</h3>
                        <p><strong>Model:</strong> ${flight.airplane.model} (${flight.airplane.tail_number})</p>
                        <p><strong>Capacity:</strong> ${flight.airplane.capacity} passengers</p>
                        <p><strong>Status:</strong> ${statusBadge(flight.airplane.status || 'Crashed')}</p>
                    </div>
                </div>

                <div class="lists-section-grid">
                    <div class="details-block">
                        <h3>Crew</h3>
                        <div class="list-wrapper">${renderCrewTable(flight.crew)}</div>
                    </div>

                    <div class="details-block">
                        <h3>Passengers</h3>
                        <div class="list-wrapper">${renderPassengerTable(flight.passengers)}</div>
                    </div>
                </div>
            `;
        }

        async function loadCrashReport() {
            try {
                const response = await fetch(`/api/flights/${flightId}`, { credentials: 'include' });
                if (!response.ok) throw new Error('Crash report not found');

                const flight = await response.json();
                if (flight.status !== 'Crashed') {
                    window.location.hash = `flight/${flight.id}`;
                    return;
                }

                contentBlock.innerHTML = renderCrashReport(flight);
            } catch (err) {
                contentBlock.innerHTML = `
                    <div>
                        <h3>Failed to load crash report</h3>
                        <p>${err.message}</p>
                    </div>
                `;
            }
        }

        if (backBtn) {
            backBtn.addEventListener('click', handleBackClick);
        }

        loadCrashReport();

        return () => {
            if (backBtn) {
                backBtn.removeEventListener('click', handleBackClick);
            }
        };
    }
};
