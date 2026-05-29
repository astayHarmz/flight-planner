const AirportsPage = {
    render() {
        return `
            <div class="airports-container">
                <h2>База аэропортов</h2>
                
                <div class="filters-panel">
                    <div class="filter-group" style="flex-grow: 1;">
                        <label for="searchAirport">Поиск аэропорта</label>
                        <input type="text" id="searchAirport" placeholder="Введите город, код или название аэропорта...">
                    </div>
                    <button id="clearSearchBtn" class="btn-secondary" style="align-self: flex-end;">Сбросить</button>
                </div>

                <div class="table-wrapper">
                    <table class="airports-table">
                        <thead>
                            <tr>
                                <th>Код IATA</th>
                                <th>Город</th>
                                <th>Название аэропорта</th>
                            </tr>
                        </thead>
                        <tbody id="airportsTableBody">
                            <tr>
                                <td colspan="5" style="text-align: center; color: #718096;">Загрузка базы аэропортов...</td>
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
                        <td colspan="5" style="text-align: center; padding: 20px; color: #718096;">
                            Аэропорты не найдены
                        </td>
                    </tr>`;
                return;
            }

            let rowsHtml = '';
            airports.forEach(airport => {
                rowsHtml += `
                    <tr class="clickable-row" data-code="${airport.code}" style="cursor: pointer;">
                        <td><span class="airport-badge" style="font-size: 0.95rem; padding: 4px 8px;">${airport.code}</span></td>
                        <td><strong>${airport.city}</strong></td>
                        <td style="color: #4a5568;">${airport.name}</td>
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
                    console.error("Ошибка загрузки аэропортов:", err);
                    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Ошибка сервера при загрузке данных</td></tr>`;
                });
        }

        // Слушатель для ввода текста (работает «на лету»)
        searchInput.addEventListener('input', applyFilter);

        // Кнопка очистки
        clearBtn.addEventListener('click', () => {
            searchInput.value = "";
            renderTable(allAirports);
        });

        // Загружаем данные из БД
        loadAirportsData();

        tableBody.addEventListener('click', (e) => {
            const row = e.target.closest('.clickable-row');
            if (row) {
                const code = row.dataset.code;
                window.location.hash = `airport/${code}`; // Генерирует хэш #airport/SVO
            }
        });
                
        // Возвращаем функцию очистки, если она понадобится роутеру
        return () => {
            searchInput.removeEventListener('input', applyFilter);
        };
    }
};