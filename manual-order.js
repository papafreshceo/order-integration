// ===========================
// 건별 입력 모듈
// ===========================
const ManualOrder = (function() {
    // 프라이빗 변수
    let manualOrders = [];
    let currentOrder = {};
    let orderCounter = 0;
    
    // ===========================
    // 초기화
    // ===========================
    function init() {
        setupManualOrderForm();
        loadSavedOrders();
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
        
        // 수량 변경시 금액 계산
        const quantityInput = document.getElementById('manualQuantity');
        if (quantityInput) {
            quantityInput.addEventListener('input', calculateAmount);
        }
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
            // ProductMatching 모듈의 데이터 활용
            const productData = ProductMatching.getProductData();
            const results = Object.entries(productData).filter(([key, value]) => {
                return key.toLowerCase().includes(query.toLowerCase());
            }).slice(0, 10);
            
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
                <div class="search-result-item" onclick="ManualOrder.selectProduct('${optionName}')">
                    <span class="result-name">${optionName}</span>
                    <span class="result-vendor">${data.벤더사 || '자사'}</span>
                </div>
            `;
        }).join('');
        
        resultsDiv.style.display = 'block';
    }
    
    // ===========================
    // 상품 선택
    // ===========================
    function selectProduct(optionName) {
        const productData = ProductMatching.getProductData();
        const priceData = ProductMatching.getPriceData();
        
        const product = productData[optionName];
        const price = priceData[optionName];
        
        if (product) {
            document.getElementById('manualOptionName').value = optionName;
            document.getElementById('manualVendor').value = product.벤더사 || '';
            document.getElementById('manualShipFrom').value = product.출고처 || '';
            
            if (price) {
                document.getElementById('manualUnitPrice').value = price.sellerSupplyPrice || 0;
                calculateAmount();
            }
        }
        
        currentOrder.product = product;
        currentOrder.optionName = optionName;
        
        hideSearchResults();
        document.getElementById('manualProductSearch').value = optionName;
    }
    
    // ===========================
    // 금액 계산
    // ===========================
    function calculateAmount() {
        const quantity = parseInt(document.getElementById('manualQuantity').value) || 0;
        const unitPrice = parseFloat(document.getElementById('manualUnitPrice').value) || 0;
        const totalAmount = quantity * unitPrice;
        
        document.getElementById('manualTotalAmount').value = totalAmount.toLocaleString('ko-KR');
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
        return {
            '옵션명': document.getElementById('manualOptionName').value,
            '수량': document.getElementById('manualQuantity').value,
            '주문번호': 'M' + Date.now(),
            '주문자': document.getElementById('manualOrderer').value,
            '주문자전화번호': document.getElementById('manualOrdererPhone').value,
            '수령인': document.getElementById('manualReceiver').value,
            '수령인전화번호': document.getElementById('manualReceiverPhone').value,
            '수령인주소': document.getElementById('manualAddress').value,
            '배송메시지': document.getElementById('manualDeliveryMsg').value,
            '셀러': document.getElementById('manualSeller').value,
            '벤더사': document.getElementById('manualVendor').value,
            '출고처': document.getElementById('manualShipFrom').value,
            '정산예정금액': parseFloat(document.getElementById('manualTotalAmount').value.replace(/,/g, '')) || 0
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
        
        if (!orderData['주문자'] || orderData['주문자'].length < 2) {
            showError('주문자명을 2자 이상 입력해주세요.');
            return false;
        }
        
        if (!orderData['수령인'] || orderData['수령인'].length < 2) {
            showError('수령인명을 2자 이상 입력해주세요.');
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
                        <th>옵션명</th>
                        <th>수량</th>
                        <th>주문자</th>
                        <th>수령인</th>
                        <th>금액</th>
                        <th>삭제</th>
                    </tr>
                </thead>
                <tbody>
                    ${manualOrders.map((order, index) => `
                        <tr>
                            <td>${order['연번']}</td>
                            <td>${order['옵션명']}</td>
                            <td>${order['수량']}</td>
                            <td>${order['주문자']}</td>
                            <td>${order['수령인']}</td>
                            <td>${order['정산예정금액'].toLocaleString('ko-KR')}원</td>
                            <td>
                                <button onclick="ManualOrder.removeOrder(${index})" class="btn-remove">삭제</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="manual-order-summary">
                총 ${manualOrders.length}건 / 
                합계: ${manualOrders.reduce((sum, o) => sum + o['정산예정금액'], 0).toLocaleString('ko-KR')}원
            </div>
        `;
    }
    
    // ===========================
    // 주문 삭제
    // ===========================
    function removeOrder(index) {
        if (confirm('해당 주문을 삭제하시겠습니까?')) {
            manualOrders.splice(index, 1);
            
            // 연번 재정렬
            manualOrders.forEach((order, i) => {
                order['연번'] = i + 1;
                order['마켓'] = 'M' + String(i + 1).padStart(3, '0');
            });
            
            orderCounter = manualOrders.length;
            updateOrderList();
            saveOrders();
        }
    }
    
    // ===========================
    // 폼 초기화
    // ===========================
    function resetForm() {
        document.getElementById('manualOrderForm').reset();
        currentOrder = {};
    }
    
    // ===========================
    // 로컬 저장/불러오기
    // ===========================
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
    
    // ===========================
    // 유틸리티 함수
    // ===========================
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
    
    // ===========================
    // 퍼블릭 API
    // ===========================
    return {
        init: init,
        selectProduct: selectProduct,
        removeOrder: removeOrder,
        getOrders: () => manualOrders,
        clearOrders: () => {
            manualOrders = [];
            orderCounter = 0;
            updateOrderList();
            saveOrders();
        }
    };
})();

// 전역 노출
window.ManualOrder = ManualOrder;
