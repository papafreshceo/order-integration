// js/modules/merge.js - 주문통합 모듈 (동적 매핑)

window.MergeModule = {
    uploadedFiles: [],
    mappingData: null,
    processedData: null,
    initialized: false,
    
    // 초기화 확인
    isInitialized() {
        return this.initialized;
    },
    
    // 초기화
    async initialize() {
        console.log('MergeModule 초기화 시작');
        
        try {
            // 매핑 데이터 로드
            await this.loadMappingData();
            
            // SheetJS 로드
            await this.ensureSheetJS();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            this.initialized = true;
            console.log('MergeModule 초기화 완료');
            
        } catch (error) {
            console.error('MergeModule 초기화 실패:', error);
            if (typeof ToastManager !== 'undefined') {
                ToastManager.error('시스템 초기화에 실패했습니다');
            }
        }
    },
    
    // 매핑 데이터 로드 (동적)
    async loadMappingData() {
        try {
            console.log('매핑 데이터 로드 시작');
            
            const response = await fetch('/api/merge-mapping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getMappings' })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || '매핑 데이터 로드 실패');
            }
            
            this.mappingData = data;
            console.log('매핑 데이터 로드 완료:', {
                markets: Object.keys(data.markets || {}).length,
                fields: (data.standardFields || []).length
            });
            
        } catch (error) {
            console.error('매핑 데이터 로드 오류:', error);
            
            // 사용자에게 알림
            if (typeof ToastManager !== 'undefined') {
                ToastManager.error('매핑 데이터를 불러올 수 없습니다. 관리자에게 문의하세요.');
            } else {
                alert('매핑 데이터를 로드할 수 없습니다: ' + error.message);
            }
            
            // 매핑 데이터 없이는 진행 불가
            this.mappingData = null;
            throw error;
        }
    },
    
    // 새로고침
    async refresh() {
        console.log('MergeModule 새로고침');
        
        // 매핑 데이터 다시 로드
        await this.loadMappingData();
        
        // 업로드된 파일 초기화
        this.uploadedFiles = [];
        this.processedData = null;
        
        // UI 초기화
        const fileList = document.getElementById('fileList');
        const fileSummary = document.getElementById('fileSummary');
        const processBtn = document.getElementById('processMergeBtn');
        const mergeResult = document.getElementById('mergeResult');
        
        if (fileList) {
            fileList.innerHTML = '';
            fileList.style.display = 'none';
        }
        if (fileSummary) {
            fileSummary.style.display = 'none';
        }
        if (processBtn) {
            processBtn.style.display = 'none';
        }
        if (mergeResult) {
            mergeResult.innerHTML = '';
        }
        
        console.log('MergeModule 새로고침 완료');
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
    
    // 이벤트 리스너 설정
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
            alert('매핑 데이터가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
            
            // 매핑 데이터 재로드 시도
            try {
                await this.loadMappingData();
            } catch (error) {
                return;
            }
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
    
    // 엑셀 데이터 처리
    processExcelData(jsonData, file) {
        const rawRows = jsonData.filter(row => 
            row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );
        
        if (rawRows.length === 0) {
            alert(`${file.name}: 데이터가 없습니다.`);
            return;
        }
        
        // 헤더 행 찾기
        let headerRowIndex = this.findHeaderRow(rawRows);
        const headers = rawRows[headerRowIndex].map(h => String(h || '').trim());
        const firstDataRow = rawRows[headerRowIndex + 1] || [];
        
        // 마켓 감지
        const marketName = this.detectMarket(file.name, headers, firstDataRow);
        
        if (!marketName) {
            alert(`${file.name}: 마켓을 인식할 수 없습니다.`);
            return;
        }
        
        // 마켓별 헤더 행 위치 적용
        const market = this.mappingData.markets[marketName];
        if (market && market.headerRow) {
            const marketHeaderRow = market.headerRow - 1;
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
    
    // 헤더 행 찾기
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
    
    // 마켓 감지 (동적)
    detectMarket(fileName, headers, firstDataRow) {
        if (!this.mappingData || !this.mappingData.markets) {
            return null;
        }
        
        console.log('Detecting market for:', fileName);
        
        const fileNameLower = fileName.toLowerCase();
        const headerText = headers.join(' ').toLowerCase();
        
        // detectString1로 체크 (파일명)
        for (const marketName in this.mappingData.markets) {
            const market = this.mappingData.markets[marketName];
            
            if (market.detectString1 && market.detectString1.length > 0) {
                if (fileNameLower.includes(market.detectString1.toLowerCase())) {
                    console.log(`Matched ${marketName} by filename`);
                    return marketName;
                }
            }
        }
        
        // detectString2로 체크 (헤더)
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
        
        if (processBtn) processBtn.style.display = 'inline-block';
    },
    
    // 파일 제거
    removeFile(index) {
        this.uploadedFiles.splice(index, 1);
        this.updateFileList();
    },
    
    // 주문 처리
    async processFiles() {
        if (!this.mappingData) {
            alert('매핑 데이터가 로드되지 않았습니다.');
            return;
        }
        
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
            if (typeof LoadingManager !== 'undefined') {
                LoadingManager.showFullLoading();
            }
            
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
                
                if (typeof ToastManager !== 'undefined') {
                    ToastManager.success(`${result.processedCount}개 주문 통합 완료`);
                } else {
                    alert(`${result.processedCount}개 주문 통합 완료`);
                }
                
                // 결과 표시
                this.displayResult(result);
                
            } else {
                throw new Error(result.error || '처리 실패');
            }
            
        } catch (error) {
            console.error('처리 오류:', error);
            if (typeof ToastManager !== 'undefined') {
                ToastManager.error('처리 중 오류 발생: ' + error.message);
            } else {
                alert('처리 중 오류 발생: ' + error.message);
            }
        } finally {
            if (typeof LoadingManager !== 'undefined') {
                LoadingManager.hideFullLoading();
            }
        }
    },
    
    // 결과 표시
    displayResult(result) {
        const resultDiv = document.getElementById('mergeResult');
        if (!resultDiv) return;
        
        // 통계 표시
        let statsHTML = '<div class="merge-stats">';
        statsHTML += '<h3>처리 결과</h3>';
        statsHTML += `<p>총 ${result.processedCount}개 주문 처리 완료</p>`;
        
        if (result.statistics) {
            statsHTML += '<h4>마켓별 통계</h4>';
            statsHTML += '<table class="stats-table">';
            statsHTML += '<thead><tr><th>마켓</th><th>주문수</th><th>수량</th><th>금액</th></tr></thead>';
            statsHTML += '<tbody>';
            
            for (const [market, stats] of Object.entries(result.statistics.byMarket)) {
                statsHTML += `<tr>
                    <td>${market}</td>
                    <td>${stats.count}</td>
                    <td>${stats.quantity}</td>
                    <td>${stats.amount.toLocaleString('ko-KR')}원</td>
                </tr>`;
            }
            
            statsHTML += '</tbody></table>';
        }
        
        statsHTML += '</div>';
        
        // 내보내기 버튼
        statsHTML += '<div class="export-buttons">';
        statsHTML += '<button class="btn" onclick="MergeModule.exportToSheets()">Google Sheets로 저장</button>';
        statsHTML += '<button class="btn" onclick="MergeModule.downloadExcel()">Excel 다운로드</button>';
        statsHTML += '</div>';
        
        resultDiv.innerHTML = statsHTML;
    },
    
    // Google Sheets로 내보내기
    async exportToSheets() {
        if (!this.processedData) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }
        
        try {
            if (typeof LoadingManager !== 'undefined') {
                LoadingManager.showFullLoading();
            }
            
            const response = await fetch('/api/merge-export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: this.processedData.data,
                    sheetName: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
                    standardFields: this.processedData.standardFields
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (typeof ToastManager !== 'undefined') {
                    ToastManager.success('Google Sheets에 저장되었습니다');
                } else {
                    alert('Google Sheets에 저장되었습니다');
                }
                
                // URL이 있으면 새 탭에서 열기
                if (result.url) {
                    window.open(result.url, '_blank');
                }
            } else {
                throw new Error(result.error || '저장 실패');
            }
            
        } catch (error) {
            console.error('내보내기 오류:', error);
            if (typeof ToastManager !== 'undefined') {
                ToastManager.error('내보내기 실패: ' + error.message);
            } else {
                alert('내보내기 실패: ' + error.message);
            }
        } finally {
            if (typeof LoadingManager !== 'undefined') {
                LoadingManager.hideFullLoading();
            }
        }
    },
    
    // Excel 다운로드
    downloadExcel() {
        if (!this.processedData || !this.processedData.data) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }
        
        try {
            // 워크북 생성
            const wb = XLSX.utils.book_new();
            
            // 워크시트 생성
            const ws = XLSX.utils.json_to_sheet(this.processedData.data);
            
            // 워크시트를 워크북에 추가
            const sheetName = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            
            // 파일 다운로드
            XLSX.writeFile(wb, `주문통합_${sheetName}.xlsx`);
            
            if (typeof ToastManager !== 'undefined') {
                ToastManager.success('Excel 파일이 다운로드되었습니다');
            }
            
        } catch (error) {
            console.error('Excel 다운로드 오류:', error);
            if (typeof ToastManager !== 'undefined') {
                ToastManager.error('다운로드 실패: ' + error.message);
            } else {
                alert('다운로드 실패: ' + error.message);
            }
        }
    }
};

// 전역 함수
window.processMerge = function() {
    MergeModule.processFiles();
};

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 주문통합 탭이 활성화되면 초기화
    const mergeTab = document.getElementById('merge');
    if (mergeTab && mergeTab.classList.contains('active')) {
        MergeModule.initialize();
    }
});
