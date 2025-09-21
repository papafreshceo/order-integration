window.OrderSearchHandler = {
    currentOrders: [],
    marketColors: {},
    tableHeaders: [],
    dateType: 'payment',
    
    async init() {
        this.render();
        this.initializeFilters();
        await this.loadMarketList();
        await this.loadOrders();
        
        // 이벤트 리스너 추가
        document.getElementById('searchStartDate')?.addEventListener('change', () => this.loadOrders());
        document.getElementById('searchEndDate')?.addEventListener('change', () => this.loadOrders());
    },
    
    render() {
        const container = document.getElementById('om-panel-search');
        if (!container) return;
        
        container.innerHTML = `
            <style>
                .search-container {
                    padding: 0;
                    background: transparent;
                }

                .panel-header {
                    background: #ffffff;
                    padding: 24px;
                    border: 1px solid #dee2e6;
                    border-radius: 8px 8px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .panel-title {
                    font-size: 18px;
                    font-weight: 500;
                    color: #042848;
                    margin: 0;
                }

                .search-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-top: none;
                    border-radius: 0 0 8px 8px;
                    padding: 24px;
                    margin-bottom: 24px;
                }

                .quick-filters {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }

                .quick-filter-btn {
                    padding: 6px 14px;
                    border: 1px solid #dee2e6;
                    border-radius: 20px;
                    background: #ffffff;
                    color: #042848;
                    font-size: 12px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .quick-filter-btn:hover {
                    border-color: #2563eb;
                    background: #f0f8ff;
                }

                .quick-filter-btn.active {
                    background: #2563eb;
                    color: #ffffff;
                    border-color: #2563eb;
                }

                .search-filters {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .filter-label {
                    font-size: 12px;
                    font-weight: 300;
                    color: #6c757d;
                }

                .filter-input,
                .filter-select {
                    padding: 8px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    color: #042848;
                    background: #ffffff;
                    transition: all 0.2s;
                }

                .filter-input:focus,
                .filter-select:focus {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }

                .date-range-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .date-input {
                    flex: 1;
                }

                .date-separator {
                    color: #6c757d;
                    font-weight: 300;
                }

                .search-button-group {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }

                .btn-search {
                    padding: 10px 24px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border: none;
                }

                .btn-search.primary {
                    background: #2563eb;
                    color: #ffffff;
                }

                .btn-search.primary:hover {
                    background: #1d4ed8;
                }

                .btn-search.secondary {
                    background: #ffffff;
                    color: #042848;
                    border: 1px solid #dee2e6;
                }

                .btn-search.secondary:hover {
                    background: #f0f8ff;
                }

                .btn-action {
                    padding: 6px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    background: #ffffff;
                    color: #042848;
                    font-size: 12px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .btn-action:hover {
                    background: #f0f8ff;
                }

                .table-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .table-header {
                    padding: 16px 24px;
                    border-bottom: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8f9fa;
                }

                .table-header-left {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .table-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: #042848;
                }

                .table-actions {
                    display: flex;
                    gap: 8px;
                }

                .table-wrapper {
                    overflow-x: auto;
                    overflow-y: auto;
                    height: calc(100vh - 500px);
                    min-height: 400px;
                    max-height: 700px;
                }
                
                .search-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 1200px;
                }

                .search-table thead {
                    position: sticky;
                    top: 0;
                    background: #f8f9fa;
                    z-index: 10;
                }

                .search-table th {
                    padding: 12px 8px;
                    text-align: center;
                    font-size: 12px;
                    font-weight: 400;
                    color: #042848;
                    border-bottom: 2px solid #dee2e6;
                    white-space: nowrap;
                }

                .search-table td {
                    padding: 6px 8px;
                    font-size: 12px;
                    font-weight: 300;
                    color: #042848;
                    border-bottom: 1px solid #f1f3f5;
                    text-align: center;
                    height: 32px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .search-table tbody tr:hover {
                    background: #b7f7bd;
                }

                .search-table tbody tr.has-tracking {
                    background: #f0f3f7;
                }

                .checkbox-cell {
                    width: 50px;
                    text-align: center;
                }

                .checkbox-cell input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }

                .result-info {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    font-size: 13px;
                    color: #6c757d;
                }

                .result-count {
                    color: #2563eb;
                    font-weight: 500;
                }

                .result-count {
                    color: #2563eb;
                    font-weight: 500;
                }

                .date-type-switch {
                    display: flex;
                    background: #f8f9fa;
                    border-radius: 20px;
                    padding: 2px;
                }

                .switch-label {
                    display: flex;
                    align-items: center;
                    padding: 6px 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-radius: 18px;
                }

                .switch-label input[type="radio"] {
                    display: none;
                }

                .switch-label input[type="radio"]:checked + span {
                    background: #2563eb;
                    color: #ffffff;
                    padding: 4px 10px;
                    border-radius: 16px;
                }

                .switch-label span {
                    font-size: 12px;
                    font-weight: 400;
                    padding: 4px 10px;
                    transition: all 0.2s;
                }

            </style>

            <div class="search-container">
                <div class="panel-header">
                    <h2 class="panel-title">주문조회</h2>
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div class="date-type-switch">
                            <label class="switch-label">
                                <input type="radio" name="dateType" value="payment" checked onchange="OrderSearchHandler.changeDateType('payment')">
                                <span>결제일</span>
                            </label>
                            <label class="switch-label">
                                <input type="radio" name="dateType" value="sheet" onchange="OrderSearchHandler.changeDateType('sheet')">
                                <span>주문통합일</span>
                            </label>
                        </div>
                        <button class="btn-action" onclick="OrderSearchHandler.resetFilters()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                            초기화
                        </button>
                    </div>
                </div>

                <div class="search-section">
                    <div class="quick-filters">
                        <button class="quick-filter-btn active" onclick="OrderSearchHandler.setQuickFilter('today', this)">오늘</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('yesterday', this)">어제</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('week', this)">이번 주</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('last7', this)">최근 7일</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('month', this)">이번 달</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('last30', this)">최근 30일</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('custom', this)">직접 설정</button>
                    </div>

                    <div class="search-filters">
                        <div class="filter-group">
                            <label class="filter-label">기간</label>
                            <div class="date-range-container">
                                <input type="date" class="filter-input date-input" id="searchStartDate">
                                <span class="date-separator">~</span>
                                <input type="date" class="filter-input date-input" id="searchEndDate">
                            </div>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">마켓</label>
                            <select class="filter-select" id="searchMarketFilter">
                                <option value="">전체</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">주문 상태</label>
                            <select class="filter-select" id="searchStatusFilter">
                                <option value="">전체</option>
                                <option value="preparing">상품준비중</option>
                                <option value="shipped">발송완료</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">검색어</label>
                            <input type="text" class="filter-input" id="searchKeywordInput" 
                                   placeholder="주문번호, 수령인, 송장번호">
                        </div>
                    </div>

                    <div class="search-button-group">
                        <button class="btn-search secondary" onclick="OrderSearchHandler.exportToExcel()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            엑셀 다운로드
                        </button>
                        <button class="btn-search primary" onclick="OrderSearchHandler.loadOrders()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            검색
                        </button>
                    </div>
                </div>

                <div class="table-section">
                    <div class="table-header">
                        <div class="table-header-left">
                            <h3 class="table-title">주문 목록</h3>
                            <div class="result-info">
                                <span>검색결과: <span class="result-count" id="resultCount">0</span>건</span>
                            </div>
                        </div>
                        <div class="table-actions">
                            <button class="btn-action" onclick="OrderSearchHandler.refreshData()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 4v6h6M23 20v-6h-6"></path>
                                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
                                </svg>
                                새로고침
                            </button>
                        </div>
                    </div>
                    
                    <div class="table-wrapper">
                        <table class="search-table" id="searchTable">
                            <thead id="searchTableHead">
                            </thead>
                            <tbody id="searchTableBody">
                                <tr>
                                    <td colspan="100" style="text-align: center; padding: 40px; color: #6c757d;">
                                        조회 조건을 선택하고 검색 버튼을 클릭하세요.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // 필터 이벤트 리스너 추가
        setTimeout(() => {
            document.getElementById('searchMarketFilter')?.addEventListener('change', () => this.updateTable());
            document.getElementById('searchStatusFilter')?.addEventListener('change', () => this.updateTable());
            document.getElementById('searchKeywordInput')?.addEventListener('input', () => this.updateTable());
        }, 100);
    },

    initializeFilters() {
        const today = new Date();
        document.getElementById('searchEndDate').value = this.formatDate(today);
        document.getElementById('searchStartDate').value = this.formatDate(today);
    },

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    setQuickFilter(type, buttonElement) {
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        if (buttonElement) {
            buttonElement.classList.add('active');
        }

        const today = new Date();
        let startDate = new Date();
        let endDate = new Date();

        switch(type) {
            case 'today':
                startDate = today;
                endDate = today;
                break;
            case 'yesterday':
                startDate.setDate(today.getDate() - 1);
                endDate = new Date(startDate);
                break;
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - today.getDay());
                endDate = new Date(today);
                break;
            case 'last7':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 6);
                endDate = new Date(today);
                break;
            case 'month':
                startDate.setDate(1);
                endDate = today;
                break;
            case 'last30':
                startDate.setDate(today.getDate() - 30);
                endDate = today;
                break;
            case 'custom':
                return;
        }

        document.getElementById('searchStartDate').value = this.formatDate(startDate);
        document.getElementById('searchEndDate').value = this.formatDate(endDate);
        
        // 필터 변경 시 자동으로 데이터 로드
        this.loadOrders();
    },

    resetFilters() {
        const today = new Date();
        document.getElementById('searchStartDate').value = this.formatDate(today);
        document.getElementById('searchEndDate').value = this.formatDate(today);
        document.getElementById('searchMarketFilter').value = '';
        document.getElementById('searchStatusFilter').value = '';
        document.getElementById('searchKeywordInput').value = '';
        
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.quick-filter-btn').classList.add('active');
        
        this.loadOrders();
    },

    changeDateType(type) {
        this.dateType = type;
        this.loadOrders();
    },

    async loadMarketList() {
        try {
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getMarketData',
                    useMainSpreadsheet: false
                })
            });
            const data = await response.json();
            
            if (data.success) {
                const select = document.getElementById('searchMarketFilter');
                if (select) {
                    select.innerHTML = '<option value="">전체</option>';
                    
                    Object.keys(data.colors || {}).forEach(market => {
                        select.innerHTML += `<option value="${market}">${market}</option>`;
                    });
                }
                
                this.marketColors = data.colors || {};
            }
        } catch (error) {
            console.error('마켓 목록 로드 실패:', error);
        }
    },

    async loadOrders() {
        this.showLoading();
        try {
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getMarketData',
                    useMainSpreadsheet: true
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.currentOrders = result.data || [];
                this.marketColors = result.colors || {};
                
                // 디버깅: 데이터 확인
                console.log('전체 주문 수:', this.currentOrders.length);
                if (this.currentOrders.length > 0) {
                    console.log('첫 번째 주문 데이터:', this.currentOrders[0]);
                    console.log('결제일 필드:', this.currentOrders[0]['결제일']);
                    this.tableHeaders = Object.keys(this.currentOrders[0]);
                }
                
                const today = document.getElementById('searchStartDate').value;
                console.log('오늘 날짜 필터:', today);
                
                this.updateTable();
            } else {
                this.showMessage('데이터를 불러올 수 없습니다.', 'error');
            }
        } catch (error) {
            console.error('로드 오류:', error);
            this.showMessage('데이터 로드 중 오류가 발생했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    },

    parseDate(dateStr) {
        if (!dateStr) return null;
        
        // 공백 제거
        dateStr = String(dateStr).trim();
        
        // YYYYMMDD 형식 (20240115)
        if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            return new Date(year, month - 1, day);
        }
        
        // YYYY-MM-DD 형식
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            return new Date(dateStr);
        }
        
        // YYYY/MM/DD 형식
        if (/^\d{4}\/\d{2}\/\d{2}/.test(dateStr)) {
            return new Date(dateStr.replace(/\//g, '-'));
        }
        
        // MM/DD/YYYY 또는 M/D/YYYY 형식
        if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
            const parts = dateStr.split('/');
            return new Date(parts[2], parts[0] - 1, parts[1]);
        }
        
        return null;
    },

    updateTable() {
        const thead = document.getElementById('searchTableHead');
        const tbody = document.getElementById('searchTableBody');
        
        if (!thead || !tbody) return;
        
        // 헤더 생성
        thead.innerHTML = '';
        const headerRow = document.createElement('tr');
        
        // 체크박스 컬럼
        const thCheckbox = document.createElement('th');
        thCheckbox.className = 'checkbox-cell';
        thCheckbox.innerHTML = '<input type="checkbox" onchange="OrderSearchHandler.toggleSelectAll(this)">';
        headerRow.appendChild(thCheckbox);
        
        // 매핑시트에서 가져온 모든 헤더 추가
        if (this.currentOrders.length > 0) {
            const columnWidths = {
                '연번': 50,
                '마켓명': 100,
                '마켓': 60,
                '결제일': 150,
                '주문번호': 140,
                '상품주문번호': 140,
                '주문자': 70,
                '수취인': 70,
                '수령인': 70,
                '주문자전화번호': 120,
                '수취인전화번호': 120,
                '수령인전화번호': 120,
                '주소': 300,
                '수취인주소': 300,
                '수령인주소': 300,
                '배송메세지': 100,
                '배송메시지': 100,
                '옵션명': 160,
                '수량': 60,
                '확인': 160,
                '셀러': 80,
                '셀러공급가': 70,
                '출고처': 80,
                '송장주체': 60,
                '벤더사': 100,
                '발송지명': 100,
                '발송지주소': 300,
                '발송지연락처': 120,
                '출고비용': 90,
                '정산예정금액': 90,
                '정산대상금액': 90,
                '상품금액': 80,
                '최종결제금액': 90,
                '할인금액': 90,
                '마켓부담할인금액': 120,
                '판매자할인쿠폰할인': 120,
                '구매쿠폰적용금액': 120,
                '쿠폰할인금액': 100,
                '기타지원금할인금': 120,
                '수수료1': 70,
                '수수료2': 70,
                '판매아이디': 80,
                '분리배송 Y/N': 100,
                '택배비': 80,
                '발송일(송장입력일)': 150,
                '택배사': 80,
                '송장번호': 140
            };
            
            this.tableHeaders = Object.keys(this.currentOrders[0]);
            this.tableHeaders.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                const width = columnWidths[header] || 100;
                th.style.width = width + 'px';
                th.style.minWidth = width + 'px';
                th.style.maxWidth = width + 'px';
                headerRow.appendChild(th);
            });
        }
        
        thead.appendChild(headerRow);
        
        const filteredOrders = this.getFilteredOrders();
        
        tbody.innerHTML = '';
        
        if (filteredOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 40px; color: #6c757d;">조회된 주문이 없습니다.</td></tr>';
            document.getElementById('resultCount').textContent = '0';
            return;
        }
        
        document.getElementById('resultCount').textContent = filteredOrders.length;
        
        filteredOrders.forEach((order, index) => {
            const row = this.createTableRow(order, index + 1);
            tbody.appendChild(row);
        });
    },

    createTableRow(order, serialNumber) {
        const row = document.createElement('tr');
        const hasTracking = order['송장번호'] && order['송장번호'].trim() !== '';
        
        if (hasTracking) {
            row.classList.add('has-tracking');
        }
        
        const tdCheckbox = document.createElement('td');
        tdCheckbox.className = 'checkbox-cell';
        tdCheckbox.style.width = '50px';
        tdCheckbox.innerHTML = `<input type="checkbox" class="order-checkbox" data-index="${serialNumber - 1}">`;
        row.appendChild(tdCheckbox);
        
                const columnWidths = {
            '연번': 50,
            '마켓명': 100,
            '마켓': 60,
            '결제일': 150,
            '주문번호': 140,
            '상품주문번호': 140,
            '주문자': 70,
            '수취인': 70,
            '수령인': 70,
            '주문자전화번호': 120,
            '수취인전화번호': 120,
            '수령인전화번호': 120,
            '주소': 300,
            '수취인주소': 300,
            '수령인주소': 300,
            '배송메세지': 100,
            '배송메시지': 100,
            '옵션명': 160,
            '수량': 60,
            '확인': 160,
            '셀러': 80,
            '셀러공급가': 70,
            '출고처': 80,
            '송장주체': 60,
            '벤더사': 100,
            '발송지명': 100,
            '발송지주소': 300,
            '발송지연락처': 120,
            '출고비용': 90,
            '정산예정금액': 90,
            '정산대상금액': 90,
            '상품금액': 80,
            '최종결제금액': 90,
            '할인금액': 90,
            '마켓부담할인금액': 120,
            '판매자할인쿠폰할인': 120,
            '구매쿠폰적용금액': 120,
            '쿠폰할인금액': 100,
            '기타지원금할인금': 120,
            '수수료1': 70,
            '수수료2': 70,
            '판매아이디': 80,
            '분리배송 Y/N': 100,
            '택배비': 80,
            '발송일(송장입력일)': 150,
            '택배사': 80,
            '송장번호': 140
        };
        
        this.tableHeaders.forEach(header => {
            const td = document.createElement('td');
            
            const width = columnWidths[header] || 100;
            td.style.width = width + 'px';
            td.style.minWidth = width + 'px';
            td.style.maxWidth = width + 'px';
            
            if (header === '연번') {
                td.textContent = serialNumber;
            } else if (header === '마켓명') {
                const marketName = order[header] || '';
                const marketColor = this.marketColors[marketName] || 'rgb(128,128,128)';
                td.innerHTML = `
                    <span style="display: inline-block; padding: 2px 6px; background: ${marketColor}; 
                         color: ${this.getTextColor(marketColor)}; border-radius: 4px; font-size: 11px; font-weight: 600;">
                        ${marketName}
                    </span>
                `;
            } else {
                const value = order[header] || '';
                
                if (header.includes('금액') || header.includes('가격')) {
                    td.style.textAlign = 'right';
                    td.textContent = this.formatNumber(value);
                } else if (header === '수량') {
                    td.style.textAlign = 'right';
                    td.style.paddingRight = '12px';
                    td.textContent = value;
                } else {
                    td.textContent = value;
                }
                
                // 텍스트 정렬
                if (header === '옵션명' || header === '주소' || header === '배송메세지') {
                    td.style.textAlign = 'left';
                }
            }
            
            row.appendChild(td);
        });
        
        return row;
    },

    getFilteredOrders() {
        let filtered = [...this.currentOrders];
        
        // 날짜 필터링
        const startDate = document.getElementById('searchStartDate')?.value;
        const endDate = document.getElementById('searchEndDate')?.value;
        
        if (startDate && endDate) {
            if (startDate && endDate && this.dateType === 'payment') {
            // 결제일 기준 필터링만 적용
            const startNum = parseInt(startDate.replace(/-/g, ''));
            const endNum = parseInt(endDate.replace(/-/g, ''));
            
            filtered = filtered.filter(order => {
                // 모든 날짜 관련 필드 확인
                const dateField = order['결제일'] || order['주문일'] || order['날짜'] || '';
                
                // 날짜 형식 변환
                let dateNum = 0;
                
                // YYYY/MM/DD HH:MM:SS 형식
                if (dateField.includes('/')) {
                    const datePart = dateField.split(' ')[0];
                    const parts = datePart.split('/');
                    if (parts.length === 3) {
                        dateNum = parseInt(parts[0] + parts[1].padStart(2, '0') + parts[2].padStart(2, '0'));
                    }
                }
                // YYYY-MM-DD 형식
                else if (dateField.includes('-')) {
                    dateNum = parseInt(dateField.substring(0, 10).replace(/-/g, ''));
                }
                // YYYYMMDD 형식
                else if (/^\d{8}$/.test(dateField)) {
                    dateNum = parseInt(dateField);
                }
                
                return dateNum >= startNum && dateNum <= endNum;
            });
        }
    }
        
        // 마켓 필터
        const marketFilter = document.getElementById('searchMarketFilter')?.value;
        if (marketFilter) {
            filtered = filtered.filter(order => order['마켓명'] === marketFilter);
        }
        
        // 상태 필터
        const statusFilter = document.getElementById('searchStatusFilter')?.value;
        if (statusFilter === 'preparing') {
            filtered = filtered.filter(order => !order['송장번호'] || order['송장번호'].trim() === '');
        } else if (statusFilter === 'shipped') {
            filtered = filtered.filter(order => order['송장번호'] && order['송장번호'].trim() !== '');
        }
        
        // 검색어 필터
        const keyword = document.getElementById('searchKeywordInput')?.value?.toLowerCase();
        if (keyword) {
            filtered = filtered.filter(order => {
                return Object.values(order).some(value => 
                    String(value).toLowerCase().includes(keyword)
                );
            });
        }
        
        return filtered;
    },

    toggleSelectAll(checkbox) {
        const checkboxes = document.querySelectorAll('.order-checkbox');
        checkboxes.forEach(cb => cb.checked = checkbox.checked);
    },

    async exportToExcel() {
        const filteredOrders = this.getFilteredOrders();
        
        if (filteredOrders.length === 0) {
            this.showMessage('내보낼 데이터가 없습니다.', 'error');
            return;
        }
        
        // XLSX 라이브러리 확인
        if (typeof XLSX === 'undefined') {
            this.showMessage('엑셀 라이브러리를 로드하는 중입니다...', 'info');
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = () => this.exportToExcel();
            document.head.appendChild(script);
            return;
        }
        
        const ws = XLSX.utils.json_to_sheet(filteredOrders);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '주문목록');
        
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        XLSX.writeFile(wb, `주문조회_${date}.xlsx`);
    },

    refreshData() {
        this.loadOrders();
    },

    getTextColor(bgColor) {
        const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 128 ? '#000' : '#fff';
        }
        return '#fff';
    },

    formatNumber(num) {
        if (!num) return '0';
        return Number(num).toLocaleString('ko-KR');
    },

    showLoading() {
        const loading = document.getElementById('om-loading');
        if (loading) loading.classList.add('show');
    },

    hideLoading() {
        const loading = document.getElementById('om-loading');
        if (loading) loading.classList.remove('show');
    },

    showMessage(message, type = 'info') {
        const div = document.createElement('div');
        div.className = `om-message ${type} show`;
        div.textContent = message;
        document.body.appendChild(div);
        
        setTimeout(() => {
            div.remove();
        }, 3000);
    }
};