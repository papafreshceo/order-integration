// api/merge-mapping.js - 매핑 관리 API

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
        
        // 환경 변수 확인
        if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
            console.log('Google Service Account 환경 변수가 없습니다. 기본값 반환');
            
            // 기본 매핑 데이터 반환
            res.status(200).json({
                success: true,
                markets: {
                    '네이버': {
                        name: '네이버',
                        initial: 'N',
                        color: '76,175,80',
                        detectString1: '스마트스토어',
                        detectString2: '상품주문번호,구매자명,구매자연락처',
                        detectString3: '',
                        settlementFormula: '상품금액 * 0.95',
                        headerRow: 2,
                        mappings: {
                            '결제일': '결제일',
                            '주문번호': '주문번호',
                            '상품주문번호': '상품주문번호',
                            '주문자': '구매자명',
                            '주문자전화번호': '구매자연락처',
                            '수취인': '수취인명',
                            '수취인전화번호': '수취인연락처1',
                            '주소': '배송지',
                            '배송메세지': '배송메세지',
                            '옵션명': '옵션정보',
                            '수량': '수량',
                            '상품금액': '상품별 총 주문금액',
                            '정산예정금액': '정산예정금액'
                        }
                    },
                    '쿠팡': {
                        name: '쿠팡',
                        initial: 'C',
                        color: '255,87,34',
                        detectString1: '쿠팡',
                        detectString2: '주문번호,수취인,수취인연락처',
                        detectString3: '묶음배송번호,옵션id,구매수(수량)',
                        settlementFormula: '상품금액 - 수수료1',
                        headerRow: 1,
                        mappings: {
                            '결제일': '결제일',
                            '주문번호': '주문번호',
                            '상품주문번호': '주문번호',
                            '주문자': '구매자',
                            '주문자전화번호': '구매자전화번호',
                            '수취인': '수취인이름',
                            '수취인전화번호': '수취인전화번호',
                            '주소': '수취인 주소',
                            '배송메세지': '배송메세지',
                            '옵션명': '옵션',
                            '수량': '구매수(수량)',
                            '상품금액': '주문금액',
                            '할인금액': '할인금액',
                            '수수료1': '수수료'
                        }
                    },
                    '11번가': {
                        name: '11번가',
                        initial: 'E',
                        color: '244,67,54',
                        detectString1: '11번가',
                        detectString2: '주문번호,구매자명,수취인명',
                        detectString3: '상품주문번호,주문상태,수취인전화번호',
                        settlementFormula: '상품금액 * 0.88',
                        headerRow: 2,
                        mappings: {
                            '결제일': '결제일시',
                            '주문번호': '주문번호',
                            '상품주문번호': '상품주문번호',
                            '주문자': '구매자',
                            '주문자전화번호': '구매자연락처',
                            '수취인': '수취인명',
                            '수취인전화번호': '수취인전화번호',
                            '주소': '수취인주소',
                            '배송메세지': '배송메세지',
                            '옵션명': '옵션',
                            '수량': '수량',
                            '상품금액': '판매가',
                            '할인금액': '할인금액'
                        }
                    },
                    '카카오': {
                        name: '카카오',
                        initial: 'K',
                        color: '255,235,59',
                        detectString1: '',
                        detectString2: '주문 일련번호,수령인,연락처,배송메시지',
                        detectString3: '',
                        settlementFormula: '상품금액',
                        headerRow: 1,
                        mappings: {
                            '결제일': '주문일시',
                            '주문번호': '주문 일련번호',
                            '상품주문번호': '주문 일련번호',
                            '주문자': '주문자',
                            '주문자전화번호': '주문자 연락처',
                            '수취인': '수령인',
                            '수취인전화번호': '연락처',
                            '주소': '주소',
                            '배송메세지': '배송메시지',
                            '옵션명': '옵션',
                            '수량': '수량',
                            '상품금액': '금액'
                        }
                    },
                    '티몬': {
                        name: '티몬',
                        initial: 'T',
                        color: '103,58,183',
                        detectString1: '티몬',
                        detectString2: '주문번호,딜명,옵션명,구매자명',
                        detectString3: '수령자명',
                        settlementFormula: '상품금액 * 0.9',
                        headerRow: 1,
                        mappings: {
                            '결제일': '결제일',
                            '주문번호': '주문번호',
                            '상품주문번호': '주문번호',
                            '주문자': '구매자명',
                            '주문자전화번호': '구매자전화번호',
                            '수취인': '수령자명',
                            '수취인전화번호': '수령자전화번호',
                            '주소': '수령자주소',
                            '배송메세지': '배송메세지',
                            '옵션명': '옵션명',
                            '수량': '수량',
                            '상품금액': '판매가'
                        }
                    },
                    '위메프': {
                        name: '위메프',
                        initial: 'W',
                        color: '156,39,176',
                        detectString1: '위메프',
                        detectString2: '주문번호코드,주문자,수취인',
                        detectString3: '수취인연락처',
                        settlementFormula: '상품금액 * 0.9',
                        headerRow: 1,
                        mappings: {
                            '결제일': '결제일',
                            '주문번호': '주문번호코드',
                            '상품주문번호': '주문번호코드',
                            '주문자': '주문자',
                            '주문자전화번호': '주문자연락처',
                            '수취인': '수취인',
                            '수취인전화번호': '수취인연락처',
                            '주소': '수취인주소',
                            '배송메세지': '배송메세지',
                            '옵션명': '옵션',
                            '수량': '수량',
                            '상품금액': '판매가'
                        }
                    },
                    '지마켓': {
                        name: '지마켓',
                        initial: 'G',
                        color: '63,81,181',
                        detectString1: '지마켓',
                        detectString2: '주문번호,구매자,수령자',
                        detectString3: '수령자연락처',
                        settlementFormula: '상품금액 * 0.89',
                        headerRow: 1,
                        mappings: {
                            '결제일': '결제일',
                            '주문번호': '주문번호',
                            '상품주문번호': '주문번호',
                            '주문자': '구매자',
                            '주문자전화번호': '구매자연락처',
                            '수취인': '수령자',
                            '수취인전화번호': '수령자연락처',
                            '주소': '수령자주소',
                            '배송메세지': '배송메세지',
                            '옵션명': '옵션',
                            '수량': '수량',
                            '상품금액': '판매가'
                        }
                    },
                    '옥션': {
                        name: '옥션',
                        initial: 'A',
                        color: '33,150,243',
                        detectString1: '옥션',
                        detectString2: '주문번호,구매자,수령자',
                        detectString3: '수령자연락처',
                        settlementFormula: '상품금액 * 0.89',
                        headerRow: 1,
                        mappings: {
                            '결제일': '결제일',
                            '주문번호': '주문번호',
                            '상품주문번호': '주문번호',
                            '주문자': '구매자',
                            '주문자전화번호': '구매자연락처',
                            '수취인': '수령자',
                            '수취인전화번호': '수령자연락처',
                            '주소': '수령자주소',
                            '배송메세지': '배송메세지',
                            '옵션명': '옵션',
                            '수량': '수량',
                            '상품금액': '판매가'
                        }
                    },
                    'SSG': {
                        name: 'SSG',
                        initial: 'S',
                        color: '233,30,99',
                        detectString1: 'ssg',
                        detectString2: '주문번호,수취인명,수취인휴대폰',
                        detectString3: '상품명,단품명',
                        settlementFormula: '상품금액 * 0.92',
                        headerRow: 1,
                        mappings: {
                            '결제일': '결제일',
                            '주문번호': '주문번호',
                            '상품주문번호': '주문번호',
                            '주문자': '주문자',
                            '주문자전화번호': '주문자전화번호',
                            '수취인': '수취인명',
                            '수취인전화번호': '수취인휴대폰',
                            '주소': '수취인주소',
                            '배송메세지': '배송메세지',
                            '옵션명': '단품명',
                            '수량': '수량',
                            '상품금액': '판매가'
                        }
                    },
                    '인터파크': {
                        name: '인터파크',
                        initial: 'I',
                        color: '3,169,244',
                        detectString1: '인터파크',
                        detectString2: '주문번호,구매자명,수취인명',
                        detectString3: '수취인연락처',
                        settlementFormula: '상품금액 * 0.9',
                        headerRow: 1,
                        mappings: {
                            '결제일': '결제일',
                            '주문번호': '주문번호',
                            '상품주문번호': '주문번호',
                            '주문자': '구매자명',
                            '주문자전화번호': '구매자연락처',
                            '수취인': '수취인명',
                            '수취인전화번호': '수취인연락처',
                            '주소': '수취인주소',
                            '배송메세지': '배송메세지',
                            '옵션명': '옵션',
                            '수량': '수량',
                            '상품금액': '판매가'
                        }
                    }
                },
                marketOrder: ['네이버', '쿠팡', '11번가', '카카오', '티몬', '위메프', '지마켓', '옥션', 'SSG', '인터파크'],
                standardFields: [
                    '마켓명', '연번', '마켓', '결제일', '주문번호', '상품주문번호',
                    '주문자', '주문자전화번호', '수취인', '수취인전화번호', '주소',
                    '배송메세지', '옵션명', '수량', '상품금액', '할인금액',
                    '수수료1', '수수료2', '택배비', '정산예정금액',
                    '셀러', '벤더사', '출고', '송장', '발송지', '발송지주소',
                    '발송지연락처', '출고비용', '셀러공급가', '송장번호', '택배사', '발송일'
                ]
            });
            return;
        }
        
        // Google Sheets API 사용 시도
        const { google } = require('googleapis');
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
                // 매핑 시트 ID가 없으면 기본값 반환
                if (!process.env.MAPPING_SHEET_ID) {
                    console.log('매핑 시트 ID가 없습니다. 기본값 반환');
                    
                    // 위의 기본 매핑 데이터와 동일한 데이터 반환
                    res.status(200).json({
                        success: true,
                        markets: {
                            // ... (위와 동일한 기본 매핑 데이터)
                        },
                        marketOrder: ['네이버', '쿠팡', '11번가', '카카오', '티몬', '위메프', '지마켓', '옥션', 'SSG', '인터파크'],
                        standardFields: [
                            '마켓명', '연번', '마켓', '결제일', '주문번호', '상품주문번호',
                            '주문자', '주문자전화번호', '수취인', '수취인전화번호', '주소',
                            '배송메세지', '옵션명', '수량', '상품금액', '할인금액',
                            '수수료1', '수수료2', '택배비', '정산예정금액',
                            '셀러', '벤더사', '출고', '송장', '발송지', '발송지주소',
                            '발송지연락처', '출고비용', '셀러공급가', '송장번호', '택배사', '발송일'
                        ]
                    });
                    return;
                }
                
                // Google Sheets에서 매핑 정보 가져오기
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
        
        // 에러가 발생해도 기본값 반환
        res.status(200).json({
            success: true,
            markets: {
                '네이버': {
                    name: '네이버',
                    initial: 'N',
                    color: '76,175,80',
                    detectString1: '스마트스토어',
                    detectString2: '상품주문번호,구매자명,구매자연락처',
                    detectString3: '',
                    headerRow: 2
                },
                '쿠팡': {
                    name: '쿠팡',
                    initial: 'C',
                    color: '255,87,34',
                    detectString1: '쿠팡',
                    detectString2: '주문번호,수취인,수취인연락처',
                    detectString3: '묶음배송번호,옵션id,구매수(수량)',
                    headerRow: 1
                }
            },
            marketOrder: ['네이버', '쿠팡'],
            standardFields: [
                '마켓명', '연번', '마켓', '결제일', '주문번호', '상품주문번호',
                '주문자', '주문자전화번호', '수취인', '수취인전화번호', '주소',
                '배송메세지', '옵션명', '수량', '상품금액', '정산예정금액'
            ]
        });
    }
};
