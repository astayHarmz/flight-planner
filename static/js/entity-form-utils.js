const EntityFormUtils = {
    styles: `
    `,

    getHashParams() {
        const queryStart = window.location.hash.indexOf('?');
        return new URLSearchParams(queryStart === -1 ? '' : window.location.hash.slice(queryStart + 1));
    },

    getReturnHash() {
        return this.getHashParams().get('return') || '#flights/new';
    },

    getMode() {
        return this.getHashParams().get('mode') || '';
    },

    showMessage(messageElement, text) {
        messageElement.textContent = text;
        messageElement.className = 'entity-form-message error visible';
    },

    validateRequired(fields) {
        for (const field of fields) {
            const value = typeof field.value === 'string' ? field.value.trim() : field.value;
            if (value === '' || value === null || value === undefined || Number.isNaN(value)) {
                throw new Error(`${field.label} is required`);
            }
        }
    },

    validateImageFile(input) {
        const file = input?.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';

        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
            throw new Error('Only PNG, JPG, JPEG, GIF and WEBP images are allowed');
        }

        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Image must be 5 MB or smaller');
        }
    },

    async requestJson(url, options = {}) {
        const isFormData = options.body instanceof FormData;
        const response = await fetch(url, {
            credentials: 'include',
            ...options,
            headers: isFormData ? options.headers : {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Request failed');
        }

        return data;
    },

    complete(entityType, entity) {
        const mode = this.getMode();

        if (mode === 'flight-picker') {
            sessionStorage.setItem('flightFormCreatedEntity', JSON.stringify({ type: entityType, entity }));
        }

        window.location.hash = this.getReturnHash();
    }
};
