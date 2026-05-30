const AdminUsersPage = {
    render() {
        return `

            <section class="admin-users-page">
                <div class="admin-users-header">
                    <div>
                        <h2>Registered Accounts</h2>
                        <p>Approve pending registrations and manage verified accounts.</p>
                    </div>
                    <button class="admin-users-refresh" id="refreshUsersBtn" type="button">Refresh</button>
                </div>

                <div class="admin-users-message" id="adminUsersMessage"></div>

                <div class="admin-users-section">
                    <div class="admin-section-header">
                        <h3>Unverified Accounts</h3>
                    </div>
                    <div class="table-wrapper">
                        <table class="flights-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Created at</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="pendingUsersBody">
                                <tr>
                                    <td colspan="6">Loading accounts...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="admin-users-section">
                    <div class="admin-section-header">
                        <h3>Verified Accounts</h3>
                    </div>
                    <div class="table-wrapper">
                        <table class="flights-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Created at</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="verifiedUsersBody">
                                <tr>
                                    <td colspan="6">Loading accounts...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    },

    init() {
        const pendingBody = document.getElementById('pendingUsersBody');
        const verifiedBody = document.getElementById('verifiedUsersBody');
        const refreshBtn = document.getElementById('refreshUsersBtn');
        const message = document.getElementById('adminUsersMessage');

        function showMessage(text, type = 'error') {
            message.textContent = text;
            message.className = `admin-users-message ${type} visible`;
        }

        function clearMessage() {
            message.textContent = '';
            message.className = 'admin-users-message';
        }

        function formatDateTime(isoString) {
            if (!isoString) return '-';

            return new Date(isoString).toLocaleString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
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

        function renderEmptyRow(text) {
            return `
                <tr>
                    <td colspan="6">
                        ${text}
                    </td>
                </tr>
            `;
        }

        function renderActions(user) {
            const currentUserId = AuthState.currentUser?.id;
            const isCurrentUser = user.id === currentUserId;

            if (!user.is_verified) {
                return `
                    <div class="admin-users-actions">
                        <button class="admin-action-btn approve" type="button" data-action="approve" data-id="${user.id}">Approve</button>
                        <button class="admin-action-btn reject" type="button" data-action="reject" data-id="${user.id}">Reject</button>
                    </div>
                `;
            }

            if (isCurrentUser) {
                return '<span>Current account</span>';
            }

            const promoteButton = user.role?.toLowerCase() === 'admin'
                ? ''
                : `<button class="admin-action-btn promote" type="button" data-action="promote" data-id="${user.id}">Promote to admin</button>`;

            return `
                <div class="admin-users-actions">
                    ${promoteButton}
                    <button class="admin-action-btn delete" type="button" data-action="delete" data-id="${user.id}">Delete</button>
                </div>
            `;
        }

        function renderRows(users, emptyText) {
            if (!users || users.length === 0) {
                return renderEmptyRow(emptyText);
            }

            return users.map(user => {
                const statusClass = user.is_verified ? 'verified' : 'pending';
                const statusText = user.is_verified ? 'Verified' : 'Pending';

                return `
                    <tr>
                        <td><strong>${user.username}</strong></td>
                        <td>${user.email}</td>
                        <td>${user.role || 'User'}</td>
                        <td><span class="admin-status ${statusClass}">${statusText}</span></td>
                        <td>${formatDateTime(user.created_at)}</td>
                        <td>${renderActions(user)}</td>
                    </tr>
                `;
            }).join('');
        }

        async function loadUsers() {
            clearMessage();
            pendingBody.innerHTML = renderEmptyRow('Loading accounts...');
            verifiedBody.innerHTML = renderEmptyRow('Loading accounts...');

            try {
                const users = await requestJson('/api/admin/users');
                const pendingUsers = users.filter(user => !user.is_verified);
                const verifiedUsers = users.filter(user => user.is_verified);

                pendingBody.innerHTML = renderRows(pendingUsers, 'No pending registrations');
                verifiedBody.innerHTML = renderRows(verifiedUsers, 'No verified accounts');
            } catch (err) {
                showMessage(err.message);
                pendingBody.innerHTML = renderEmptyRow('Failed to load accounts');
                verifiedBody.innerHTML = renderEmptyRow('Failed to load accounts');
            }
        }

        async function handleActionClick(event) {
            const button = event.target.closest('[data-action][data-id]');
            if (!button) return;

            const { action, id } = button.dataset;
            const endpointByAction = {
                approve: `/api/admin/users/${id}/approve`,
                reject: `/api/admin/users/${id}/reject`,
                promote: `/api/admin/users/${id}/promote`,
                delete: `/api/admin/users/${id}`
            };
            const method = action === 'delete' ? 'DELETE' : 'POST';

            if (action === 'delete' && !window.confirm('Delete this account? This action cannot be undone.')) {
                return;
            }

            button.disabled = true;

            try {
                await requestJson(endpointByAction[action], { method });
                const messages = {
                    approve: 'Account approved',
                    reject: 'Registration request rejected',
                    promote: 'Account promoted to admin',
                    delete: 'Account deleted'
                };
                showMessage(messages[action], 'success');
                await loadUsers();
            } catch (err) {
                showMessage(err.message);
            } finally {
                button.disabled = false;
            }
        }

        refreshBtn.addEventListener('click', loadUsers);
        pendingBody.addEventListener('click', handleActionClick);
        verifiedBody.addEventListener('click', handleActionClick);
        loadUsers();

        return () => {
            refreshBtn.removeEventListener('click', loadUsers);
            pendingBody.removeEventListener('click', handleActionClick);
            verifiedBody.removeEventListener('click', handleActionClick);
        };
    }
};
