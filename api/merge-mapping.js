// api/merge-mapping.js - 매핑 관리 API (동적 매핑)

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
        const { action } = req.body || req.query || {};
        
        // 매핑 시트 ID (제공하신 ID 사용)
        const MAPPING_SHEET_ID = process.env.MAPPING_SHEET_ID || '1kLjYKemytOfaH6kSXD7dqdiolx3j09Ir-V9deEnNImA';
        
        // Google Service Account 확인
        if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
            console.error('GOOGLE_SERVICE_ACCOUNT 환경 변수가 없습니다');
            return res.status(500).json({
                success: false,
                error: 'Google 인증 정보가 설정되지 않았습니다'
            });
        }
        
        // Google Sheets 인증
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
        const auth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );
        
        const sheets = google.sheets({ version: 'v4', auth });
        
        switch (action) {
            case 'getMappings':
                try {
                    console.log('매핑 데이터 로드 시작, Sheet ID:', MAPPING_SHEET_ID);
                    
                    // Google Sheets에서 매핑 정보 가져오기
                    const response = await sheets.spreadsheets.values.get({
                        spreadsheetId: MAPPING_SHEET_ID,
                        range: '매핑!A:AZ'
                    });
                    
                    const data = response.data.values;
                    
                    if (!data || data.length < 3) {
                        console.error('매핑 시트에 데이터가 없습니다');
                        return res.status(200).json({
                            success: false,
                            error: '매핑 데이터가 없습니다'
                        });
                    }
                    
                    console.log(`매핑 데이터 로드 완료: ${data.length}행`);
                    
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
                        console.error('표준필드시작 마커를 찾을 수 없습니다');
                        return res.status(200).json({
                            success: false,
                            error: '표준필드시작 마커를 찾을 수 없습니다'
                        });
                    }
                    
                    // 표준필드 목록 생성
                    const standardFields = [];
                    for (let i = standardFieldsStartCol; i < markerRow.length; i++) {
                        const fieldName = String(markerRow[i] || '').trim();
                        if (fieldName === '') break;
                        standardFields.push(fieldName);
                    }
                    
                    console.log(`표준필드 ${standardFields.length}개 발견`);
                    
                    // 마켓별 매핑 정보
                    const markets = {};
                    const marketOrder = [];
                    
                    for (let i = 2; i < data.length; i++) {
                        const row = data[i];
                        if (!row || !row[0]) continue;
                        
                        const marketName = String(row[0]).trim();
                        
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
                    
                    console.log(`${marketOrder.length}개 마켓 매핑 로드 완료`);
                    
                    res.status(200).json({
                        success: true,
                        markets,
                        marketOrder,
                        standardFields
                    });
                    
                } catch (error) {
                    console.error('매핑 데이터 로드 오류:', error);
                    res.status(200).json({
                        success: false,
                        error: error.message || '매핑 데이터를 로드할 수 없습니다'
                    });
                }
                break;
                
            case 'updateMapping':
                // 매핑 업데이트 (구현 예정)
                const { marketName, fieldMappings } = req.body;
                
                res.status(200).json({
                    success: true,
                    message: '매핑이 업데이트되었습니다'
                });
                break;
                
            default:
                res.status(400).json({
                    success: false,
                    error: 'Invalid action'
                });
        }
        
    } catch (error) {
        console.error('매핑 API 오류:', error);
        res.status(200).json({
            success: false,
            error: error.message || '서버 오류가 발생했습니다'
        });
    }
};
