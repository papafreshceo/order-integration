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

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { action, range, data } = req.body;
        const spreadsheetId = '1a55b0APC5LlmgXhh-Lw4O-7V_gLT_9luDqfvkkesof0';

        switch (action) {
            case 'getPurchaseData': {
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: range || '구매관리!A:M',
                });
                
                return res.status(200).json({
                    success: true,
                    data: response.data.values || []
                });
            }

            case 'updatePurchaseData': {
                const updateRange = range || '구매관리!A2:M';
                
                // 빈 행 제거
                const filteredData = data.filter(row => 
                    row && row.some(cell => cell !== undefined && cell !== null && cell !== '')
                );
                
                // 시트 클리어
                await sheets.spreadsheets.values.clear({
                    spreadsheetId,
                    range: updateRange,
                });
                
                // 데이터 쓰기
                if (filteredData.length > 0) {
                    const response = await sheets.spreadsheets.values.update({
                        spreadsheetId,
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