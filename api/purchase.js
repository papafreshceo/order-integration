import { google } from 'googleapis';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { action, range, data, values } = req.body;
        console.log('Purchase API - action:', action);

        const auth = new google.auth.GoogleAuth({
            credentials: {
                type: 'service_account',
                project_id: 'dalrae-market',
                private_key_id: 'dummy_key_id',
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                client_id: '123456789',
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                token_uri: 'https://oauth2.googleapis.com/token',
                auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
                client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '')}`
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const SPREADSHEET_IDS = {
            PURCHASE: '1a55b0APC5LlmgXhh-Lw4O-7V_gLT_9luDqfvkkesof0',
            PRODUCTS: '17MGwbu1DZf5yg-BLhfZr-DO-OPiau3aeyBMtSssv7Sg'
        };

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

            case 'updatePurchaseData': {
                const updateRange = range || '구매관리!A2:Q';
                const filteredData = data.filter(row => 
                    row && row.some(cell => cell !== undefined && cell !== null && cell !== '')
                );
                
                await sheets.spreadsheets.values.clear({
                    spreadsheetId: SPREADSHEET_IDS.PURCHASE,
                    range: updateRange,
                });
                
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



            case 'getProductsData': {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_IDS.PRODUCTS,
        range: '원물관리!A:J',
    });
    
    return res.status(200).json({
        success: true,
        data: response.data.values || []
    });
}

case 'appendPurchaseData': {
    const appendRange = range || '사입관리!A:Z';
    const response = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_IDS.PURCHASE,
        range: appendRange,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
            values: data
        }
    });
    
    return res.status(200).json({
        success: true,
        updatedRange: response.data.updates?.updatedRange
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