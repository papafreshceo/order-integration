// api/auth.js

const { google } = require('googleapis');

module.exports = async (req, res) => {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
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
        
        // 요청 본문에서 action 확인
        const { action, email, name, role, createdAt } = req.body;
        
        console.log('Received request:', { action, email });  // 디버깅용
        
        // 사용자 역할 조회
        if (action === 'getUserRole') {
            if (!email) {
                res.status(400).json({ error: 'Email is required' });
                return;
            }
            
            try {
                // Google Sheets에서 사용자 정보 조회
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId: process.env.USERS_SHEET_ID,
                    range: 'A:E',  // 전체 시트 읽기
                });
                
                const rows = response.data.values;
                console.log('Sheet data rows:', rows?.length);  // 디버깅용
                
                if (!rows || rows.length === 0) {
                    console.log('No data found in sheet');
                    res.status(200).json({ 
                        role: 'staff',
                        message: 'No users found in sheet'
                    });
                    return;
                }
                
                // 헤더 행 제외하고 사용자 찾기
                // A열: 이메일, B열: 이름, C열: 역할, D열: 상태
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (row && row[0] && row[0].toLowerCase() === email.toLowerCase()) {
                        console.log('User found:', { email: row[0], role: row[2], status: row[3] });
                        
                        // 상태가 active인 경우만
                        if (row[3] === 'active') {
                            res.status(200).json({ 
                                role: row[2] || 'staff',
                                name: row[1] || email.split('@')[0]
                            });
                            return;
                        }
                    }
                }
                
                console.log('User not found in sheet:', email);
                // 사용자를 찾지 못한 경우 기본값
                res.status(200).json({ 
                    role: 'staff',
                    name: email.split('@')[0],
                    message: 'User not found in sheet'
                });
            } catch (error) {
                console.error('Error reading sheet:', error);
                res.status(200).json({ 
                    role: 'staff',
                    error: error.message 
                });
            }
        }
        
        // 새 사용자 저장
        else if (action === 'saveUser') {
            if (!email || !name) {
                res.status(400).json({ error: 'Email and name are required' });
                return;
            }
            
            try {
                // Google Sheets에 새 사용자 추가
                await sheets.spreadsheets.values.append({
                    spreadsheetId: process.env.USERS_SHEET_ID,
                    range: 'A:E',
                    valueInputOption: 'USER_ENTERED',
                    requestBody: {
                        values: [[
                            email,
                            name,
                            role || 'staff',
                            'active',
                            createdAt || new Date().toISOString()
                        ]]
                    }
                });
                
                console.log('User saved:', email);
                res.status(200).json({ success: true });
            } catch (error) {
                console.error('Error saving user:', error);
                res.status(500).json({ 
                    error: 'Failed to save user',
                    details: error.message 
                });
            }
        }
        
        else {
            res.status(400).json({ error: 'Invalid action' });
        }
        
    } catch (error) {
        console.error('API 오류:', error);
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
