const EmployeeFormPage = {
    render() {
        const returnHash = EntityFormUtils.getReturnHash();

        return `
            ${EntityFormUtils.styles}
            <section class="entity-form-page">
                <div class="entity-form-header">
                    <h2>Create Crew Member</h2>
                    <a href="${returnHash}" class="btn-secondary">Back</a>
                </div>

                <form class="entity-form" id="employeeForm">
                    <div class="entity-form-grid">
                        <label class="entity-field">
                            <span>First name</span>
                            <input id="employeeFirstName" name="first_name" type="text" maxlength="50" required>
                        </label>

                        <label class="entity-field">
                            <span>Last name</span>
                            <input id="employeeLastName" name="last_name" type="text" maxlength="50" required>
                        </label>

                        <label class="entity-field">
                            <span>Role</span>
                            <select id="employeeRole" name="role" required>
                                <option value="">Select role</option>
                                <option value="Pilot">Pilot</option>
                                <option value="Co-Pilot">Co-Pilot</option>
                                <option value="Flight Attendant">Flight Attendant</option>
                                <option value="Engineer">Engineer</option>
                            </select>
                        </label>

                        <label class="entity-field">
                            <span>Contract number</span>
                            <input id="employeeNumber" name="employee_number" type="text" maxlength="20" required>
                        </label>

                        <label class="entity-field">
                            <span>Current airport</span>
                            <select id="employeeAirportId" name="current_airport_id" required></select>
                        </label>

                        <label class="entity-field">
                            <span>Avatar</span>
                            <input id="employeeImage" name="image" type="file" accept="image/png,image/jpeg,image/gif,image/webp">
                        </label>
                    </div>

                    <div class="entity-form-message" id="employeeFormMessage"></div>
                    <div class="entity-form-actions">
                        <a href="${returnHash}" class="btn-secondary">Cancel</a>
                        <button class="entity-save-btn" id="saveEmployeeBtn" type="submit">Create</button>
                    </div>
                </form>
            </section>
        `;
    },

    init() {
        const form = document.getElementById('employeeForm');
        const airportSelect = document.getElementById('employeeAirportId');
        const message = document.getElementById('employeeFormMessage');
        const saveBtn = document.getElementById('saveEmployeeBtn');
        const firstName = document.getElementById('employeeFirstName');
        const lastName = document.getElementById('employeeLastName');
        const role = document.getElementById('employeeRole');
        const employeeNumber = document.getElementById('employeeNumber');
        const image = document.getElementById('employeeImage');

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
                    { label: 'Role', value: role.value },
                    { label: 'Contract number', value: employeeNumber.value },
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
            payload.set('role', role.value);
            payload.set('employee_number', employeeNumber.value.trim());
            payload.set('current_airport_id', airportSelect.value);

            try {
                const employee = await EntityFormUtils.requestJson('/api/employees', {
                    method: 'POST',
                    body: payload
                });
                EntityFormUtils.complete('crew', employee);
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
