const FlightDetailsPage = {
    render() {
    return `
        <div class="flight-details-container">
            <div class="back-panel">
                <button id="backToPreviousPageBtn" class="btn-secondary">← Назад</button>
            </div>
            
            <div id="flightDetailsContent">
                <div style="text-align: center; color: #718096; padding: 40px;">Загрузка информации о рейсе...</div>
            </div>
        </div>
    `;
},

    init(flightId) {
        const contentBlock = document.getElementById('flightDetailsContent');

        function formatDateTime(isoString) {
            const dateObj = new Date(isoString);
            return dateObj.toLocaleString('ru-RU', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }

        function getDuration(departure, arrival) {
            const diffMs = new Date(arrival) - new Date(departure);
            const totalMinutes = Math.floor(diffMs / (1000 * 60));
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${hours} ч. ${minutes} мин.`;
        }

        function loadFlightDetails() {
            fetch(`/api/flights/${flightId}`)
                .then(res => {
                    if (!res.ok) throw new Error('Рейс не найден');
                    return res.json();
                })
                .then(f => {
                    let statusClass = 'status-scheduled';
                    if (f.status === 'In Flight') statusClass = 'status-inflight';
                    if (f.status === 'Arrived') statusClass = 'status-arrived';

                    let html = `
                        <div class="flight-main-card">
                            <div class="flight-header">
                                <h1>Рейс ${f.flight_number}</h1>
                                <span class="status-badge ${statusClass}">${f.status}</span>
                            </div>
                            
                            <div class="flight-route-grid">
                                <div class="route-point">
                                    <div class="airport-big-code">${f.departure_airport.code}</div>
                                    <div class="airport-city">${f.departure_airport.city}</div>
                                    <div class="airport-name">${f.departure_airport.name}</div>
                                    <div class="flight-time">${formatDateTime(f.departure_time)}</div>
                                </div>
                                
                                <div class="route-duration">
                                    <div class="duration-line">✈</div>
                                    <div class="duration-value">В пути: ${getDuration(f.departure_time, f.arrival_time)}</div>
                                </div>
                                
                                <div class="route-point text-right">
                                    <div class="airport-big-code">${f.arrival_airport.code}</div>
                                    <div class="airport-city">${f.arrival_airport.city}</div>
                                    <div class="airport-name">${f.arrival_airport.name}</div>
                                    <div class="flight-time">${formatDateTime(f.arrival_time)}</div>
                                </div>
                            </div>

                            <div class="airplane-info-block">
                                <h3>Транспортное средство</h3>
                                <p><strong>Модель:</strong> ${f.airplane.model} (${f.airplane.tail_number})</p>
                                <p><strong>Вместимость:</strong> ${f.airplane.capacity} пассажиров</p>
                            </div>
                        </div>

                        <div class="lists-section-grid">
                            <div class="details-block">
                                <h3>Экипаж рейса</h3>
                                <div class="list-wrapper">
                                    ${f.crew && f.crew.length > 0 ? `
                                        <table class="details-list-table">
                                            <thead>
                                                <tr><th>Сотрудник</th><th>Должность</th><th>Номер контракта</th></tr>
                                            </thead>
                                            <tbody>
                                                ${f.crew.map(member => `
                                                    <tr>
                                                        <td><strong>${member.first_name} ${member.last_name}</strong></td>
                                                        <td><span class="role-badge role-${member.role.toLowerCase().replace('-', '')}">${member.role}</span></td>
                                                        <td class="muted-text">${member.employee_number}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    ` : '<p class="empty-list-text">Экипаж на данный рейс еще не назначен.</p>'}
                                </div>
                            </div>

                            <div class="details-block">
                                <h3>Список пассажиров</h3>
                                <div class="list-wrapper">
                                    ${f.passengers && f.passengers.length > 0 ? `
                                        <table class="details-list-table">
                                            <thead>
                                                <tr><th>#</th><th>Имя Фамилия</th><th>Номер паспорта</th></tr>
                                            </thead>
                                            <tbody>
                                                ${f.passengers.map((p, index) => `
                                                    <tr>
                                                        <td class="muted-text">${index + 1}</td>
                                                        <td><strong>${p.first_name} ${p.last_name}</strong></td>
                                                        <td class="passport-text">${p.passport_number}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    ` : '<p class="empty-list-text">На этот рейс пока нет зарегистрированных пассажиров.</p>'}
                                </div>
                            </div>
                        </div>
                    `;
                    contentBlock.innerHTML = html;
                })
                .catch(err => {
                    console.error(err);
                    contentBlock.innerHTML = `
                        <div style="text-align: center; color: #e53e3e; padding: 40px;">
                            <h3>Ошибка загрузки данных</h3>
                            <p>${err.message}</p>
                        </div>
                    `;
                });
        }

        const backBtn = document.getElementById('backToPreviousPageBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.history.back();
            });
        }

        loadFlightDetails();
    }
};