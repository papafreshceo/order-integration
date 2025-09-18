// ===========================
// 제품 매칭 모듈
// ===========================
const ProductMatching = (function() {
    // 프라이빗 변수
    let productData = {};
    let priceData = {};
    let unmatchedOptions = new Set();
    let modifiedCells = new Map(); // 수정된 셀 추적
    
    // ===========================
    // 제품 데이터 로드
    // ===========================
    async function loadProductData() {
        try {
            console.log('제품 데이터 로드 시작...');
            
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'getProductData'
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                console.error('제품 데이터 로드 실패:', result.error);
                return false;
            }
            
            productData = result.productData || {};
            priceData = result.priceData || {};
            
            console.log('제품 데이터 로드 완료:', {
                products: Object.keys(productData).length,
                prices: Object.keys(priceData).length
            });
            
            return true;
        } catch (error) {
            console.error('제품 데이터 로드 오류:', error);
            return false;
        }
    }
    
    // ===========================
    // 옵션명 매칭 처리
    // ===========================
    function matchOption(optionName) {
        if (!optionName || typeof optionName !== 'string') {
            return null;
        }
        
        const trimmedOption = optionName.trim();
        
        // 직접 매칭
        if (productData[trimmedOption]) {
            return productData[trimmedOption];
        }
        
        // 대소문자 무시 매칭
        const lowerOption = trimmedOption.toLowerCase();
        for (const [key, value] of Object.entries(productData)) {
            if (key.toLowerCase() === lowerOption) {
                return value;
            }
        }
        
        return null;
    }
    
    // ===========================
    // 셀러공급가 가져오기
    // ===========================
    function getSellerPrice(optionName) {
        if (!optionName || !priceData[optionName]) {
            return null;
        }
        return priceData[optionName].sellerSupplyPrice || 0;
    }
    
    // ===========================
    // 주문 데이터에 제품 정보 적용
    // ===========================
    async function applyProductInfo(orderData) {
    if (!orderData || !Array.isArray(orderData)) {
        return orderData;
    }
    
    // 제품 데이터가 없으면 로드
    if (Object.keys(productData).length === 0) {
        await loadProductData();
    }
    
    unmatchedOptions.clear();
    
    orderData.forEach((row, index) => {
        const optionName = row['옵션명'];
        
        if (!optionName) {
            unmatchedOptions.add(`row-${index}`);
            return;
        }
        
        const matchedProduct = matchOption(optionName);
        const sellerPrice = getSellerPrice(optionName);
        
        if (matchedProduct) {
            // 매칭 성공 - 필드 채우기
            console.log('매칭된 제품 정보:', matchedProduct);  // 디버깅용
            
            // 필드가 비어있을 때만 채우기 (기존 값 보존)
            if (!row['출고처']) row['출고처'] = matchedProduct.출고처 || '';
            if (!row['송장주체']) row['송장주체'] = matchedProduct.송장주체 || '';
            if (!row['벤더사']) row['벤더사'] = matchedProduct.벤더사 || '';
            if (!row['발송지명']) row['발송지명'] = matchedProduct.발송지명 || '';
            if (!row['발송지주소']) row['발송지주소'] = matchedProduct.발송지주소 || '';
            if (!row['발송지연락처']) row['발송지연락처'] = matchedProduct.발송지연락처 || '';
            if (!row['출고비용']) row['출고비용'] = matchedProduct.출고비용 || 0;
            
            // 셀러공급가 설정
            if (sellerPrice !== null && row['셀러']) {
                const quantity = parseInt(row['수량']) || 1;
                row['셀러공급가'] = sellerPrice * quantity;
            }
            
            row['_matchStatus'] = 'matched';
            
            console.log('업데이트된 행:', row);  // 디버깅용
        } else {
            // 매칭 실패
            unmatchedOptions.add(optionName);
            row['_matchStatus'] = 'unmatched';
        }
    });
    
    console.log('매칭 결과:', {
        total: orderData.length,
        unmatched: unmatchedOptions.size
    });
    
    return orderData;
}
    
    // ===========================
    // 테이블 셀 편집 가능 설정
    // ===========================
    /* 찾기: enableCellEditing 함수 */
function enableCellEditing(td, rowIndex, fieldName) {
    const originalValue = td.textContent;
    td.contentEditable = true;
    td.classList.add('editable-cell');
    
    // 포커스 시 전체 선택
    td.addEventListener('focus', function() {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(td);
        selection.removeAllRanges();
        selection.addRange(range);
    });
    
    // 수정 완료 처리
    td.addEventListener('blur', function() {
        handleCellEdit(td, rowIndex, fieldName, originalValue);
    });
    
    // Enter 키 처리 - 줄바꿈 방지 및 편집 종료
    td.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();  // 줄바꿈 방지
            td.blur();  // 포커스 제거하여 편집 종료
        }
    });
}
    
    // ===========================
    // 셀 수정 처리
    // ===========================
    /* 찾기: handleCellEdit 함수 전체 */
function handleCellEdit(td, rowIndex, fieldName, originalValue) {
    const newValue = td.textContent.trim();
    
    if (newValue !== originalValue) {
        // processedData 업데이트
        if (processedData && processedData.data[rowIndex]) {
            processedData.data[rowIndex][fieldName] = newValue;
            
            // 수정된 셀 추적
            const cellKey = `${rowIndex}-${fieldName}`;
            modifiedCells.set(cellKey, {
                original: originalValue,
                modified: newValue
            });
            
            // 즉시 재매칭 시도
            if (fieldName === '옵션명') {
                const matchedProduct = matchOption(newValue);
                const row = processedData.data[rowIndex];
                
                // 기존 클래스 모두 제거
                td.classList.remove('unmatched-cell', 'modified-cell', 'modified-matched-cell');
                
                if (matchedProduct) {
                    // 매칭 성공
                    td.classList.add('modified-matched-cell');
                    row['_matchStatus'] = 'modified-matched';
                    
                    // 제품 정보 업데이트
                    row['출고처'] = matchedProduct.출고처 || '';
                    row['송장주체'] = matchedProduct.송장주체 || '';
                    row['벤더사'] = matchedProduct.벤더사 || '';
                    row['발송지명'] = matchedProduct.발송지명 || '';
                    row['발송지주소'] = matchedProduct.발송지주소 || '';
                    row['발송지연락처'] = matchedProduct.발송지연락처 || '';
                    row['출고비용'] = matchedProduct.출고비용 || 0;
                    
                    // 셀러공급가 업데이트
                    const sellerPrice = getSellerPrice(newValue);
                    if (sellerPrice !== null && row['셀러']) {
                        const quantity = parseInt(row['수량']) || 1;
                        row['셀러공급가'] = sellerPrice * quantity;
                    }
                    
                    console.log(`매칭 성공: ${newValue}`);
                } else {
                    // 매칭 실패
                    td.classList.add('modified-cell');
                    row['_matchStatus'] = 'modified';
                    console.log(`매칭 실패: ${newValue}`);
                }
            } else {
                // 옵션명이 아닌 경우
                td.classList.remove('unmatched-cell');
                td.classList.add('modified-cell');
            }
            
            console.log(`셀 수정: [${rowIndex}][${fieldName}] ${originalValue} → ${newValue}`);
        }
    }
}
    
    // ===========================
    // 옵션명 검증
    // ===========================
    async function verifyOptions() {
        const button = document.getElementById('verifyOptions');
        button.disabled = true;
        button.textContent = '검증 중...';
        
         try {
            console.log('검증 시작 - processedData 확인:', window.processedData);
            
            // 제품 데이터 다시 로드
            const loadResult = await loadProductData();
            console.log('제품 데이터 로드 결과:', loadResult);
            
            if (!processedData || !processedData.data) {
            console.error('processedData 상태:', {
                exists: !!processedData,
                hasData: processedData ? !!processedData.data : false
            });
            throw new Error('처리된 데이터가 없습니다.');
        }
            
            let matchedCount = 0;
            let unmatchedCount = 0;
            let modifiedMatchedCount = 0;
            
            // 모든 행 재검증
            processedData.data.forEach((row, index) => {
                const optionName = row['옵션명'];
                const cellKey = `${index}-옵션명`;
                const wasModified = modifiedCells.has(cellKey);
                
                if (!optionName) {
                    unmatchedCount++;
                    row['_matchStatus'] = 'unmatched';
                    return;
                }
                
                const matchedProduct = matchOption(optionName);
                
                if (matchedProduct) {
                    // 매칭 성공
                    if (wasModified) {
                        modifiedMatchedCount++;
                        row['_matchStatus'] = 'modified-matched';
                    } else {
                        matchedCount++;
                        row['_matchStatus'] = 'matched';
                    }
                    
                    // 필드 업데이트
                    row['출고처'] = matchedProduct.출고처 || row['출고처'] || '';
                    row['송장주체'] = matchedProduct.송장주체 || row['송장주체'] || '';
                    row['벤더사'] = matchedProduct.벤더사 || row['벤더사'] || '';
                    row['발송지명'] = matchedProduct.발송지명 || row['발송지명'] || '';
                    row['발송지주소'] = matchedProduct.발송지주소 || row['발송지주소'] || '';
                    row['발송지연락처'] = matchedProduct.발송지연락처 || row['발송지연락처'] || '';
                    row['출고비용'] = matchedProduct.출고비용 || 0;
                    
                    const sellerPrice = getSellerPrice(optionName);
                    if (sellerPrice !== null) {
                        const quantity = parseInt(row['수량']) || 1;
                        row['셀러공급가'] = sellerPrice * quantity;
                    }
                } else {
                    unmatchedCount++;
                    row['_matchStatus'] = 'unmatched';
                }
            });
            
            // 테이블 다시 그리기
            updateTableStyles();
            
            // 결과 메시지
            const message = `옵션명 검증 완료\n` +
                           `✓ 정상 매칭: ${matchedCount}개\n` +
                           `✓ 수정 후 매칭: ${modifiedMatchedCount}개\n` +
                           `✗ 매칭 실패: ${unmatchedCount}개`;
            
            showCenterMessage(message.replace(/\n/g, '<br>'), 'success', 4000);
            
        } catch (error) {
            console.error('검증 오류:', error);
            showCenterMessage('옵션명 검증 중 오류가 발생했습니다.', 'error');
        } finally {
            button.disabled = false;
            button.textContent = '옵션명 검증';
        }
    }
    
    // ===========================
    // 테이블 스타일 업데이트
    // ===========================
    function updateTableStyles() {
        const tbody = document.getElementById('resultTableBody');
        if (!tbody) return;
        
        const rows = tbody.querySelectorAll('tr');
         const headers = processedData.standardFields || [];
        const optionNameIndex = headers.indexOf('옵션명');
        
        if (optionNameIndex === -1) return;
        
        rows.forEach((tr, rowIndex) => {
            const td = tr.children[optionNameIndex];
            if (!td) return;
            
            const row = processedData.data[rowIndex];
            if (!row) return;
            
            // 기존 클래스 제거
            td.classList.remove('unmatched-cell', 'modified-cell', 'modified-matched-cell');
            
            // 상태에 따른 클래스 추가
            switch(row['_matchStatus']) {
                case 'unmatched':
                    td.classList.add('unmatched-cell');
                    enableCellEditing(td, rowIndex, '옵션명');
                    break;
                case 'modified':
                    td.classList.add('modified-cell');
                    enableCellEditing(td, rowIndex, '옵션명');
                    break;
                case 'modified-matched':
                    td.classList.add('modified-matched-cell');
                    break;
                case 'matched':
                default:
                    // 정상 매칭 - 스타일 없음
                    break;
            }
        });
    }
    
    // ===========================
    // 퍼블릭 API
    // ===========================
    return {
        loadProductData: loadProductData,
        applyProductInfo: applyProductInfo,
        verifyOptions: verifyOptions,
        updateTableStyles: updateTableStyles,
        enableCellEditing: enableCellEditing,  // 추가
        getUnmatchedOptions: () => unmatchedOptions,
        getModifiedCells: () => modifiedCells,
        getProductData: () => productData,
        getPriceData: () => priceData
    };
})();

// 전역 함수로 노출 (HTML onclick에서 호출 가능)

window.ProductMatching = ProductMatching;






