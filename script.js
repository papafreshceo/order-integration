// ===========================
// 전역 변수
// ===========================
let uploadedFiles = [];
let mappingData = null;
let processedData = null;
let standardFields = [];
let salesInfo = {};
let optionProductInfo = {};
let priceCalculationInfo = {};

// API 기본 URL (로컬 개발시는 localhost:3000, 배포시는 자동)
const API_BASE = '';

// ===========================
// 초기화
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    await loadMappingData();
    setupEventListeners();
    switchTab('dashboard');  // 대시보드 탭을 기본으로 설정
    await loadDashboard();
}

// ===========================
// API 호출 함수들
// ===========================
async function loadMappingData() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}/api/mapping`);
        const data = await response.json();
        
        if (data.error) {
            showError('매핑 데이터 로드 실패: ' + data.error);
            hideLoading();
            return;
        }
        
        mappingData = data;
        displaySupportedMarkets(data.markets);
        console.log('매핑 데이터 로드 완료:', mappingData);
    } catch (error) {
        showError('매핑 데이터 로드 실패: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function loadSalesInfo() {
    try {
        const response = await fetch(`${API_BASE}/api/sheets?action=getSalesInfo`);
        salesInfo = await response.json();
        console.log('판매정보 로드 완료:', Object.keys(salesInfo).length, '개');
    } catch (error) {
        console.error('판매정보 로드 오류:', error);
        salesInfo = {};
    }
}

async function loadOptionProductInfo() {
    try {
        const response = await fetch(`${API_BASE}/api/sheets?action=getOptionProductInfo`);
        optionProductInfo = await response.json();
        console.log('옵션상품통합관리 로드 완료:', Object.keys(optionProductInfo).length, '개');
    } catch (error) {
        console.error('옵션상품통합관리 로드 오류:', error);
        optionProductInfo = {};
    }
}

async function loadPriceCalculation() {
    try {
        const response = await fetch(`${API_BASE}/api/sheets?action=getPriceCalculation`);
        priceCalculationInfo = await response.json();
        console.log('가격계산 로드 완료:', Object.keys(priceCalculationInfo).length, '개');
    } catch (error) {
        console.error('가격계산 로드 오류:', error);
        priceCalculationInfo = {};
    }
}

async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/api/sheets?action=getDashboard`);
        const data = await response.json();
        
        if (!data.values) return;
        
        const tbody = document.getElementById('dashboardBody');
        tbody.innerHTML = '';
        
        data.values.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell || '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('대시보드 로드 오류:', error);
    }
}

async function detectMarket(fileName, headers, firstDataRow) {
    try {
        const response = await fetch(`${API_BASE}/api/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileName,
                headers,
                firstDataRow
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            console.error('마켓 감지 실패:', result.error);
            return null;
        }
        
        return result.marketName;
    } catch (error) {
        console.error('마켓 감지 오류:', error);
        return null;
    }
}

// ===========================
// UI 표시 함수들
// ===========================
function displaySupportedMarkets(markets) {
    const container = document.getElementById('supportedMarkets');
    container.innerHTML = '<h3 style="width: 100%; margin-bottom: 10px;">지원 마켓</h3>';
    
    let marketNames = [];
    if (mappingData && mappingData.marketOrder && mappingData.marketOrder.length > 0) {
        marketNames = mappingData.marketOrder;
    } else {
        marketNames = Object.keys(markets);
    }
    
    for (const marketName of marketNames) {
        const market = markets[marketName];
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
}

// ===========================
// 이벤트 리스너 설정
// ===========================
function setupEventListeners() {
    // 탭 전환
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // 파일 업로드
    document.getElementById('uploadFileBtn').addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });
    
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    
    // 드래그 앤 드롭
    const uploadSection = document.getElementById('uploadSection');
    uploadSection.addEventListener('dragover', handleDragOver);
    uploadSection.addEventListener('dragleave', handleDragLeave);
    uploadSection.addEventListener('drop', handleDrop);
    
    // 처리 버튼
    document.getElementById('processBtn').addEventListener('click', processOrders);
    
    // 내보내기 버튼
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
    document.getElementById('saveToSheets').addEventListener('click', saveToGoogleSheets);
    
    // 매핑 시트 열기
    document.getElementById('openMappingSheet').addEventListener('click', function(e) {
        e.preventDefault();
        const spreadsheetId = prompt('스프레드시트 ID를 입력하세요:');
        if (spreadsheetId) {
            window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`, '_blank');
        }
    });
}

function switchTab(tabName) {
    // 탭 버튼 활성화 상태 변경
    document.querySelectorAll('.tab-button').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tabName);
    });
    
    // 탭 컨텐츠 활성화 상태 변경
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.remove('active');
    });
    
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // 대시보드 탭일 때 대시보드 데이터 로드
    if (tabName === 'dashboard') {
        loadDashboard();
    }
}

// ===========================
// 파일 처리 함수들
// ===========================
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    processFiles(Array.from(e.dataTransfer.files));
}

function processFiles(files) {
    const validFiles = files.filter(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        return ['xlsx', 'xls', 'csv'].includes(ext);
    });
    
    if (validFiles.length === 0) {
        showError('유효한 파일이 없습니다. 엑셀 또는 CSV 파일을 선택해주세요.');
        return;
    }
    
    validFiles.forEach(file => readFile(file));
}

function readFile(file) {
    const filename = file.name.toLowerCase();
    const isSmartStore = filename.includes('스마트스토어') || 
                         filename.includes('smartstore') || 
                         filename.includes('네이버') || 
                         filename.includes('전체주문발주') || 
                         filename.includes('주문발주');
    
    const isCsv = filename.endsWith('.csv');
    const isXls = filename.endsWith('.xls') && !filename.endsWith('.xlsx');
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let workbook;
            
            if (isCsv) {
                const csvText = e.target.result;
                workbook = XLSX.read(csvText, { type: 'string' });
            } else if (isXls) {
                const arrayBuffer = e.target.result;
                const u8 = new Uint8Array(arrayBuffer);
                workbook = XLSX.read(u8, {
                    type: 'array',
                    cellDates: true,
                    cellNF: true,
                    cellText: false,
                    dateNF: 'YYYY-MM-DD HH:mm:ss'
                });
            } else {
                const data = e.target.result;
                try {
                    workbook = XLSX.read(data, {
                        type: 'binary',
                        cellDates: true,
                        cellNF: true,
                        cellText: false,
                        dateNF: 'YYYY-MM-DD HH:mm:ss'
                    });
                } catch (readError) {
                    if (isSmartStore) {
                        try {
                            const uint8Array = new Uint8Array(data.length);
                            for (let i = 0; i < data.length; i++) {
                                uint8Array[i] = data.charCodeAt(i) & 0xFF;
                            }
                            workbook = XLSX.read(uint8Array, {
                                type: 'array',
                                password: '1111',
                                cellDates: true,
                                cellNF: true,
                                cellText: false
                            });
                        } catch (pwdError) {
                            showErrorPersistent(`${file.name}: 암호화된 파일입니다.\n암호를 확인해주세요.`);
                            return;
                        }
                    } else {
                        throw readError;
                    }
                }
            }
            
            if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
                showErrorPersistent(`${file.name}: 유효한 시트가 없습니다.`);
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
            
            processExcelData(rawRows, file, isSmartStore);
            
        } catch (error) {
            console.error('파일 처리 오류:', error);
            showErrorPersistent(`${file.name}: 파일 읽기 실패 - ${error.message}`);
        }
    };
    
    reader.onerror = function(error) {
        console.error('FileReader 오류:', error);
        showErrorPersistent(`${file.name}: 파일을 읽을 수 없습니다.`);
    };
    
    if (isCsv) {
        reader.readAsText(file, 'utf-8');
    } else if (isXls) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsBinaryString(file);
    }
}

async function processExcelData(jsonData, file, isSmartStore) {
    const rawRows = jsonData.filter(row => 
        row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
    );
    
    if (rawRows.length === 0) {
        showErrorPersistent(`${file.name}: 데이터가 없습니다.`);
        return;
    }
    
    let headerRowIndex = 0;
    const fileName = file.name.toLowerCase();
    
    if (fileName.includes('전화주문') || fileName.includes('cs재발송') || fileName.includes('cs 재발송')) {
        headerRowIndex = 1;
    } else if (isSmartStore && rawRows.length > 2) {
        const secondRow = rawRows[1];
        const smartStoreHeaders = ['상품주문번호', '주문번호', '구매자명', '구매자연락처', '수취인명'];
        const hasHeaderInSecondRow = secondRow && 
            secondRow.some(cell => smartStoreHeaders.includes(String(cell).trim()));
        if (hasHeaderInSecondRow) {
            headerRowIndex = 1;
        }
    }
    
    const headers = rawRows[headerRowIndex].map(h => String(h || '').trim());
    const dataRows = rawRows.slice(headerRowIndex + 1);
    
    await detectMarketAndAdd(file, headers, dataRows, rawRows, headerRowIndex);
}

// ===========================
// 마켓 감지 및 파일 추가
// ===========================
async function detectMarketAndAdd(file, headers, dataRows, rawRows, provisionalHeaderRowIndex) {
    const firstDataRow = dataRows[0] || [];
    
    // 마켓 감지 API 호출
    const marketName = await detectMarket(file.name, headers, firstDataRow);
    
    if (!marketName) {
        showError(`${file.name}: 마켓을 인식할 수 없습니다.`);
        return;
    }
    
    // 파일 날짜 확인
    const fileDate = new Date(file.lastModified);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    fileDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - fileDate) / (1000 * 60 * 60 * 24));
    const isToday = daysDiff === 0;  // 오늘 날짜인지 확인
    const isRecent = isToday;  // 호환성을 위해 유지
    
    let finalHeaders = headers;
    let finalDataRows = dataRows;
    
    // 마켓별 헤더행 조정
    try {
        if (marketName === '11번가') {
            const idx = 1;
            if (rawRows[idx]) {
                finalHeaders = (rawRows[idx] || []).map(h => String(h || '').trim());
                finalDataRows = rawRows.slice(idx + 1);
            }
        } else if (mappingData && mappingData.markets && mappingData.markets[marketName]) {
            const market = mappingData.markets[marketName];
            if (market.headerRow != null) {
                const idx = Math.max(0, market.headerRow - 1);
                if (rawRows[idx]) {
                    finalHeaders = (rawRows[idx] || []).map(h => String(h || '').trim());
                    finalDataRows = rawRows.slice(idx + 1);
                }
            }
        }
    } catch (e) {
        console.warn('헤더행 적용 실패, 임시 헤더 유지:', e);
    }
    
    // 데이터 정리
    const cleaned = (finalDataRows || []).filter(r => 
        r && r.some(c => c !== null && c !== undefined && c !== '')
    );
    
    const processedRows = cleaned.map(row => {
        const obj = {};
        finalHeaders.forEach((h, i) => {
            obj[h] = row[i] !== undefined ? row[i] : '';
        });
        return obj;
    });
    
    const fileInfo = {
        name: file.name,
        marketName,
        lastModified: file.lastModified,
        isToday: isRecent,
        headers: finalHeaders,
        data: processedRows,
        rowCount: processedRows.length
    };
    
    uploadedFiles.push(fileInfo);
    updateFileList();
    checkWarnings();
}

// ===========================
// 주문 통합 처리
// ===========================
async function processOrders() {
    if (uploadedFiles.length === 0) {
        showError('업로드된 파일이 없습니다.');
        return;
    }
    
    // 오늘 날짜가 아닌 파일 체크
    const oldFiles = uploadedFiles.filter(f => !f.isToday);
    if (oldFiles.length > 0) {
        showError(`오늘 날짜가 아닌 파일이 ${oldFiles.length}개 있습니다. 해당 파일을 제거하거나 최신 파일로 교체 후 진행하세요.`);
        return;
    }

    const todayFiles = uploadedFiles.filter(f => f.isToday);
    if (todayFiles.length === 0) {
        showError('오늘 날짜의 파일이 없습니다. 최신 주문 파일을 다운로드해주세요.');
        return;
    }
    
    showLoading();
    hideError();
    hideSuccess();
    
    try {
        // 필요한 데이터 로드
        await Promise.all([
            loadSalesInfo(),
            loadOptionProductInfo(),
            loadPriceCalculation(),
            ProductMatching.loadProductData()  // 제품 매칭 데이터 로드 추가
        ]);
        
        // 주문 데이터 처리
        const result = await processOrderFiles(todayFiles);
        
        if (!result.success) {
            showError('처리 실패: ' + result.error);
            return;
        }
        
        // 제품 정보 적용
        result.data = await ProductMatching.applyProductInfo(result.data);
        
        processedData = result;
        showSuccess(`성공적으로 ${result.data.length}개의 주문을 통합했습니다.`);
        displayResults(result);
        
    } catch (error) {
        showError('처리 중 오류 발생: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function processOrderFiles(filesData) {
    try {
        console.log('processOrderFiles 시작');
        console.log('받은 파일 수:', filesData.length);
        
        if (!filesData || filesData.length === 0) {
            return {
                success: false,
                error: '처리할 파일이 없습니다'
            };
        }
        
        if (!mappingData || mappingData.error) {
            return {
                success: false,
                error: '매핑 데이터가 없습니다'
            };
        }
        
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const sheetName = `${year}${month}${day}`;
        
        // 결과 데이터
        const mergedData = [];
        const marketCounters = {};
        const statistics = {
            byMarket: {},
            byOption: {},
            total: { count: 0, quantity: 0, amount: 0 }
        };
        
        let processedCount = 0;
        let skippedCount = 0;
        let globalCounter = 0;
        
        console.log('파일별 처리 시작');
        
        // 파일별 처리
        for (const fileData of filesData) {
            console.log(`처리 중: ${fileData.name}, 오늘파일: ${fileData.isToday}, 마켓: ${fileData.marketName}`);
            
            if (!fileData.isToday) {
                console.log('오래된 파일 스킵:', fileData.name);
                skippedCount++;
                continue;
            }
            
            const marketName = fileData.marketName;
            if (!marketName || !mappingData.markets[marketName]) {
                console.log('잘못된 마켓:', marketName);
                skippedCount++;
                continue;
            }
            
            const market = mappingData.markets[marketName];
            
            // 마켓 카운터 초기화
            if (!marketCounters[marketName]) {
                marketCounters[marketName] = 0;
            }
            
            // 통계 초기화
            if (!statistics.byMarket[marketName]) {
                statistics.byMarket[marketName] = {
                    count: 0,
                    quantity: 0,
                    amount: 0
                };
            }
            
            // 데이터 처리
            console.log(`${marketName} 처리 시작: ${fileData.data.length}개 행`);
            
            for (const row of fileData.data) {
                marketCounters[marketName]++;
                globalCounter++;
                
                const mergedRow = {};
                
                // 표준필드 매핑
                for (const standardField of mappingData.standardFields) {
                    if (standardField === '마켓명') {
                        mergedRow['마켓명'] = marketName;
                    } else if (standardField === '연번') {
                        mergedRow['연번'] = globalCounter;
                    } else if (standardField === '마켓') {
                        const marketInitial = market.initial || marketName.charAt(0);
                        mergedRow['마켓'] = marketInitial + String(marketCounters[marketName]).padStart(3, '0');
                    } else {
                        // 매핑된 필드명 가져오기
                        const mappedField = market.mappings[standardField];
                        
                        if (mappedField) {
                            let fieldValue = row[mappedField];
                            
                            // 못 찾았으면 trim된 버전으로 시도
                            if (fieldValue === undefined) {
                                for (const key in row) {
                                    if (key.trim() === mappedField.trim()) {
                                        fieldValue = row[key];
                                        break;
                                    }
                                }
                            }
                            
                            if (fieldValue !== undefined) {
                                // 날짜 필드 처리
                                if (standardField.includes('결제일') || 
                                    standardField.includes('발송일') || 
                                    standardField.includes('주문일')) {
                                    fieldValue = formatDate(fieldValue);
                                }
                                // 금액 필드 처리
                                else if (standardField.includes('금액') || 
                                         standardField.includes('수수료') ||
                                         standardField.includes('할인') || 
                                         standardField.includes('택배')) {
                                    fieldValue = parseNumber(fieldValue);
                                }
                                
                                mergedRow[standardField] = fieldValue;
                            } else {
                                mergedRow[standardField] = '';
                            }
                        } else {
                            mergedRow[standardField] = '';
                        }
                    }
                }
                
                // 추가 정보 처리 (옵션상품통합관리, 가격계산 등)
                const optionName = String(mergedRow['옵션명'] || '').trim();
                const quantity = parseInt(mergedRow['수량']) || 1;
                
                // 옵션상품통합관리 정보
                if (optionName && optionProductInfo[optionName]) {
                    const optionData = optionProductInfo[optionName];
                    
                    mergedRow['출고'] = optionData.shipment || mergedRow['출고'] || '';
                    mergedRow['송장'] = optionData.invoice || mergedRow['송장'] || '';
                    mergedRow['발송지'] = optionData.shippingLocation || mergedRow['발송지'] || '';
                    mergedRow['발송지주소'] = optionData.shippingAddress || mergedRow['발송지주소'] || '';
                    mergedRow['발송지연락처'] = optionData.shippingContact || mergedRow['발송지연락처'] || '';
                    mergedRow['벤더사'] = optionData.vendor || mergedRow['벤더사'] || '';
                    
                    if (optionData.shipment === '위탁') {
                        mergedRow['출고비용'] = optionData.totalCost * quantity;
                    } else {
                        mergedRow['출고비용'] = 0;
                    }
                } else {
                    mergedRow['출고'] = mergedRow['출고'] || '';
                    mergedRow['송장'] = mergedRow['송장'] || '';
                    mergedRow['발송지'] = mergedRow['발송지'] || '';
                    mergedRow['발송지주소'] = mergedRow['발송지주소'] || '';
                    mergedRow['발송지연락처'] = mergedRow['발송지연락처'] || '';
                    mergedRow['벤더사'] = mergedRow['벤더사'] || '';
                    mergedRow['출고비용'] = 0;
                }
                
                // 셀러공급가 계산
                const seller = String(mergedRow['셀러'] || '').trim();
                
                if (seller) {
                    if (optionName && priceCalculationInfo[optionName]) {
                        const unitPrice = priceCalculationInfo[optionName].sellerSupplyPrice || 0;
                        mergedRow['셀러공급가'] = unitPrice * quantity;
                    } else {
                        mergedRow['셀러공급가'] = '';
                    }
                } else {
                    mergedRow['셀러공급가'] = '';
                }
                
                // 정산예정금액 계산
                let settlementAmount = 0;
                
                if (market.settlementFormula) {
                    settlementAmount = calculateSettlementAmount(mergedRow, market.settlementFormula, marketName);
                }
                
                if (settlementAmount === 0 && optionName && salesInfo[optionName]) {
                    settlementAmount = salesInfo[optionName].sellingPrice || 0;
                }
                
                if (settlementAmount === 0 && mergedRow['상품금액']) {
                    settlementAmount = typeof mergedRow['상품금액'] === 'number' ? 
                                      mergedRow['상품금액'] : parseNumber(mergedRow['상품금액']);
                }
                
                mergedRow['정산예정금액'] = settlementAmount;
                
                mergedData.push(mergedRow);
                processedCount++;
                
                // 통계 업데이트
                const amount = settlementAmount;
                
                statistics.byMarket[marketName].count++;
                statistics.byMarket[marketName].quantity += quantity;
                statistics.byMarket[marketName].amount += amount;
                
                if (!statistics.byOption[optionName]) {
                    statistics.byOption[optionName] = {
                        count: 0,
                        quantity: 0,
                        amount: 0,
                        markets: {}
                    };
                }
                
                statistics.byOption[optionName].count++;
                statistics.byOption[optionName].quantity += quantity;
                statistics.byOption[optionName].amount += amount;
                
                if (!statistics.byOption[optionName].markets[marketName]) {
                    statistics.byOption[optionName].markets[marketName] = 0;
                }
                statistics.byOption[optionName].markets[marketName]++;
                
                statistics.total.count++;
                statistics.total.quantity += quantity;
                statistics.total.amount += amount;
            }
            
            console.log(`${marketName} 처리 완료: ${fileData.data.length}개 행 처리됨`);
        }
        
        console.log(`전체 처리 완료: ${processedCount}개 주문, ${skippedCount}개 파일 스킵`);
        
        // 구글 시트에 자동 저장 제거 - 저장 버튼을 통해서만 저장
        
        return {
            success: true,
            data: mergedData,
            statistics: statistics,
            sheetName: sheetName,
            processedCount: processedCount,
            skippedCount: skippedCount,
            standardFields: mappingData.standardFields
        };
        
    } catch (error) {
        console.error('주문 처리 오류:', error);
        return {
            success: false,
            error: error.toString()
        };
    }
}

// ===========================
// 정산금액 계산
// ===========================
function calculateSettlementAmount(row, formula, marketName) {
    try {
        if (!formula || formula.trim() === '') {
            console.log(`${marketName}: 정산공식이 없습니다`);
            return 0;
        }
        
        console.log(`${marketName} 원본 정산공식: ${formula}`);
        
        let calculation = formula;
        
        // 엑셀 함수 변환
        calculation = calculation.replace(/ROUND\(/gi, 'Math.round(');
        calculation = calculation.replace(/ABS\(/gi, 'Math.abs(');
        calculation = calculation.replace(/MIN\(/gi, 'Math.min(');
        calculation = calculation.replace(/MAX\(/gi, 'Math.max(');
        
        // 필드명을 값으로 치환
        for (const [fieldName, fieldValue] of Object.entries(row)) {
            if (calculation.includes(fieldName)) {
                const numValue = typeof fieldValue === 'number' ? fieldValue : parseNumber(fieldValue);
                calculation = calculation.replace(new RegExp(fieldName, 'g'), numValue);
            }
        }
        
        console.log(`  변환된 계산식: ${calculation}`);
        
        // 계산 실행
        try {
            const result = Function('"use strict"; return (' + calculation + ')')();
            const finalResult = isNaN(result) ? 0 : Math.round(result);
            console.log(`  계산 결과: ${finalResult}`);
            return finalResult;
        } catch (evalError) {
            console.error(`  계산 실행 오류: ${evalError.message}`);
            return 0;
        }
        
    } catch (error) {
        console.error(`정산금액 계산 오류 (${marketName}):`, error);
        return 0;
    }
}

// ===========================
// 구글 시트 저장 - 저장 버튼 클릭시만 실행
// ===========================
async function saveToGoogleSheets() {
    if (!processedData || !processedData.data || processedData.data.length === 0) {
        showCenterMessage('저장할 데이터가 없습니다. 먼저 주문을 처리해주세요.', 'error');
        return;
    }
    
    // 이미 저장 중인지 확인
    if (window.isSaving) {
        showCenterMessage('저장 중입니다. 잠시만 기다려주세요.', 'info');
        return;
    }
    
    window.isSaving = true;
    showLoading();
    
    try {
        // 헤더 행 추가
        const headers = processedData.standardFields || mappingData.standardFields;
        const values = [headers];
        
        // 데이터 행 추가
        processedData.data.forEach(row => {
            const rowValues = headers.map(header => {
                const value = row[header];
                return value !== undefined && value !== null ? String(value) : '';
            });
            values.push(rowValues);
        });
        
        // 마켓 색상 매핑 준비
        const marketColors = {};
        if (mappingData && mappingData.markets) {
            Object.entries(mappingData.markets).forEach(([marketName, market]) => {
                if (market.color) {
                    const rgb = market.color.split(',').map(Number);
                    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
                    marketColors[marketName] = {
                        color: market.color,
                        textColor: brightness > 128 ? '#000' : '#fff'
                    };
                }
            });
        }
        
        // API 호출
        const response = await fetch(`${API_BASE}/api/sheets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'saveToSheet',
                sheetName: processedData.sheetName,
                values: values,
                marketColors: marketColors
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`Saved ${processedData.data.length} rows to sheet "${processedData.sheetName}"`);
            showCenterMessage(`구글 시트 "${processedData.sheetName}"에 저장되었습니다.`, 'success');
        } else {
            console.error('시트 저장 실패:', result.error);
            showCenterMessage('시트 저장 실패: ' + (result.error || '알 수 없는 오류'), 'error');
        }
        
    } catch (error) {
        console.error('저장 중 오류:', error);
        showCenterMessage('저장 중 오류 발생: ' + error.message, 'error');
    } finally {
        hideLoading();
        window.isSaving = false;  // 저장 상태 플래그 해제
    }
}

// ===========================
// 날짜 및 숫자 포맷팅
// ===========================
function formatDate(value) {
    try {
        if (!value) return '';
        
        const strValue = String(value);
        
        // 이미 올바른 형식인 경우
        if (strValue.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
            return strValue;
        }
        
        // MM/DD/YY HH:MM:SS 형식 처리
        if (strValue.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
            const parts = strValue.split(' ');
            const datePart = parts[0];
            const timePart = parts[1] || '00:00:00';
            
            const dateParts = datePart.split('/');
            const month = dateParts[0].padStart(2, '0');
            const day = dateParts[1].padStart(2, '0');
            let year = dateParts[2];
            
            if (year.length === 2) {
                year = '20' + year;
            }
            
            return `${year}-${month}-${day} ${timePart}`;
        }
        
        // Date 객체인 경우
        if (value instanceof Date) {
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            const hours = String(value.getHours()).padStart(2, '0');
            const minutes = String(value.getMinutes()).padStart(2, '0');
            const seconds = String(value.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        
        // 엑셀 시리얼 번호인 경우
        if (typeof value === 'number' && value > 25569 && value < 50000) {
            const date = new Date((value - 25569) * 86400 * 1000);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day} 00:00:00`;
        }
        
        // YYYY-MM-DD 형식
        if (strValue.match(/\d{4}-\d{2}-\d{2}/)) {
            return strValue.split(' ')[0] + ' 00:00:00';
        }
        
        return strValue;
        
    } catch (error) {
        console.error('날짜 변환 오류:', error);
        return String(value);
    }
}

function parseNumber(value) {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    
    if (typeof value === 'number') {
        return value;
    }
    
    let strValue = String(value).trim();
    strValue = strValue.replace(/,/g, '');
    strValue = strValue.replace(/[₩￦]/g, '');
    strValue = strValue.replace(/[$¥£€]/g, '');
    strValue = strValue.replace(/\s/g, '');
    
    if (strValue.startsWith('(') && strValue.endsWith(')')) {
        strValue = '-' + strValue.substring(1, strValue.length - 1);
    }
    
    const num = parseFloat(strValue);
    return isNaN(num) ? 0 : num;
}

function numberFormat(num) {
    return new Intl.NumberFormat('ko-KR').format(num);
}

// ===========================
// 파일 리스트 UI 업데이트
// ===========================
function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    
    if (uploadedFiles.length === 0) {
        document.getElementById('processBtn').style.display = 'none';
        document.getElementById('fileSummary').style.display = 'none';
        return;
    }
    
    // 처리 버튼은 숨기고 파일 요약만 먼저 표시
    document.getElementById('processBtn').style.display = 'none';
    document.getElementById('fileSummary').style.display = 'flex';
    
    let sortedFiles = [...uploadedFiles];
    if (mappingData && mappingData.marketOrder && mappingData.marketOrder.length > 0) {
        sortedFiles.sort((a, b) => {
            const ia = mappingData.marketOrder.indexOf(a.marketName);
            const ib = mappingData.marketOrder.indexOf(b.marketName);
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return -1;
            if (ib !== -1) return 1;
            return a.marketName.localeCompare(b.marketName);
        });
    }
    
    let totalOrders = 0;
    const marketSet = new Set();
    
    sortedFiles.forEach((file) => {
        const originalIndex = uploadedFiles.indexOf(file);  // 원본 배열에서의 실제 인덱스 찾기
        totalOrders += file.rowCount;
        marketSet.add(file.marketName);
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        
        const fileNameSection = document.createElement('div');
        fileNameSection.className = 'file-name-section';
        
        // marketTag를 먼저 생성
        const marketTag = document.createElement('span');
        marketTag.className = 'market-tag';
        marketTag.textContent = file.marketName;
        
        const market = mappingData.markets[file.marketName];
        if (market) {
            marketTag.style.background = `rgb(${market.color})`;
            const rgb = market.color.split(',').map(Number);
            const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
            marketTag.style.color = brightness > 128 ? '#000' : '#fff';
        }
        
        fileNameSection.appendChild(marketTag);
        
        // 오래된 파일 경고 배지 처리
        if (!file.isToday) {
            fileItem.classList.add('warning');
            
            // 경고 배지 추가
            const warningBadge = document.createElement('span');
            warningBadge.className = 'warning-badge';
            warningBadge.textContent = '⚠️ 오래된 파일';
            warningBadge.style.cssText = 'background: #fef3c7; color: #f59e0b; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;';
            fileNameSection.appendChild(warningBadge);
        }
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.innerHTML = `<span style="color: #666;">파일명:</span> ${file.name}`;
        
        fileNameSection.appendChild(fileName);
        
        const fileDetails = document.createElement('div');
        fileDetails.className = 'file-details';
        
        const orderCount = document.createElement('span');
        orderCount.className = 'file-order-count';
        orderCount.innerHTML = `<span style="color: #333; font-weight: bold;">${file.marketName}</span> ${file.rowCount}개 주문`;
        
        const fileDate = document.createElement('span');
        fileDate.className = 'file-date';
        const fileDateObj = new Date(file.lastModified);
        fileDate.textContent = fileDateObj.toLocaleDateString('ko-KR');
        
        // 삭제 버튼 추가
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '삭제';
        removeBtn.style.cssText = 'padding: 4px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;';
        removeBtn.onclick = () => removeFile(originalIndex);  // 원본 인덱스 사용
        
        fileDetails.appendChild(orderCount);
        fileDetails.appendChild(fileDate);
        fileDetails.appendChild(removeBtn);
        
        fileInfo.appendChild(fileNameSection);
        fileInfo.appendChild(fileDetails);
        fileItem.appendChild(fileInfo);
        fileList.appendChild(fileItem);
    });
    
    document.getElementById('totalFiles').textContent = uploadedFiles.length;
    document.getElementById('totalMarkets').textContent = marketSet.size;
    document.getElementById('totalOrders').textContent = totalOrders.toLocaleString('ko-KR');
    
    // 파일 목록 렌더링 완료 후 1초 뒤에 버튼 표시
    setTimeout(() => {
        document.getElementById('processBtn').style.display = 'inline-block';
    }, 1000);
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateFileList();
    checkWarnings();
}

function checkWarnings() {
    const oldFiles = uploadedFiles.filter(f => !f.isToday);
    const warningBox = document.getElementById('warningBox');
    const processBtn = document.getElementById('processBtn');
    
    if (oldFiles.length > 0) {
        const warningList = document.getElementById('warningList');
        warningList.innerHTML = '';
        
        oldFiles.forEach(file => {
            const li = document.createElement('li');
            const fileDate = new Date(file.lastModified);
            li.textContent = `${file.name} (${fileDate.toLocaleDateString('ko-KR')})`;
            warningList.appendChild(li);
        });
        
        warningBox.classList.add('show');
        
        // 처리 버튼 비활성화
        if (processBtn) {
            processBtn.disabled = true;
            processBtn.style.opacity = '0.5';
            processBtn.style.cursor = 'not-allowed';
            processBtn.title = '오늘 날짜가 아닌 파일이 포함되어 있습니다. 해당 파일을 제거한 후 진행하세요.';
        }
        
        // 경고 메시지 표시
        showError(`⚠️ 주의: ${oldFiles.length}개의 오래된 파일이 감지되었습니다. 최신 파일로 다시 다운로드하거나 제거 후 진행하세요.`);
    } else {
        warningBox.classList.remove('show');
        
        // 처리 버튼 활성화
        if (processBtn && uploadedFiles.length > 0) {
            processBtn.disabled = false;
            processBtn.style.opacity = '1';
            processBtn.style.cursor = 'pointer';
            processBtn.title = '';
        }
    }
}

// ===========================
// 내보내기 함수들
// ===========================
function exportToExcel() {
    if (!processedData || !processedData.data || processedData.data.length === 0) {
        showError('내보낼 데이터가 없습니다.');
        return;
    }
    
    const ws = XLSX.utils.json_to_sheet(processedData.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '통합주문');
    
    const fileName = `주문통합_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    showSuccess('엑셀 파일이 다운로드되었습니다.');
}

// ===========================
// UI 헬퍼 함수들
// ===========================
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

function showError(message) {
    const d = document.getElementById('errorMessage');
    d.textContent = message;
    d.classList.add('show');
    setTimeout(() => d.classList.remove('show'), 5000);
}

function showErrorPersistent(message) {
    const d = document.getElementById('errorMessage');
    const ex = d.textContent;
    d.textContent = ex ? ex + '\n\n' + message : message;
    d.classList.add('show');
}

function hideError() {
    document.getElementById('errorMessage').classList.remove('show');
}

function showSuccess(message) {
    const d = document.getElementById('successMessage');
    d.textContent = message;
    d.classList.add('show');
    setTimeout(() => d.classList.remove('show'), 5000);
}

function hideSuccess() {
    document.getElementById('successMessage').classList.remove('show');
}

// 중앙 메시지 표시 함수

function showCenterMessage(message, type = 'success', duration = 3000) {
    const msgEl = document.getElementById('centerMessage');
    msgEl.innerHTML = message;  // textContent 대신 innerHTML 사용
    msgEl.className = `center-message ${type}`;
    msgEl.style.display = 'block';
    
    setTimeout(() => {
        msgEl.style.display = 'none';
    }, duration);
}
// ===========================
// 결과 표시
// ===========================
function displayResults(result) {
    const resultSection = document.getElementById('resultSection');
    
    // 스페이서 요소 추가 또는 재사용
    let spacer = document.getElementById('resultSpacer');
    if (!spacer) {
        spacer = document.createElement('div');
        spacer.id = 'resultSpacer';
        spacer.style.height = '20px';  // 원하는 높이로 조정
        spacer.style.backgroundColor = 'transparent';
        resultSection.parentNode.insertBefore(spacer, resultSection);
    }
    
    resultSection.classList.add('show');
    
    displayResultTable(result.data);
    displayStatistics(result.statistics);
    
    setTimeout(() => {
        updatePivotTable();
    }, 100);
    
    // 스페이서로 스크롤하여 결과 섹션이 적절한 위치에 오도록
    spacer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function displayResultTable(data) {
    const thead = document.getElementById('resultTableHead');
    const tbody = document.getElementById('resultTableBody');
    
    if (data.length === 0) {
        thead.innerHTML = '';
        tbody.innerHTML = '<tr><td colspan="100%" style="text-align:center;">데이터가 없습니다</td></tr>';
        return;
    }
    
    // 마켓 순서대로 정렬
    if (mappingData && mappingData.marketOrder && mappingData.marketOrder.length > 0) {
        data.sort((a, b) => {
            const marketA = a['마켓명'];
            const marketB = b['마켓명'];
            const ia = mappingData.marketOrder.indexOf(marketA);
            const ib = mappingData.marketOrder.indexOf(marketB);
            if (ia !== -1 && ib !== -1) return ia - ib;
            if (ia !== -1) return -1;
            if (ib !== -1) return 1;
            return marketA.localeCompare(marketB);
        });
    }
    
    const headers = processedData.standardFields || mappingData.standardFields || Object.keys(data[0]);
    
    // 고정 열너비 설정
    const fixedWidths = {
        '연번': 60,
        '마켓명': 80,
        '마켓': 60,
        '결제일': 150,
        '주문번호': 140,
        '상품주문번호': 140,
        '주문자': 60,
        '수취인': 60,
        '수령인': 90,
        '주문자전화번호': 140,
        '수취인전화번호': 140,
        '수령인전화번호': 140,
        '주소': 180,
        '수취인주소': 240,
        '수령인주소': 240,
        '배송메세지': 50,
        '배송메시지': 50,
        '옵션명': 140,
        '수량': 60,
        '상품금액': 100,
        '할인금액': 100,
        '정산예정금액': 100,
        '수수료1': 100,
        '수수료2': 100,
        '택배비': 80,
        '셀러공급가': 100,
        '출고비용': 100,
        '송장번호': 140,
        '셀러': 80,
        '벤더사': 100,
        '출고처': 80,
        '송장주체': 80,
        '발송지명': 100,
        '발송지주소': 240,
        '발송지연락처': 140
    };
    
    // 필드별 정렬 설정
    const centerAlignFields = ['마켓명', '연번', '결제일', '주문번호', '주문자', '수취인', '옵션명', '수량', '마켓'];
    const leftAlignFields = ['주소', '배송지', '수령인주소', '수취인주소'];
    const rightAlignFields = ['정산예정금액', '상품금액', '할인금액', '수수료1', '수수료2', '택배비', '셀러공급가', '출고비용'];
    
    function getAlignment(fieldName) {
        if (rightAlignFields.some(f => fieldName.includes(f))) return 'right';
        if (leftAlignFields.some(f => fieldName.includes(f))) return 'left';
        if (centerAlignFields.some(f => fieldName.includes(f))) return 'center';
        return 'center';
    }
    
    // 고정열 끝 인덱스 찾기 (수령인전화번호 또는 수취인전화번호)
    let fixedEndIndex = -1;
    for (let i = 0; i < headers.length; i++) {
        if (headers[i].includes('수령인전화번호') || 
            headers[i].includes('수령인 전화번호') || 
            headers[i].includes('수취인전화번호') || 
            headers[i].includes('수취인 전화번호')) {
            fixedEndIndex = i;
            break;
        }
    }
    
    // 못 찾으면 기본값 설정
    if (fixedEndIndex === -1) {
        fixedEndIndex = Math.min(7, headers.length - 1);
    }
    
    // 열너비 배열 생성 - 필수 고정 필드 강제 적용
    const columnWidths = [];
    const leftPositions = [0];
    
    // 필수 고정 필드 목록
    const mandatoryFixedFields = [
        '마켓명', '연번', '결제일', '주문번호', 
        '주문자', '주문자전화번호', '주문자 전화번호',
        '수령인', '수령인전화번호', '수령인 전화번호',
        '수취인', '수취인전화번호', '수취인 전화번호'
    ];
    
    headers.forEach((header, index) => {
        let width;
        
        // 필수 고정 필드인지 확인
        if (mandatoryFixedFields.includes(header)) {
            // 필수 고정 필드는 무조건 fixedWidths 값 사용
            width = fixedWidths[header] || fixedWidths[header.replace(/ /g, '')] || 100;
        } else if (fixedWidths[header]) {
            // 기타 fixedWidths에 정의된 필드
            width = fixedWidths[header];
        } else {
            // 나머지는 기본값
            width = 120;
        }
        
        columnWidths[index] = width;
        
        if (index > 0 && index <= fixedEndIndex) {
            leftPositions[index] = leftPositions[index - 1] + columnWidths[index - 1];
        }
    });
    
    // 헤더 생성
    const headerRow = document.createElement('tr');
    
    headers.forEach((header, index) => {
        const th = document.createElement('th');
        th.textContent = header;
        th.setAttribute('data-column', index);
        th.setAttribute('data-header', header);
        th.style.textAlign = 'center';
        th.style.width = columnWidths[index] + 'px';
        th.style.minWidth = columnWidths[index] + 'px';
        
        // 고정열 처리
        if (index <= fixedEndIndex) {
            th.style.position = 'sticky';
            th.style.left = leftPositions[index] + 'px';
            th.style.zIndex = '20';
            th.style.background = 'var(--bg-secondary)';
            
            if (index === fixedEndIndex) {
                th.style.boxShadow = '2px 0 5px rgba(0,0,0,0.1)';
            }
        }
        
        
        
        headerRow.appendChild(th);
    });
    
    thead.innerHTML = '';
    thead.appendChild(headerRow);
    
    // 바디 생성
    tbody.innerHTML = '';
    
    data.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        
        headers.forEach((header, index) => {
            const td = document.createElement('td');
            td.setAttribute('data-header', header);
            let value = row[header] || '';
            
            td.style.textAlign = getAlignment(header);
            td.style.width = columnWidths[index] + 'px';
            td.style.minWidth = columnWidths[index] + 'px';
            

            // 고정열 처리
            if (index <= fixedEndIndex) {
                td.style.position = 'sticky';
                td.style.left = leftPositions[index] + 'px';
                td.style.zIndex = '10';
                
                if (index === fixedEndIndex) {
                    td.style.boxShadow = '2px 0 5px rgba(0,0,0,0.1)';
                }
            }
            
            // 날짜 포맷팅
            if (header.includes('결제일') || header.includes('발송일') || header.includes('주문일')) {
                value = formatDateForDisplay(value);
            }
            
            // 금액 포맷팅
            const amountFields = ['정산예정금액', '상품금액', '할인금액', '수수료1', '수수료2', 
                                 '택배비', '셀러공급가', '출고비용'];
            if (amountFields.some(field => header.includes(field))) {
                const numValue = parseFloat(String(value).replace(/[^\d.-]/g, ''));
                if (!isNaN(numValue) && value !== '') {
                    value = numValue.toLocaleString('ko-KR');
                    td.classList.add('amount-field');
                }
            }
            
            td.textContent = String(value || '');
            
            // 마켓명 셀 색상
            if (header === '마켓명') {
                const marketName = row[header];
                if (marketName && mappingData && mappingData.markets[marketName]) {
                    const market = mappingData.markets[marketName];
                    td.style.background = `rgb(${market.color})`;
                    const rgb = market.color.split(',').map(Number);
                    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
                    td.style.color = brightness > 128 ? '#000' : '#fff';
                    td.style.fontWeight = 'bold';
                    td.style.textAlign = 'center';
                }
            }
            
            // 옵션명 셀 매칭 상태 표시
            if (header === '옵션명' && row['_matchStatus']) {
                if (row['_matchStatus'] === 'unmatched') {
                    td.classList.add('unmatched-cell');
                    td.contentEditable = true;
                    td.classList.add('editable-cell');
                }
            }
            
            tr.appendChild(td);
        });
        
        // 행 클릭 선택 이벤트
        // 행 클릭 선택 이벤트
        tr.addEventListener('click', function(e) {
            // 기존 선택 제거
            tbody.querySelectorAll('tr.selected-row').forEach(selectedRow => {
                selectedRow.classList.remove('selected-row');
            });
            
            // 현재 행 선택
            this.classList.add('selected-row');
        });
        
        tbody.appendChild(tr);
    });
    
  
}






function formatDateForDisplay(value) {
    if (!value) return '';
    
    let strValue = String(value || '');
    
    // MM/DD/YY 형식 변환
    if (strValue.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
        const parts = strValue.split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '00:00:00';
        const dateParts = datePart.split('/');
        const month = dateParts[0].padStart(2, '0');
        const day = dateParts[1].padStart(2, '0');
        let year = dateParts[2];
        if (year.length === 2) year = '20' + year;
        return `${year}-${month}-${day} ${timePart}`;
    }
    
    // 엑셀 시리얼 번호 변환
    if (/^\d{4,6}$/.test(strValue)) {
        const excelDate = parseInt(strValue);
        const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
        const year = jsDate.getFullYear();
        const month = String(jsDate.getMonth() + 1).padStart(2, '0');
        const day = String(jsDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day} 00:00:00`;
    }
    
    return strValue;
}



// ===========================
// 통계 표시
// ===========================
function displayStatistics(statistics) {
    displayCategorizedStats('marketStats', statistics.byMarket, '마켓명');
    displayCategorizedStats('optionStats', statistics.byOption, '옵션명');
}

function displayCategorizedStats(tableId, stats, firstColumnName) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    
    // 합계 누적
    const totals = {
        overall: { count: 0, quantity: 0, amount: 0 },
        companyProduct: { count: 0, quantity: 0, amount: 0 },
        vendorProduct: { count: 0, quantity: 0, amount: 0 },
        companySales: { count: 0, quantity: 0, amount: 0 },
        sellerSales: { count: 0, quantity: 0, amount: 0 },
        sentCompany: { count: 0, quantity: 0, amount: 0 },
        sentVendor: { count: 0, quantity: 0, amount: 0 },
        unsentCompany: { count: 0, quantity: 0, amount: 0 },
        unsentVendor: { count: 0, quantity: 0, amount: 0 }
    };
    
    Object.keys(stats).sort().forEach(key => {
        const tr = document.createElement('tr');
        
        // 첫 번째 컬럼 (마켓명/옵션명)
        const td1 = document.createElement('td');
        td1.textContent = key;
        td1.style.fontWeight = 'bold';
        
        if (tableId === 'marketStats' && mappingData && mappingData.markets[key]) {
            const market = mappingData.markets[key];
            td1.style.background = `rgb(${market.color})`;
            const rgb = market.color.split(',').map(Number);
            const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
            td1.style.color = brightness > 128 ? '#000' : '#fff';
        }
        
        tr.appendChild(td1);
        
        // 통계 계산
        const filtered = processedData.data.filter(row => {
            if (tableId === 'marketStats') {
                return row['마켓명'] === key;
            } else {
                return row['옵션명'] === key;
            }
        });
        
        const computed = calculateCategoryStats(filtered);
        
        // 전체
        tr.appendChild(createStatCell(computed.overall.count));
        tr.appendChild(createStatCell(computed.overall.quantity));
        tr.appendChild(createStatCell(computed.overall.amount, true));
        
        // 공급처 자사/벤더사
        tr.appendChild(createStatCell(computed.companyProduct.count));
        tr.appendChild(createStatCell(computed.companyProduct.quantity));
        tr.appendChild(createStatCell(computed.companyProduct.amount, true));
        
        tr.appendChild(createStatCell(computed.vendorProduct.count));
        tr.appendChild(createStatCell(computed.vendorProduct.quantity));
        tr.appendChild(createStatCell(computed.vendorProduct.amount, true));
        
        // 판매처 자체/셀러
        tr.appendChild(createStatCell(computed.companySales.count));
        tr.appendChild(createStatCell(computed.companySales.quantity));
        tr.appendChild(createStatCell(computed.companySales.amount, true));
        
        tr.appendChild(createStatCell(computed.sellerSales.count));
        tr.appendChild(createStatCell(computed.sellerSales.quantity));
        tr.appendChild(createStatCell(computed.sellerSales.amount, true));
        
        // 발송 자사/벤더사
        tr.appendChild(createStatCell(computed.sentCompany.count, false, 'sent-col'));
        tr.appendChild(createStatCell(computed.sentCompany.quantity, false, 'sent-col'));
        tr.appendChild(createStatCell(computed.sentCompany.amount, true, 'sent-col'));
        
        tr.appendChild(createStatCell(computed.sentVendor.count, false, 'sent-col'));
        tr.appendChild(createStatCell(computed.sentVendor.quantity, false, 'sent-col'));
        tr.appendChild(createStatCell(computed.sentVendor.amount, true, 'sent-col'));
        
        // 미발송 자사/벤더사
        tr.appendChild(createStatCell(computed.unsentCompany.count, false, 'unsent-col'));
        tr.appendChild(createStatCell(computed.unsentCompany.quantity, false, 'unsent-col'));
        tr.appendChild(createStatCell(computed.unsentCompany.amount, true, 'unsent-col'));
        
        tr.appendChild(createStatCell(computed.unsentVendor.count, false, 'unsent-col'));
        tr.appendChild(createStatCell(computed.unsentVendor.quantity, false, 'unsent-col'));
        tr.appendChild(createStatCell(computed.unsentVendor.amount, true, 'unsent-col'));
        
        tbody.appendChild(tr);
        
        // 합계 누적
        Object.keys(totals).forEach(k => {
            totals[k].count += computed[k].count;
            totals[k].quantity += computed[k].quantity;
            totals[k].amount += computed[k].amount;
        });
    });
    
    // 합계 행
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    
    const tdTotal = document.createElement('td');
    tdTotal.textContent = '합계';
    totalRow.appendChild(tdTotal);
    
    totalRow.appendChild(createStatCell(totals.overall.count));
    totalRow.appendChild(createStatCell(totals.overall.quantity));
    totalRow.appendChild(createStatCell(totals.overall.amount, true));
    
    totalRow.appendChild(createStatCell(totals.companyProduct.count));
    totalRow.appendChild(createStatCell(totals.companyProduct.quantity));
    totalRow.appendChild(createStatCell(totals.companyProduct.amount, true));
    
    totalRow.appendChild(createStatCell(totals.vendorProduct.count));
    totalRow.appendChild(createStatCell(totals.vendorProduct.quantity));
    totalRow.appendChild(createStatCell(totals.vendorProduct.amount, true));
    
    totalRow.appendChild(createStatCell(totals.companySales.count));
    totalRow.appendChild(createStatCell(totals.companySales.quantity));
    totalRow.appendChild(createStatCell(totals.companySales.amount, true));
    
    totalRow.appendChild(createStatCell(totals.sellerSales.count));
    totalRow.appendChild(createStatCell(totals.sellerSales.quantity));
    totalRow.appendChild(createStatCell(totals.sellerSales.amount, true));
    
    // 발송 - 검정색
    totalRow.appendChild(createStatCell(totals.sentCompany.count, false, 'sent-col'));
    totalRow.appendChild(createStatCell(totals.sentCompany.quantity, false, 'sent-col'));
    totalRow.appendChild(createStatCell(totals.sentCompany.amount, true, 'sent-col'));
    
    totalRow.appendChild(createStatCell(totals.sentVendor.count, false, 'sent-col'));
    totalRow.appendChild(createStatCell(totals.sentVendor.quantity, false, 'sent-col'));
    totalRow.appendChild(createStatCell(totals.sentVendor.amount, true, 'sent-col'));
    
    // 미발송 - 빨강색
    totalRow.appendChild(createStatCell(totals.unsentCompany.count, false, 'unsent-col'));
    totalRow.appendChild(createStatCell(totals.unsentCompany.quantity, false, 'unsent-col'));
    totalRow.appendChild(createStatCell(totals.unsentCompany.amount, true, 'unsent-col'));
    
    totalRow.appendChild(createStatCell(totals.unsentVendor.count, false, 'unsent-col'));
    totalRow.appendChild(createStatCell(totals.unsentVendor.quantity, false, 'unsent-col'));
    totalRow.appendChild(createStatCell(totals.unsentVendor.amount, true, 'unsent-col'));
    
    tbody.appendChild(totalRow);
}

function calculateCategoryStats(data) {
    const stats = {
        overall: { count: 0, quantity: 0, amount: 0 },
        companyProduct: { count: 0, quantity: 0, amount: 0 },
        vendorProduct: { count: 0, quantity: 0, amount: 0 },
        companySales: { count: 0, quantity: 0, amount: 0 },
        sellerSales: { count: 0, quantity: 0, amount: 0 },
        sentCompany: { count: 0, quantity: 0, amount: 0 },
        sentVendor: { count: 0, quantity: 0, amount: 0 },
        unsentCompany: { count: 0, quantity: 0, amount: 0 },
        unsentVendor: { count: 0, quantity: 0, amount: 0 }
    };
    
    data.forEach(row => {
        const quantity = parseInt(row['수량']) || 1;
        const amount = parseFloat(row['정산예정금액']) || 0;
        const vendor = String(row['벤더사'] || '').trim();
        const seller = String(row['셀러'] || '').trim();
        const hasInvoice = row['송장번호'] && String(row['송장번호']).trim() !== '';
        
        const isCompanyProduct = !vendor || vendor === '달래마켓';
        const isSellerSales = !!seller;
        
        // 전체
        stats.overall.count++;
        stats.overall.quantity += quantity;
        stats.overall.amount += amount;
        
        // 공급처
        if (isCompanyProduct) {
            stats.companyProduct.count++;
            stats.companyProduct.quantity += quantity;
            stats.companyProduct.amount += amount;
        } else {
            stats.vendorProduct.count++;
            stats.vendorProduct.quantity += quantity;
            stats.vendorProduct.amount += amount;
        }
        
        // 판매처
        if (isSellerSales) {
            stats.sellerSales.count++;
            stats.sellerSales.quantity += quantity;
            stats.sellerSales.amount += amount;
        } else {
            stats.companySales.count++;
            stats.companySales.quantity += quantity;
            stats.companySales.amount += amount;
        }
        
        // 발송/미발송
        if (hasInvoice) {
            if (isCompanyProduct) {
                stats.sentCompany.count++;
                stats.sentCompany.quantity += quantity;
                stats.sentCompany.amount += amount;
            } else {
                stats.sentVendor.count++;
                stats.sentVendor.quantity += quantity;
                stats.sentVendor.amount += amount;
            }
        } else {
            if (isCompanyProduct) {
                stats.unsentCompany.count++;
                stats.unsentCompany.quantity += quantity;
                stats.unsentCompany.amount += amount;
            } else {
                stats.unsentVendor.count++;
                stats.unsentVendor.quantity += quantity;
                stats.unsentVendor.amount += amount;
            }
        }
    });
    
    return stats;
}

function createStatCell(value, isAmount = false, className = '') {
    const td = document.createElement('td');
    td.style.textAlign = isAmount ? 'right' : 'center';
    td.className = isAmount ? 'amount-col' : '';
    
    // 추가 클래스 적용
    if (className) {
        td.classList.add(className);
    }
    
    // 0 값은 빈 셀로 표시
    if (value === 0) {
        td.textContent = '';
    } else if (value) {
        td.textContent = numberFormat(value);
    } else {
        td.textContent = '';
    }
    
    return td;
}

// ===========================
// 피벗테이블
// ===========================
function updatePivotTable() {
    if (!processedData || !processedData.data || processedData.data.length === 0) {
        showError('피벗테이블을 생성할 데이터가 없습니다.');
        return;
    }
    
    const rowField = document.getElementById('pivotRowField').value;
    const colField = document.getElementById('pivotColField').value;
    const colField2 = document.getElementById('pivotColField2').value;
    const valueField = document.getElementById('pivotValueField').value;
    
    const pivotData = createPivotData(processedData.data, rowField, colField, colField2, valueField);
    displayPivotTable(pivotData, rowField, colField, colField2, valueField);
}

function createPivotData(data, rowField, colField, colField2, valueField) {
    const pivot = {};
    const colValues = new Set();
    const colValues2 = new Set();
    
    data.forEach(row => {
        let rowKey = String(row[rowField] || '(빈값)').trim();
        if (rowField === '송장번호유무') {
            rowKey = (row['송장번호'] && String(row['송장번호']).trim() !== '') ? '송장있음' : '송장없음';
        }
        
        if (!pivot[rowKey]) pivot[rowKey] = {};
        
        if (colField === 'none') {
            if (!pivot[rowKey]['전체']) pivot[rowKey]['전체'] = {};
            if (!pivot[rowKey]['전체']['전체']) pivot[rowKey]['전체']['전체'] = [];
            pivot[rowKey]['전체']['전체'].push(row);
        } else {
            let colKey = String(row[colField] || '(빈값)').trim();
            if (colField === '송장번호유무') {
                colKey = (row['송장번호'] && String(row['송장번호']).trim() !== '') ? '송장있음' : '송장없음';
            }
            
            colValues.add(colKey);
            if (!pivot[rowKey][colKey]) pivot[rowKey][colKey] = {};
            
            if (colField2 === 'none') {
                if (!pivot[rowKey][colKey]['전체']) pivot[rowKey][colKey]['전체'] = [];
                pivot[rowKey][colKey]['전체'].push(row);
            } else {
                let colKey2 = String(row[colField2] || '(빈값)').trim();
                if (colField2 === '송장번호유무') {
                    colKey2 = (row['송장번호'] && String(row['송장번호']).trim() !== '') ? '송장있음' : '송장없음';
                }
                
                colValues2.add(colKey2);
                if (!pivot[rowKey][colKey][colKey2]) pivot[rowKey][colKey][colKey2] = [];
                pivot[rowKey][colKey][colKey2].push(row);
            }
        }
    });
    
    return {
        data: pivot,
        columns: colField === 'none' ? ['전체'] : Array.from(colValues).sort(),
        columns2: colField2 === 'none' ? ['전체'] : Array.from(colValues2).sort()
    };
}

function displayPivotTable(pivotData, rowField, colField, colField2, valueField) {
    const table = document.getElementById('pivotTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    // 헤더 생성
    if (colField2 === 'none' || pivotData.columns2.length === 1) {
        const headerRow = document.createElement('tr');
        
        const th1 = document.createElement('th');
        th1.textContent = rowField;
        th1.style.position = 'sticky';
        th1.style.left = '0';
        th1.style.background = '#f5f5f5';
        th1.style.zIndex = '10';
        headerRow.appendChild(th1);
        
        pivotData.columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            th.style.background = '#f5f5f5';
            headerRow.appendChild(th);
        });
        
        const thTotal = document.createElement('th');
        thTotal.textContent = '합계';
        thTotal.style.background = '#e8f5e9';
        thTotal.style.fontWeight = 'bold';
        headerRow.appendChild(thTotal);
        
        thead.appendChild(headerRow);
    } else {
        // 2단 헤더
        const headerRow1 = document.createElement('tr');
        const headerRow2 = document.createElement('tr');
        
        const th1 = document.createElement('th');
        th1.textContent = rowField;
        th1.rowSpan = 2;
        th1.style.position = 'sticky';
        th1.style.left = '0';
        th1.style.background = '#f5f5f5';
        th1.style.zIndex = '10';
        headerRow1.appendChild(th1);
        
        pivotData.columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            th.colSpan = pivotData.columns2.length;
            th.style.background = '#f5f5f5';
            th.style.borderBottom = '1px solid #ddd';
            headerRow1.appendChild(th);
        });
        
        const thTotal1 = document.createElement('th');
        thTotal1.textContent = '합계';
        thTotal1.rowSpan = 2;
        thTotal1.style.background = '#e8f5e9';
        thTotal1.style.fontWeight = 'bold';
        headerRow1.appendChild(thTotal1);
        
        pivotData.columns.forEach(col => {
            pivotData.columns2.forEach(col2 => {
                const th = document.createElement('th');
                th.textContent = col2;
                th.style.background = '#f9f9f9';
                th.style.fontSize = '0.9em';
                headerRow2.appendChild(th);
            });
        });
        
        thead.appendChild(headerRow1);
        thead.appendChild(headerRow2);
    }
    
    // 데이터 행 생성
    const colTotals = {};
    let grandTotal = 0;
    
    Object.keys(pivotData.data).sort().forEach(rowKey => {
        const tr = document.createElement('tr');
        
        const td1 = document.createElement('td');
        td1.textContent = rowKey;
        td1.style.fontWeight = 'bold';
        td1.style.position = 'sticky';
        td1.style.left = '0';
        td1.style.background = 'white';
        td1.style.borderRight = '2px solid #ddd';
        tr.appendChild(td1);
        
        let rowTotal = 0;
        
        pivotData.columns.forEach(col => {
            if (colField2 === 'none' || pivotData.columns2.length === 1) {
                const td = document.createElement('td');
                const cellData = pivotData.data[rowKey][col] ? 
                    (pivotData.data[rowKey][col]['전체'] || pivotData.data[rowKey][col]) : [];
                const value = calculateValue(Array.isArray(cellData) ? cellData : [], valueField);
                td.textContent = formatValue(value, valueField);
                td.style.textAlign = 'right';
                tr.appendChild(td);
                
                rowTotal += value;
                const colKey = col;
                if (!colTotals[colKey]) colTotals[colKey] = 0;
                colTotals[colKey] += value;
            } else {
                pivotData.columns2.forEach(col2 => {
                    const td = document.createElement('td');
                    const cellData = pivotData.data[rowKey][col] && pivotData.data[rowKey][col][col2] ? 
                        pivotData.data[rowKey][col][col2] : [];
                    const value = calculateValue(cellData, valueField);
                    td.textContent = formatValue(value, valueField);
                    td.style.textAlign = 'right';
                    tr.appendChild(td);
                    
                    rowTotal += value;
                    const colKey = `${col}_${col2}`;
                    if (!colTotals[colKey]) colTotals[colKey] = 0;
                    colTotals[colKey] += value;
                });
            }
        });
        
        const tdRowTotal = document.createElement('td');
        tdRowTotal.textContent = formatValue(rowTotal, valueField);
        tdRowTotal.style.textAlign = 'right';
        tdRowTotal.style.background = '#f8f9fa';
        tdRowTotal.style.fontWeight = 'bold';
        tr.appendChild(tdRowTotal);
        
        tbody.appendChild(tr);
        grandTotal += rowTotal;
    });
    
    // 합계 행
    const totalRow = document.createElement('tr');
    totalRow.style.borderTop = '2px solid #4CAF50';
    totalRow.style.background = '#e8f5e9';
    totalRow.style.fontWeight = 'bold';
    
    const tdTotalLabel = document.createElement('td');
    tdTotalLabel.textContent = '합계';
    tdTotalLabel.style.position = 'sticky';
    tdTotalLabel.style.left = '0';
    tdTotalLabel.style.background = '#e8f5e9';
    totalRow.appendChild(tdTotalLabel);
    
    if (colField2 === 'none' || pivotData.columns2.length === 1) {
        pivotData.columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = formatValue(colTotals[col] || 0, valueField);
            td.style.textAlign = 'right';
            totalRow.appendChild(td);
        });
    } else {
        pivotData.columns.forEach(col => {
            pivotData.columns2.forEach(col2 => {
                const td = document.createElement('td');
                const colKey = `${col}_${col2}`;
                td.textContent = formatValue(colTotals[colKey] || 0, valueField);
                td.style.textAlign = 'right';
                totalRow.appendChild(td);
            });
        });
    }
    
    const tdGrandTotal = document.createElement('td');
    tdGrandTotal.textContent = formatValue(grandTotal, valueField);
    tdGrandTotal.style.textAlign = 'right';
    tdGrandTotal.style.background = '#c8e6c9';
    totalRow.appendChild(tdGrandTotal);
    
    tbody.appendChild(totalRow);
}

function calculateValue(data, valueField) {
    if (valueField === 'count') {
        return data.length;
    }
    
    return data.reduce((sum, row) => {
        const val = parseFloat(row[valueField]) || 0;
        return sum + val;
    }, 0);
}

function formatValue(value, valueField) {
    return value.toLocaleString('ko-KR');
}

// ===========================
// 결과 초기화 함수
// ===========================
function resetResultSection() {
    if (!confirm('통합 결과를 초기화하시겠습니까?')) {
        return;
    }
    
    // 결과 섹션 숨기기
    const resultSection = document.getElementById('resultSection');
    resultSection.classList.remove('show');
    
    // 결과 테이블 초기화
    document.getElementById('resultTableHead').innerHTML = '';
    document.getElementById('resultTableBody').innerHTML = '';
    
    // 통계 테이블 초기화
    document.querySelector('#marketStats tbody').innerHTML = '';
    document.querySelector('#optionStats tbody').innerHTML = '';
    
    // 피벗 테이블 초기화
    document.querySelector('#pivotTable thead').innerHTML = '';
    document.querySelector('#pivotTable tbody').innerHTML = '';
    
    // 처리된 데이터 초기화
    processedData = null;
    
    // 스페이서 제거
    const spacer = document.getElementById('resultSpacer');
    if (spacer) {
        spacer.remove();
    }
    
    showSuccess('통합 결과가 초기화되었습니다.');
}








// ===========================
// 중복발송검증 함수
// ===========================
async function verifyDuplicateOrders() {
    const button = document.getElementById('verifyDuplicate');
    button.disabled = true;
    button.textContent = '검증 중...';
    
    showLoading();
    
    try {
        // 7일간 날짜 생성
        const dates = [];
        for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dates.push(`${year}${month}${day}`);
        }
        
        // 과거 7일 데이터 가져오기
        const pastOrders = [];
        for (const sheetName of dates) {
            try {
                const response = await fetch(`${API_BASE}/api/sheets`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'getOrdersByDate',
                        sheetName: sheetName
                    })
                });
                
                const result = await response.json();
                if (result.data && result.data.length > 0) {
                    pastOrders.push(...result.data);
                }
            } catch (error) {
                console.log(`${sheetName} 시트 읽기 실패:`, error);
            }
        }
        
        console.log(`과거 7일 주문 수: ${pastOrders.length}건`);
        
        // 중복 검증
        let shippedDuplicates = 0;
        let unshippedDuplicates = 0;
        const duplicateDetails = [];
        
        if (!processedData || !processedData.data) {
            throw new Error('처리된 데이터가 없습니다.');
        }
        
        // 현재 데이터와 과거 데이터 비교
        processedData.data.forEach((currentOrder, index) => {
            const currentOrderNo = String(currentOrder['주문번호'] || '').trim();
            const currentRecipient = String(currentOrder['수령인'] || currentOrder['수취인'] || '').trim();
            
            if (!currentOrderNo || !currentRecipient) return;
            
            // 과거 데이터에서 중복 찾기
            const duplicates = pastOrders.filter(pastOrder => {
                const pastOrderNo = String(pastOrder['주문번호'] || '').trim();
                const pastRecipient = String(pastOrder['수령인'] || pastOrder['수취인'] || '').trim();
                
                return currentOrderNo === pastOrderNo && currentRecipient === pastRecipient;
            });
            
            if (duplicates.length > 0) {
                // 발송 여부 확인
                const hasShipped = duplicates.some(d => d['송장번호'] && String(d['송장번호']).trim() !== '');
                
                if (hasShipped) {
                    shippedDuplicates++;
                    currentOrder['_duplicateStatus'] = 'shipped';
                    
                    const shippedOrder = duplicates.find(d => d['송장번호']);
                    duplicateDetails.push({
                        type: 'shipped',
                        orderNo: currentOrderNo,
                        recipient: currentRecipient,
                        invoice: shippedOrder['송장번호'],
                        sheetName: shippedOrder['_sheetName'] || '과거주문'
                    });
                } else {
                    unshippedDuplicates++;
                    currentOrder['_duplicateStatus'] = 'unshipped';
                    
                    duplicateDetails.push({
                        type: 'unshipped',
                        orderNo: currentOrderNo,
                        recipient: currentRecipient,
                        sheetName: duplicates[0]['_sheetName'] || '과거주문'
                    });
                }
            }
        });
        
        // 테이블 업데이트
        updateDuplicateStyles();
        
        // 결과 메시지
        let message = `중복발송 검증 완료\n`;
        message += `━━━━━━━━━━━━━━━━\n`;
        
        if (shippedDuplicates > 0) {
            message += `⛔ 발송 중복: ${shippedDuplicates}건\n`;
            message += `   (이미 발송된 주문입니다. 제거 필요)\n`;
        }
        
        if (unshippedDuplicates > 0) {
            message += `⚠️ 미발송 중복: ${unshippedDuplicates}건\n`;
            message += `   (과거 미발송 주문과 중복됩니다. 확인 필요)\n`;
        }
        
        if (shippedDuplicates === 0 && unshippedDuplicates === 0) {
            message += `✓ 중복 주문이 없습니다.`;
        }
        
        showCenterMessage(message.replace(/\n/g, '<br>'), 
                         shippedDuplicates > 0 ? 'error' : 'success', 
                         5000);
        
        // 중복 상세 내역 콘솔 출력
        if (duplicateDetails.length > 0) {
            console.log('중복 상세 내역:', duplicateDetails);
        }
        
    } catch (error) {
        console.error('중복검증 오류:', error);
        showCenterMessage('중복발송 검증 중 오류가 발생했습니다.', 'error');
    } finally {
        hideLoading();
        button.disabled = false;
        button.textContent = '중복발송검증';
    }
}

// 중복 스타일 업데이트
function updateDuplicateStyles() {
    const tbody = document.getElementById('resultTableBody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    const headers = processedData.standardFields || [];
    const orderNoIndex = headers.indexOf('주문번호');
    
    rows.forEach((tr, rowIndex) => {
        const row = processedData.data[rowIndex];
        if (!row) return;
        
        // 주문번호 셀 찾기
        if (orderNoIndex !== -1) {
            const td = tr.children[orderNoIndex];
            if (td) {
                // 기존 클래스 제거
                td.classList.remove('duplicate-shipped', 'duplicate-unshipped');
                
                // 중복 상태에 따른 클래스 추가
                if (row['_duplicateStatus'] === 'shipped') {
                    td.classList.add('duplicate-shipped');
                    td.title = '⛔ 이미 발송된 중복 주문';
                } else if (row['_duplicateStatus'] === 'unshipped') {
                    td.classList.add('duplicate-unshipped');
                    td.title = '⚠️ 미발송 중복 주문 확인 필요';
                }
            }
        }
    });
}

// ===========================
// 피벗테이블
// ===========================



