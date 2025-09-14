// js/modules/merge/merge-reader.js - 파일 읽기 모듈 (수정된 버전)

window.MergeReader = {
    // 초기화
    initialize(config) {
        this.config = config;
        console.log('MergeReader 초기화 완료');
    },

    // 파일 읽기
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const filename = file.name.toLowerCase();
            const isSmartStore = this.isSmartStore(filename);
            const isCsv = filename.endsWith('.csv');
            const isXls = filename.endsWith('.xls') && !filename.endsWith('.xlsx');

            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    let workbook;

                    if (isCsv) {
                        // CSV 처리
                        const csvText = e.target.result;
                        workbook = XLSX.read(csvText, { type: 'string' });
                    } else if (isXls) {
                        // XLS 파일 처리 (구형 엑셀)
                        const arrayBuffer = e.target.result;
                        const u8 = new Uint8Array(arrayBuffer);
                        workbook = XLSX.read(u8, {
                            type: 'array',
                            cellDates: true,
                            cellNF: true,
                            cellText: false,
                            dateNF: 'YYYY-MM-DD HH:mm:ss'
                        });
                    } else {
                        // XLSX 파일 처리
                        const data = e.target.result;
                        try {
                            workbook = XLSX.read(data, { 
                                type: 'binary',
                                cellDates: true,
                                cellNF: true,
                                cellText: false,
                                dateNF: 'YYYY-MM-DD HH:mm:ss'
                            });
                        } catch (readError) {
                            // 스마트스토어 암호화 파일 처리
                            if (isSmartStore) {
                                try {
                                    const uint8Array = new Uint8Array(data.length);
                                    for (let i = 0; i < data.length; i++) {
                                        uint8Array[i] = data.charCodeAt(i) & 0xFF;
                                    }
                                    workbook = XLSX.read(uint8Array, { 
                                        type: 'array',
                                        password: '1111',
                                        cellDates: true,
                                        cellNF: true,
                                        cellText: false
                                    });
                                    console.log('스마트스토어 암호화 파일 해제 성공');
                                } catch (pwdError) {
                                    throw new Error(`암호화된 파일입니다. 암호를 확인해주세요.`);
                                }
                            } else {
                                throw readError;
                            }
                        }
                    }

                    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
                        throw new Error('유효한 시트가 없습니다');
                    }

                    // 첫 번째 시트 처리
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rawRows = XLSX.utils.sheet_to_json(firstSheet, {
                        header: 1,
                        defval: '',
                        blankrows: false,
                        raw: false,
                        dateNF: 'YYYY-MM-DD HH:mm:ss'
                    });

                    // 파일 정보 생성
                    const fileInfo = await this.processFileData(file, rawRows, isSmartStore);
                    resolve(fileInfo);

                } catch (error) {
                    console.error('파일 처리 오류:', error);
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
            } else if (isXls) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsBinaryString(file);
            }
        });
    },

    // 스마트스토어 파일 확인
    isSmartStore(filename) {
        return filename.includes('스마트스토어') || 
               filename.includes('smartstore') || 
               filename.includes('네이버') || 
               filename.includes('전체주문발주') ||
               filename.includes('주문발주');
    },

    // 파일 데이터 처리
    async processFileData(file, rawRows, isSmartStore) {
        // 빈 행 제거
        const data = rawRows.filter(row => 
            row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );

        if (data.length === 0) {
            throw new Error('데이터가 없습니다');
        }

        // 헤더 행 찾기
        let headerRowIndex = this.findHeaderRow(data, file.name);
        
        // 특수 파일 처리
        const fileName = file.name.toLowerCase();
        if (fileName.includes('전화주문') || fileName.includes('cs재발송') || fileName.includes('cs 재발송')) {
            headerRowIndex = 1;
        } else if (isSmartStore && data.length > 2) {
            // 스마트스토어는 2행에 헤더가 있을 수 있음
            const secondRow = data[1];
            const smartStoreHeaders = ['상품주문번호', '주문번호', '구매자명', '구매자연락처', '수취인명'];
            const hasHeaderInSecondRow = secondRow && secondRow.some(cell => 
                smartStoreHeaders.includes(String(cell).trim())
            );
            if (hasHeaderInSecondRow) {
                headerRowIndex = 1;
            }
        }

        const headers = data[headerRowIndex].map(h => String(h || '').trim());
        const dataRows = data.slice(headerRowIndex + 1);

        // 데이터를 객체 배열로 변환
        const processedData = dataRows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                let value = row[index];
                
                // 날짜 필드 처리
                if (header.includes('결제일') || header.includes('주문일') || header.includes('발송일')) {
                    value = this.formatDate(value);
                }
                // 금액 필드 처리
                else if (header.includes('금액') || header.includes('가격') || header.includes('수수료')) {
                    value = this.parseNumber(value);
                }
                
                obj[header] = value !== undefined ? value : '';
            });
            return obj;
        });

        // 파일 날짜 확인
        const fileDate = new Date(file.lastModified);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        fileDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today - fileDate) / (1000 * 60 * 60 * 24));
        const isToday = daysDiff <= 7 && daysDiff >= 0; // 7일 이내 파일은 유효

        return {
            name: file.name,
            lastModified: file.lastModified,
            isToday: isToday,
            headers: headers,
            data: processedData,
            rawData: data,
            rowCount: processedData.length,
            headerRowIndex: headerRowIndex
        };
    },

    // 헤더 행 찾기
    findHeaderRow(data, fileName) {
        const commonHeaders = [
            '주문번호', '상품주문번호', '구매자명', '주문자', 
            '수취인', '수취인명', '수취인전화번호', '옵션명', 
            '수량', '정산', '결제', '주소', '배송메'
        ];
        
        const marketHints = {
            '11번가': ['주문번호', '상품주문번호', '주문상태', '구매자명', '수취인명'],
            '네이버': ['상품주문번호', '주문번호', '구매자명', '수취인명', '구매자연락처'],
            '쿠팡': ['주문번호', '주문상태', '판매자상품코드', '옵션', '수량', '수취인']
        };

        let bestIndex = 0;
        let bestScore = 0;
        
        // 상위 8개 행만 검사
        const limit = Math.min(data.length, 8);
        
        for (let i = 0; i < limit; i++) {
            const row = data[i];
            if (!Array.isArray(row)) continue;
            
            let score = 0;
            
            for (const cell of row) {
                const text = String(cell || '').trim();
                if (!text) continue;
                
                // 공통 헤더와 매칭
                if (commonHeaders.some(h => text.includes(h))) {
                    score += 3;
                }
                
                // 헤더 키워드 포함
                if (/[전화|연락|금액|메시지|주소|정산|결제|수수료]/.test(text)) {
                    score += 1;
                }
                
                // 날짜 형식이면 감점
                if (/^\d{1,4}([\/\-.]\d{1,2})?/.test(text)) {
                    score -= 1;
                }
            }
            
            // 유니크한 값의 개수도 점수에 반영
            const uniqueCount = new Set(row.map(c => String(c || '').trim())).size;
            score += Math.min(uniqueCount, 20) * 0.1;
            
            if (score > bestScore) {
                bestScore = score;
                bestIndex = i;
            }
        }
        
        console.log(`헤더 행 감지: ${bestIndex + 1}행 (점수: ${bestScore})`);
        return bestIndex;
    },

    // 날짜 형식 변환
    formatDate(value) {
        try {
            if (!value) return '';
            
            const strValue = String(value);
            
            // 이미 올바른 형식인 경우
            if (strValue.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
                return strValue;
            }
            
            // MM/DD/YY HH:MM:SS 형식 처리
            if (strValue.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
                const parts = strValue.split(' ');
                const datePart = parts[0];
                const timePart = parts[1] || '00:00:00';
                
                const dateParts = datePart.split('/');
                const month = dateParts[0].padStart(2, '0');
                const day = dateParts[1].padStart(2, '0');
                let year = dateParts[2];
                
                if (year.length === 2) {
                    year = '20' + year;
                }
                
                return `${year}-${month}-${day} ${timePart}`;
            }
            
            // 엑셀 시리얼 번호인 경우
            if (/^\d{4,6}$/.test(strValue)) {
                const excelDate = parseInt(strValue);
                const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
                const year = jsDate.getFullYear();
                const month = String(jsDate.getMonth() + 1).padStart(2, '0');
                const day = String(jsDate.getDate()).padStart(2, '0');
                const hours = String(jsDate.getHours()).padStart(2, '0');
                const minutes = String(jsDate.getMinutes()).padStart(2, '0');
                const seconds = String(jsDate.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            }
            
            // Date 객체인 경우
            if (value instanceof Date) {
                const year = value.getFullYear();
                const month = String(value.getMonth() + 1).padStart(2, '0');
                const day = String(value.getDate()).padStart(2, '0');
                const hours = String(value.getHours()).padStart(2, '0');
                const minutes = String(value.getMinutes()).padStart(2, '0');
                const seconds = String(value.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            }
            
            // 기타 날짜 형식 처리
            if (strValue.includes('-') || strValue.includes('/')) {
                if (!strValue.includes(':')) {
                    return strValue.split(' ')[0] + ' 00:00:00';
                }
                return strValue;
            }
            
            return strValue;
            
        } catch (error) {
            console.error('날짜 변환 오류:', error);
            return String(value);
        }
    },

    // 숫자 파싱
    parseNumber(value) {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        
        if (typeof value === 'number') {
            return value;
        }
        
        let strValue = String(value).trim();
        
        // 쉼표, 원화 기호 등 제거
        strValue = strValue.replace(/,/g, '');
        strValue = strValue.replace(/[₩￦$¥£€]/g, '');
        strValue = strValue.replace(/\s/g, '');
        
        // 괄호로 둘러싸인 음수 처리
        if (strValue.startsWith('(') && strValue.endsWith(')')) {
            strValue = '-' + strValue.substring(1, strValue.length - 1);
        }
        
        const num = parseFloat(strValue);
        return isNaN(num) ? 0 : num;
    }
};
