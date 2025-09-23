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


                /* 매칭 상태 아이콘을 ::after 가상 요소로 표시 */
.unmatched-cell::after {
    content: '⚠️';
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    pointer-events: none;
}

.modified-cell::after {
    content: '✏️';
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    pointer-events: none;
}

.modified-matched-cell {
    background: #d1fae5 !important;
    color: #10b981;
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
    <div style="display: flex; align-items: center; flex: 1;">
        <h3 class="table-title" style="margin: 0;">통합 결과</h3>
        <div style="margin-left: 20px; display: flex; gap: 8px;">
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
            <button class="btn-action" onclick="OrderExcelHandler.verifyOptions()" style="background: #d1fae5; color: #10b981; border-color: #a7f3d0;">
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
        </div>
    </div>
    <div class="table-actions">
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
    blankrows: true,  // 빈 행도 포함
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
    
// 토스 특별 처리
if (tempMarketName === '토스') {
    // 토스는 항상 2행이 헤더 (1행이 빈 행)
    // 첫 행이 실제로 빈 행인지 확인
    const firstRowEmpty = !rawRows[0] || rawRows[0].every(cell => !cell || String(cell).trim() === '');
    
    if (!firstRowEmpty) {
        // 첫 행이 빈 행이 아니면 이미 제거된 상태
        headerRowIndex = 0; // 현재 첫 행이 헤더
        console.log(`토스: 빈 행이 이미 제거됨, 현재 1행을 헤더로 사용 (인덱스: 0)`);
    } else {
        // 첫 행이 빈 행이면 2행이 헤더
        headerRowIndex = 1;
        console.log(`토스: 1행이 빈 행, 2행을 헤더로 사용 (인덱스: 1)`);
    }
    
    // 디버그: 실제 행 데이터 확인
    console.log(`rawRows[0] (1행):`, rawRows[0]?.slice(0, 5));
    console.log(`rawRows[1] (2행):`, rawRows[1]?.slice(0, 5));
    if (rawRows[2]) console.log(`rawRows[2] (3행):`, rawRows[2]?.slice(0, 5));
}
// 다른 마켓은 매핑 데이터 사용
else if (tempMarketName && this.mappingData?.markets?.[tempMarketName]?.headerRow) {
    const headerRowValue = this.mappingData.markets[tempMarketName].headerRow;
    headerRowIndex = Math.max(0, parseInt(headerRowValue) - 1);
    console.log(`매핑시트 헤더행 값: ${headerRowValue} → 인덱스: ${headerRowIndex}`);
    
    // 디버그: 실제 행 데이터 확인
    console.log(`rawRows[0] (1행):`, rawRows[0]?.slice(0, 5));
    console.log(`rawRows[1] (2행):`, rawRows[1]?.slice(0, 5));
    if (rawRows[2]) console.log(`rawRows[2] (3행):`, rawRows[2]?.slice(0, 5));



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
            
// 제품 정보 적용 (옵션명으로 통합상품마스터 필드 매칭)
let enrichedData = mergedData;

// ProductMatching 로드 확인
if (!this.ProductMatching) {
    if (parent.window !== window && parent.window.ProductMatching) {
        this.ProductMatching = parent.window.ProductMatching;
    } else if (window.ProductMatching) {
        this.ProductMatching = window.ProductMatching;
    }
}

if (this.ProductMatching) {
    console.log('ProductMatching 적용 시작');
    
    // ProductMatching 데이터 로드 확인
    if (!this.ProductMatching.isLoaded) {
        await this.ProductMatching.loadProductData();
    }
    
    enrichedData = await this.ProductMatching.applyProductInfo(mergedData);
    
    // 통합상품마스터 필드 매칭 검증
    const requiredFields = ['셀러공급가', '출고처', '송장주체', '벤더사', 
                           '발송지명', '발송지주소', '발송지연락처', '출고비용'];
    
    let matchedCount = 0;
    enrichedData.forEach(row => {
        // 최소 하나 이상의 필드가 매칭되었는지 확인
        const hasMatchedField = requiredFields.some(field => 
            row[field] && row[field] !== '' && row[field] !== 0
        );
        if (hasMatchedField) matchedCount++;
    });
    
    console.log(`ProductMatching 결과: ${matchedCount}/${enrichedData.length}개 행에서 통합상품마스터 매칭됨`);
} else {
    console.error('ProductMatching 모듈을 찾을 수 없습니다');
    
    // ProductMatching 없을 때 기본값 설정
    enrichedData.forEach(row => {
        row['셀러공급가'] = row['셀러공급가'] || '';
        row['출고처'] = row['출고처'] || '';
        row['송장주체'] = row['송장주체'] || '';
        row['벤더사'] = row['벤더사'] || '';
        row['발송지명'] = row['발송지명'] || '';
        row['발송지주소'] = row['발송지주소'] || '';
        row['발송지연락처'] = row['발송지연락처'] || '';
        row['출고비용'] = row['출고비용'] || 0;
    });
}
            
// 로컬과 전역 변수 동시 설정
this.processedData = {
    data: enrichedData,
    headers: this.mappingData?.standardFields || Object.keys(enrichedData[0] || {}),
    standardFields: this.mappingData?.standardFields || Object.keys(enrichedData[0] || {}),
    sheetName: new Date().toISOString().slice(0, 10).replace(/-/g, '')
};

// 전역 변수 확실하게 설정
window.processedData = this.processedData;
console.log('window.processedData 설정 완료:', window.processedData);

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
        '주문자전화번호': 150,
        '수취인전화번호': 150,
        '수령인전화번호': 150,
        '주소': 300,
        '수취인주소': 300,
        '수령인주소': 300,
        '배송메세지': 100,
        '배송메시지': 100,
        '옵션명': 160,
        '수량': 60,
        '마켓': 80,
        '특이/요청사항': 300,
        '발송요청일': 150,
        '확인': 160,
        '셀러': 80,
        '셀러공급가': 80,
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
        '판매아이디':120,
        '분리배송 Y/N':100,
        '택배비': 80,
        '발송일(송장입력일)':150,      
        '택배사': 80,
        '송장번호': 140
};



// 테이블 전체 너비 설정
// 테이블 전체 너비 계산 및 설정
let totalWidth = 0;
this.processedData.headers.forEach(header => {
    const width = columnWidths[header] || 100;
    totalWidth += width;
});

const table = document.getElementById('excelResultTable');
if (table) {
    table.style.minWidth = `${totalWidth}px`;
}

// 헤더 생성
const headerRow = document.createElement('tr');
this.processedData.headers.forEach((header, index) => {
    const th = document.createElement('th');
    th.textContent = header;
    
    const width = columnWidths[header] || 100;
    th.style.width = `${width}px`;
    th.style.minWidth = `${width}px`;
    th.style.maxWidth = `${width}px`;
    
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
    td.style.maxWidth = `${width}px`;
    td.style.textAlign = getAlignment(header);
    
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
    
// 금액 포맷팅 - 모든 금액 관련 필드 처리
const amountFields = ['셀러공급가', '출고비용', '정산예정금액', '정산대상금액', 
                      '상품금액', '최종결제금액', '할인금액', '마켓부담할인금액', 
                      '판매자할인쿠폰할인', '구매쿠폰적용금액', '쿠폰할인금액', 
                      '기타지원금할인금', '수수료1', '수수료2', '택배비'];

if (amountFields.some(field => header.includes(field))) {
    const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (!isNaN(numValue)) {
        // 0인 경우 빈 문자열로 처리
        if (numValue === 0) {
            value = '';
        } else {
            value = numValue.toLocaleString('ko-KR');
        }
        td.style.textAlign = 'right';
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
    td.textContent = String(value);
    
    // 매칭 실패 또는 수정된 상태 확인
    if (row['_matchStatus'] === 'unmatched' || row['_matchStatus'] === 'modified') {
        td.classList.add(row['_matchStatus'] === 'unmatched' ? 'unmatched-cell' : 'modified-cell');
        td.classList.add('editable-cell');
        td.contentEditable = true;
        td.style.position = 'relative';
        td.style.paddingRight = '20px';
        
        const originalValue = td.textContent;
        
        td.addEventListener('blur', () => {
            const newValue = td.textContent.trim();
            if (newValue !== originalValue) {
                row['옵션명'] = newValue;
                row['_matchStatus'] = 'modified';
                td.classList.remove('unmatched-cell');
                td.classList.add('modified-cell');
            }
        });
        
        td.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                td.blur();
            }
        });
    } else if (row['_matchStatus'] === 'modified-matched') {
        td.classList.add('modified-matched-cell');
        td.style.background = '#d1fae5';
        td.style.color = '#10b981';
    }
}
                
                // 금액 포맷팅 - 셀러공급가 포함 모든 금액 필드
if (header.includes('금액') || header.includes('공급가') || header === '셀러공급가' || header === '출고비용' || header === '택배비') {
    const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (!isNaN(numValue) && value !== '') {
        value = numValue.toLocaleString('ko-KR');
    }
}
                
                
        
        // 기본값 설정 (0은 빈 문자열로)
if (header !== '마켓명' && !td.textContent && !td.innerHTML) {
    // 숫자 0인 경우 빈 셀로 처리
    if (value === 0 || value === '0') {
        td.textContent = '';
    } else {
        td.textContent = String(value);
    }
}
    
    tr.appendChild(td);
    });
    
    tbody.appendChild(tr);
});
},
    
async verifyOptions() {
    if (!this.processedData) {
        this.showError('처리된 주문 데이터가 없습니다. 먼저 주문 통합을 실행하세요.');
        return;
    }
    
    // ProductMatching 데이터 로드
    if (!this.ProductMatching) {
        this.ProductMatching = window.ProductMatching || parent.window?.ProductMatching;
    }
    
    console.log('ProductMatching 존재:', !!this.ProductMatching);
    
    if (this.ProductMatching) {
        await this.ProductMatching.loadProductData();
    }
    
    console.log('window.productData 존재:', !!window.productData);
    console.log('window.productData 샘플:', Object.keys(window.productData || {}).slice(0, 5));
    
    // 모든 변수를 여기서 선언
    let matchedCount = 0;
    let unmatchedCount = 0;
    let modifiedCount = 0;
    let modifiedMatchedCount = 0;
    let modifiedUnmatchedCount = 0;
    let notModifiedCount = 0;
    
    // 모든 행 검증
    this.processedData.data.forEach((row, index) => {
        const optionName = row['옵션명'];
        
        if (!optionName) {
            unmatchedCount++;
            row['_matchStatus'] = 'unmatched';
            return;
        }
        
        // ProductMatching 있으면 매칭 시도
        let matchedProduct = null;
        const productData = this.ProductMatching?.getProductData() || window.productData || {};
        
        if (this.ProductMatching && Object.keys(productData).length > 0) {
            const trimmedOption = optionName.trim();
            matchedProduct = productData[trimmedOption];
            
            if (!matchedProduct) {
                // 대소문자 무시 매칭
                const lowerOption = trimmedOption.toLowerCase();
                for (const [key, value] of Object.entries(productData)) {
                    if (key.toLowerCase() === lowerOption) {
                        matchedProduct = value;
                        break;
                    }
                }
            }
        }
        
        if (matchedProduct) {
            // 기존 상태 확인
            if (row['_matchStatus'] === 'modified' || row['_matchStatus'] === 'modified-matched') {
                modifiedMatchedCount++;
                row['_matchStatus'] = 'modified-matched';
            } else {
                matchedCount++;
                row['_matchStatus'] = 'matched';
            }
            
            // 제품 정보 업데이트
            row['셀러공급가'] = matchedProduct['셀러공급가'] || row['셀러공급가'] || '';
            row['출고처'] = matchedProduct.출고처 || row['출고처'] || '';
            row['송장주체'] = matchedProduct.송장주체 || row['송장주체'] || '';
            row['벤더사'] = matchedProduct.벤더사 || row['벤더사'] || '';
            row['발송지명'] = matchedProduct.발송지명 || row['발송지명'] || '';
            row['발송지주소'] = matchedProduct.발송지주소 || row['발송지주소'] || '';
            row['발송지연락처'] = matchedProduct.발송지연락처 || row['발송지연락처'] || '';
            row['출고비용'] = matchedProduct.출고비용 || 0;
        } else {
            unmatchedCount++;
            row['_matchStatus'] = 'unmatched';
        }
    });
    
    // 결과 표시
    this.displayResults();
    
    // 상세 통계 재계산
    modifiedCount = 0;
    modifiedUnmatchedCount = 0;
    
    this.processedData.data.forEach(row => {
        if (row['_matchStatus'] === 'modified-matched') {
            modifiedCount++;
        } else if (row['_matchStatus'] === 'modified') {
            modifiedCount++;
            modifiedUnmatchedCount++;
        }
    });
    
    notModifiedCount = unmatchedCount - modifiedUnmatchedCount;
    
    // 모달 창 생성
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;
    
    modalContent.innerHTML = `
        <h3 style="margin-bottom: 20px; font-size: 20px; font-weight: 500; color: #2563eb;">
            옵션명 검증 결과
        </h3>
        <div style="line-height: 2; font-size: 14px;">
            <div style="padding: 8px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                <div style="color: #10b981;">✓ 매칭 성공: <strong>${matchedCount}개</strong></div>
                <div style="color: #f59e0b;">✏ 수정한 옵션명: <strong>${modifiedCount}개</strong></div>
                <div style="color: #10b981;">✓ 수정 후 매칭 성공: <strong>${modifiedMatchedCount}개</strong></div>
                <div style="color: #dc3545;">✗ 수정 후 매칭 실패: <strong>${modifiedUnmatchedCount}개</strong></div>
                <div style="color: #dc3545;">✗ 수정 안된 매칭 실패: <strong>${notModifiedCount}개</strong></div>
            </div>
            <div style="margin-top: 10px; font-size: 13px; color: #6c757d;">
                ${modifiedMatchedCount > 0 ? '• 수정 후 매칭 성공: <span style="color: #10b981;">초록색</span> 표시<br>' : ''}
                ${unmatchedCount > 0 ? '• 매칭 실패: <span style="color: #dc3545;">빨간색</span> 표시<br>' : ''}
                ${modifiedUnmatchedCount > 0 ? '• 수정 후 실패: <span style="color: #f59e0b;">노란색</span> 표시' : ''}
            </div>
        </div>
    `;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '닫기';
    closeButton.style.cssText = `
        margin-top: 20px;
        padding: 10px 24px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        width: 100%;
        transition: all 0.2s;
    `;
    
    closeButton.onmouseover = () => {
        closeButton.style.background = '#1d4ed8';
    };
    closeButton.onmouseout = () => {
        closeButton.style.background = '#2563eb';
    };
    
    closeButton.onclick = () => {
        document.body.removeChild(modal);
    };
    
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // ESC 키로 닫기
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
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
        this.showCenterMessage('저장할 데이터가 없습니다. 먼저 주문을 처리해주세요.', 'error');
        return;
    }
    
    // 이미 저장 중인지 확인
    if (window.isSaving) {
        this.showCenterMessage('저장 중입니다. 잠시만 기다려주세요.', 'info');
        return;
    }
    
    window.isSaving = true;
    this.showLoading();
    
    try {
        // 한국 시간 기준 날짜 생성
        const koreaTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
        const year = koreaTime.getFullYear();
        const month = String(koreaTime.getMonth() + 1).padStart(2, '0');
        const day = String(koreaTime.getDate()).padStart(2, '0');
        const sheetName = `${year}${month}${day}`;
        
        console.log('저장할 시트명:', sheetName);
        
// 기존 데이터 가져오기
const getResponse = await fetch(`${this.API_BASE}/api/sheets`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        action: 'getMarketData',
        useMainSpreadsheet: true,
        sheetName: sheetName
    })
});

const getResult = await getResponse.json();
const existingData = getResult.data || [];
        
        console.log(`기존 데이터: ${existingData.length}건`);
        
        // 중복 체크를 위한 키 생성 함수
const createKey = (row) => {
    // 각 필드를 가져오되, 없으면 빈 문자열로 처리
    const orderNo = row['주문번호'] || '';
    const orderer = row['주문자'] || '';
    const recipient = row['수령인'] || row['수취인'] || '';
    const optionName = row['옵션명'] || '';
    
    // 키 생성 - 주문번호_주문자_수령인_옵션명
    return `${orderNo}_${orderer}_${recipient}_${optionName}`;
};
        
        // 기존 데이터 맵 생성 (키 -> 행 인덱스)
        const existingMap = new Map();
        existingData.forEach((row, index) => {
            const key = createKey(row);
            existingMap.set(key, index);
        });
        
// 신규 및 업데이트 데이터 분류
const updateRows = [];
const newRows = [];
const duplicateKeys = [];

this.processedData.data.forEach(row => {
    const key = createKey(row);
    if (existingMap.has(key)) {
        // 중복 발견
        duplicateKeys.push({
            key: key,
            row: row,
            index: existingMap.get(key)
        });
    } else {
        // 신규
        newRows.push(row);
    }
});

console.log(`중복 ${duplicateKeys.length}건, 신규 ${newRows.length}건 발견`);
// ===== 상세 디버깅 추가 =====
console.log('기존 데이터 맵의 모든 키:');
existingMap.forEach((value, key) => {
    console.log(`  [${value}] ${key}`);
});



console.log('신규 데이터 처리 과정:');
this.processedData.data.forEach((row, idx) => {
    const key = createKey(row);
    const isExisting = existingMap.has(key);
    
    if (row['주문자'] === '김준호') {
        console.log(`김준호 발견!`);
        console.log(`  생성된 키: "${key}"`);
        console.log(`  기존 맵에 있나? ${isExisting}`);
        console.log(`  주문번호: "${row['주문번호']}"`);
        console.log(`  수령인: "${row['수령인']}"`);
        console.log(`  옵션명: "${row['옵션명']}"`);
    }
});
// ===== 디버깅 끝 =====

// ===== 여기에 디버깅 코드 추가 =====
console.log('===== 상세 중복 체크 결과 =====');
console.log('전체 처리 데이터:', this.processedData.data.length);
console.log('기존 시트 데이터:', existingData.length);
console.log('중복 발견:', duplicateKeys.length);
console.log('신규:', newRows.length);

// 중복된 항목 상세
if (duplicateKeys.length > 0) {
    console.log('--- 중복 항목 ---');
    duplicateKeys.forEach((d, idx) => {
        console.log(`중복 ${idx + 1}: 주문번호=${d.row['주문번호']}, 수령인=${d.row['수령인'] || d.row['수취인']}, 마켓=${d.row['마켓']}`);
    });
}

// 신규 항목 상세 (처음 5개만)
if (newRows.length > 0) {
    console.log('--- 신규 항목 (최대 5개) ---');
    newRows.slice(0, 5).forEach((row, idx) => {
        const key = createKey(row);
        console.log(`신규 ${idx + 1}: 키=${key}`);
        console.log(`  주문번호=${row['주문번호']}, 수령인=${row['수령인'] || row['수취인']}, 마켓=${row['마켓']}`);
    });
}




console.log('=========================');
// ===== 디버깅 코드 끝 =====


// 중복이 있는 경우 사용자에게 확인
if (duplicateKeys.length > 0) {
    const confirmMessage = 
        `📊 중복 확인\n\n` +
        `🔍 중복 발견: ${duplicateKeys.length}건\n` +
        `✅ 신규 추가: ${newRows.length}건\n\n` +
        `📋 중복 주문 상세 (총 ${duplicateKeys.length}건)\n` +
        duplicateKeys.map((d, idx) => {
            const row = d.row;
            return `${idx + 1}. 주문번호: ${row['주문번호'] || '(없음)'}
   마켓명: ${row['마켓명'] || '-'}
   주문자: ${row['주문자'] || '-'}
   수령인: ${row['수령인'] || row['수취인'] || '-'}
   옵션명: ${row['옵션명'] || '-'}`;
        }).join('\n\n') +
        `\n\n중복된 주문을 덮어쓰시겠습니까?`;
    
    // Promise와 함께 컨펌 모달 표시
    const shouldOverwrite = await new Promise((resolve) => {
        this.showConfirmModal(confirmMessage, 
            () => resolve(true),   // 덮어쓰기 선택
            () => resolve(false)   // 취소 선택
        );
    });
    
    if (shouldOverwrite) {
        // 덮어쓰기 처리
        duplicateKeys.forEach(({ key, row, index }) => {
            updateRows.push({ index, data: row });
        });
        console.log(`사용자가 덮어쓰기 선택: ${duplicateKeys.length}건`);
    } else {
        // 덮어쓰기 거부 - 신규만 추가
        console.log('사용자가 덮어쓰기 거부');
        // updateRows는 비워둠 (덮어쓰기 안함)
    }
}

console.log(`최종 처리: 덮어쓰기 ${updateRows.length}건, 신규 추가 ${newRows.length}건`);
        
// 헤더 행 준비
const headers = this.processedData.headers || this.mappingData.standardFields;

// 전체 데이터 구성 (기존 + 업데이트 + 신규)
const finalData = [...existingData];

// 덮어쓰기 처리
updateRows.forEach(({index, data}) => {
    finalData[index] = data;
});

// 신규 데이터 추가
finalData.push(...newRows);

// 시트 데이터 준비 (헤더 + 데이터)
const values = [headers];
finalData.forEach(row => {
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

// API 호출 - 전체 시트 덮어쓰기
const response = await fetch(`${this.API_BASE}/api/sheets`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        action: 'saveToSheet',
        sheetName: sheetName,
        values: values,
        marketColors: marketColors,
        spreadsheetId: '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg',
        forceTextColumns: ['수령인', '수취인', '주문자전화번호', '수취인전화번호', '수령인전화번호']
    })
});

const result = await response.json();


if (result.success) {
    // 실제 처리된 건수 계산
    const duplicateNotSaved = duplicateKeys.length - updateRows.length;
    const totalOrderCount = finalData.length;
    
    // 중복 주문 상세 정보 생성
    let duplicateDetails = '';
    if (duplicateKeys.length > 0) {
        duplicateDetails = `\n📋 중복 주문 상세\n━━━━━━━━━━━━━━━━━━━━\n`;
        duplicateKeys.forEach((d, idx) => {
            const row = d.row;
            duplicateDetails += `${idx + 1}. 주문번호: ${row['주문번호'] || '(없음)'}
   마켓명: ${row['마켓명'] || '-'}
   주문자: ${row['주문자'] || '-'}
   수령인: ${row['수령인'] || row['수취인'] || '-'}
   옵션명: ${row['옵션명'] || '-'}
   상태: ${updateRows.some(u => u.index === d.index) ? '✅ 덮어쓰기됨' : '❌ 제외됨'}\n\n`;
        });
    }

    const message = 
        `📊 처리 결과\n━━━━━━━━━━━━━━━━━━━━\n` +
        `✅ 신규 추가: ${result.newRows || newRows.length}건\n` +
        `🔍 중복 발견: ${duplicateKeys.length}건\n` +
        `  ㄴ 🔄 덮어쓰기: ${updateRows.length}건\n` +
        duplicateDetails +
        `\n📈 최종 현황\n━━━━━━━━━━━━━━━━━━━━\n` +
        `• 처리 전 주문: ${existingData.length}건\n` +
        `• 처리 후 주문: ${result.totalRows || finalData.length - 1}건\n` +
        `• 증가: +${(result.newRows || newRows.length)}건`;
    
    this.showCenterMessage(message, 'success');
    console.log(message.replace(/\n/g, ' '));
} else {
    console.error('시트 저장 실패:', result.error);
    this.showCenterMessage('시트 저장 실패: ' + (result.error || '알 수 없는 오류'), 'error');
}

// ===== 아래 유지코드 5줄 ===== //
    } catch (error) {
        console.error('저장 중 오류:', error);
        this.showCenterMessage('저장 중 오류 발생: ' + error.message, 'error');
    } finally {
        this.hideLoading();
        window.isSaving = false;
    }
},

// 화면 중앙 메시지 표시 함수 추가
// 화면 중앙 메시지 표시 함수 + 확인 모달 함수 (원본 긴 버전 유지, 중첩 제거)
// OrderExcelHandler 객체의 메서드 레벨에 그대로 붙여넣으세요.

showCenterMessage(message, type, autoClose = false) {
    // 기존 메시지 제거
    const existingMsg = document.getElementById('centerMessageModal');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // 모달 배경
    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'centerMessageModal';
    modalBackdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    // 모달 컨테이너
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #ffffff;
        border-radius: 16px;
        min-width: 800px;
        max-width: 1100px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
    `;
    
    // 색상 설정
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#2563eb'
    };
    const color = colors[type] || colors.info;
    
    // 아이콘과 제목
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };
    const titles = {
        success: '처리 완료',
        error: '오류 발생',
        info: '알림'
    };
    
    // 메시지 파싱
    const lines = String(message || '').split('\n');
    let processedMessage = '<div style="padding: 24px;">';
    
    let inResultSection = false;
    let inDuplicateSection = false;
    let duplicateItems = [];
    let currentItem = null;
    
    lines.forEach((line, lineIndex) => {
        if (line.includes('처리 결과')) {
            processedMessage += `<h3 style="margin: 20px 0 16px; font-size: 16px; font-weight: 600; color: #212529;">${line}</h3>`;
            processedMessage += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px;">';
            inResultSection = true;
            inDuplicateSection = false;
        } else if (line.includes('중복 주문 상세')) {
            if (inResultSection) processedMessage += '</div>';
            processedMessage += `<h3 style="margin: 20px 0 12px; font-size: 16px; font-weight: 600; color: #212529;">${line}</h3>`;
            inResultSection = false;
            inDuplicateSection = true;
            duplicateItems = [];
            currentItem = null;
        } else if (line.includes('최종 현황')) {
            if (inResultSection) processedMessage += '</div>';
            if (inDuplicateSection && duplicateItems.length > 0) {
                processedMessage += `
                    <div style="border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                        <div style="max-height: 300px; overflow-y: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                <thead style="position: sticky; top: 0; background: #f8f9fa;">
                                    <tr>
                                        <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6; width: 35px;">#</th>
                                        <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6; min-width: 120px;">주문번호</th>
                                        <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">마켓명</th>
                                        <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">주문자</th>
                                        <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">수령인</th>
                                        <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">옵션명</th>
                                        <th style="padding: 8px 10px; text-align: center; font-weight: 500; border-bottom: 1px solid #dee2e6; width: 90px;">상태</th>
                                    </tr>
                                </thead>
                                <tbody>`;
                
                duplicateItems.forEach((item, idx) => {
                    const statusBadge = item.status && item.status.includes('덮어쓰기') ? 
                        '<span style="color: #1d4ed8; font-weight: 500;">🔄 덮어쓰기</span>' : 
                        '<span style="color: #dc2626; font-weight: 500;">❌ 제외</span>';
                    
                    const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafafa';
                    
                    processedMessage += `
                        <tr style="background: ${rowBg};">
                            <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.num}</td>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5; font-family: monospace; font-size: 11px;">
                                ${item.orderNo || '(없음)'}
                            </td>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.marketName || '-'}</td>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.orderer || '-'}</td>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.recipient || '-'}</td>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5; font-size: 11px;">${item.option || '-'}</td>
                            <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5; text-align: center;">${statusBadge}</td>
                        </tr>`;
                });
                
                processedMessage += '</tbody></table></div></div>';
            }
            processedMessage += `<h3 style="margin: 20px 0 16px; font-size: 16px; font-weight: 600; color: #212529;">${line}</h3>`;
            processedMessage += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">';
            inResultSection = true;
            inDuplicateSection = false;
        } else if (line.includes('━━━')) {
            // 구분선 무시
        } else if (line.trim()) {
            if (inResultSection) {
                // 통계 카드
                if (line.includes(':')) {
                    const [label, value] = line.split(':').map(s => s.trim());
                    let cardColor = '#f8f9fa';
                    let textColor = '#495057';
                    
                    if (label.includes('✅') || label.includes('신규')) {
                        cardColor = '#d1fae5';
                        textColor = '#059669';
                    } else if (label.includes('🔄') || label.includes('덮어쓰기')) {
                        cardColor = '#dbeafe';
                        textColor = '#1d4ed8';
                    } else if (label.includes('🔍') || label.includes('중복')) {
                        cardColor = '#fef3c7';
                        textColor = '#d97706';
                    }
                    
                    const cleanLabel = label.replace(/[✅🔄🔍📋📈•ㄴ]/g, '').trim();
                    
                    processedMessage += `
                        <div style="background: ${cardColor}; padding: 12px; border-radius: 8px;">
                            <div style="font-size: 12px; color: #6c757d; margin-bottom: 4px;">
                                ${cleanLabel}
                            </div>
                            <div style="font-size: 20px; font-weight: 600; color: ${textColor};">
                                ${value}
                            </div>
                        </div>`;
                }
            } else if (inDuplicateSection) {
                // 중복 항목 파싱
                const trimmedLine = line.trim();
                
                if (/^\d+\./.test(trimmedLine)) {
                    // 새 항목 시작
                    if (currentItem) {
                        duplicateItems.push(currentItem);
                    }
                    currentItem = { 
                        num: trimmedLine.match(/^\d+/)[0],
                        orderNo: '',
                        marketName: '',
                        orderer: '',
                        recipient: '',
                        option: '',
                        status: ''
                    };
                    
                    // 같은 줄에 주문번호가 있을 수 있음 - (없음) 처리 포함
                    if (trimmedLine.includes('주문번호:')) {
                        const parts = trimmedLine.split('주문번호:');
                        if (parts[1]) {
                            const orderValue = parts[1].trim().split(/\s{2,}/)[0];
                            // (없음) 또는 빈 값 처리
                            currentItem.orderNo = (orderValue === '(없음)' || !orderValue) ? '(없음)' : orderValue;
                        }
                    }
                } else if (currentItem) {
                    // 현재 항목에 정보 추가
                    if (trimmedLine.includes('주문번호:') && !currentItem.orderNo) {
                        currentItem.orderNo = trimmedLine.split('주문번호:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('마켓명:')) {
                        currentItem.marketName = trimmedLine.split('마켓명:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('주문자:')) {
                        currentItem.orderer = trimmedLine.split('주문자:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('수령인:')) {
                        currentItem.recipient = trimmedLine.split('수령인:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('옵션명:')) {
                        currentItem.option = trimmedLine.split('옵션명:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('상태:')) {
                        currentItem.status = trimmedLine.split('상태:')[1]?.trim() || '';
                    }
                }
            } else {
                // 일반 텍스트
                processedMessage += `<div style="margin-bottom: 8px; line-height: 1.6;">${line}</div>`;
            }
        }
    });
    
    // 마지막 항목 처리
    if (currentItem && inDuplicateSection) {
        duplicateItems.push(currentItem);
    }
    
    if (inResultSection) processedMessage += '</div>';
    if (inDuplicateSection && duplicateItems.length > 0 && !message.includes('최종 현황')) {
        // 최종 현황이 없는 경우 중복 테이블 생성
        processedMessage += `
            <div style="border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                <div style="max-height: 300px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead style="position: sticky; top: 0; background: #f8f9fa;">
                            <tr>
                                <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6; width: 35px;">#</th>
                                <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6; min-width: 120px;">주문번호</th>
                                <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">마켓명</th>
                                <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">주문자</th>
                                <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">수령인</th>
                                <th style="padding: 8px 10px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">옵션명</th>
                                <th style="padding: 8px 10px; text-align: center; font-weight: 500; border-bottom: 1px solid #dee2e6; width: 90px;">상태</th>
                            </tr>
                        </thead>
                        <tbody>`;
        
        duplicateItems.forEach((item, idx) => {
            const statusBadge = item.status && item.status.includes('덮어쓰기') ? 
                '<span style="color: #1d4ed8; font-weight: 500;">🔄 덮어쓰기</span>' : 
                '<span style="color: #dc2626; font-weight: 500;">❌ 제외</span>';
            
            const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafafa';
            
            processedMessage += `
                <tr style="background: ${rowBg};">
                    <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.num}</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5; font-family: monospace; font-size: 11px;">
                        ${item.orderNo || '(없음)'}
                    </td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.marketName || '-'}</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.orderer || '-'}</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5;">${item.recipient || '-'}</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5; font-size: 11px;">${item.option || '-'}</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #f1f3f5; text-align: center;">${statusBadge}</td>
                </tr>`;
        });
        
        processedMessage += '</tbody></table></div></div>';
    }
    
    processedMessage += '</div>';
    
    // HTML 구성
    modalContent.innerHTML = `
        <div style="
            padding: 20px 24px;
            background: linear-gradient(135deg, ${color}, ${color}dd);
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
        ">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 32px;">${icons[type] || icons.info}</span>
                <h2 style="margin: 0; font-size: 18px; font-weight: 600;">
                    ${titles[type] || titles.info}
                </h2>
            </div>
            <button onclick="document.getElementById('centerMessageModal').remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 28px;
                cursor: pointer;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.2)'" 
               onmouseout="this.style.background='none'">×</button>
        </div>
        
        <div style="max-height: calc(80vh - 140px); overflow-y: auto;">
            ${processedMessage}
        </div>
        
        <div style="
            padding: 16px 24px;
            background: #f8f9fa;
            border-top: 1px solid #dee2e6;
            text-align: right;
        ">
            <button onclick="document.getElementById('centerMessageModal').remove()" style="
                padding: 10px 32px;
                background: ${color};
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: opacity 0.2s;
            " onmouseover="this.style.opacity='0.9'" 
               onmouseout="this.style.opacity='1'">확인</button>
        </div>`;
    
    modalBackdrop.appendChild(modalContent);
    document.body.appendChild(modalBackdrop);
    
    // 애니메이션 스타일
    if (!document.getElementById('modalAnimations')) {
        const style = document.createElement('style');
        style.id = 'modalAnimations';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `;
        document.head.appendChild(style);
    }
    
    // 배경 클릭으로 닫기
    modalBackdrop.onclick = (e) => {
        if (e.target === modalBackdrop) modalBackdrop.remove();
    };
    
    // ESC 키로 닫기
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('centerMessageModal');
            if (modal) modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });

    // 자동 닫기
    if (autoClose) {
        setTimeout(() => {
            const modal = document.getElementById('centerMessageModal');
            if (modal) modal.remove();
        }, 1500);
    }
},  // ← showCenterMessage 끝 (콤마 유지)

showConfirmModal(message, onConfirm, onCancel) {
    // 기존 모달 제거
    const existingModal = document.getElementById('confirmModal');
    if (existingModal) existingModal.remove();
    
    // 모달 배경
    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'confirmModal';
    modalBackdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    // 모달 컨테이너
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #ffffff;
        border-radius: 16px;
        min-width: 700px;
        max-width: 900px;
        width: 80%;
        max-height: 70vh;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
    `;
    
    // 메시지 파싱
    const lines = String(message || '').split('\n');
    let processedMessage = '<div style="padding: 24px;">';
    let duplicateItems = [];
    let currentItem = null;
    let inDuplicateSection = false;
    
    lines.forEach(line => {
        if (line.includes('중복 주문 상세')) {
            processedMessage += `<h3 style="margin: 20px 0 12px; font-size: 16px; font-weight: 600; color: #212529;">${line}</h3>`;
            inDuplicateSection = true;
            duplicateItems = [];
            currentItem = null;
        } else if (line.includes('중복된 주문을 덮어쓰시겠습니까')) {
            if (inDuplicateSection && duplicateItems.length > 0) {
                // 중복 테이블 생성
                processedMessage += `
                    <div style="border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                        <div style="max-height: 250px; overflow-y: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                <thead style="position: sticky; top: 0; background: #f8f9fa;">
                                    <tr>
                                        <th style="padding: 8px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6; width: 35px;">#</th>
                                        <th style="padding: 8px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">주문번호</th>
                                        <th style="padding: 8px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">마켓명</th>
                                        <th style="padding: 8px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">주문자</th>
                                        <th style="padding: 8px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">수령인</th>
                                        <th style="padding: 8px; text-align: left; font-weight: 500; border-bottom: 1px solid #dee2e6;">옵션명</th>
                                    </tr>
                                </thead>
                                <tbody>`;
                
                duplicateItems.forEach((item, idx) => {
                    const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafafa';
                    processedMessage += `
                        <tr style="background: ${rowBg};">
                            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5;">${item.num}</td>
                            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5; font-family: monospace; font-size: 11px;">
                                ${item.orderNo || '(없음)'}
                            </td>
                            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5;">${item.marketName || '-'}</td>
                            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5;">${item.orderer || '-'}</td>
                            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5;">${item.recipient || '-'}</td>
                            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f3f5; font-size: 11px;">${item.option || '-'}</td>
                        </tr>`;
                });
                
                processedMessage += '</tbody></table></div></div>';
            }
            processedMessage += `<div style="margin-top: 20px; padding: 16px; background: #fef3c7; border-radius: 8px; text-align: center;">
                <span style="color: #d97706; font-size: 14px; font-weight: 500;">⚠️ ${line}</span>
            </div>`;
            inDuplicateSection = false;
        } else if (line.trim()) {
            if (inDuplicateSection) {
                const trimmedLine = line.trim();
                
                if (/^\d+\./.test(trimmedLine)) {
                    if (currentItem) {
                        duplicateItems.push(currentItem);
                    }
                    currentItem = { 
                        num: trimmedLine.match(/^\d+/)[0],
                        orderNo: '',
                        marketName: '',
                        orderer: '',
                        recipient: '',
                        option: ''
                    };
                    
                    if (trimmedLine.includes('주문번호:')) {
                        const parts = trimmedLine.split('주문번호:');
                        if (parts[1]) {
                            currentItem.orderNo = parts[1].trim().split(/\s{2,}/)[0] || '';
                        }
                    }
                } else if (currentItem) {
                    if (trimmedLine.includes('주문번호:') && !currentItem.orderNo) {
                        currentItem.orderNo = trimmedLine.split('주문번호:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('마켓명:')) {
                        currentItem.marketName = trimmedLine.split('마켓명:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('주문자:')) {
                        currentItem.orderer = trimmedLine.split('주문자:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('수령인:')) {
                        currentItem.recipient = trimmedLine.split('수령인:')[1]?.trim() || '';
                    } else if (trimmedLine.includes('옵션명:')) {
                        currentItem.option = trimmedLine.split('옵션명:')[1]?.trim() || '';
                    }
                }
            }
        }
    });
    
    if (currentItem && inDuplicateSection) {
        duplicateItems.push(currentItem);
    }

    processedMessage += '</div>';

    // HTML 구성
    modalContent.innerHTML = `
        <div style="
            padding: 20px 24px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
        ">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 32px;">⚠️</span>
                <h2 style="margin: 0; font-size: 18px; font-weight: 600;">중복 확인</h2>
            </div>
        </div>
        
        <div style="max-height: calc(70vh - 180px); overflow-y: auto;">
            ${processedMessage}
        </div>
        
        <div style="
            padding: 20px 24px;
            background: #f8f9fa;
            border-top: 1px solid #dee2e6;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        ">
            <button id="confirmCancel" style="
                padding: 10px 28px;
                background: #ffffff;
                color: #495057;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            ">취소</button>
            <button id="confirmOK" style="
                padding: 10px 28px;
                background: #f59e0b;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            ">덮어쓰기</button>
        </div>`;

    modalBackdrop.appendChild(modalContent);
    document.body.appendChild(modalBackdrop);
    
    // 버튼 이벤트
    document.getElementById('confirmOK').onclick = () => {
        modalBackdrop.remove();
        if (onConfirm) onConfirm();
    };
    
    document.getElementById('confirmCancel').onclick = () => {
        modalBackdrop.remove();
        if (onCancel) onCancel();
    };
    
    // 애니메이션 스타일
    if (!document.getElementById('modalAnimations')) {
        const style = document.createElement('style');
        style.id = 'modalAnimations';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `;
        document.head.appendChild(style);
    }
},  // ← showConfirmModal 끝 (콤마 유지)









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
    } else {
        console.log('로딩 중...');
    }
},

hideLoading() {
    if (window.OrderManage) {
        window.OrderManage.hideLoading();
    } else {
        console.log('로딩 완료');
    }
},

fullReset() {
    this.uploadedFiles = [];
    this.processedData = null;
    this.batchEditData = {};
    
    const container = document.getElementById('om-panel-excel');
    if (container) {
        container.innerHTML = '';
        this.render();
        this.setupEventListeners();
    }
    
    console.log('OrderExcelHandler 완전 초기화 완료');
}
};