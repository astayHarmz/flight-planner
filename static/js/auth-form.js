const AuthForm = {
    styles() {
        return `
        `;
    },

    field(label, name, type, autocomplete) {
        const minLength = type === 'password' ? ' minlength="6"' : '';

        return `
            <label class="auth-field">
                <span>${label}</span>
                <input name="${name}" type="${type}" autocomplete="${autocomplete}"${minLength} required>
            </label>
        `;
    },

    message(messageElement, text, type = 'error') {
        messageElement.textContent = text;
        messageElement.className = `auth-message ${type} visible`;
    },

    async submit(url, payload) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Request failed');
        }

        return data;
    }
};
