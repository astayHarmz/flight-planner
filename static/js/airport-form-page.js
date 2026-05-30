const AirportFormPage = {
    render() {
        const returnHash = EntityFormUtils.getReturnHash();

        return `
            ${EntityFormUtils.styles}
            <section class="entity-form-page">
                <div class="entity-form-header">
                    <h2>Create Airport</h2>
                    <a href="${returnHash}" class="btn-secondary">Back</a>
                </div>

                <form class="entity-form" id="airportForm">
                    <div class="entity-form-grid">
                        <label class="entity-field">
                            <span>IATA code</span>
                            <input id="airportCode" name="code" type="text" maxlength="3" required>
                        </label>

                        <label class="entity-field">
                            <span>City</span>
                            <input id="airportCity" name="city" type="text" maxlength="100" required>
                        </label>

                        <label class="entity-field full">
                            <span>Airport name</span>
                            <input id="airportName" name="name" type="text" maxlength="100" required>
                        </label>

                        <label class="entity-field">
                            <span>Latitude</span>
                            <input id="latitude" name="latitude" type="number" min="-90" max="90" step="0.000001" required>
                        </label>

                        <label class="entity-field">
                            <span>Longitude</span>
                            <input id="longitude" name="longitude" type="number" min="-180" max="180" step="0.000001" required>
                        </label>
                    </div>

                    <div class="entity-form-message" id="airportFormMessage"></div>
                    <div class="entity-form-actions">
                        <a href="${returnHash}" class="btn-secondary">Cancel</a>
                        <button class="entity-save-btn" id="saveAirportBtn" type="submit">Create</button>
                    </div>
                </form>
            </section>
        `;
    },

    init() {
        const form = document.getElementById('airportForm');
        const message = document.getElementById('airportFormMessage');
        const saveBtn = document.getElementById('saveAirportBtn');
        const code = document.getElementById('airportCode');
        const city = document.getElementById('airportCity');
        const name = document.getElementById('airportName');
        const latitude = document.getElementById('latitude');
        const longitude = document.getElementById('longitude');

        async function handleSubmit(event) {
            event.preventDefault();

            try {
                EntityFormUtils.validateRequired([
                    { label: 'IATA code', value: code.value },
                    { label: 'City', value: city.value },
                    { label: 'Airport name', value: name.value },
                    { label: 'Latitude', value: latitude.value },
                    { label: 'Longitude', value: longitude.value }
                ]);

                if (!/^[A-Za-z]{3}$/.test(code.value.trim())) {
                    throw new Error('IATA code must contain exactly 3 letters');
                }

                const lat = Number(latitude.value);
                const lon = Number(longitude.value);
                if (lat < -90 || lat > 90) throw new Error('Latitude must be between -90 and 90');
                if (lon < -180 || lon > 180) throw new Error('Longitude must be between -180 and 180');
            } catch (err) {
                EntityFormUtils.showMessage(message, err.message);
                return;
            }

            saveBtn.disabled = true;

            const payload = {
                code: code.value.trim(),
                city: city.value.trim(),
                name: name.value.trim(),
                latitude: Number(latitude.value),
                longitude: Number(longitude.value)
            };

            try {
                const airport = await EntityFormUtils.requestJson('/api/airports', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                EntityFormUtils.complete(EntityFormUtils.getHashParams().get('target') || 'departureAirport', airport);
            } catch (err) {
                EntityFormUtils.showMessage(message, err.message);
            } finally {
                saveBtn.disabled = false;
            }
        }

        form.addEventListener('submit', handleSubmit);

        return () => form.removeEventListener('submit', handleSubmit);
    }
};
