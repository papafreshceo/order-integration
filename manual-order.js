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
                const searchText = `${data.품목 || ''} ${data.품종 || ''} ${optionName}`.toLowerCase();
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
            const [name, data] = productData;
            
            // 옵션명 설정
            document.getElementById('manualOptionName').value = name;
            
            // 셀러공급가를 단가로 설정 (수정 가능)
            const priceData = ProductMatching.getPriceData();
            if (priceData && priceData[name]) {
                const unitPrice = priceData[name].sellerSupplyPrice || 0;
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
        
        const unitPrice = parseFloat(unitPriceStr.replace(/,/g, '')) || 0;
        const totalAmount = quantity * unitPrice;
        
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
        orderData['마켓명'] = '건별입력';
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
        
        return {
            '구분': document.getElementById('manualOrderType').value,
            '옵션명': document.getElementById('manualOptionName').value,
            '단가': unitPrice,
            '수량': quantity,
            '주문번호': 'M' + Date.now(),
            '주문자': document.getElementById('manualOrderer').value,
            '주문자전화번호': document.getElementById('manualOrdererPhone').value,
            '수령인': document.getElementById('manualReceiver').value,
            '수령인전화번호': document.getElementById('manualReceiverPhone').value,
            '수령인주소': document.getElementById('manualAddress').value,
            '배송메시지': document.getElementById('manualDeliveryMsg').value,
            '정산예정금액': unitPrice * quantity,
            '셀러': ''
        };
    }
    
    // ===========================
    // 유효성 검사
    // ===========================
    function validateOrder(orderData) {
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
        
        listContainer.innerHTML = `
            <table class="manual-order-table">
                <thead>
                    <tr>
                        <th>연번</th>
                        <th>구분</th>
                        <th>옵션명</th>
                        <th>단가</th>
                        <th>수량</th>
                        <th>금액</th>
                        <th>수령인</th>
                        <th>삭제</th>
                    </tr>
                </thead>
                <tbody>
                    ${manualOrders.map((order, index) => `
                        <tr>
                            <td>${order['연번']}</td>
                            <td>${order['구분']}</td>
                            <td>${order['옵션명']}</td>
                            <td style="text-align: right;">${formatNumber(order['단가'])}원</td>
                            <td style="text-align: center;">${order['수량']}</td>
                            <td style="text-align: right;">${formatNumber(order['정산예정금액'])}원</td>
                            <td>${order['수령인']}</td>
                            <td>
                                <button onclick="ManualOrder.removeOrder(${index})" class="btn-remove">삭제</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="manual-order-summary">
                총 ${manualOrders.length}건 / 
                합계: ${formatNumber(manualOrders.reduce((sum, o) => sum + o['정산예정금액'], 0))}원
            </div>
        `;
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
        document.getElementById('manualOrderType').value = 'CS재발송';
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
