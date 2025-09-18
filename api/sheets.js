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
          
          // 옵션상품통합관리 시트 데이터
          const productSheetData = await getProductSheetData(productSpreadsheetId, '옵션상품통합관리!A:AZ');
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
          
          // 가격계산 시트 데이터
          const priceSheetData = await getProductSheetData(productSpreadsheetId, '가격계산!A:AZ');
          const priceInfo = {};
          
          if (priceSheetData && priceSheetData.length > 1) {
              const headers = priceSheetData[0];
              const optionIdx = headers.indexOf('옵션명');
              const priceIdx = headers.indexOf('셀러공급가');
              
              for (let i = 1; i < priceSheetData.length; i++) {
                  const optionName = String(priceSheetData[i][optionIdx] || '').trim();
                  if (!optionName) continue;
                  
                  priceInfo[optionName] = {
                      sellerSupplyPrice: priceIdx !== -1 ? parseNumber(priceSheetData[i][priceIdx]) : 0
                  };
              }
          }
          
          return res.status(200).json({
              productData: productInfo,
              priceData: priceInfo
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
          const { sheetName } = req.body;
          const orderData = await getOrderData(`${sheetName}!A:ZZ`);
          
          if (orderData.length < 2) {
            return res.status(200).json({ data: [] });
          }
          
          const headers = orderData[0];
          const rows = orderData.slice(1);
          
          const formattedData = rows.map(row => {
            const obj = { _sheetName: sheetName };
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          return res.status(200).json({ data: formattedData });
        } catch (error) {
          console.error('getOrdersByDate 오류:', error);
          return res.status(200).json({ data: [] });
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



