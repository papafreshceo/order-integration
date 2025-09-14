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
                if (fileNameLower.includes(market.detectString1.toLower
