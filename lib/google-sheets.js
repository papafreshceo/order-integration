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
    throw error;
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
    return response.data;
  } catch (error) {
    if (error.message.includes('already exists')) {
      return { exists: true };
    }
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

async function updateProductData(range, values) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID_PRODUCTS,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });
    return response.data;
  } catch (error) {
    console.error('상품 시트 쓰기 오류:', error);
    throw error;
  }
}

async function appendProductData(range, values) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID_PRODUCTS,
      range: range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values }
    });
    return response.data;
  } catch (error) {
    console.error('상품 시트 추가 오류:', error);
    throw error;
  }
}

async function clearProductSheet(range) {
  try {
    const sheets = getAuthClient();
    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.SPREADSHEET_ID_PRODUCTS,
      range: range
    });
    return true;
  } catch (error) {
    console.error('상품 시트 클리어 오류:', error);
    throw error;
  }
}

async function createProductSheet(title) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.SPREADSHEET_ID_PRODUCTS,
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
// 범용 함수 (특정 시트 ID 지정 가능)
// ========================================
async function getDataFromSheet(range, spreadsheetId) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range
    });
    return response.data.values || [];
  } catch (error) {
    console.error('시트 읽기 오류:', error);
    throw error;
  }
}

async function updateDataInSheet(range, values, spreadsheetId) {
  try {
    const sheets = getAuthClient();
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
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
  
  // 상품 시트 함수들
  getProductData,
  updateProductData,
  appendProductData,
  clearProductSheet,
  createProductSheet,
  
  // 범용 함수들
  getDataFromSheet,
  updateDataInSheet
};
