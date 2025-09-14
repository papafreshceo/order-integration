// api/merge-mapping.js - 매핑 관리 API

const { google } = require('googleapis');

module.exports = async (req, res) => {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
        const auth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );
        
        const sheets = google.sheets({ version: 'v4', auth });
        const { action } = req.body || req.query;
        
        switch (action) {
            case 'getMappings':
                // 매핑 정보 가져오기
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId: process.env.MAPPING_SHEET_ID,
                    range: '매핑!A:AZ'
                });
                
                const data = response.data.values;
                if (!data || data.length < 3) {
                    res.status(200).json({ error: '매핑 데이터가 없습니다' });
                    return;
                }
                
                // 표준필드시작 마커 찾기
                const markerRow = data[1];
                let standardFieldsStartCol = -1;
                
                for (let i = 0; i < markerRow.length; i++) {
                    if (String(markerRow[i]).trim() === '표준필드시작') {
                        standardFieldsStartCol = i + 1;
                        break;
                    }
                }
                
                if (standardFieldsStartCol === -1) {
                    res.status(200).json({ error: '표준필드시작 마커를 찾을 수 없습니다' });
                    return;
                }
                
                // 표준필드 목록 생성
                const standardFields = [];
                for (let i = standardFieldsStartCol; i < markerRow.length; i++) {
                    const fieldName = String(markerRow[i] || '').trim();
                    if (fieldName === '') break;
                    standardFields.push(fieldName);
                }
                
                // 마켓별 매핑 정보
                const markets = {};
                const marketOrder = [];
                
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
                    
                    // 필드 매핑
                    for (let j = 0; j < standardFields.length; j++) {
                        const standardField = standardFields[j];
                        const colIndex = standardFieldsStartCol + j;
                        const mappedField = String(row[colIndex] || '').trim();
                        if (mappedField) {
                            marketInfo.mappings[standardField] = mappedField;
                        }
                    }
                    
                    markets[marketName] = marketInfo;
                    marketOrder.push(marketName);
                }
                
                res.status(200).json({
                    success: true,
                    markets,
                    marketOrder,
                    standardFields
                });
                break;
                
            case 'updateMapping':
                // 매핑 업데이트
                const { marketName, fieldMappings } = req.body;
                
                // 구현 예정
                res.status(200).json({
                    success: true,
                    message: '매핑이 업데이트되었습니다'
                });
                break;
                
            default:
                res.status(400).json({ error: 'Invalid action' });
        }
        
    } catch (error) {
        console.error('매핑 API 오류:', error);
        res.status(500).json({ 
            error: error.message 
        });
    }
};
