window.OrderSearchHandler = {
    currentOrders: [],
    
    async init() {
        this.render();
        await this.loadOrders();
    },
    
    render() {
        const container = document.getElementById('om-panel-search');
        container.innerHTML = `
            <style>
                /* 발송관리 테이블 스타일 그대로 사용 */
                .search-container {
                    padding: 20px;
                    background: #fafafa;
                    min-height: calc(100vh - 200px);
                }

                /* 테이블 섹션 */
                .table-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 16px;
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

                .table-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: #212529;
                }

                .table-actions {
                    display: flex;
                    gap: 8px;
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
                    border-color: #adb5bd;
                }

                .table-wrapper {
                    overflow-x: auto;
                    height: calc(100vh - 350px);
                    min-height: 400px;
                    max-height: 700px;
                    overflow-y: auto;
                    position: relative;
                }
                
                .search-table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }

                .search-table thead {
                    position: sticky;
                    top: 0;
                    background: #f8f9fa;
                    z-index: 10;
                }

                .search-table th {
                    padding: 12px 8px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 400;
                    color: #6c757d;
                    border-bottom: 2px solid #dee2e6;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .search-table td {
                    padding: 6px 8px;
                    font-size: 12px;
                    font-weight: 300;
                    color: #212529;
                    border-bottom: 1px solid #f1f3f5;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    height: 32px;
                    line-height: 20px;
                }

                /* 호버 효과 */
                .search-table tbody tr:hover td {
                    background-color: #b7f7bd !important;
                }

                /* 선택된 행 스타일 */
                .search-table tbody tr.selected-row td {
                    color: #2563eb !important;
                    font-size: 14px !important;
                    background-color: #e7f3ff !important;
                }

                .search-table tbody tr.selected-row:hover td {
                    background-color: #dbeafe !important;
                }

                .checkbox-cell {
                    width: 50px;
                }

                .checkbox-cell input[type="checkbox"] {
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                }

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
            </style>

            <div class="search-container">
                <!-- 테이블 섹션 -->
                <div class="table-section">
                    <div class="table-header">
                        <div style="display: flex; align-items: center; flex: 1;">
                            <h3 class="table-title">주문 목록</h3>
                            <div style="margin-left: 100px; display: flex; align-items: center; gap: 8px;">
                                <select id="searchFilter" class="filter-select" style="width: 150px;">
                                    <option value="">전체</option>
                                    <option value="today">오늘</option>
                                    <option value="week">이번주</option>
                                    <option value="month">이번달</option>
                                </select>
                                <button class="btn-action" onclick="OrderSearchHandler.applyFilter()">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polygon points="22 3 2 10 9 13 12 20 22 3"></polygon>
                                    </svg>
                                    적용
                                </button>
                            </div>
                        </div>
                        <div class="table-actions">
                            <button class="btn-action" onclick="OrderSearchHandler.refreshData()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="23 4 23 10 17 10"></polyline>
                                    <polyline points="1 20 1 14 7 14"></polyline>
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                </svg>
                                새로고침
                            </button>
                            <button class="btn-action" onclick="OrderSearchHandler.exportExcel()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                엑셀 다운로드
                            </button>
                        </div>
                    </div>
                    
                    <div class="table-wrapper">
                        <table class="search-table" id="searchTable">
                            <thead id="searchTableHead">
                                <!-- 동적 생성 -->
                            </thead>
                            <tbody id="searchTableBody">
                                <!-- 동적 생성 -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    async loadOrders() {
        // 임시 데이터로 테이블 구조 표시
        this.currentOrders = [];
        this.updateTable();
    },

    updateTable() {
        const thead = document.getElementById('searchTableHead');
        const tbody = document.getElementById('searchTableBody');
        
        // 발송관리와 동일한 컬럼 너비 설정
        const columnWidths = {
            '연번': 40,
            '마켓명': 100,
            '결제일': 140,
            '주문번호': 140,
            '주문자': 70,
            '수령인': 70,
            '전화번호': 120,
            '주소': 500,
            '배송메시지': 150,
            '옵션명': 160,
            '수량': 50,
            '금액': 90,
            '상태': 80
        };
        
        // 샘플 헤더
        const headers = ['연번', '마켓명', '결제일', '주문번호', '주문자', '수령인', '전화번호', '주소', '옵션명', '수량', '금액', '상태'];
        
        // 테이블 전체 너비 계산
        let totalWidth = 50; // 체크박스 너비
        headers.forEach(header => {
            const width = columnWidths[header] || 100;
            totalWidth += width;
        });

        const table = document.getElementById('searchTable');
        if (table) {
            table.style.minWidth = `${totalWidth}px`;
        }
        
        // 헤더 생성
        thead.innerHTML = `
            <tr>
                <th class="checkbox-cell" style="width: 50px; text-align: center; padding: 8px;">
                    <input type="checkbox" onchange="OrderSearchHandler.toggleSelectAll(this)">
                </th>
                ${headers.map(header => {
                    const width = columnWidths[header] || 100;
                    return `<th style="width: ${width}px; min-width: ${width}px; text-align: center;">${header}</th>`;
                }).join('')}
            </tr>
        `;
        
        // 데이터가 없을 때 메시지 표시
        if (this.currentOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 40px; color: #6c757d;">데이터를 조회하려면 필터를 선택하세요.</td></tr>';
        }
    },

    selectRow(rowIndex) {
        const rows = document.querySelectorAll('#searchTableBody tr');
        rows.forEach(row => row.classList.remove('selected-row'));
        if (rows[rowIndex]) {
            rows[rowIndex].classList.add('selected-row');
        }
    },

    toggleSelectAll(checkbox) {
        const checkboxes = document.querySelectorAll('#searchTableBody input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = checkbox.checked);
    },

    applyFilter() {
        console.log('필터 적용');
    },

    refreshData() {
        console.log('데이터 새로고침');
        this.loadOrders();
    },

    exportExcel() {
        console.log('엑셀 다운로드');
    }
};