// api/merge-process.js - 앱스크립트 processOrderFiles와 동일한 로직

module.exports = async (req, res) => {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        const { filesData, mappingData } = req.body;
        
        console.log('processOrderFiles 시작');
        console.log('받은 파일 수:', filesData.length);
        
        if (!filesData || filesData.length === 0) {
            return res.status(200).json({
                success: false,
                error: '처리할 파일이 없습니다'
            });
        }
        
        if (!mappingData || mappingData.error) {
            return res.status(200).json({
                success: false,
                error: mappingData?.error || '매핑 데이터가 없습니다'
            });
        }
        
        // 시트명 생성 (YYYYMMDD 형식)
        const sheetName = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        
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
            
            // 오늘 날짜 파일만 처리
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
            let marketProcessedCount = 0;
            
            for (const row of fileData.data) {
                marketCounters[marketName]++;
                globalCounter++;
                marketProcessedCount++;
                
                const mergedRow = {};
                
                // 모든 표준필드에 대해 매핑
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
                        const mappedField = market.mappings ? market.mappings[standardField] : null;
                        
                        if (mappedField) {
                            let fieldValue = row[mappedField];
                            
                            // 날짜 필드 처리
                            if (standardField.includes('결제일') || standardField.includes('발송일')) {
                                fieldValue = formatDate(fieldValue);
                            }
                            // 금액 필드 처리
                            else if (standardField.includes('금액') || standardField.includes('수수료')) {
                                fieldValue = parseNumber(fieldValue);
                            }
                            
                            mergedRow[standardField] = fieldValue !== undefined ? fieldValue : '';
                        } else {
                            mergedRow[standardField] = '';
                        }
                    }
                }
                
                // 정산예정금액 계산
                let settlementAmount = 0;
                
                // 1. 매핑 시트의 공식으로 계산
                if (market.settlementFormula) {
                    settlementAmount = calculateSettlementAmount(mergedRow, market.settlementFormula, marketName);
                }
                
                // 2. 여전히 0이면 상품금액 사용
                if (settlementAmount === 0 && mergedRow['상품금액']) {
                    settlementAmount = typeof mergedRow['상품금액'] === 'number' ? 
                                      mergedRow['상품금액'] : parseNumber(mergedRow['상품금액']);
                }
                
                mergedRow['정산예정금액'] = settlementAmount;
                
                mergedData.push(mergedRow);
                processedCount++;
                
                // 통계 업데이트
                const quantity = parseInt(mergedRow['수량']) || 1;
                const optionName = String(mergedRow['옵션명'] || '').trim();
                const amount = settlementAmount;
                
                // 마켓별 통계
                statistics.byMarket[marketName].count++;
                statistics.byMarket[marketName].quantity += quantity;
                statistics.byMarket[marketName].amount += amount;
                
                // 옵션별 통계
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
                
                // 전체 통계
                statistics.total.count++;
                statistics.total.quantity += quantity;
                statistics.total.amount += amount;
            }
            
            console.log(`${marketName} 처리 완료: ${marketProcessedCount}개 행 처리됨`);
        }
        
        console.log(`전체 처리 완료: ${processedCount}개 주문, ${skippedCount}개 파일 스킵`);
        
        return res.status(200).json({
            success: true,
            data: mergedData,
            statistics: statistics,
            sheetName: sheetName,
            processedCount: processedCount,
            skippedCount: skippedCount,
            standardFields: mappingData.standardFields
        });
        
    } catch (error) {
        console.error('주문 처리 오류:', error);
        return res.status(200).json({
            success: false,
            error: error.toString()
        });
    }
};

// 날짜 형식 변환 함수 - 앱스크립트와 동일
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

// 숫자 파싱 함수 - 앱스크립트와 동일
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

// 정산예정금액 계산 - 앱스크립트와 동일
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
        
        const result = Function('"use strict"; return (' + calculation + ')')();
        const finalResult = isNaN(result) ? 0 : Math.round(result);
        console.log(`  계산 결과: ${finalResult}`);
        return finalResult;
        
    } catch (error) {
        console.error(`정산금액 계산 오류 (${marketName}):`, error);
        return 0;
    }
}
