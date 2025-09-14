// js/modules/merge/merge-processor.js

/**
 * 데이터 처리 및 통합 모듈
 * 여러 마켓의 주문 데이터를 표준 형식으로 통합
 */

const MergeProcessor = (function() {
    'use strict';

    let standardFields = null;
    let marketConfigs = null;
    let globalCounter = 0;
    let marketCounters = {};

    /**
     * 초기화
     */
    function initialize(config) {
        standardFields = config.STANDARD_FIELDS;
        marketConfigs = config.MARKETS;
        globalCounter = 0;
        marketCounters = {};
        console.log('MergeProcessor 초기화 완료');
    }

    /**
     * 데이터 통합 처리
     * @param {Array} filesData - 파일별 데이터 배열
     * @returns {Object} 통합 결과
     */
    function processFiles(filesData) {
        const result = {
            success: false,
            data: [],
            statistics: {
                byMarket: {},
                byOption: {},
                total: { count: 0, quantity: 0, amount: 0 }
            },
            processedCount: 0,
            skippedCount: 0,
            errors: []
        };

        try {
            // 초기화
            globalCounter = 0;
            marketCounters = {};

            // 파일별 처리
            for (const fileData of filesData) {
                if (!fileData.isToday) {
                    console.log(`오래된 파일 스킵: ${fileData.name}`);
                    result.skippedCount++;
                    continue;
                }

                const marketResult = processMarketData(fileData);
                
                if (marketResult.success) {
                    result.data.push(...marketResult.data);
                    result.processedCount += marketResult.count;
                    
                    // 통계 업데이트
                    updateStatistics(result.statistics, marketResult.data, fileData.marketName);
                } else {
                    result.errors.push(marketResult.error);
                }
            }

            result.success = result.processedCount > 0;
            
            if (result.success) {
                // 데이터 정렬
                result.data = sortData(result.data);
                console.log(`통합 완료: ${result.processedCount}개 주문 처리`);
            }

        } catch (error) {
            console.error('데이터 통합 오류:', error);
            result.errors.push(error.message);
        }

        return result;
    }

    /**
     * 마켓별 데이터 처리
     */
    function processMarketData(fileData) {
        const result = {
            success: false,
            data: [],
            count: 0,
            error: null
        };

        try {
            const marketName = fileData.marketName;
            const marketConfig = marketConfigs[marketName];
            
            if (!marketConfig) {
                throw new Error(`마켓 설정 없음: ${marketName}`);
            }

            // 마켓 카운터 초기화
            if (!marketCounters[marketName]) {
                marketCounters[marketName] = 0;
            }

            console.log(`${marketName} 처리 시작: ${fileData.data.length}개 행`);

            // 각 행 처리
            for (const row of fileData.data) {
                globalCounter++;
                marketCounters[marketName]++;

                const mergedRow = mergeRow(row, fileData.mapping, marketName, marketConfig);
                
                if (mergedRow) {
                    result.data.push(mergedRow);
                    result.count++;
                }
            }

            result.success = true;
            console.log(`${marketName} 처리 완료: ${result.count}개 주문`);

        } catch (error) {
            console.error(`마켓 데이터 처리 오류 (${fileData.marketName}):`, error);
            result.error = error.message;
        }

        return result;
    }

    /**
     * 행 데이터 병합
     */
    function mergeRow(row, mapping, marketName, marketConfig) {
        const mergedRow = {};

        try {
            // 모든 표준 필드에 대해 매핑
            for (const standardField of standardFields) {
                if (standardField === '마켓명') {
                    mergedRow['마켓명'] = marketName;
                } else if (standardField === '연번') {
                    mergedRow['연번'] = globalCounter;
                } else if (standardField === '마켓') {
                    const initial = marketConfig.initial || marketName.charAt(0);
                    mergedRow['마켓'] = initial + String(marketCounters[marketName]).padStart(3, '0');
                } else {
                    // 매핑된 필드에서 값 가져오기
                    const mapInfo = mapping.fields[standardField];
                    
                    if (mapInfo) {
                        let value = row[mapInfo.originalField];
                        
                        // 데이터 타입별 처리
                        if (standardField.includes('결제일') || 
                            standardField.includes('발송일') || 
                            standardField.includes('주문일')) {
                            value = formatDate(value);
                        } else if (standardField.includes('금액') || 
                                   standardField.includes('수수료') ||
                                   standardField.includes('할인') || 
                                   standardField.includes('택배')) {
                            value = parseNumber(value);
                        }
                        
                        mergedRow[standardField] = value || '';
                    } else {
                        mergedRow[standardField] = '';
                    }
                }
            }

            // 추가 계산 필드
            mergedRow = calculateAdditionalFields(mergedRow, marketConfig);

            return mergedRow;

        } catch (error) {
            console.error('행 병합 오류:', error);
            return null;
        }
    }

    /**
     * 추가 필드 계산
     */
    function calculateAdditionalFields(row, marketConfig) {
        // 정산예정금액 계산
        if (marketConfig.settlementFormula) {
            row['정산예정금액'] = calculateSettlement(row, marketConfig.settlementFormula);
        } else {
            row['정산예정금액'] = row['상품금액'] || 0;
        }

        // 출고비용 계산 (옵션상품통합관리 연동 시)
        const quantity = parseInt(row['수량']) || 1;
        const vendor = String(row['벤더사'] || '').trim();
        
        if (vendor && vendor !== '달래마켓') {
            // 벤더사 위탁인 경우 출고비용 계산
            row['출고비용'] = 0; // 실제는 옵션상품통합관리에서 가져옴
        } else {
            row['출고비용'] = 0;
        }

        // 송장 상태
        row['송장상태'] = row['송장번호'] ? '발송' : '미발송';

        return row;
    }

    /**
     * 정산금액 계산
     */
    function calculateSettlement(row, formula) {
        try {
            if (!formula || formula.trim() === '') return 0;

            let calculation = formula;

            // 필드명을 값으로 치환
            for (const [fieldName, fieldValue] of Object.entries(row)) {
                if (calculation.includes(fieldName)) {
                    const numValue = typeof fieldValue === 'number' ? 
                                    fieldValue : parseNumber(fieldValue);
                    calculation = calculation.replace(
                        new RegExp(fieldName, 'g'), 
                        numValue
                    );
                }
            }

            // 계산 실행
            const result = Function('"use strict"; return (' + calculation + ')')();
            return isNaN(result) ? 0 : Math.round(result);

        } catch (error) {
            console.error('정산금액 계산 오류:', error);
            return 0;
        }
    }

    /**
     * 날짜 형식 변환
     */
    function formatDate(value) {
        try {
            if (!value) return '';
            
            const strValue = String(value);
            
            // 이미 올바른 형식
            if (strValue.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
                return strValue;
            }
            
            // MM/DD/YY HH:MM:SS 형식
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
            
            // 엑셀 시리얼 번호
            if (typeof value === 'number' && value > 25569 && value < 50000) {
                const date = new Date((value - 25569) * 86400 * 1000);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day} 00:00:00`;
            }
            
            return strValue;
            
        } catch (error) {
            console.error('날짜 변환 오류:', error);
            return String(value);
        }
    }

    /**
     * 숫자 파싱
     */
    function parseNumber(value) {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        
        if (typeof value === 'number') {
            return value;
        }
        
        let strValue = String(value).trim();
        
        // 쉼표, 원화 기호 등 제거
        strValue = strValue.replace(/[,₩￦$¥£€\s]/g, '');
        
        // 괄호로 둘러싸인 음수
        if (strValue.startsWith('(') && strValue.endsWith(')')) {
            strValue = '-' + strValue.substring(1, strValue.length - 1);
        }
        
        const num = parseFloat(strValue);
        return isNaN(num) ? 0 : num;
    }

    /**
     * 통계 업데이트
     */
    function updateStatistics(statistics, data, marketName) {
        // 마켓별 통계 초기화
        if (!statistics.byMarket[marketName]) {
            statistics.byMarket[marketName] = {
                count: 0,
                quantity: 0,
                amount: 0
            };
        }

        // 데이터 처리
        for (const row of data) {
            const quantity = parseInt(row['수량']) || 1;
            const amount = parseNumber(row['정산예정금액']) || 0;
            const optionName = String(row['옵션명'] || '').trim();

            // 마켓별 통계
            statistics.byMarket[marketName].count++;
            statistics.byMarket[marketName].quantity += quantity;
            statistics.byMarket[marketName].amount += amount;

            // 옵션별 통계
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

            // 전체 통계
            statistics.total.count++;
            statistics.total.quantity += quantity;
            statistics.total.amount += amount;
        }
    }

    /**
     * 데이터 정렬
     */
    function sortData(data) {
        // 마켓명 -> 연번 순으로 정렬
        return data.sort((a, b) => {
            const marketCompare = (a['마켓명'] || '').localeCompare(b['마켓명'] || '');
            if (marketCompare !== 0) return marketCompare;
            return (a['연번'] || 0) - (b['연번'] || 0);
        });
    }

    /**
     * 중복 제거
     */
    function removeDuplicates(data) {
        const seen = new Set();
        const unique = [];

        for (const row of data) {
            const key = `${row['주문번호']}_${row['상품주문번호']}_${row['옵션명']}`;
            
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(row);
            }
        }

        console.log(`중복 제거: ${data.length}개 → ${unique.length}개`);
        return unique;
    }

    // Public API
    return {
        initialize,
        processFiles,
        formatDate,
        parseNumber,
        removeDuplicates
    };

})();

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MergeProcessor;
}
