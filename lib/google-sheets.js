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
    // 시트가 이미 존재하는 경우 무시
    if (error.message.includes('already exists')) {
      return { exists: true };
    }
    throw error;
  }
}

module.exports = {
  getSheetData,
  updateSheetData,
  appendSheetData,
  clearSheet,
  createSheet
};