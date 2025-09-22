// order-excel-handler.js
window.OrderExcelHandler = {
    uploadedFiles: [],
    processedData: null,
    mappingData: null,
    ProductMatching: null,
    API_BASE: '',
    batchEditData: {},
    
    async init() {
        console.log('OrderExcelHandler 초기화 시작');
        this.setupParentReferences();
        await this.loadMappingData();
        this.render();
        this.setupEventListeners();
        console.log('OrderExcelHandler 초기화 완료');
    },
    
    setupParentReferences() {
        // iframe 환경 체크 및 부모 참조 설정
        if (parent.window !== window) {
            this.mappingData = parent.window.mappingData;
            this.ProductMatching = parent.window.ProductMatching;
            this.API_BASE = parent.window.API_BASE || '';
            window.showCenterMessage = parent.window.showCenterMessage || this.showMessage.bind(this);
        } else {
            this.mappingData = window.mappingData;
            this.ProductMatching = window.ProductMatching;
            this.API_BASE = window.API_BASE || '';
        }
    },
    
    async loadMappingData() {
        if (!this.mappingData) {
            try {
                const response = await fetch(`${this.API_BASE}/api/mapping`);
                const data = await response.json();
                if (!data.error) {
                    this.mappingData = data;
                    window.mappingData = data;
                }
            } catch (error) {
                console.error('매핑 데이터 로드 실패:', error);
            }
        }
    },
    
    render() {
    const container = document.getElementById('om-panel-excel');
    if (!container) return;
    
    // 헤더에 새로고침 버튼 추가
    const headerElement = document.querySelector('.order-manage-header h2');
    if (headerElement && !document.getElementById('excelRefreshBtn')) {
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'excelRefreshBtn';
        refreshBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
        `;
        refreshBtn.style.cssText = `
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 34px;
            height: 34px;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            background: #ffffff;
            color: #495057;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        `;
        refreshBtn.onmouseover = () => {
            refreshBtn.style.borderColor = '#2563eb';
            refreshBtn.style.color = '#2563eb';
            refreshBtn.style.transform = 'translateY(-50%) rotate(180deg)';
        };
        refreshBtn.onmouseout = () => {
            refreshBtn.style.borderColor = '#dee2e6';
            refreshBtn.style.color = '#495057';
            refreshBtn.style.transform = 'translateY(-50%) rotate(0deg)';
        };
        refreshBtn.onclick = () => {
            location.reload();
        };
        
        headerElement.parentElement.style.position = 'relative';
        headerElement.parentElement.appendChild(refreshBtn);
    }
    
    container.innerHTML = `
        <style>
                .excel-container {
    padding: 40px;
    background: transparent;
}

@media (max-width: 768px) {
    .excel-container {
        padding: 20px;
    }
}
                
                /* 파일 업로드 섹션 */
                .upload-section {
                    background: #ffffff;
                    border: 2px dashed #dee2e6;
                    border-radius: 8px;
                    padding: 40px;
                    text-align: center;
                    margin-bottom: 24px;
                    transition: all 0.3s;
                    cursor: pointer;
                }
                
                .upload-section.dragover {
                    background: #e7f3ff;
                    border-color: #2563eb;
                }
                
                .upload-btn {
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
                
                .upload-btn:hover {
                    background: #1d4ed8;
                }
                
                .file-input {
                    display: none;
                }
                
                /* 지원 마켓 */
                .supported-markets {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 24px;
                }
                
                .market-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    margin: 4px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 400;
                    color: white;
                }
                
                /* 파일 리스트 */
                .file-list {
                    margin-bottom: 24px;
                }
                
                .file-item {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    padding: 12px 16px;
                    margin-bottom: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .file-item.warning {
                    background: #fff8e1;
                    border-color: #f59e0b;
                }
                
                .file-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }
                
                .market-tag {
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                    color: white;
                }
                
                .file-summary {
                    display: flex;
                    gap: 24px;
                    background: #f8f9fa;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                }
                
                .summary-item {
                    text-align: center;
                    flex: 1;
                }
                
                .summary-label {
                    font-size: 12px;
                    color: #6c757d;
                    margin-bottom: 4px;
                }
                
                .summary-value {
                    font-size: 24px;
                    font-weight: 600;
                    color: #2563eb;
                }
                
                /* 경고 박스 */
                .warning-box {
                    display: none;
                    background: #fff8e1;
                    border: 1px solid #f59e0b;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 24px;
                }
                
                .warning-box.show {
                    display: block;
                }
                
                /* 버튼들 */
                .btn-action {
    padding: 0 16px;
    height: 34px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    background: #ffffff;
    color: #212529;
    font-size: 14px;
    font-weight: 300;
    cursor: pointer;
    transition: all 0.2s;
    margin: 0 4px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
                
                .btn-action:hover {
                    background: #f8f9fa;
                    border-color: #2563eb;
                    color: #2563eb;
                }
                
                .btn-reset {
                    background: #dc3545;
                    color: white;
                    border-color: #dc3545;
                }
                
                .btn-reset:hover {
                    background: #c82333;
                }
                
                .btn-save {
                    background: #10b981;
                    color: white;
                    border-color: #10b981;
                }
                
                .btn-save:hover {
                    background: #059669;
                }
                
                .btn-success {
    padding: 0 12px;
    height: 34px;
    border: none;
    border-radius: 6px;
    background: #10b981;
    color: #ffffff;
    font-size: 12px;
    font-weight: 300;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.btn-success:hover {
    background: #059669;
}

.btn-action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

                /* 테이블 섹션 - 발송관리와 동일 */
                .table-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 16px;
                    overflow: hidden;
                    margin-top: 24px;
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

                /* 테이블 */
                .table-wrapper {
                    overflow-x: auto;
                    height: calc(100vh - 450px);
                    min-height: 400px;
                    max-height: 700px;
                    overflow-y: auto;
                    position: relative;
}
                
                .result-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                
                .result-table thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #f8f9fa;
}

.result-table thead th.fixed-column {
    background: #e9ecef !important;  /* 고정 헤더 구분색 */
}
                
                .result-table th {
                    padding: 8px;
                    border: 1px solid #dee2e6;
                    text-align: center;
                    font-weight: 500;
                    white-space: nowrap;
                }
                
                .result-table td {
    padding: 6px 8px;
    border: 1px solid #dee2e6;
    white-space: nowrap;
    background: white;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 0;  /* text-overflow 작동을 위해 필요 */
}
                
                /* 고정 컬럼 */
                .fixed-column {
                    position: sticky;
                    left: 0;
                    background: #ffffff;
                    z-index: 5;
                }
                
                .fixed-column-last {
                    box-shadow: 2px 0 5px rgba(0,0,0,0.1);
                }
                
                /* 옵션명 매칭 상태 */
                .unmatched-cell {
                    background: #fee2e2 !important;
                    color: #dc3545;
                }
                
                .modified-cell {
                    background: #fff8e1 !important;
                    color: #f59e0b;
                }
                
                .editable-cell {
                    cursor: text;
                }
                
                .editable-cell:hover {
                    background: #e7f3ff !important;
                }
                
                /* 모달 */
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    z-index: 10000;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal.show {
                    display: flex;
                }
                
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 800px;
                    width: 90%;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
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
                    overflow-y: auto;
                    flex: 1;
                }
                
                .modal-footer {
                    padding: 20px;
                    border-top: 1px solid #dee2e6;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                
                .modal-close {
                    cursor: pointer;
                    font-size: 24px;
                    color: #6c757d;
                }
                
                /* 메시지 */
                .message-box {
                    padding: 12px 16px;
                    border-radius: 6px;
                    margin: 16px 0;
                    display: none;
                    font-size: 14px;
                }
                
                .message-box.show {
                    display: block;
                }
                
                .message-box.error {
                    background: #fee2e2;
                    color: #dc3545;
                    border: 1px solid #fecaca;
                }
                
                .message-box.success {
                    background: #d1fae5;
                    color: #10b981;
                    border: 1px solid #a7f3d0;
                }
                
                .edit-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    margin-bottom: 12px;
                }
                
                .edit-item.modified {
                    background: #fff8e1;
                    border-color: #f59e0b;
                }
                
                .original-option {
                    flex: 1;
                    padding: 8px 12px;
                    background: #fee2e2;
                    color: #dc3545;
                    border-radius: 4px;
                    font-size: 14px;
                }
                
                .replacement-input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    font-size: 14px;
                }
                
                .replacement-input.has-value {
                    background: #d1fae5;
                    border-color: #10b981;
                }
            </style>
            
            <div class="excel-container">
                <!-- 지원 마켓 -->
                <div class="supported-markets" id="supportedMarkets"></div>
                
                <!-- 파일 업로드 -->
                <div class="upload-section" id="uploadSection">
                    <input type="file" id="fileInput" class="file-input" multiple accept=".xlsx,.xls,.csv">
                    <button class="upload-btn" id="uploadFileBtn">주문 파일 선택</button>
                    <p style="margin-top: 15px; color: #6c757d;">엑셀/CSV 파일을 선택하거나 여기로 드래그해주세요</p>
                </div>
                
                <!-- 파일 리스트 -->
                <div class="file-list" id="fileList"></div>
                
                <!-- 파일 요약 -->
                <div class="file-summary" id="fileSummary" style="display: none;">
                    <div class="summary-item">
                        <div class="summary-label">업로드 파일</div>
                        <div class="summary-value" id="totalFiles">0</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">마켓 수</div>
                        <div class="summary-value" id="totalMarkets">0</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">총 주문 수</div>
                        <div class="summary-value" id="totalOrders">0</div>
                    </div>
                </div>
                
                <!-- 경고 박스 -->
                <div class="warning-box" id="warningBox">
                    <h3 style="color: #f59e0b; margin: 0 0 12px 0;">⚠️ 주의: 오래된 파일이 감지되었습니다!</h3>
                    <ul id="warningList" style="margin: 0; padding-left: 20px;"></ul>
                    <div style="margin-top: 12px;">
                        <label>
                            <input type="checkbox" id="confirmOldFiles">
                            오늘 날짜가 아닌 파일은 통합에서 제외됩니다
                        </label>
                    </div>
                </div>
                
                <!-- 처리 버튼 -->
                <div style="text-align: center; margin: 30px 0;">
                    <button class="upload-btn" id="processBtn" style="display: none;">주문 통합 실행</button>
                </div>
                
                <!-- 메시지 -->
                <div id="excelErrorMessage" class="message-box error"></div>
                <div id="excelSuccessMessage" class="message-box success"></div>
                
                <!-- 결과 섹션 -->
                <!-- 테이블 섹션 -->
<div class="table-section" id="resultSection" style="display: none;">
    <div class="table-header">
        <h3 class="table-title">통합 결과</h3>
        <div class="table-actions">
            <button class="btn-action btn-reset" onclick="OrderExcelHandler.resetResults()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                초기화
            </button>
            <button class="btn-action" onclick="OrderExcelHandler.openBatchEdit()" style="background: #fee2e2; color: #dc3545; border-color: #fecaca;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                옵션명 일괄수정
            </button>
            <button class="btn-action" onclick="OrderExcelHandler.verifyOptions()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                옵션명 검증
            </button>
            <button class="btn-action" onclick="OrderExcelHandler.verifyDuplicate()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                중복발송검증
            </button>
            <button class="btn-action" onclick="OrderExcelHandler.exportExcel()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                엑셀 다운로드
            </button>
            <button class="btn-success" onclick="OrderExcelHandler.saveToSheets()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                저장
            </button>
        </div>
    </div>
    
    <div class="table-wrapper">
        <table class="result-table" id="excelResultTable">
            <thead id="excelResultHead"></thead>
            <tbody id="excelResultBody"></tbody>
        </table>
    </div>
</div>
            </div>
            
            <!-- 옵션명 일괄수정 모달 -->
            <div id="batchEditModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 style="margin: 0;">옵션명 일괄수정</h2>
                        <span class="modal-close" onclick="OrderExcelHandler.closeBatchEdit()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 20px;">
                            <p style="color: #6c757d;">매칭 실패한 옵션명을 일괄 수정합니다.</p>
                            <p style="color: #dc3545; font-weight: 500;">동일한 옵션명은 모두 일괄 변경됩니다.</p>
                        </div>
                        <div id="batchEditList"></div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-action" onclick="OrderExcelHandler.closeBatchEdit()">취소</button>
                        <button class="btn-action btn-save" onclick="OrderExcelHandler.applyBatchEdit()">적용</button>
                    </div>
                </div>
            </div>
        `;
        
        this.displaySupportedMarkets();
    },
    
    setupEventListeners() {
        const uploadBtn = document.getElementById('uploadFileBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                document.getElementById('fileInput').click();
            });
        }
        
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
            uploadSection.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadSection.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            uploadSection.addEventListener('drop', (e) => this.handleDrop(e));
        }
        
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.addEventListener('click', () => this.processOrders());
        }
    },
    
    displaySupportedMarkets() {
    const container = document.getElementById('supportedMarkets');
    if (!container || !this.mappingData) return;
    
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.flexWrap = 'wrap';
    container.style.gap = '8px';
    
    // 지원 마켓 레이블
    const label = document.createElement('span');
    label.textContent = '지원 마켓:';
    label.style.fontSize = '14px';
    label.style.fontWeight = '500';
    label.style.color = '#495057';
    label.style.marginRight = '4px';
    container.appendChild(label);
    
    const markets = this.mappingData.markets || {};
    const marketOrder = this.mappingData.marketOrder || Object.keys(markets);
    
    marketOrder.forEach(marketName => {
        const market = markets[marketName];
        if (!market) return;
        
        const badge = document.createElement('span');
        badge.className = 'market-badge';
        badge.textContent = marketName;
        badge.style.background = `rgb(${market.color})`;
        badge.style.display = 'inline-block';
        
        const rgb = market.color.split(',').map(Number);
        const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
        badge.style.color = brightness > 128 ? '#000' : '#fff';
        
        container.appendChild(badge);
    });
},
    
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    },
    
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    },
    
    handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    },
    
    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    },
    
    processFiles(files) {
        const validFiles = files.filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            return ['xlsx', 'xls', 'csv'].includes(ext);
        });
        
        if (validFiles.length === 0) {
            this.showError('유효한 파일이 없습니다.');
            return;
        }
        
        validFiles.forEach(file => this.readFile(file));
    },
    
    async readFile(file) {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                let workbook;
                const isCsv = file.name.toLowerCase().endsWith('.csv');
                const isXls = file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.xlsx');
                const isXlsx = file.name.toLowerCase().endsWith('.xlsx');
                
                if (isCsv) {
                    workbook = XLSX.read(e.target.result, { type: 'string' });
                } else if (isXls) {
    const data = e.target.result;
    const arr = new Uint8Array(data);
    
    try {
        // 첫 번째 시도: array 타입으로
        workbook = XLSX.read(arr, {
            type: 'array',
            cellDates: true,
            cellNF: true,
            cellText: false,
            dateNF: 'YYYY-MM-DD HH:mm:ss',
            codepage: 949  // 한글 인코딩
        });
        console.log(`${file.name}: .xls 파일 읽기 성공 (array)`);
        
    } catch (xlsError) {
        console.log('.xls array 읽기 실패, binary string 시도:', xlsError);
        
        // 두 번째 시도: binary string으로
        try {
            const binaryString = Array.from(arr, byte => String.fromCharCode(byte)).join('');
            workbook = XLSX.read(binaryString, {
                type: 'binary',
                cellDates: true,
                cellNF: true,
                cellText: false,
                dateNF: 'YYYY-MM-DD HH:mm:ss',
                codepage: 949
            });
            console.log(`${file.name}: .xls 파일 읽기 성공 (binary)`);
            
        } catch (binaryError) {
            console.log('.xls binary 읽기 실패, base64 시도:', binaryError);
            
            // 세 번째 시도: base64로
            try {
                const base64 = btoa(Array.from(arr, byte => String.fromCharCode(byte)).join(''));
                workbook = XLSX.read(base64, {
                    type: 'base64',
                    cellDates: true,
                    cellNF: true,
                    cellText: false,
                    dateNF: 'YYYY-MM-DD HH:mm:ss',
                    codepage: 949
                });
                console.log(`${file.name}: .xls 파일 읽기 성공 (base64)`);
                
            } catch (base64Error) {
                throw new Error('모든 .xls 읽기 방법 실패');
            }
        }
    }
                } else if (isXlsx) {
                    workbook = XLSX.read(e.target.result, { 
                        type: 'binary',
                        cellDates: true,
                        cellNF: true,
                        cellText: false
                    });
                }
                
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawRows = XLSX.utils.sheet_to_json(firstSheet, {
                    header: 1,
                    defval: '',
                    blankrows: false,
                    raw: false
                });
                
                await this.processExcelData(rawRows, file);
                
            } catch (error) {
                this.showError(`파일 읽기 실패: ${file.name}`);
            }
        };
        
        const fileName = file.name.toLowerCase();

if (fileName.endsWith('.csv')) {
    reader.readAsText(file, 'utf-8');
} else if (fileName.endsWith('.xls') && !fileName.endsWith('.xlsx')) {
    // .xls는 ArrayBuffer로 읽기
    reader.readAsArrayBuffer(file);
} else if (fileName.endsWith('.xlsx')) {
    // .xlsx는 BinaryString으로 읽기
    reader.readAsBinaryString(file);
} else {
    // 기타는 BinaryString으로 시도
    reader.readAsBinaryString(file);
}
    },
    
async processExcelData(rawRows, file) {
    // rawRows가 비어있는지만 확인
    if (!rawRows || rawRows.length === 0) {
        this.showError(`${file.name}: 파일이 비어있습니다.`);
        return;
    }
    
    // 헤더 위치 판단 - 매핑 시트의 헤더행 값 우선 사용
    let headerRowIndex = 0;
    const fileName = file.name.toLowerCase();
    
    // 마켓 감지를 위한 임시 헤더 추출
    let tempMarketName = null;
    
    // 파일명으로 마켓 추측
    if (this.mappingData && this.mappingData.markets) {
        for (const [marketName, market] of Object.entries(this.mappingData.markets)) {
            // 감지문자열로 확인
            const detectStrings = [
                market.detectString1,
                market.detectString2,
                marketName.toLowerCase()
            ].filter(s => s);
            
            if (detectStrings.some(str => fileName.includes(str.toLowerCase()))) {
                tempMarketName = marketName;
                break;
            }
        }
    }
    
    // 디버그: 감지된 마켓 확인
    console.log(`=== 헤더행 판단 시작 ===`);
    console.log(`파일명: ${file.name}`);
    console.log(`임시 감지 마켓: ${tempMarketName || '없음'}`);
    
    // 매핑 데이터에서 헤더행 값 가져오기
    if (tempMarketName && this.mappingData?.markets?.[tempMarketName]?.headerRow) {
        const headerRowValue = this.mappingData.markets[tempMarketName].headerRow;
        headerRowIndex = Math.max(0, parseInt(headerRowValue) - 1); // 1-based를 0-based 인덱스로 변환
        console.log(`매핑시트 헤더행 값: ${headerRowValue} → 인덱스: ${headerRowIndex}`);
        
        // 디버그: 실제 행 데이터 확인
        console.log(`1행 데이터:`, rawRows[0]?.slice(0, 5));
        console.log(`2행 데이터:`, rawRows[1]?.slice(0, 5));
        if (rawRows[2]) console.log(`3행 데이터:`, rawRows[2]?.slice(0, 5));
    } else {
        // 매핑 데이터가 없으면 기본 로직 사용
        console.log(`매핑 데이터 없음 - 기본 로직 사용`);
        
        // 파일명 기반 기본 판단
        if (fileName.includes('전화주문') || fileName.includes('cs발송') || fileName.includes('cs재발송')) {
            headerRowIndex = 1;
        } else if (fileName.includes('스마트스토어') || fileName.includes('네이버')) {
            headerRowIndex = 1;
        } else if (fileName.includes('주문내역') && fileName.includes('상품준비중')) {
            headerRowIndex = 1;  // 토스 파일 패턴
            console.log(`토스 파일 패턴 감지 - 헤더행 2 설정`);
        } else {
            headerRowIndex = 0;
        }
    }
    
    console.log(`최종 헤더행 인덱스: ${headerRowIndex} (실제 ${headerRowIndex + 1}행)`);
    console.log(`=== 헤더행 판단 완료 ===`);
    
    // rawRows에서 직접 헤더 추출 (빈 행 포함된 상태)
    const headers = rawRows[headerRowIndex]?.map(h => String(h || '').trim()) || [];
    
    // 헤더 이후의 데이터 행만 필터링 (빈 행 제거)
    const dataRows = [];
    for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
            dataRows.push(row);
        }
    }
    
    if (headers.length === 0 || dataRows.length === 0) {
        this.showError(`${file.name}: 유효한 데이터가 없습니다.`);
        return;
    }
    
    // 마켓 감지
    const marketName = await this.detectMarket(file.name, headers, dataRows[0] || []);
    
    if (!marketName) {
        this.showError(`${file.name}: 마켓을 인식할 수 없습니다.`);
        return;
    }
    
    // 날짜 확인
    const fileDate = new Date(file.lastModified);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    fileDate.setHours(0, 0, 0, 0);
    const isToday = fileDate.getTime() === today.getTime();
    
    // 파일 정보 저장
    const fileInfo = {
        name: file.name,
        marketName: marketName,
        lastModified: file.lastModified,
        isToday: isToday,
        headers: headers,
        data: dataRows.map(row => {
            const obj = {};
            headers.forEach((h, i) => {
                obj[h] = row[i] !== undefined ? row[i] : '';
            });
            return obj;
        }),
        rowCount: dataRows.length
    };
    
    this.uploadedFiles.push(fileInfo);
    this.updateFileList();
},
    
    async detectMarket(fileName, headers, firstDataRow) {
        try {
            const response = await fetch(`${this.API_BASE}/api/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName, headers, firstDataRow })
            });
            
            const result = await response.json();
            return result.marketName;
            
        } catch (error) {
            // 폴백: 파일명으로 추측
            const fileNameLower = fileName.toLowerCase();
            if (fileNameLower.includes('스마트스토어')) return '스마트스토어';
            if (fileNameLower.includes('쿠팡')) return '쿠팡';
            if (fileNameLower.includes('11번가')) return '11번가';
            if (fileNameLower.includes('토스')) return '토스';
            return null;
        }
    },
    
    updateFileList() {
        const fileList = document.getElementById('fileList');
        const fileSummary = document.getElementById('fileSummary');
        const processBtn = document.getElementById('processBtn');
        
        fileList.innerHTML = '';
        
        if (this.uploadedFiles.length === 0) {
            fileSummary.style.display = 'none';
            processBtn.style.display = 'none';
            return;
        }
        
        let totalOrders = 0;
        const marketSet = new Set();
        
        this.uploadedFiles.forEach((file, index) => {
            totalOrders += file.rowCount;
            marketSet.add(file.marketName);
            
            const fileItem = document.createElement('div');
            fileItem.className = file.isToday ? 'file-item' : 'file-item warning';
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const marketTag = document.createElement('span');
            marketTag.className = 'market-tag';
            marketTag.textContent = file.marketName;
            
            if (this.mappingData?.markets?.[file.marketName]) {
                const market = this.mappingData.markets[file.marketName];
                marketTag.style.background = `rgb(${market.color})`;
                const rgb = market.color.split(',').map(Number);
                const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
                marketTag.style.color = brightness > 128 ? '#000' : '#fff';
            }
            
            const fileName = document.createElement('span');
fileName.textContent = file.name;
fileName.style.color = '#6c757d';  // 파일명 회색

const orderCount = document.createElement('span');
orderCount.innerHTML = `<strong style="color: #2563eb; font-weight: 600;">${file.rowCount}개</strong> <span style="color: #6c757d;">주문</span>`;
            
            const fileDate = document.createElement('span');
            fileDate.style.color = file.isToday ? '#10b981' : '#f59e0b';
            fileDate.textContent = new Date(file.lastModified).toLocaleDateString('ko-KR');
            
            fileInfo.appendChild(marketTag);
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(orderCount);
            fileInfo.appendChild(fileDate);
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '삭제';
            removeBtn.className = 'btn-action';
            removeBtn.style.padding = '4px 12px';
            removeBtn.onclick = () => this.removeFile(index);
            
            fileItem.appendChild(fileInfo);
            fileItem.appendChild(removeBtn);
            fileList.appendChild(fileItem);
        });
        
        document.getElementById('totalFiles').textContent = this.uploadedFiles.length;
        document.getElementById('totalMarkets').textContent = marketSet.size;
        document.getElementById('totalOrders').textContent = totalOrders.toLocaleString();
        
        fileSummary.style.display = 'flex';
        processBtn.style.display = 'inline-block';
        
        this.checkWarnings();
    },
    
    removeFile(index) {
        this.uploadedFiles.splice(index, 1);
        this.updateFileList();
    },
    
    checkWarnings() {
        const oldFiles = this.uploadedFiles.filter(f => !f.isToday);
        const warningBox = document.getElementById('warningBox');
        const processBtn = document.getElementById('processBtn');
        
        if (oldFiles.length > 0) {
            const warningList = document.getElementById('warningList');
            warningList.innerHTML = '';
            
            oldFiles.forEach(file => {
                const li = document.createElement('li');
                const date = new Date(file.lastModified).toLocaleDateString('ko-KR');
                li.textContent = `${file.name} (${date})`;
                warningList.appendChild(li);
            });
            
            warningBox.classList.add('show');
            
            if (processBtn) {
                processBtn.disabled = true;
                processBtn.style.opacity = '0.5';
                processBtn.title = '오래된 파일을 제거한 후 진행하세요.';
            }
        } else {
            warningBox.classList.remove('show');
            
            if (processBtn && this.uploadedFiles.length > 0) {
                processBtn.disabled = false;
                processBtn.style.opacity = '1';
                processBtn.title = '';
            }
        }
    },
    
    async processOrders() {
        const todayFiles = this.uploadedFiles.filter(f => f.isToday);
        
        if (todayFiles.length === 0) {
            this.showError('오늘 날짜의 파일이 없습니다.');
            return;
        }
        
        this.showLoading();
        
        try {
            // ProductMatching 초기화
            if (this.ProductMatching) {
                await this.ProductMatching.loadProductData();
            }
            
            // 데이터 통합
            const mergedData = await this.mergeOrderData(todayFiles);
            
            // 제품 정보 적용
            const enrichedData = this.ProductMatching ? 
                await this.ProductMatching.applyProductInfo(mergedData) : mergedData;
            
            this.processedData = {
                data: enrichedData,
                headers: this.mappingData?.standardFields || Object.keys(enrichedData[0] || {}),
                sheetName: new Date().toISOString().slice(0, 10).replace(/-/g, '')
            };
            
            this.displayResults();
            this.showSuccess(`${enrichedData.length}개 주문 통합 완료`);
            
        } catch (error) {
            this.showError('처리 중 오류 발생: ' + error.message);
        } finally {
            this.hideLoading();
        }
    },
    
    async mergeOrderData(files) {
        const mergedData = [];
        let globalCounter = 0;
        const marketCounters = {};
        
        for (const file of files) {
            const marketName = file.marketName;
            const market = this.mappingData?.markets?.[marketName];
            
            if (!market) continue;
            
            if (!marketCounters[marketName]) {
                marketCounters[marketName] = 0;
            }
            
            file.data.forEach(row => {
                globalCounter++;
                marketCounters[marketName]++;
                
                const mappedRow = {};
                
                // 표준 필드 매핑
                this.mappingData.standardFields.forEach(standardField => {
                    if (standardField === '마켓명') {
                        mappedRow['마켓명'] = marketName;
                    } else if (standardField === '연번') {
                        mappedRow['연번'] = globalCounter;
                    } else if (standardField === '마켓') {
                        const initial = market.initial || marketName.charAt(0);
                        mappedRow['마켓'] = initial + String(marketCounters[marketName]).padStart(3, '0');
                    } else {
                        const sourceField = market.mappings?.[standardField];
                        if (sourceField) {
                            mappedRow[standardField] = row[sourceField] || '';
                        } else {
                            mappedRow[standardField] = '';
                        }
                    }
                });
                
                // 정산예정금액 계산
                if (market.settlementFormula) {
    mappedRow['정산예정금액'] = this.calculateSettlement(mappedRow, market.settlementFormula, marketName);
} else {
    // 정산수식이 없으면 기본값 사용
    mappedRow['정산예정금액'] = mappedRow['상품금액'] || mappedRow['최종결제금액'] || 0;
    console.log(`${marketName}: 정산수식 없음 - 기본값 사용`);
}
                
                if (mappedRow['정산예정금액']) {
    mappedRow['정산예정금액'] = Math.round(mappedRow['정산예정금액']);
}

                mergedData.push(mappedRow);
            });
        }
        
        return mergedData;
    },
    
    calculateSettlement(row, formula, marketName) {
    try {
        if (!formula || formula.trim() === '') {
            console.log(`${marketName}: 정산수식이 없습니다`);
            return 0;
        }
        
        console.log(`${marketName} 원본 정산수식: ${formula}`);
        
        let calculation = formula;
        
        // 엑셀 함수 변환
        calculation = calculation.replace(/ROUND\(/gi, 'Math.round(');
        calculation = calculation.replace(/ABS\(/gi, 'Math.abs(');
        calculation = calculation.replace(/MIN\(/gi, 'Math.min(');
        calculation = calculation.replace(/MAX\(/gi, 'Math.max(');
        
        // 필드명을 값으로 치환
        Object.entries(row).forEach(([fieldName, fieldValue]) => {
            if (calculation.includes(fieldName)) {
                const numValue = typeof fieldValue === 'number' ? 
                    fieldValue : parseFloat(String(fieldValue).replace(/[^0-9.-]/g, '')) || 0;
                calculation = calculation.replace(new RegExp(fieldName, 'g'), numValue);
            }
        });
        
        console.log(`  변환된 계산식: ${calculation}`);
        
        // 계산 실행
        try {
            const result = Function('"use strict"; return (' + calculation + ')')();
            
            // 1원 단위로 반올림하여 정수 변환
            let finalResult = 0;
            if (!isNaN(result)) {
                finalResult = Math.round(result);
            }
            
            console.log(`  계산 결과: ${finalResult} (원본: ${result})`);
            return finalResult;
            
        } catch (evalError) {
            console.error(`  계산 실행 오류: ${evalError.message}`);
            return 0;
        }
        
    } catch (error) {
        console.error(`정산금액 계산 오류 (${marketName}):`, error);
        return 0;
    }
},
    
    
displayResults() {
    const resultSection = document.getElementById('resultSection');
    resultSection.style.display = 'block';
        
        const thead = document.getElementById('excelResultHead');
        const tbody = document.getElementById('excelResultBody');
        
        // 열너비 설정
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
    '택배사': 80,
    '송장번호': 140
};

// 고정열 끝 인덱스 찾기
let fixedEndIndex = -1;
const phoneFields = ['수령인전화번호', '수령인 전화번호', '수취인전화번호', '수취인 전화번호'];
for (let i = 0; i < this.processedData.headers.length; i++) {
    if (phoneFields.includes(this.processedData.headers[i])) {
        fixedEndIndex = i;
        break;
    }
}
if (fixedEndIndex === -1) {
    fixedEndIndex = Math.min(10, this.processedData.headers.length - 1);
}

// 누적 너비 계산
const cumulativeWidths = [0];
let totalWidth = 0;
this.processedData.headers.forEach(header => {
    const width = columnWidths[header] || 100;
    cumulativeWidths.push(cumulativeWidths[cumulativeWidths.length - 1] + width);
    totalWidth += width;
});

// 테이블 전체 너비 설정
const table = document.getElementById('excelResultTable');
if (table) {
    table.style.minWidth = `${totalWidth}px`;
    table.style.tableLayout = 'fixed';
}

// 헤더 생성
const headerRow = document.createElement('tr');
this.processedData.headers.forEach((header, index) => {
    const th = document.createElement('th');
    th.textContent = header;
    
    const width = columnWidths[header] || 100;
    th.style.width = `${width}px`;
    th.style.minWidth = `${width}px`;
    
    if (index <= fixedEndIndex) {
        th.classList.add('fixed-column');
        th.style.position = 'sticky';
        th.style.left = `${cumulativeWidths[index]}px`;
        th.style.zIndex = '10';
        if (index === fixedEndIndex) {
            th.classList.add('fixed-column-last');
        }
    }
    
    headerRow.appendChild(th);
});
        thead.innerHTML = '';
        thead.appendChild(headerRow);
        
        // 마켓 순서대로 정렬
if (this.mappingData && this.mappingData.marketOrder && this.mappingData.marketOrder.length > 0) {
    this.processedData.data.sort((a, b) => {
        const marketA = a['마켓명'];
        const marketB = b['마켓명'];
        const ia = this.mappingData.marketOrder.indexOf(marketA);
        const ib = this.mappingData.marketOrder.indexOf(marketB);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return marketA.localeCompare(marketB);
    });
}

// 연번 재할당 (정렬 후)
this.processedData.data.forEach((row, index) => {
    row['연번'] = index + 1;
});

// 바디 생성
tbody.innerHTML = '';
this.processedData.data.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
            
            // 필드별 정렬 설정
const centerAlignFields = ['마켓명', '연번', '결제일', '주문번호', '상품주문번호', '주문자', '수취인', '수령인', '옵션명', '수량', '마켓', '택배사', '송장번호'];
const leftAlignFields = ['주소', '수취인주소', '수령인주소', '배송메세지', '배송메시지', '발송지주소'];
const rightAlignFields = ['셀러공급가', '출고비용', '정산예정금액', '정산대상금액', '상품금액', '최종결제금액', '할인금액', '택배비'];
const phoneFields = ['주문자전화번호', '수취인전화번호', '수령인전화번호', '주문자 전화번호', '수취인 전화번호', '수령인 전화번호'];

function getAlignment(fieldName) {
        if (rightAlignFields.includes(fieldName)) return 'right';
        if (leftAlignFields.includes(fieldName)) return 'left';
        if (centerAlignFields.includes(fieldName)) return 'center';
        if (phoneFields.includes(fieldName)) return 'center';
        return 'center';
    }

    this.processedData.headers.forEach((header, colIndex) => {
        const td = document.createElement('td');
        let value = row[header] || '';
    
    const width = columnWidths[header] || 100;
    td.style.width = `${width}px`;
    td.style.minWidth = `${width}px`;
    td.style.textAlign = getAlignment(header);
    
    // 고정 컬럼 처리
    if (colIndex <= fixedEndIndex) {
        td.classList.add('fixed-column');
        td.style.position = 'sticky';
        td.style.left = `${cumulativeWidths[colIndex]}px`;
        td.style.zIndex = '5';
        if (colIndex === fixedEndIndex) {
            td.classList.add('fixed-column-last');
        }
    }
    
    // 날짜 포맷팅
    if (header.includes('결제일') || header.includes('발송일') || header.includes('주문일')) {
        if (value) {
            // 날짜 형식 변환 로직
            const dateStr = String(value);
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
                value = dateStr;
            } else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
                const parts = dateStr.split(' ');
                const dateParts = parts[0].split('/');
                const month = dateParts[0].padStart(2, '0');
                const day = dateParts[1].padStart(2, '0');
                let year = dateParts[2];
                if (year.length === 2) year = '20' + year;
                value = `${year}-${month}-${day}` + (parts[1] ? ' ' + parts[1] : '');
            }
        }
    }
    
    // 금액 포맷팅
    if (rightAlignFields.includes(header)) {
        const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
        if (!isNaN(numValue) && value !== '') {
            value = numValue.toLocaleString('ko-KR');
            td.classList.add('amount-field');
        }
    }
    
    // 수량 강조
    if (header === '수량') {
        const quantity = parseInt(value);
        if (quantity >= 2) {
            td.style.color = '#dc3545';
            td.style.fontWeight = '500';
        }
    }
                
// 마켓명 배지 표시
if (header === '마켓명') {
    const marketName = String(value);
    if (this.mappingData?.markets?.[marketName]) {
        const market = this.mappingData.markets[marketName];
        const colorValue = `rgb(${market.color})`;
        const rgb = market.color.split(',').map(Number);
        const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
        const textColor = brightness > 128 ? '#000' : '#fff';
        
        td.innerHTML = `
            <span style="
                display: inline-block;
                padding: 4px 10px;
                background: ${colorValue};
                color: ${textColor};
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
            ">${marketName}</span>
        `;
        td.style.textAlign = 'center';
        td.style.background = '#ffffff';
    } else {
        td.textContent = marketName;
        td.style.textAlign = 'center';
    }
}
                

// 옵션명 매칭 상태 표시
if (header === '옵션명') {
    if (row['_matchStatus'] === 'unmatched') {
        td.classList.add('unmatched-cell', 'editable-cell');
        td.innerHTML = `<span>${String(value)}</span> <span style="color: #dc3545; font-size: 12px;">⚠️</span>`;
        td.contentEditable = true;
        
        td.addEventListener('blur', () => {
            const textContent = td.querySelector('span:first-child')?.textContent || td.textContent;
            row['옵션명'] = textContent.trim().replace('⚠️', '').replace('✏️', '');
            row['_matchStatus'] = 'modified';
            td.classList.remove('unmatched-cell');
            td.classList.add('modified-cell');
            td.innerHTML = `<span>${row['옵션명']}</span> <span style="color: #f59e0b; font-size: 12px;">✏️</span>`;
        });
    } else if (row['_matchStatus'] === 'modified') {
        td.classList.add('modified-cell');
        td.innerHTML = `<span>${String(value)}</span> <span style="color: #f59e0b; font-size: 12px;">✏️</span>`;
    } else {
        td.textContent = String(value);
    }
}
                
                // 금액 포맷팅
                if (header.includes('금액') || header.includes('공급가')) {
                    const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
                    if (!isNaN(numValue)) {
                        value = numValue.toLocaleString('ko-KR');
                    }
                }
                
                
        
        // 기본값 설정 (마켓명이 아니고 특별한 처리가 없는 경우)
    if (header !== '마켓명' && !td.textContent && !td.innerHTML) {
        td.textContent = String(value);
    }
    
    tr.appendChild(td);
    });
    
    tbody.appendChild(tr);
});
},
    
    async verifyOptions() {
    if (!this.processedData || !this.ProductMatching) {
        this.showError('검증할 데이터가 없습니다.');
        return;
    }
    
    // processedData를 전달해야 함
    const result = await this.ProductMatching.verifyOptions(this.processedData.data);
    
    if (result.unmatchedOptions && result.unmatchedOptions.length > 0) {
        this.showError(`매칭 실패: ${result.unmatchedOptions.length}개 옵션`);
    } else {
        this.showSuccess('모든 옵션명 매칭 성공');
    }
    
    this.displayResults();
},
    
async verifyDuplicate() {
    if (!this.processedData) {
        this.showError('검증할 데이터가 없습니다.');
        return;
    }
    
    this.showLoading();
    
    try {
        // 과거 7일 시트명 생성
        const sheetNames = [];
        for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            sheetNames.push(`${year}${month}${day}`);
        }
        
        // 과거 주문 데이터 수집
        const pastOrders = [];
        for (const sheetName of sheetNames) {
            try {
                const response = await fetch(`${this.API_BASE}/api/sheets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getSheetData',  // 올바른 액션명 사용
                        sheetName: sheetName,
                        spreadsheetId: 'SPREADSHEET_ID_ORDERS'  // 주문 스프레드시트 ID
                    })
                });
                
                const result = await response.json();
                if (result.success && result.data) {
                    result.data.forEach(order => {
                        order._sheetName = sheetName;  // 출처 시트 기록
                    });
                    pastOrders.push(...result.data);
                }
            } catch (error) {
                console.log(`${sheetName} 시트 조회 실패:`, error);
            }
        }
        
        // 중복 검증
        let shippedDuplicates = 0;
        let unshippedDuplicates = 0;
        const duplicateDetails = [];
        
        this.processedData.data.forEach((currentOrder, index) => {
            const currentOrderNo = String(currentOrder['주문번호'] || '').trim();
            const currentRecipient = String(currentOrder['수령인'] || currentOrder['수취인'] || '').trim();
            const currentOption = String(currentOrder['옵션명'] || '').trim();
            
            if (!currentOrderNo || !currentRecipient) return;
            
            // 과거 데이터에서 중복 찾기
            const duplicates = pastOrders.filter(pastOrder => {
                const pastOrderNo = String(pastOrder['주문번호'] || '').trim();
                const pastRecipient = String(pastOrder['수령인'] || pastOrder['수취인'] || '').trim();
                const pastOption = String(pastOrder['옵션명'] || '').trim();
                
                return currentOrderNo === pastOrderNo && 
                       currentRecipient === pastRecipient &&
                       currentOption === pastOption;
            });
            
            if (duplicates.length > 0) {
                const hasShipped = duplicates.some(d => d['송장번호'] && String(d['송장번호']).trim() !== '');
                
                if (hasShipped) {
                    shippedDuplicates++;
                    currentOrder['_duplicateStatus'] = 'shipped';
                    
                    const shippedOrder = duplicates.find(d => d['송장번호']);
                    duplicateDetails.push({
                        type: 'shipped',
                        orderNo: currentOrderNo,
                        recipient: currentRecipient,
                        option: currentOption,
                        invoice: shippedOrder['송장번호'],
                        sheetName: shippedOrder['_sheetName']
                    });
                } else {
                    unshippedDuplicates++;
                    currentOrder['_duplicateStatus'] = 'unshipped';
                    
                    duplicateDetails.push({
                        type: 'unshipped',
                        orderNo: currentOrderNo,
                        recipient: currentRecipient,
                        option: currentOption,
                        sheetName: duplicates[0]['_sheetName']
                    });
                }
            }
        });
        
        // 결과 표시
        this.displayResults();
        
        // 상세 메시지 구성
        let message = `중복발송 검증 완료\n`;
        if (shippedDuplicates > 0) {
            message += `⛔ 발송 완료 중복: ${shippedDuplicates}건 (제거 필요)\n`;
        }
        if (unshippedDuplicates > 0) {
            message += `⚠️ 미발송 중복: ${unshippedDuplicates}건 (확인 필요)\n`;
        }
        if (shippedDuplicates === 0 && unshippedDuplicates === 0) {
            message += `✅ 중복 주문이 없습니다.`;
        }
        
        // 중복 상세 내역 콘솔 출력
        if (duplicateDetails.length > 0) {
            console.log('중복 상세 내역:', duplicateDetails);
        }
        
        this.showSuccess(message);
        
    } catch (error) {
        console.error('중복 검증 오류:', error);
        this.showError('중복 검증 중 오류가 발생했습니다.');
    } finally {
        this.hideLoading();
    }
},
    
    openBatchEdit() {
        if (!this.processedData) {
            this.showError('수정할 데이터가 없습니다.');
            return;
        }
        
        const unmatchedOptions = {};
        
        this.processedData.data.forEach(row => {
            if (row['_matchStatus'] === 'unmatched' || row['_matchStatus'] === 'modified') {
                const optionName = row['옵션명'];
                if (!unmatchedOptions[optionName]) {
                    unmatchedOptions[optionName] = 0;
                }
                unmatchedOptions[optionName]++;
            }
        });
        
        const listContainer = document.getElementById('batchEditList');
        listContainer.innerHTML = '';
        
        Object.entries(unmatchedOptions).forEach(([optionName, count]) => {
            const item = document.createElement('div');
            item.className = 'edit-item';
            item.innerHTML = `
                <div class="original-option">${optionName} (${count}개)</div>
                <span>→</span>
                <input type="text" class="replacement-input" placeholder="대체할 옵션명" 
                       data-original="${optionName}"
                       onchange="OrderExcelHandler.onReplacementChange(this)">
            `;
            listContainer.appendChild(item);
        });
        
        document.getElementById('batchEditModal').classList.add('show');
    },
    
    onReplacementChange(input) {
        const original = input.dataset.original;
        const replacement = input.value.trim();
        
        if (replacement) {
            this.batchEditData[original] = replacement;
            input.classList.add('has-value');
            input.closest('.edit-item').classList.add('modified');
        } else {
            delete this.batchEditData[original];
            input.classList.remove('has-value');
            input.closest('.edit-item').classList.remove('modified');
        }
    },
    
    closeBatchEdit() {
        document.getElementById('batchEditModal').classList.remove('show');
        this.batchEditData = {};
    },
    
    async applyBatchEdit() {
        if (Object.keys(this.batchEditData).length === 0) {
            this.showError('수정할 항목이 없습니다.');
            return;
        }
        
        let modifiedCount = 0;
        
        this.processedData.data.forEach(row => {
            const currentOption = row['옵션명'];
            if (this.batchEditData[currentOption]) {
                row['옵션명'] = this.batchEditData[currentOption];
                row['_matchStatus'] = 'modified-matched';
                modifiedCount++;
            }
        });
        
        // 제품 정보 재적용
        if (this.ProductMatching) {
            this.processedData.data = await this.ProductMatching.applyProductInfo(this.processedData.data);
        }
        
        this.displayResults();
        this.showSuccess(`${modifiedCount}개 주문의 옵션명을 수정했습니다.`);
        this.closeBatchEdit();
    },
    
    exportExcel() {
        if (!this.processedData) {
            this.showError('내보낼 데이터가 없습니다.');
            return;
        }
        
        const ws = XLSX.utils.json_to_sheet(this.processedData.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '주문통합');
        
        const fileName = `주문통합_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        this.showSuccess('엑셀 파일 다운로드 완료');
    },
    
    async saveToSheets() {
    if (!this.processedData || !this.processedData.data || this.processedData.data.length === 0) {
        this.showError('저장할 데이터가 없습니다. 먼저 주문을 처리해주세요.');
        return;
    }
    
    // 이미 저장 중인지 확인
    if (window.isSaving) {
        this.showMessage('저장 중입니다. 잠시만 기다려주세요.', 'info');
        return;
    }
    
    window.isSaving = true;
    this.showLoading();
    
    try {
        // 헤더 행 추가
        const headers = this.processedData.headers || this.mappingData.standardFields;
        const values = [headers];
        
        // 데이터 행 추가
        this.processedData.data.forEach(row => {
            const rowValues = headers.map(header => {
                const value = row[header];
                return value !== undefined && value !== null ? String(value) : '';
            });
            values.push(rowValues);
        });
        
        // 마켓 색상 매핑 준비
        const marketColors = {};
        if (this.mappingData && this.mappingData.markets) {
            Object.entries(this.mappingData.markets).forEach(([marketName, market]) => {
                if (market.color) {
                    const rgb = market.color.split(',').map(Number);
                    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
                    marketColors[marketName] = {
                        color: market.color,
                        textColor: brightness > 128 ? '#000' : '#fff'
                    };
                }
            });
        }
        
        // API 호출
        const response = await fetch(`${this.API_BASE}/api/sheets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'saveToSheet',
                sheetName: this.processedData.sheetName,
                values: values,
                marketColors: marketColors,
                spreadsheetId: 'SPREADSHEET_ID_ORDERS'  // 주문 스프레드시트 ID
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`Saved ${this.processedData.data.length} rows to sheet "${this.processedData.sheetName}"`);
            this.showSuccess(`구글 시트 "${this.processedData.sheetName}"에 저장되었습니다.`);
        } else {
            console.error('시트 저장 실패:', result.error);
            this.showError('시트 저장 실패: ' + (result.error || '알 수 없는 오류'));
        }
        
    } catch (error) {
        console.error('저장 중 오류:', error);
        this.showError('저장 중 오류 발생: ' + error.message);
    } finally {
        this.hideLoading();
        window.isSaving = false;
    }
},
    
    resetResults() {
        if (!confirm('결과를 초기화하시겠습니까?')) return;
        
        this.processedData = null;
document.getElementById('resultSection').style.display = 'none';
        this.showSuccess('초기화 완료');
    },
    
    showError(message) {
        const el = document.getElementById('excelErrorMessage');
        if (el) {
            el.textContent = message;
            el.classList.add('show');
            setTimeout(() => el.classList.remove('show'), 3000);
        }
    },
    
    showSuccess(message) {
        const el = document.getElementById('excelSuccessMessage');
        if (el) {
            el.textContent = message;
            el.classList.add('show');
            setTimeout(() => el.classList.remove('show'), 3000);
        }
    },
    
    showMessage(message, type) {
        if (type === 'error') {
            this.showError(message);
        } else {
            this.showSuccess(message);
        }
    },
    
    showLoading() {
        if (window.OrderManage) {
            window.OrderManage.showLoading();
        }
    },
    
    hideLoading() {
        if (window.OrderManage) {
            window.OrderManage.hideLoading();
        }
    }
};