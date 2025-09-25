import { google } from 'googleapis';

// 환경 변수 로깅 (디버깅용)
console.log('Environment check:', {
    has_project_id: !!process.env.GOOGLE_PROJECT_ID,
    has_private_key_id: !!process.env.GOOGLE_PRIVATE_KEY_ID,
    has_private_key: !!process.env.GOOGLE_PRIVATE_KEY,
    has_client_email: !!process.env.GOOGLE_CLIENT_EMAIL,
    has_client_id: !!process.env.GOOGLE_CLIENT_ID,
    client_email_value: process.env.GOOGLE_CLIENT_EMAIL // 실제 값 확인
});

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
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL || '')}`
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

// 스프레드시트 ID 정의
const SPREADSHEET_IDS = {
    PURCHASE: process.env.SPREADSHEET_ID_PURCHASE || '1a55b0APC5LlmgXhh-Lw4O-7V_gLT_9luDqfvkkesof0',
    PRODUCTS: process.env.SPREADSHEET_ID_PRODUCTS || '17MGwbu1DZf5yg-BLhfZr-DO-OPiau3aeyBMtSssv7Sg'
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { action, range, data, values } = req.body;
        console.log('Purchase API - action:', action);

        switch (action) {
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

            default:
                console.error('Unknown action:', action);
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