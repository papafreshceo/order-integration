// ===========================
// 전역 변수
// ===========================
let uploadedFiles = [];
let mappingData = null;
let processedData = null;
let standardFields = [];


// API 기본 URL (로컬 개발시는 localhost:3000, 배포시는 자동)
const API_BASE = '';

// ===========================
// 초기화
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    // 건별 입력 초기화
    ManualOrder.init();
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
        window.mappingData = data;  // 전역 변수로 설정
        displaySupportedMarkets(data.markets);
        console.log('매핑 데이터 로드 완료:', mappingData);
    } catch (error) {
        showError('매핑 데이터 로드 실패: ' + error.message);
    } finally {
        hideLoading();
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
    
    // 헤더 컨테이너 생성
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'width: 100%; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;';
    
    // SVG 아이콘 추가
    const svgIcon = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
    `;
    
    headerDiv.innerHTML = svgIcon + '<h3 style="margin: 0;">지원 마켓</h3>';
    container.innerHTML = '';
    container.appendChild(headerDiv);
    
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
    
    // 헤더 타이틀 클릭시 대시보드로 이동
    document.getElementById('headerTitle').addEventListener('click', function() {
        switchTab('dashboard');
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
    
    // 검색 탭일 때 모듈 로드
    if (tabName === 'search') {
        loadSearchTab();
    }

    // 발송관리 탭일 때 iframe 새로고침
    if (tabName === 'shipping') {
        const shippingIframe = document.querySelector('#shipping-tab iframe');
        if (shippingIframe) {
            // iframe의 src를 다시 설정하여 새로고침
            const currentSrc = shippingIframe.src;
            shippingIframe.src = '';
            setTimeout(() => {
                shippingIframe.src = currentSrc;
            }, 10);
        }
    }
    
    // 설정 탭일 때 설정 모듈 로드
    if (tabName === 'settings') {
        loadSettingsTab();
    }
}

// 설정 탭 로드
async function loadSettingsTab() {
    const container = document.getElementById('settings-container');
    if (!container) {
        console.error('settings-container를 찾을 수 없습니다');
        return;
    }
    
    try {
        const response = await fetch('tab/settings/settings-module.html');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        container.innerHTML = html;
        
        console.log('설정 탭 로드 완료');
        
    } catch (error) {
        console.error('설정 탭 로드 오류:', error);
        container.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h3>설정 모듈을 로드할 수 없습니다</h3>
                <p style="color: #6c757d;">tabs/settings/settings-module.html 파일을 확인해주세요</p>
            </div>
        `;
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
    const isXlsx = filename.endsWith('.xlsx');
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let workbook;
            
            if (isCsv) {
                // CSV 처리
                const csvText = e.target.result;
                workbook = XLSX.read(csvText, { type: 'string' });
                
            } else if (isXls) {
                // .xls 파일 처리 (97-2003 형식)
                const data = e.target.result;
                const arr = new Uint8Array(data);
                
                // 11번가 등 .xls 파일 처리
                try {
                    workbook = XLSX.read(arr, {
                        type: 'array',
                        cellDates: true,
                        cellNF: true,
                        cellText: false,
                        dateNF: 'YYYY-MM-DD HH:mm:ss',
                        codepage: 949  // 한글 인코딩 지원
                    });
                    console.log(`${file.name}: .xls 파일 읽기 성공`);
                } catch (xlsError) {
                    console.error('.xls 읽기 실패, 대체 방법 시도:', xlsError);
                    
                    // 대체 방법: binary string으로 시도
                    const binaryString = Array.from(arr, byte => String.fromCharCode(byte)).join('');
                    workbook = XLSX.read(binaryString, {
                        type: 'binary',
                        cellDates: true,
                        cellNF: true,
                        cellText: false,
                        codepage: 949
                    });
                }
                
            } else if (isXlsx) {
                // .xlsx 파일 처리
                const data = e.target.result;
                
                try {
                    // 일반 xlsx 파일 시도
                    workbook = XLSX.read(data, {
                        type: 'binary',
                        cellDates: true,
                        cellNF: true,
                        cellText: false,
                        dateNF: 'YYYY-MM-DD HH:mm:ss'
                    });
                } catch (readError) {
                    // 암호화된 스마트스토어 파일 처리
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
                            console.log('암호화된 스마트스토어 파일 처리 성공');
                        } catch (pwdError) {
                            showErrorPersistent(`${file.name}: 암호화된 파일입니다.\n암호를 확인해주세요.`);
                            return;
                        }
                    } else {
                        throw readError;
                    }
                }
            } else {
                showErrorPersistent(`${file.name}: 지원하지 않는 파일 형식입니다.`);
                return;
            }
            
            if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
                showErrorPersistent(`${file.name}: 유효한 시트가 없습니다.`);
                return;
            }
            
            // 첫 번째 시트 읽기
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json(firstSheet, {
                header: 1,
                defval: '',
                blankrows: false,
                raw: false,
                dateNF: 'YYYY-MM-DD HH:mm:ss'
            });
            
            console.log(`${file.name}: ${rawRows.length}개 행 읽기 완료`);
            
            // processExcelData로 전달
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
    
    // 파일 타입에 따라 적절한 읽기 방법 선택
    if (isCsv) {
        reader.readAsText(file, 'utf-8');
    } else if (isXls) {
        // .xls는 ArrayBuffer로 읽기
        reader.readAsArrayBuffer(file);
    } else if (isXlsx) {
        // .xlsx는 BinaryString으로 읽기
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
    
    // 토스 파일 체크 추가
    const isToss = fileName.includes('토스') || fileName.includes('toss');
    
    // 마켓별 헤더 위치 결정
    if (fileName.includes('전화주문') || fileName.includes('cs재발송') || fileName.includes('cs 재발송')) {
        // 전화주문, CS재발송은 2행이 헤더
        headerRowIndex = 1;
        console.log(`${file.name}: 전화주문/CS재발송 - 2행 헤더 사용`);
    } else if (fileName.includes('주문내역') && fileName.includes('상품준비중')) {
    // 토스 파일 패턴 확인 - "주문내역-상품준비중-" 형식
    headerRowIndex = 0; // 토스는 실제로 1행이 헤더
    console.log(`${file.name}: 토스 파일 - 1행 헤더 사용`);
    
    // 토스 헤더 확인
    const tossHeaders = rawRows[0].map(h => String(h || '').trim());
    console.log('토스 실제 헤더:', tossHeaders);
    if (rawRows[1]) {
        console.log('토스 첫 데이터 행:', rawRows[1]);
    }
    } else if (isSmartStore && rawRows.length > 2) {
        // 스마트스토어는 내용 확인 후 결정
        const secondRow = rawRows[1];
        const smartStoreHeaders = ['상품주문번호', '주문번호', '구매자명', '구매자연락처', '수취인명'];
        const hasHeaderInSecondRow = secondRow && 
            secondRow.some(cell => smartStoreHeaders.includes(String(cell).trim()));
        if (hasHeaderInSecondRow) {
            headerRowIndex = 1;
            console.log(`${file.name}: 스마트스토어 - 2행 헤더 확인됨`);
        } else {
            console.log(`${file.name}: 스마트스토어 - 1행 헤더 사용`);
        }
    } else {
        // 기본적으로 1행이 헤더
        console.log(`${file.name}: 기본 - 1행 헤더 사용`);
    }
    
    // 헤더와 데이터 추출
    const headers = rawRows[headerRowIndex].map(h => String(h || '').trim());
    const dataRows = rawRows.slice(headerRowIndex + 1);
    
    console.log(`${file.name}: 헤더 ${headers.length}개, 데이터 ${dataRows.length}개 행`);
    console.log(`헤더 샘플: ${headers.slice(0, 5).join(', ')}...`);
    
    // 마켓 감지 및 파일 추가
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
    // 토스는 항상 2행이 헤더 - provisionalHeaderRowIndex 사용
    if (marketName === '토스') {
        // processExcelData에서 이미 headerRowIndex = 1로 설정됨
        // 하지만 detectMarketAndAdd에서는 다시 원본 rawRows 사용
        const correctIdx = 0; // 토스 파일의 실제 헤더는 첫 번째 행
        if (rawRows[correctIdx]) {
            finalHeaders = (rawRows[correctIdx] || []).map(h => String(h || '').trim());
            finalDataRows = rawRows.slice(correctIdx + 1);
            console.log(`토스 헤더 수정: ${finalHeaders.slice(0, 5).join(', ')}...`);
        }
    } else if (marketName === '11번가') {
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
    // 건별 입력과 Excel 파일 모두 체크
    const manualOrders = ManualOrder.getOrders();
    const hasManualOrders = manualOrders.length > 0;
    const hasUploadedFiles = uploadedFiles.length > 0;
    
    if (!hasManualOrders && !hasUploadedFiles) {
        showError('처리할 주문이 없습니다. 건별 입력 또는 Excel 파일을 추가해주세요.');
        return;
    }
    
    // 오늘 날짜가 아닌 파일 체크
    const oldFiles = uploadedFiles.filter(f => !f.isToday);
    if (oldFiles.length > 0) {
        showError(`오늘 날짜가 아닌 파일이 ${oldFiles.length}개 있습니다. 해당 파일을 제거하거나 최신 파일로 교체 후 진행하세요.`);
        return;
    }

    const todayFiles = uploadedFiles.filter(f => f.isToday);
    if (todayFiles.length === 0 && !hasManualOrders) {
        showError('오늘 날짜의 파일이 없습니다. 최신 주문 파일을 다운로드해주세요.');
        return;
    }
    
    showLoading();
    hideError();
    hideSuccess();
    
    try {
        // 필요한 데이터 로드
        await ProductMatching.loadProductData();
        
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
        
        // 건별 입력 데이터 추가
        const manualOrders = ManualOrder.getOrders();
        if (manualOrders.length > 0) {
            const manualFileData = {
                name: '건별입력',
                marketName: '건별입력',
                isToday: true,
                headers: Object.keys(manualOrders[0]),
                data: manualOrders,
                rowCount: manualOrders.length
            };
            filesData = [manualFileData, ...filesData];
        }
        
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
    
    // 토스 디버깅
    if (marketName === '토스' && marketCounters[marketName] === 1) {
        console.log('토스 첫 번째 행 원본 데이터:', row);
        console.log('토스 원본 키 목록:', Object.keys(row));
        console.log('토스 매핑 정보:', market.mappings);
    }
    
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
                
                // 토스 디버깅
                if (marketName === '토스' && marketCounters[marketName] === 1 && !fieldValue) {
                    console.log(`토스 매핑 실패: ${standardField} → ${mappedField} (값 없음)`);
                }
                
                // 못 찾았으면 trim된 버전으로 시도
                if (fieldValue === undefined) {
                    for (const key in row) {
                        if (key.trim() === mappedField.trim()) {
                            fieldValue = row[key];
                            if (marketName === '토스' && fieldValue !== undefined) {
                                console.log(`토스 trim 매칭 성공: ${mappedField} = ${key}`);
                            }
                            break;
                        }
                    }
                }
                
                // 그래도 못 찾았으면 부분 매칭 시도 (토스용)
                if (fieldValue === undefined && marketName === '토스') {
                    for (const key in row) {
                        // 공백 제거 후 비교
                        const cleanKey = key.replace(/\s/g, '');
                        const cleanMapped = mappedField.replace(/\s/g, '');
                        if (cleanKey === cleanMapped || 
                            cleanKey.includes(cleanMapped) || 
                            cleanMapped.includes(cleanKey)) {
                            console.log(`토스 부분 매칭: ${mappedField} ≈ ${key}`);
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
                
                // ProductMatching에서 처리하도록 위임
                mergedRow['출고'] = mergedRow['출고'] || '';
                mergedRow['송장'] = mergedRow['송장'] || '';
                mergedRow['발송지'] = mergedRow['발송지'] || '';
                mergedRow['발송지주소'] = mergedRow['발송지주소'] || '';
                mergedRow['발송지연락처'] = mergedRow['발송지연락처'] || '';
                mergedRow['벤더사'] = mergedRow['벤더사'] || '';
                mergedRow['출고비용'] = 0;
                mergedRow['셀러공급가'] = '';
                
                // 정산예정금액 계산
let settlementAmount = 0;

// 1. 정산공식이 있으면 우선 적용
if (market.settlementFormula) {
    settlementAmount = calculateSettlementAmount(mergedRow, market.settlementFormula, marketName);
}

// 2. 정산공식 결과가 0이고 상품금액이 있으면 상품금액 사용
if (settlementAmount === 0 && mergedRow['상품금액']) {
    settlementAmount = typeof mergedRow['상품금액'] === 'number' ? 
                      mergedRow['상품금액'] : parseNumber(mergedRow['상품금액']);
}

// 3. 그래도 0이면 최종결제금액 사용
if (settlementAmount === 0 && mergedRow['최종결제금액']) {
    settlementAmount = typeof mergedRow['최종결제금액'] === 'number' ? 
                      mergedRow['최종결제금액'] : parseNumber(mergedRow['최종결제금액']);
}

mergedRow['정산예정금액'] = settlementAmount;
                
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
        
        // 마켓 순서대로 정렬
        if (mappingData && mappingData.marketOrder && mappingData.marketOrder.length > 0) {
            mergedData.sort((a, b) => {
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
        
        // 연번 재할당 (정렬 후)
        mergedData.forEach((row, index) => {
            row['연번'] = index + 1;
        });
        
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
    
    try {
        // 직원이 볼 수 없는 컬럼 정의 (택배비 제외)
        const restrictedColumns = [
            '셀러공급가', '출고비용', '정산예정금액', '정산대상금액',
            '상품금액', '최종결제금액', '할인금액', '마켓부담할인금액',
            '판매자할인쿠폰할인', '구매쿠폰적용금액', '쿠폰할인금액', '마켓부담할인액',
            '기타지원금할인금', '수수료1', '수수료2'
            // 택배비는 제외 (직원도 볼 수 있음)
        ];
        
        // 전체 헤더
        const allHeaders = processedData.standardFields || mappingData.standardFields || Object.keys(processedData.data[0]);
        
        // 권한에 따른 헤더 필터링
        const headers = allHeaders.filter(header => 
            window.currentUser?.role === 'admin' || !restrictedColumns.includes(header)
        );
        
        // 워크시트 데이터 준비
        const wsData = [];
        
        // 헤더 행 추가
        wsData.push(headers);
        
        // 데이터 행 추가
        processedData.data.forEach(row => {
            const rowData = headers.map(header => {
                const value = row[header];
                
                // 날짜 형식 처리
                if (header.includes('결제일') || header.includes('발송일') || header.includes('주문일')) {
                    return formatDateForDisplay(value);
                }
                
                // 금액 형식 처리 (숫자로 유지)
                const amountFields = ['셀러공급가', '출고비용', '정산예정금액', '정산대상금액', '상품금액', 
                                     '최종결제금액', '할인금액', '마켓부담할인금액', '판매자할인쿠폰할인', 
                                     '구매쿠폰적용금액', '쿠폰할인금액', '기타지원금할인금', '수수료1', '수수료2', '택배비'];
                if (amountFields.some(field => header.includes(field))) {
                    const numValue = parseFloat(String(value || '').replace(/[^\d.-]/g, ''));
                    return isNaN(numValue) ? 0 : numValue;
                }
                
                return value !== undefined && value !== null ? String(value) : '';
            });
            wsData.push(rowData);
        });
        
        // 워크시트 생성
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // 열 너비 설정
        const fixedWidths = {
            '연번': 50, '마켓명': 100, '마켓': 60, '결제일': 150,
            '주문번호': 140, '상품주문번호': 140, '주문자': 70, '수취인': 70,
            '수령인': 70, '주문자전화번호': 120, '수취인전화번호': 120,
            '수령인전화번호': 120, '주소': 300, '수취인주소': 300,
            '수령인주소': 300, '배송메세지': 100, '배송메시지': 100,
            '옵션명': 160, '수량': 60, '확인': 160, '셀러': 80,
            '셀러공급가': 70, '출고처': 80, '송장주체': 60, '벤더사': 100,
            '발송지명': 100, '발송지주소': 300, '발송지연락처': 120,
            '출고비용': 90, '정산예정금액': 90, '정산대상금액': 90,
            '상품금액': 80, '최종결제금액': 90, '할인금액': 90,
            '마켓부담할인금액': 120, '판매자할인쿠폰할인': 120,
            '구매쿠폰적용금액': 120, '쿠폰할인금액': 100,
            '기타지원금할인금': 120, '수수료1': 70, '수수료2': 70,
            '판매아이디': 80, '분리배송 Y/N': 100, '택배비': 80,
            '발송일(송장입력일)': 150, '택배사': 80, '송장번호': 140
        };
        
        ws['!cols'] = headers.map(header => ({
            wch: Math.floor((fixedWidths[header] || 120) / 7)
        }));
        
        // 워크북 생성
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '통합주문');
        
        // 파일명 생성
        const today = new Date();
        const fileName = `주문통합_${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}.xlsx`;
        
        // 파일 다운로드
        XLSX.writeFile(wb, fileName, { bookType: 'xlsx', type: 'binary' });
        
        showSuccess('엑셀 파일이 다운로드되었습니다.');
        
    } catch (error) {
        console.error('엑셀 내보내기 오류:', error);
        showError('엑셀 파일 생성 중 오류가 발생했습니다.');
    }
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
        spacer.style.height = '20px';
        spacer.style.backgroundColor = 'transparent';
        resultSection.parentNode.insertBefore(spacer, resultSection);
    }
    
    // show 클래스 추가 및 display 강제 설정
    resultSection.classList.add('show');
    resultSection.style.display = 'block';  // 강제 설정 추가
    
    // 테이블 표시 전 로그
    console.log('displayResults 실행: 데이터 개수 =', result.data.length);
    
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
    
    // 직원이 볼 수 없는 컬럼 정의 (택배비 제외)
    const restrictedColumns = [
        '셀러공급가', '출고비용', '정산예정금액', '정산대상금액',
        '상품금액', '최종결제금액', '할인금액', '마켓부담할인금액',
        '판매자할인쿠폰할인', '구매쿠폰적용금액', '쿠폰할인금액', '마켓부담할인액',
        '기타지원금할인금', '수수료1', '수수료2'
        // 택배비는 제외 (직원도 볼 수 있음)
    ];
    
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
    
    const allHeaders = processedData.standardFields || mappingData.standardFields || Object.keys(data[0]);
    
    // 권한에 따른 헤더 필터링
    const headers = allHeaders.filter(header => 
        window.currentUser?.role === 'admin' || !restrictedColumns.includes(header)
    );
    
    // 고정 열너비 설정
    const fixedWidths = {
        '연번': 50,
        '마켓명': 100,
        '마켓': 60,
        '결제일': 150,
        '주문번호': 140,
        '상품주문번호': 140,
        '주문자': 70,
        '수취인': 70,
        '수령인': 70,
        '주문자전화번호': 120,
        '수취인전화번호': 120,
        '수령인전화번호': 120,
        '주소': 300,
        '수취인주소': 300,
        '수령인주소': 300,
        '배송메세지': 100,
        '배송메시지': 100,
        '옵션명': 160,
        '수량': 60,
        '마켓': 80,
        '확인': 160,
        '셀러': 80,
        '셀러공급가': 70,
        '출고처': 80,
        '송장주체': 60,
        '벤더사': 100,
        '발송지명': 100,
        '발송지주소': 300,
        '발송지연락처': 120,
        '출고비용': 90,
        '정산예정금액': 90,
        '정산대상금액': 90,
        '상품금액': 80,
        '최종결제금액': 90,
        '할인금액': 90,
        '마켓부담할인금액': 120,
        '판매자할인쿠폰할인': 120,
        '구매쿠폰적용금액': 120,
        '쿠폰할인금액': 100,
        '기타지원금할인금': 120,
        '수수료1': 70,
        '수수료2': 70,
        '판매아이디':80,
        '분리배송 Y/N':100,
        '택배비': 80,
        '발송일(송장입력일)':150,      
        '택배사': 80,
        '송장번호': 140
    };
    
    // 필드별 정렬 설정
    const centerAlignFields = ['마켓명', '연번', '결제일', '주문번호', '주문자', '수취인', '옵션명', '수량', '마켓','택배사'];
    const leftAlignFields = ['주소', '배송지', '수령인주소', '수취인주소'];
    const rightAlignFields = ['셀러공급가','출고비용' , '정산예정금액', '정산대상금액' , '상품금액','최종결제금액', '할인금액','마켓부담할인금액','판매자할인쿠폰할인','구매쿠폰적용금액','쿠폰할인금액','기타지원금할인금', '수수료1', '수수료2', '택배비'];
    
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
    
    // 테이블 설정 - 열너비 강제 고정
    const table = document.getElementById('resultTable');
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    table.style.minWidth = totalWidth + 'px';
    table.style.width = totalWidth + 'px';
    table.style.tableLayout = 'fixed';
    
    // colgroup 생성하여 열너비 강제 적용
    let colgroup = table.querySelector('colgroup');
    if (!colgroup) {
        colgroup = document.createElement('colgroup');
        table.insertBefore(colgroup, thead);
    }
    colgroup.innerHTML = '';
    
    headers.forEach((header, index) => {
        const col = document.createElement('col');
        col.style.width = columnWidths[index] + 'px';
        colgroup.appendChild(col);
    });
    
    // 헤더 생성
    const headerRow = document.createElement('tr');
    
    headers.forEach((header, colIndex) => {
        // allHeaders에서의 실제 인덱스 찾기 (필터링된 경우를 위해)
        const index = allHeaders.indexOf(header);
        const th = document.createElement('th');
        th.textContent = header;
        th.setAttribute('data-column', colIndex);
        th.setAttribute('data-header', header);
        th.style.textAlign = 'center';
        th.style.width = columnWidths[colIndex] + 'px';
        th.style.minWidth = columnWidths[colIndex] + 'px';
        th.style.maxWidth = columnWidths[colIndex] + 'px';
        
        // 특정 헤더들에 연한 초록색 배경 적용
        const greenHeaders = ['마켓명', '연번', '마켓', '결제일', '주문번호', '상품주문번호', 
                             '주문자', '수취인', '수령인', '주문자 전화번호', '수취인 전화번호', 
                             '수령인 전화번호', '주소', '수취인주소', '수령인주소', 
                             '배송메세지', '배송메시지', '옵션명', '수량', '확인', '특이/요청사항'];
        
        // 고정열 처리
        if (colIndex <= fixedEndIndex) {
            th.style.position = 'sticky';
            th.style.left = leftPositions[colIndex] + 'px';
            th.style.zIndex = '20';
            
            // 초록색 배경 적용 (고정열도 체크)
            if (greenHeaders.includes(header)) {
                th.style.background = '#eafffd';
            } else {
                th.style.background = 'var(--bg-secondary)';
            }
            
            if (colIndex === fixedEndIndex) {
                th.style.boxShadow = '2px 0 5px rgba(0,0,0,0.1)';
            }
        } else {
            // 고정열이 아닌 헤더도 초록색 체크
            if (greenHeaders.includes(header)) {
                th.style.background = '#eafffd';
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
        
        headers.forEach((header, colIndex) => {
            const td = document.createElement('td');
            td.setAttribute('data-header', header);
            let value = row[header] || '';
            
            td.style.textAlign = getAlignment(header);
            td.style.width = columnWidths[colIndex] + 'px';
            td.style.minWidth = columnWidths[colIndex] + 'px';
            
            // 고정열 처리
            if (colIndex <= fixedEndIndex) {
                td.style.position = 'sticky';
                td.style.left = leftPositions[colIndex] + 'px';
                td.style.zIndex = '10';
                
                if (colIndex === fixedEndIndex) {
                    td.style.boxShadow = '2px 0 5px rgba(0,0,0,0.1)';
                }
            }
            
            // 날짜 포맷팅
            if (header.includes('결제일') || header.includes('발송일') || header.includes('주문일')) {
                value = formatDateForDisplay(value);
            }
            
            // 금액 포맷팅
            const amountFields = ['셀러공급가','출고비용' , '정산예정금액', '정산대상금액' , '상품금액','최종결제금액', '할인금액','마켓부담할인금액','판매자할인쿠폰할인','구매쿠폰적용금액','쿠폰할인금액','기타지원금할인금', '수수료1', '수수료2', '택배비'];
            if (amountFields.some(field => header.includes(field))) {
                const numValue = parseFloat(String(value).replace(/[^\d.-]/g, ''));
                if (!isNaN(numValue) && value !== '') {
                    value = numValue.toLocaleString('ko-KR');
                    td.classList.add('amount-field');
                }
            }
            
            td.textContent = String(value || '');
            
            // 특이/요청사항 컬럼 빨강색 처리
            if (header === '특이/요청사항' && value) {
                td.style.color = '#dc3545';
                td.style.fontWeight = '400';
            }
            
            // 수량 2 이상 강조 처리
            if (header === '수량') {
                const quantity = parseInt(value);
                if (quantity >= 2) {
                    td.classList.add('quantity-highlight');
                }
            }
            
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
            if (header === '옵션명') {
                if (row['_matchStatus'] === 'unmatched' || row['_matchStatus'] === 'modified' || row['_matchStatus'] === 'modified-matched') {
                    // 상태별 클래스 적용
                    if (row['_matchStatus'] === 'unmatched') {
                        td.classList.add('unmatched-cell');
                    } else if (row['_matchStatus'] === 'modified') {
                        td.classList.add('modified-cell');
                    } else if (row['_matchStatus'] === 'modified-matched') {
                        td.classList.add('modified-matched-cell');
                    }
                    
                    // 매칭 실패나 수정된 경우만 편집 가능
                    if (row['_matchStatus'] !== 'modified-matched') {
                        td.contentEditable = true;
                        td.classList.add('editable-cell');
                        
                        const originalValue = row['옵션명'];
                        
                        // blur 이벤트로 값 변경 감지
                        td.addEventListener('blur', function() {
                            const newValue = td.textContent.trim();
                            if (newValue !== originalValue) {
                                // processedData 업데이트
                                row['옵션명'] = newValue;
                                row['_matchStatus'] = 'modified';
                                
                                // 수정된 셀 추적
                                const modifiedCells = ProductMatching.getModifiedCells();
                                modifiedCells.set(`${rowIndex}-옵션명`, {
                                    original: originalValue,
                                    modified: newValue
                                });
                                
                                // 클래스 업데이트
                                td.classList.remove('unmatched-cell');
                                td.classList.add('modified-cell');
                            }
                        });
                        
                        // 엔터키 처리 추가
                        td.addEventListener('keydown', function(e) {
                            if (e.key === 'Enter') {
                                e.preventDefault();  // 줄바꿈 방지
                                td.blur();  // 편집 종료
                                
                                // 현재 행 선택
                                setTimeout(function() {
                                    // 모든 행의 선택 상태 제거
                                    tbody.querySelectorAll('tr.selected-row').forEach(selectedRow => {
                                        selectedRow.classList.remove('selected-row');
                                    });
                                    
                                    // 현재 행 선택
                                    tr.classList.add('selected-row');
                                }, 10);
                            }
                        });
                    }
                }
            }
            
            tr.appendChild(td);
        });
        
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
// 통계 표시 - 직원 모드에서 금액 숨기기 추가
// ===========================
function displayStatistics(statistics) {
    displayCategorizedStats('marketStats', statistics.byMarket, '마켓명');
    displayCategorizedStats('optionStats', statistics.byOption, '옵션명');
}

function displayCategorizedStats(tableId, stats, firstColumnName) {
    const table = document.getElementById(tableId);
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    
    // 직원 모드 체크
    const isStaff = window.currentUser?.role !== 'admin';
    
    // 직원 모드에서 thead의 금액 컬럼 숨기기
    if (isStaff) {
        const thead = table.querySelector('thead');
        const rows = thead.querySelectorAll('tr');
        
        // 3번째 행의 th들 (건수/수량/금액 반복)
        if (rows[2]) {
            const ths = rows[2].querySelectorAll('th');
            // 금액 컬럼 인덱스: 2, 5, 8, 11, 14, 17, 20, 23, 26
            [2, 5, 8, 11, 14, 17, 20, 23, 26].forEach(index => {
                if (ths[index]) {
                    ths[index].style.display = 'none';
                }
            });
        }
        
        // 2번째 행의 colspan 조정
        if (rows[1]) {
            const ths = rows[1].querySelectorAll('th');
            ths.forEach(th => {
                if (th.colSpan === '3') {
                    th.colSpan = '2';  // 금액 제외하여 2개로
                }
            });
        }
        
        // 1번째 행의 colspan 조정
        if (rows[0]) {
            const ths = rows[0].querySelectorAll('th');
            ths.forEach(th => {
                if (th.colSpan === '6') {
                    th.colSpan = '4';  // 금액 2개 제외하여 4개로
                } else if (th.colSpan === '3' && th.rowSpan !== '2') {
                    th.colSpan = '2';  // 전체 섹션
                }
            });
        }
    }
    
    // colgroup이 없으면 추가하여 열너비 강제 고정
    if (!table.querySelector('colgroup')) {
        const colgroup = document.createElement('colgroup');
        // 첫 번째 열 (마켓명/옵션명)
        const col1 = document.createElement('col');
        col1.style.width = '100px';
        colgroup.appendChild(col1);
        
        // 나머지 27개 열 (직원 모드면 18개)
        const colCount = isStaff ? 18 : 27;
        for (let i = 0; i < colCount; i++) {
            const col = document.createElement('col');
            if (i < (isStaff ? 2 : 3)) {
                col.style.width = '60px';  // 전체 건수/수량(/금액)
            } else {
                col.style.width = '50px';  // 나머지
            }
            colgroup.appendChild(col);
        }
        
        table.insertBefore(colgroup, table.querySelector('thead'));
    }
    
    // 테이블 전체 너비 강제 설정
    table.style.width = isStaff ? '1080px' : '1530px';
    table.style.minWidth = isStaff ? '1080px' : '1530px';
    table.style.tableLayout = 'fixed';
    
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
        const amountCell1 = createStatCell(computed.overall.amount, true);
        if (isStaff) amountCell1.style.display = 'none';
        tr.appendChild(amountCell1);
        
        // 공급처 자사/벤더사
        tr.appendChild(createStatCell(computed.companyProduct.count));
        tr.appendChild(createStatCell(computed.companyProduct.quantity));
        const amountCell2 = createStatCell(computed.companyProduct.amount, true);
        if (isStaff) amountCell2.style.display = 'none';
        tr.appendChild(amountCell2);
        
        tr.appendChild(createStatCell(computed.vendorProduct.count));
        tr.appendChild(createStatCell(computed.vendorProduct.quantity));
        const amountCell3 = createStatCell(computed.vendorProduct.amount, true);
        if (isStaff) amountCell3.style.display = 'none';
        tr.appendChild(amountCell3);
        
        // 판매처 자체/셀러
        tr.appendChild(createStatCell(computed.companySales.count));
        tr.appendChild(createStatCell(computed.companySales.quantity));
        const amountCell4 = createStatCell(computed.companySales.amount, true);
        if (isStaff) amountCell4.style.display = 'none';
        tr.appendChild(amountCell4);
        
        tr.appendChild(createStatCell(computed.sellerSales.count));
        tr.appendChild(createStatCell(computed.sellerSales.quantity));
        const amountCell5 = createStatCell(computed.sellerSales.amount, true);
        if (isStaff) amountCell5.style.display = 'none';
        tr.appendChild(amountCell5);
        
        // 발송 자사/벤더사
        tr.appendChild(createStatCell(computed.sentCompany.count, false, 'sent-col'));
        tr.appendChild(createStatCell(computed.sentCompany.quantity, false, 'sent-col'));
        const amountCell6 = createStatCell(computed.sentCompany.amount, true, 'sent-col');
        if (isStaff) amountCell6.style.display = 'none';
        tr.appendChild(amountCell6);
        
        tr.appendChild(createStatCell(computed.sentVendor.count, false, 'sent-col'));
        tr.appendChild(createStatCell(computed.sentVendor.quantity, false, 'sent-col'));
        const amountCell7 = createStatCell(computed.sentVendor.amount, true, 'sent-col');
        if (isStaff) amountCell7.style.display = 'none';
        tr.appendChild(amountCell7);
        
        // 미발송 자사/벤더사
        tr.appendChild(createStatCell(computed.unsentCompany.count, false, 'unsent-col'));
        tr.appendChild(createStatCell(computed.unsentCompany.quantity, false, 'unsent-col'));
        const amountCell8 = createStatCell(computed.unsentCompany.amount, true, 'unsent-col');
        if (isStaff) amountCell8.style.display = 'none';
        tr.appendChild(amountCell8);
        
        tr.appendChild(createStatCell(computed.unsentVendor.count, false, 'unsent-col'));
        tr.appendChild(createStatCell(computed.unsentVendor.quantity, false, 'unsent-col'));
        const amountCell9 = createStatCell(computed.unsentVendor.amount, true, 'unsent-col');
        if (isStaff) amountCell9.style.display = 'none';
        tr.appendChild(amountCell9);
        
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
    const totalAmountCell1 = createStatCell(totals.overall.amount, true);
    if (isStaff) totalAmountCell1.style.display = 'none';
    totalRow.appendChild(totalAmountCell1);
    
    totalRow.appendChild(createStatCell(totals.companyProduct.count));
    totalRow.appendChild(createStatCell(totals.companyProduct.quantity));
    const totalAmountCell2 = createStatCell(totals.companyProduct.amount, true);
    if (isStaff) totalAmountCell2.style.display = 'none';
    totalRow.appendChild(totalAmountCell2);
    
    totalRow.appendChild(createStatCell(totals.vendorProduct.count));
    totalRow.appendChild(createStatCell(totals.vendorProduct.quantity));
    const totalAmountCell3 = createStatCell(totals.vendorProduct.amount, true);
    if (isStaff) totalAmountCell3.style.display = 'none';
    totalRow.appendChild(totalAmountCell3);
    
    totalRow.appendChild(createStatCell(totals.companySales.count));
    totalRow.appendChild(createStatCell(totals.companySales.quantity));
    const totalAmountCell4 = createStatCell(totals.companySales.amount, true);
    if (isStaff) totalAmountCell4.style.display = 'none';
    totalRow.appendChild(totalAmountCell4);
    
    totalRow.appendChild(createStatCell(totals.sellerSales.count));
    totalRow.appendChild(createStatCell(totals.sellerSales.quantity));
    const totalAmountCell5 = createStatCell(totals.sellerSales.amount, true);
    if (isStaff) totalAmountCell5.style.display = 'none';
    totalRow.appendChild(totalAmountCell5);
    
    // 발송 - 검정색
    totalRow.appendChild(createStatCell(totals.sentCompany.count, false, 'sent-col'));
    totalRow.appendChild(createStatCell(totals.sentCompany.quantity, false, 'sent-col'));
    const totalAmountCell6 = createStatCell(totals.sentCompany.amount, true, 'sent-col');
    if (isStaff) totalAmountCell6.style.display = 'none';
    totalRow.appendChild(totalAmountCell6);
    
    totalRow.appendChild(createStatCell(totals.sentVendor.count, false, 'sent-col'));
    totalRow.appendChild(createStatCell(totals.sentVendor.quantity, false, 'sent-col'));
    const totalAmountCell7 = createStatCell(totals.sentVendor.amount, true, 'sent-col');
    if (isStaff) totalAmountCell7.style.display = 'none';
    totalRow.appendChild(totalAmountCell7);
    
    // 미발송 - 빨강색
    totalRow.appendChild(createStatCell(totals.unsentCompany.count, false, 'unsent-col'));
    totalRow.appendChild(createStatCell(totals.unsentCompany.quantity, false, 'unsent-col'));
    const totalAmountCell8 = createStatCell(totals.unsentCompany.amount, true, 'unsent-col');
    if (isStaff) totalAmountCell8.style.display = 'none';
    totalRow.appendChild(totalAmountCell8);
    
    totalRow.appendChild(createStatCell(totals.unsentVendor.count, false, 'unsent-col'));
    totalRow.appendChild(createStatCell(totals.unsentVendor.quantity, false, 'unsent-col'));
    const totalAmountCell9 = createStatCell(totals.unsentVendor.amount, true, 'unsent-col');
    if (isStaff) totalAmountCell9.style.display = 'none';
    totalRow.appendChild(totalAmountCell9);
    
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
// 피벗테이블 - 직원 모드에서 금액 옵션 제거
// ===========================
function updatePivotTable() {
    if (!processedData || !processedData.data || processedData.data.length === 0) {
        showError('피벗테이블을 생성할 데이터가 없습니다.');
        return;
    }
    
    // 직원 모드에서 금액 옵션 제거
    const valueField = document.getElementById('pivotValueField');
    if (window.currentUser?.role !== 'admin') {
        // 금액 옵션이 선택되어 있으면 건수로 변경
        if (valueField.value === '정산예정금액') {
            valueField.value = 'count';
        }
        // 금액 옵션 숨기기
        const options = valueField.querySelectorAll('option');
        options.forEach(option => {
            if (option.value === '정산예정금액' || option.textContent === '금액') {
                option.style.display = 'none';
                option.disabled = true;
            }
        });
    }
    
    const rowField = document.getElementById('pivotRowField').value;
    const colField = document.getElementById('pivotColField').value;
    const colField2 = document.getElementById('pivotColField2').value;
    const valueFieldValue = valueField.value;
    
    const pivotData = createPivotData(processedData.data, rowField, colField, colField2, valueFieldValue);
    displayPivotTable(pivotData, rowField, colField, colField2, valueFieldValue);
}

// 나머지 함수들은 동일 (createPivotData, displayPivotTable, calculateValue, formatValue 등)
// ... (기존 코드 그대로)

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

// 피벗테이블 관련 함수들은 그대로 유지
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
// 옵션명 일괄수정 기능
// ===========================
let batchEditData = {};

function openBatchEditModal() {
    if (!processedData || !processedData.data || processedData.data.length === 0) {
        showCenterMessage('처리된 데이터가 없습니다. 먼저 주문을 통합해주세요.', 'error');
        return;
    }
    
    // 매칭 실패한 옵션명 수집
    const unmatchedOptions = {};
    const modifiedOptions = {};
    
    processedData.data.forEach(row => {
        const optionName = row['옵션명'];
        const matchStatus = row['_matchStatus'];
        
        if (matchStatus === 'unmatched') {
            if (!unmatchedOptions[optionName]) {
                unmatchedOptions[optionName] = 0;
            }
            unmatchedOptions[optionName]++;
        } else if (matchStatus === 'modified' || matchStatus === 'modified-matched') {
            if (!modifiedOptions[optionName]) {
                modifiedOptions[optionName] = 0;
            }
            modifiedOptions[optionName]++;
        }
    });
    
    // 리스트 생성
    const listContainer = document.getElementById('batchEditList');
    listContainer.innerHTML = '';
    
    // 초기화
    batchEditData = {};
    
    const unmatchedCount = Object.keys(unmatchedOptions).length;
    const modifiedCount = Object.keys(modifiedOptions).length;
    
    document.getElementById('unmatchedCount').textContent = unmatchedCount;
    document.getElementById('modifiedCount').textContent = modifiedCount;
    
    if (unmatchedCount === 0 && modifiedCount === 0) {
        document.getElementById('batchEditList').style.display = 'none';
        document.getElementById('noUnmatchedMessage').style.display = 'block';
    } else {
        document.getElementById('batchEditList').style.display = 'flex';
        document.getElementById('noUnmatchedMessage').style.display = 'none';
        
        // 매칭 실패 항목 추가
        Object.entries(unmatchedOptions).forEach(([optionName, count]) => {
            const item = createEditItem(optionName, count, 'unmatched');
            listContainer.appendChild(item);
        });
        
        // 수정된 항목 추가
        Object.entries(modifiedOptions).forEach(([optionName, count]) => {
            const item = createEditItem(optionName, count, 'modified');
            listContainer.appendChild(item);
        });
    }
    
    document.getElementById('batchEditModal').style.display = 'flex';
}

function createEditItem(optionName, count, status) {
    const div = document.createElement('div');
    div.className = 'edit-item';
    div.dataset.optionName = optionName;
    
    const statusColor = status === 'unmatched' ? '#dc3545' : '#f59e0b';
    const statusBg = status === 'unmatched' ? '#fee2e2' : '#fff8e1';
    
    div.innerHTML = `
        <div class="original-option" style="background: ${statusBg}; color: ${statusColor};">
            <span>${optionName}</span>
            <span class="occurrence-badge">${count}개</span>
        </div>
        <span class="arrow-icon">→</span>
        <input type="text" 
               class="replacement-input" 
               placeholder="대체할 옵션명 입력" 
               data-original="${optionName}"
               onchange="onReplacementChange(this)">
    `;
    
    return div;
}

function onReplacementChange(input) {
    const original = input.dataset.original;
    const replacement = input.value.trim();
    
    if (replacement) {
        batchEditData[original] = replacement;
        input.classList.add('has-value');
        input.closest('.edit-item').classList.add('modified');
    } else {
        delete batchEditData[original];
        input.classList.remove('has-value');
        input.closest('.edit-item').classList.remove('modified');
    }
}

function autoMatchOptions() {
    // ProductMatching의 데이터를 활용한 자동 매칭
    const inputs = document.querySelectorAll('.replacement-input');
    let matchedCount = 0;
    
    inputs.forEach(input => {
        const original = input.dataset.original;
        
        // 유사도 기반 자동 매칭 시도
        const bestMatch = findBestMatch(original);
        if (bestMatch && bestMatch.similarity > 0.7) {
            input.value = bestMatch.option;
            onReplacementChange(input);
            matchedCount++;
        }
    });
    
    if (matchedCount > 0) {
        showCenterMessage(`${matchedCount}개의 옵션명을 자동 매칭했습니다.`, 'success');
    } else {
        showCenterMessage('자동 매칭 가능한 옵션명이 없습니다.', 'info');
    }
}

function findBestMatch(optionName) {
    if (!window.productData) return null;
    
    const normalized = optionName.toLowerCase().replace(/\s/g, '');
    let bestMatch = null;
    let bestSimilarity = 0;
    
    Object.keys(window.productData).forEach(productOption => {
        const normalizedProduct = productOption.toLowerCase().replace(/\s/g, '');
        const similarity = calculateSimilarity(normalized, normalizedProduct);
        
        if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatch = {
                option: productOption,
                similarity: similarity
            };
        }
    });
    
    return bestMatch;
}

function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / parseFloat(longer.length);
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

function applyBatchEdit() {
    if (Object.keys(batchEditData).length === 0) {
        showCenterMessage('수정할 항목이 없습니다.', 'error');
        return;
    }
    
    let modifiedCount = 0;
    
    // processedData 수정
    processedData.data.forEach(row => {
        const currentOption = row['옵션명'];
        if (batchEditData[currentOption]) {
            row['옵션명'] = batchEditData[currentOption];
            row['_matchStatus'] = 'modified-matched';
            row['_originalOption'] = currentOption;
            modifiedCount++;
        }
    });
    
    // 테이블 다시 그리기
    displayResultTable(processedData.data);
    
    // 통계 업데이트
    if (processedData.statistics) {
        displayStatistics(processedData.statistics);
    }
    
    showCenterMessage(`${modifiedCount}개 주문의 옵션명을 일괄 수정했습니다.`, 'success');
    closeBatchEditModal();
    
    // 제품 정보 재적용
    setTimeout(async () => {
        showLoading();
        try {
            processedData.data = await ProductMatching.applyProductInfo(processedData.data);
            displayResultTable(processedData.data);
            showCenterMessage('제품 정보가 재적용되었습니다.', 'success');
        } catch (error) {
            console.error('제품 정보 재적용 오류:', error);
        } finally {
            hideLoading();
        }
    }, 500);
}

function closeBatchEditModal() {
    document.getElementById('batchEditModal').style.display = 'none';
    batchEditData = {};
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeBatchEditModal();
    }
});


// 검색 탭 로드 함수
async function loadSearchTab() {
    const container = document.getElementById('search-container');
    if (!container) return;
    
    try {
        const response = await fetch('tab/search/search-module.html');
        const html = await response.text();
        
        // 직접 HTML 삽입
        container.innerHTML = html;
        
        // search-module의 스크립트 재실행
        if (typeof initSearchModule === 'function') {
            initSearchModule();
        }
        
    } catch (error) {
        console.error('검색 탭 로드 오류:', error);
        container.innerHTML = '<div style="padding: 20px;">검색 모듈 로드 실패</div>';
    }
}