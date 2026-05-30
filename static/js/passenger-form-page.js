const PassengerFormPage = {
    render() {
        const returnHash = EntityFormUtils.getReturnHash();

        return `
            ${EntityFormUtils.styles}
            <section class="entity-form-page">
                <div class="entity-form-header">
                    <h2>Create Passenger</h2>
                    <a href="${returnHash}" class="btn-secondary">Back</a>
                </div>

                <form class="entity-form" id="passengerForm">
                    <div class="entity-form-grid">
                        <label class="entity-field">
                            <span>First name</span>
                            <input id="passengerFirstName" name="first_name" type="text" maxlength="50" required>
                        </label>

                        <label class="entity-field">
                            <span>Last name</span>
                            <input id="passengerLastName" name="last_name" type="text" maxlength="50" required>
                        </label>

                        <label class="entity-field">
                            <span>Passport number</span>
                            <input id="passportNumber" name="passport_number" type="text" maxlength="20" required>
                        </label>

                        <label class="entity-field">
                            <span>Current airport</span>
                            <select id="passengerAirportId" name="current_airport_id" required></select>
                        </label>

                        <label class="entity-field full">
                            <span>Avatar</span>
                            <input id="passengerImage" name="image" type="file" accept="image/png,image/jpeg,image/gif,image/webp">
                        </label>
                    </div>

                    <div class="entity-form-message" id="passengerFormMessage"></div>
                    <div class="entity-form-actions">
                        <a href="${returnHash}" class="btn-secondary">Cancel</a>
                        <button class="entity-save-btn" id="savePassengerBtn" type="submit">Create</button>
                    </div>
                </form>
            </section>
        `;
    },

    init() {
        const form = document.getElementById('passengerForm');
        const airportSelect = document.getElementById('passengerAirportId');
        const message = document.getElementById('passengerFormMessage');
        const saveBtn = document.getElementById('savePassengerBtn');
        const firstName = document.getElementById('passengerFirstName');
        const lastName = document.getElementById('passengerLastName');
        const passportNumber = document.getElementById('passportNumber');
        const image = document.getElementById('passengerImage');

        async function loadAirports() {
            const airports = await EntityFormUtils.requestJson('/api/airports');
            airportSelect.innerHTML = ['<option value="">Select airport</option>']
                .concat(airports.map(airport => `<option value="${airport.id}">${airport.code} - ${airport.city}</option>`))
                .join('');

            const currentAirportId = EntityFormUtils.getHashParams().get('current_airport_id');
            if (currentAirportId) airportSelect.value = currentAirportId;
        }

        async function handleSubmit(event) {
            event.preventDefault();

            try {
                EntityFormUtils.validateRequired([
                    { label: 'First name', value: firstName.value },
                    { label: 'Last name', value: lastName.value },
                    { label: 'Passport number', value: passportNumber.value },
                    { label: 'Current airport', value: airportSelect.value }
                ]);
                EntityFormUtils.validateImageFile(image);
            } catch (err) {
                EntityFormUtils.showMessage(message, err.message);
                return;
            }

            saveBtn.disabled = true;

            const payload = new FormData(form);
            payload.set('first_name', firstName.value.trim());
            payload.set('last_name', lastName.value.trim());
            payload.set('passport_number', passportNumber.value.trim());
            payload.set('current_airport_id', airportSelect.value);

            try {
                const passenger = await EntityFormUtils.requestJson('/api/passengers', {
                    method: 'POST',
                    body: payload
                });
                EntityFormUtils.complete('passenger', passenger);
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
