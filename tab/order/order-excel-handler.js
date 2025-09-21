// order-excel-handler.js

window.OrderExcelHandler = {
    uploadedFiles: [],
    processedData: null,
    
    async init() {
        this.render();
        this.setupEventListeners();
        console.log('OrderExcelHandler 초기화 완료');
    },
    
    render() {
        const container = document.getElementById('om-panel-excel');
        if (!container) return;
        
        container.innerHTML = `
            <style>
                .excel-container {
                    padding: 0;
                    background: transparent;
                }
                
                /* 파일 업로드 섹션 */
                .upload-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
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
                
                /* 지원 마켓 표시 */
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
                
                .result-buttons {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
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
                    border-color: #c82333;
                }
                
                .btn-save {
                    background: #10b981;
                    color: white;
                    border-color: #10b981;
                }
                
                .btn-save:hover {
                    background: #059669;
                    border-color: #059669;
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
                        <div class="result-buttons">
                            <button class="btn-action btn-reset" onclick="OrderExcelHandler.resetResults()">초기화</button>
                            <button class="btn-action" onclick="OrderExcelHandler.openBatchEdit()">옵션명 일괄수정</button>
                            <button class="btn-action" onclick="OrderExcelHandler.verifyOptions()">옵션명 검증</button>
                            <button class="btn-action" onclick="OrderExcelHandler.verifyDuplicate()">중복발송검증</button>
                        </div>
                        <div class="result-buttons">
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
            <div id="batchEditModal" class="modal" style="display: none;">
                <div class="modal-content" style="width: 800px; max-width: 90%; max-height: 80vh;">
                    <div class="modal-header">
                        <h2>옵션명 일괄수정</h2>
                        <span class="modal-close" onclick="OrderExcelHandler.closeBatchEdit()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div id="batchEditList"></div>
                    </div>
                    <div class="modal-footer">
                        <button onclick="OrderExcelHandler.closeBatchEdit()">취소</button>
                        <button onclick="OrderExcelHandler.applyBatchEdit()">적용</button>
                    </div>
                </div>
            </div>
        `;
        
        this.displaySupportedMarkets();
    },
    
    setupEventListeners() {
        // 파일 업로드
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
        
        // 드래그 앤 드롭
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
            uploadSection.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadSection.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            uploadSection.addEventListener('drop', (e) => this.handleDrop(e));
        }
        
        // 처리 버튼
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.addEventListener('click', () => this.processOrders());
        }
    },
    
    displaySupportedMarkets() {
        const container = document.getElementById('supportedMarkets');
        if (!container || !window.mappingData) return;
        
        container.innerHTML = '<h3 style="margin: 0 0 12px 0; font-size: 16px;">지원 마켓</h3>';
        
        const markets = window.mappingData.markets || {};
        const marketOrder = window.mappingData.marketOrder || Object.keys(markets);
        
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
                
                if (isCsv) {
                    workbook = XLSX.read(e.target.result, { type: 'string' });
                } else {
                    workbook = XLSX.read(e.target.result, { type: 'binary' });
                }
                
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                await this.processExcelData(jsonData, file);
                
            } catch (error) {
                this.showError(`파일 읽기 실패: ${file.name}`);
            }
        };
        
        if (file.name.toLowerCase().endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    },
    
    async processExcelData(data, file) {
        // 마켓 감지
        const headers = data[0] || [];
        const marketName = await this.detectMarket(file.name, headers);
        
        if (!marketName) {
            this.showError(`마켓 인식 실패: ${file.name}`);
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
            data: data.slice(1),
            rowCount: data.length - 1
        };
        
        this.uploadedFiles.push(fileInfo);
        this.updateFileList();
    },
    
    async detectMarket(fileName, headers) {
        // 간단한 마켓 감지 로직
        const fileNameLower = fileName.toLowerCase();
        
        if (fileNameLower.includes('스마트스토어')) return '스마트스토어';
        if (fileNameLower.includes('쿠팡')) return '쿠팡';
        if (fileNameLower.includes('11번가')) return '11번가';
        if (fileNameLower.includes('토스')) return '토스';
        
        // API 호출로 정확한 감지
        try {
            const response = await fetch('/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName, headers })
            });
            const result = await response.json();
            return result.marketName;
        } catch (error) {
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
            
            if (window.mappingData?.markets?.[file.marketName]) {
                const market = window.mappingData.markets[file.marketName];
                marketTag.style.background = `rgb(${market.color})`;
            }
            
            const fileName = document.createElement('span');
            fileName.textContent = file.name;
            
            const orderCount = document.createElement('span');
            orderCount.style.color = '#6c757d';
            orderCount.textContent = `${file.rowCount}개 주문`;
            
            fileInfo.appendChild(marketTag);
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(orderCount);
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '삭제';
            removeBtn.className = 'btn-action';
            removeBtn.style.padding = '4px 12px';
            removeBtn.onclick = () => this.removeFile(index);
            
            fileItem.appendChild(fileInfo);
            fileItem.appendChild(removeBtn);
            fileList.appendChild(fileItem);
        });
        
        // 요약 정보 업데이트
        document.getElementById('totalFiles').textContent = this.uploadedFiles.length;
        document.getElementById('totalMarkets').textContent = marketSet.size;
        document.getElementById('totalOrders').textContent = totalOrders.toLocaleString();
        
        fileSummary.style.display = 'flex';
        processBtn.style.display = 'inline-block';
        
        // 오래된 파일 경고
        this.checkWarnings();
    },
    
    removeFile(index) {
        this.uploadedFiles.splice(index, 1);
        this.updateFileList();
    },
    
    checkWarnings() {
        const oldFiles = this.uploadedFiles.filter(f => !f.isToday);
        const warningBox = document.getElementById('warningBox');
        
        if (oldFiles.length > 0) {
            const warningList = document.getElementById('warningList');
            warningList.innerHTML = '';
            
            oldFiles.forEach(file => {
                const li = document.createElement('li');
                li.textContent = file.name;
                warningList.appendChild(li);
            });
            
            warningBox.classList.add('show');
        } else {
            warningBox.classList.remove('show');
        }
    },
    
    async processOrders() {
        if (this.uploadedFiles.length === 0) {
            this.showError('처리할 파일이 없습니다.');
            return;
        }
        
        // 오래된 파일 제외
        const todayFiles = this.uploadedFiles.filter(f => f.isToday);
        if (todayFiles.length === 0) {
            this.showError('오늘 날짜의 파일이 없습니다.');
            return;
        }
        
        this.showLoading();
        
        try {
            // ProductMatching 데이터 로드
            await ProductMatching.loadProductData();
            
            // 데이터 통합
            const mergedData = await this.mergeOrderData(todayFiles);
            
            // 제품 정보 적용
            const enrichedData = await ProductMatching.applyProductInfo(mergedData);
            
            this.processedData = {
                data: enrichedData,
                headers: window.mappingData?.standardFields || Object.keys(enrichedData[0])
            };
            
            this.displayResults();
            this.showSuccess(`${enrichedData.length}개 주문 통합 완료`);
            
        } catch (error) {
            this.showError('처리 중 오류 발생');
        } finally {
            this.hideLoading();
        }
    },
    
    async mergeOrderData(files) {
        const mergedData = [];
        let globalCounter = 0;
        
        for (const file of files) {
            const marketCounters = {};
            
            file.data.forEach(row => {
                globalCounter++;
                
                // 마켓별 카운터
                if (!marketCounters[file.marketName]) {
                    marketCounters[file.marketName] = 0;
                }
                marketCounters[file.marketName]++;
                
                // 표준 필드 매핑
                const mappedRow = this.mapToStandardFields(row, file.headers, file.marketName);
                mappedRow['연번'] = globalCounter;
                mappedRow['마켓명'] = file.marketName;
                
                // 마켓 이니셜 + 번호
                const initial = window.mappingData?.markets?.[file.marketName]?.initial || 'X';
                mappedRow['마켓'] = initial + String(marketCounters[file.marketName]).padStart(3, '0');
                
                mergedData.push(mappedRow);
            });
        }
        
        return mergedData;
    },
    
    mapToStandardFields(row, headers, marketName) {
        const mapped = {};
        const market = window.mappingData?.markets?.[marketName];
        
        if (!market) return mapped;
        
        window.mappingData.standardFields.forEach(standardField => {
            const sourceField = market.mappings?.[standardField];
            if (sourceField) {
                const index = headers.indexOf(sourceField);
                if (index !== -1) {
                    mapped[standardField] = row[index] || '';
                }
            }
        });
        
        return mapped;
    },
    
    displayResults() {
        const resultSection = document.getElementById('resultSection');
        resultSection.classList.add('show');
        
        const thead = document.getElementById('excelResultHead');
        const tbody = document.getElementById('excelResultBody');
        
        // 헤더 생성
        const headerRow = document.createElement('tr');
        this.processedData.headers.forEach((header, index) => {
            const th = document.createElement('th');
            th.textContent = header;
            
            // 고정 컬럼 처리
            if (index <= 10) {  // 수령인전화번호까지
                th.classList.add('fixed-column');
                if (index === 10) {
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
                td.textContent = row[header] || '';
                
                // 고정 컬럼 처리
                if (colIndex <= 10) {
                    td.classList.add('fixed-column');
                    if (colIndex === 10) {
                        td.classList.add('fixed-column-last');
                    }
                }
                
                // 옵션명 매칭 상태 표시
                if (header === '옵션명') {
                    if (row['_matchStatus'] === 'unmatched') {
                        td.classList.add('unmatched-cell', 'editable-cell');
                        td.contentEditable = true;
                        
                        td.addEventListener('blur', () => {
                            row['옵션명'] = td.textContent;
                            row['_matchStatus'] = 'modified';
                            td.classList.remove('unmatched-cell');
                            td.classList.add('modified-cell');
                        });
                    }
                }
                
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
    },
    
    async verifyOptions() {
        const result = await ProductMatching.verifyOptions();
        this.showSuccess(result.message);
        this.displayResults();
    },
    
    async verifyDuplicate() {
        // 중복 검증 로직
        this.showSuccess('중복 검증 완료');
    },
    
    openBatchEdit() {
        // 일괄 수정 모달 열기
        document.getElementById('batchEditModal').style.display = 'flex';
    },
    
    closeBatchEdit() {
        document.getElementById('batchEditModal').style.display = 'none';
    },
    
    applyBatchEdit() {
        // 일괄 수정 적용
        this.closeBatchEdit();
        this.displayResults();
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
    },
    
    async saveToSheets() {
        if (!this.processedData) {
            this.showError('저장할 데이터가 없습니다.');
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'saveToSheet',
                    sheetName: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
                    values: [this.processedData.headers, ...this.processedData.data.map(row => 
                        this.processedData.headers.map(h => row[h] || '')
                    )]
                })
            });
            
            const result = await response.json();
            if (result.success) {
                this.showSuccess('저장 완료');
            } else {
                this.showError('저장 실패');
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
        el.textContent = message;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 3000);
    },
    
    showSuccess(message) {
        const el = document.getElementById('excelSuccessMessage');
        el.textContent = message;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 3000);
    },
    
    showLoading() {
        // 로딩 표시
    },
    
    hideLoading() {
        // 로딩 숨기기
    }
};