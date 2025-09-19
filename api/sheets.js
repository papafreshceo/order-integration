const { 
  getSheetData, 
  updateSheetData, 
  appendSheetData, 
  clearSheet,
  createSheet,
  // 주문 시트 함수들
  createOrderSheet,
  clearOrderSheet,
  saveOrderData,
  mergeAndSaveOrderData
} = require('../lib/google-sheets');

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, sheetName, range, values } = req.body || req.query;

    switch (action) {
      case 'getProductData':
        try {
          // 제품 정보 조회 (SPREADSHEET_ID_PRODUCTS 사용)
          const productSpreadsheetId = process.env.SPREADSHEET_ID_PRODUCTS || '17MGwbu1DZf5yg-BLhfZr-DO-OPiau3aeyBMtSssv7Sg';
          
          // google-sheets 모듈에서 getProductSheetData 함수 사용
          const { getProductSheetData } = require('../lib/google-sheets');
          
          // 통합상품마스터 시트 데이터
          const productSheetData = await getProductSheetData(productSpreadsheetId, '통합상품마스터!A:DZ');
          const productInfo = {};
          
          if (productSheetData && productSheetData.length > 1) {
              const headers = productSheetData[0];
              const optionIdx = headers.indexOf('옵션명');
              
              for (let i = 1; i < productSheetData.length; i++) {
                  const optionName = String(productSheetData[i][optionIdx] || '').trim();
                  if (!optionName) continue;
                  
                  // 모든 컬럼 데이터를 객체로 저장
                  const rowData = {};
                  headers.forEach((header, idx) => {
                      if (header && header !== '옵션명') {
                          const value = productSheetData[i][idx];
                          // 숫자 필드 처리
                          if (header.includes('비용') || header.includes('가격') || header.includes('금액')) {
                              rowData[header] = parseNumber(value);
                          } else {
                              rowData[header] = String(value || '').trim();
                          }
                      }
                  });
                  
                  productInfo[optionName] = rowData;
              }
          }
          
          return res.status(200).json({
              productData: productInfo,
              priceData: productInfo  // productInfo에 이미 셀러공급가 포함
          });
          
        } catch (error) {
          console.error('getProductData 오류:', error);
          return res.status(500).json({
              error: 'Failed to load product data',
              details: error.message
          });
        }

      case 'getOrdersByDate':
        try {
          const { sheetName, spreadsheetId } = req.body;
          const { getOrderData } = require('../lib/google-sheets');
          
          // 주문기록 시트에서 데이터 읽기
          const orderData = await getOrderData(`${sheetName}!A:ZZ`, spreadsheetId || process.env.SPREADSHEET_ID_ORDERS);
          
          if (!orderData || orderData.length < 2) {
            return res.status(200).json({ success: true, data: [] });
          }
          
          const headers = orderData[0];
          const rows = orderData.slice(1);
          
          const formattedData = rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          return res.status(200).json({ success: true, data: formattedData });
        } catch (error) {
          console.error('getOrdersByDate 오류:', error);
          return res.status(200).json({ success: true, data: [] });
        }

      case 'updateTracking':
        try {
          const { sheetName, updates, spreadsheetId } = req.body;
          const { getOrderData, batchUpdateSheetData } = require('../lib/google-sheets');
          
          // 먼저 시트 데이터 읽기
          const orderData = await getOrderData(`${sheetName}!A:ZZ`, spreadsheetId || process.env.SPREADSHEET_ID_ORDERS);
          
          if (!orderData || orderData.length < 2) {
            return res.status(400).json({ success: false, error: '시트 데이터가 없습니다' });
          }
          
          const headers = orderData[0];
          const rows = orderData.slice(1);
          
          // 주문번호, 택배사, 송장번호 컬럼 인덱스 찾기
          const orderNumIndex = headers.indexOf('주문번호');
          const carrierIndex = headers.indexOf('택배사');
          const trackingIndex = headers.indexOf('송장번호');
          
          if (orderNumIndex === -1) {
            return res.status(400).json({ success: false, error: '주문번호 컬럼을 찾을 수 없습니다' });
          }
          
          // 업데이트할 데이터 준비
          const updateRequests = [];
          let updatedCount = 0;
          
          updates.forEach(update => {
            // 주문번호로 행 찾기
            const rowIndex = rows.findIndex(row => row[orderNumIndex] === update.orderNumber);
            
            if (rowIndex >= 0) {
              const actualRowIndex = rowIndex + 2; // 헤더 + 1-based index
              
              if (update.carrier && carrierIndex >= 0) {
                updateRequests.push({
                  range: `${sheetName}!${columnToLetter(carrierIndex + 1)}${actualRowIndex}`,
                  values: [[update.carrier]]
                });
                updatedCount++;
              }
              
              if (update.trackingNumber && trackingIndex >= 0) {
                updateRequests.push({
                  range: `${sheetName}!${columnToLetter(trackingIndex + 1)}${actualRowIndex}`,
                  values: [[update.trackingNumber]]
                });
                updatedCount++;
              }
            }
          });
          
          // 배치 업데이트 실행
          if (updateRequests.length > 0) {
            await batchUpdateSheetData(updateRequests, spreadsheetId || process.env.SPREADSHEET_ID_ORDERS);
          }
          
          return res.status(200).json({ 
            success: true, 
            updated: updatedCount,
            message: `${updates.length}건 중 ${updatedCount}건 업데이트됨`
          });
          
        } catch (error) {
          console.error('updateTracking 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: '송장번호 업데이트 실패',
            details: error.message 
          });
        }

      case 'getMarketFormats':
        try {
          const { spreadsheetId } = req.body;
          const { getSheetData } = require('../lib/google-sheets');
          
          // 마켓별송장업로드양식 시트 읽기
          const formatData = await getSheetData('마켓별송장업로드양식!A:Z', spreadsheetId || process.env.SPREADSHEET_ID);
          
          const formats = {};
          
          if (formatData && formatData.length > 0) {
            // 첫 행이 마켓명
            const markets = formatData[0].filter(cell => cell);
            
            // 각 마켓별로 필드 수집
            markets.forEach((market, colIndex) => {
              formats[market] = [];
              for (let rowIndex = 1; rowIndex < formatData.length; rowIndex++) {
                const field = formatData[rowIndex][colIndex];
                if (field) {
                  formats[market].push(field);
                }
              }
            });
          }
          
          // 기본값 제공
          if (Object.keys(formats).length === 0) {
            formats['쿠팡'] = ['주문번호', '택배사', '송장번호'];
            formats['네이버'] = ['상품주문번호', '택배사코드', '송장번호'];
            formats['11번가'] = ['배송번호', '택배사', '송장번호'];
            formats['지마켓'] = ['주문번호', '택배사', '운송장번호'];
            formats['옥션'] = ['주문번호', '택배사', '운송장번호'];
            formats['인터파크'] = ['주문번호', '택배사', '송장번호'];
            formats['티몬'] = ['주문번호', '택배사', '송장번호'];
            formats['위메프'] = ['주문번호', '택배사', '송장번호'];
          }
          
          return res.status(200).json({ 
            success: true, 
            formats: formats 
          });
          
        } catch (error) {
          console.error('getMarketFormats 오류:', error);
          return res.status(200).json({ 
            success: true, 
            formats: {
              '쿠팡': ['주문번호', '택배사', '송장번호'],
              '네이버': ['상품주문번호', '택배사코드', '송장번호'],
              '11번가': ['배송번호', '택배사', '송장번호']
            }
          });
        }
ccase 'getMarketData':
        try {
          const { getSheetData } = require('../lib/google-sheets');
          
          // 매핑 시트에서 마켓명과 색상 읽기 (SPREADSHEET_ID 사용)
          console.log('매핑 시트 읽기 시작, 스프레드시트 ID:', process.env.SPREADSHEET_ID);
          const mappingData = await getSheetData('매핑!A:B', process.env.SPREADSHEET_ID);
          console.log('매핑 데이터:', mappingData);
          
          const markets = [];
          const colors = {};
          
          if (mappingData && mappingData.length > 0) {
            console.log('매핑 데이터 행 수:', mappingData.length);
            
            // 데이터가 A3부터 시작한다고 가정 (A1은 빈칸, A2는 '마켓명' 헤더)
            for (let i = 2; i < mappingData.length; i++) {
              if (mappingData[i] && mappingData[i][0]) {
                const marketName = mappingData[i][0].trim();
                if (marketName && marketName !== '') {
                  markets.push(marketName);
                  // B열에 색상이 있으면 저장
                  if (mappingData[i][1]) {
                    colors[marketName] = mappingData[i][1].trim();
                  }
                }
              }
            }
          }
          
          console.log('파싱된 마켓 목록:', markets);
          console.log('파싱된 색상 매핑:', colors);
          
          return res.status(200).json({ 
            success: true, 
            markets: markets.length > 0 ? markets : ['쿠팡', '네이버', '11번가'],
            colors: colors
          });
          
        } catch (error) {
          console.error('getMarketData 오류:', error);
          return res.status(200).json({ 
            success: true, 
            markets: ['쿠팡', '네이버', '11번가'],
            colors: {}
          });
        }
      case 'saveToSheet':
        // 시트 생성 또는 확인
        const sheetResult = await createOrderSheet(sheetName);
        
        // 헤더와 데이터 분리
        const headerRow = values[0];
        const dataRows = values.slice(1);
        
        // 클라이언트에서 받은 마켓 색상 사용
        const marketColorMap = req.body.marketColors || {};
        
        // 중복 체크 및 병합 저장
        const result = await mergeAndSaveOrderData(
          sheetName, 
          dataRows, 
          headerRow,
          marketColorMap
        );
        
        return res.status(200).json({ 
          success: true, 
          sheetName: sheetName,
          ...result
        });

      case 'appendToSheet':
        const appendResult = await appendSheetData(range, values);
        return res.status(200).json({ 
          success: true, 
          result: appendResult 
        });

      default:
        return res.status(400).json({ 
          error: '알 수 없는 액션입니다.' 
        });
    }
  } catch (error) {
    console.error('Sheets API 오류:', error);
    res.status(500).json({ 
      error: error.message || '서버 오류가 발생했습니다.' 
    });
  }
}

// 컬럼 번호를 알파벳으로 변환하는 헬퍼 함수
function columnToLetter(column) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

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




