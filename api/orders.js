const { google } = require('googleapis');

module.exports = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']  // 읽기+쓰기 권한
    );
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    if (req.method === 'GET') {
      // 읽기용 시트에서 데이터 가져오기
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID_READ,
        range: 'A:Z',
      });
      
      res.status(200).json({ 
        source: "읽기 시트",
        data: response.data.values
      });
    }
    
    if (req.method === 'POST') {
      // 쓰기용 시트에 데이터 추가
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID_WRITE,
        range: 'A:Z',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [req.body.values]
        }
      });
      
      res.status(200).json({ 
        target: "쓰기 시트",
        result: "저장 완료"
      });
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
