window.OrderSearchHandler = {
    currentOrders: [],
    marketColors: {},
    tableHeaders: [],
    
    async init() {
        this.render();
        this.initializeFilters();
        await this.loadMarketList();
        await this.loadOrders();
    },
    
    render() {
        const container = document.getElementById('om-panel-search');
        container.innerHTML = `
            <style>
                /* 검색 패널 전체 스타일 */
                .search-container {
                    padding: 0;
                    background: transparent;
                }

                /* 패널 헤더 */
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
                    color: #212529;
                    margin: 0;
                }

                /* 검색 섹션 */
                .search-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-top: none;
                    border-radius: 0 0 8px 8px;
                    padding: 24px;
                    margin-bottom: 24px;
                }

                /* 빠른 필터 */
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
                    color: #495057;
                    font-size: 12px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .quick-filter-btn:hover {
                    border-color: #2563eb;
                    color: #2563eb;
                }

                .quick-filter-btn.active {
                    background: #2563eb;
                    color: #ffffff;
                    border-color: #2563eb;
                }

                /* 검색 필터 */
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
                    color: #212529;
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

                /* 버튼 그룹 */
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
                    color: #495057;
                    border: 1px solid #dee2e6;
                }

                .btn-search.secondary:hover {
                    background: #f8f9fa;
                }

                .btn-action {
                    padding: 6px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    background: #ffffff;
                    color: #495057;
                    font-size: 12px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .btn-action:hover {
                    background: #f8f9fa;
                }

                /* 테이블 섹션 */
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
                    color: #212529;
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
                    color: #6c757d;
                    border-bottom: 2px solid #dee2e6;
                    white-space: nowrap;
                }

                .search-table td {
                    padding: 6px 8px;
                    font-size: 12px;
                    font-weight: 300;
                    color: #212529;
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

                .search-table tbody tr.selected-row {
                    background: #e7f3ff;
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

                /* 결과 정보 */
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
            </style>

            <div class="search-container">
                <!-- 검색 패널 -->
                <div class="panel-header">
                    <h2 class="panel-title">주문조회</h2>
                    <div class="panel-actions">
                        <button class="btn-action" onclick="OrderSearchHandler.resetFilters()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="23 4 23 10 17 10"></polyline>
                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                </svg>
                            초기화
                        </button>
                    </div>
                </div>

                <!-- 검색 영역 -->
                <div class="search-section">
                    <!-- 빠른 필터 -->
                    <div class="quick-filters">
                        <button class="quick-filter-btn active" onclick="OrderSearchHandler.setQuickFilter('today', this)">오늘</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('yesterday', this)">어제</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('week', this)">이번 주</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('month', this)">이번 달</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('last30', this)">최근 30일</button>
                        <button class="quick-filter-btn" onclick="OrderSearchHandler.setQuickFilter('custom', this)">직접 설정</button>
                    </div>

                    <!-- 검색 필터 -->
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

                    <!-- 검색 버튼 -->
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

                <!-- 테이블 섹션 -->
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
                                <tr>
                                    <th class="checkbox-cell">
                                        <input type="checkbox" id="selectAllCheckbox" 
                                               onchange="OrderSearchHandler.toggleSelectAll(this)">
                                    </th>
                                    <th>연번</th>
                                    <th>마켓명</th>
                                    <th>결제일</th>
                                    <th>주문번호</th>
                                    <th>주문자</th>
                                    <th>수령인</th>
                                    <th>전화번호</th>
                                    <th style="width: 300px;">주소</th>
                                    <th>옵션명</th>
                                    <th>수량</th>
                                    <th>금액</th>
                                    <th>택배사</th>
                                    <th>송장번호</th>
                                    <th>상태</th>
                                </tr>
                            </thead>
                            <tbody id="searchTableBody">
                                <tr>
                                    <td colspan="15" style="text-align: center; padding: 40px; color: #6c757d;">
                                        조회 조건을 선택하고 검색 버튼을 클릭하세요.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
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
                startDate.setDate(today.getDate() - today.getDay());
                endDate = today;
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
                select.innerHTML = '<option value="">전체</option>';
                
                Object.keys(data.colors || {}).forEach(market => {
                    select.innerHTML += `<option value="${market}">${market}</option>`;
                });
                
                this.marketColors = data.colors || {};
            }
        } catch (error) {
            console.error('마켓 목록 로드 실패:', error);
        }
    },

    async loadOrders() {
        // 실제 구현시 API 호출
        this.updateTable();
    },

    updateTable() {
        const tbody = document.getElementById('searchTableBody');
        
        if (this.currentOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="15" style="text-align: center; padding: 40px; color: #6c757d;">
                        조회된 주문이 없습니다.
                    </td>
                </tr>
            `;
            document.getElementById('resultCount').textContent = '0';
        } else {
            // 데이터 렌더링
            document.getElementById('resultCount').textContent = this.currentOrders.length;
        }
    },

    toggleSelectAll(checkbox) {
        const checkboxes = document.querySelectorAll('#searchTableBody input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = checkbox.checked);
    },

    exportToExcel() {
        console.log('엑셀 다운로드');
    },

    refreshData() {
        this.loadOrders();
    }
};