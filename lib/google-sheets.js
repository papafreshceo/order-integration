const { google } = require('googleapis');

let sheetsClient = null;

function getAuthClient() {
  if (!sheetsClient) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    sheetsClient = google.sheets({ version: 'v4', auth });
  }
  return sheetsClient;
}

// ========================================
// 기본 시트 함수들 (SPREADSHEET_ID 사용)
// ========================================
async function getSheetData(range) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: range
    });
    return response.data.values || [];
  } catch (error) {
    console.error('시트 읽기 오류:', error);
    throw error;
  }
}

async function updateSheetData(range, values) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });
    return response.data;
  } catch (error) {
    console.error('시트 쓰기 오류:', error);
    throw error;
  }
}

async function appendSheetData(range, values) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values }
    });
    return response.data;
  } catch (error) {
    console.error('시트 추가 오류:', error);
    throw error;
  }
}

async function clearSheet(range) {
  try {
    const sheets = getAuthClient();
    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: range
    });
    return true;
  } catch (error) {
    console.error('시트 클리어 오류:', error);
    throw error;
  }
}

async function createSheet(title) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.SPREADSHEET_ID,
      requestBody: {
        requests: [{
          addSheet: {
            properties: { title }
          }
        }]
      }
    });
    return response.data;
  } catch (error) {
    if (error.message.includes('already exists')) {
      return { exists: true };
    }
    throw error;
  }
}

// ========================================
// 주문 시트 함수들 (SPREADSHEET_ID_ORDERS 사용)
// ========================================
async function getOrderData(range) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID_ORDERS,
      range: range
    });
    return response.data.values || [];
  } catch (error) {
    console.error('주문 시트 읽기 오류:', error);
    return [];
  }
}

async function saveOrderData(range, values) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID_ORDERS,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });
    return response.data;
  } catch (error) {
    console.error('주문 시트 쓰기 오류:', error);
    throw error;
  }
}

async function appendOrderData(range, values) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID_ORDERS,
      range: range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values }
    });
    return response.data;
  } catch (error) {
    console.error('주문 시트 추가 오류:', error);
    throw error;
  }
}

async function clearOrderSheet(range) {
  try {
    const sheets = getAuthClient();
    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.SPREADSHEET_ID_ORDERS,
      range: range
    });
    return true;
  } catch (error) {
    console.error('주문 시트 클리어 오류:', error);
    throw error;
  }
}

async function createOrderSheet(title) {
  try {
    const sheets = getAuthClient();
    
    // 시트 목록 가져오기
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID_ORDERS
    });
    
    // 이미 시트가 있는지 확인
    const existingSheet = spreadsheet.data.sheets.find(
      sheet => sheet.properties.title === title
    );
    
    if (existingSheet) {
      return { exists: true, sheetId: existingSheet.properties.sheetId };
    }
    
    // 새 시트 생성
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.SPREADSHEET_ID_ORDERS,
      requestBody: {
        requests: [{
          addSheet: {
            properties: { title }
          }
        }]
      }
    });
    
    return { 
      exists: false, 
      sheetId: response.data.replies[0].addSheet.properties.sheetId 
    };
  } catch (error) {
    if (error.message.includes('already exists')) {
      return { exists: true };
    }
    throw error;
  }
}

// 시트 ID 가져오기
async function getSheetId(sheetName) {
  try {
    const sheets = getAuthClient();
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID_ORDERS
    });
    
    const sheet = spreadsheet.data.sheets.find(
      s => s.properties.title === sheetName
    );
    
    return sheet ? sheet.properties.sheetId : null;
  } catch (error) {
    console.error('시트 ID 가져오기 오류:', error);
    return null;
  }
}

// 마켓별 색상 적용
async function applyMarketColors(sheetName, marketColors) {
  try {
    const sheets = getAuthClient();
    const sheetId = await getSheetId(sheetName);
    
    if (!sheetId && sheetId !== 0) return;
    
    const requests = [];
    
    // 각 마켓별 색상 적용
    Object.entries(marketColors).forEach(([marketName, colorInfo]) => {
      if (colorInfo.rows && colorInfo.rows.length > 0) {
        const rgb = colorInfo.color.split(',').map(n => parseInt(n) / 255);
        
        colorInfo.rows.forEach(rowIndex => {
          requests.push({
            updateCells: {
              range: {
                sheetId: sheetId,
                startRowIndex: rowIndex,
                endRowIndex: rowIndex + 1,
                startColumnIndex: 0,  // 첫 번째 컬럼 (마켓명)
                endColumnIndex: 1
              },
              rows: [{
                values: [{
                  userEnteredFormat: {
                    backgroundColor: {
                      red: rgb[0],
                      green: rgb[1],
                      blue: rgb[2]
                    },
                    textFormat: {
                      foregroundColor: {
                        red: colorInfo.textColor === '#fff' ? 1 : 0,
                        green: colorInfo.textColor === '#fff' ? 1 : 0,
                        blue: colorInfo.textColor === '#fff' ? 1 : 0
                      },
                      bold: true
                    },
                    horizontalAlignment: 'CENTER'
                  }
                }]
              }],
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          });
        });
      }
    });
    
    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.SPREADSHEET_ID_ORDERS,
        requestBody: { requests }
      });
    }
    
    return true;
  } catch (error) {
    console.error('색상 적용 오류:', error);
    return false;
  }
}

// 중복 체크 및 병합 저장
async function mergeAndSaveOrderData(sheetName, newData, headers, marketMapping) {
  try {
    // 기존 데이터 읽기
    const existingData = await getOrderData(`${sheetName}!A:ZZ`);
    
    // 헤더 인덱스 찾기
    const orderNumberIdx = headers.indexOf('주문번호');
    const buyerIdx = headers.indexOf('주문자');
    const marketNameIdx = headers.indexOf('마켓명');
    
    // 기존 데이터를 Map으로 변환 (키: 주문번호_주문자)
    const existingMap = new Map();
    const marketColors = {};
    
    // 첫 행은 헤더이므로 스킵
    for (let i = 1; i < existingData.length; i++) {
      const row = existingData[i];
      if (row && row[orderNumberIdx] && row[buyerIdx]) {
        const key = `${row[orderNumberIdx]}_${row[buyerIdx]}`;
        existingMap.set(key, { row, index: i });
      }
    }
    
    // 새 데이터 처리
    const finalData = [headers];  // 헤더 추가
    const updatedKeys = new Set();
    
    // 새 데이터 처리 (중복 체크)
    newData.forEach(row => {
      const key = `${row[orderNumberIdx]}_${row[buyerIdx]}`;
      updatedKeys.add(key);
      finalData.push(row);
      
      // 마켓별 색상 정보 수집
      const marketName = row[marketNameIdx];
      if (marketName && marketMapping[marketName]) {
        if (!marketColors[marketName]) {
          marketColors[marketName] = {
            color: marketMapping[marketName].color,
            textColor: marketMapping[marketName].textColor,
            rows: []
          };
        }
        marketColors[marketName].rows.push(finalData.length - 1);
      }
    });
    
    // 기존 데이터 중 업데이트되지 않은 것들 추가
    existingMap.forEach((value, key) => {
      if (!updatedKeys.has(key)) {
        finalData.push(value.row);
        
        // 마켓별 색상 정보 수집
        const marketName = value.row[marketNameIdx];
        if (marketName && marketMapping[marketName]) {
          if (!marketColors[marketName]) {
            marketColors[marketName] = {
              color: marketMapping[marketName].color,
              textColor: marketMapping[marketName].textColor,
              rows: []
            };
          }
          marketColors[marketName].rows.push(finalData.length - 1);
        }
      }
    });
    
    // 전체 시트 클리어 후 새로 쓰기
    await clearOrderSheet(`${sheetName}!A:ZZ`);
    await saveOrderData(`${sheetName}!A1`, finalData);
    
    // 색상 적용
    await applyMarketColors(sheetName, marketColors);
    
    return {
      success: true,
      totalRows: finalData.length - 1,
      newRows: newData.length,
      existingRows: existingMap.size - updatedKeys.size
    };
    
  } catch (error) {
    console.error('병합 저장 오류:', error);
    throw error;
  }
}

// ========================================
// 상품 시트 함수들 (SPREADSHEET_ID_PRODUCTS 사용)
// ========================================
async function getProductData(range) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID_PRODUCTS,
      range: range
    });
    return response.data.values || [];
  } catch (error) {
    console.error('상품 시트 읽기 오류:', error);
    throw error;
  }
}

module.exports = {
  // 기본 시트 함수들
  getSheetData,
  updateSheetData,
  appendSheetData,
  clearSheet,
  createSheet,
  
  // 주문 시트 함수들
  getOrderData,
  saveOrderData,
  appendOrderData,
  clearOrderSheet,
  createOrderSheet,
  mergeAndSaveOrderData,
  applyMarketColors,
  
  // 상품 시트 함수들
  getProductData
};
