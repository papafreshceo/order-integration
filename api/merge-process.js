// api/merge-process.js - 앱스크립트와 동일한 처리 로직

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
    
    if (typeof value === 'number' && value > 25569 && value < 50000) {
        const date = new Date((value - 25569) * 86400 * 1000);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day} 00:00:00`;
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
        
        // 계산 실행
        const result = Function('"use strict"; return (' + calculation + ')')();
        return isNaN(result) ? 0 : Math.round(result);
        
    } catch (error) {
        console.error('정산금액 계산 오류:', error);
        return 0;
    }
}

// 옵션상품통합관리 데이터 가져오기
async function getOptionProductInfo(sheets, spreadsheetId) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: '옵션상품통합관리!A:Z'
        });
        
        const data = response.data.values;
        if (!data || data.length < 2) return {};
        
        const headers = data[0];
        const optionNameIdx = headers.indexOf('옵션명');
        const shipmentIdx = headers.indexOf('출고');
        const invoiceIdx = headers.indexOf('송장');
        const shippingLocationIdx = headers.indexOf('발송지');
        const shippingAddressIdx = headers.indexOf('발송지주소');
        const shippingContactIdx = headers.indexOf('발송지연락처');
        const totalCostIdx = headers.indexOf('총원가');
        const vendorIdx = headers.indexOf('벤더사');
        
        if (optionNameIdx === -1) return {};
        
        const optionInfo = {};
        
        for (let i = 1; i < data.length; i++) {
            const optionName = String(data[i][optionNameIdx] || '').trim();
            if (!optionName) continue;
            
            optionInfo[optionName] = {
                shipment: shipmentIdx !== -1 ? String(data[i][shipmentIdx] || '').trim() : '',
                invoice: invoiceIdx !== -1 ? String(data[i][invoiceIdx] || '').trim() : '',
                shippingLocation: shippingLocationIdx !== -1 ? String(data[i][shippingLocationIdx] || '').trim() : '',
                shippingAddress: shippingAddressIdx !== -1 ? String(data[i][shippingAddressIdx] || '').trim() : '',
                shippingContact: shippingContactIdx !== -1 ? String(data[i][shippingContactIdx] || '').trim() : '',
                totalCost: totalCostIdx !== -1 ? parseNumber(data[i][totalCostIdx]) : 0,
                vendor: vendorIdx !== -1 ? String(data[i][vendorIdx] || '').trim() : ''
            };
        }
        
        return optionInfo;
        
    } catch (error) {
        console.error('옵션상품통합관리 로드 오류:', error);
        return {};
    }
}

// 가격계산 데이터 가져오기
async function getPriceCalculationInfo(sheets, spreadsheetId) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: '가격계산!A:Z'
        });
        
        const data = response.data.values;
        if (!data || data.length < 2) return {};
        
        const headers = data[0];
        const optionNameIdx = headers.indexOf('옵션명');
        const sellerSupplyPriceIdx = headers.indexOf('셀러공급가');
        
        if (optionNameIdx === -1) return {};
        
        const priceInfo = {};
        
        for (let i = 1; i < data.length; i++) {
            const optionName = String(data[i][optionNameIdx] || '').trim();
            if (!optionName) continue;
            
            const supplyPrice = sellerSupplyPriceIdx !== -1 ? parseNumber(data[i][sellerSupplyPriceIdx]) : 0;
            
            priceInfo[optionName] = {
                sellerSupplyPrice: supplyPrice
            };
        }
        
        return priceInfo;
        
    } catch (error) {
        console.error('가격계산 로드 오류:', error);
        return {};
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
        
        // Google Sheets API 초기화
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
        const auth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );
        
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.SHEET_ID_WRITE;
        
        // 옵션상품통합관리, 가격계산 데이터 로드
        const optionProductInfo = await getOptionProductInfo(sheets, spreadsheetId);
        const priceCalculationInfo = await getPriceCalculationInfo(sheets, spreadsheetId);
        
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
                
                // 옵션상품통합관리 데이터 적용
                const optionName = String(mergedRow['옵션명'] || '').trim();
                const quantity = parseInt(mergedRow['수량']) || 1;
                
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
                    settlementAmount = calculateSettlementAmount(mergedRow, market.settlementFormula);
                }
                if (settlementAmount === 0 && mergedRow['상품금액']) {
                    settlementAmount = parseNumber(mergedRow['상품금액']);
                }
                mergedRow['정산예정금액'] = settlementAmount;
                
                mergedData.push(mergedRow);
                
                // 통계 업데이트
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
        
        // 시트에 저장
        const sheetName = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        
        if (mergedData.length > 0) {
            // 새 시트 생성 및 데이터 저장
            try {
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [{
                            addSheet: {
                                properties: {
                                    title: sheetName
                                }
                            }
                        }]
                    }
                });
            } catch (e) {
                // 시트가 이미 존재하는 경우
                console.log('시트가 이미 존재함:', sheetName);
            }
            
            // 헤더와 데이터 준비
            const values = [mappingData.standardFields];
            for (const row of mergedData) {
                const rowValues = mappingData.standardFields.map(field => {
                    const value = row[field];
                    return value !== undefined && value !== null ? String(value) : '';
                });
                values.push(rowValues);
            }
            
            // 데이터 쓰기
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!A1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: values
                }
            });
        }
        
        res.status(200).json({
            success: true,
            data: mergedData,
            statistics: statistics,
            processedCount: mergedData.length,
            standardFields: mappingData.standardFields,
            sheetName: sheetName
        });
        
    } catch (error) {
        console.error('처리 오류:', error);
        res.status(500).json({
            error: error.message
        });
    }
};
