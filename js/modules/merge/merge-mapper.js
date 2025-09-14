// js/modules/merge/merge-mapper.js

/**
 * 필드 매핑 모듈
 * 마켓별 필드를 표준 필드로 매핑
 */

const MergeMapper = (function() {
    'use strict';

    let mappingConfig = null;
    let standardFields = null;

    /**
     * 초기화
     */
    function initialize(config) {
        mappingConfig = config.FIELD_MAPPINGS;
        standardFields = config.STANDARD_FIELDS;
        console.log('MergeMapper 초기화 완료');
    }

    /**
     * 자동 필드 매핑
     * @param {Array} headers - 원본 헤더
     * @param {string} marketName - 마켓명
     * @returns {Object} 매핑 결과
     */
    function autoMapFields(headers, marketName) {
        const mapping = {
            fields: {},
            unmapped: [],
            suggestions: {},
            confidence: {}
        };

        if (!mappingConfig || !mappingConfig[marketName]) {
            console.warn(`매핑 설정이 없음: ${marketName}`);
            return mapping;
        }

        const marketMapping = mappingConfig[marketName];
        
        // 표준 필드별로 매핑
        for (const standardField of standardFields) {
            const mappedField = marketMapping[standardField];
            
            if (mappedField) {
                // 직접 매핑
                const headerIndex = findHeaderIndex(headers, mappedField);
                
                if (headerIndex !== -1) {
                    mapping.fields[standardField] = {
                        originalField: headers[headerIndex],
                        index: headerIndex,
                        confidence: 100
                    };
                    mapping.confidence[standardField] = 100;
                } else {
                    // 유사 필드 찾기
                    const similar = findSimilarField(headers, mappedField);
                    if (similar) {
                        mapping.fields[standardField] = {
                            originalField: similar.field,
                            index: similar.index,
                            confidence: similar.confidence
                        };
                        mapping.confidence[standardField] = similar.confidence;
                        mapping.suggestions[standardField] = [similar];
                    }
                }
            } else {
                // 매핑 설정이 없는 경우 자동 추측
                const guessed = guessMapping(headers, standardField);
                if (guessed) {
                    mapping.suggestions[standardField] = [guessed];
                    if (guessed.confidence >= 70) {
                        mapping.fields[standardField] = {
                            originalField: guessed.field,
                            index: guessed.index,
                            confidence: guessed.confidence
                        };
                    }
                }
            }
        }

        // 매핑되지 않은 필드 찾기
        headers.forEach((header, index) => {
            const isMapped = Object.values(mapping.fields).some(
                m => m.index === index
            );
            
            if (!isMapped && header.trim()) {
                mapping.unmapped.push({
                    field: header,
                    index: index
                });
            }
        });

        return mapping;
    }

    /**
     * 헤더 인덱스 찾기
     */
    function findHeaderIndex(headers, targetField) {
        // 정확히 일치
        let index = headers.findIndex(h => h === targetField);
        if (index !== -1) return index;

        // 공백 제거 후 일치
        index = headers.findIndex(h => h.trim() === targetField.trim());
        if (index !== -1) return index;

        // 대소문자 무시
        const targetLower = targetField.toLowerCase();
        index = headers.findIndex(h => h.toLowerCase() === targetLower);
        if (index !== -1) return index;

        return -1;
    }

    /**
     * 유사 필드 찾기
     */
    function findSimilarField(headers, targetField) {
        const candidates = [];
        const targetLower = targetField.toLowerCase();
        const targetWords = targetLower.split(/[\s_-]+/);

        headers.forEach((header, index) => {
            if (!header) return;
            
            const headerLower = header.toLowerCase();
            let confidence = 0;

            // 부분 문자열 포함
            if (headerLower.includes(targetLower) || targetLower.includes(headerLower)) {
                confidence = 70;
            }

            // 단어 매칭
            const headerWords = headerLower.split(/[\s_-]+/);
            const matchedWords = targetWords.filter(w => 
                headerWords.some(hw => hw.includes(w) || w.includes(hw))
            );
            
            if (matchedWords.length > 0) {
                confidence = Math.max(confidence, (matchedWords.length / targetWords.length) * 80);
            }

            if (confidence > 50) {
                candidates.push({
                    field: header,
                    index: index,
                    confidence: Math.round(confidence)
                });
            }
        });

        // 가장 높은 신뢰도 반환
        candidates.sort((a, b) => b.confidence - a.confidence);
        return candidates[0] || null;
    }

    /**
     * 매핑 추측
     */
    function guessMapping(headers, standardField) {
        // 표준 필드명 기반 추측 패턴
        const patterns = {
            '주문번호': ['주문번호', 'order', '주문코드', '주문ID'],
            '상품주문번호': ['상품주문번호', '상품번호', 'product'],
            '결제일': ['결제일', '결제날짜', '주문일', 'payment'],
            '주문자': ['주문자', '구매자', '주문자명', 'buyer'],
            '수취인': ['수취인', '수령인', '받는분', 'receiver'],
            '전화번호': ['전화번호', '연락처', 'phone', 'tel'],
            '주소': ['주소', '배송지', 'address'],
            '옵션명': ['옵션', 'option', '상품명'],
            '수량': ['수량', '개수', 'quantity', 'qty'],
            '금액': ['금액', '가격', 'price', 'amount'],
            '배송메시지': ['배송메시지', '메모', 'message'],
            '송장번호': ['송장', '운송장', 'tracking']
        };

        const targetPatterns = patterns[standardField] || [standardField];
        let bestMatch = null;
        let maxConfidence = 0;

        headers.forEach((header, index) => {
            if (!header) return;
            
            const headerLower = header.toLowerCase();
            
            for (const pattern of targetPatterns) {
                const patternLower = pattern.toLowerCase();
                let confidence = 0;

                if (headerLower === patternLower) {
                    confidence = 90;
                } else if (headerLower.includes(patternLower)) {
                    confidence = 70;
                } else if (patternLower.includes(headerLower)) {
                    confidence = 60;
                }

                if (confidence > maxConfidence) {
                    maxConfidence = confidence;
                    bestMatch = {
                        field: header,
                        index: index,
                        confidence: confidence,
                        pattern: pattern
                    };
                }
            }
        });

        return bestMatch;
    }

    /**
     * 매핑 검증
     */
    function validateMapping(mapping) {
        const issues = [];
        const requiredFields = [
            '주문번호', '수취인', '전화번호', '주소', '옵션명', '수량'
        ];

        // 필수 필드 체크
        for (const field of requiredFields) {
            if (!mapping.fields[field] || mapping.fields[field].confidence < 50) {
                issues.push({
                    type: 'missing',
                    field: field,
                    message: `필수 필드 "${field}"가 매핑되지 않음`
                });
            }
        }

        // 중복 매핑 체크
        const usedIndices = {};
        for (const [stdField, mapInfo] of Object.entries(mapping.fields)) {
            const index = mapInfo.index;
            if (usedIndices[index]) {
                issues.push({
                    type: 'duplicate',
                    field: stdField,
                    conflictWith: usedIndices[index],
                    message: `"${stdField}"와 "${usedIndices[index]}"가 동일한 필드에 매핑됨`
                });
            }
            usedIndices[index] = stdField;
        }

        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }

    /**
     * 수동 매핑 조정
     */
    function adjustMapping(currentMapping, adjustments) {
        const newMapping = JSON.parse(JSON.stringify(currentMapping));

        for (const [stdField, originalField] of Object.entries(adjustments)) {
            const headerIndex = currentMapping.unmapped.findIndex(
                u => u.field === originalField
            );

            if (headerIndex !== -1) {
                newMapping.fields[stdField] = {
                    originalField: originalField,
                    index: currentMapping.unmapped[headerIndex].index,
                    confidence: 100,
                    manual: true
                };

                // unmapped에서 제거
                newMapping.unmapped = newMapping.unmapped.filter(
                    u => u.field !== originalField
                );
            }
        }

        return newMapping;
    }

    // Public API
    return {
        initialize,
        autoMapFields,
        validateMapping,
        adjustMapping,
        findSimilarField,
        guessMapping
    };

})();

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MergeMapper;
}
