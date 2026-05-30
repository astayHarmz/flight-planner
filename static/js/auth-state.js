const AuthState = {
    currentUser: null,

    isAdmin() {
        return this.currentUser?.role?.toLowerCase() === 'admin';
    },

    isVerified() {
        return Boolean(this.currentUser?.is_verified);
    },

    async init() {
        this.bindSwitchAccount();
        this.renderNavbar();
        await this.refresh();
    },

    async refresh() {
        try {
            const response = await fetch('/api/auth/me', { credentials: 'include' });
            const data = await response.json().catch(() => ({}));
            this.currentUser = data.user || null;
        } catch (err) {
            this.currentUser = null;
        }

        this.renderNavbar();
    },

    setUser(user) {
        this.currentUser = user || null;
        this.renderNavbar();
    },

    renderNavbar() {
        const authLink = document.getElementById('link-auth');
        const adminLink = document.getElementById('link-admin-users');
        let userLabel = document.getElementById('nav-user-label');
        let divider = document.getElementById('nav-divider');

        if (!authLink || !adminLink) return;

        
        if (!userLabel) {
            userLabel = document.createElement('span');
            userLabel.id = 'nav-user-label';
            userLabel.className = 'nav-user-label';
            authLink.parentNode.insertBefore(userLabel, authLink);
        }

        
        if (!divider) {
            divider = document.createElement('div');
            divider.id = 'nav-divider';
            divider.className = 'nav-divider';
            authLink.parentNode.insertBefore(divider, userLabel);
        }

        
        if (this.currentUser) {
            userLabel.textContent = this.currentUser.username;
            userLabel.style.display = '';
            authLink.textContent = 'Log out';
        } else {
            userLabel.textContent = '';
            userLabel.style.display = 'none';
            authLink.textContent = 'Log in';
        }

        
        if (this.isAdmin()) {
            adminLink.style.display = '';
            divider.style.display = '';
        } else {
            adminLink.style.display = 'none';
            divider.style.display = 'none';
        }
    },

    bindSwitchAccount() {
        const authLink = document.getElementById('link-auth');
        if (!authLink) return;

        authLink.addEventListener('click', async event => {
            if (!this.currentUser) return;

            event.preventDefault();

            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            }).catch(() => {});

            this.setUser(null);
            window.location.hash = '#auth';
        });
    }
};
