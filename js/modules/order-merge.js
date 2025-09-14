// js/modules/order-merge.js - 주문통합(Excel) 모듈 - Vercel API 버전

window.OrderMergeModule = {
    // API 설정 - Vercel 배포된 API 절대 경로 사용
    API_BASE_URL: 'https://order-integration.vercel.app/api',
    
    // 전역 변수
    uploadedFiles: [],
    mappingData: null,
    processedData: null,
    
    // 초기화
    init() {
        console.log('주문통합 모듈 초기화');
        console.log('API URL:', this.API_BASE_URL);
        this.setupEventListeners();
        this.loadMappingData();
    },
    
    // 매핑 데이터 로드
    async loadMappingData() {
        try {
            console.log('매핑 데이터 로드 시작:', `${this.API_BASE_URL}/mapping-data`);
            
            const response = await fetch(`${this.API_BASE_URL}/mapping-data`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API 응답 에러:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.mappingData = data;
            console.log('매핑 데이터 로드 완료:', this.mappingData);
            this.displaySupportedMarkets();
            
        } catch (error) {
            console.error('매핑 데이터 로드 실패:', error);
            this.showError('매핑 데이터를 불러올 수 없습니다. 다시 시도해주세요.');
        }
    },
    
    // 지원 마켓 표시
    displaySupportedMarkets() {
        const container = document.getElementById('supportedMarkets');
        if (!container || !this.mappingData) return;
        
        container.innerHTML = '<h3 style="width: 100%; margin-bottom: 10px;">지원 마켓</h3>';
        
        const marketNames = this.mappingData.marketOrder || [];
        
        marketNames.forEach(marketName => {
            const market = this.mappingData.markets[marketName];
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
    
    // 이벤트 리스너 설정
    setupEventListeners() {
        const uploadBtn = document.getElementById('mergeUploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                document.getElementById('mergeFileInput').click();
            });
        }
        
        const fileInput = document.getElementById('mergeFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        const uploadSection = document.getElementById('mergeUploadSection');
        if (uploadSection) {
            uploadSection.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadSection.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            uploadSection.addEventListener('drop', (e) => this.handleDrop(e));
        }
        
        const processBtn = document.getElementById('mergeProcessBtn');
        if (processBtn) {
            processBtn.addEventListener('click', () => this.processOrders());
        }
        
        const exportBtn = document.getElementById('mergeExportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToExcel());
        }
    },
    
    // 파일 선택 처리
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    },
    
    // 드래그 오버
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    },
    
    // 드래그 떠남
    handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    },
    
    // 드롭
    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    },
    
    // 파일 처리
    processFiles(files) {
        const validFiles = files.filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            return ['xlsx', 'xls', 'csv'].includes(ext);
        });
        
        if (validFiles.length === 0) {
            this.showError('유효한 파일이 없습니다. 엑셀 또는 CSV 파일을 선택해주세요.');
            return;
        }
        
        validFiles.forEach(file => this.readFile(file));
    },
    
    // 파일 읽기
    readFile(file) {
        const reader = new FileReader();
        const isCsv = file.name.toLowerCase().endsWith('.csv');
        
        reader.onload = (e) => {
            try {
                let workbook;
                
                if (isCsv) {
                    const csvText = e.target.result;
                    workbook = XLSX.read(csvText, { type: 'string' });
                } else {
                    const data = e.target.result;
                    workbook = XLSX.read(data, { 
                        type: 'binary',
                        cellDates: true,
                        cellNF: true,
                        cellText: false,
                        dateNF: 'YYYY-MM-DD HH:mm:ss'
                    });
                }
                
                if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
                    this.showError(`${file.name}: 유효한 시트가 없습니다.`);
                    return;
                }
                
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawRows = XLSX.utils.sheet_to_json(firstSheet, { 
                    header: 1, 
                    defval: '', 
                    blankrows: false, 
                    raw: false, 
                    dateNF: 'YYYY-MM-DD HH:mm:ss'
                });
                
                this.processExcelData(rawRows, file);
                
            } catch (error) {
                console.error('파일 처리 오류:', error);
                this.showError(`${file.name}: 파일 읽기 실패`);
            }
        };
        
        if (isCsv) {
            reader.readAsText(file, 'utf-8');
        } else {
            reader.readAsBinaryString(file);
        }
    },
    
    // 엑셀 데이터 처리
    async processExcelData(rawRows, file) {
        const cleanRows = rawRows.filter(row => 
            row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );
        
        if (cleanRows.length === 0) {
            this.showError(`${file.name}: 데이터가 없습니다.`);
            return;
        }
        
        // 첫 번째 유효한 행을 임시 헤더로 사용
        const headers = cleanRows[0].map(h => String(h || '').trim());
        
        try {
            // Vercel API로 마켓 감지
            const response = await fetch(`${this.API_BASE_URL}/detect-market`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileName: file.name,
                    headers: headers
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            const marketName = result.marketName;
            
            if (!marketName) {
                this.showError(`${file.name}: 마켓을 인식할 수 없습니다.`);
                return;
            }
            
            const market = this.mappingData.markets[marketName];
            const headerRowIndex = (market.headerRow || 1) - 1;
            
            // 실제 헤더 행 결정
            const finalHeaders = cleanRows[headerRowIndex].map(h => String(h || '').trim());
            const dataRows = cleanRows.slice(headerRowIndex + 1);
            
            // 데이터를 객체 배열로 변환
            const processedRows = dataRows.map(row => {
                const obj = {};
                finalHeaders.forEach((header, i) => {
                    obj[header] = row[i] !== undefined ? row[i] : '';
                });
                return obj;
            });
            
            // 파일 정보 저장
            const fileInfo = {
                name: file.name,
                marketName,
                lastModified: file.lastModified,
                isToday: this.isRecent(file.lastModified),
                headers: finalHeaders,
                data: processedRows,
                rowCount: processedRows.length
            };
            
            this.uploadedFiles.push(fileInfo);
            this.updateFileList();
            
        } catch (error) {
            console.error('마켓 감지 오류:', error);
            this.showError(`${file.name}: 마켓 감지 실패`);
        }
    },
    
    // 최근 파일 체크 (7일 이내)
    isRecent(timestamp) {
        const fileDate = new Date(timestamp);
        const today = new Date();
        
        fileDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today - fileDate) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7 && daysDiff >= 0;
    },
    
    // 파일 목록 업데이트
    updateFileList() {
        const fileList = document.getElementById('mergeFileList');
        if (!fileList) return;
        
        fileList.innerHTML = '';
        
        if (this.uploadedFiles.length === 0) {
            document.getElementById('mergeProcessBtn').style.display = 'none';
            document.getElementById('mergeFileSummary').style.display = 'none';
            return;
        }
        
        document.getElementById('mergeProcessBtn').style.display = 'inline-block';
        document.getElementById('mergeFileSummary').style.display = 'flex';
        
        let totalOrders = 0;
        const marketSet = new Set();
        
        this.uploadedFiles.forEach((file, index) => {
            totalOrders += file.rowCount;
            marketSet.add(file.marketName);
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            if (!file.isToday) fileItem.classList.add('warning');
            
            const market = this.mappingData.markets[file.marketName];
            const marketColor = market ? market.color : '200,200,200';
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-name-section">
                        <span class="market-tag" style="background: rgb(${marketColor})">
                            ${file.marketName}
                        </span>
                        <div class="file-name">${file.name}</div>
                    </div>
                    <div class="file-details">
                        <span class="file-order-count">${file.rowCount}개 주문</span>
                        <span class="file-date">${new Date(file.lastModified).toLocaleDateString('ko-KR')}</span>
                        <button class="btn-remove" onclick="OrderMergeModule.removeFile(${index})">삭제</button>
                    </div>
                </div>
            `;
            
            fileList.appendChild(fileItem);
        });
        
        // 요약 정보 업데이트
        document.getElementById('mergeTotalFiles').textContent = this.uploadedFiles.length;
        document.getElementById('mergeTotalMarkets').textContent = marketSet.size;
        document.getElementById('mergeTotalOrders').textContent = totalOrders.toLocaleString('ko-KR');
        
        // 경고 체크
        this.checkWarnings();
    },
    
    // 파일 제거
    removeFile(index) {
        this.uploadedFiles.splice(index, 1);
        this.updateFileList();
    },
    
    // 경고 체크
    checkWarnings() {
        const oldFiles = this.uploadedFiles.filter(f => !f.isToday);
        const warningBox = document.getElementById('mergeWarningBox');
        
        if (!warningBox) return;
        
        if (oldFiles.length > 0) {
            const warningList = document.getElementById('mergeWarningList');
            warningList.innerHTML = '';
            
            oldFiles.forEach(file => {
                const li = document.createElement('li');
                li.textContent = `${file.name} (${new Date(file.lastModified).toLocaleDateString('ko-KR')})`;
                warningList.appendChild(li);
            });
            
            warningBox.style.display = 'block';
        } else {
            warningBox.style.display = 'none';
        }
    },
    
    // 주문 처리
    async processOrders() {
        if (this.uploadedFiles.length === 0) {
            this.showError('업로드된 파일이 없습니다.');
            return;
        }
        
        const recentFiles = this.uploadedFiles.filter(f => f.isToday);
        if (recentFiles.length === 0) {
            this.showError('최신 파일이 없습니다. 7일 이내 파일을 업로드해주세요.');
            return;
        }
        
        this.showLoading(true);
        
        try {
            // Vercel API로 주문 처리
            const response = await fetch(`${this.API_BASE_URL}/process-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: recentFiles
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.processedData = result;
                this.showSuccess(`${result.processedCount}개의 주문을 통합했습니다.`);
                this.displayResults();
            } else {
                throw new Error(result.error || '처리 중 오류가 발생했습니다.');
            }
            
        } catch (error) {
            console.error('주문 처리 오류:', error);
            this.showError('주문 처리 중 오류가 발생했습니다: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    },
    
    // 결과 표시
    displayResults() {
        const resultSection = document.getElementById('mergeResultSection');
        if (resultSection) {
            resultSection.style.display = 'block';
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        this.displayResultTable();
        this.displayStatistics();
    },
    
    // 결과 테이블 표시
    displayResultTable() {
        const tbody = document.getElementById('mergeResultTableBody');
        const thead = document.getElementById('mergeResultTableHead');
        
        if (!tbody || !thead) return;
        
        tbody.innerHTML = '';
        thead.innerHTML = '';
        
        if (!this.processedData || !this.processedData.data || this.processedData.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%" style="text-align:center;">데이터가 없습니다</td></tr>';
            return;
        }
        
        const headers = this.processedData.standardFields;
        const data = this.processedData.data;
        
        // 헤더 생성
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        
        // 데이터 행 생성 (최대 100개만 표시)
        const displayData = data.slice(0, 100);
        
        displayData.forEach(row => {
            const tr = document.createElement('tr');
            
            headers.forEach(header => {
                const td = document.createElement('td');
                let value = row[header] || '';
                
                // 마켓명 셀 스타일
                if (header === '마켓명' && this.mappingData && this.mappingData.markets[value]) {
                    const market = this.mappingData.markets[value];
                    td.style.background = `rgb(${market.color})`;
                    const rgb = market.color.split(',').map(Number);
                    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
                    td.style.color = brightness > 128 ? '#000' : '#fff';
                    td.style.fontWeight = 'bold';
                    td.style.textAlign = 'center';
                }
                
                // 금액 포맷
                if (header.includes('금액') || header.includes('수수료')) {
                    const numValue = parseFloat(String(value).replace(/[^\d.-]/g, ''));
                    if (!isNaN(numValue)) {
                        value = numValue.toLocaleString('ko-KR');
                    }
                }
                
                td.textContent = String(value);
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        if (data.length > 100) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = headers.length;
            td.style.textAlign = 'center';
            td.style.padding = '20px';
            td.innerHTML = `<em>... 외 ${data.length - 100}개 주문 (엑셀 다운로드로 전체 확인)</em>`;
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
    },
    
    // 통계 표시
    displayStatistics() {
        if (!this.processedData || !this.processedData.statistics) return;
        
        const stats = this.processedData.statistics;
        
        // 전체 통계
        const totalCount = document.getElementById('mergeTotalStatCount');
        const totalQuantity = document.getElementById('mergeTotalStatQuantity');
        const totalAmount = document.getElementById('mergeTotalStatAmount');
        
        if (totalCount) totalCount.textContent = stats.total.count.toLocaleString('ko-KR');
        if (totalQuantity) totalQuantity.textContent = stats.total.quantity.toLocaleString('ko-KR');
        if (totalAmount) totalAmount.textContent = stats.total.amount.toLocaleString('ko-KR') + '원';
        
        // 마켓별 통계
        const marketStatsBody = document.getElementById('mergeMarketStats');
        if (marketStatsBody) {
            marketStatsBody.innerHTML = '';
            
            Object.entries(stats.byMarket).forEach(([market, marketStats]) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${market}</td>
                    <td>${marketStats.count.toLocaleString('ko-KR')}</td>
                    <td>${marketStats.quantity.toLocaleString('ko-KR')}</td>
                    <td>${marketStats.amount.toLocaleString('ko-KR')}</td>
                `;
                marketStatsBody.appendChild(tr);
            });
        }
        
        // 옵션별 통계 (상위 20개)
        const optionStatsBody = document.getElementById('mergeOptionStats');
        if (optionStatsBody) {
            optionStatsBody.innerHTML = '';
            
            const sortedOptions = Object.entries(stats.byOption)
                .sort((a, b) => b[1].quantity - a[1].quantity)
                .slice(0, 20);
            
            sortedOptions.forEach(([option, optionStats]) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${option || '(옵션 없음)'}</td>
                    <td>${optionStats.count.toLocaleString('ko-KR')}</td>
                    <td>${optionStats.quantity.toLocaleString('ko-KR')}</td>
                    <td>${optionStats.amount.toLocaleString('ko-KR')}</td>
                `;
                optionStatsBody.appendChild(tr);
            });
        }
    },
    
    // 엑셀 내보내기
    exportToExcel() {
        if (!this.processedData || !this.processedData.data || this.processedData.data.length === 0) {
            this.showError('내보낼 데이터가 없습니다.');
            return;
        }
        
        try {
            const ws = XLSX.utils.json_to_sheet(this.processedData.data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, '통합주문');
            
            const fileName = `주문통합_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            this.showSuccess('엑셀 파일이 다운로드되었습니다.');
        } catch (error) {
            console.error('엑셀 내보내기 오류:', error);
            this.showError('엑셀 파일 생성 중 오류가 발생했습니다.');
        }
    },
    
    // UI 헬퍼 함수들
    showLoading(show) {
        // 기존 시스템의 로딩 표시 사용
        if (typeof LoadingManager !== 'undefined') {
            if (show) {
                LoadingManager.showFullLoading();
            } else {
                LoadingManager.hideFullLoading();
            }
        } else {
            // 간단한 로딩 표시
            const btn = document.getElementById('mergeProcessBtn');
            if (btn) {
                btn.disabled = show;
                btn.textContent = show ? '처리 중...' : '🔄 주문 통합 실행';
            }
        }
    },
    
    showError(message) {
        // 기존 시스템의 토스트 메시지 사용
        if (typeof ToastManager !== 'undefined') {
            ToastManager.error(message);
        } else {
            alert('오류: ' + message);
        }
    },
    
    showSuccess(message) {
        // 기존 시스템의 토스트 메시지 사용
        if (typeof ToastManager !== 'undefined') {
            ToastManager.success(message);
        } else {
            alert(message);
        }
    }
};
