const RegisterPage = {
    render() {
        return `
            ${AuthForm.styles()}
            <section class="auth-page">
                <div class="auth-panel">
                    <h2>Registration</h2>
                    <p>Submit a request. An administrator will approve your account.</p>

                    <form class="auth-form" id="registerForm">
                        ${AuthForm.field('Username', 'username', 'text', 'username')}
                        ${AuthForm.field('Email', 'email', 'email', 'email')}
                        ${AuthForm.field('Password', 'password', 'password', 'new-password')}
                        ${AuthForm.field('Confirm password', 'password_confirm', 'password', 'new-password')}
                        <div class="auth-message" id="authMessage"></div>
                        <button class="auth-submit" type="submit">Submit request</button>
                    </form>

                    <div class="auth-switch">
                        Already have an account? <a href="#auth">Log in</a>
                    </div>
                </div>
            </section>
        `;
    },

    init() {
        const form = document.getElementById('registerForm');
        const message = document.getElementById('authMessage');

        function validate(payload) {
            if (!payload.username.trim()) throw new Error('Username is required');
            if (payload.username.trim().length < 3 || payload.username.trim().length > 50) {
                throw new Error('Username must be between 3 and 50 characters');
            }
            if (!payload.email.trim()) throw new Error('Email is required');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
                throw new Error('Enter a valid email address');
            }
            if (!payload.password) throw new Error('Password is required');
            if (payload.password.length < 6) throw new Error('Password must be at least 6 characters');
            if (payload.password !== payload.password_confirm) throw new Error('Passwords do not match');
        }

        async function handleSubmit(event) {
            event.preventDefault();

            const submitButton = form.querySelector('button[type="submit"]');
            const payload = Object.fromEntries(new FormData(form).entries());

            try {
                validate(payload);
            } catch (err) {
                AuthForm.message(message, err.message);
                return;
            }

            payload.username = payload.username.trim();
            payload.email = payload.email.trim();
            delete payload.password_confirm;
            submitButton.disabled = true;

            try {
                await AuthForm.submit('/api/auth/register', payload);
                form.reset();
                AuthForm.message(message, 'Request submitted. Wait for administrator approval.', 'success');
            } catch (err) {
                AuthForm.message(message, err.message);
            } finally {
                submitButton.disabled = false;
            }
        }

        form.addEventListener('submit', handleSubmit);

        return () => {
            form.removeEventListener('submit', handleSubmit);
        };
    }
};
