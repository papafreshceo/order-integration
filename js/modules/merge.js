// js/modules/merge.js - 앱스크립트와 동일하게 작동하는 버전

window.MergeModule = {
    uploadedFiles: [],
    mappingData: null,
    processedData: null,
    
    // 초기화
    async initialize() {
        console.log('MergeModule 초기화 시작');
        await this.loadMappingData();
        this.setupEventListeners();
        await this.ensureSheetJS();
    },
    
    // 초기화 여부 확인
    isInitialized() {
        return this.mappingData !== null;
    },
    
    // 매핑 데이터 로드 - 앱스크립트의 getMappingData()와 동일
    async loadMappingData() {
        try {
            const response = await fetch('/api/merge-mapping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getMappings' })
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.mappingData = data;
            console.log('매핑 데이터 로드 완료');
            this.displaySupportedMarkets();
            
        } catch (error) {
            console.error('매핑 데이터 로드 오류:', error);
            alert('매핑 데이터를 로드할 수 없습니다: ' + error.message);
            this.mappingData = null;
        }
    },
    
    // 지원 마켓 표시
    displaySupportedMarkets() {
        const container = document.getElementById('supportedMarkets');
        if (!container || !this.mappingData) return;
        
        container.innerHTML = '<h3 style="width: 100%; margin-bottom: 10px;">지원 마켓</h3>';
        
        let marketNames = [];
        if (this.mappingData.marketOrder && this.mappingData.marketOrder.length > 0) {
            marketNames = this.mappingData.marketOrder;
        } else {
            marketNames = Object.keys(this.mappingData.markets);
        }
        
        for (const marketName of marketNames) {
            const market = this.mappingData.markets[marketName];
            if (!market) continue;
            
            const badge = document.createElement('div');
            badge.className = 'market-badge';
            badge.textContent = marketName;
            badge.style.background = `rgb(${market.color})`;
            
            const rgb = market.color.split(',').map(Number);
            const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
            badge.style.color = brightness > 128 ? '#000' : '#fff';
            
            container.appendChild(badge);
        }
    },
    
    // SheetJS 로드
    async ensureSheetJS() {
        if (typeof XLSX !== 'undefined') return;
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // 이벤트 리스너
    setupEventListeners() {
        const uploadArea = document.getElementById('mergeUploadArea');
        const fileInput = document.getElementById('mergeFile');
        
        if (uploadArea) {
            uploadArea.addEventListener('click', () => fileInput?.click());
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                this.handleFiles(e.dataTransfer.files);
            });
        }
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFiles(e.target.files);
            });
        }
    },
    
    // 파일 처리
    async handleFiles(files) {
        if (!this.mappingData) {
            alert('매핑 데이터가 로드되지 않았습니다.');
            return;
        }
        
        const validFiles = Array.from(files).filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            return ['xlsx', 'xls', 'csv'].includes(ext);
        });
        
        for (const file of validFiles) {
            await this.readFile(file);
        }
    },
    
    // 파일 읽기
    async readFile(file) {
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { 
                        type: 'binary',
                        cellDates: true,
                        cellNF: true,
                        cellText: false,
                        dateNF: 'YYYY-MM-DD HH:mm:ss'
                    });
                    
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rawRows = XLSX.utils.sheet_to_json(firstSheet, { 
                        header: 1, 
                        defval: '', 
                        blankrows: false,
                        raw: false,
                        dateNF: 'YYYY-MM-DD HH:mm:ss'
                    });
                    
                    this.processExcelData(rawRows, file);
                    resolve();
                    
                } catch (error) {
                    console.error('파일 파싱 오류:', error);
                    reject(error);
                }
            };
            
            reader.readAsBinaryString(file);
        });
    },
    
    // 엑셀 데이터 처리 - 앱스크립트와 동일
    processExcelData(jsonData, file) {
        const rawRows = jsonData.filter(row => 
            row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );
        
        if (rawRows.length === 0) {
            alert(`${file.name}: 데이터가 없습니다.`);
            return;
        }
        
        // 마켓 감지를 위한 첫 번째 헤더 찾기
        let headerRowIndex = this.findHeaderRow(rawRows);
        const headers = rawRows[headerRowIndex].map(h => String(h || '').trim());
        const firstDataRow = rawRows[headerRowIndex + 1] || [];
        
        // detectMarket 호출 - 앱스크립트와 동일
        const marketName = this.detectMarket(file.name, headers, firstDataRow);
        
        if (!marketName) {
            alert(`${file.name}: 마켓을 인식할 수 없습니다.`);
            return;
        }
        
        // 마켓별 헤더 행 위치 적용
        const market = this.mappingData.markets[marketName];
        if (market && market.headerRow) {
            const marketHeaderRow = market.headerRow - 1; // 1-based to 0-based
            if (rawRows[marketHeaderRow]) {
                headerRowIndex = marketHeaderRow;
            }
        }
        
        const finalHeaders = rawRows[headerRowIndex].map(h => String(h || '').trim());
        const dataRows = rawRows.slice(headerRowIndex + 1);
        
        // 데이터를 객체 배열로 변환
        const processedRows = dataRows.map(row => {
            const obj = {};
            finalHeaders.forEach((header, i) => {
                obj[header] = row[i] !== undefined ? row[i] : '';
            });
            return obj;
        });
        
        // 날짜 확인
        const fileDate = new Date(file.lastModified);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        fileDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today - fileDate) / (1000 * 60 * 60 * 24));
        
        const fileInfo = {
            name: file.name,
            marketName: marketName,
            lastModified: file.lastModified,
            isToday: daysDiff <= 7 && daysDiff >= 0,
            headers: finalHeaders,
            data: processedRows,
            rowCount: processedRows.length
        };
        
        this.uploadedFiles.push(fileInfo);
        this.updateFileList();
    },
    
    // 헤더 행 찾기 - 앱스크립트와 동일
    findHeaderRow(rawRows) {
        const commonHeaders = [
            '주문번호', '상품주문번호', '구매자명', '주문자',
            '수취인', '수취인명', '수취인전화번호', '옵션명',
            '수량', '정산', '결제', '주소', '배송메'
        ];
        
        let bestRow = 0;
        let maxScore = 0;
        const limit = Math.min(rawRows.length, 10);
        
        for (let i = 0; i < limit; i++) {
            const row = rawRows[i];
            if (!Array.isArray(row)) continue;
            
            let score = 0;
            
            for (const cell of row) {
                const text = String(cell || '').trim();
                if (!text) continue;
                
                if (commonHeaders.some(h => text.includes(h))) {
                    score += 3;
                }
                
                if (/[전화|연락|금액|메시지|주소|정산|결제|수수료]/.test(text)) {
                    score += 1;
                }
                
                if (/^\d{1,4}([\/\-.]\d{1,2})?/.test(text)) {
                    score -= 1;
                }
            }
            
            if (score > maxScore) {
                maxScore = score;
                bestRow = i;
            }
        }
        
        return bestRow;
    },
    
    // 마켓 감지 - 앱스크립트의 detectMarket()와 동일
    detectMarket(fileName, headers, firstDataRow) {
        if (!this.mappingData || !this.mappingData.markets) {
            return null;
        }
        
        console.log('Detecting market for:', fileName);
        console.log('Headers:', headers.slice(0, 10));
        
        const fileNameLower = fileName.toLowerCase();
        const headerText = headers.join(' ').toLowerCase();
        
        // detectString1로 체크
        for (const marketName in this.mappingData.markets) {
            const market = this.mappingData.markets[marketName];
            
            if (market.detectString1 && market.detectString1.length > 0) {
                if (fileNameLower.includes(market.detectString1.toLowerCase())) {
                    console.log(`Matched ${marketName} by filename`);
                    return marketName;
                }
            }
        }
        
        // detectString2로 체크
        for (const marketName in this.mappingData.markets) {
            const market = this.mappingData.markets[marketName];
            
            if (market.detectString2 && market.detectString2.length > 0) {
                const detectStrings = market.detectString2.split(',').map(s => s.trim());
                let matchCount = 0;
                
                for (const detectStr of detectStrings) {
                    if (detectStr && headerText.includes(detectStr.toLowerCase())) {
                        matchCount++;
                    }
                }
                
                const requiredMatches = detectStrings.length > 1 ? 2 : 1;
                
                if (matchCount >= requiredMatches) {
                    console.log(`Matched ${marketName} by headers`);
                    return marketName;
                }
            }
        }
        
        console.log('No market matched');
        return null;
    },
    
    // 파일 목록 업데이트
    updateFileList() {
        const fileListDiv = document.getElementById('fileList');
        const fileSummaryDiv = document.getElementById('fileSummary');
        const processBtn = document.getElementById('processMergeBtn');
        const warningBox = document.getElementById('warningBox');
        
        if (!fileListDiv) return;
        
        fileListDiv.innerHTML = '';
        
        if (this.uploadedFiles.length === 0) {
            fileListDiv.style.display = 'none';
            if (fileSummaryDiv) fileSummaryDiv.style.display = 'none';
            if (processBtn) processBtn.style.display = 'none';
            return;
        }
        
        fileListDiv.style.display = 'block';
        
        let totalOrders = 0;
        const marketSet = new Set();
        const oldFiles = [];
        
        // 마켓 순서대로 정렬
        let sortedFiles = [...this.uploadedFiles];
        if (this.mappingData && this.mappingData.marketOrder) {
            sortedFiles.sort((a, b) => {
                const ia = this.mappingData.marketOrder.indexOf(a.marketName);
                const ib = this.mappingData.marketOrder.indexOf(b.marketName);
                if (ia !== -1 && ib !== -1) return ia - ib;
                if (ia !== -1) return -1;
                if (ib !== -1) return 1;
                return a.marketName.localeCompare(b.marketName);
            });
        }
        
        sortedFiles.forEach((file, index) => {
            totalOrders += file.rowCount;
            marketSet.add(file.marketName);
            
            if (!file.isToday) {
                oldFiles.push(file);
            }
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            if (!file.isToday) fileItem.classList.add('warning');
            
            const market = this.mappingData.markets[file.marketName];
            const marketColor = market ? `rgb(${market.color})` : '#999';
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-name-section">
                        <span class="market-tag" style="background: ${marketColor}">
                            ${file.marketName}
                        </span>
                        <span class="file-name">${file.name}</span>
                    </div>
                    <div class="file-details">
                        <span class="file-order-count">${file.rowCount}개 주문</span>
                        <span class="file-date">${new Date(file.lastModified).toLocaleDateString('ko-KR')}</span>
                    </div>
                </div>
                <button class="file-remove" onclick="MergeModule.removeFile(${index})">×</button>
            `;
            
            fileListDiv.appendChild(fileItem);
        });
        
        if (fileSummaryDiv) {
            fileSummaryDiv.style.display = 'flex';
            document.getElementById('totalFiles').textContent = this.uploadedFiles.length;
            document.getElementById('totalMarkets').textContent = marketSet.size;
            document.getElementById('totalOrders').textContent = totalOrders.toLocaleString('ko-KR');
        }
        
        // 경고 박스 표시
        if (warningBox && oldFiles.length > 0) {
            const warningList = document.getElementById('warningList');
            if (warningList) {
                warningList.innerHTML = '';
                oldFiles.forEach(file => {
                    const li = document.createElement('li');
                    li.textContent = `${file.name} (${new Date(file.lastModified).toLocaleDateString('ko-KR')})`;
                    warningList.appendChild(li);
                });
            }
            warningBox.style.display = 'block';
        } else if (warningBox) {
            warningBox.style.display = 'none';
        }
        
        if (processBtn) processBtn.style.display = 'inline-block';
    },
    
    // 파일 제거
    removeFile(index) {
        this.uploadedFiles.splice(index, 1);
        this.updateFileList();
    },
    
    // 주문 처리 - processOrderFiles 호출
    async processFiles() {
        if (this.uploadedFiles.length === 0) {
            alert('업로드된 파일이 없습니다.');
            return;
        }
        
        const todayFiles = this.uploadedFiles.filter(f => f.isToday);
        if (todayFiles.length === 0) {
            alert('오늘 날짜의 파일이 없습니다.');
            return;
        }
        
        try {
            const response = await fetch('/api/merge-process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filesData: todayFiles,
                    mappingData: this.mappingData
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.processedData = result;
                alert(`${result.processedCount}개 주문 통합 완료`);
                this.displayResults(result);
            } else {
                alert('처리 실패: ' + result.error);
            }
            
        } catch (error) {
            console.error('처리 오류:', error);
            alert('처리 중 오류 발생: ' + error.message);
        }
    },
    
    // 결과 표시
    displayResults(result) {
        // 결과 섹션 표시
        const resultSection = document.getElementById('mergeResult');
        if (resultSection) {
            resultSection.style.display = 'block';
        }
        
        // 테이블 표시
        this.displayResultTable(result.data, result.standardFields);
        
        // 통계 표시
        this.displayStatistics(result.statistics);
        
        // 피벗테이블 초기화
        this.initPivotTable();
    },
    
    // 결과 테이블 표시
    displayResultTable(data, standardFields) {
        const tableWrapper = document.getElementById('mergeResultTable');
        if (!tableWrapper || !data || data.length === 0) return;
        
        // 테이블 HTML 생성
        let html = '<table><thead><tr>';
        
        // 헤더
        standardFields.forEach(field => {
            html += `<th>${field}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        // 데이터 (최대 100개)
        const displayData = data.slice(0, 100);
        displayData.forEach(row => {
            html += '<tr>';
            standardFields.forEach(field => {
                const value = row[field] || '';
                if (field === '마켓명') {
                    const market = this.mappingData.markets[value];
                    const color = market ? `rgb(${market.color})` : '#999';
                    html += `<td style="background: ${color}; color: white; font-weight: bold;">${value}</td>`;
                } else {
                    html += `<td>${value}</td>`;
                }
            });
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        
        if (data.length > 100) {
            html += `<p>... 외 ${data.length - 100}개 주문</p>`;
        }
        
        tableWrapper.innerHTML = html;
    },
    
    // 통계 표시
    displayStatistics(statistics) {
        // 마켓별 통계
        this.displayMarketStats(statistics.byMarket);
        
        // 옵션별 통계
        this.displayOptionStats(statistics.byOption);
    },
    
    // 마켓별 통계 표시
    displayMarketStats(marketStats) {
        const container = document.getElementById('marketStatsContainer');
        if (!container) return;
        
        let html = '<h3>마켓별 통계</h3><table class="stat-table"><thead><tr>';
        html += '<th>마켓명</th><th>건수</th><th>수량</th><th>금액</th>';
        html += '</tr></thead><tbody>';
        
        let totalCount = 0, totalQuantity = 0, totalAmount = 0;
        
        Object.keys(marketStats).forEach(market => {
            const stat = marketStats[market];
            html += `<tr>
                <td>${market}</td>
                <td>${stat.count}</td>
                <td>${stat.quantity}</td>
                <td>${stat.amount.toLocaleString()}</td>
            </tr>`;
            
            totalCount += stat.count;
            totalQuantity += stat.quantity;
            totalAmount += stat.amount;
        });
        
        html += `<tr class="total-row">
            <td>합계</td>
            <td>${totalCount}</td>
            <td>${totalQuantity}</td>
            <td>${totalAmount.toLocaleString()}</td>
        </tr>`;
        
        html += '</tbody></table>';
        container.innerHTML = html;
    },
    
    // 옵션별 통계 표시
    displayOptionStats(optionStats) {
        const container = document.getElementById('optionStatsContainer');
        if (!container) return;
        
        let html = '<h3>옵션별 통계</h3><table class="stat-table"><thead><tr>';
        html += '<th>옵션명</th><th>건수</th><th>수량</th><th>금액</th>';
        html += '</tr></thead><tbody>';
        
        let totalCount = 0, totalQuantity = 0, totalAmount = 0;
        
        // 상위 20개만 표시
        const sortedOptions = Object.entries(optionStats)
            .sort((a, b) => b[1].quantity - a[1].quantity)
            .slice(0, 20);
        
        sortedOptions.forEach(([option, stat]) => {
            html += `<tr>
                <td>${option}</td>
                <td>${stat.count}</td>
                <td>${stat.quantity}</td>
                <td>${stat.amount.toLocaleString()}</td>
            </tr>`;
            
            totalCount += stat.count;
            totalQuantity += stat.quantity;
            totalAmount += stat.amount;
        });
        
        html += `<tr class="total-row">
            <td>합계</td>
            <td>${totalCount}</td>
            <td>${totalQuantity}</td>
            <td>${totalAmount.toLocaleString()}</td>
        </tr>`;
        
        html += '</tbody></table>';
        container.innerHTML = html;
    },
    
    // 피벗테이블 초기화
    initPivotTable() {
        const pivotRowField = document.getElementById('pivotRowField');
        const pivotColField = document.getElementById('pivotColField');
        const pivotValueField = document.getElementById('pivotValueField');
        
        if (pivotRowField) {
            pivotRowField.addEventListener('change', () => this.updatePivotTable());
        }
        if (pivotColField) {
            pivotColField.addEventListener('change', () => this.updatePivotTable());
        }
        if (pivotValueField) {
            pivotValueField.addEventListener('change', () => this.updatePivotTable());
        }
        
        // 초기 피벗테이블 생성
        this.updatePivotTable();
    },
    
    // 피벗테이블 업데이트
    updatePivotTable() {
        if (!this.processedData || !this.processedData.data) return;
        
        const rowField = document.getElementById('pivotRowField')?.value || '마켓명';
        const colField = document.getElementById('pivotColField')?.value || 'none';
        const valueField = document.getElementById('pivotValueField')?.value || 'count';
        
        const pivotData = this.createPivotData(this.processedData.data, rowField, colField, valueField);
        this.displayPivotTable(pivotData, rowField, colField, valueField);
    },
    
    // 피벗 데이터 생성
    createPivotData(data, rowField, colField, valueField) {
        const pivot = {};
        const colValues = new Set();
        
        data.forEach(row => {
            const rowKey = row[rowField] || '(빈값)';
            if (!pivot[rowKey]) pivot[rowKey] = {};
            
            if (colField === 'none') {
                if (!pivot[rowKey]['전체']) pivot[rowKey]['전체'] = [];
                pivot[rowKey]['전체'].push(row);
            } else {
                const colKey = row[colField] || '(빈값)';
                colValues.add(colKey);
                if (!pivot[rowKey][colKey]) pivot[rowKey][colKey] = [];
                pivot[rowKey][colKey].push(row);
            }
        });
        
        return {
            data: pivot,
            columns: colField === 'none' ? ['전체'] : Array.from(colValues).sort()
        };
    },
    
    // 피벗테이블 표시
    displayPivotTable(pivotData, rowField, colField, valueField) {
        const container = document.getElementById('pivotTableContainer');
        if (!container) return;
        
        let html = '<table class="pivot-table"><thead><tr>';
        html += `<th>${rowField}</th>`;
        
        pivotData.columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '<th>합계</th></tr></thead><tbody>';
        
        const colTotals = {};
        let grandTotal = 0;
        
        Object.keys(pivotData.data).sort().forEach(rowKey => {
            html += '<tr>';
            html += `<td>${rowKey}</td>`;
            
            let rowTotal = 0;
            
            pivotData.columns.forEach(col => {
                const cellData = pivotData.data[rowKey][col] || [];
                const value = this.calculateValue(cellData, valueField);
                html += `<td>${value.toLocaleString()}</td>`;
                
                rowTotal += value;
                if (!colTotals[col]) colTotals[col] = 0;
                colTotals[col] += value;
            });
            
            html += `<td class="row-total">${rowTotal.toLocaleString()}</td>`;
            html += '</tr>';
            
            grandTotal += rowTotal;
        });
        
        // 합계 행
        html += '<tr class="total-row"><td>합계</td>';
        pivotData.columns.forEach(col => {
            html += `<td>${(colTotals[col] || 0).toLocaleString()}</td>`;
        });
        html += `<td>${grandTotal.toLocaleString()}</td>`;
        html += '</tr></tbody></table>';
        
        container.innerHTML = html;
    },
    
    // 값 계산
    calculateValue(data, valueField) {
        if (valueField === 'count') {
            return data.length;
        }
        
        return data.reduce((sum, row) => {
            const val = parseFloat(row[valueField]) || 0;
            return sum + val;
        }, 0);
    },
    
    // 새로고침
    async refresh() {
        this.uploadedFiles = [];
        this.processedData = null;
        
        const fileListDiv = document.getElementById('fileList');
        if (fileListDiv) fileListDiv.innerHTML = '';
        
        const resultSection = document.getElementById('mergeResult');
        if (resultSection) resultSection.style.display = 'none';
        
        await this.loadMappingData();
    }
};

// 전역 함수로 등록
window.processMerge = function() {
    MergeModule.processFiles();
};
