window.OrderCsHandler = {
    csRecords: [],
    filteredRecords: [],
    currentPage: 1,
    recordsPerPage: 20,
    
    async init() {
        this.render();
        await this.loadCsRecords();
    },




    setDefaultDateRange() {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        // 날짜 포맷 (YYYY-MM-DD)
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        document.getElementById('searchStartDate').value = formatDate(sevenDaysAgo);
        document.getElementById('searchEndDate').value = formatDate(today);
    },





    
    render() {
        const container = document.getElementById('om-panel-cs');
        if (!container) return;
        
        container.innerHTML = `
            <style>
                .cs-container {
                    padding: 20px;
                    background: #fafafa;
                    min-height: calc(100vh - 200px);
                }
                
                /* 검색 섹션 */
                .cs-search-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 24px;
                }
                
                .search-header {
                    font-size: 16px;
                    font-weight: 500;
                    color: #212529;
                    margin-bottom: 16px;
                }
                
                .search-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }
                
                .search-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .search-label {
                    font-size: 12px;
                    font-weight: 300;
                    color: #6c757d;
                }
                
                .search-input {
                    padding: 8px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                
                .search-input:focus {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }
                
                .search-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .btn-search {
                    padding: 10px 24px;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-search:hover {
                    background: #1d4ed8;
                }
                
                .btn-reset {
                    padding: 10px 24px;
                    background: #ffffff;
                    color: #495057;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-reset:hover {
                    background: #f8f9fa;
                }
                
                /* 통계 카드 */
                .cs-stats {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }
                
                .stat-card {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 12px;
                    padding: 16px;
                    text-align: center;
                }
                
                .stat-value {
                    font-size: 28px;
                    font-weight: 600;
                    color: #212529;
                    margin-bottom: 4px;
                }
                
                .stat-label {
                    font-size: 12px;
                    font-weight: 300;
                    color: #6c757d;
                }
                
                /* 결과 테이블 */
                .cs-result-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 16px;
                    overflow: hidden;
                }
                
                .result-header {
                    padding: 16px 24px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .result-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: #212529;
                }
                
                .result-count {
                    font-size: 14px;
                    color: #6c757d;
                }
                
                .table-wrapper {
                    overflow-x: auto;
                    max-height: 500px;
                    overflow-y: auto;
                }
                
                .cs-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .cs-table thead {
                    position: sticky;
                    top: 0;
                    background: #f8f9fa;
                    z-index: 10;
                }
                
                .cs-table th {
                    padding: 12px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 400;
                    color: #6c757d;
                    border-bottom: 2px solid #dee2e6;
                    white-space: nowrap;
                }
                
                .cs-table td {
                    padding: 10px 12px;
                    font-size: 13px;
                    color: #212529;
                    border-bottom: 1px solid #f1f3f5;
                }
                
                .cs-table tbody tr:hover {
                    background: #f8f9fa;
                }
                
                .cs-type-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 500;
                }
                
                .type-교환 { background: #dbeafe; color: #1d4ed8; }
                .type-반품 { background: #fee2e2; color: #dc2626; }
                .type-재발송 { background: #fef3c7; color: #d97706; }
                .type-기타 { background: #e5e7eb; color: #4b5563; }
                
                /* 페이지네이션 */
                .pagination {
                    padding: 16px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                    border-top: 1px solid #dee2e6;
                }
                
                .page-btn {
                    padding: 6px 12px;
                    border: 1px solid #dee2e6;
                    background: #ffffff;
                    color: #495057;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                
                .page-btn:hover:not(:disabled) {
                    background: #f8f9fa;
                    border-color: #2563eb;
                    color: #2563eb;
                }
                
                .page-btn.active {
                    background: #2563eb;
                    color: white;
                    border-color: #2563eb;
                }
                
                .page-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6c757d;
                }
                
                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.3;
                }
                
                .detail-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    justify-content: center;
                    align-items: center;
                }
                
                .detail-modal.show {
                    display: flex;
                }
                
                .modal-content {
                    background: white;
                    border-radius: 16px;
                    width: 600px;
                    max-width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .modal-body {
                    padding: 20px;
                }
                
                .detail-row {
                    display: flex;
                    padding: 12px 0;
                    border-bottom: 1px solid #f1f3f5;
                }
                
                .detail-label {
                    width: 120px;
                    font-size: 13px;
                    color: #6c757d;
                }
                
                .detail-value {
                    flex: 1;
                    font-size: 13px;
                    color: #212529;
                }
            </style>
            
            <div class="cs-container">
                <!-- 검색 섹션 -->
                <div class="cs-search-section">
                    <h3 class="search-header">CS 기록 검색</h3>
                    <div class="search-grid">
                        <div class="search-group">
                            <label class="search-label">처리일자</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="date" class="search-input" id="searchStartDate" style="flex: 1;">
                                <span>~</span>
                                <input type="date" class="search-input" id="searchEndDate" style="flex: 1;">
                            </div>
                        </div>
                        
                        <div class="search-group">
                            <label class="search-label">해결방법</label>
                            <select class="search-input" id="searchCsType">
                                <option value="">전체</option>
                                <option value="사이트환불">사이트환불</option>
                                <option value="부분환불">부분환불</option>
                                <option value="재발송">재발송</option>
                                <option value="부분재발송">부분재발송</option>
                                <option value="반품">반품</option>
                            </select>
                        </div>
                        
                        <div class="search-group">
                            <label class="search-label">주문번호</label>
                            <input type="text" class="search-input" id="searchOrderNo" placeholder="주문번호 입력">
                        </div>
                        
                        <div class="search-group">
                            <label class="search-label">이름검색</label>
                            <input type="text" class="search-input" id="searchName" placeholder="주문자/수령인명 입력">
                        </div>
                        
                        <div class="search-group">
                            <label class="search-label">처리상태</label>
                            <select class="search-input" id="searchStatus">
                                <option value="">전체</option>
                                <option value="접수">접수</option>
                                <option value="완료">완료</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="search-actions">
                        <button class="btn-reset" onclick="OrderCsHandler.resetSearch()">초기화</button>
                        <button class="btn-search" onclick="OrderCsHandler.search()">검색</button>
                    </div>
                </div>
                
                <!-- 통계 카드 -->
                <div class="cs-stats">
                    <div class="stat-card">
                        <div class="stat-value" id="statTotal">0</div>
                        <div class="stat-label">전체 CS</div>
                    </div>
                    <div class="stat-card" style="border-color: #dbeafe;">
                        <div class="stat-value" id="statExchange" style="color: #1d4ed8;">0</div>
                        <div class="stat-label">교환</div>
                    </div>
                    <div class="stat-card" style="border-color: #fee2e2;">
                        <div class="stat-value" id="statReturn" style="color: #dc2626;">0</div>
                        <div class="stat-label">반품</div>
                    </div>
                    <div class="stat-card" style="border-color: #fef3c7;">
                        <div class="stat-value" id="statResend" style="color: #d97706;">0</div>
                        <div class="stat-label">재발송</div>
                    </div>
                </div>
                
                <!-- 결과 테이블 -->
                <div class="cs-result-section">
                    <div class="result-header">
                        <h3 class="result-title">CS 처리 내역</h3>
                        <span class="result-count">검색결과: <strong id="resultCount">0</strong>건</span>
                    </div>
                    
                    <div class="table-wrapper">
                        <table class="cs-table">
                            <thead>
                                <tr>
                                    <th>접수일</th>
                                    <th>해결방법</th>
                                    <th>주문번호</th>
                                    <th>마켓명</th>
                                    <th>주문자</th>
                                    <th>수령인</th>
                                    <th>옵션명</th>
                                    <th>CS 내용</th>
                                    <th>처리상태</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody id="csTableBody">
                                <!-- 동적 생성 -->
                            </tbody>
                        </table>
                        
                        <div id="emptyState" class="empty-state" style="display: none;">
                            <div class="empty-icon">📋</div>
                            <div>검색 결과가 없습니다</div>
                        </div>
                    </div>
                    
                    <div class="pagination" id="pagination">
                        <!-- 동적 생성 -->
                    </div>
                </div>
            </div>
            
            <!-- 상세 모달 -->
            <div id="csDetailModal" class="detail-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 style="margin: 0; font-size: 18px;">CS 상세 정보</h3>
                        <button onclick="OrderCsHandler.closeDetail()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                    </div>
                    <div class="modal-body" id="modalBody">
                        <!-- 동적 생성 -->
                    </div>
                </div>
            </div>
        `;
    },
    
    async loadCsRecords() {
        try {
            // 로딩 표시
            const tbody = document.getElementById('csTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">데이터를 불러오는 중...</td></tr>';
            }
            
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getCsRecords'
                })
            });
            
            const result = await response.json();
            console.log('CS 기록 로드 결과:', result);
            
            if (result.success && result.data) {
                this.csRecords = result.data;
                this.filteredRecords = [...this.csRecords];
                this.updateStats();
                this.displayRecords();
            } else {
                this.csRecords = [];
                this.filteredRecords = [];
                this.displayRecords();
            }
        } catch (error) {
            console.error('CS 기록 로드 실패:', error);
            const tbody = document.getElementById('csTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: red;">데이터 로드 실패</td></tr>';
            }
        }
    },
    
    search() {
        const startDate = document.getElementById('searchStartDate').value;
        const endDate = document.getElementById('searchEndDate').value;
        const csType = document.getElementById('searchCsType').value;
        const orderNo = document.getElementById('searchOrderNo').value.toLowerCase();
        const searchName = document.getElementById('searchName').value.toLowerCase();
        const status = document.getElementById('searchStatus').value;
        
        this.filteredRecords = this.csRecords.filter(record => {
            // 날짜 필터
            if (startDate && record.접수일) {
                const recordDate = new Date(record.접수일).toISOString().split('T')[0];
                if (recordDate < startDate) return false;
            }
            if (endDate && record.접수일) {
                const recordDate = new Date(record.접수일).toISOString().split('T')[0];
                if (recordDate > endDate) return false;
            }
            
            // 해결방법 필터
            if (csType && record.해결방법 !== csType) return false;
            
            // 주문번호 필터
            if (orderNo && !String(record.주문번호 || '').toLowerCase().includes(orderNo)) return false;
            
            // 이름 필터 (주문자 또는 수령인)
            if (searchName) {
                const hasOrderer = String(record.주문자 || '').toLowerCase().includes(searchName);
                const hasReceiver = String(record.수령인 || '').toLowerCase().includes(searchName);
                if (!hasOrderer && !hasReceiver) return false;
            }
            
            // 상태 필터
            if (status && record.처리상태 !== status) return false;
            
            return true;
        });
        
        this.currentPage = 1;
        this.displayRecords();
        this.updateResultCount();
    },테
    
    resetSearch() {
        document.getElementById('searchStartDate').value = '';
        document.getElementById('searchEndDate').value = '';
        document.getElementById('searchCsType').value = '';
        document.getElementById('searchOrderNo').value = '';
        document.getElementById('searchReceiver').value = '';
        document.getElementById('searchStatus').value = '';
        
        this.filteredRecords = [...this.csRecords];
        this.currentPage = 1;
        this.displayRecords();
        this.updateResultCount();
    },
    
    displayRecords() {
        const tbody = document.getElementById('csTableBody');
        const emptyState = document.getElementById('emptyState');
        
        if (this.filteredRecords.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            this.renderPagination();
            return;
        }
        
        emptyState.style.display = 'none';
        
        const start = (this.currentPage - 1) * this.recordsPerPage;
        const end = start + this.recordsPerPage;
        const pageRecords = this.filteredRecords.slice(start, end);
        
        tbody.innerHTML = pageRecords.map((record, index) => {
            const globalIndex = this.csRecords.indexOf(record);
            const isCompleted = record.처리상태 === '완료';
            
            return `
            <tr style="cursor: pointer;">
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.접수일 || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.해결방법 || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.주문번호 || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.마켓명 || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.주문자 || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.수령인 || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.옵션명 || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record['CS 내용'] || '-'}</td>
                <td onclick="OrderCsHandler.showDetail(${globalIndex})">${record.처리상태 || '접수'}</td>
                <td>
                    <button 
                        onclick="OrderCsHandler.completeCs(${globalIndex}, event)" 
                        style="padding: 4px 12px; background: ${isCompleted ? '#6c757d' : '#10b981'}; 
                               color: white; border: none; border-radius: 4px; font-size: 12px; 
                               cursor: ${isCompleted ? 'not-allowed' : 'pointer'}; opacity: ${isCompleted ? '0.5' : '1'};"
                        ${isCompleted ? 'disabled' : ''}>
                        ${isCompleted ? '완료됨' : '완료'}
                    </button>
                </td>
            </tr>
        `}).join('');
        
        this.renderPagination();
        this.updateResultCount();
    },
    
    renderPagination() {
        const totalPages = Math.ceil(this.filteredRecords.length / this.recordsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // 이전 버튼
        html += `<button class="page-btn" onclick="OrderCsHandler.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>이전</button>`;
        
        // 페이지 번호
        for (let i = 1; i <= Math.min(totalPages, 10); i++) {
            html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="OrderCsHandler.goToPage(${i})">${i}</button>`;
        }
        
        // 다음 버튼
        html += `<button class="page-btn" onclick="OrderCsHandler.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>다음</button>`;
        
        pagination.innerHTML = html;
    },
    
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredRecords.length / this.recordsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.displayRecords();
    },
    
    updateStats() {
        const stats = {
            total: this.csRecords.length,
            exchange: this.csRecords.filter(r => r.CS구분 === '교환').length,
            return: this.csRecords.filter(r => r.CS구분 === '반품').length,
            resend: this.csRecords.filter(r => r.CS구분 === '재발송').length
        };
        
        document.getElementById('statTotal').textContent = stats.total;
        document.getElementById('statExchange').textContent = stats.exchange;
        document.getElementById('statReturn').textContent = stats.return;
        document.getElementById('statResend').textContent = stats.resend;
    },
    
    updateResultCount() {
        document.getElementById('resultCount').textContent = this.filteredRecords.length;
    },
    
    showDetail(index) {
        const record = this.csRecords[index];
        if (!record) return;
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">처리일시</div>
                <div class="detail-value">${record.처리일시 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">CS구분</div>
                <div class="detail-value"><span class="cs-type-badge type-${record.CS구분}">${record.CS구분}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">주문번호</div>
                <div class="detail-value">${record.주문번호 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">마켓명</div>
                <div class="detail-value">${record.마켓명 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">수령인</div>
                <div class="detail-value">${record.수령인 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">전화번호</div>
                <div class="detail-value">${record.전화번호 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">주소</div>
                <div class="detail-value">${record.주소 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">옵션명</div>
                <div class="detail-value">${record.옵션명 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">수량</div>
                <div class="detail-value">${record.수량 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">CS사유</div>
                <div class="detail-value">${record.CS사유 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">처리내용</div>
                <div class="detail-value">${record.처리내용 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">처리상태</div>
                <div class="detail-value">${record.처리상태 || '접수'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">담당자</div>
                <div class="detail-value">${record.담당자 || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">메모</div>
                <div class="detail-value">${record.메모 || '-'}</div>
            </div>
        `;
        
        document.getElementById('csDetailModal').classList.add('show');
    },


    async completeCs(index, event) {
        // 이벤트 버블링 방지
        event.stopPropagation();
        
        const record = this.csRecords[index];
        if (!record || record.처리상태 === '완료') return;
        
        if (!confirm('이 CS 건을 완료 처리하시겠습니까?')) return;
        
        try {
            // CS기록 시트 업데이트
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateCsStatus',
                    orderNumber: record.주문번호,
                    status: '완료'
                })
            });
            
            const result = await response.json();
            if (result.success) {
                // 로컬 데이터 업데이트
                record.처리상태 = '완료';
                this.displayRecords();
                alert('완료 처리되었습니다.');
            } else {
                alert('처리 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('CS 완료 처리 실패:', error);
            alert('처리 중 오류가 발생했습니다.');
        }
    },

    
    
    closeDetail() {
        document.getElementById('csDetailModal').classList.remove('show');
    },
    
    fullReset() {
        this.csRecords = [];
        this.filteredRecords = [];
        this.currentPage = 1;
        
        const container = document.getElementById('om-panel-cs');
        if (container) {
            container.innerHTML = '';
            this.render();
            this.loadCsRecords();
        }
        
        console.log('OrderCsHandler 완전 초기화 완료');
    }
};