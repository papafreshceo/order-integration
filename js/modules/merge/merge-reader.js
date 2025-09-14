// js/modules/merge/merge-reader.js - 파일 읽기

window.MergeReader = {
    // 파일 읽기
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const fileName = file.name.toLowerCase();
            const isCsv = fileName.endsWith('.csv');
            
            reader.onload = async (e) => {
                try {
                    let workbook;
                    
                    if (isCsv) {
                        // CSV 처리
                        const text = e.target.result;
                        workbook = XLSX.read(text, { type: 'string' });
                    } else {
                        // Excel 처리
                        const data = e.target.result;
                        workbook = XLSX.read(data, {
                            type: 'binary',
                            cellDates: true,
                            cellNF: true,
                            cellText: false,
                            dateNF: 'YYYY-MM-DD HH:mm:ss'
                        });
                    }
                    
                    // 첫 번째 시트 처리
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                        header: 1,
                        defval: '',
                        blankrows: false,
                        raw: false,
                        dateNF: 'YYYY-MM-DD HH:mm:ss'
                    });
                    
                    // 파일 정보 생성
                    const fileInfo = await this.processFileData(file, jsonData);
                    
                    // 업로드 목록에 추가
                    MergeModule.state.uploadedFiles.push(fileInfo);
                    
                    resolve(fileInfo);
                } catch (error) {
                    console.error('파일 읽기 오류:', error);
                    ToastManager.error(`${file.name} 읽기 실패`);
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                console.error('FileReader 오류:', error);
                reject(error);
            };
            
            // 파일 읽기 시작
            if (isCsv) {
                reader.readAsText(file, 'utf-8');
            } else {
                reader.readAsBinaryString(file);
            }
        });
    },
    
    // 파일 데이터 처리
    async processFileData(file, rawData) {
        // 빈 행 제거
        const data = rawData.filter(row => 
            row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );
        
        if (data.length === 0) {
            throw new Error('데이터가 없습니다');
        }
        
        // 헤더 찾기
        const headerRowIndex = this.findHeaderRow(data, file.name);
        const headers = data[headerRowIndex].map(h => String(h || '').trim());
        const dataRows = data.slice(headerRowIndex + 1);
        
        // 마켓 감지
        const marketName = MergeDetector.detect(file.name, headers);
        
        // 데이터를 객체 배열로 변환
        const processedData = dataRows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] !== undefined ? row[index] : '';
            });
            return obj;
        });
        
        // 오늘 날짜 확인
        const fileDate = new Date(file.lastModified);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        fileDate.setHours(0, 0, 0, 0);
        const isToday = fileDate.getTime() === today.getTime();
        
        return {
            name: file.name,
            marketName: marketName,
            lastModified: file.lastModified,
            isToday: isToday,
            headers: headers,
            data: processedData,
            rowCount: processedData.length
        };
    },
    
    // 헤더 행 찾기
    findHeaderRow(data, fileName) {
        const commonHeaders = ['주문번호', '상품주문번호', '구매자명', '주문자', 
                              '수취인', '수취인명', '수취인전화번호', '옵션명', '수량'];
        
        let bestIndex = 0;
        let bestScore = 0;
        
        // 상위 10개 행만 검사
        const limit = Math.min(data.length, 10);
        
        for (let i = 0; i < limit; i++) {
            const row = data[i];
            if (!Array.isArray(row)) continue;
            
            let score = 0;
            for (const cell of row) {
                const text = String(cell || '').trim();
                if (commonHeaders.some(h => text.includes(h))) {
                    score += 3;
                }
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestIndex = i;
            }
        }
        
        return bestIndex;
    }
};