const appContent = document.getElementById('app-content');
let currentDestroyFn = null;

function setActiveNav(hash) {
    let activeHash = hash;
    if (hash === '#register') activeHash = '#auth';
    if (hash.startsWith('#flights/') || hash.startsWith('#crashed-flight/')) activeHash = '#flights';

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === activeHash);
    });
}

function mountPage(page, initArg = null) {
    appContent.innerHTML = page.render(initArg);

    setTimeout(() => {
        const destroy = page.init(initArg);
        if (typeof destroy === 'function') {
            currentDestroyFn = destroy;
        }
    }, 0);
}

function router() {
    const hash = window.location.hash || '#map';
    const routeHash = hash.split('?')[0];

    setActiveNav(routeHash);

    if (currentDestroyFn) {
        currentDestroyFn();
        currentDestroyFn = null;
    }

    if (routeHash.startsWith('#flight/')) {
        mountPage(FlightDetailsPage, routeHash.split('/')[1]);
        return;
    }

    if (routeHash.startsWith('#crashed-flight/')) {
        if (!AuthState.isVerified()) {
            appContent.innerHTML = '<div class="placeholder-page"><h2>Access denied</h2></div>';
            return;
        }

        mountPage(CrashedFlightDetailsPage, routeHash.split('/')[1]);
        return;
    }

    if (routeHash.startsWith('#airport/')) {
        mountPage(AirportDetailsPage, routeHash.split('/')[1]);
        return;
    }

    if (routeHash.startsWith('#flights/edit/')) {
        if (!AuthState.isVerified()) {
            appContent.innerHTML = '<div class="placeholder-page"><h2>Access denied</h2></div>';
            return;
        }

        mountPage(FlightFormPage, routeHash.split('/')[2]);
        return;
    }

    switch (routeHash) {
        case '#map':
            mountPage(MapPage);
            break;

        case '#flights':
            mountPage(FlightsPage);
            break;

        case '#flights/new':
            if (!AuthState.isVerified()) {
                appContent.innerHTML = '<div class="placeholder-page"><h2>Access denied</h2></div>';
                break;
            }
            mountPage(FlightFormPage);
            break;

        case '#airports':
            mountPage(AirportsPage);
            break;

        case '#airplanes/new':
            if (!AuthState.isVerified()) {
                appContent.innerHTML = '<div class="placeholder-page"><h2>Access denied</h2></div>';
                break;
            }
            mountPage(AirplaneFormPage);
            break;

        case '#airports/new':
            if (!AuthState.isVerified()) {
                appContent.innerHTML = '<div class="placeholder-page"><h2>Access denied</h2></div>';
                break;
            }
            mountPage(AirportFormPage);
            break;

        case '#employees/new':
            if (!AuthState.isVerified()) {
                appContent.innerHTML = '<div class="placeholder-page"><h2>Access denied</h2></div>';
                break;
            }
            mountPage(EmployeeFormPage);
            break;

        case '#passengers/new':
            if (!AuthState.isVerified()) {
                appContent.innerHTML = '<div class="placeholder-page"><h2>Access denied</h2></div>';
                break;
            }
            mountPage(PassengerFormPage);
            break;

        case '#auth':
            mountPage(LoginPage);
            break;

        case '#register':
            mountPage(RegisterPage);
            break;

        case '#admin/users':
            if (!AuthState.isAdmin()) {
                appContent.innerHTML = '<div class="placeholder-page"><h2>Access denied</h2></div>';
                break;
            }
            mountPage(AdminUsersPage);
            break;

        default:
            appContent.innerHTML = '<div class="placeholder-page"><h2>Страница не найдена (404)</h2></div>';
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', async () => {
    await AuthState.init();
    router();
});
