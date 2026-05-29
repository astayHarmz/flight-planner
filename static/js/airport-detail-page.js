const AirportDetailsPage = {
    render() {
        return `
            <div class="airport-details-container">
                <div class="back-panel" style="margin-bottom: 20px;">
                    <a href="#airports" class="btn-secondary">← Вернуться к списку</a>
                </div>
                
                <div id="airportDetailsContent">
                    <div style="text-align: center; color: #718096; padding: 40px;">Загрузка информации об аэропорте...</div>
                </div>
            </div>
        `;
    },

    init(airportCode) {
        const contentBlock = document.getElementById('airportDetailsContent');
        let mapInstance = null;

        function formatDateTime(isoString) {
            const dateObj = new Date(isoString);
            return dateObj.toLocaleDateString('ru-RU') + ' в ' + dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        }

        function loadAirportDetails() {
            fetch(`/api/airports/${airportCode}`)
                .then(res => {
                    if (!res.ok) throw new Error('Аэропорт не найден');
                    return res.json();
                })
                .then(data => {
                    // Рендерим HTML
                    contentBlock.innerHTML = `
                        <div class="airport-main-card" style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 30px;">
                            <div class="airport-info-side" style="flex: 1; min-width: 300px;">
                                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                                    <span class="airport-badge" style="font-size: 1.5rem; padding: 6px 14px;">${data.code}</span>
                                    <h1 style="margin: 0; font-size: 1.8rem;">${data.city}</h1>
                                </div>
                                <h3 style="color: #4a5568; font-weight: normal; margin-bottom: 20px;">${data.name}</h3>
                                <p style="color: #718096; font-size: 0.95rem; line-height: 1.5;">
                                    Этот узел обслуживает внутренние и международные рейсы. Ниже представлено актуальное расписание прибытия и отправления бортов.
                                </p>
                            </div>
                            
                            <div id="airportMiniMap" style="width: 100%; max-width: 450px; height: 250px; border-radius: 8px; border: 1px solid #e2e8f0; background: #edf2f7; overflow: hidden;"></div>
                        </div>

                        <div class="airport-schedule-block">
                            <h3 style="margin-bottom: 15px;">Расписание рейсов (Запланированные / В полете / Завершенные)</h3>
                            <div class="table-wrapper">
                                <table class="flights-table">
                                    <thead>
                                        <tr>
                                            <th>Рейс</th>
                                            <th>Тип</th>
                                            <th>Направление</th>
                                            <th>Самолет</th>
                                            <th>Время вылета</th>
                                            <th>Время прилета</th>
                                            <th>Статус</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.flights && data.flights.length > 0 ? data.flights.map(f => {
                                            let statusClass = 'status-scheduled';
                                            if (f.status === 'In Flight') statusClass = 'status-inflight';
                                            if (f.status === 'Arrived') statusClass = 'status-arrived';

                                            const isDeparture = f.departure_airport.code === data.code;
                                            const typeBadge = isDeparture 
                                                ? `<span style="color: #dd6b20; background: #feebc8; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">Вылет</span>`
                                                : `<span style="color: #3182ce; background: #ebf8ff; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">Прилет</span>`;

                                            const directionText = isDeparture
                                                ? `В ${f.arrival_airport.city} (${f.arrival_airport.code})`
                                                : `Из ${f.departure_airport.city} (${f.departure_airport.code})`;

                                            return `
                                                <tr class="clickable-flight-row" data-id="${f.id}" style="cursor: pointer;">
                                                    <td><strong>${f.flight_number}</strong></td>
                                                    <td>${typeBadge}</td>
                                                    <td>${directionText}</td>
                                                    <td style="color: #4a5568;">${f.airplane.model}</td>
                                                    <td>${formatDateTime(f.departure_time)}</td>
                                                    <td>${formatDateTime(f.arrival_time)}</td>
                                                    <td><span class="status-badge ${statusClass}">${f.status}</span></td>
                                                </tr>
                                            `;
                                        }).join('') : `
                                            <tr>
                                                <td colspan="7" style="text-align: center; color: #718096; padding: 20px;">
                                                    Рейсов не обнаружено.
                                                </td>
                                            </tr>
                                        `}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;

                    // Инициализация карты OpenLayers
                    if (typeof ol !== 'undefined') {
                        // Преобразуем координаты из GPS (EPSG:4326) в проекцию карты OpenLayers (EPSG:3857)
                        const airportCoords = ol.proj.fromLonLat([data.longitude, data.latitude]);

                        // Создаем маркер в виде точки
                        const markerFeature = new ol.Feature({
                            geometry: new ol.geom.Point(airportCoords)
                        });

                        // Задаем стиль маркеру (красный пин авиации)
                        markerFeature.setStyle(new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 7,
                                fill: new ol.style.Fill({ color: '#e53e3e' }),
                                stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 })
                            })
                        }));

                        const vectorSource = new ol.source.Vector({
                            features: [markerFeature]
                        });

                        const vectorLayer = new ol.layer.Vector({
                            source: vectorSource
                        });

                        // Собираем карту
                        mapInstance = new ol.Map({
                            target: 'airportMiniMap',
                            layers: [
                                new ol.layer.Tile({
                                    source: new ol.source.OSM()
                                }),
                                vectorLayer
                            ],
                            view: new ol.View({
                                center: airportCoords,
                                zoom: 11
                            }),
                            controls: [] // убираем дефолтные кнопки зума, чтобы виджет выглядел минималистично
                        });
                    }
                })
                .catch(err => {
                    console.error(err);
                    contentBlock.innerHTML = `
                        <div style="text-align: center; color: #e53e3e; padding: 40px;">
                            <h3>Не удалось загрузить данные об аэропорте</h3>
                            <p>${err.message}</p>
                        </div>
                    `;
                });
        }

        // Переход на детали рейса по клику на строчку расписания
        contentBlock.addEventListener('click', (e) => {
            const row = e.target.closest('.clickable-flight-row');
            if (row) {
                window.location.hash = `flight/${row.dataset.id}`;
            }
        });

        loadAirportDetails();

        // Функция очистки при смене страницы в SPA
        return () => {
            if (mapInstance) {
                mapInstance.setTarget(null);
                mapInstance = null;
            }
        };
    }
};