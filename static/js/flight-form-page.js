const FlightFormPage = {
    render(flightId = null) {
        const isEdit = Boolean(flightId);

        return `

            <section class="flight-form-page">
                <div class="flight-form-header">
                    <h2>${isEdit ? 'Edit Flight' : 'Create Flight'}</h2>
                    <a href="#flights" class="btn-secondary">Back to flights</a>
                </div>

                <form class="flight-form" id="flightForm">
                    <div class="flight-form-section full">
                        <h3>Flight Details</h3>
                        <div class="flight-form-grid">
                            <label class="flight-field">
                                <span>Flight number</span>
                                <input id="flightNumber" name="flight_number" type="text" maxlength="10" required>
                            </label>

                            <label class="flight-field">
                                <span>Aircraft</span>
                                <select id="airplaneId" name="airplane_id" required></select>
                                <button class="flight-inline-btn" id="createAirplaneBtn" type="button">Create aircraft</button>
                            </label>

                            <label class="flight-field">
                                <span>Departure airport</span>
                                <select id="departureAirportId" name="departure_airport_id" required></select>
                                <button class="flight-inline-btn" data-create-airport-for="departure" type="button">Create airport</button>
                            </label>

                            <label class="flight-field">
                                <span>Arrival airport</span>
                                <select id="arrivalAirportId" name="arrival_airport_id" required></select>
                                <button class="flight-inline-btn" data-create-airport-for="arrival" type="button">Create airport</button>
                            </label>

                            <label class="flight-field">
                                <span>Departure time</span>
                                <input id="departureTime" name="departure_time" type="datetime-local" required>
                            </label>

                            <label class="flight-field">
                                <span>Arrival time</span>
                                <input id="arrivalTime" type="text" readonly>
                            </label>
                        </div>
                    </div>

                    <div class="flight-form-section">
                        <h3>Crew</h3>
                        <button class="flight-inline-btn" id="createCrewBtn" type="button">Create crew member</button>
                        <div class="flight-pick-list" id="crewList">
                            <div>Select route and departure time</div>
                        </div>
                    </div>

                    <div class="flight-form-section">
                        <h3>Passengers</h3>
                        <button class="flight-inline-btn" id="createPassengerBtn" type="button">Create passenger</button>
                        <div class="flight-pick-list" id="passengerList">
                            <div>Select route and departure time</div>
                        </div>
                    </div>

                    <div class="flight-form-section full">
                        <div class="flight-form-message" id="flightFormMessage"></div>
                        <div class="flight-form-actions">
                            ${isEdit ? '<button class="flight-delete-btn" id="deleteFlightBtn" type="button">Delete flight</button>' : ''}
                            <a href="#flights" class="btn-secondary">Cancel</a>
                            <button class="flight-save-btn" id="saveFlightBtn" type="submit">${isEdit ? 'Save' : 'Create'}</button>
                        </div>
                    </div>
                </form>
            </section>
        `;
    },

    init(flightId = null) {
        const form = document.getElementById('flightForm');
        const message = document.getElementById('flightFormMessage');
        const saveBtn = document.getElementById('saveFlightBtn');
        const deleteBtn = document.getElementById('deleteFlightBtn');
        const createAirplaneBtn = document.getElementById('createAirplaneBtn');
        const createCrewBtn = document.getElementById('createCrewBtn');
        const createPassengerBtn = document.getElementById('createPassengerBtn');
        const flightNumber = document.getElementById('flightNumber');
        const airplaneId = document.getElementById('airplaneId');
        const departureAirportId = document.getElementById('departureAirportId');
        const arrivalAirportId = document.getElementById('arrivalAirportId');
        const departureTime = document.getElementById('departureTime');
        const arrivalTime = document.getElementById('arrivalTime');
        const crewList = document.getElementById('crewList');
        const passengerList = document.getElementById('passengerList');
        const selectedCrewIds = new Set();
        const selectedPassengerIds = new Set();
        let allAirplanes = [];
        let availableCrew = [];
        let availablePassengers = [];

        function showMessage(text, type = 'error') {
            message.textContent = text;
            message.className = `flight-form-message ${type} visible`;
        }

        async function requestJson(url, options = {}) {
            const response = await fetch(url, {
                credentials: 'include',
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }

            return data;
        }

        function toDateTimeLocal(isoString) {
            const date = new Date(isoString);
            const offsetMs = date.getTimezoneOffset() * 60000;
            return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
        }

        function getMinDepartureTime() {
            return toDateTimeLocal(new Date().toISOString());
        }

        function formatDateTime(isoString) {
            if (!isoString) return '';
            return new Date(isoString).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        function renderAirportOptions(airports) {
            const options = ['<option value="">Select airport</option>']
                .concat(airports.map(airport => `<option value="${airport.id}">${airport.code} - ${airport.city}</option>`));
            departureAirportId.innerHTML = options.join('');
            arrivalAirportId.innerHTML = options.join('');
        }

        function renderAirplaneOptions(airplanes, selectedAirplaneId = airplaneId.value) {
            airplaneId.innerHTML = ['<option value="">Select aircraft</option>']
                .concat(airplanes.map(plane => `<option value="${plane.id}">${plane.model} (${plane.tail_number}) - ${plane.capacity}</option>`))
                .join('');

            if (selectedAirplaneId && airplanes.some(plane => String(plane.id) === String(selectedAirplaneId))) {
                airplaneId.value = String(selectedAirplaneId);
            }
        }

        function renderPeople(container, people, selectedIds, type) {
            if (!people.length) {
                container.innerHTML = '<div>No available options</div>';
                return;
            }

            container.innerHTML = people.map(person => {
                const subtitle = type === 'crew'
                    ? `${person.role} - ${person.current_airport?.city || '-'}`
                    : `${person.current_airport?.city || '-'}`;

                return `
                    <label class="flight-pick-item">
                        <input type="checkbox" value="${person.id}" ${selectedIds.has(person.id) ? 'checked' : ''}>
                        <span>
                            <strong>${person.first_name} ${person.last_name}</strong><br>
                            <small>${subtitle}</small>
                        </span>
                    </label>
                `;
            }).join('');
        }

        function keepOnlyAvailableSelections(selectedIds, people) {
            const availableIds = new Set(people.map(person => person.id));
            Array.from(selectedIds).forEach(id => {
                if (!availableIds.has(id)) {
                    selectedIds.delete(id);
                }
            });
        }

        function canLoadAvailability() {
            return departureAirportId.value && arrivalAirportId.value && departureTime.value;
        }

        function getDepartureIso() {
            return new Date(departureTime.value).toISOString();
        }

        function isPastDepartureTime() {
            return new Date(departureTime.value).getTime() < Date.now();
        }

        function validateFlightForm() {
            if (!flightNumber.value.trim()) throw new Error('Flight number is required');
            if (!airplaneId.value) throw new Error('Aircraft is required');
            if (!departureAirportId.value) throw new Error('Departure airport is required');
            if (!arrivalAirportId.value) throw new Error('Arrival airport is required');
            if (!departureTime.value) throw new Error('Departure time is required');
            if (departureAirportId.value === arrivalAirportId.value) {
                throw new Error('Departure and arrival airports must be different');
            }
            if (!flightId && isPastDepartureTime()) {
                throw new Error('Departure time cannot be in the past');
            }

            const airplane = allAirplanes.find(plane => String(plane.id) === airplaneId.value);
            if (airplane && airplane.status !== 'Active') {
                throw new Error('Selected aircraft is not active');
            }
            if (airplane?.current_airport?.id && String(airplane.current_airport.id) !== departureAirportId.value) {
                throw new Error('Selected aircraft is not at the departure airport');
            }
            if (airplane && selectedPassengerIds.size > airplane.capacity) {
                throw new Error('Passenger count exceeds aircraft capacity');
            }

            const availableCrewIds = new Set(availableCrew.map(member => member.id));
            const availablePassengerIds = new Set(availablePassengers.map(passenger => passenger.id));
            if (Array.from(selectedCrewIds).some(id => !availableCrewIds.has(id))) {
                throw new Error('Selected crew includes an unavailable crew member');
            }
            if (Array.from(selectedPassengerIds).some(id => !availablePassengerIds.has(id))) {
                throw new Error('Selected passengers include an unavailable passenger');
            }
        }

        function getReturnHash() {
            return flightId ? `#flights/edit/${flightId}` : '#flights/new';
        }

        function getDraft() {
            return {
                flightId,
                flight_number: flightNumber.value,
                airplane_id: airplaneId.value,
                departure_airport_id: departureAirportId.value,
                arrival_airport_id: arrivalAirportId.value,
                departure_time: departureTime.value,
                crew_ids: Array.from(selectedCrewIds),
                passenger_ids: Array.from(selectedPassengerIds)
            };
        }

        function saveDraft() {
            sessionStorage.setItem('flightFormDraft', JSON.stringify(getDraft()));
        }

        function restoreDraft() {
            const rawDraft = sessionStorage.getItem('flightFormDraft');
            if (!rawDraft) return;

            const draft = JSON.parse(rawDraft);
            const draftFlightId = draft.flightId ? String(draft.flightId) : null;
            const currentFlightId = flightId ? String(flightId) : null;
            if (draftFlightId !== currentFlightId) return;

            flightNumber.value = draft.flight_number || '';
            airplaneId.value = draft.airplane_id || '';
            departureAirportId.value = draft.departure_airport_id || '';
            arrivalAirportId.value = draft.arrival_airport_id || '';
            departureTime.value = draft.departure_time || '';
            selectedCrewIds.clear();
            selectedPassengerIds.clear();
            (draft.crew_ids || []).forEach(id => selectedCrewIds.add(Number(id)));
            (draft.passenger_ids || []).forEach(id => selectedPassengerIds.add(Number(id)));
            sessionStorage.removeItem('flightFormDraft');
        }

        function consumeCreatedEntity() {
            const rawCreatedEntity = sessionStorage.getItem('flightFormCreatedEntity');
            if (!rawCreatedEntity) return false;

            const { type, entity } = JSON.parse(rawCreatedEntity);
            sessionStorage.removeItem('flightFormCreatedEntity');

            if (type === 'airplane') {
                airplaneId.value = String(entity.id);
                return true;
            }

            if (type === 'departureAirport') {
                departureAirportId.value = String(entity.id);
                return true;
            }

            if (type === 'arrivalAirport') {
                arrivalAirportId.value = String(entity.id);
                return true;
            }

            if (type === 'crew') {
                selectedCrewIds.add(entity.id);
                return true;
            }

            if (type === 'passenger') {
                selectedPassengerIds.add(entity.id);
                return true;
            }

            return false;
        }

        function navigateToCreatePage(path, params = {}) {
            saveDraft();
            const query = new URLSearchParams({
                return: getReturnHash(),
                mode: 'flight-picker',
                ...params
            });
            window.location.hash = `${path}?${query.toString()}`;
        }

        async function refreshArrivalAndAvailability() {
            if (!canLoadAvailability()) return;

            const query = new URLSearchParams({
                departure_airport_id: departureAirportId.value,
                arrival_airport_id: arrivalAirportId.value,
                departure_time: getDepartureIso()
            });

            if (flightId) query.set('flight_id', flightId);

            try {
                const estimate = await requestJson(`/api/flights/estimate-arrival?${query.toString()}`);
                arrivalTime.value = formatDateTime(estimate.arrival_time);

                const [crew, passengers] = await Promise.all([
                    requestJson(`/api/crew/available?${query.toString()}`),
                    requestJson(`/api/passengers/available?${query.toString()}`)
                ]);

                availableCrew = crew;
                availablePassengers = passengers;
                keepOnlyAvailableSelections(selectedCrewIds, crew);
                keepOnlyAvailableSelections(selectedPassengerIds, passengers);
                renderPeople(crewList, crew, selectedCrewIds, 'crew');
                renderPeople(passengerList, passengers, selectedPassengerIds, 'passenger');
            } catch (err) {
                showMessage(err.message);
            }
        }

        async function refreshAirplanes() {
            if (!departureAirportId.value) {
                allAirplanes = [];
                renderAirplaneOptions([]);
                return;
            }

            try {
                const airplanes = await requestJson(`/api/airplanes/available?departure_airport_id=${departureAirportId.value}`);
                allAirplanes = airplanes;
                renderAirplaneOptions(airplanes);
            } catch (err) {
                showMessage(err.message);
            }
        }

        function handlePeopleChange(event, selectedIds) {
            const checkbox = event.target.closest('input[type="checkbox"]');
            if (!checkbox) return;

            const id = Number(checkbox.value);
            if (checkbox.checked) {
                selectedIds.add(id);
                return;
            }

            selectedIds.delete(id);
        }

        async function loadInitialData() {
            if (!flightId) {
                departureTime.min = getMinDepartureTime();
            }

            const [airports, airplanes] = await Promise.all([
                requestJson('/api/airports'),
                requestJson('/api/airplanes')
            ]);

            allAirplanes = airplanes;
            renderAirportOptions(airports);
            renderAirplaneOptions([]);

            if (flightId) {
                const flight = await requestJson(`/api/flights/${flightId}`);
                flightNumber.value = flight.flight_number;
                departureAirportId.value = flight.departure_airport.id;
                arrivalAirportId.value = flight.arrival_airport.id;
                departureTime.value = toDateTimeLocal(flight.departure_time);
                arrivalTime.value = formatDateTime(flight.arrival_time);
                flight.crew.forEach(member => selectedCrewIds.add(member.id));
                flight.passengers.forEach(passenger => selectedPassengerIds.add(passenger.id));
                await refreshAirplanes();
                if (!allAirplanes.some(plane => String(plane.id) === String(flight.airplane.id))) {
                    allAirplanes.push(flight.airplane);
                    renderAirplaneOptions(allAirplanes, flight.airplane.id);
                } else {
                    airplaneId.value = String(flight.airplane.id);
                }
            } else {
                restoreDraft();
                await refreshAirplanes();
            }

            const shouldRefreshAvailability = consumeCreatedEntity() || flightId || canLoadAvailability();
            if (shouldRefreshAvailability) await refreshArrivalAndAvailability();
        }

        async function handleSubmit(event) {
            event.preventDefault();

            try {
                validateFlightForm();
            } catch (err) {
                showMessage(err.message);
                return;
            }

            saveBtn.disabled = true;

            const payload = {
                flight_number: flightNumber.value.trim(),
                airplane_id: Number(airplaneId.value),
                departure_airport_id: Number(departureAirportId.value),
                arrival_airport_id: Number(arrivalAirportId.value),
                departure_time: getDepartureIso(),
                crew_ids: Array.from(selectedCrewIds),
                passenger_ids: Array.from(selectedPassengerIds)
            };

            try {
                const result = await requestJson(flightId ? `/api/flights/${flightId}` : '/api/flights', {
                    method: flightId ? 'PUT' : 'POST',
                    body: JSON.stringify(payload)
                });
                showMessage('Flight saved', 'success');
                window.location.hash = `flight/${result.id}`;
            } catch (err) {
                showMessage(err.message);
            } finally {
                saveBtn.disabled = false;
            }
        }

        async function handleDelete() {
            if (!flightId) return;

            const confirmed = window.confirm('Delete this flight? This action cannot be undone.');
            if (!confirmed) return;

            deleteBtn.disabled = true;
            saveBtn.disabled = true;

            try {
                await requestJson(`/api/flights/${flightId}`, { method: 'DELETE' });
                window.location.hash = '#flights';
            } catch (err) {
                showMessage(err.message);
            } finally {
                deleteBtn.disabled = false;
                saveBtn.disabled = false;
            }
        }

        const availabilityInputs = [departureAirportId, arrivalAirportId, departureTime];
        const airportCreateButtons = Array.from(document.querySelectorAll('[data-create-airport-for]'));
        const handleCrewChange = event => handlePeopleChange(event, selectedCrewIds);
        const handlePassengerChange = event => handlePeopleChange(event, selectedPassengerIds);
        const handleCreateAirplaneClick = () => navigateToCreatePage('#airplanes/new', {
            current_airport_id: departureAirportId.value || ''
        });
        const handleCreateCrewClick = () => navigateToCreatePage('#employees/new', {
            current_airport_id: departureAirportId.value || ''
        });
        const handleCreatePassengerClick = () => navigateToCreatePage('#passengers/new', {
            current_airport_id: departureAirportId.value || ''
        });
        const handleAirportCreateClick = event => {
            const target = event.currentTarget.dataset.createAirportFor;
            navigateToCreatePage('#airports/new', {
                target: target === 'arrival' ? 'arrivalAirport' : 'departureAirport'
            });
        };

        departureAirportId.addEventListener('change', refreshAirplanes);
        availabilityInputs.forEach(input => input.addEventListener('change', refreshArrivalAndAvailability));
        crewList.addEventListener('change', handleCrewChange);
        passengerList.addEventListener('change', handlePassengerChange);
        form.addEventListener('submit', handleSubmit);
        createAirplaneBtn.addEventListener('click', handleCreateAirplaneClick);
        createCrewBtn.addEventListener('click', handleCreateCrewClick);
        createPassengerBtn.addEventListener('click', handleCreatePassengerClick);
        airportCreateButtons.forEach(button => button.addEventListener('click', handleAirportCreateClick));
        if (deleteBtn) {
            deleteBtn.addEventListener('click', handleDelete);
        }
        loadInitialData().catch(err => showMessage(err.message));

        return () => {
            departureAirportId.removeEventListener('change', refreshAirplanes);
            availabilityInputs.forEach(input => input.removeEventListener('change', refreshArrivalAndAvailability));
            crewList.removeEventListener('change', handleCrewChange);
            passengerList.removeEventListener('change', handlePassengerChange);
            form.removeEventListener('submit', handleSubmit);
            createAirplaneBtn.removeEventListener('click', handleCreateAirplaneClick);
            createCrewBtn.removeEventListener('click', handleCreateCrewClick);
            createPassengerBtn.removeEventListener('click', handleCreatePassengerClick);
            airportCreateButtons.forEach(button => button.removeEventListener('click', handleAirportCreateClick));
            if (deleteBtn) {
                deleteBtn.removeEventListener('click', handleDelete);
            }
        };
    }
};
