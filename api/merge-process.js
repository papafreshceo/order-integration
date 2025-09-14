// api/merge-process.js - 데이터 통합 처리 API

const { google } = require('googleapis');

// 날짜 형식 변환
function formatDate(value) {
    if (!value) return '';
    const strValue = String(value);
    
    if (strValue.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
        return strValue;
    }
    
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
    
    return strValue;
}

// 숫자 파싱
function parseNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    
    let strValue = String(value).trim();
    strValue = strValue.replace(/[,₩￦$]/g, '');
    const num = parseFloat(strValue);
    return isNaN(num) ? 0 : num;
}

// 정산금액 계산
function calculateSettlementAmount(row, formula) {
    if (!formula || formula.trim() === '') return 0;
    
    try {
        let calculation = formula;
        
        // 필드명을 값으로 치환
        for (const [fieldName, fieldValue] of Object.entries(row)) {
            if (calculation.includes(fieldName)) {
                const numValue = typeof fieldValue === 'number' ? fieldValue : parseNumber(fieldValue);
                calculation = calculation.replace(new RegExp(fieldName, 'g'), numValue);
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
        
        if (!filesData || filesData.length === 0) {
            res.status(400).json({ error: '처리할 파일이 없습니다' });
            return;
        }
        
        const mergedData = [];
        const marketCounters = {};
        let globalCounter = 0;
        
        const statistics = {
            byMarket: {},
            byOption: {},
            total: { count: 0, quantity: 0, amount: 0 }
        };
        
        // 파일별 처리
        for (const fileData of filesData) {
            if (!fileData.isToday) continue;
            
            const marketName = fileData.marketName;
            if (!marketName || !mappingData.markets[marketName]) continue;
            
            const market = mappingData.markets[marketName];
            
            if (!marketCounters[marketName]) {
                marketCounters[marketName] = 0;
            }
            
            if (!statistics.byMarket[marketName]) {
                statistics.byMarket[marketName] = {
                    count: 0,
                    quantity: 0,
                    amount: 0
                };
            }
            
            // 데이터 처리
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
                        const mappedField = market.mappings[standardField];
                        
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
                if (market.settlementFormula) {
                    settlementAmount = calculateSettlementAmount(mergedRow, market.settlementFormula);
                }
                if (settlementAmount === 0 && mergedRow['상품금액']) {
                    settlementAmount = parseNumber(mergedRow['상품금액']);
                }
                mergedRow['정산예정금액'] = settlementAmount;
                
                mergedData.push(mergedRow);
                
                // 통계 업데이트
                const quantity = parseInt(mergedRow['수량']) || 1;
                const optionName = String(mergedRow['옵션명'] || '').trim();
                
                statistics.byMarket[marketName].count++;
                statistics.byMarket[marketName].quantity += quantity;
                statistics.byMarket[marketName].amount += settlementAmount;
                
                if (!statistics.byOption[optionName]) {
                    statistics.byOption[optionName] = {
                        count: 0,
                        quantity: 0,
                        amount: 0
                    };
                }
                statistics.byOption[optionName].count++;
                statistics.byOption[optionName].quantity += quantity;
                statistics.byOption[optionName].amount += settlementAmount;
                
                statistics.total.count++;
                statistics.total.quantity += quantity;
                statistics.total.amount += settlementAmount;
            }
        }
        
        res.status(200).json({
            success: true,
            data: mergedData,
            statistics: statistics,
            processedCount: mergedData.length,
            standardFields: mappingData.standardFields
        });
        
    } catch (error) {
        console.error('처리 오류:', error);
        res.status(500).json({
            error: error.message
        });
    }
};
