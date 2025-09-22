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
                    padding: 20px;
                    background: transparent;
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
                    padding: 8px 16px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    background: #ffffff;
                    color: #212529;
                    font-size: 14px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin: 0 4px;
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
                
                /* 결과 섹션 */
                .result-section {
                    display: none;
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 24px;
                    margin-top: 24px;
                }
                
                .result-section.show {
                    display: block;
                }
                
                .result-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #dee2e6;
                }
                
                /* 테이블 */
                .table-wrapper {
                    overflow: auto;
                    max-height: 600px;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
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
                <div class="result-section" id="resultSection">
                    <div class="result-header">
                        <div>
                            <button class="btn-action btn-reset" onclick="OrderExcelHandler.resetResults()">초기화</button>
                            <button class="btn-action" onclick="OrderExcelHandler.openBatchEdit()">옵션명 일괄수정</button>
                            <button class="btn-action" onclick="OrderExcelHandler.verifyOptions()">옵션명 검증</button>
                            <button class="btn-action" onclick="OrderExcelHandler.verifyDuplicate()">중복발송검증</button>
                        </div>
                        <div>
                            <button class="btn-action" onclick="OrderExcelHandler.exportExcel()">엑셀 다운로드</button>
                            <button class="btn-action btn-save" onclick="OrderExcelHandler.saveToSheets()">저장</button>
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
        
        container.innerHTML = '<h3 style="margin: 0 0 12px 0; font-size: 16px;">지원 마켓</h3>';
        
        const markets = this.mappingData.markets || {};
        const marketOrder = this.mappingData.marketOrder || Object.keys(markets);
        
        marketOrder.forEach(marketName => {
            const market = markets[marketName];
            if (!market) return;
            
            const badge = document.createElement('div');
            badge.className = 'market-badge';
            badge.textContent = marketName;
            badge.style.background = `rgb(${market.color})`;
            
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
                    const arr = new Uint8Array(e.target.result);
                    workbook = XLSX.read(arr, { 
                        type: 'array',
                        cellDates: true,
                        cellNF: true,
                        cellText: false,
                        codepage: 949
                    });
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
        
        if (file.name.toLowerCase().endsWith('.csv')) {
            reader.readAsText(file, 'utf-8');
        } else if (file.name.toLowerCase().endsWith('.xls')) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsBinaryString(file);
        }
    },
    
    async processExcelData(rawRows, file) {
        const cleanRows = rawRows.filter(row => 
            row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );
        
        if (cleanRows.length === 0) {
            this.showError(`${file.name}: 데이터가 없습니다.`);
            return;
        }
        
        // 헤더 위치 판단
        let headerRowIndex = 0;
        const fileName = file.name.toLowerCase();
        
        if (fileName.includes('스마트스토어') && cleanRows.length > 1) {
            headerRowIndex = 1;
        }
        
        const headers = cleanRows[headerRowIndex].map(h => String(h || '').trim());
        const dataRows = cleanRows.slice(headerRowIndex + 1);
        
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
            
            const orderCount = document.createElement('span');
            orderCount.style.color = '#6c757d';
            orderCount.textContent = `${file.rowCount}개 주문`;
            
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
                    mappedRow['정산예정금액'] = this.calculateSettlement(mappedRow, market.settlementFormula);
                }
                
                mergedData.push(mappedRow);
            });
        }
        
        return mergedData;
    },
    
    calculateSettlement(row, formula) {
        try {
            let calculation = formula;
            
            // 필드명을 값으로 치환
            Object.entries(row).forEach(([field, value]) => {
                const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
                calculation = calculation.replace(new RegExp(field, 'g'), numValue);
            });
            
            // 계산 실행
            return eval(calculation) || 0;
        } catch (error) {
            return 0;
        }
    },
    
    displayResults() {
        const resultSection = document.getElementById('resultSection');
        resultSection.classList.add('show');
        
        const thead = document.getElementById('excelResultHead');
        const tbody = document.getElementById('excelResultBody');
        
        // 헤더 생성
        const headerRow = document.createElement('tr');
        const fixedEndIndex = this.processedData.headers.indexOf('수령인전화번호') || 
                             this.processedData.headers.indexOf('수취인전화번호') || 10;
        
        this.processedData.headers.forEach((header, index) => {
            const th = document.createElement('th');
            th.textContent = header;
            
            if (index <= fixedEndIndex) {
                th.classList.add('fixed-column');
                th.style.left = index * 120 + 'px';
                if (index === fixedEndIndex) {
                    th.classList.add('fixed-column-last');
                }
            }
            
            headerRow.appendChild(th);
        });
        thead.innerHTML = '';
        thead.appendChild(headerRow);
        
        // 바디 생성
        tbody.innerHTML = '';
        this.processedData.data.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            
            this.processedData.headers.forEach((header, colIndex) => {
                const td = document.createElement('td');
                let value = row[header] || '';
                
                // 고정 컬럼 처리
                if (colIndex <= fixedEndIndex) {
                    td.classList.add('fixed-column');
                    td.style.left = colIndex * 120 + 'px';
                    if (colIndex === fixedEndIndex) {
                        td.classList.add('fixed-column-last');
                    }
                }
                
                // 마켓명 셀 색상
                if (header === '마켓명' && this.mappingData?.markets?.[value]) {
                    const market = this.mappingData.markets[value];
                    td.style.background = `rgb(${market.color})`;
                    const rgb = market.color.split(',').map(Number);
                    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
                    td.style.color = brightness > 128 ? '#000' : '#fff';
                    td.style.fontWeight = 'bold';
                }
                
                // 옵션명 매칭 상태 표시
                if (header === '옵션명') {
                    if (row['_matchStatus'] === 'unmatched') {
                        td.classList.add('unmatched-cell', 'editable-cell');
                        td.contentEditable = true;
                        
                        td.addEventListener('blur', () => {
                            row['옵션명'] = td.textContent.trim();
                            row['_matchStatus'] = 'modified';
                            td.classList.remove('unmatched-cell');
                            td.classList.add('modified-cell');
                        });
                    } else if (row['_matchStatus'] === 'modified') {
                        td.classList.add('modified-cell');
                    }
                }
                
                // 금액 포맷팅
                if (header.includes('금액') || header.includes('공급가')) {
                    const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
                    if (!isNaN(numValue)) {
                        value = numValue.toLocaleString('ko-KR');
                    }
                }
                
                td.textContent = String(value);
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
        
        const result = await this.ProductMatching.verifyOptions();
        this.displayResults();
        this.showSuccess(result.message || '옵션명 검증 완료');
    },
    
    async verifyDuplicate() {
        if (!this.processedData) {
            this.showError('검증할 데이터가 없습니다.');
            return;
        }
        
        this.showLoading();
        
        try {
            // 7일간 데이터 조회
            const dates = [];
            for (let i = 1; i <= 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                dates.push(date.toISOString().slice(0, 10).replace(/-/g, ''));
            }
            
            const pastOrders = [];
            for (const sheetName of dates) {
                try {
                    const response = await fetch(`${this.API_BASE}/api/sheets`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'getOrdersByDate',
                            sheetName: sheetName
                        })
                    });
                    
                    const result = await response.json();
                    if (result.data && result.data.length > 0) {
                        pastOrders.push(...result.data);
                    }
                } catch (error) {
                    console.log(`${sheetName} 조회 실패:`, error);
                }
            }
            
            // 중복 검증
            let duplicateCount = 0;
            this.processedData.data.forEach(order => {
                const orderNo = String(order['주문번호'] || '').trim();
                const recipient = String(order['수령인'] || order['수취인'] || '').trim();
                
                const isDuplicate = pastOrders.some(past => 
                    String(past['주문번호']).trim() === orderNo &&
                    String(past['수령인'] || past['수취인']).trim() === recipient
                );
                
                if (isDuplicate) {
                    order['_duplicateStatus'] = 'duplicate';
                    duplicateCount++;
                }
            });
            
            this.displayResults();
            this.showSuccess(`중복발송 검증 완료: ${duplicateCount}건 중복 발견`);
            
        } catch (error) {
            this.showError('중복 검증 중 오류 발생');
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
        if (!this.processedData) {
            this.showError('저장할 데이터가 없습니다.');
            return;
        }
        
        this.showLoading();
        
        try {
            const values = [this.processedData.headers];
            this.processedData.data.forEach(row => {
                values.push(this.processedData.headers.map(h => row[h] || ''));
            });
            
            const response = await fetch(`${this.API_BASE}/api/sheets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'saveToSheet',
                    sheetName: this.processedData.sheetName,
                    values: values
                })
            });
            
            const result = await response.json();
            if (result.success) {
                this.showSuccess('구글 시트에 저장되었습니다.');
            } else {
                this.showError('저장 실패: ' + result.error);
            }
        } catch (error) {
            this.showError('저장 중 오류 발생');
        } finally {
            this.hideLoading();
        }
    },
    
    resetResults() {
        if (!confirm('결과를 초기화하시겠습니까?')) return;
        
        this.processedData = null;
        document.getElementById('resultSection').classList.remove('show');
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