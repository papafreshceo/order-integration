// js/modules/merge.js - 주문통합 모듈

window.MergeModule = {
    uploadedFiles: [],
    mappingData: null, // 매핑 데이터 캐시
    
    // 초기화
    async initialize() {
        this.setupEventListeners();
        await this.loadMappingData(); // 매핑 데이터 로드
        console.log('MergeModule 초기화 완료');
    },
    
    // 매핑 데이터 로드
    async loadMappingData() {
        try {
            const response = await fetch('/api/merge-mapping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'getMappings' })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.mappingData = data;
                    console.log('매핑 데이터 로드 완료:', this.mappingData);
                } else {
                    console.error('매핑 데이터 로드 실패:', data.error);
                }
            }
        } catch (error) {
            console.error('매핑 데이터 로드 오류:', error);
            // 로드 실패시 기본값 사용
            this.mappingData = null;
        }
    },
    
    // 이벤트 리스너 설정
    setupEventListeners() {
        const uploadArea = document.getElementById('mergeUploadArea');
        const fileInput = document.getElementById('mergeFile');
        
        if (uploadArea) {
            // 클릭 이벤트
            uploadArea.addEventListener('click', () => {
                fileInput.click();
            });
            
            // 드래그 앤 드롭
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
    handleFiles(files) {
        const validFiles = Array.from(files).filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            return ['xlsx', 'xls', 'csv'].includes(ext);
        });
        
        if (validFiles.length === 0) {
            alert('엑셀 또는 CSV 파일만 업로드 가능합니다.');
            return;
        }
        
        validFiles.forEach(file => this.readFile(file));
    },
    
    // 파일 읽기
    async readFile(file) {
        try {
            // SheetJS 라이브러리 로드 확인
            if (typeof XLSX === 'undefined') {
                // SheetJS CDN 동적 로드
                await this.loadSheetJS();
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    
                    // 마켓 감지
                    const marketName = this.detectMarket(file.name, jsonData);
                    
                    // 파일 정보 저장
                    const fileInfo = {
                        name: file.name,
                        marketName: marketName,
                        lastModified: file.lastModified,
                        isToday: this.isToday(file.lastModified),
                        data: jsonData,
                        rowCount: jsonData.length - 1 // 헤더 제외
                    };
                    
                    this.uploadedFiles.push(fileInfo);
                    this.updateFileList();
                    
                } catch (error) {
                    console.error('파일 파싱 오류:', error);
                    alert(`파일 읽기 실패: ${file.name}`);
                }
            };
            
            reader.readAsBinaryString(file);
            
        } catch (error) {
            console.error('파일 읽기 오류:', error);
            alert(`파일 처리 실패: ${file.name}`);
        }
    },
    
    // SheetJS 동적 로드
    async loadSheetJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // 마켓 감지 - 매핑 데이터 기반
    detectMarket(fileName, data) {
        console.log('Detecting market for:', fileName);
        
        // 매핑 데이터가 없으면 재로드 시도
        if (!this.mappingData || !this.mappingData.markets) {
            console.log('매핑 데이터가 없습니다');
            return '미감지';
        }
        
        // 헤더 찾기 (첫 10개 행에서 찾기)
        let headers = [];
        for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            if (row && row.length > 0) {
                // 이 행이 헤더일 가능성이 있는지 확인
                const rowText = row.map(cell => String(cell || '').trim()).join(' ').toLowerCase();
                if (rowText.includes('주문') || rowText.includes('구매') || rowText.includes('수취') || 
                    rowText.includes('상품') || rowText.includes('금액') || rowText.includes('번호')) {
                    headers = row.map(cell => String(cell || '').trim());
                    console.log('Headers found at row', i + 1, ':', headers.slice(0, 10));
                    break;
                }
            }
        }
        
        // 헤더가 없으면 첫 번째 행을 헤더로 가정
        if (headers.length === 0 && data.length > 0) {
            headers = data[0].map(cell => String(cell || '').trim());
        }
        
        const fileNameLower = fileName.toLowerCase();
        const headerText = headers.join(' ').toLowerCase();
        
        console.log('Header text for detection:', headerText.substring(0, 200));
        
        // 1. 파일명으로 먼저 체크 (detectString1)
        for (const marketName in this.mappingData.markets) {
            const market = this.mappingData.markets[marketName];
            
            // 카카오는 detectString1이 비어있으므로 건너뛰기
            if (market.detectString1 && market.detectString1.length > 0) {
                if (fileNameLower.includes(market.detectString1.toLowerCase())) {
                    console.log(`Matched ${marketName} by filename with "${market.detectString1}"`);
                    return marketName;
                }
            }
        }
        
        // 2. 헤더로 체크 (detectString2) - 쉼표로 구분된 문자열 처리
        for (const marketName in this.mappingData.markets) {
            const market = this.mappingData.markets[marketName];
            
            if (market.detectString2 && market.detectString2.length > 0) {
                // 쉼표로 구분된 경우 각각 체크
                const detectStrings = market.detectString2.split(',').map(s => s.trim());
                let matchCount = 0;
                
                for (const detectStr of detectStrings) {
                    if (detectStr && headerText.includes(detectStr.toLowerCase())) {
                        matchCount++;
                        console.log(`  Found "${detectStr}" in headers`);
                    }
                }
                
                // 카카오처럼 여러 문자열이 있는 경우: 2개 이상 매칭
                // 단일 문자열인 경우: 1개 매칭
                const requiredMatches = detectStrings.length > 1 ? 2 : 1;
                
                if (matchCount >= requiredMatches) {
                    console.log(`Matched ${marketName} by headers (${matchCount}/${detectStrings.length} matches)`);
                    return marketName;
                }
            }
            
            // 3. detectString3 체크 (쉼표 구분 처리)
            if (market.detectString3 && market.detectString3.length > 0) {
                const detectStrings3 = market.detectString3.split(',').map(s => s.trim());
                let matchCount3 = 0;
                
                for (const detectStr of detectStrings3) {
                    if (detectStr && headerText.includes(detectStr.toLowerCase())) {
                        matchCount3++;
                    }
                }
                
                if (matchCount3 >= (detectStrings3.length > 1 ? 2 : 1)) {
                    console.log(`Matched ${marketName} with detectString3 (${matchCount3} matches)`);
                    return marketName;
                }
            }
            
            // 4. detectString4 체크 (있다면)
            if (market.detectString4 && market.detectString4.length > 0) {
                const detectStrings4 = market.detectString4.split(',').map(s => s.trim());
                let matchCount4 = 0;
                
                for (const detectStr of detectStrings4) {
                    if (detectStr && headerText.includes(detectStr.toLowerCase())) {
                        matchCount4++;
                    }
                }
                
                if (matchCount4 >= (detectStrings4.length > 1 ? 2 : 1)) {
                    console.log(`Matched ${marketName} with detectString4 (${matchCount4} matches)`);
                    return marketName;
                }
            }
        }
        
        console.log('No market matched');
        return '미감지';
    },
    
    // 오늘 날짜 확인
    isToday(timestamp) {
        const fileDate = new Date(timestamp);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        fileDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today - fileDate) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7; // 7일 이내 파일은 유효
    },
    
    // 파일 목록 업데이트
    updateFileList() {
        const fileListDiv = document.getElementById('fileList');
        const fileSummaryDiv = document.getElementById('fileSummary');
        const processBtn = document.getElementById('processMergeBtn');
        
        if (this.uploadedFiles.length === 0) {
            fileListDiv.style.display = 'none';
            fileSummaryDiv.style.display = 'none';
            processBtn.style.display = 'none';
            return;
        }
        
        // 파일 목록 표시
        fileListDiv.style.display = 'block';
        fileListDiv.innerHTML = '';
        
        let totalOrders = 0;
        const marketSet = new Set();
        
        this.uploadedFiles.forEach((file, index) => {
            totalOrders += file.rowCount;
            marketSet.add(file.marketName);
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            if (!file.isToday) {
                fileItem.classList.add('warning');
            }
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-name-section">
                        <span class="market-tag" style="background: ${this.getMarketColor(file.marketName)}">
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
        
        // 요약 정보 표시
        fileSummaryDiv.style.display = 'flex';
        document.getElementById('totalFiles').textContent = this.uploadedFiles.length;
        document.getElementById('totalMarkets').textContent = marketSet.size;
        document.getElementById('totalOrders').textContent = totalOrders.toLocaleString('ko-KR');
        
        // 처리 버튼 표시
        processBtn.style.display = 'inline-block';
        
        // 경고 확인
        this.checkWarnings();
    },
    
    // 파일 제거
    removeFile(index) {
        this.uploadedFiles.splice(index, 1);
        this.updateFileList();
    },
    
    // 경고 확인
    checkWarnings() {
        const oldFiles = this.uploadedFiles.filter(f => !f.isToday);
        const warningBox = document.getElementById('warningBox');
        
        if (oldFiles.length > 0 && warningBox) {
            const warningList = document.getElementById('warningList');
            warningList.innerHTML = '';
            
            oldFiles.forEach(file => {
                const li = document.createElement('li');
                li.textContent = `${file.name} (${new Date(file.lastModified).toLocaleDateString('ko-KR')})`;
                warningList.appendChild(li);
            });
            
            warningBox.style.display = 'block';
        } else if (warningBox) {
            warningBox.style.display = 'none';
        }
    },
    
    // 마켓 색상 - 매핑 데이터에서 가져오거나 기본값 사용
    getMarketColor(marketName) {
        if (this.mappingData && this.mappingData.markets && this.mappingData.markets[marketName]) {
            const market = this.mappingData.markets[marketName];
            if (market.color) {
                // RGB 문자열을 hex로 변환
                const colorParts = market.color.split(',');
                if (colorParts.length === 3) {
                    const r = parseInt(colorParts[0]).toString(16).padStart(2, '0');
                    const g = parseInt(colorParts[1]).toString(16).padStart(2, '0');
                    const b = parseInt(colorParts[2]).toString(16).padStart(2, '0');
                    return `#${r}${g}${b}`;
                }
            }
        }
        
        // 기본 색상 (매핑 데이터가 없을 경우)
        const defaultColors = {
            '네이버': '#03c75a',
            '쿠팡': '#e21f3f',
            '11번가': '#ea002c',
            '지마켓': '#00b900',
            '옥션': '#e62e00',
            '위메프': '#ff5000',
            '티몬': '#ff0000',
            'SSG': '#e51937',
            '카카오': '#fee500',
            '인터파크': '#0050ff',
            '미감지': '#999999'
        };
        return defaultColors[marketName] || '#999999';
    },
    
    // 주문 통합 처리
    process() {
        if (this.uploadedFiles.length === 0) {
            alert('업로드된 파일이 없습니다');
            return;
        }
        
        const todayFiles = this.uploadedFiles.filter(f => f.isToday);
        if (todayFiles.length === 0) {
            alert('오늘 날짜의 파일이 없습니다. 최신 파일을 업로드해주세요.');
            return;
        }
        
        const resultDiv = document.getElementById('mergeResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="success-message" style="display: block;">
                    ✓ ${todayFiles.length}개 파일 처리 완료<br>
                    - 총 ${todayFiles.reduce((sum, f) => sum + f.rowCount, 0)}개 주문 통합
                </div>
            `;
        }
        
        // 토스트 메시지
        if (typeof ToastManager !== 'undefined') {
            ToastManager.success('주문 통합이 완료되었습니다');
        }
    },
    
    // 새로고침 메서드
    async refresh() {
        console.log('MergeModule refresh called');
        
        // 매핑 데이터 다시 로드
        await this.loadMappingData();
        
        // 파일 입력 초기화
        const fileInput = document.getElementById('mergeFile');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // 결과 영역 초기화
        const resultDiv = document.getElementById('mergeResult');
        if (resultDiv) {
            resultDiv.innerHTML = '';
        }
        
        // 파일 목록 재표시
        if (this.uploadedFiles.length > 0) {
            this.updateFileList();
        } else {
            // 파일이 없는 경우 UI 초기화
            const fileListDiv = document.getElementById('fileList');
            const fileSummaryDiv = document.getElementById('fileSummary');
            const processBtn = document.getElementById('processMergeBtn');
            
            if (fileListDiv) fileListDiv.style.display = 'none';
            if (fileSummaryDiv) fileSummaryDiv.style.display = 'none';
            if (processBtn) processBtn.style.display = 'none';
        }
        
        // 업로드 영역 초기화
        const uploadArea = document.getElementById('mergeUploadArea');
        if (uploadArea) {
            uploadArea.classList.remove('dragover');
        }
        
        console.log('MergeModule refreshed successfully');
    },
    
    // 초기화 상태 확인
    isInitialized() {
        return this.mappingData !== null;
    }
};

// 전역 함수로 등록
window.processMerge = function() {
    MergeModule.process();
};

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    MergeModule.initialize();
});
