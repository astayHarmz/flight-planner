const LoginPage = {
    render() {
        return `
            ${AuthForm.styles()}
            <section class="auth-page">
                <div class="auth-panel">
                    <h2>Login</h2>
                    <p>Sign in with an approved account.</p>

                    <form class="auth-form" id="loginForm">
                        ${AuthForm.field('Email', 'email', 'email', 'email')}
                        ${AuthForm.field('Password', 'password', 'password', 'current-password')}
                        <div class="auth-message" id="authMessage"></div>
                        <button class="auth-submit" type="submit">Log in</button>
                    </form>

                    <div class="auth-switch">
                        No account yet? <a href="#register">Register</a>
                    </div>
                </div>
            </section>
        `;
    },

    init() {
        const form = document.getElementById('loginForm');
        const message = document.getElementById('authMessage');

        function validate(payload) {
            if (!payload.email.trim()) throw new Error('Email is required');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
                throw new Error('Enter a valid email address');
            }
            if (!payload.password) throw new Error('Password is required');
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

            payload.email = payload.email.trim();
            submitButton.disabled = true;

            try {
                const data = await AuthForm.submit('/api/auth/login', payload);
                AuthState.setUser(data.user);
                window.location.hash = '#flights';
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
