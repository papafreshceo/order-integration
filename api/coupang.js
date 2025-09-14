// api/coupang.js - 쿠팡 API (수정 버전)

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
        // GET 요청 처리 (action=fetch)
        if (req.method === 'GET') {
            const { action } = req.query;
            
            if (action === 'fetch') {
                // 쿠팡 API 없이 더미 데이터 반환
                const dummyOrders = {
                    success: true,
                    orders: []  // 빈 배열 반환
                };
                
                res.status(200).json(dummyOrders);
                return;
            }
        }
        
        // POST 요청 처리
        if (req.method === 'POST') {
            const { action, startDate, endDate } = req.body || {};
            
            if (action === 'fetch') {
                // 실제 쿠팡 API 연동이 필요한 경우 여기에 구현
                // 현재는 Google Sheets에서 쿠팡 주문 데이터를 읽어옴
                try {
                    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}');
                    
                    // 인증 정보가 없으면 빈 데이터 반환
                    if (!credentials.client_email) {
                        res.status(200).json({
                            success: true,
                            orders: [],
                            message: '쿠팡 연동 설정이 필요합니다'
                        });
                        return;
                    }
                    
                    const auth = new google.auth.JWT(
                        credentials.client_email,
                        null,
                        credentials.private_key,
                        ['https://www.googleapis.com/auth/spreadsheets.readonly']
                    );
                    
                    const sheets = google.sheets({ version: 'v4', auth });
                    
                    // 쿠팡 주문 시트에서 데이터 읽기 (있다면)
                    const sheetId = process.env.COUPANG_SHEET_ID || process.env.SHEET_ID_READ;
                    
                    if (!sheetId) {
                        res.status(200).json({
                            success: true,
                            orders: [],
                            message: '쿠팡 시트 ID가 설정되지 않았습니다'
                        });
                        return;
                    }
                    
                    const response = await sheets.spreadsheets.values.get({
                        spreadsheetId: sheetId,
                        range: '쿠팡주문!A:Z'
                    });
                    
                    const rows = response.data.values || [];
                    
                    if (rows.length > 1) {
                        // 헤더와 데이터 분리
                        const headers = rows[0];
                        const dataRows = rows.slice(1);
                        
                        // 객체 배열로 변환
                        const orders = dataRows.map(row => {
                            const order = {};
                            headers.forEach((header, index) => {
                                order[header] = row[index] || '';
                            });
                            return order;
                        });
                        
                        res.status(200).json({
                            success: true,
                            orders: orders,
                            message: `${orders.length}건의 쿠팡 주문을 가져왔습니다`
                        });
                    } else {
                        res.status(200).json({
                            success: true,
                            orders: [],
                            message: '쿠팡 주문이 없습니다'
                        });
                    }
                    
                } catch (error) {
                    console.error('Google Sheets 읽기 오류:', error);
                    
                    // 에러가 발생해도 빈 데이터 반환
                    res.status(200).json({
                        success: true,
                        orders: [],
                        message: 'Sheets 연결 오류'
                    });
                }
                
                return;
            }
            
            if (action === 'status') {
                // 주문 상태 업데이트 (구현 예정)
                res.status(200).json({
                    success: true,
                    message: '상태 업데이트 기능 준비 중'
                });
                return;
            }
        }
        
        // 기본 응답
        res.status(200).json({
            success: true,
            orders: [],
            message: '쿠팡 API 연동 준비 중'
        });
        
    } catch (error) {
        console.error('쿠팡 API 오류:', error);
        
        // 에러가 발생해도 200 상태로 빈 데이터 반환
        res.status(200).json({
            success: true,
            orders: [],
            error: error.message,
            message: '쿠팡 데이터를 가져올 수 없습니다'
        });
    }
};
