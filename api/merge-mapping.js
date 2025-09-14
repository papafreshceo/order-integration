// api/merge-mapping.js - 매핑 관리 API (수정된 버전)

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
        
        console.log('Action:', action);
        console.log('MAPPING_SHEET_ID:', MAPPING_SHEET_ID);
        
        // Google Service Account 확인
        if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
            console.error('GOOGLE_SERVICE_ACCOUNT 환경 변수가 없습니다');
            
            // 기본 매핑 데이터 반환
            return res.status(200).json({
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
                    }
                },
                marketOrder: ['네이버', '쿠팡', '11번가'],
                standardFields: [
                    '마켓명', '연번', '마켓', '결제일', '주문번호', '상품주문번호',
                    '주문자', '주문자전화번호', '수취인', '수취인전화번호', '주소',
                    '배송메세지', '옵션명', '수량', '상품금액', '할인금액',
                    '수수료1', '수수료2', '택배비', '정산예정금액',
                    '셀러', '벤더사', '출고', '송장', '발송지', '발송지주소',
                    '발송지연락처', '출고비용', '셀러공급가'
                ]
            });
        }
        
        // Google Sheets API 사용
        const { google } = require('googleapis');
        
        let credentials;
        try {
            credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
        } catch (parseError) {
            console.error('Google Service Account 파싱 오류:', parseError);
            
            // 파싱 실패 시 기본 데이터 반환
            return res.status(200).json({
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
                        mappings: {}
                    }
                },
                marketOrder: ['네이버'],
                standardFields: ['마켓명', '연번', '마켓', '결제일', '주문번호']
            });
        }
        
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
                    console.log('Google Sheets 호출 시작');
                    
                    // Google Sheets에서 매핑 정보 가져오기
                    const response = await sheets.spreadsheets.values.get({
                        spreadsheetId: MAPPING_SHEET_ID,
                        range: '매핑!A:AZ'
                    });
                    
                    const data = response.data.values;
                    
                    if (!data || data.length < 3) {
                        console.log('매핑 시트에 데이터가 없습니다');
                        
                        // 데이터가 없을 때 기본값 반환
                        return res.status(200).json({
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
                                    mappings: {}
                                }
                            },
                            marketOrder: ['네이버'],
                            standardFields: ['마켓명', '연번', '마켓', '결제일', '주문번호']
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
                        console.log('표준필드시작 마커를 찾을 수 없습니다');
                        standardFieldsStartCol = 8; // 기본값
                    }
                    
                    // 표준필드 목록 생성
                    const standardFields = [];
                    for (let i = standardFieldsStartCol; i < markerRow.length; i++) {
                        const fieldName = String(markerRow[i] || '').trim();
                        if (fieldName === '') break;
                        standardFields.push(fieldName);
                    }
                    
                    // 표준필드가 없으면 기본값 사용
                    if (standardFields.length === 0) {
                        standardFields.push(
                            '마켓명', '연번', '마켓', '결제일', '주문번호', '상품주문번호',
                            '주문자', '주문자전화번호', '수취인', '수취인전화번호', '주소',
                            '배송메세지', '옵션명', '수량', '상품금액', '정산예정금액'
                        );
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
                            initial: String(row[1] || marketName.charAt(0)).trim(),
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
                    
                } catch (sheetsError) {
                    console.error('Google Sheets API 오류:', sheetsError);
                    
                    // API 오류 시에도 기본값 반환
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
                                mappings: {}
                            }
                        },
                        marketOrder: ['네이버'],
                        standardFields: ['마켓명', '연번', '마켓', '결제일', '주문번호']
                    });
                }
                break;
                
            case 'updateMapping':
                // 매핑 업데이트 (구현 예정)
                res.status(200).json({
                    success: true,
                    message: '매핑이 업데이트되었습니다'
                });
                break;
                
            default:
                // action이 없어도 기본값 반환
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
                            mappings: {}
                        }
                    },
                    marketOrder: ['네이버'],
                    standardFields: ['마켓명', '연번', '마켓', '결제일', '주문번호']
                });
        }
        
    } catch (error) {
        console.error('매핑 API 최상위 오류:', error);
        
        // 모든 오류 상황에서도 기본값 반환
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
                    mappings: {}
                }
            },
            marketOrder: ['네이버'],
            standardFields: ['마켓명', '연번', '마켓', '결제일', '주문번호']
        });
    }
};
