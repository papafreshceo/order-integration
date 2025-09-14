// api/mapping-data.js
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const MAPPING_SHEET = '매핑';
    
    // 매핑 시트 데이터 가져오기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${MAPPING_SHEET}!A1:ZZ1000`,
    });
    
    const data = response.data.values || [];
    
    if (data.length < 3) {
      return res.status(400).json({ error: '매핑 시트에 데이터가 없습니다.' });
    }
    
    const mappingData = {
      markets: {},
      marketOrder: [],
      standardFields: [],
      standardFieldsStartCol: -1
    };
    
    // "표준필드시작" 마커 찾기 (2행에서)
    const markerRow = data[1];
    for (let i = 0; i < markerRow.length; i++) {
      if (String(markerRow[i]).trim() === '표준필드시작') {
        mappingData.standardFieldsStartCol = i + 1;
        break;
      }
    }
    
    if (mappingData.standardFieldsStartCol === -1) {
      return res.status(400).json({ error: '표준필드시작 마커를 찾을 수 없습니다.' });
    }
    
    // 표준필드 목록 생성
    for (let i = mappingData.standardFieldsStartCol; i < markerRow.length; i++) {
      const fieldName = String(markerRow[i] || '').trim();
      if (fieldName === '') break;
      mappingData.standardFields.push(fieldName);
    }
    
    // 마켓별 매핑 정보 로드 (3행부터)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      const marketName = String(row[0] || '').trim();
      
      if (!marketName) continue;
      
      const marketInfo = {
        name: marketName,
        initial: String(row[1] || '').trim(),
        color: String(row[2] || '200,200,200').trim(),
        detectString1: String(row[3] || '').trim(),
        detectString2: String(row[4] || '').trim(),
        detectString3: String(row[5] || '').trim(),
        settlementFormula: String(row[6] || '').trim(),
        headerRow: parseInt(row[7]) || 1,
        orderIndex: i - 2,
        mappings: {}
      };
      
      // 필드 매핑 정보
      for (let j = 0; j < mappingData.standardFields.length; j++) {
        const standardField = mappingData.standardFields[j];
        const colIndex = mappingData.standardFieldsStartCol + j;
        const mappedField = String(row[colIndex] || '').trim();
        if (mappedField) {
          marketInfo.mappings[standardField] = mappedField;
        }
      }
      
      mappingData.markets[marketName] = marketInfo;
      mappingData.marketOrder.push(marketName);
    }
    
    res.status(200).json(mappingData);
    
  } catch (error) {
    console.error('매핑 데이터 로드 오류:', error);
    res.status(500).json({ error: error.toString() });
  }
}

// ===========================
// api/detect-market.js
// ===========================
export async function detectMarket(req, res) {
  const { fileName, headers } = req.body;
  
  try {
    // 매핑 데이터 가져오기
    const mappingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/mapping-data`);
    const mappingData = await mappingResponse.json();
    
    const fileNameLower = fileName.toLowerCase();
    const headerText = headers.join(' ').toLowerCase();
    
    // 파일명으로 먼저 체크 (detectString1)
    for (const marketName in mappingData.markets) {
      const market = mappingData.markets[marketName];
      
      if (market.detectString1 && market.detectString1.length > 0) {
        if (fileNameLower.includes(market.detectString1.toLowerCase())) {
          return res.status(200).json({ marketName });
        }
      }
    }
    
    // 헤더로 체크 (detectString2)
    for (const marketName in mappingData.markets) {
      const market = mappingData.markets[marketName];
      
      if (market.detectString2 && market.detectString2.length > 0) {
        const detectStrings = market.detectString2.split(',').map(s => s.trim());
        let matchCount = 0;
        
        for (const detectStr of detectStrings) {
          if (detectStr && headerText.includes(detectStr.toLowerCase())) {
            matchCount++;
          }
        }
        
        const requiredMatches = detectStrings.length > 1 ? 2 : 1;
        
        if (matchCount >= requiredMatches) {
          return res.status(200).json({ marketName });
        }
      }
      
      // detectString3 체크
      if (market.detectString3 && market.detectString3.length > 0) {
        const detectStrings3 = market.detectString3.split(',').map(s => s.trim());
        let matchCount3 = 0;
        
        for (const detectStr of detectStrings3) {
          if (detectStr && headerText.includes(detectStr.toLowerCase())) {
            matchCount3++;
          }
        }
        
        if (matchCount3 >= (detectStrings3.length > 1 ? 2 : 1)) {
          return res.status(200).json({ marketName });
        }
      }
    }
    
    res.status(200).json({ marketName: null });
    
  } catch (error) {
    console.error('마켓 감지 오류:', error);
    res.status(500).json({ error: error.toString() });
  }
}

// ===========================
// api/process-orders.js
// ===========================
import { getOptionProductInfo, getPriceCalculationInfo, getSalesInfo } from './sheets-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filesData = req.body.files;
    
    if (!filesData || filesData.length === 0) {
      return res.status(400).json({ success: false, error: '처리할 파일이 없습니다' });
    }
    
    // 매핑 데이터 로드
    const mappingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/mapping-data`);
    const mappingData = await mappingResponse.json();
    
    // 추가 시트 데이터 로드
    const [salesInfo, optionProductInfo, priceCalculationInfo] = await Promise.all([
      getSalesInfo(),
      getOptionProductInfo(),
      getPriceCalculationInfo()
    ]);
    
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
    
    // 파일별 처리
    for (const fileData of filesData) {
      // 오늘 날짜 파일만 처리
      if (!fileData.isToday) {
        skippedCount++;
        continue;
      }
      
      const marketName = fileData.marketName;
      if (!marketName || !mappingData.markets[marketName]) {
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
      for (const row of fileData.data) {
        marketCounters[marketName]++;
        globalCounter++;
        
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
            const mappedField = market.mappings[standardField];
            
            if (mappedField) {
              let fieldValue = row[mappedField];
              
              if (fieldValue === undefined) {
                for (const key in row) {
                  if (key.trim() === mappedField.trim()) {
                    fieldValue = row[key];
                    break;
                  }
                }
              }
              
              if (fieldValue !== undefined) {
                // 날짜 필드 처리
                if (standardField.includes('결제일') || standardField.includes('발송일') || standardField.includes('주문일')) {
                  fieldValue = formatDate(fieldValue);
                }
                // 금액 필드 처리
                else if (standardField.includes('금액') || standardField.includes('수수료')) {
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
        
        // 옵션상품통합관리에서 추가 정보 가져오기
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
          settlementAmount = calculateSettlementAmount(mergedRow, market.settlementFormula, marketName);
        }
        
        if (settlementAmount === 0) {
          if (optionName && salesInfo[optionName]) {
            settlementAmount = salesInfo[optionName].sellingPrice || 0;
          }
        }
        
        if (settlementAmount === 0 && mergedRow['상품금액']) {
          settlementAmount = typeof mergedRow['상품금액'] === 'number' ? 
                            mergedRow['상품금액'] : parseNumber(mergedRow['상품금액']);
        }
        
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
            amount: 0
          };
        }
        statistics.byOption[optionName].count++;
        statistics.byOption[optionName].quantity += quantity;
        statistics.byOption[optionName].amount += amount;
        
        statistics.total.count++;
        statistics.total.quantity += quantity;
        statistics.total.amount += amount;
      }
    }
    
    // Google Sheets에 저장
    if (mergedData.length > 0) {
      await saveToSheet(sheetName, mergedData, mappingData.standardFields);
    }
    
    res.status(200).json({
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
    res.status(500).json({
      success: false,
      error: error.toString()
    });
  }
}

// 날짜 형식 변환 함수
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
    
    if (year.length === 2) {
      year = '20' + year;
    }
    
    return `${year}-${month}-${day} ${timePart}`;
  }
  
  if (typeof value === 'number' && value > 25569 && value < 50000) {
    const date = new Date((value - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} 00:00:00`;
  }
  
  if (strValue.match(/\d{4}-\d{2}-\d{2}/)) {
    return strValue.split(' ')[0] + ' 00:00:00';
  }
  
  return strValue;
}

// 숫자 변환 함수
function parseNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  let strValue = String(value).trim();
  strValue = strValue.replace(/[,₩￦$¥£€\s]/g, '');
  
  if (strValue.startsWith('(') && strValue.endsWith(')')) {
    strValue = '-' + strValue.substring(1, strValue.length - 1);
  }
  
  const num = parseFloat(strValue);
  return isNaN(num) ? 0 : num;
}

// 정산예정금액 계산
function calculateSettlementAmount(row, formula, marketName) {
  try {
    if (!formula || formula.trim() === '') {
      return 0;
    }
    
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
    
    try {
      const result = Function('"use strict"; return (' + calculation + ')')();
      return isNaN(result) ? 0 : Math.round(result);
    } catch (evalError) {
      console.error(`계산 실행 오류: ${evalError.message}`);
      return 0;
    }
    
  } catch (error) {
    console.error(`정산금액 계산 오류 (${marketName}):`, error);
    return 0;
  }
}

// Google Sheets에 저장
async function saveToSheet(sheetName, data, standardFields) {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  
  // 시트 생성 또는 클리어
  const sheetsResponse = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties'
  });
  
  const existingSheet = sheetsResponse.data.sheets.find(
    sheet => sheet.properties.title === sheetName
  );
  
  let sheetId;
  
  if (existingSheet) {
    sheetId = existingSheet.properties.sheetId;
    
    // 기존 시트 클리어
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A:ZZ`
    });
  } else {
    // 새 시트 생성
    const addSheetResponse = await sheets.spreadsheets.batchUpdate({
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
    
    sheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;
  }
  
  // 데이터 준비
  const values = [standardFields];
  
  data.forEach(row => {
    const rowValues = standardFields.map(field => {
      const value = row[field];
      return value !== undefined && value !== null ? String(value) : '';
    });
    values.push(rowValues);
  });
  
  // 데이터 쓰기
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: {
      values
    }
  });
  
  return true;
}
