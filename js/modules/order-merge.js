// js/modules/order-merge.js - 주문통합(Excel) 모듈

window.OrderMergeModule = {
    // 전역 변수
    uploadedFiles: [],
    mappingData: null,
    processedData: null,
    standardFields: [],
    
    // 초기화
    init() {
        this.setupEventListeners();
        this.loadMappingData();
    },
    
    // 매핑 데이터 로드
    loadMappingData() {
        // 임시 매핑 데이터 (실제로는 Google Sheets나 API에서 로드)
        this.mappingData = {
            markets: {
                '네이버': { 
                    name: '네이버', 
                    initial: 'N', 
                    color: '76,175,80', 
                    detectString1: '스마트스토어',
                    detectString2: '상품주문번호,구매자명',
                    headerRow: 2,
                    mappings: {
                        '주문번호': '주문번호',
                        '주문자': '구매자명',
                        '수취인': '수취인명',
                        '수취인전화번호': '수취인연락처1',
                        '주소': '배송지',
                        '옵션명': '옵션정보',
                        '수량': '수량',
                        '상품금액': '상품별 총 주문금액'
                    }
                },
                '쿠팡': { 
                    name: '쿠팡', 
                    initial: 'C', 
                    color: '255,87,34', 
                    detectString1: '쿠팡',
                    detectString2: '주문번호,구매수(수량)',
                    headerRow: 1,
                    mappings: {
                        '주문번호': '주문번호',
                        '주문자': '구매자',
                        '수취인': '수취인이름',
                        '수취인전화번호': '수취인전화번호',
                        '주소': '배송지',
                        '옵션명': '옵션',
                        '수량': '구매수(수량)',
                        '상품금액': '판매액'
                    }
                },
                '11번가': { 
                    name: '11번가', 
                    initial: 'E', 
                    color: '244,67,54', 
                    detectString1: '11번가',
                    detectString2: '주문번호,수취인명',
                    headerRow: 2,
                    mappings: {
                        '주문번호': '주문번호',
                        '주문자': '구매자',
                        '수취인': '수취인명',
                        '수취인전화번호': '수취인 연락처',
                        '주소': '배송지 주소',
                        '옵션명': '옵션',
                        '수량': '수량',
                        '상품금액': '결제금액'
                    }
                }
            },
            standardFields: [
                '마켓명', '연번', '마켓', '결제일', '주문번호', '주문자', '수취인', 
                '수취인전화번호', '주소', '배송메세지', '옵션명', '수량', 
                '상품금액', '정산예정금액', '출고', '송장', '벤더사', '셀러'
            ],
            marketOrder: ['네이버', '쿠팡', '11번가']
        };
        
        this.displaySupportedMarkets();
    },
    
    // 지원 마켓 표시
    displaySupportedMarkets() {
        const container = document.getElementById('supportedMarkets');
        if (!container) return;
        
        container.innerHTML = '<h3 style="width: 100%; margin-bottom: 10px;">지원 마켓</h3>';
        
        const marketNames = this.mappingData.marketOrder || Object.keys(this.mappingData.markets);
        
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
        // 파일 선택 버튼
        const uploadBtn = document.getElementById('mergeUploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                document.getElementById('mergeFileInput').click();
            });
        }
        
        // 파일 입력
        const fileInput = document.getElementById('mergeFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        // 드래그 앤 드롭
        const uploadSection = document.getElementById('mergeUploadSection');
        if (uploadSection) {
            uploadSection.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadSection.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            uploadSection.addEventListener('drop', (e) => this.handleDrop(e));
        }
        
        // 처리 버튼
        const processBtn = document.getElementById('mergeProcessBtn');
        if (processBtn) {
            processBtn.addEventListener('click', () => this.processOrders());
        }
        
        // 내보내기 버튼
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
            ToastManager.error('유효한 파일이 없습니다. 엑셀 또는 CSV 파일을 선택해주세요.');
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
                    ToastManager.error(`${file.name}: 유효한 시트가 없습니다.`);
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
                ToastManager.error(`${file.name}: 파일 읽기 실패`);
            }
        };
        
        if (isCsv) {
            reader.readAsText(file, 'utf-8');
        } else {
            reader.readAsBinaryString(file);
        }
    },
    
    // 엑셀 데이터 처리
    processExcelData(rawRows, file) {
        const cleanRows = rawRows.filter(row => 
            row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );
        
        if (cleanRows.length === 0) {
            ToastManager.error(`${file.name}: 데이터가 없습니다.`);
            return;
        }
        
        // 마켓 감지
        const marketName = this.detectMarket(file.name, cleanRows);
        if (!marketName) {
            ToastManager.error(`${file.name}: 마켓을 인식할 수 없습니다.`);
            return;
        }
        
        const market = this.mappingData.markets[marketName];
        const headerRowIndex = (market.headerRow || 1) - 1;
        
        const headers = cleanRows[headerRowIndex].map(h => String(h || '').trim());
        const dataRows = cleanRows.slice(headerRowIndex + 1);
        
        // 데이터를 객체 배열로 변환
        const processedRows = dataRows.map(row => {
            const obj = {};
            headers.forEach((header, i) => {
                obj[header] = row[i] !== undefined ? row[i] : '';
            });
            return obj;
        });
        
        // 파일 정보 저장
        const fileInfo = {
            name: file.name,
            marketName,
            lastModified: file.lastModified,
            isToday: this.isToday(file.lastModified),
            headers,
            data: processedRows,
            rowCount: processedRows.length
        };
        
        this.uploadedFiles.push(fileInfo);
        this.updateFileList();
    },
    
    // 마켓 감지
    detectMarket(fileName, rows) {
        const fileNameLower = fileName.toLowerCase();
        const headerText = rows.slice(0, 3).flat().join(' ').toLowerCase();
        
        for (const [marketName, market] of Object.entries(this.mappingData.markets)) {
            // 파일명으로 감지
            if (market.detectString1 && fileNameLower.includes(market.detectString1.toLowerCase())) {
                return marketName;
            }
            
            // 헤더로 감지
            if (market.detectString2) {
                const detectStrings = market.detectString2.split(',').map(s => s.trim().toLowerCase());
                const matchCount = detectStrings.filter(str => headerText.includes(str)).length;
                
                if (matchCount >= Math.ceil(detectStrings.length / 2)) {
                    return marketName;
                }
            }
        }
        
        return null;
    },
    
    // 오늘 날짜 체크
    isToday(timestamp) {
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
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-name-section">
                        <span class="market-tag" style="background: rgb(${this.mappingData.markets[file.marketName].color})">
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
        
        if (oldFiles.length > 0) {
            const warningList = document.getElementById('mergeWarningList');
            warningList.innerHTML = '';
            
            oldFiles.forEach(file => {
                const li = document.createElement('li');
                li.textContent = `${file.name} (${new Date(file.lastModified).toLocaleDateString('ko-KR')})`;
                warningList.appendChild(li);
            });
            
            warningBox.classList.add('show');
        } else {
            warningBox.classList.remove('show');
        }
    },
    
    // 주문 처리
    processOrders() {
        if (this.uploadedFiles.length === 0) {
            ToastManager.error('업로드된 파일이 없습니다.');
            return;
        }
        
        const todayFiles = this.uploadedFiles.filter(f => f.isToday);
        if (todayFiles.length === 0) {
            ToastManager.error('최신 파일이 없습니다.');
            return;
        }
        
        LoadingManager.showFullLoading();
        
        try {
            const mergedData = [];
            const statistics = {
                byMarket: {},
                byOption: {},
                total: { count: 0, quantity: 0, amount: 0 }
            };
            
            let globalCounter = 0;
            const marketCounters = {};
            
            // 파일별 처리
            todayFiles.forEach(fileData => {
                const marketName = fileData.marketName;
                const market = this.mappingData.markets[marketName];
                
                if (!marketCounters[marketName]) {
                    marketCounters[marketName] = 0;
                }
                
                if (!statistics.byMarket[marketName]) {
                    statistics.byMarket[marketName] = {
                        count: 0,
                        quantity: 0,
                        amount: 0
                    };
                }
                
                // 데이터 처리
                fileData.data.forEach(row => {
                    globalCounter++;
                    marketCounters[marketName]++;
                    
                    const mergedRow = {};
                    
                    // 표준 필드 매핑
                    this.mappingData.standardFields.forEach(standardField => {
                        if (standardField === '마켓명') {
                            mergedRow['마켓명'] = marketName;
                        } else if (standardField === '연번') {
                            mergedRow['연번'] = globalCounter;
                        } else if (standardField === '마켓') {
                            const initial = market.initial || marketName.charAt(0);
                            mergedRow['마켓'] = initial + String(marketCounters[marketName]).padStart(3, '0');
                        } else {
                            const mappedField = market.mappings[standardField];
                            if (mappedField && row[mappedField] !== undefined) {
                                mergedRow[standardField] = row[mappedField];
                            } else {
                                mergedRow[standardField] = '';
                            }
                        }
                    });
                    
                    // 통계 업데이트
                    const quantity = parseInt(mergedRow['수량']) || 1;
                    const amount = parseFloat(mergedRow['상품금액']) || 0;
                    const optionName = mergedRow['옵션명'] || '';
                    
                    statistics.byMarket[marketName].count++;
                    statistics.byMarket[marketName].quantity += quantity;
                    statistics.byMarket[marketName].amount += amount;
                    
                    if (!statistics.byOption[optionName]) {
                        statistics.byOption[optionName] = {
                            count: 0,
                            quantity: 0,
                            amount: 0
                        };
                    }
                    
                    statistics.byOption[optionName].count++;
                    statistics.byOption[optionName].quantity += quantity;
                    statistics.byOption[optionName].amount += amount;
                    
                    statistics.total.count++;
                    statistics.total.quantity += quantity;
                    statistics.total.amount += amount;
                    
                    mergedData.push(mergedRow);
                });
            });
            
            this.processedData = {
                success: true,
                data: mergedData,
                statistics: statistics,
                standardFields: this.mappingData.standardFields
            };
            
            LoadingManager.hideFullLoading();
            ToastManager.success(`${mergedData.length}개의 주문을 통합했습니다.`);
            
            this.displayResults();
            
        } catch (error) {
            LoadingManager.hideFullLoading();
            ToastManager.error('처리 중 오류가 발생했습니다.');
            console.error('처리 오류:', error);
        }
    },
    
    // 결과 표시
    displayResults() {
        const resultSection = document.getElementById('mergeResultSection');
        resultSection.classList.add('show');
        
        this.displayResultTable();
        this.displayStatistics();
        
        resultSection.scrollIntoView({ behavior: 'smooth' });
    },
    
    // 결과 테이블 표시
    displayResultTable() {
        const tbody = document.getElementById('mergeResultTableBody');
        tbody.innerHTML = '';
        
        if (!this.processedData || this.processedData.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%" style="text-align:center;">데이터가 없습니다</td></tr>';
            return;
        }
        
        const headers = this.processedData.standardFields;
        
        // 헤더 생성
        const thead = document.getElementById('mergeResultTableHead');
        thead.innerHTML = '';
        const headerRow = document.createElement('tr');
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        
        // 데이터 행 생성
        this.processedData.data.forEach(row => {
            const tr = document.createElement('tr');
            
            headers.forEach(header => {
                const td = document.createElement('td');
                let value = row[header] || '';
                
                // 마켓명 셀 스타일
                if (header === '마켓명') {
                    const market = this.mappingData.markets[value];
                    if (market) {
                        td.style.background = `rgb(${market.color})`;
                        const rgb = market.color.split(',').map(Number);
                        const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
                        td.style.color = brightness > 128 ? '#000' : '#fff';
                        td.style.fontWeight = 'bold';
                    }
                }
                
                // 금액 포맷
                if (header.includes('금액')) {
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
    },
    
    // 통계 표시
    displayStatistics() {
        const statistics = this.processedData.statistics;
        
        // 마켓별 통계
        const marketStatsBody = document.getElementById('mergeMarketStats');
        marketStatsBody.innerHTML = '';
        
        Object.entries(statistics.byMarket).forEach(([market, stats]) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${market}</td>
                <td>${stats.count}</td>
                <td>${stats.quantity}</td>
                <td class="amount-col">${stats.amount.toLocaleString('ko-KR')}</td>
            `;
            marketStatsBody.appendChild(tr);
        });
        
        // 옵션별 통계
        const optionStatsBody = document.getElementById('mergeOptionStats');
        optionStatsBody.innerHTML = '';
        
        Object.entries(statistics.byOption)
            .sort((a, b) => b[1].quantity - a[1].quantity)
            .slice(0, 20)
            .forEach(([option, stats]) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${option || '(옵션 없음)'}</td>
                    <td>${stats.count}</td>
                    <td>${stats.quantity}</td>
                    <td class="amount-col">${stats.amount.toLocaleString('ko-KR')}</td>
                `;
                optionStatsBody.appendChild(tr);
            });
        
        // 전체 통계
        document.getElementById('mergeTotalStatCount').textContent = statistics.total.count;
        document.getElementById('mergeTotalStatQuantity').textContent = statistics.total.quantity;
        document.getElementById('mergeTotalStatAmount').textContent = statistics.total.amount.toLocaleString('ko-KR');
    },
    
    // 엑셀 내보내기
    exportToExcel() {
        if (!this.processedData || !this.processedData.data || this.processedData.data.length === 0) {
            ToastManager.error('내보낼 데이터가 없습니다.');
            return;
        }
        
        const ws = XLSX.utils.json_to_sheet(this.processedData.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '통합주문');
        
        const fileName = `주문통합_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        ToastManager.success('엑셀 파일이 다운로드되었습니다.');
    }
};
