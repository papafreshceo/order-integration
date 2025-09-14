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
            
        } catch (error) {
            console.error('매핑 데이터 로드 오류:', error);
            alert('매핑 데이터를 로드할 수 없습니다: ' + error.message);
            this.mappingData = null;
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
    
    // 엑셀 데이터 처리 - 앱스크립트 HTML과 동일
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
            } else {
                alert('처리 실패: ' + result.error);
            }
            
        } catch (error) {
            console.error('처리 오류:', error);
            alert('처리 중 오류 발생: ' + error.message);
        }
    }
};

// 전역 함수
window.processMerge = function() {
    MergeModule.processFiles();
};

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    MergeModule.initialize();
});
