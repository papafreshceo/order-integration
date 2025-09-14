// api/detect-market.js
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, headers } = req.body;
    
    if (!fileName || !headers) {
      return res.status(400).json({ error: 'fileName과 headers가 필요합니다.' });
    }
    
    // 먼저 mapping-data를 가져옴
    const { google } = await import('googleapis');
    
    const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1kLjYKemytOfaH6kSXD7dqdiolx3j09Ir-V9deEnNImA';
    
    if (!CLIENT_EMAIL || !PRIVATE_KEY) {
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: CLIENT_EMAIL,
        private_key: PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // 매핑 데이터 가져오기
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: '매핑!A1:H100',
    });
    
    const data = response.data.values || [];
    
    // 헤더 문자열 생성
    const headerString = headers.join(' ').toLowerCase();
    const fileNameLower = fileName.toLowerCase();
    
    // 마켓 감지 로직
    let detectedMarket = null;
    
    // 3행부터 마켓 정보 확인
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const marketName = String(row[0] || '').trim();
      const detectString1 = String(row[3] || '').trim().toLowerCase();
      const detectString2 = String(row[4] || '').trim().toLowerCase();
      const detectString3 = String(row[5] || '').trim().toLowerCase();
      
      if (!marketName) continue;
      
      // 감지 문자열 확인
      let matched = false;
      
      // 파일명에서 확인
      if (detectString1 && fileNameLower.includes(detectString1)) matched = true;
      if (detectString2 && fileNameLower.includes(detectString2)) matched = true;
      if (detectString3 && fileNameLower.includes(detectString3)) matched = true;
      
      // 헤더에서 확인
      if (detectString1 && headerString.includes(detectString1)) matched = true;
      if (detectString2 && headerString.includes(detectString2)) matched = true;
      if (detectString3 && headerString.includes(detectString3)) matched = true;
      
      if (matched) {
        detectedMarket = marketName;
        break;
      }
    }
    
    // 특수 케이스: 스마트스토어
    if (!detectedMarket) {
      if (fileNameLower.includes('naver') || fileNameLower.includes('스마트스토어')) {
        detectedMarket = '스마트스토어';
      } else if (fileNameLower.includes('coupang') || fileNameLower.includes('쿠팡')) {
        detectedMarket = '쿠팡';
      } else if (fileNameLower.includes('gmarket') || fileNameLower.includes('지마켓')) {
        detectedMarket = '지마켓';
      } else if (fileNameLower.includes('auction') || fileNameLower.includes('옥션')) {
        detectedMarket = '옥션';
      } else if (fileNameLower.includes('11st') || fileNameLower.includes('11번가')) {
        detectedMarket = '11번가';
      }
    }
    
    console.log('마켓 감지 결과:', detectedMarket);
    
    res.status(200).json({ 
      success: true,
      marketName: detectedMarket,
      fileName: fileName
    });
    
  } catch (error) {
    console.error('마켓 감지 오류:', error);
    res.status(500).json({ 
      error: error.message || error.toString(),
      message: '마켓 감지 중 오류가 발생했습니다.'
    });
  }
}
