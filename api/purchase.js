import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
    credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

// 스프레드시트 ID 정의
const SPREADSHEET_IDS = {
    PURCHASE: '1a55b0APC5LlmgXhh-Lw4O-7V_gLT_9luDqfvkkesof0',
    PRODUCTS: '17MGwbu1DZf5yg-BLhfZr-DO-OPiau3aeyBMtSssv7Sg'
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { action, range, data, values, spreadsheetId } = req.body;

        switch (action) {
            // 구매관리 데이터 조회
            case 'getPurchaseData': {
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId: SPREADSHEET_IDS.PURCHASE,
                    range: range || '구매관리!A:Q',
                });
                
                return res.status(200).json({
                    success: true,
                    data: response.data.values || []
                });
            }

            // 구매관리 데이터 업데이트
            case 'updatePurchaseData': {
                const updateRange = range || '구매관리!A2:Q';
                
                // 빈 행 제거
                const filteredData = data.filter(row => 
                    row && row.some(cell => cell !== undefined && cell !== null && cell !== '')
                );
                
                // 시트 클리어
                await sheets.spreadsheets.values.clear({
                    spreadsheetId: SPREADSHEET_IDS.PURCHASE,
                    range: updateRange,
                });
                
                // 데이터 쓰기
                if (filteredData.length > 0) {
                    const response = await sheets.spreadsheets.values.update({
                        spreadsheetId: SPREADSHEET_IDS.PURCHASE,
                        range: updateRange,
                        valueInputOption: 'USER_ENTERED',
                        resource: {
                            values: filteredData
                        }
                    });
                    
                    return res.status(200).json({
                        success: true,
                        updatedCells: response.data.updatedCells
                    });
                }
                
                return res.status(200).json({
                    success: true,
                    updatedCells: 0
                });
            }

            // 거래처관리 데이터 조회
            case 'getVendors': {
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId: SPREADSHEET_IDS.PRODUCTS,
                    range: '거래처관리!A:P',
                });
                
                return res.status(200).json({
                    success: true,
                    data: response.data.values || []
                });
            }

            // 거래처 추가
            case 'addVendor': {
                const response = await sheets.spreadsheets.values.append({
                    spreadsheetId: SPREADSHEET_IDS.PRODUCTS,
                    range: '거래처관리!A:P',
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'INSERT_ROWS',
                    resource: {
                        values: values
                    }
                });
                
                return res.status(200).json({
                    success: true,
                    updatedRange: response.data.updates?.updatedRange
                });
            }

            // 결제 정보 업데이트 (특정 행만 업데이트)
            case 'updatePayment': {
                const { rowIndex, paymentAmount, paymentDate, sheetName } = req.body;
                
                // 먼저 현재 데이터 가져오기
                const getResponse = await sheets.spreadsheets.values.get({
                    spreadsheetId: SPREADSHEET_IDS.PURCHASE,
                    range: `${sheetName}!A${rowIndex + 2}:Q${rowIndex + 2}` // 헤더 고려 +2
                });
                
                const currentRow = getResponse.data.values?.[0] || [];
                
                // 결제금액과 결제일 업데이트 (열 인덱스 15, 16)
                currentRow[15] = paymentAmount;
                currentRow[16] = paymentDate;
                
                // 업데이트
                const updateResponse = await sheets.spreadsheets.values.update({
                    spreadsheetId: SPREADSHEET_IDS.PURCHASE,
                    range: `${sheetName}!A${rowIndex + 2}:Q${rowIndex + 2}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [currentRow]
                    }
                });
                
                return res.status(200).json({
                    success: true,
                    updatedCells: updateResponse.data.updatedCells
                });
            }

            default:
                return res.status(400).json({
                    success: false,
                    error: `지원하지 않는 액션: ${action}`
                });
        }
    } catch (error) {
        console.error('구매관리 API 오류:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}