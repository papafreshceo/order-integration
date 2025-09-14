// js/modules/order-merge.js - 주문통합(Excel) 모듈

window.OrderMergeModule = {
    // 전역 변수
    uploadedFiles: [],
    mappingData: null,
    processedData = null,
    
    // 초기화
    init() {
        this.setupEventListeners();
        this.loadMappingData();
    },
    
    // 매핑 데이터 로드
    loadMappingData() {
        // Google Apps Script 환경에서 매핑 데이터 가져오기
        if (typeof google !== 'undefined' && google.script && google.script.run) {
            google.script.run
                .withSuccessHandler((data) => {
                    if (data && !data.error) {
                        this.mappingData = data;
                        this.displaySupportedMarkets();
                    } else {
                        ToastManager.error('매핑 데이터 로드 실패: ' + (data.error || '알 수 없는 오류'));
                    }
                })
                .withFailureHandler((error) => {
                    ToastManager.error('매핑 데이터 로드 실패: ' + error.message);
                })
                .getMappingData();
        } else {
            ToastManager.error('Google Apps Script 환경이 아닙니다.');
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
        
        // 첫 번째 유효한 행을 임시 헤더로 사용
        const headers = cleanRows[0].map(h => String(h || '').trim());
        const firstDataRow = cleanRows[1] || [];
        
        // Google Apps Script의 detectMarket 함수 호출
        google.script.run
            .withSuccessHandler((marketName) => {
                if (!marketName) {
                    ToastManager.error(`${file.name}: 마켓을 인식할 수 없습니다.`);
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
                    isToday: this.isToday(file.lastModified),
                    headers: finalHeaders,
                    data: processedRows,
                    rowCount: processedRows.length
                };
                
                this.uploadedFiles.push(fileInfo);
                this.updateFileList();
            })
            .withFailureHandler((error) => {
                ToastManager.error(`마켓 감지 실패: ${error.message}`);
            })
            .detectMarket(file.name, headers, firstDataRow);
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
        
        // Google Apps Script의 processOrderFiles 함수 호출
        google.script.run
            .withSuccessHandler((result) => {
                LoadingManager.hideFullLoading();
                
                if (result.success) {
                    this.processedData = result;
                    ToastManager.success(`${result.processedCount}개의 주문을 통합했습니다.`);
                    this.displayResults();
                } else {
                    ToastManager.error(result.error || '처리 중 오류가 발생했습니다.');
                }
            })
            .withFailureHandler((error) => {
                LoadingManager.hideFullLoading();
                ToastManager.error('서버 오류: ' + error);
            })
            .processOrderFiles(todayFiles);
    },
    
    // 결과 표시
    displayResults() {
        const resultSection = document.getElementById('mergeResultSection');
        resultSection.classList.add('show');
        
        this.displayResultTable();
        
        resultSection.scrollIntoView({ behavior: 'smooth' });
    },
    
    // 결과 테이블 표시
    displayResultTable() {
        const tbody = document.getElementById('mergeResultTableBody');
        const thead = document.getElementById('mergeResultTableHead');
        
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
        
        // 데이터 행 생성
        data.forEach(row => {
            const tr = document.createElement('tr');
            
            headers.forEach(header => {
                const td = document.createElement('td');
                let value = row[header] || '';
                
                // 마켓명 셀 스타일
                if (header === '마켓명' && this.mappingData.markets[value]) {
                    const market = this.mappingData.markets[value];
                    td.style.background = `rgb(${market.color})`;
                    const rgb = market.color.split(',').map(Number);
                    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
                    td.style.color = brightness > 128 ? '#000' : '#fff';
                    td.style.fontWeight = 'bold';
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
