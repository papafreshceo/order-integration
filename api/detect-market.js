// api/detect-market.js
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

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
      return res.status(400).json({ error: '파일명과 헤더가 필요합니다.' });
    }
    
    // 매핑 데이터 가져오기
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '매핑!A1:ZZ1000',
    });
    
    const data = response.data.values || [];
    
    if (data.length < 3) {
      return res.status(400).json({ error: '매핑 데이터가 없습니다.' });
    }
    
    // 매핑 데이터 파싱
    const mappingData = parseMappingData(data);
    
    // 마켓 감지
    const fileNameLower = fileName.toLowerCase();
    const headerText = headers.join(' ').toLowerCase();
    
    // 파일명으로 먼저 체크 (detectString1)
    for (const marketName in mappingData.markets) {
      const market = mappingData.markets[marketName];
      
      if (market.detectString1 && market.detectString1.length > 0) {
        if (fileNameLower.includes(market.detectString1.toLowerCase())) {
          console.log(`${marketName} 감지: 파일명 매칭`);
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
          console.log(`${marketName} 감지: 헤더 매칭`);
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
          console.log(`${marketName} 감지: detectString3 매칭`);
          return res.status(200).json({ marketName });
        }
      }
    }
    
    // 마켓을 찾지 못한 경우
    res.status(200).json({ marketName: null });
    
  } catch (error) {
    console.error('마켓 감지 오류:', error);
    res.status(500).json({ error: error.toString() });
  }
}

// 매핑 데이터 파싱 함수
function parseMappingData(data) {
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
    return mappingData;
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
  
  return mappingData;
}
