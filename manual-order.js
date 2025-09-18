// ===========================
// 건별 입력 모듈
// ===========================
const ManualOrder = (function() {
    // 프라이빗 변수
    let manualOrders = [];
    let currentOrder = {};
    let orderCounter = 0;
    let productList = [];
    
    // ===========================
    // 초기화
    // ===========================
    function init() {
        setupManualOrderForm();
        loadSavedOrders();
        loadProductData();
    }
    
    // ===========================
    // 제품 데이터 로드
    // ===========================
    async function loadProductData() {
        try {
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
            console.log('API 응답:', result);  // 디버깅용
            
            if (result.productData) {
                productList = Object.entries(result.productData);
                console.log('제품 데이터 로드 완료:', productList.length);
            }
        } catch (error) {
            console.error('제품 데이터 로드 실패:', error);
        }
    }
    
    // ===========================
    // 폼 설정
    // ===========================
    function setupManualOrderForm() {
        // 폼 이벤트 리스너
        const addOrderBtn = document.getElementById('addManualOrder');
        if (addOrderBtn) {
            addOrderBtn.addEventListener('click', addOrder);
        }
        
        // 상품 검색
        const productSearchInput = document.getElementById('manualProductSearch');
        if (productSearchInput) {
            productSearchInput.addEventListener('input', debounce(searchProducts, 300));
        }
        
        // 단가 변경시 금액 계산
        // 단가 변경시 금액 계산
        const unitPriceInput = document.getElementById('manualUnitPrice');
        if (unitPriceInput) {
            unitPriceInput.addEventListener('input', function(e) {
                formatNumberInput(e.target);
                calculateAmount();
            });
        }
        
        // 수량 변경시 금액 계산
        const quantityInput = document.getElementById('manualQuantity');
        if (quantityInput) {
            quantityInput.addEventListener('input', calculateAmount);
        }
        
        // 택배비 변경시 금액 계산
        const shippingCostInput = document.getElementById('manualShippingCost');
        if (shippingCostInput) {
            shippingCostInput.addEventListener('input', function(e) {
                formatNumberInput(e.target);
                calculateAmount();
            });
        }
        
        // 기타비용 변경시 금액 계산
        const extraCostInput = document.getElementById('manualExtraCost');
        if (extraCostInput) {
            extraCostInput.addEventListener('input', function(e) {
                formatNumberInput(e.target);
                calculateAmount();
            });
        }
        
        // 전화번호 자동 포맷
        ['manualOrdererPhone', 'manualReceiverPhone'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', function(e) {
                    formatPhoneNumber(e.target);
                });
            }
        });
    }
    
    // ===========================
    // 상품 검색
    // ===========================
    async function searchProducts(e) {
        const query = e.target.value;
        if (query.length < 2) {
            hideSearchResults();
            return;
        }
        
        try {
            // productList가 비어있으면 다시 로드
            if (productList.length === 0) {
                await loadProductData();
            }
            
            // 품목, 품종, 옵션명에서 검색
            const results = productList.filter(([optionName, data]) => {
                if (!data) return false;
                const 품목 = data['품목'] || data.품목 || '';
                const 품종 = data['품종'] || data.품종 || '';
                const searchText = `${품목} ${품종} ${optionName}`.toLowerCase();
                return searchText.includes(query.toLowerCase());
            }).slice(0, 10);
            
            console.log('검색 결과:', results);  // 디버깅용
            displaySearchResults(results);
        } catch (error) {
            console.error('상품 검색 오류:', error);
        }
    }
    
    // ===========================
    // 검색 결과 표시
    // ===========================
    function displaySearchResults(results) {
        const resultsDiv = document.getElementById('productSearchResults');
        if (!resultsDiv) return;
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="no-results">검색 결과가 없습니다</div>';
            resultsDiv.style.display = 'block';
            return;
        }
        
        resultsDiv.innerHTML = results.map(([optionName, data]) => {
            return `
                <div class="search-result-item" onclick="ManualOrder.selectProduct('${optionName.replace(/'/g, "\\'")}')">
                    <span class="result-name">${optionName}</span>
                </div>
            `;
        }).join('');
        
        resultsDiv.style.display = 'block';
    }
    
    // ===========================
    // 상품 선택
    // ===========================
    function selectProduct(optionName) {
    const productData = productList.find(([name, data]) => name === optionName);
    
    if (productData) {
        const [name, data] = productData;  // data는 여기서 정의됨
        
        // 옵션명 설정
        document.getElementById('manualOptionName').value = name;
        
        // C무료판매가를 단가로 설정 (수정 가능)
        if (data.C무료판매가) {
            const unitPrice = data.C무료판매가 || 0;
            const unitPriceInput = document.getElementById('manualUnitPrice');
            unitPriceInput.value = formatNumber(unitPrice);
        }
        
        currentOrder.product = data;
        currentOrder.optionName = name;
        
        calculateAmount();
    }
    
    hideSearchResults();
    document.getElementById('manualProductSearch').value = '';
}
    
    // ===========================
    // 금액 계산
    // ===========================
    function calculateAmount() {
        const unitPriceStr = document.getElementById('manualUnitPrice').value;
        const quantity = parseInt(document.getElementById('manualQuantity').value) || 0;
        const shippingCostStr = document.getElementById('manualShippingCost').value;
        const extraCostStr = document.getElementById('manualExtraCost').value;
        
        const unitPrice = parseFloat(unitPriceStr.replace(/,/g, '')) || 0;
        const shippingCost = parseFloat(shippingCostStr.replace(/,/g, '')) || 0;
        const extraCost = parseFloat(extraCostStr.replace(/,/g, '')) || 0;
        
        const totalAmount = (quantity * unitPrice) + shippingCost + extraCost;
        
        document.getElementById('manualTotalAmount').value = formatNumber(totalAmount);
    }
    
    // ===========================
    // 주문 추가
    // ===========================
    function addOrder() {
        // 폼 데이터 수집
        const orderData = collectFormData();
        
        // 유효성 검사
        if (!validateOrder(orderData)) {
            return;
        }
        
        // 연번 추가
        orderCounter++;
        orderData['연번'] = orderCounter;
        orderData['마켓명'] = orderData['구분'];  // 구분 값을 마켓명에 넣기
        orderData['마켓'] = 'M' + String(orderCounter).padStart(3, '0');
        orderData['결제일'] = new Date().toISOString().split('T')[0] + ' 00:00:00';
        
        // 제품 정보에서 자동 채우기
        if (currentOrder.product) {
            orderData['벤더사'] = currentOrder.product.벤더사 || '';
            orderData['출고처'] = currentOrder.product.출고처 || '';
            orderData['출고'] = currentOrder.product.출고처 || '';
            orderData['송장'] = currentOrder.product.송장주체 || '';
            orderData['발송지'] = currentOrder.product.발송지명 || '';
            orderData['발송지주소'] = currentOrder.product.발송지주소 || '';
            orderData['발송지연락처'] = currentOrder.product.발송지연락처 || '';
        }
        
        // 주문 추가
        manualOrders.push(orderData);
        
        // 목록 업데이트
        updateOrderList();
        
        // 폼 초기화
        resetForm();
        
        // 로컬 저장
        saveOrders();
        
        showSuccess('주문이 추가되었습니다.');
    }
    
    // ===========================
    // 폼 데이터 수집
    // ===========================
    function collectFormData() {
        const unitPrice = parseFloat(document.getElementById('manualUnitPrice').value.replace(/,/g, '')) || 0;
        const quantity = parseInt(document.getElementById('manualQuantity').value) || 0;
        const shippingCost = parseFloat(document.getElementById('manualShippingCost').value.replace(/,/g, '')) || 0;
        const extraCost = parseFloat(document.getElementById('manualExtraCost').value.replace(/,/g, '')) || 0;
        
        return {
            '구분': document.getElementById('manualOrderType').value,
            '옵션명': document.getElementById('manualOptionName').value,
            '단가': unitPrice,
            '수량': quantity,
            '택배비': shippingCost,
            '기타비용': extraCost,
            '주문번호': 'M' + Date.now(),
            '주문자': document.getElementById('manualOrderer').value,
            '주문자전화번호': document.getElementById('manualOrdererPhone').value,
            '수령인': document.getElementById('manualReceiver').value,
            '수령인전화번호': document.getElementById('manualReceiverPhone').value,
            '우편번호': document.getElementById('manualZipcode') ? document.getElementById('manualZipcode').value : '',
            '수령인주소': document.getElementById('manualAddress').value,
            '배송메시지': document.getElementById('manualDeliveryMsg').value,
            '정산예정금액': (unitPrice * quantity) + shippingCost + extraCost,
            '셀러': ''
        };
    }
    
    // ===========================
    // 유효성 검사
    // ===========================
    function validateOrder(orderData) {
        if (!orderData['구분']) {
            showError('구분을 선택해주세요.');
            return false;
        }
        
        if (!orderData['옵션명']) {
            showError('상품을 선택해주세요.');
            return false;
        }
        
        if (!orderData['수량'] || orderData['수량'] <= 0) {
            showError('수량을 입력해주세요.');
            return false;
        }
        
        if (!orderData['단가'] || orderData['단가'] <= 0) {
            showError('단가를 확인해주세요.');
            return false;
        }
        
        if (!orderData['수령인']) {
            showError('수령인을 입력해주세요.');
            return false;
        }
        
        if (!orderData['수령인전화번호']) {
            showError('수령인 연락처를 입력해주세요.');
            return false;
        }
        
        if (!orderData['수령인주소']) {
            showError('배송 주소를 입력해주세요.');
            return false;
        }
        
        return true;
    }
    
    // ===========================
    // 주문 목록 업데이트
    // ===========================
    function updateOrderList() {
        const listContainer = document.getElementById('manualOrderList');
        if (!listContainer) return;
        
        if (manualOrders.length === 0) {
            listContainer.innerHTML = '<div class="empty-list">추가된 주문이 없습니다</div>';
            return;
        }
        
         // 매핑 데이터가 없으면 종료
        if (!window.mappingData || !window.mappingData.standardFields) {
            console.error('매핑 데이터가 없습니다. 먼저 매핑 데이터를 로드하세요.');
            listContainer.innerHTML = '<div class="error-message">매핑 데이터를 로드 중입니다. 잠시만 기다려주세요.</div>';
            return;
        }
        
        // 매핑시트의 표준필드 순서 사용
        const headers = window.mappingData.standardFields;
        
        // script.js의 displayResultTable 로직 참조
        const fixedWidths = window.fixedWidths || {
            '연번': 50,
            '마켓명': 100,
            '마켓': 60,
            '결제일': 150,
            '주문번호': 140,
            '상품주문번호': 140,
            '주문자': 70,
            '수령인': 70,
            '수취인': 70,
            '주문자전화번호': 120,
            '수취인전화번호': 120,
            '수령인전화번호': 120,
            '주소': 300,
            '수취인주소': 300,
            '수령인주소': 300,
            '배송메세지': 100,
            '배송메시지': 100,
            '옵션명': 160,
            '수량': 60,
            '정산예정금액': 90
        };
        
        const centerAlignFields = ['마켓명', '연번', '결제일', '주문번호', '주문자', '수취인', '옵션명', '수량', '마켓'];
        const rightAlignFields = ['셀러공급가', '출고비용', '정산예정금액', '정산대상금액', '상품금액', '택배비', '기타비용'];
        
        const getAlignment = (fieldName) => {
            if (rightAlignFields.some(f => fieldName.includes(f))) return 'right';
            if (centerAlignFields.some(f => fieldName.includes(f))) return 'center';
            return 'left';
        };
        
        // 건별입력 주문 데이터 보완
        manualOrders.forEach(order => {
            // 누락된 필드 채우기
            headers.forEach(field => {
                if (order[field] === undefined) {
                    order[field] = '';
                }
            });
        });
        
        // HTML 생성
        const html = `
            <div style="overflow-x: auto; max-height: 400px;">
                <table class="manual-order-table">
                    <thead style="position: sticky; top: 0; background: white; z-index: 10;">
                        <tr>
                            ${headers.map(header => 
                                `<th style="width: ${fixedWidths[header] || 100}px;">${header}</th>`
                            ).join('')}
                            <th style="width: 60px;">삭제</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${manualOrders.map((order, index) => {
                            // 마켓 색상 가져오기
                            let marketColor = '200,200,200';
                            let textColor = '#000';
                            
                            if (window.mappingData && window.mappingData.markets) {
                                const market = window.mappingData.markets[order['마켓명']];
                                if (market && market.color) {
                                    marketColor = market.color;
                                    const rgb = marketColor.split(',').map(Number);
                                    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
                                    textColor = brightness > 128 ? '#000' : '#fff';
                                }
                            }
                            
                            return `
                                <tr>
                                    ${headers.map(header => {
                                        const value = order[header] || '';
                                        const alignment = getAlignment(header);
                                        
                                        // 마켓명 필드 특별 처리
                                        if (header === '마켓명') {
                                            return `<td style="background: rgb(${marketColor}); color: ${textColor}; font-weight: bold; text-align: center;">${value}</td>`;
                                        }
                                        
                                        // 금액 필드 포맷팅
                                        if (rightAlignFields.some(f => header.includes(f)) && value) {
                                            const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
                                            if (!isNaN(numValue)) {
                                                return `<td style="text-align: ${alignment};">${formatNumber(numValue)}</td>`;
                                            }
                                        }
                                        
                                        return `<td style="text-align: ${alignment};">${value}</td>`;
                                    }).join('')}
                                    <td style="text-align: center;">
                                        <button onclick="ManualOrder.removeOrder(${index})" class="btn-remove">삭제</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div class="manual-order-summary">
                총 ${manualOrders.length}건 / 
                합계: ${formatNumber(manualOrders.reduce((sum, o) => sum + (o['정산예정금액'] || 0), 0))}원
            </div>
        `;
        
        listContainer.innerHTML = html;
    }
    
    // ===========================
    // 전화번호 포맷
    // ===========================
    function formatPhoneNumber(input) {
        let value = input.value.replace(/[^0-9]/g, '');
        
        if (value.length === 10) {
            if (value.substring(0, 2) === '02') {
                value = value.substring(0, 2) + '-' + value.substring(2, 6) + '-' + value.substring(6);
            } else {
                value = value.substring(0, 3) + '-' + value.substring(3, 6) + '-' + value.substring(6);
            }
        } else if (value.length === 11) {
            value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7);
        }
        
        input.value = value;
    }
    
    // ===========================
    // 숫자 포맷
    // ===========================
    function formatNumber(num) {
        return num.toLocaleString('ko-KR');
    }
    
    function formatNumberInput(input) {
        const value = input.value.replace(/[^0-9]/g, '');
        if (value) {
            input.value = parseInt(value).toLocaleString('ko-KR');
        }
    }
    
    // ===========================
    // 기타 함수들
    // ===========================
    function removeOrder(index) {
        if (confirm('해당 주문을 삭제하시겠습니까?')) {
            manualOrders.splice(index, 1);
            manualOrders.forEach((order, i) => {
                order['연번'] = i + 1;
                order['마켓'] = 'M' + String(i + 1).padStart(3, '0');
            });
            orderCounter = manualOrders.length;
            updateOrderList();
            saveOrders();
        }
    }
    
    function resetForm() {
        document.getElementById('manualOrderForm').reset();
        document.getElementById('manualOrderType').value = '';  // 선택필수로 초기화
        document.getElementById('manualQuantity').value = '1';
        currentOrder = {};
    }


    // ===========================
    // 수량 변경 함수 추가
    // ===========================
    function changeQuantity(delta) {
        const input = document.getElementById('manualQuantity');
        let value = parseInt(input.value) || 1;
        value = Math.max(1, value + delta);
        input.value = value;
        calculateAmount();
    }
    
    function validateQuantity() {
        const input = document.getElementById('manualQuantity');
        let value = parseInt(input.value) || 1;
        value = Math.max(1, value);
        input.value = value;
        calculateAmount();
    }
    
    function saveOrders() {
        localStorage.setItem('manualOrders', JSON.stringify(manualOrders));
    }

    
    function saveOrders() {
        localStorage.setItem('manualOrders', JSON.stringify(manualOrders));
    }
    
    function loadSavedOrders() {
        const saved = localStorage.getItem('manualOrders');
        if (saved) {
            try {
                manualOrders = JSON.parse(saved);
                orderCounter = manualOrders.length;
                updateOrderList();
            } catch (error) {
                console.error('저장된 주문 로드 실패:', error);
            }
        }
    }
    
    function hideSearchResults() {
        const resultsDiv = document.getElementById('productSearchResults');
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
        }
    }
    
    function showError(message) {
        const errorDiv = document.getElementById('manualOrderError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
    }
    
    function showSuccess(message) {
        const successDiv = document.getElementById('manualOrderSuccess');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 3000);
        }
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 퍼블릭 API
    return {
        init: init,
        selectProduct: selectProduct,
        removeOrder: removeOrder,
        changeQuantity: changeQuantity,  // 이 줄 추가
        validateQuantity: validateQuantity,  // 이 줄 추가
        getOrders: () => manualOrders,
        getProductList: () => productList,  // 추가
        clearOrders: () => {
            manualOrders = [];
            orderCounter = 0;
            updateOrderList();
            saveOrders();
        }
    };
})();

window.ManualOrder = ManualOrder;
