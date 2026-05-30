const AirportsPage = {
    render() {
        return `
            <div class="airports-container">
                <h2>Airport Database</h2>
                
                <div class="filters-panel">
                    <div class="filter-group">
                        <label for="searchAirport">Search Airport</label>
                        <input type="text" id="searchAirport" placeholder="Enter city, code or name">
                    </div>
                    <button id="clearSearchBtn" class="btn-secondary">Clear</button>
                </div>

                <div class="table-wrapper">
                    <table class="airports-table">
                        <thead>
                            <tr>
                                <th>IATA Code</th>
                                <th>City</th>
                                <th>Airport Name</th>
                            </tr>
                        </thead>
                        <tbody id="airportsTableBody">
                            <tr>
                                <td colspan="5">Loading airport database...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    init() {
        const tableBody = document.getElementById('airportsTableBody');
        const searchInput = document.getElementById('searchAirport');
        const clearBtn = document.getElementById('clearSearchBtn');

        let allAirports = [];

        function renderTable(airports) {
            if (!airports || airports.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            No airports found
                        </td>
                    </tr>`;
                return;
            }

            let rowsHtml = '';
            airports.forEach(airport => {
                rowsHtml += `
                    <tr class="clickable-row" data-code="${airport.code}">
                        <td><span class="airport-badge">${airport.code}</span></td>
                        <td><strong>${airport.city}</strong></td>
                        <td>${airport.name}</td>
                    </tr>
                `;
            });
            tableBody.innerHTML = rowsHtml;
        }

        function applyFilter() {
            const query = searchInput.value.toLowerCase().trim();

            if (!query) {
                renderTable(allAirports);
                return;
            }

            const filtered = allAirports.filter(airport => {
                return (
                    airport.city.toLowerCase().includes(query) ||
                    airport.code.toLowerCase().includes(query) ||
                    airport.name.toLowerCase().includes(query)
                );
            });

            renderTable(filtered);
        }

        function loadAirportsData() {
            fetch('/api/airports')
                .then(res => res.json())
                .then(data => {
                    allAirports = data;
                    renderTable(allAirports);
                })
                .catch(err => {
                    console.error("Error loading airports:", err);
                    tableBody.innerHTML = `<tr><td colspan="5">Server error while loading data</td></tr>`;
                });
        }

        
        searchInput.addEventListener('input', applyFilter);

        
        clearBtn.addEventListener('click', () => {
            searchInput.value = "";
            renderTable(allAirports);
        });

        
        loadAirportsData();

        tableBody.addEventListener('click', (e) => {
            const row = e.target.closest('.clickable-row');
            if (row) {
                const code = row.dataset.code;
                window.location.hash = `airport/${code}`; 
            }
        });
                
        
        return () => {
            searchInput.removeEventListener('input', applyFilter);
        };
    }
};