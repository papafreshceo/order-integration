// js/modules/merge/merge-ui.js

/**
 * UI 컨트롤 모듈
 * 주문통합 화면의 UI 요소 제어
 */

const MergeUI = (function() {
    'use strict';

    // DOM 요소 캐시
    let elements = {};
    let currentView = 'upload';
    let uploadedFiles = [];
    let processedData = null;

    /**
     * 초기화
     */
    function initialize() {
        cacheElements();
        bindEvents();
        initializeDropzone();
        console.log('MergeUI 초기화 완료');
    }

    /**
     * DOM 요소 캐싱
     */
    function cacheElements() {
        elements = {
            // 파일 업로드 영역
            fileInput: document.getElementById('mergeFileInput'),
            dropzone: document.getElementById('mergeDropzone'),
            fileList: document.getElementById('mergeFileList'),
            fileSummary: document.getElementById('mergeFileSummary'),
            
            // 버튼
            uploadBtn: document.getElementById('mergeUploadBtn'),
            processBtn: document.getElementById('mergeProcessBtn'),
            exportExcelBtn: document.getElementById('mergeExportExcel'),
            exportSheetsBtn: document.getElementById('mergeExportSheets'),
            
            // 결과 영역
            resultSection: document.getElementById('mergeResultSection'),
            resultTable: document.getElementById('mergeResultTable'),
            statisticsSection: document.getElementById('mergeStatistics'),
            
            // 피벗테이블
            pivotSection: document.getElementById('mergePivotSection'),
            pivotRowField: document.getElementById('mergePivotRow'),
            pivotColField: document.getElementById('mergePivotCol'),
            pivotValueField: document.getElementById('mergePivotValue'),
            pivotTable: document.getElementById('mergePivotTable'),
            
            // 메시지
            loading: document.getElementById('mergeLoading'),
            errorMessage: document.getElementById('mergeError'),
            successMessage: document.getElementById('mergeSuccess'),
            warningBox: document.getElementById('mergeWarning')
        };
    }

    /**
     * 이벤트 바인딩
     */
    function bindEvents() {
        // 파일 업로드
        if (elements.uploadBtn) {
            elements.uploadBtn.addEventListener('click', () => {
                elements.fileInput.click();
            });
        }

        if (elements.fileInput) {
            elements.fileInput.addEventListener('change', handleFileSelect);
        }

        // 처리 버튼
        if (elements.processBtn) {
            elements.processBtn.addEventListener('click', handleProcess);
        }

        // 내보내기 버튼
        if (elements.exportExcelBtn) {
            elements.exportExcelBtn.addEventListener('click', handleExportExcel);
        }

        if (elements.exportSheetsBtn) {
            elements.exportSheetsBtn.addEventListener('click', handleExportSheets);
        }

        // 피벗테이블 컨트롤
        const pivotControls = [
            elements.pivotRowField,
            elements.pivotColField,
            elements.pivotValueField
        ];

        pivotControls.forEach(control => {
            if (control) {
                control.addEventListener('change', updatePivotTable);
            }
        });
    }

    /**
     * 드롭존 초기화
     */
    function initializeDropzone() {
        if (!elements.dropzone) return;

        elements.dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.dropzone.classList.add('dragover');
        });

        elements.dropzone.addEventListener('dragleave', () => {
            elements.dropzone.classList.remove('dragover');
        });

        elements.dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.dropzone.classList.remove('dragover');
            handleFileDrop(e.dataTransfer.files);
        });

        elements.dropzone.addEventListener('click', () => {
            elements.fileInput.click();
        });
    }

    /**
     * 파일 선택 처리
     */
    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        processFiles(files);
    }

    /**
     * 파일 드롭 처리
     */
    function handleFileDrop(files) {
        const fileArray = Array.from(files);
        processFiles(fileArray);
    }

    /**
     * 파일 처리
     */
    async function processFiles(files) {
        const validFiles = files.filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            return ['xlsx', 'xls', 'csv'].includes(ext);
        });

        if (validFiles.length === 0) {
            showError('엑셀 또는 CSV 파일만 업로드 가능합니다');
            return;
        }

        showLoading('파일 읽는 중...');

        for (const file of validFiles) {
            try {
                const fileData = await MergeReader.readFile(file);
                
                // 마켓 감지
                const detection = MergeDetector.detectMarket(
                    file.name,
                    fileData.headers,
                    fileData.data[0]
                );

                // 날짜 확인
                const dateInfo = MergeDetector.checkFileDate(file);

                // 필드 매핑
                const mapping = MergeMapper.autoMapFields(
                    fileData.headers,
                    detection.marketName
                );

                // 파일 정보 저장
                const fileInfo = {
                    file: file,
                    name: file.name,
                    marketName: detection.marketName,
                    confidence: detection.confidence,
                    isToday: dateInfo.isToday,
                    dateString: dateInfo.dateString,
                    headers: fileData.headers,
                    data: fileData.data,
                    mapping: mapping,
                    rowCount: fileData.data.length
                };

                uploadedFiles.push(fileInfo);

            } catch (error) {
                console.error(`파일 처리 실패 (${file.name}):`, error);
                showError(`${file.name}: ${error.message}`);
            }
        }

        hideLoading();
        updateFileList();
        checkWarnings();
    }

    /**
     * 파일 목록 업데이트
     */
    function updateFileList() {
        if (!elements.fileList) return;

        elements.fileList.innerHTML = '';

        if (uploadedFiles.length === 0) {
            elements.processBtn.style.display = 'none';
            elements.fileSummary.style.display = 'none';
            return;
        }

        elements.processBtn.style.display = 'inline-block';
        elements.fileSummary.style.display = 'flex';

        // 파일 목록 표시
        uploadedFiles.forEach((fileInfo, index) => {
            const fileItem = createFileItem(fileInfo, index);
            elements.fileList.appendChild(fileItem);
        });

        // 요약 정보 업데이트
        updateFileSummary();
    }

    /**
     * 파일 아이템 생성
     */
    function createFileItem(fileInfo, index) {
        const div = document.createElement('div');
        div.className = 'merge-file-item';
        
        if (!fileInfo.isToday) {
            div.classList.add('warning');
        }

        div.innerHTML = `
            <div class="merge-file-info">
                <span class="merge-market-tag" style="background: ${getMarketColor(fileInfo.marketName)}">
                    ${fileInfo.marketName || '미감지'}
                </span>
                <span class="merge-file-name">${fileInfo.name}</span>
                <span class="merge-file-rows">${fileInfo.rowCount}개 주문</span>
                <span class="merge-file-date">${fileInfo.dateString}</span>
            </div>
            <button class="merge-file-remove" data-index="${index}">×</button>
        `;

        // 제거 버튼 이벤트
        const removeBtn = div.querySelector('.merge-file-remove');
        removeBtn.addEventListener('click', () => removeFile(index));

        return div;
    }

    /**
     * 파일 제거
     */
    function removeFile(index) {
        uploadedFiles.splice(index, 1);
        updateFileList();
        checkWarnings();
    }

    /**
     * 파일 요약 업데이트
     */
    function updateFileSummary() {
        const summary = {
            fileCount: uploadedFiles.length,
            marketCount: new Set(uploadedFiles.map(f => f.marketName)).size,
            totalOrders: uploadedFiles.reduce((sum, f) => sum + f.rowCount, 0)
        };

        document.getElementById('mergeTotalFiles').textContent = summary.fileCount;
        document.getElementById('mergeTotalMarkets').textContent = summary.marketCount;
        document.getElementById('mergeTotalOrders').textContent = 
            summary.totalOrders.toLocaleString('ko-KR');
    }

    /**
     * 경고 확인
     */
    function checkWarnings() {
        const oldFiles = uploadedFiles.filter(f => !f.isToday);
        
        if (oldFiles.length > 0) {
            showWarning(`${oldFiles.length}개의 오래된 파일이 감지되었습니다`);
        } else {
            hideWarning();
        }
    }

    /**
     * 처리 실행
     */
    async function handleProcess() {
        if (uploadedFiles.length === 0) {
            showError('업로드된 파일이 없습니다');
            return;
        }

        const todayFiles = uploadedFiles.filter(f => f.isToday);
        if (todayFiles.length === 0) {
            showError('오늘 날짜의 파일이 없습니다');
            return;
        }

        showLoading('데이터 통합 중...');

        try {
            // 데이터 처리
            const result = MergeProcessor.processFiles(todayFiles);
            
            if (!result.success) {
                throw new Error(result.errors.join(', '));
            }

            // 통계 생성
            const statistics = MergeStatistics.generateStatistics(result.data);

            // 결과 저장
            processedData = {
                mainData: result.data,
                statistics: statistics,
                processedCount: result.processedCount,
                skippedCount: result.skippedCount
            };

            // UI 업데이트
            displayResults();
            showSuccess(`${result.processedCount}개 주문을 성공적으로 통합했습니다`);

        } catch (error) {
            console.error('처리 오류:', error);
            showError(error.message);
        } finally {
            hideLoading();
        }
    }

    /**
     * 결과 표시
     */
    function displayResults() {
        if (!processedData) return;

        // 결과 섹션 표시
        elements.resultSection.style.display = 'block';

        // 테이블 표시
        displayResultTable(processedData.mainData);

        // 통계 표시
        displayStatistics(processedData.statistics);

        // 피벗테이블 초기화
        updatePivotTable();

        // 스크롤
        elements.resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * 결과 테이블 표시
     */
    function displayResultTable(data) {
        if (!elements.resultTable || data.length === 0) return;

        const table = elements.resultTable;
        const thead = table.querySelector('thead') || table.createTHead();
        const tbody = table.querySelector('tbody') || table.createTBody();

        // 헤더
        thead.innerHTML = '';
        const headerRow = thead.insertRow();
        const headers = Object.keys(data[0]);
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        // 데이터 (최대 100개만 표시)
        tbody.innerHTML = '';
        const displayData = data.slice(0, 100);
        
        displayData.forEach(row => {
            const tr = tbody.insertRow();
            
            headers.forEach(header => {
                const td = tr.insertCell();
                td.textContent = formatCellValue(row[header], header);
                
                // 마켓명 셀 스타일
                if (header === '마켓명') {
                    td.style.background = getMarketColor(row[header]);
                    td.style.color = '#fff';
                    td.style.fontWeight = 'bold';
                }
            });
        });

        // 추가 데이터 알림
        if (data.length > 100) {
            const notice = document.createElement('div');
            notice.className = 'merge-table-notice';
            notice.textContent = `... 외 ${data.length - 100}개 주문`;
            table.parentElement.appendChild(notice);
        }
    }

    /**
     * 통계 표시
     */
    function displayStatistics(statistics) {
        if (!elements.statisticsSection) return;

        // 마켓별 통계
        displayMarketStatistics(statistics.byMarket);

        // 옵션별 통계
        displayOptionStatistics(statistics.byOption);

        // 요약 통계
        displaySummaryStatistics(statistics.summary);
    }

    /**
     * 피벗테이블 업데이트
     */
    function updatePivotTable() {
        if (!processedData || !elements.pivotTable) return;

        const options = {
            rowField: elements.pivotRowField.value,
            colField: elements.pivotColField.value,
            valueField: elements.pivotValueField.value
        };

        const pivot = MergePivot.createPivotTable(processedData.mainData, options);
        displayPivotTable(pivot);
    }

    /**
     * 내보내기 - Excel
     */
    async function handleExportExcel() {
        if (!processedData) {
            showError('내보낼 데이터가 없습니다');
            return;
        }

        const result = MergeExport.exportToExcel(processedData);
        
        if (result.success) {
            showSuccess('Excel 파일이 다운로드되었습니다');
        } else {
            showError(result.error);
        }
    }

    /**
     * 내보내기 - Google Sheets
     */
    async function handleExportSheets() {
        if (!processedData) {
            showError('내보낼 데이터가 없습니다');
            return;
        }

        showLoading('Google Sheets에 저장 중...');

        try {
            const result = await MergeExport.exportToGoogleSheets(processedData);
            
            if (result.success) {
                showSuccess(`"${result.sheetName}" 시트에 저장되었습니다`);
            } else {
                showError(result.error);
            }
        } finally {
            hideLoading();
        }
    }

    // 유틸리티 함수들
    function showLoading(message = '처리 중...') {
        if (elements.loading) {
            elements.loading.textContent = message;
            elements.loading.style.display = 'block';
        }
    }

    function hideLoading() {
        if (elements.loading) {
            elements.loading.style.display = 'none';
        }
    }

    function showError(message) {
        if (elements.errorMessage) {
            elements.errorMessage.textContent = message;
            elements.errorMessage.style.display = 'block';
            setTimeout(() => hideError(), 5000);
        }
    }

    function hideError() {
        if (elements.errorMessage) {
            elements.errorMessage.style.display = 'none';
        }
    }

    function showSuccess(message) {
        if (elements.successMessage) {
            elements.successMessage.textContent = message;
            elements.successMessage.style.display = 'block';
            setTimeout(() => hideSuccess(), 5000);
        }
    }

    function hideSuccess() {
        if (elements.successMessage) {
            elements.successMessage.style.display = 'none';
        }
    }

    function showWarning(message) {
        if (elements.warningBox) {
            elements.warningBox.querySelector('.merge-warning-text').textContent = message;
            elements.warningBox.style.display = 'block';
        }
    }

    function hideWarning() {
        if (elements.warningBox) {
            elements.warningBox.style.display = 'none';
        }
    }

    function getMarketColor(marketName) {
        const colors = {
            '네이버': '#03c75a',
            '쿠팡': '#e21f3f',
            '11번가': '#ea002c',
            '지마켓': '#00b900',
            '옥션': '#e62e00',
            '위메프': '#ff5000',
            '티몬': '#ff0000',
            'SSG': '#e51937',
            '카카오': '#fee500'
        };
        return colors[marketName] || '#999';
    }

    function formatCellValue(value, header) {
        if (value === null || value === undefined) return '';
        
        // 금액 필드
        if (header.includes('금액') || header.includes('가격')) {
            const num = parseFloat(value);
            return isNaN(num) ? value : num.toLocaleString('ko-KR');
        }
        
        return String(value);
    }

    // Public API
    return {
        initialize,
        showLoading,
        hideLoading,
        showError,
        showSuccess,
        updateFileList,
        displayResults
    };

})();

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MergeUI;
}
