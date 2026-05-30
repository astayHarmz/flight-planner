const AirplaneFormPage = {
    render() {
        const returnHash = EntityFormUtils.getReturnHash();

        return `
            ${EntityFormUtils.styles}
            <section class="entity-form-page">
                <div class="entity-form-header">
                    <h2>Create Aircraft</h2>
                    <a href="${returnHash}" class="btn-secondary">Back</a>
                </div>

                <form class="entity-form" id="airplaneForm">
                    <div class="entity-form-grid">
                        <label class="entity-field">
                            <span>Tail number</span>
                            <input id="tailNumber" name="tail_number" type="text" maxlength="20" required>
                        </label>

                        <label class="entity-field">
                            <span>Model</span>
                            <input id="model" name="model" type="text" maxlength="50" required>
                        </label>

                        <label class="entity-field">
                            <span>Passenger capacity</span>
                            <input id="capacity" name="capacity" type="number" min="1" step="1" required>
                        </label>

                        <label class="entity-field">
                            <span>Current airport</span>
                            <select id="currentAirportId" name="current_airport_id" required></select>
                        </label>

                        <label class="entity-field">
                            <span>Aircraft picture</span>
                            <input id="airplaneImage" name="image" type="file" accept="image/png,image/jpeg,image/gif,image/webp">
                        </label>
                    </div>

                    <div class="entity-form-message" id="airplaneFormMessage"></div>
                    <div class="entity-form-actions">
                        <a href="${returnHash}" class="btn-secondary">Cancel</a>
                        <button class="entity-save-btn" id="saveAirplaneBtn" type="submit">Create</button>
                    </div>
                </form>
            </section>
        `;
    },

    init() {
        const form = document.getElementById('airplaneForm');
        const message = document.getElementById('airplaneFormMessage');
        const saveBtn = document.getElementById('saveAirplaneBtn');
        const tailNumber = document.getElementById('tailNumber');
        const model = document.getElementById('model');
        const capacity = document.getElementById('capacity');
        const currentAirportId = document.getElementById('currentAirportId');
        const image = document.getElementById('airplaneImage');

        async function loadAirports() {
            const airports = await EntityFormUtils.requestJson('/api/airports');
            currentAirportId.innerHTML = ['<option value="">Select airport</option>']
                .concat(airports.map(airport => `<option value="${airport.id}">${airport.code} - ${airport.city}</option>`))
                .join('');

            const requestedAirportId = EntityFormUtils.getHashParams().get('current_airport_id');
            if (requestedAirportId) currentAirportId.value = requestedAirportId;
        }

        async function handleSubmit(event) {
            event.preventDefault();

            try {
                EntityFormUtils.validateRequired([
                    { label: 'Tail number', value: tailNumber.value },
                    { label: 'Model', value: model.value },
                    { label: 'Passenger capacity', value: capacity.value },
                    { label: 'Current airport', value: currentAirportId.value }
                ]);

                if (Number(capacity.value) <= 0) {
                    throw new Error('Passenger capacity must be greater than zero');
                }

                EntityFormUtils.validateImageFile(image);
            } catch (err) {
                EntityFormUtils.showMessage(message, err.message);
                return;
            }

            saveBtn.disabled = true;

            const payload = new FormData(form);
            payload.set('tail_number', tailNumber.value.trim());
            payload.set('model', model.value.trim());
            payload.set('capacity', capacity.value);
            payload.set('current_airport_id', currentAirportId.value);

            try {
                const airplane = await EntityFormUtils.requestJson('/api/airplanes', {
                    method: 'POST',
                    body: payload
                });
                EntityFormUtils.complete('airplane', airplane);
            } catch (err) {
                EntityFormUtils.showMessage(message, err.message);
            } finally {
                saveBtn.disabled = false;
            }
        }

        form.addEventListener('submit', handleSubmit);
        loadAirports().catch(err => EntityFormUtils.showMessage(message, err.message));

        return () => form.removeEventListener('submit', handleSubmit);
    }
};
