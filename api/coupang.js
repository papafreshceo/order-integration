// api/coupang.js

const crypto = require('crypto');
const { google } = require('googleapis');

// 쿠팡 API 설정
const COUPANG_CONFIG = {
    vendorId: process.env.COUPANG_VENDOR_ID,
    accessKey: process.env.COUPANG_ACCESS_KEY,
    secretKey: process.env.COUPANG_SECRET_KEY,
    baseUrl: 'https://api-gateway.coupang.com'
};

// HMAC 서명 생성
function generateHmac(method, path, secretKey, accessKey) {
    const datetime = new Date().toISOString().replace(/\.\d{3}/, '');
    const message = datetime + method + path;
    const signature = crypto
        .createHmac('sha256', secretKey)
        .update(message)
        .digest('hex');
    
    return {
        'Authorization': `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`,
        'Content-Type': 'application/json',
        'X-EXTENDED-TIMEOUT': '90000'
    };
}

// 쿠팡 주문 조회
async function getCoupangOrders(startDate, endDate) {
    const method = 'GET';
    const path = `/v2/providers/seller_api/apis/api/v4/vendors/${COUPANG_CONFIG.vendorId}/ordersheets`;
    const query = `?createdAtFrom=${startDate}&createdAtTo=${endDate}&status=ACCEPT`;
    
    const headers = generateHmac(method, path + query, COUPANG_CONFIG.secretKey, COUPANG_CONFIG.accessKey);
    
    try {
        const response = await fetch(COUPANG_CONFIG.baseUrl + path + query, {
            method: method,
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('쿠팡 API 오류:', error);
        throw error;
    }
}

// Google Sheets에 쿠팡 주문 저장
async function saveCoupangOrdersToSheets(orders) {
    try {
        // Google Sheets 인증
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
        const auth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );
        
        const sheets = google.sheets({ version: 'v4', auth });
        
        // 주문 데이터 변환
        const values = orders.map(order => [
            order.orderId,                    // 주문번호
            order.orderedAt,                   // 주문일시
            order.orderer.name,                // 주문자명
            order.orderer.email,               // 이메일
            order.orderer.phoneNumber,         // 전화번호
            order.receiver.name,               // 수령인
            order.receiver.phoneNumber,        // 수령인 전화
            order.receiver.addr1 + ' ' + order.receiver.addr2, // 주소
            order.orderItems[0]?.sellerProductName, // 상품명
            order.orderItems[0]?.quantity,     // 수량
            order.orderItems[0]?.orderPrice,   // 금액
            '쿠팡',                            // 판매채널
            order.shipmentBoxId,               // 송장번호
            'ACCEPT'                           // 상태
        ]);
        
        // Google Sheets에 추가
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SHEET_ID_WRITE,
            range: 'Orders!A:N',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: values
            }
        });
        
        return { success: true, count: orders.length };
    } catch (error) {
        console.error('Sheets 저장 오류:', error);
        throw error;
    }
}

// Vercel 서버리스 함수
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
        const { action, startDate, endDate } = req.body || req.query;
        
        if (action === 'fetch') {
            // 쿠팡 주문 조회
            const today = new Date().toISOString().split('T')[0];
            const start = startDate || today;
            const end = endDate || today;
            
            console.log('쿠팡 주문 조회:', start, '~', end);
            
            const coupangData = await getCoupangOrders(start, end);
            
            if (coupangData.data && coupangData.data.length > 0) {
                // Google Sheets에 저장
                const result = await saveCoupangOrdersToSheets(coupangData.data);
                
                res.status(200).json({
                    success: true,
                    message: `쿠팡 주문 ${result.count}건 동기화 완료`,
                    orders: coupangData.data
                });
            } else {
                res.status(200).json({
                    success: true,
                    message: '조회된 주문이 없습니다',
                    orders: []
                });
            }
        } else if (action === 'status') {
            // 주문 상태 업데이트
            const { orderId, status } = req.body;
            // 구현 예정
            res.status(200).json({ success: true, message: '상태 업데이트 예정' });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('API 오류:', error);
        res.status(500).json({ 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
