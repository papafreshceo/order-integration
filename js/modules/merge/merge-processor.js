// js/modules/merge/merge-detector.js

/**
 * 마켓 감지 모듈
 * 파일명과 헤더 패턴을 분석하여 마켓을 자동으로 감지
 */

const MergeDetector = (function() {
    'use strict';

    // 마켓별 감지 패턴
    let marketPatterns = null;
    let marketList = null;

    /**
     * 초기화
     */
    function initialize(patterns, markets) {
        marketPatterns = patterns;
        marketList = markets;
        console.log('MergeDetector 초기화 완료');
    }

    /**
     * 마켓 자동 감지
     * @param {string} fileName - 파일명
     * @param {Array} headers - 헤더 배열
     * @param {Array} firstDataRow - 첫 번째 데이터 행
     * @returns {Object} 감지 결과
     */
    function detectMarket(fileName, headers, firstDataRow) {
        const result = {
            marketName: null,
            confidence: 0,
            detectedBy: null,
            headerRow: 1,
            suggestions: []
        };

        if (!marketPatterns || !marketList) {
            console.error('MergeDetector: 초기화되지 않음');
            return result;
        }

        console.log('마켓 감지 시작:', fileName);
        console.log('헤더 샘플:', headers.slice(0, 10));

        const fileNameLower = fileName.toLowerCase();
        const headerText = headers.join(' ').toLowerCase();
        
        // 각 마켓별로 점수 계산
        const scores = {};
        
        for (const marketName in marketList) {
            const market = marketList[marketName];
            let score = 0;
            let detectionMethod = null;

            // 1. 파일명으로 감지 (detectString1)
            if (market.detectString1 && market.detectString1.length > 0) {
                if (fileNameLower.includes(market.detectString1.toLowerCase())) {
                    score += 100;
                    detectionMethod = 'fileName';
                    console.log(`  ${marketName}: 파일명 매칭 "${market.detectString1}"`);
                }
            }

            // 2. 헤더로 감지 (detectString2) - 쉼표로 구분된 문자열 처리
            if (market.detectString2 && market.detectString2.length > 0) {
                const detectStrings = market.detectString2.split(',').map(s => s.trim());
                let matchCount = 0;
                
                for (const detectStr of detectStrings) {
                    if (detectStr && headerText.includes(detectStr.toLowerCase())) {
                        matchCount++;
                    }
                }
                
                // 여러 문자열인 경우 2개 이상, 단일 문자열인 경우 1개 매칭
                const requiredMatches = detectStrings.length > 1 ? 2 : 1;
                
                if (matchCount >= requiredMatches) {
                    score += 80;
                    if (!detectionMethod) detectionMethod = 'headers';
                    console.log(`  ${marketName}: 헤더 매칭 (${matchCount}/${detectStrings.length})`);
                }
            }

            // 3. detectString3 체크
            if (market.detectString3 && market.detectString3.length > 0) {
                const detectStrings3 = market.detectString3.split(',').map(s => s.trim());
                let matchCount3 = 0;
                
                for (const detectStr of detectStrings3) {
                    if (detectStr && headerText.includes(detectStr.toLowerCase())) {
                        matchCount3++;
                    }
                }
                
                if (matchCount3 > 0) {
                    score += 60;
                    if (!detectionMethod) detectionMethod = 'pattern3';
                }
            }

            // 4. 헤더 패턴 점수 추가
            const headerScore = analyzeHeaderPattern(headers, marketName);
            score += headerScore;

            scores[marketName] = {
                score: score,
                method: detectionMethod,
                headerRow: market.headerRow || 1
            };
        }

        // 가장 높은 점수의 마켓 선택
        let maxScore = 0;
        let detectedMarket = null;
        
        for (const [marketName, data] of Object.entries(scores)) {
            if (data.score > maxScore) {
                maxScore = data.score;
                detectedMarket = marketName;
                result.detectedBy = data.method;
                result.headerRow = data.headerRow;
            }
            
            // 점수가 있는 마켓은 suggestions에 추가
            if (data.score > 30) {
                result.suggestions.push({
                    marketName: marketName,
                    score: data.score,
                    method: data.method
                });
            }
        }

        // 결과 설정
        if (detectedMarket && maxScore >= 60) {
            result.marketName = detectedMarket;
            result.confidence = Math.min(100, Math.round(maxScore));
            console.log(`✅ 마켓 감지: ${detectedMarket} (신뢰도: ${result.confidence}%)`);
        } else {
            console.log('❌ 마켓을 감지할 수 없음');
        }

        // suggestions 정렬
        result.suggestions.sort((a, b) => b.score - a.score);

        return result;
    }

    /**
     * 헤더 패턴 분석
     */
    function analyzeHeaderPattern(headers, marketName) {
        let score = 0;
        
        // 마켓별 특징적인 헤더 패턴
        const marketHeaders = {
            '네이버': ['상품주문번호', '주문번호', '구매자명', '구매자연락처', '수취인명', '수취인연락처'],
            '쿠팡': ['주문번호', '묶음배송번호', '옵션ID', '수취인이름', '구매수(수량)'],
            '11번가': ['주문번호', '상품주문번호', '구매자명', '수취인명', '수취인전화번호'],
            '카카오': ['주문 일련번호', '수령인', '연락처', '배송메시지'],
            '티몬': ['주문번호', '딜명', '옵션명', '구매자명', '수령자명'],
            '위메프': ['주문번호코드', '주문자', '수취인', '수취인연락처'],
            '스마트스토어': ['상품주문번호', '주문번호', '구매자명', '구매자연락처'],
            'SSG': ['주문번호', '수취인명', '수취인휴대폰', '상품명', '단품명'],
            '지마켓': ['주문번호', '구매자', '수령자', '수령자연락처'],
            '옥션': ['주문번호', '구매자', '수령자', '수령자연락처']
        };

        const targetHeaders = marketHeaders[marketName] || [];
        
        for (const targetHeader of targetHeaders) {
            if (headers.some(h => h.includes(targetHeader))) {
                score += 10;
            }
        }

        return score;
    }

    /**
     * 파일 날짜 확인
     */
    function checkFileDate(file) {
        const fileDate = new Date(file.lastModified);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        fileDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today - fileDate) / (1000 * 60 * 60 * 24));
        
        return {
            isToday: daysDiff === 0,
            isRecent: daysDiff <= 7 && daysDiff >= 0,
            daysOld: daysDiff,
            dateString: fileDate.toLocaleDateString('ko-KR')
        };
    }

    /**
     * 헤더 행 자동 감지
     */
    function detectHeaderRow(rows, marketName) {
        const commonHeaders = [
            '주문번호', '상품주문번호', '구매자명', '주문자', 
            '수취인', '수취인명', '수취인전화번호', '옵션명', 
            '수량', '정산', '결제', '주소', '배송메'
        ];

        let bestRow = 0;
        let maxScore = 0;

        const limit = Math.min(rows.length, 10);
        
        for (let i = 0; i < limit; i++) {
            const row = rows[i];
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
            
            if (score > maxScore) {
                maxScore = score;
                bestRow = i;
            }
        }

        console.log(`헤더 행 감지: ${bestRow + 1}행 (점수: ${maxScore})`);
        return bestRow;
    }

    // Public API
    return {
        initialize,
        detectMarket,
        checkFileDate,
        detectHeaderRow
    };

})();

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MergeDetector;
}
