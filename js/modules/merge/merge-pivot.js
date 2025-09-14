// js/modules/merge/merge-pivot.js

/**
 * 피벗테이블 모듈
 * 데이터를 다차원으로 분석하는 피벗테이블 생성
 */

const MergePivot = (function() {
    'use strict';

    /**
     * 피벗테이블 생성
     * @param {Array} data - 원본 데이터
     * @param {Object} options - 피벗 옵션
     * @returns {Object} 피벗 결과
     */
    function createPivotTable(data, options) {
        const defaultOptions = {
            rowField: '마켓명',
            colField: 'none',
            colField2: 'none',
            valueField: 'count',
            aggregation: 'sum'
        };

        const config = Object.assign({}, defaultOptions, options);
        
        const pivot = {
            data: {},
            columns: new Set(),
            columns2: new Set(),
            rows: new Set(),
            totals: {
                row: {},
                column: {},
                grand: 0
            }
        };

        // 데이터 처리
        for (const row of data) {
            const rowKey = getFieldValue(row, config.rowField);
            const colKey = config.colField === 'none' ? 
                          '전체' : getFieldValue(row, config.colField);
            const colKey2 = config.colField2 === 'none' ? 
                           '전체' : getFieldValue(row, config.colField2);

            // 키 추가
            pivot.rows.add(rowKey);
            pivot.columns.add(colKey);
            if (config.colField2 !== 'none') {
                pivot.columns2.add(colKey2);
            }

            // 데이터 구조 초기화
            if (!pivot.data[rowKey]) {
                pivot.data[rowKey] = {};
            }
            if (!pivot.data[rowKey][colKey]) {
                pivot.data[rowKey][colKey] = {};
            }
            if (!pivot.data[rowKey][colKey][colKey2]) {
                pivot.data[rowKey][colKey][colKey2] = [];
            }

            // 데이터 추가
            pivot.data[rowKey][colKey][colKey2].push(row);
        }

        // 집계 계산
        calculateAggregations(pivot, config);

        return pivot;
    }

    /**
     * 필드 값 가져오기
     */
    function getFieldValue(row, fieldName) {
        // 특수 필드 처리
        if (fieldName === '송장번호유무') {
            return (row['송장번호'] && String(row['송장번호']).trim() !== '') ? 
                   '송장있음' : '송장없음';
        }
        
        if (fieldName === '송장주체') {
            const vendor = String(row['벤더사'] || '').trim();
            const hasInvoice = row['송장번호'] && String(row['송장번호']).trim() !== '';
            
            if (!hasInvoice) return '미발송';
            return (!vendor || vendor === '달래마켓') ? '자사' : vendor;
        }

        if (fieldName === '출고처') {
            const shipment = String(row['출고'] || '').trim();
            return shipment || '미지정';
        }

        return String(row[fieldName] || '(빈값)').trim();
    }

    /**
     * 집계 계산
     */
    function calculateAggregations(pivot, config) {
        const aggregatedData = {};
        
        // 행별 집계
        for (const rowKey of pivot.rows) {
            aggregatedData[rowKey] = {};
            pivot.totals.row[rowKey] = 0;

            for (const colKey of pivot.columns) {
                if (config.colField2 === 'none') {
                    const cellData = pivot.data[rowKey]?.[colKey]?.['전체'] || [];
                    const value = aggregate(cellData, config.valueField, config.aggregation);
                    aggregatedData[rowKey][colKey] = value;
                    pivot.totals.row[rowKey] += value;
                } else {
                    aggregatedData[rowKey][colKey] = {};
                    
                    for (const colKey2 of pivot.columns2) {
                        const cellData = pivot.data[rowKey]?.[colKey]?.[colKey2] || [];
                        const value = aggregate(cellData, config.valueField, config.aggregation);
                        aggregatedData[rowKey][colKey][colKey2] = value;
                        pivot.totals.row[rowKey] += value;
                    }
                }
            }
        }

        // 열별 집계
        for (const colKey of pivot.columns) {
            if (config.colField2 === 'none') {
                pivot.totals.column[colKey] = 0;
                
                for (const rowKey of pivot.rows) {
                    pivot.totals.column[colKey] += aggregatedData[rowKey][colKey] || 0;
                }
            } else {
                pivot.totals.column[colKey] = {};
                
                for (const colKey2 of pivot.columns2) {
                    const colFullKey = `${colKey}_${colKey2}`;
                    pivot.totals.column[colFullKey] = 0;
                    
                    for (const rowKey of pivot.rows) {
                        pivot.totals.column[colFullKey] += 
                            aggregatedData[rowKey][colKey]?.[colKey2] || 0;
                    }
                }
            }
        }

        // 총계
        pivot.totals.grand = Object.values(pivot.totals.row)
            .reduce((sum, val) => sum + val, 0);

        pivot.aggregatedData = aggregatedData;
    }

    /**
     * 집계 함수
     */
    function aggregate(data, valueField, aggregation) {
        if (!data || data.length === 0) return 0;

        if (valueField === 'count') {
            return data.length;
        }

        const values = data.map(row => {
            const val = row[valueField];
            return typeof val === 'number' ? val : parseFloat(val) || 0;
        });

        switch (aggregation) {
            case 'sum':
                return values.reduce((sum, val) => sum + val, 0);
            
            case 'average':
                return values.length > 0 ? 
                       values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            
            case 'min':
                return Math.min(...values);
            
            case 'max':
                return Math.max(...values);
            
            case 'count':
                return values.length;
            
            default:
                return values.reduce((sum, val) => sum + val, 0);
        }
    }

    /**
     * 피벗테이블 필터링
     */
    function filterPivotTable(pivot, filters) {
        const filteredPivot = JSON.parse(JSON.stringify(pivot));
        
        // 필터 적용
        for (const [field, values] of Object.entries(filters)) {
            if (!values || values.length === 0) continue;
            
            // 행 필터링
            if (field === pivot.config.rowField) {
                filteredPivot.rows = new Set(
                    Array.from(pivot.rows).filter(row => values.includes(row))
                );
            }
            
            // 열 필터링
            if (field === pivot.config.colField) {
                filteredPivot.columns = new Set(
                    Array.from(pivot.columns).filter(col => values.includes(col))
                );
            }
        }

        // 데이터 재계산
        recalculateTotals(filteredPivot);
        
        return filteredPivot;
    }

    /**
     * 합계 재계산
     */
    function recalculateTotals(pivot) {
        // 행 합계 재계산
        for (const rowKey of pivot.rows) {
            pivot.totals.row[rowKey] = 0;
            
            for (const colKey of pivot.columns) {
                const value = pivot.aggregatedData[rowKey]?.[colKey] || 0;
                pivot.totals.row[rowKey] += value;
            }
        }

        // 열 합계 재계산
        for (const colKey of pivot.columns) {
            pivot.totals.column[colKey] = 0;
            
            for (const rowKey of pivot.rows) {
                pivot.totals.column[colKey] += 
                    pivot.aggregatedData[rowKey]?.[colKey] || 0;
            }
        }

        // 총계 재계산
        pivot.totals.grand = Object.values(pivot.totals.row)
            .reduce((sum, val) => sum + val, 0);
    }

    /**
     * 피벗테이블 정렬
     */
    function sortPivotTable(pivot, sortBy, direction = 'desc') {
        const sorted = {
            rows: [],
            columns: Array.from(pivot.columns).sort()
        };

        if (sortBy === 'row') {
            // 행 이름으로 정렬
            sorted.rows = Array.from(pivot.rows).sort((a, b) => {
                return direction === 'asc' ? 
                       a.localeCompare(b) : b.localeCompare(a);
            });
        } else if (sortBy === 'total') {
            // 행 합계로 정렬
            sorted.rows = Array.from(pivot.rows).sort((a, b) => {
                const diff = pivot.totals.row[b] - pivot.totals.row[a];
                return direction === 'asc' ? -diff : diff;
            });
        } else if (sortBy.startsWith('col:')) {
            // 특정 열 값으로 정렬
            const colKey = sortBy.substring(4);
            sorted.rows = Array.from(pivot.rows).sort((a, b) => {
                const valA = pivot.aggregatedData[a]?.[colKey] || 0;
                const valB = pivot.aggregatedData[b]?.[colKey] || 0;
                const diff = valB - valA;
                return direction === 'asc' ? -diff : diff;
            });
        } else {
            sorted.rows = Array.from(pivot.rows);
        }

        return sorted;
    }

    /**
     * 드릴다운 데이터 가져오기
     */
    function getDrilldownData(pivot, rowKey, colKey, colKey2) {
        const data = pivot.data[rowKey]?.[colKey]?.[colKey2 || '전체'] || [];
        
        return {
            data: data,
            count: data.length,
            summary: {
                quantity: data.reduce((sum, row) => sum + (parseInt(row['수량']) || 0), 0),
                amount: data.reduce((sum, row) => sum + (parseFloat(row['정산예정금액']) || 0), 0)
            }
        };
    }

    // Public API
    return {
        createPivotTable,
        filterPivotTable,
        sortPivotTable,
        getDrilldownData,
        aggregate
    };

})();

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MergePivot;
}
