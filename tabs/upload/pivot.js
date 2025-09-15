// ===========================
// 피벗테이블 모듈
// ===========================
(function() {
    'use strict';
    
    // ===========================
    // 피벗테이블 메인 함수
    // ===========================
    function updatePivotTable() {
        if (!window.processedData || !window.processedData.data || window.processedData.data.length === 0) {
            console.log('피벗테이블 업데이트 스킵: 데이터 없음');
            return;
        }
        
        const rowField = document.getElementById('pivotRowField').value;
        const colField = document.getElementById('pivotColField').value;
        const colField2 = document.getElementById('pivotColField2').value;
        const valueField = document.getElementById('pivotValueField').value;
        
        // 피벗 데이터 생성
        const pivotData = createPivotData(window.processedData.data, rowField, colField, colField2, valueField);
        
        // 피벗테이블 표시
        displayPivotTable(pivotData, rowField, colField, colField2, valueField);
    }
    
    // ===========================
    // 피벗 데이터 생성
    // ===========================
    function createPivotData(data, rowField, colField, colField2, valueField) {
        const pivot = {};
        const colValues = new Set();
        const colValues2 = new Set();
        
        data.forEach(row => {
            // 송장번호유무 필드 동적 생성
            if (!row['송장번호유무']) {
                row['송장번호유무'] = (row['송장번호'] && String(row['송장번호']).trim() !== '') ? '발송' : '미발송';
            }
            
            const rowKey = row[rowField] || '(빈값)';
            const colKey = colField !== 'none' ? (row[colField] || '(빈값)') : null;
            const colKey2 = colField2 !== 'none' ? (row[colField2] || '(빈값)') : null;
            
            if (!pivot[rowKey]) {
                pivot[rowKey] = {};
            }
            
            // 컬럼 키 생성
            let fullColKey = '';
            if (colKey) {
                colValues.add(colKey);
                fullColKey = colKey;
            }
            if (colKey2) {
                colValues2.add(colKey2);
                fullColKey = colKey ? `${colKey}_${colKey2}` : colKey2;
            }
            if (!fullColKey) {
                fullColKey = '전체';
            }
            
            if (!pivot[rowKey][fullColKey]) {
                pivot[rowKey][fullColKey] = {
                    count: 0,
                    quantity: 0,
                    amount: 0
                };
            }
            
            // 값 집계
            pivot[rowKey][fullColKey].count++;
            
            if (valueField === 'count') {
                // 건수는 이미 처리됨
            } else if (valueField === '수량') {
                pivot[rowKey][fullColKey].quantity += parseInt(row['수량']) || 1;
            } else if (valueField === '정산예정금액') {
                pivot[rowKey][fullColKey].amount += parseFloat(row['정산예정금액']) || 0;
            }
        });
        
        return {
            data: pivot,
            colValues: Array.from(colValues).sort(),
            colValues2: Array.from(colValues2).sort()
        };
    }
    
    // ===========================
    // 피벗테이블 화면 표시
    // ===========================
    function displayPivotTable(pivotData, rowField, colField, colField2, valueField) {
        const thead = document.querySelector('#pivotTable thead');
        const tbody = document.querySelector('#pivotTable tbody');
        
        if (!thead || !tbody) return;
        
        thead.innerHTML = '';
        tbody.innerHTML = '';
        
        // 헤더 생성
        const headerRow = document.createElement('tr');
        const th1 = document.createElement('th');
        th1.textContent = rowField;
        th1.style.position = 'sticky';
        th1.style.left = '0';
        th1.style.background = '#f8f9fa';
        th1.style.zIndex = '2';
        headerRow.appendChild(th1);
        
        // 컬럼 헤더 생성
        const columns = [];
        if (colField === 'none' && colField2 === 'none') {
            columns.push('전체');
        } else if (colField2 === 'none') {
            columns.push(...pivotData.colValues);
        } else if (colField === 'none') {
            columns.push(...pivotData.colValues2);
        } else {
            // 2단계 컬럼
            pivotData.colValues.forEach(col1 => {
                pivotData.colValues2.forEach(col2 => {
                    columns.push(`${col1}_${col2}`);
                });
            });
        }
        
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.replace('_', ' / ');
            th.style.textAlign = 'center';
            headerRow.appendChild(th);
        });
        
        // 합계 컬럼
        const thTotal = document.createElement('th');
        thTotal.textContent = '합계';
        thTotal.style.textAlign = 'center';
        thTotal.style.background = '#e7f3ff';
        headerRow.appendChild(thTotal);
        
        thead.appendChild(headerRow);
        
        // 바디 생성
        const rowKeys = Object.keys(pivotData.data).sort();
        const totals = {};
        
        rowKeys.forEach(rowKey => {
            const tr = document.createElement('tr');
            
            // 행 헤더
            const td1 = document.createElement('td');
            td1.textContent = rowKey;
            td1.style.fontWeight = 'bold';
            td1.style.position = 'sticky';
            td1.style.left = '0';
            td1.style.background = '#ffffff';
            td1.style.borderRight = '2px solid #dee2e6';
            
            // 마켓명인 경우 색상 적용
            if (rowField === '마켓명' && window.mappingData && window.mappingData.markets[rowKey]) {
                const market = window.mappingData.markets[rowKey];
                td1.style.background = `rgb(${market.color})`;
                const rgb = market.color.split(',').map(Number);
                const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
                td1.style.color = brightness > 128 ? '#000' : '#fff';
            }
            
            tr.appendChild(td1);
            
            // 데이터 셀
            let rowTotal = 0;
            columns.forEach(col => {
                const td = document.createElement('td');
                const cellData = pivotData.data[rowKey][col];
                
                let value = 0;
                if (cellData) {
                    if (valueField === 'count') {
                        value = cellData.count;
                    } else if (valueField === '수량') {
                        value = cellData.quantity;
                    } else if (valueField === '정산예정금액') {
                        value = cellData.amount;
                    }
                }
                
                td.textContent = value ? window.numberFormat(value) : '';
                td.style.textAlign = valueField === '정산예정금액' ? 'right' : 'center';
                
                if (valueField === '정산예정금액') {
                    td.classList.add('amount-col');
                }
                
                tr.appendChild(td);
                
                rowTotal += value;
                
                // 컬럼 합계 누적
                if (!totals[col]) {
                    totals[col] = 0;
                }
                totals[col] += value;
            });
            
            // 행 합계
            const tdRowTotal = document.createElement('td');
            tdRowTotal.textContent = window.numberFormat(rowTotal);
            tdRowTotal.style.textAlign = valueField === '정산예정금액' ? 'right' : 'center';
            tdRowTotal.style.background = '#f8f9fa';
            tdRowTotal.style.fontWeight = 'bold';
            
            if (valueField === '정산예정금액') {
                tdRowTotal.classList.add('amount-col');
            }
            
            tr.appendChild(tdRowTotal);
            tbody.appendChild(tr);
        });
        
        // 합계 행
        const totalRow = document.createElement('tr');
        totalRow.className = 'total-row';
        
        const tdTotalLabel = document.createElement('td');
        tdTotalLabel.textContent = '합계';
        tdTotalLabel.style.fontWeight = 'bold';
        tdTotalLabel.style.position = 'sticky';
        tdTotalLabel.style.left = '0';
        tdTotalLabel.style.background = '#e7f3ff';
        totalRow.appendChild(tdTotalLabel);
        
        let grandTotal = 0;
        columns.forEach(col => {
            const td = document.createElement('td');
            const value = totals[col] || 0;
            td.textContent = value ? window.numberFormat(value) : '';
            td.style.textAlign = valueField === '정산예정금액' ? 'right' : 'center';
            td.style.background = '#f8f9fa';
            td.style.fontWeight = 'bold';
            
            if (valueField === '정산예정금액') {
                td.classList.add('amount-col');
            }
            
            totalRow.appendChild(td);
            grandTotal += value;
        });
        
        // 총합계
        const tdGrandTotal = document.createElement('td');
        tdGrandTotal.textContent = window.numberFormat(grandTotal);
        tdGrandTotal.style.textAlign = valueField === '정산예정금액' ? 'right' : 'center';
        tdGrandTotal.style.background = '#e7f3ff';
        tdGrandTotal.style.fontWeight = 'bold';
        
        if (valueField === '정산예정금액') {
            tdGrandTotal.classList.add('amount-col');
        }
        
        totalRow.appendChild(tdGrandTotal);
        tbody.appendChild(totalRow);
    }
    
    // ===========================
    // 이벤트 리스너 초기화
    // ===========================
    function initPivotEventListeners() {
        const pivotRowField = document.getElementById('pivotRowField');
        const pivotColField = document.getElementById('pivotColField');
        const pivotColField2 = document.getElementById('pivotColField2');
        const pivotValueField = document.getElementById('pivotValueField');
        const pivotUpdateBtn = document.querySelector('button[onclick="updatePivotTable()"]');
        
        if (pivotRowField) pivotRowField.addEventListener('change', updatePivotTable);
        if (pivotColField) pivotColField.addEventListener('change', updatePivotTable);
        if (pivotColField2) pivotColField2.addEventListener('change', updatePivotTable);
        if (pivotValueField) pivotValueField.addEventListener('change', updatePivotTable);
        
        // 버튼의 onclick 속성 제거하고 이벤트 리스너로 교체
        if (pivotUpdateBtn) {
            pivotUpdateBtn.removeAttribute('onclick');
            pivotUpdateBtn.addEventListener('click', updatePivotTable);
        }
    }
    
    // ===========================
    // 전역 노출
    // ===========================
    window.updatePivotTable = updatePivotTable;
    window.initPivotEventListeners = initPivotEventListeners;
    
    // DOM 로드 시 이벤트 리스너 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPivotEventListeners);
    } else {
        initPivotEventListeners();
    }
    
})();
