// js/modules/merge/merge-export.js

/**
 * 내보내기 모듈
 * 통합 데이터를 다양한 형식으로 내보내기
 */

const MergeExport = (function() {
    'use strict';

    /**
     * Excel 파일로 내보내기
     * @param {Object} data - 내보낼 데이터
     * @param {Object} options - 내보내기 옵션
     */
    function exportToExcel(data, options = {}) {
        const defaultOptions = {
            fileName: `주문통합_${formatDateForFile(new Date())}.xlsx`,
            sheetName: '통합주문',
            includeStatistics: true,
            includePivot: false
        };

        const config = Object.assign({}, defaultOptions, options);

        try {
            // 워크북 생성
            const wb = XLSX.utils.book_new();

            // 메인 데이터 시트
            if (data.mainData && data.mainData.length > 0) {
                const ws = XLSX.utils.json_to_sheet(data.mainData);
                
                // 스타일 적용
                applyExcelStyles(ws, data.mainData);
                
                XLSX.utils.book_append_sheet(wb, ws, config.sheetName);
            }

            // 통계 시트
            if (config.includeStatistics && data.statistics) {
                addStatisticsSheets(wb, data.statistics);
            }

            // 피벗테이블 시트
            if (config.includePivot && data.pivot) {
                addPivotSheet(wb, data.pivot);
            }

            // 파일 다운로드
            XLSX.writeFile(wb, config.fileName);

            return {
                success: true,
                fileName: config.fileName
            };

        } catch (error) {
            console.error('Excel 내보내기 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * CSV 파일로 내보내기
     */
    function exportToCSV(data, options = {}) {
        const defaultOptions = {
            fileName: `주문통합_${formatDateForFile(new Date())}.csv`,
            delimiter: ',',
            encoding: 'utf-8',
            includeBOM: true
        };

        const config = Object.assign({}, defaultOptions, options);

        try {
            // CSV 문자열 생성
            const csvContent = convertToCSV(data, config);
            
            // BOM 추가 (한글 지원)
            const bom = config.includeBOM ? '\uFEFF' : '';
            const finalContent = bom + csvContent;

            // Blob 생성 및 다운로드
            const blob = new Blob([finalContent], {
                type: `text/csv;charset=${config.encoding}`
            });
            
            downloadFile(blob, config.fileName);

            return {
                success: true,
                fileName: config.fileName
            };

        } catch (error) {
            console.error('CSV 내보내기 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Google Sheets로 내보내기
     */
    async function exportToGoogleSheets(data, options = {}) {
        const defaultOptions = {
            sheetName: formatDateForFile(new Date()),
            clearExisting: false
        };

        const config = Object.assign({}, defaultOptions, options);

        try {
            // API 호출
            const response = await apiCall('/api/merge-export', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'saveToSheets',
                    data: data.mainData,
                    sheetName: config.sheetName,
                    clearExisting: config.clearExisting,
                    statistics: data.statistics
                })
            });

            if (response.success) {
                return {
                    success: true,
                    sheetName: response.sheetName,
                    url: response.url
                };
            } else {
                throw new Error(response.error || '저장 실패');
            }

        } catch (error) {
            console.error('Google Sheets 내보내기 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * JSON 파일로 내보내기
     */
    function exportToJSON(data, options = {}) {
        const defaultOptions = {
            fileName: `주문통합_${formatDateForFile(new Date())}.json`,
            prettify: true
        };

        const config = Object.assign({}, defaultOptions, options);

        try {
            // JSON 문자열 생성
            const jsonContent = config.prettify ? 
                JSON.stringify(data, null, 2) : 
                JSON.stringify(data);

            // Blob 생성 및 다운로드
            const blob = new Blob([jsonContent], {
                type: 'application/json'
            });
            
            downloadFile(blob, config.fileName);

            return {
                success: true,
                fileName: config.fileName
            };

        } catch (error) {
            console.error('JSON 내보내기 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 인쇄용 HTML 생성
     */
    function exportToPrint(data, options = {}) {
        const defaultOptions = {
            title: '주문통합 리포트',
            includeStatistics: true,
            pageSize: 'A4',
            orientation: 'landscape'
        };

        const config = Object.assign({}, defaultOptions, options);

        // 인쇄용 HTML 생성
        const printHTML = generatePrintHTML(data, config);

        // 새 창에서 열기
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printHTML);
        printWindow.document.close();

        // 인쇄 대화상자 열기
        setTimeout(() => {
            printWindow.print();
        }, 500);

        return {
            success: true
        };
    }

    /**
     * CSV 변환
     */
    function convertToCSV(data, config) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const delimiter = config.delimiter;

        // 헤더 행
        const headerRow = headers.map(h => escapeCSV(h)).join(delimiter);

        // 데이터 행
        const dataRows = data.map(row => {
            return headers.map(header => {
                const value = row[header];
                return escapeCSV(value);
            }).join(delimiter);
        });

        return [headerRow, ...dataRows].join('\r\n');
    }

    /**
     * CSV 값 이스케이프
     */
    function escapeCSV(value) {
        if (value === null || value === undefined) return '';
        
        const str = String(value);
        
        // 특수 문자가 있으면 따옴표로 감싸기
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        
        return str;
    }

    /**
     * Excel 스타일 적용
     */
    function applyExcelStyles(worksheet, data) {
        // 헤더 스타일
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + '1';
            if (!worksheet[address]) continue;
            
            worksheet[address].s = {
                fill: { fgColor: { rgb: '4CAF50' } },
                font: { bold: true, color: { rgb: 'FFFFFF' } },
                alignment: { horizontal: 'center' }
            };
        }

        // 열 너비 자동 조정
        const colWidths = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
            let maxWidth = 10;
            
            for (let R = range.s.r; R <= range.e.r; ++R) {
                const address = XLSX.utils.encode_cell({ r: R, c: C });
                if (worksheet[address] && worksheet[address].v) {
                    const length = String(worksheet[address].v).length;
                    maxWidth = Math.max(maxWidth, length);
                }
            }
            
            colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
        }
        
        worksheet['!cols'] = colWidths;
    }

    /**
     * 통계 시트 추가
     */
    function addStatisticsSheets(workbook, statistics) {
        // 마켓별 통계
        if (statistics.byMarket) {
            const marketData = Object.entries(statistics.byMarket).map(([market, stats]) => ({
                '마켓명': market,
                '주문수': stats.count,
                '수량': stats.quantity,
                '금액': stats.amount
            }));
            
            const ws = XLSX.utils.json_to_sheet(marketData);
            XLSX.utils.book_append_sheet(workbook, ws, '마켓별통계');
        }

        // 옵션별 통계
        if (statistics.byOption) {
            const optionData = Object.entries(statistics.byOption).map(([option, stats]) => ({
                '옵션명': option,
                '주문수': stats.count,
                '수량': stats.quantity,
                '금액': stats.amount
            }));
            
            const ws = XLSX.utils.json_to_sheet(optionData);
            XLSX.utils.book_append_sheet(workbook, ws, '옵션별통계');
        }
    }

    /**
     * 피벗 시트 추가
     */
    function addPivotSheet(workbook, pivotData) {
        // 피벗 데이터를 2차원 배열로 변환
        const pivotArray = convertPivotToArray(pivotData);
        
        const ws = XLSX.utils.aoa_to_sheet(pivotArray);
        XLSX.utils.book_append_sheet(workbook, ws, '피벗테이블');
    }

    /**
     * 피벗 데이터를 배열로 변환
     */
    function convertPivotToArray(pivot) {
        const array = [];
        
        // 헤더 행
        const headerRow = [''];
        for (const col of Array.from(pivot.columns).sort()) {
            headerRow.push(col);
        }
        headerRow.push('합계');
        array.push(headerRow);

        // 데이터 행
        for (const row of Array.from(pivot.rows).sort()) {
            const dataRow = [row];
            
            for (const col of Array.from(pivot.columns).sort()) {
                const value = pivot.aggregatedData[row]?.[col] || 0;
                dataRow.push(value);
            }
            
            dataRow.push(pivot.totals.row[row] || 0);
            array.push(dataRow);
        }

        // 합계 행
        const totalRow = ['합계'];
        for (const col of Array.from(pivot.columns).sort()) {
            totalRow.push(pivot.totals.column[col] || 0);
        }
        totalRow.push(pivot.totals.grand || 0);
        array.push(totalRow);

        return array;
    }

    /**
     * 인쇄용 HTML 생성
     */
    function generatePrintHTML(data, config) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${config.title}</title>
    <style>
        @page {
            size: ${config.pageSize} ${config.orientation};
            margin: 1cm;
        }
        body {
            font-family: 'Noto Sans KR', sans-serif;
            font-size: 10pt;
        }
        h1 {
            text-align: center;
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 4px 8px;
            text-align: left;
        }
        th {
            background: #f5f5f5;
            font-weight: bold;
        }
        .stats {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
        }
        .stat-box {
            text-align: center;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .stat-value {
            font-size: 18pt;
            font-weight: bold;
            color: #2563eb;
        }
        @media print {
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <h1>${config.title}</h1>
    <div class="stats">
        <div class="stat-box">
            <div>총 주문수</div>
            <div class="stat-value">${data.statistics?.total?.count || 0}</div>
        </div>
        <div class="stat-box">
            <div>총 수량</div>
            <div class="stat-value">${data.statistics?.total?.quantity || 0}</div>
        </div>
        <div class="stat-box">
            <div>총 금액</div>
            <div class="stat-value">${numberFormat(data.statistics?.total?.amount || 0)}원</div>
        </div>
    </div>
    <table>
        <thead>
            <tr>
                ${Object.keys(data.mainData[0] || {}).map(h => `<th>${h}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${data.mainData.slice(0, 100).map(row => `
                <tr>
                    ${Object.values(row).map(v => `<td>${v || ''}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
    ${data.mainData.length > 100 ? '<p>... 외 ' + (data.mainData.length - 100) + '건</p>' : ''}
</body>
</html>
        `;
        return html;
    }

    /**
     * 파일 다운로드
     */
    function downloadFile(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 날짜 포맷
     */
    function formatDateForFile(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    /**
     * 숫자 포맷
     */
    function numberFormat(num) {
        return new Intl.NumberFormat('ko-KR').format(num);
    }

    // Public API
    return {
        exportToExcel,
        exportToCSV,
        exportToGoogleSheets,
        exportToJSON,
        exportToPrint
    };

})();

// 모듈 내보내기  
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MergeExport;
}
