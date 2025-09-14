// js/modules/excel.js - 엑셀 처리 모듈

window.ExcelModule = {
    uploadedFiles: [],
    
    // 초기화
    initialize() {
        this.setupEventListeners();
        console.log('ExcelModule 초기화 완료');
    },
    
    // 이벤트 리스너 설정
    setupEventListeners() {
        const uploadArea = document.getElementById('excelUploadArea');
        const fileInput = document.getElementById('excelFile');
        
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
    
    // 마켓 감지 - Google Apps Script 로직과 동일하게 구현
    detectMarket(fileName, data) {
        console.log('Detecting market for:', fileName);
        
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
        
        // 마켓 감지 규칙 (매핑 시트 설정 기반)
        const marketDetectionRules = {
            '네이버': {
                detectString1: '스마트스토어',
                detectString2: '상품주문번호,구매자명,구매자연락처',
                detectString3: ''
            },
            '쿠팡': {
                detectString1: '쿠팡',
                detectString2: '주문번호,수취인,수취인연락처',
                detectString3: '묶음배송번호,옵션id,구매수(수량)'
            },
            '11번가': {
                detectString1: '11번가',
                detectString2: '주문번호,구매자명,수취인명',
                detectString3: '상품주문번호,주문상태,수취인전화번호'
            },
            '카카오': {
                detectString1: '',  // 카카오는 파일명 감지 없음
                detectString2: '주문 일련번호,수령인,연락처,배송메시지',
                detectString3: ''
            },
            '티몬': {
                detectString1: '티몬',
                detectString2: '주문번호,딜명,옵션명,구매자명',
                detectString3: '수령자명'
            },
            '위메프': {
                detectString1: '위메프',
                detectString2: '주문번호코드,주문자,수취인',
                detectString3: '수취인연락처'
            },
            '지마켓': {
                detectString1: '지마켓',
                detectString2: '주문번호,구매자,수령자',
                detectString3: '수령자연락처'
            },
            '옥션': {
                detectString1: '옥션',
                detectString2: '주문번호,구매자,수령자',
                detectString3: '수령자연락처'
            },
            'SSG': {
                detectString1: 'ssg',
                detectString2: '주문번호,수취인명,수취인휴대폰',
                detectString3: '상품명,단품명'
            },
            '인터파크': {
                detectString1: '인터파크',
                detectString2: '주문번호,구매자명,수취인명',
                detectString3: '수취인연락처'
            }
        };
        
        // 1. 파일명으로 먼저 체크 (detectString1)
        for (const [marketName, rules] of Object.entries(marketDetectionRules)) {
            if (rules.detectString1 && rules.detectString1.length > 0) {
                if (fileNameLower.includes(rules.detectString1.toLowerCase())) {
                    console.log(`Matched ${marketName} by filename with "${rules.detectString1}"`);
                    return marketName;
                }
            }
        }
        
        // 2. 헤더로 체크 (detectString2) - 쉼표로 구분된 문자열 처리
        for (const [marketName, rules] of Object.entries(marketDetectionRules)) {
            if (rules.detectString2 && rules.detectString2.length > 0) {
                const detectStrings = rules.detectString2.split(',').map(s => s.trim());
                let matchCount = 0;
                
                for (const detectStr of detectStrings) {
                    if (detectStr && headerText.includes(detectStr.toLowerCase())) {
                        matchCount++;
                        console.log(`  Found "${detectStr}" in headers`);
                    }
                }
                
                // 여러 문자열이 있는 경우: 2개 이상 매칭
                // 단일 문자열인 경우: 1개 매칭
                const requiredMatches = detectStrings.length > 1 ? 2 : 1;
                
                if (matchCount >= requiredMatches) {
                    console.log(`Matched ${marketName} by headers (${matchCount}/${detectStrings.length} matches)`);
                    return marketName;
                }
            }
            
            // 3. detectString3 체크
            if (rules.detectString3 && rules.detectString3.length > 0) {
                const detectStrings3 = rules.detectString3.split(',').map(s => s.trim());
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
        const processBtn = document.getElementById('processExcelBtn');
        
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
                <button class="file-remove" onclick="ExcelModule.removeFile(${index})">×</button>
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
    
    // 마켓 색상
    getMarketColor(marketName) {
        const colors = {
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
        return colors[marketName] || '#999999';
    },
    
    // 엑셀 처리
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
        
        const resultDiv = document.getElementById('excelResult');
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
    refresh() {
        console.log('ExcelModule refresh called');
        
        // 파일 입력 초기화
        const fileInput = document.getElementById('excelFile');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // 결과 영역 초기화
        const resultDiv = document.getElementById('excelResult');
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
            const processBtn = document.getElementById('processExcelBtn');
            
            if (fileListDiv) fileListDiv.style.display = 'none';
            if (fileSummaryDiv) fileSummaryDiv.style.display = 'none';
            if (processBtn) processBtn.style.display = 'none';
        }
        
        // 업로드 영역 초기화
        const uploadArea = document.getElementById('excelUploadArea');
        if (uploadArea) {
            uploadArea.classList.remove('dragover');
        }
        
        console.log('ExcelModule refreshed successfully');
    },
    
    // 초기화 상태 확인
    isInitialized() {
        return true;
    }
};

// 전역 함수로 등록
window.processExcel = function() {
    ExcelModule.process();
};

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    ExcelModule.initialize();
});
