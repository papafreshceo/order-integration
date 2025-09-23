window.OrderSearchHandler = {
    currentOrders: [],
    marketColors: {},
    tableHeaders: [],
    dateType: 'payment',
    currentCsOrder: null,
    
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

/* CS 모달 스타일 */
                .cs-modal-overlay {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    align-items: center;
                    justify-content: center;
                }

                .cs-modal-overlay.show {
                    display: flex;
                }

                .cs-modal {
                    background: #ffffff;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 900px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }

                .cs-modal-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8f9fa;
                }

                .cs-modal-title {
                    font-size: 18px;
                    font-weight: 500;
                    color: #042848;
                }

                .cs-modal-close {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    transition: all 0.2s;
                }

                .cs-modal-close:hover {
                    background: #ffffff;
                }

                .cs-modal-body {
                    padding: 20px;
                }

                .cs-order-info {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 20px;
                }

                .cs-info-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-top: 12px;
                }

                .cs-info-item {
                    font-size: 13px;
                    color: #6c757d;
                    font-weight: 300;
                    line-height: 1.4;
                }

                .cs-info-value {
                    color: #042848;
                    font-weight: 400;
                }

                .cs-form-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 16px;
                    margin-bottom: 16px;
                }

                .cs-form-group {
                    margin-bottom: 16px;
                }

                .cs-form-label {
                    display: block;
                    margin-bottom: 6px;
                    font-size: 13px;
                    font-weight: 400;
                    color: #042848;
                }

                .cs-textarea {
                    width: 100%;
                    min-height: 80px;
                    padding: 10px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 300;
                    resize: vertical;
                }

                .cs-select {
                    width: 100%;
                    padding: 8px 10px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 300;
                    background: #ffffff;
                }

                .cs-input {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 300;
}

/* date input 년월일 텍스트 숨기기 */
input[type="date"]::-webkit-input-placeholder {
    visibility: hidden !important;
}
input[type="date"]::-webkit-datetime-edit-year-field,
input[type="date"]::-webkit-datetime-edit-month-field,
input[type="date"]::-webkit-datetime-edit-day-field {
    color: transparent;
}
input[type="date"]::-webkit-datetime-edit-text {
    display: none;
}
input[type="date"]:focus::-webkit-datetime-edit-year-field,
input[type="date"]:focus::-webkit-datetime-edit-month-field,
input[type="date"]:focus::-webkit-datetime-edit-day-field {
    color: #042848;
}

                .cs-input-small {
                    width: 80px;
                    padding: 8px 10px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 13px;
                }

                .cs-refund-section {
                    display: none;
                    background: #e7f3ff;
                    padding: 12px;
                    border-radius: 6px;
                    margin-top: 12px;
                }

                .cs-refund-section.show {
                    display: block;
                }

                .cs-refund-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 12px;
                    align-items: end;
                }

                .cs-refund-notice {
                    grid-column: 1 / -1;
                    font-size: 11px;
                    color: #6c757d;
                    font-weight: 300;
                    background: #ffffff;
                    padding: 8px;
                    border-radius: 4px;
                    margin-bottom: 8px;
                }

                .cs-refund-result {
                    padding: 8px;
                    background: #ffffff;
                    border-radius: 4px;
                    font-size: 13px;
                    font-weight: 400;
                    color: #042848;
                    text-align: center;
                    min-height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .cs-resend-options {
                    display: none;
                    background: #f0f8ff;
                    padding: 12px;
                    border-radius: 6px;
                    margin-top: 12px;
                }
                
                .cs-resend-grid {
                    display: grid;
                    grid-template-columns: 3fr 80px 3fr;
                    gap: 12px;
                    align-items: start;
                }

                .cs-resend-options.show {
                    display: block;
                }

                .cs-modal-footer {
                    padding: 16px 20px;
                    border-top: 1px solid #dee2e6;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    background: #f8f9fa;
                }

                .cs-btn {
                    padding: 8px 20px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 400;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .cs-btn-cancel {
                    background: #ffffff;
                    color: #042848;
                    border: 1px solid #dee2e6;
                }

                .cs-btn-cancel:hover {
                    background: #f8f9fa;
                }

                .cs-btn-submit {
                    background: #2563eb;
                    color: #ffffff;
                }

                .cs-btn-submit:hover {
                    background: #1d4ed8;
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
                            <button class="btn-action" onclick="OrderSearchHandler.openCsModal()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                                </svg>
                                CS접수
                            </button>
                            <button class="btn-action" onclick="OrderSearchHandler.openAdditionalOrderModal()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="16"></line>
                                    <line x1="8" y1="12" x2="16" y2="12"></line>
                                </svg>
                                추가주문접수
                            </button>
                            <button class="btn-action" onclick="OrderSearchHandler.openMarketingModal()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                마케팅고객등록
                            </button>
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

            <!-- CS 모달 -->
            <div class="cs-modal-overlay" id="csModalOverlay">
                <div class="cs-modal">
                    <div class="cs-modal-header">
                        <h3 class="cs-modal-title">CS 접수</h3>
                        <button class="cs-modal-close" onclick="OrderSearchHandler.closeCsModal()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="cs-modal-body">
                        <div class="cs-order-info" id="csOrderInfo">
                            <!-- 주문 정보가 여기 표시됩니다 -->
                        </div>
                        
                        <div class="cs-form-row">
                            <div class="cs-form-group">
                                <label class="cs-form-label">CS 내용</label>
                                <textarea class="cs-textarea" id="csCustomerRequest" placeholder="CS 내용을 입력하세요"></textarea>
                            </div>
                            
                            <div class="cs-form-group">
                                <label class="cs-form-label">해결방법</label>
                                <select class="cs-select" id="csSolution" onchange="OrderSearchHandler.onSolutionChange()">
                                    <option value="">선택하세요</option>
                                    <option value="site-refund">사이트환불</option>
                                    <option value="partial-refund">부분환불</option>
                                    <option value="resend">재발송</option>
                                    <option value="partial-resend">부분재발송</option>
                                    <option value="return">반품</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="cs-refund-section" id="csRefundSection">
                            <div class="cs-refund-notice">
                                ※ 결제금액은 결제내역을 확인할 수 있는 캡쳐사진으로 확인해야 합니다
                            </div>
                            <div class="cs-refund-grid">
                                <div class="cs-form-group" style="margin-bottom: 0;">
                                    <label class="cs-form-label">결제금액</label>
                                    <input type="number" class="cs-input" id="csPaymentAmount" placeholder="0" onchange="OrderSearchHandler.calculateRefund()">
                                </div>
                                <div class="cs-form-group" style="margin-bottom: 0;">
                                    <label class="cs-form-label">환불 비율(%)</label>
                                    <input type="number" class="cs-input" id="csRefundPercent" min="0" max="100" placeholder="0" onchange="OrderSearchHandler.calculateRefund()">
                                </div>
                                <div class="cs-form-group" style="margin-bottom: 0;">
                                    <label class="cs-form-label">환불금액</label>
                                    <div class="cs-refund-result" id="csRefundAmount">0원</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="cs-resend-options" id="csResendOptions">
    <div class="cs-resend-grid">
        <div class="cs-form-group" style="margin-bottom: 0;">
            <label class="cs-form-label">재발송 상품</label>
            <input type="text" class="cs-input" id="csResendOption" placeholder="옵션명">
        </div>
        <div class="cs-form-group" style="margin-bottom: 0;">
            <label class="cs-form-label">수량</label>
            <input type="number" class="cs-input-small" id="csResendQty" min="1" value="1" placeholder="1">
        </div>
        <div class="cs-form-group" style="margin-bottom: 0;">
            <label class="cs-form-label">특이/요청사항</label>
            <input type="text" class="cs-input" id="csResendNote" value="CS재발송, 싱싱하고 맛있는 것">
        </div>
    </div>
    
    <div style="margin-top: 12px;">
        <div class="cs-form-group">
            <label class="cs-form-label">발송요청일</label>
            <input type="date" class="cs-input" id="csRequestDate" value="">
        </div>
    </div>
                            
                            <div class="cs-delivery-info" style="margin-top: 12px;">
        <div class="cs-form-group">
        <label class="cs-form-label">수령인</label>
        <input type="text" class="cs-input" id="csResendReceiver" placeholder="수령인">
    </div>
    <div class="cs-form-group">
        <label class="cs-form-label">수령인 전화번호</label>
        <input type="text" class="cs-input" id="csResendPhone" placeholder="수령인 전화번호">
    </div>
    <div class="cs-form-group">
        <label class="cs-form-label">주소</label>
        <input type="text" class="cs-input" id="csResendAddress" placeholder="배송 주소">
    </div>
</div>
                        </div>
                    </div>
                    <div class="cs-modal-footer">
                        <button class="cs-btn cs-btn-cancel" onclick="OrderSearchHandler.closeCsModal()">취소</button>
                        <button class="cs-btn cs-btn-submit" onclick="OrderSearchHandler.submitCs()">접수</button>
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
            let response;
            
            if (this.dateType === 'sheet') {
                // 주문통합일 모드 - 날짜별 시트 읽기
                const startDate = document.getElementById('searchStartDate').value.replace(/-/g, '');
                const endDate = document.getElementById('searchEndDate').value.replace(/-/g, '');
                
                response = await fetch('/api/sheets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getOrdersByDateRange',
                        startDate: startDate,
                        endDate: endDate
                    })
                });
            } else {
                // 결제일 모드 - 전체 데이터
                response = await fetch('/api/sheets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getMarketData',
                        useMainSpreadsheet: true
                    })
                });
            }

            const result = await response.json();
            
            if (result.success) {
                // getOrdersByDateRange는 orders 필드로 반환
                this.currentOrders = result.orders || result.data || [];
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
    },

    // CS 모달 관련 함수들
    openCsModal() {
        const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
        if (checkedBoxes.length === 0) {
            this.showMessage('CS 접수할 주문을 선택하세요.', 'error');
            return;
        }
        if (checkedBoxes.length > 1) {
            this.showMessage('CS 접수는 한 번에 하나의 주문만 처리할 수 있습니다.', 'error');
            return;
        }

        const index = checkedBoxes[0].dataset.index;
        const order = this.getFilteredOrders()[index];
        
        if (!order) {
            this.showMessage('주문 정보를 찾을 수 없습니다.', 'error');
            return;
        }

        this.currentCsOrder = order;
        this.displayCsOrderInfo(order);
        
        const modal = document.getElementById('csModalOverlay');
        if (modal) modal.classList.add('show');
    },

displayCsOrderInfo(order) {
        const infoDiv = document.getElementById('csOrderInfo');
        if (!infoDiv) return;

        const marketColor = this.marketColors[order['마켓명']] || 'rgb(128,128,128)';
        
        // 전화번호 필드 확인 - 다양한 필드명 처리
        const orderPhone = order['주문자전화번호'] || order['주문자연락처'] || order['주문자 전화번호'] || '';
        const receiverPhone = order['수령인전화번호'] || order['수취인전화번호'] || 
                              order['수령인연락처'] || order['수취인연락처'] || 
                              order['수령인 전화번호'] || order['수취인 전화번호'] || '';
        
        infoDiv.innerHTML = `
            <div style="margin-bottom: 16px;">
                <span style="display: inline-block; padding: 4px 8px; background: ${marketColor}; 
                     color: ${this.getTextColor(marketColor)}; border-radius: 4px; font-size: 12px; font-weight: 600;">
                    ${order['마켓명'] || ''}
                </span>
            </div>
            <div class="cs-info-grid">
                <div class="cs-info-item">
                    <span class="cs-info-label">결제일: <span style="color: #042848; font-weight: 400;">${order['결제일'] || ''}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">주문번호: <span style="color: #042848; font-weight: 400;">${order['주문번호'] || ''}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">주문자: <span style="color: #042848; font-weight: 400;">${order['주문자'] || ''}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">주문자 전화번호: <span style="color: #042848; font-weight: 400;">${orderPhone}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">수령인: <span style="color: #042848; font-weight: 400;">${order['수령인'] || order['수취인'] || ''}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">수령인 전화번호: <span style="color: #042848; font-weight: 400;">${receiverPhone}</span></span>
                </div>
                <div class="cs-info-item" style="grid-column: 1 / -1;">
                    <span class="cs-info-label">주소: <span style="color: #042848; font-weight: 400;">${order['주소'] || order['수령인주소'] || order['수취인주소'] || ''}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">옵션명: <span style="color: #042848; font-weight: 400;">${order['옵션명'] || ''}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">수량: <span style="color: #042848; font-weight: 400;">${order['수량'] || ''}</span></span>
                </div>
                <div class="cs-info-item">
                    <span class="cs-info-label">상품금액: <span style="color: #042848; font-weight: 400;">${this.formatNumber(order['상품금액'] || 0)}</span></span>
                </div>
            </div>
        `;
    },

    closeCsModal() {
        const modal = document.getElementById('csModalOverlay');
        if (modal) modal.classList.remove('show');
        
        // 폼 초기화
        document.getElementById('csCustomerRequest').value = '';
        document.getElementById('csSolution').value = '';
        document.getElementById('csRefundPercent').value = '';
        document.getElementById('csResendOption').value = '';
        document.getElementById('csResendQty').value = '';
        document.getElementById('csResendNote').value = '';
        
        // 추가 옵션 숨기기
        document.getElementById('csRefundSection').classList.remove('show');
        document.getElementById('csResendOptions').classList.remove('show');
        document.getElementById('csPaymentAmount').value = '';
        document.getElementById('csRefundAmount').textContent = '0원';
    },

onSolutionChange() {
        const solution = document.getElementById('csSolution').value;
        const refundSection = document.getElementById('csRefundSection');
        const resendDiv = document.getElementById('csResendOptions');
        
        // 모든 추가 옵션 숨기기
        refundSection.classList.remove('show');
        resendDiv.classList.remove('show');
        
        // 선택에 따라 표시
        if (solution === 'partial-refund') {
            refundSection.classList.add('show');
        } else if (solution === 'resend' || solution === 'partial-resend') {
            resendDiv.classList.add('show');
            // 기본값 설정
            if (this.currentCsOrder) {
                document.getElementById('csResendOption').value = this.currentCsOrder['옵션명'] || '';
                document.getElementById('csResendReceiver').value = this.currentCsOrder['수령인'] || this.currentCsOrder['수취인'] || '';
                
                // 전화번호 필드 - 다양한 필드명 체크
                const phoneValue = this.currentCsOrder['수령인전화번호'] || 
                                  this.currentCsOrder['수취인전화번호'] || 
                                  this.currentCsOrder['수령인연락처'] || 
                                  this.currentCsOrder['수취인연락처'] ||
                                  this.currentCsOrder['수령인 전화번호'] ||
                                  this.currentCsOrder['수취인 전화번호'] || '';
                                  
                document.getElementById('csResendPhone').value = phoneValue;
                
                // 주소 필드
                const addressValue = this.currentCsOrder['주소'] || 
                                    this.currentCsOrder['수령인주소'] || 
                                    this.currentCsOrder['수취인주소'] ||
                                    this.currentCsOrder['배송지주소'] || '';
                                    
                document.getElementById('csResendAddress').value = addressValue;
                
                // 디버깅용 로그
                console.log('재발송 기본값 설정:', {
                    옵션명: document.getElementById('csResendOption').value,
                    수령인: document.getElementById('csResendReceiver').value,
                    전화번호: phoneValue,
                    주소: addressValue,
                    원본데이터: this.currentCsOrder
                });
            }
        }
    },

    calculateRefund() {
        const paymentAmount = parseFloat(document.getElementById('csPaymentAmount').value) || 0;
        const refundPercent = parseFloat(document.getElementById('csRefundPercent').value) || 0;
        const refundAmount = Math.round(paymentAmount * (refundPercent / 100));
        
        document.getElementById('csRefundAmount').textContent = this.formatNumber(refundAmount) + '원';
    },

    async submitCs() {
        const customerRequest = document.getElementById('csCustomerRequest').value;
        const solution = document.getElementById('csSolution').value;
        
        if (!customerRequest || !solution) {
            this.showMessage('필수 항목을 모두 입력하세요.', 'error');
            return;
        }

        this.showLoading();

        try {
            // CS 데이터 준비
            const csData = {
                마켓명: this.currentCsOrder['마켓명'],
                접수일: new Date().toLocaleDateString('ko-KR'),
                해결방법: this.getSolutionText(solution),
                결제일: this.currentCsOrder['결제일'],
                주문번호: this.currentCsOrder['주문번호'],
                주문자: this.currentCsOrder['주문자'],
                '주문자 전화번호': this.currentCsOrder['주문자전화번호'] || this.currentCsOrder['주문자연락처'] || '',
                수령인: this.currentCsOrder['수령인'] || this.currentCsOrder['수취인'],
                '수령인 전화번호': this.currentCsOrder['수령인전화번호'] || this.currentCsOrder['수취인전화번호'] || '',
                주소: this.currentCsOrder['주소'] || this.currentCsOrder['수령인주소'] || this.currentCsOrder['수취인주소'],
                배송메세지: this.currentCsOrder['배송메세지'] || this.currentCsOrder['배송메시지'] || '',
                옵션명: this.currentCsOrder['옵션명'],
                수량: this.currentCsOrder['수량'],
                재발송상품: '',
                재발송수량: '',
                부분환불금액: ''
            };

            // 해결방법별 추가 데이터
            if (solution === 'partial-refund') {
                const refundAmount = Math.round(
                    (parseFloat(document.getElementById('csPaymentAmount').value) || 0) * 
                    (parseFloat(document.getElementById('csRefundPercent').value) || 0) / 100
                );
                csData.부분환불금액 = refundAmount;
            } else if (solution === 'resend' || solution === 'partial-resend') {
                csData.재발송상품 = document.getElementById('csResendOption').value;
                csData.재발송수량 = document.getElementById('csResendQty').value;
                csData.수령인 = document.getElementById('csResendReceiver').value;
                csData['수령인 전화번호'] = document.getElementById('csResendPhone').value;
                csData.주소 = document.getElementById('csResendAddress').value;
            }

            // 1. CS기록 시트에 저장
            const csResponse = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'saveCsRecord',
                    data: csData
                })
            });

            const csResult = await csResponse.json();
            if (!csResult.success) {
                throw new Error('CS 기록 저장 실패');
            }


            // 2. 재발송/부분재발송인 경우 주문 접수
            if (solution === 'resend' || solution === 'partial-resend') {
// 주문 데이터 준비
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const paymentDateTime = `${year}/${month}/${day} ${hours}:${minutes}`;

// 로그인 사용자 이메일 가져오기
const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '';
console.log('CS 주문 사용자 이메일:', userEmail);

const orderData = {
    userEmail: userEmail,  // 로그인한 사용자 이메일
    마켓명: 'CS발송',
    결제일: paymentDateTime,  // YYYY/MM/DD HH:MM 형식
    주문자: this.currentCsOrder['주문자'],
    '주문자 전화번호': this.currentCsOrder['주문자 전화번호'] || this.currentCsOrder['주문자전화번호'] || '',
    수령인: document.getElementById('csResendReceiver').value,
    '수령인 전화번호': document.getElementById('csResendPhone').value,
    주소: document.getElementById('csResendAddress').value,
    배송메세지: this.currentCsOrder['배송메세지'] || this.currentCsOrder['배송메시지'] || '',
    옵션명: document.getElementById('csResendOption').value,
    수량: document.getElementById('csResendQty').value,
    '특이/요청사항': document.getElementById('csResendNote').value,
    '발송요청일': document.getElementById('csRequestDate').value
};

                // CS 주문 추가 (시트명은 서버에서 자동으로 오늘 날짜로 설정)
                console.log('CS 주문 요청 데이터:', {
    action: 'addCsOrder',
    data: orderData
});

const orderResponse = await fetch('/api/sheets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        action: 'addCsOrder',
        data: orderData
    })
});

let orderResult;
try {
    const responseText = await orderResponse.text();
    console.log('서버 응답 원본:', responseText);
    orderResult = JSON.parse(responseText);
} catch (parseError) {
    console.error('응답 파싱 실패:', parseError);
    throw new Error('서버 응답 처리 실패');
}

if (!orderResult.success) {
    console.error('CS 주문 접수 실패 상세:', orderResult);
    throw new Error(orderResult.error || '주문 접수 실패');
}

                this.showMessage('CS 접수 및 재발송 주문이 완료되었습니다.', 'success');
            } else {
                this.showMessage('CS 접수가 완료되었습니다.', 'success');
            }

            this.closeCsModal();
            
        } catch (error) {
            console.error('CS 접수 오류:', error);
            this.showMessage('CS 접수 중 오류가 발생했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    },

    getSolutionText(value) {
        const solutionMap = {
            'site-refund': '사이트환불',
            'partial-refund': '부분환불',
            'resend': '재발송',
            'partial-resend': '부분재발송',
            'return': '반품'
        };
        return solutionMap[value] || value;
    },
    // 추가주문접수 모달 (추후 구현)
    openAdditionalOrderModal() {
        this.showMessage('추가주문접수 기능은 준비 중입니다.', 'info');
    },

    // 마케팅고객등록 모달 (추후 구현)
    openMarketingModal() {
        this.showMessage('마케팅고객등록 기능은 준비 중입니다.', 'info');
    },
    // fullReset 추가
fullReset() {
    // 모든 데이터 초기화
    this.manualOrders = [];
    this.tempAddressData = {};
    this.productData = {};
    
    // 캐시 삭제
    this.clearCache();
    
    // DOM 완전 재렌더링
    const container = document.getElementById('om-panel-input');
    if (container) {
        container.innerHTML = '';
        this.render();
        this.setupEventListeners();
        this.loadProductData();
    }
    
    console.log('OrderInputHandler 완전 초기화 완료');
}
};