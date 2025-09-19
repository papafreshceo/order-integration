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
          
          // 주문기록 시트에서 데이터 읽기 (SPREADSHEET_ID_ORDERS 사용)
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
          const { sheetName, updates } = req.body;
          const { getOrderData, updateSheetData } = require('../lib/google-sheets');
          const targetSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
          
          // 시트 헤더만 읽기
          const headerData = await getOrderData(`'${sheetName}'!A1:ZZ1`, targetSpreadsheetId);
          if (!headerData || headerData.length === 0) {
            return res.status(400).json({ success: false, error: '시트 헤더를 찾을 수 없습니다' });
          }
          
          const headers = headerData[0];
          const orderNumIndex = headers.indexOf('주문번호');
          const carrierIndex = headers.indexOf('택배사');
          const trackingIndex = headers.indexOf('송장번호');
          const dateIndex = headers.indexOf('발송일(송장입력일)');
          
          if (orderNumIndex === -1) {
            return res.status(400).json({ success: false, error: '주문번호 컬럼을 찾을 수 없습니다' });
          }
          
          // 컬럼 인덱스를 문자로 변환하는 함수
          const getColumnLetter = (index) => {
            let letter = '';
            while (index >= 0) {
              letter = String.fromCharCode((index % 26) + 65) + letter;
              index = Math.floor(index / 26) - 1;
            }
            return letter;
          };
          
          // 주문번호 컬럼만 읽어서 행 번호 찾기
          const orderColumnLetter = getColumnLetter(orderNumIndex);
          const orderNumbers = await getOrderData(`'${sheetName}'!${orderColumnLetter}2:${orderColumnLetter}`, targetSpreadsheetId);
          
          // 오늘 날짜
          const today = new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).replace(/\. /g, '-').replace(/\./g, '');
          
          let updateCount = 0;
          
          // 각 업데이트 개별 처리
          for (const update of updates) {
            // 주문번호로 행 찾기
            let rowIndex = -1;
            for (let i = 0; i < orderNumbers.length; i++) {
              if (orderNumbers[i] && orderNumbers[i][0] === update.orderNumber) {
                rowIndex = i + 2; // +2는 헤더(1) + 0-based to 1-based
                break;
              }
            }
            
            if (rowIndex > 0) {
              // 택배사 업데이트
              if (carrierIndex >= 0 && update.carrier) {
                const carrierLetter = getColumnLetter(carrierIndex);
                await updateSheetData(
                  `'${sheetName}'!${carrierLetter}${rowIndex}`,
                  [[update.carrier]],
                  targetSpreadsheetId
                );
              }
              
              // 송장번호 업데이트
              if (trackingIndex >= 0 && update.trackingNumber) {
                const trackingLetter = getColumnLetter(trackingIndex);
                await updateSheetData(
                  `'${sheetName}'!${trackingLetter}${rowIndex}`,
                  [[update.trackingNumber]],
                  targetSpreadsheetId
                );
              }
              
              // 발송일 업데이트
              if (dateIndex >= 0 && update.trackingNumber) {
                const dateLetter = getColumnLetter(dateIndex);
                await updateSheetData(
                  `'${sheetName}'!${dateLetter}${rowIndex}`,
                  [[today]],
                  targetSpreadsheetId
                );
              }
              
              updateCount++;
            }
          }
          
          return res.status(200).json({ 
            success: true, 
            updated: updateCount,
            message: `${updateCount}건의 송장번호가 업데이트되었습니다`
          });
          
        } catch (error) {
          console.error('updateTracking 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message || '송장번호 업데이트 실패'
          });
        }

      // getAuthClient 함수가 필요한 경우 추가
      async function getAuthClient() {
        const { google } = require('googleapis');
        const auth = new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || './credentials.json',
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        return auth.getClient();
      }

      case 'getMarketFormats':
        try {
          // 마켓별송장업로드양식 시트 읽기 (SPREADSHEET_ID 사용)
          const formatData = await getSheetData('마켓별송장업로드양식!A:Z');
          
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

case 'getMarketData':
        try {
          const { useMainSpreadsheet } = req.body;
          
          // 발송관리 탭에서 호출시: 주문 데이터와 마켓 색상 둘 다 반환
          if (useMainSpreadsheet) {
            // 1. 오늘 날짜의 주문 데이터 가져오기
            const today = new Date().toLocaleDateString('ko-KR', {
              timeZone: 'Asia/Seoul',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\. /g, '').replace(/\./g, '').replace(/-/g, '');
            
            const { getOrderData } = require('../lib/google-sheets');
            let orderData = [];
            
            try {
              const rawOrderData = await getOrderData(`${today}!A:ZZ`, process.env.SPREADSHEET_ID_ORDERS);
              
              if (rawOrderData && rawOrderData.length >= 2) {
                const headers = rawOrderData[0];
                const rows = rawOrderData.slice(1);
                
                orderData = rows.map(row => {
                  const obj = {};
                  headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                  });
                  return obj;
                });
              }
            } catch (orderError) {
              console.log('주문 데이터 로드 실패:', orderError.message);
            }
            
            // 2. 매핑 시트에서 마켓 색상 정보 가져오기
            let markets = [];
            let colors = {};
            
            try {
              const mappingData = await getSheetData('매핑!A:D'); // A~D열까지 읽기
              
              if (mappingData && mappingData.length > 2) {
                // 헤더 위치 찾기
                let headerRowIndex = -1;
                for (let i = 0; i < Math.min(5, mappingData.length); i++) {
                  if (mappingData[i] && mappingData[i][0] === '마켓명') {
                    headerRowIndex = i;
                    break;
                  }
                }
                
                if (headerRowIndex !== -1) {
                  // 데이터 행 처리 (헤더 다음 행부터)
                  for (let i = headerRowIndex + 1; i < mappingData.length; i++) {
                    const row = mappingData[i];
                    if (row && row[0]) {
                      const marketName = String(row[0]).trim();
                      const colorValue = row[2] ? String(row[2]).trim() : ''; // C열이 색상
                      
                      if (marketName) {
                        markets.push(marketName);
                        
                        if (colorValue) {
                          // RGB 값 처리
                          if (colorValue.match(/^\d+,\s*\d+,\s*\d+$/)) {
                            colors[marketName] = `rgb(${colorValue})`;
                          } else if (colorValue.startsWith('rgb(')) {
                            colors[marketName] = colorValue;
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch (mappingError) {
              console.log('매핑 데이터 로드 실패:', mappingError.message);
            }
            
            return res.status(200).json({ 
              success: true,
              data: orderData,
              markets: markets,
              colors: colors
            });
            
          } else {
            // 기본 동작: 매핑 시트에서만 마켓 정보 읽기
            const mappingData = await getSheetData('매핑!A:D');
            
            const markets = [];
            const colors = {};
            
            if (mappingData && mappingData.length > 2) {
              // 헤더 위치 찾기
              let headerRowIndex = -1;
              for (let i = 0; i < Math.min(5, mappingData.length); i++) {
                if (mappingData[i] && mappingData[i][0] === '마켓명') {
                  headerRowIndex = i;
                  break;
                }
              }
              
              if (headerRowIndex !== -1) {
                // 데이터 행 처리
                for (let i = headerRowIndex + 1; i < mappingData.length; i++) {
                  const row = mappingData[i];
                  if (row && row[0]) {
                    const marketName = String(row[0]).trim();
                    const colorValue = row[2] ? String(row[2]).trim() : ''; // C열이 색상
                    
                    if (marketName) {
                      markets.push(marketName);
                      
                      if (colorValue) {
                        if (colorValue.match(/^\d+,\s*\d+,\s*\d+$/)) {
                          colors[marketName] = `rgb(${colorValue})`;
                        } else if (colorValue.startsWith('rgb(')) {
                          colors[marketName] = colorValue;
                        }
                      }
                    }
                  }
                }
              }
            }
            
            return res.status(200).json({ 
              success: true, 
              markets: markets.length > 0 ? markets : ['쿠팡', '네이버', '11번가'],
              colors: colors
            });
          }
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







