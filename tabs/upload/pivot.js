// 피벗테이블 모듈
const PivotTable = (function() {
    
// ===========================
// 피벗테이블
// ===========================

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
    
    // 피벗 업데이트 (외부 호출용)
    function update() {
        if (!window.processedData || !window.processedData.data || window.processedData.data.length === 0) {
            showError('피벗테이블을 생성할 데이터가 없습니다.');
            return;
        }
        
        const rowField = document.getElementById('pivotRowField').value;
        const colField = document.getElementById('pivotColField').value;
        const colField2 = document.getElementById('pivotColField2').value;
        const valueField = document.getElementById('pivotValueField').value;
        
        const pivotData = createPivotData(window.processedData.data, rowField, colField, colField2, valueField);
        displayPivotTable(pivotData, rowField, colField, colField2, valueField);
    }
    
    // 공개 API
    return {
        update: update
    };
})();

// 전역 함수로 노출 (HTML onclick용)
window.updatePivotTable = PivotTable.update;









