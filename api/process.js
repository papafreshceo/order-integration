const { getSheetData } = require('../lib/google-sheets');

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, headers, firstDataRow } = req.body;
    
    // 매핑 데이터 가져오기
    const mappingResponse = await fetch(`${process.env.VERCEL_URL || ''}/api/mapping`);
    const mappingData = await mappingResponse.json();
    
    if (mappingData.error) {
      return res.status(400).json({ error: mappingData.error });
    }
    
    // 마켓 감지
    const marketName = detectMarket(fileName, headers, firstDataRow, mappingData);
    
    if (!marketName) {
      return res.status(400).json({ 
        error: '마켓을 인식할 수 없습니다.' 
      });
    }
    
    return res.status(200).json({ 
      marketName,
      market: mappingData.markets[marketName]
    });
    
  } catch (error) {
    console.error('Process API 오류:', error);
    res.status(500).json({ 
      error: error.message || '서버 오류가 발생했습니다.' 
    });
  }
}

function detectMarket(fileName, headers, firstDataRow, mappingData) {
  try {
    const headerText = headers.join(' ').toLowerCase();
    
    // 파일명으로 먼저 체크
    for (const marketName in mappingData.markets) {
      const market = mappingData.markets[marketName];
      
      if (market.detectString1 && market.detectString1.length > 0) {
        if (fileName.toLowerCase().includes(market.detectString1.toLowerCase())) {
          return marketName;
        }
      }
    }
    
    // 헤더로 체크
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
          return marketName;
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
          return marketName;
        }
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('마켓 감지 오류:', error);
    return null;
  }
}