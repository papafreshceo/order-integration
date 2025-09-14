// api/mapping-data.js
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const spreadsheetId = process.env.SPREADSHEET_ID || '1kLjYKemytOfaH6kSXD7dqdiolx3j09Ir-V9deEnNImA';
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
    
    if (mappingData.standardFields.length === 0) {
      return res.status(400).json({ error: '표준필드가 정의되지 않았습니다.' });
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
      
      // 필드 매핑 정보 (표준필드시작 마커 다음 열부터)
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
    
    console.log('매핑 데이터 로드 완료:', {
      markets: Object.keys(mappingData.markets).length,
      standardFields: mappingData.standardFields.length
    });
    
    res.status(200).json(mappingData);
    
  } catch (error) {
    console.error('매핑 데이터 로드 오류:', error);
    res.status(500).json({ 
      error: error.toString(),
      message: '매핑 데이터를 불러오는 중 오류가 발생했습니다.'
    });
  }
}
