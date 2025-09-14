// api/merge-export.js - Google Sheets 내보내기 API

const { google } = require('googleapis');

module.exports = async (req, res) => {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        const { data, sheetName, standardFields } = req.body;
        
        if (!data || data.length === 0) {
            res.status(400).json({ error: '저장할 데이터가 없습니다' });
            return;
        }
        
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
        const auth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );
        
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.MERGE_SHEET_ID || process.env.SHEET_ID_WRITE;
        
        // 시트 이름 생성
        const finalSheetName = sheetName || new Date().toISOString().slice(0, 10).replace(/-/g, '');
        
        // 헤더 생성
        const headers = standardFields || Object.keys(data[0]);
        
        // 데이터 배열 생성
        const values = [headers];
        for (const row of data) {
            const rowValues = headers.map(header => {
                const value = row[header];
                return value !== undefined && value !== null ? String(value) : '';
            });
            values.push(rowValues);
        }
        
        // 새 시트 생성
        try {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: finalSheetName
                            }
                        }
                    }]
                }
            });
        } catch (error) {
            // 시트가 이미 존재하는 경우 무시
            console.log('시트가 이미 존재함:', finalSheetName);
        }
        
        // 데이터 쓰기
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${finalSheetName}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: values
            }
        });
        
        // 헤더 서식 적용
        const sheetInfo = await sheets.spreadsheets.get({
            spreadsheetId,
            ranges: [finalSheetName]
        });
        
        const sheetId = sheetInfo.data.sheets[0].properties.sheetId;
        
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        repeatCell: {
                            range: {
                                sheetId: sheetId,
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.3, green: 0.7, blue: 0.3 },
                                    textFormat: {
                                        foregroundColor: { red: 1, green: 1, blue: 1 },
                                        bold: true
                                    },
                                    horizontalAlignment: 'CENTER'
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
                        }
                    },
                    {
                        autoResizeDimensions: {
                            dimensions: {
                                sheetId: sheetId,
                                dimension: 'COLUMNS',
                                startIndex: 0,
                                endIndex: headers.length
                            }
                        }
                    }
                ]
            }
        });
        
        res.status(200).json({
            success: true,
            sheetName: finalSheetName,
            rowCount: data.length,
            url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId}`
        });
        
    } catch (error) {
        console.error('내보내기 오류:', error);
        res.status(500).json({
            error: error.message
        });
    }
};
