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
    
    // 마켓 감지
    detectMarket(fileName, data) {
        const fileNameLower = fileName.toLowerCase();
        
        // 파일명으로 감지
        if (fileNameLower.includes('네이버') || fileNameLower.includes('스마트스토어')) {
            return '네이버';
        } else if (fileNameLower.includes('쿠팡')) {
            return '쿠팡';
        } else if (fileNameLower.includes('11번가')) {
            return '11번가';
        } else if (fileNameLower.includes('지마켓')) {
            return '지마켓';
        } else if (fileNameLower.includes('옥션')) {
            return '옥션';
        } else if (fileNameLower.includes('위메프')) {
            return '위메프';
        } else if (fileNameLower.includes('티몬')) {
            return '티몬';
        }
        
        // 헤더로 감지 (첫 번째 행)
        if (data && data.length > 0) {
            const headers = data[0].join(' ').toLowerCase();
            
            if (headers.includes('상품주문번호') && headers.includes('구매자명')) {
                return '네이버';
            } else if (headers.includes('주문번호') && headers.includes('수취인이름')) {
                return '쿠팡';
            }
        }
        
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
