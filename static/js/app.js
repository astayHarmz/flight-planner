const appContent = document.getElementById('app-content');
let currentDestroyFn = null; 

function router() {
    const hash = window.location.hash || '#map';
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === hash);
    });

    if (currentDestroyFn) {
        currentDestroyFn();
        currentDestroyFn = null;
    }

    if (hash.startsWith('#flight/')) {
        const flightId = hash.split('/')[1]; 

        appContent.innerHTML = FlightDetailsPage.render();
        setTimeout(() => {
            const destroy = FlightDetailsPage.init(flightId);
            if (typeof destroy === 'function') {
                currentDestroyFn = destroy;
            }
        }, 0);
        return;
    }

    if (hash.startsWith('#airport/')) {
        const airportCode = hash.split('/')[1]; 

        appContent.innerHTML = AirportDetailsPage.render();
        setTimeout(() => {
            const destroy = AirportDetailsPage.init(airportCode);
            if (typeof destroy === 'function') {
                currentDestroyFn = destroy;
            }
        }, 0);
        return;
    }

    switch (hash) {
        case '#map':
            appContent.innerHTML = MapPage.render();
            setTimeout(() => {
                currentDestroyFn = MapPage.init();
            }, 0);
            break;
            
        case '#flights':
            appContent.innerHTML = FlightsPage.render();
            setTimeout(() => {
                const destroy = FlightsPage.init();
                if (typeof destroy === 'function') {
                    currentDestroyFn = destroy;
                }
            }, 0);
            break;
            
        case '#airports':
            appContent.innerHTML = AirportsPage.render();
            setTimeout(() => {
                const destroy = AirportsPage.init();
                if (typeof destroy === 'function') {
                    currentDestroyFn = destroy;
                }
            }, 0);
            break;
            
        case '#auth':
            appContent.innerHTML = `
                <div class="placeholder-page">
                    <h2>Авторизация</h2>
                    <p>Форма регистрации и входа появится здесь на следующих этапах.</p>
                </div>`;
            break;
            
        default:
            appContent.innerHTML = '<div class="placeholder-page"><h2>Страница не найдена (404)</h2></div>';
    }
}

window.addEventListener('hashchange', router);

window.addEventListener('DOMContentLoaded', router);