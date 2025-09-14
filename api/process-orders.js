// api/process-orders.js
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
    const { files } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: '처리할 파일이 없습니다.' });
    }
    
    // Google Sheets API 설정
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
    const mappingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: '매핑!A1:ZZ100',
    });
    
    const mappingData = mappingResponse.data.values || [];
    
    // 표준필드 찾기
    const markerRow = mappingData[1] || [];
    let standardFieldsStartCol = -1;
    
    for (let i = 0; i < markerRow.length; i++) {
      if (String(markerRow[i]).trim() === '표준필드시작') {
        standardFieldsStartCol = i;
        break;
      }
    }
    
    const standardFields = [];
    for (let i = standardFieldsStartCol + 1; i < markerRow.length; i++) {
      const fieldName = String(markerRow[i] || '').trim();
      if (fieldName === '') break;
      standardFields.push(fieldName);
    }
    
    // 마켓별 매핑 정보 생성
    const marketMappings = {};
    for (let i = 2; i < mappingData.length; i++) {
      const row = mappingData[i];
      if (!row || row.length === 0) continue;
      
      const marketName = String(row[0] || '').trim();
      if (!marketName) continue;
      
      const mappings = {};
      for (let j = 0; j < standardFields.length; j++) {
        const standardField = standardFields[j];
        const colIndex = standardFieldsStartCol + 1 + j;
        const mappedField = String(row[colIndex] || '').trim();
        if (mappedField) {
          mappings[standardField] = mappedField;
        }
      }
      
      marketMappings[marketName] = {
        mappings,
        settlementFormula: String(row[6] || '').trim()
      };
    }
    
    // 모든 파일 데이터 통합
    const allRows = [];
    let totalProcessed = 0;
    
    for (const file of files) {
      const marketName = file.marketName;
      const marketMapping = marketMappings[marketName];
      
      if (!marketMapping) {
        console.error(`마켓 매핑 정보 없음: ${marketName}`);
        continue;
      }
      
      for (const row of file.data) {
        const processedRow = {
          '마켓명': marketName,
          '원본파일명': file.name
        };
        
        // 표준필드 매핑
        for (const standardField of standardFields) {
          const sourceField = marketMapping.mappings[standardField];
          if (sourceField && row[sourceField] !== undefined) {
            processedRow[standardField] = row[sourceField];
          } else {
            processedRow[standardField] = '';
          }
        }
        
        // 정산금액 계산
        if (marketMapping.settlementFormula) {
          try {
            const formula = marketMapping.settlementFormula
              .replace(/판매가/g, parseFloat(processedRow['판매가'] || 0))
              .replace(/수수료/g, parseFloat(processedRow['수수료'] || 0))
              .replace(/배송비/g, parseFloat(processedRow['배송비'] || 0))
              .replace(/수량/g, parseFloat(processedRow['수량'] || 1));
            
            processedRow['정산금액'] = eval(formula);
          } catch (e) {
            processedRow['정산금액'] = 0;
          }
        }
        
        allRows.push(processedRow);
        totalProcessed++;
      }
    }
    
    // 통계 생성
    const statistics = {
      total: { count: 0, quantity: 0, amount: 0 },
      byMarket: {},
      byOption: {}
    };
    
    for (const row of allRows) {
      const quantity = parseFloat(row['수량'] || 1);
      const amount = parseFloat(row['정산금액'] || 0);
      const market = row['마켓명'];
      const option = row['옵션'] || '(옵션 없음)';
      
      // 전체 통계
      statistics.total.count++;
      statistics.total.quantity += quantity;
      statistics.total.amount += amount;
      
      // 마켓별 통계
      if (!statistics.byMarket[market]) {
        statistics.byMarket[market] = { count: 0, quantity: 0, amount: 0 };
      }
      statistics.byMarket[market].count++;
      statistics.byMarket[market].quantity += quantity;
      statistics.byMarket[market].amount += amount;
      
      // 옵션별 통계
      if (!statistics.byOption[option]) {
        statistics.byOption[option] = { count: 0, quantity: 0, amount: 0 };
      }
      statistics.byOption[option].count++;
      statistics.byOption[option].quantity += quantity;
      statistics.byOption[option].amount += amount;
    }
    
    console.log(`주문 처리 완료: ${totalProcessed}개`);
    
    res.status(200).json({
      success: true,
      processedCount: totalProcessed,
      data: allRows,
      standardFields: ['마켓명', '원본파일명', ...standardFields],
      statistics
    });
    
  } catch (error) {
    console.error('주문 처리 오류:', error);
    res.status(500).json({ 
      error: error.message || error.toString(),
      message: '주문 처리 중 오류가 발생했습니다.'
    });
  }
}
