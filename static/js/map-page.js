const MapPage = {
    render() {
        return `
            <div class="map-wrapper">
                <div id="map"></div>
                <div id="flightSidebar" class="sidebar">
                    <button class="close-btn" id="closeSidebarBtn">&times;</button>
                    <div class="sidebar-content" id="sidebarData"></div>
                </div>
            </div>
        `;
    },

    init() {
        const planeSource = new ol.source.Vector();
        const planeLayer = new ol.layer.Vector({ source: planeSource });
        const detailSource = new ol.source.Vector();
        const detailLayer = new ol.layer.Vector({ source: detailSource });

        const map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                    })
                }),
                detailLayer,
                planeLayer
            ],
            view: new ol.View({ center: ol.proj.fromLonLat([10, 30]), zoom: 2.5 })
        });

        map.updateSize();

        const planeImage = new Image();
        planeImage.src = '/static/img/plane.png';

        let flightsData = [];
        let isDestroyed = false;
        let pollIntervalId = null;

        function lerp(start, end, amt) { return start + (end - start) * amt; }

        function animatePlanes() {
            if (isDestroyed) return;

            const now = Date.now();
            const currentFlightIds = flightsData.map(f => f.id);

            planeSource.getFeatures().forEach(feature => {
                if (feature.get('id') === 'active-plane') {
                    const fId = feature.get('flightId');
                    if (!currentFlightIds.includes(fId)) {
                        planeSource.removeFeature(feature);
                        
                        const sidebar = document.getElementById('flightSidebar');
                        if (sidebar && sidebar.classList.contains('open')) {
                            sidebar.classList.remove('open');
                            detailSource.clear();
                        }
                    }
                }
            });

            flightsData.forEach(flight => {
                const startTime = new Date(flight.departure_time).getTime();
                const endTime = new Date(flight.arrival_time).getTime();
                
                const totalDuration = endTime - startTime;
                const elapsed = now - startTime;
                let progress = elapsed / totalDuration;

                if (progress < 0) progress = 0;
                if (progress > 1) progress = 1;

                const coordA = flight.departure_airport.coordinates;
                const coordB = flight.arrival_airport.coordinates;

                const pA = ol.proj.fromLonLat(coordA);
                const pB = ol.proj.fromLonLat(coordB);
                
                const deltaX = pB[0] - pA[0];
                const deltaY = pB[1] - pA[1];
                
                const angleRad = Math.atan2(deltaY, deltaX);
                const olRotation = Math.PI / 2 - angleRad;

                const currentX = lerp(pA[0], pB[0], progress);
                const currentY = lerp(pA[1], pB[1], progress);

                let planeFeature = planeSource.getFeatures().find(f => f.get('flightId') === flight.id);

                if (!planeFeature) {
                    planeFeature = new ol.Feature({ geometry: new ol.geom.Point([currentX, currentY]) });
                    planeFeature.set('id', 'active-plane');
                    planeFeature.set('flightId', flight.id);
                    
                    if (planeImage.complete) {
                        applyPlaneStyle(planeFeature, olRotation);
                    } else {
                        planeImage.onload = () => applyPlaneStyle(planeFeature, olRotation);
                    }
                    
                    planeSource.addFeature(planeFeature);
                } else {
                    planeFeature.getGeometry().setCoordinates([currentX, currentY]);
                    if (planeFeature.getStyle()) {
                        planeFeature.getStyle().getImage().setRotation(olRotation);
                    }
                }
            });

            requestAnimationFrame(animatePlanes);
        }

        function applyPlaneStyle(feature, rotationAngle) {
            feature.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                    img: planeImage,
                    scale: 0.1,
                    anchor: [0.5, 0.5],
                    rotation: rotationAngle
                })
            }));
        }

        function loadFlightsFromServer() {
            fetch('/api/flights/active')
                .then(res => res.json())
                .then(data => {
                    flightsData = data;
                })
                .catch(err => console.error("Error loading flights:", err));
        }

        loadFlightsFromServer();
        animatePlanes();

        pollIntervalId = setInterval(loadFlightsFromServer, 5000);

        const sidebar = document.getElementById('flightSidebar');
        const sidebarData = document.getElementById('sidebarData');
        const closeBtn = document.getElementById('closeSidebarBtn');

        function formatDateTime(isoString) {
            const dateObj = new Date(isoString);
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `${dateStr} at ${timeStr}`;
        }

        function showFlightDetails(flight) {
            const pA = ol.proj.fromLonLat(flight.departure_airport.coordinates);
            const pB = ol.proj.fromLonLat(flight.arrival_airport.coordinates);

            detailSource.clear();

            const flightPath = new ol.Feature({ geometry: new ol.geom.LineString([pA, pB]) });
            flightPath.setStyle(new ol.style.Style({
                stroke: new ol.style.Stroke({ color: 'rgba(49, 130, 206, 0.6)', width: 2.5, lineDash: [4, 6] })
            }));

            const airportStyle = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({ color: '#3182ce' }),
                    stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
                })
            });
            const markerA = new ol.Feature({ geometry: new ol.geom.Point(pA) });
            const markerB = new ol.Feature({ geometry: new ol.geom.Point(pB) });
            markerA.setStyle(airportStyle);
            markerB.setStyle(airportStyle);

            detailSource.addFeatures([flightPath, markerA, markerB]);

            sidebarData.innerHTML = `
                <h3>Flight ${flight.flight_number}</h3>
                <hr style="border-color: #e2e8f0; margin: 15px 0;">
                <img src="${flight.airplane.image_path || '/static/img/planes/default.png'}" 
                     alt="Aircraft" 
                     style="width: 100%; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                     onerror="this.src='https://placehold.co/300x150?text=No+Image'">
                <p><strong>Route:</strong> ${flight.departure_airport.city} (${flight.departure_airport.code}) &rarr; ${flight.arrival_airport.city} (${flight.arrival_airport.code})</p>
                <p><strong>Departure Airport:</strong> ${flight.departure_airport.name}</p>
                <p><strong>Arrival Airport:</strong> ${flight.arrival_airport.name}</p>
                <p><strong>Departure Time:</strong> ${formatDateTime(flight.departure_time)}</p>
                <p><strong>Arrival Time:</strong> ${formatDateTime(flight.arrival_time)}</p>
                <p><strong>Aircraft:</strong> ${flight.airplane.model} (${flight.airplane.tail_number})</p>
                <p><strong>Capacity:</strong> ${flight.airplane.capacity} passengers</p>
                <p><strong>Status:</strong> <span style="color: #3182ce; font-weight: bold;">${flight.status}</span></p>
            `;

            sidebar.classList.add('open');
        }

        map.on('click', function (event) {
            const feature = map.forEachFeatureAtPixel(event.pixel, function (feat) { return feat; });
            if (feature && feature.get('id') === 'active-plane') {
                const fId = feature.get('flightId');
                const clickedFlight = flightsData.find(f => f.id === fId);
                if (clickedFlight) showFlightDetails(clickedFlight);
            } else {
                sidebar.classList.remove('open');
                detailSource.clear();
            }
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.remove('open');
            detailSource.clear();
        });

        map.on('pointermove', function (e) {
            const pixel = map.getEventPixel(e.originalEvent);
            const hit = map.forEachFeatureAtPixel(pixel, function (feat) {
                return feat.get('id') === 'active-plane';
            });
            map.getTargetElement().style.cursor = hit ? 'pointer' : '';
        });

        return () => {
            isDestroyed = true;
            if (pollIntervalId) clearInterval(pollIntervalId);
        };
    }
};