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
        // 매핑 데이터 로드 후 실행
        setTimeout(() => {
            loadSavedOrders();
            loadProductData();
        }, 1000);
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
        
        const orderData = {
            '구분': document.getElementById('manualOrderType').value,
            '옵션명': document.getElementById('manualOptionName').value,
            '단가': unitPrice,
            '수량': quantity,
            '택배비': shippingCost,
            '기타비용': extraCost,
            '주문번호': 'M' + Date.now(),
            '정산예정금액': (unitPrice * quantity) + shippingCost + extraCost,
            '셀러': ''
        };
        
        // 주문자 정보
        const ordererName = document.getElementById('manualOrderer').value;
        const ordererPhone = document.getElementById('manualOrdererPhone').value;
        orderData['주문자'] = ordererName;
        orderData['주문자전화번호'] = ordererPhone;
        orderData['주문자 전화번호'] = ordererPhone;  // 공백 있는 버전도 추가
        
        // 수령인 정보 (수취인, 수령인 모두 매핑)
        const receiverName = document.getElementById('manualReceiver').value;
        const receiverPhone = document.getElementById('manualReceiverPhone').value;
        const address = document.getElementById('manualAddress').value;
        const zipcode = document.getElementById('manualZipcode') ? document.getElementById('manualZipcode').value : '';
        const deliveryMsg = document.getElementById('manualDeliveryMsg').value;
        
        // 수령인 관련 필드 모두 매핑
        orderData['수령인'] = receiverName;
        orderData['수취인'] = receiverName;
        orderData['수령인전화번호'] = receiverPhone;
        orderData['수령인 전화번호'] = receiverPhone;  // 공백 있는 버전
        orderData['수취인전화번호'] = receiverPhone;
        orderData['수취인 전화번호'] = receiverPhone;  // 공백 있는 버전
        orderData['수령인주소'] = address;
        orderData['수취인주소'] = address;
        orderData['주소'] = address;
        orderData['우편번호'] = zipcode;
        orderData['배송메시지'] = deliveryMsg;
        orderData['배송메세지'] = deliveryMsg;  // 다른 표기법도 추가
        
        return orderData;
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
        // OrderTable 모듈 사용
        if (window.OrderTable) {
            OrderTable.render('manualOrderList', manualOrders, {
                showDelete: true,
                onDelete: 'ManualOrder.removeOrder',
                showSummary: true,
                showSaveButton: true,
                onSave: 'ManualOrder.saveToSheets',
                maxHeight: '400px'
            });
        } else {
            console.error('OrderTable 모듈이 로드되지 않았습니다.');
            const listContainer = document.getElementById('manualOrderList');
            if (listContainer) {
                listContainer.innerHTML = '<div class="error-message">테이블 모듈을 로드 중입니다...</div>';
            }
        }
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
        changeQuantity: changeQuantity,
        validateQuantity: validateQuantity,
        getOrders: () => manualOrders,
        getProductList: () => productList,
        clearOrders: () => {
            manualOrders = [];
            orderCounter = 0;
            updateOrderList();
            saveOrders();
        },
        saveToSheets: async function() {
            if (manualOrders.length === 0) {
                showError('저장할 주문이 없습니다.');
                return;
            }
            
            // showLoading 함수 사용
            if (window.showLoading) window.showLoading();
            
            try {
                // 오늘 날짜로 시트명 생성
                const today = new Date();
                const sheetName = today.getFullYear() + 
                                 String(today.getMonth() + 1).padStart(2, '0') + 
                                 String(today.getDate()).padStart(2, '0');
                
                // 헤더 행 생성
                const headers = window.mappingData.standardFields;
                const values = [headers];
                
                // 데이터 행 추가
                manualOrders.forEach(order => {
                    const row = headers.map(header => {
                        const value = order[header];
                        return value !== undefined && value !== null ? String(value) : '';
                    });
                    values.push(row);
                });
                
                // 마켓 색상 정보
                const marketColors = {};
                if (window.mappingData && window.mappingData.markets) {
                    Object.entries(window.mappingData.markets).forEach(([marketName, market]) => {
                        if (market.color) {
                            const rgb = market.color.split(',').map(Number);
                            const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
                            marketColors[marketName] = {
                                color: market.color,
                                textColor: brightness > 128 ? '#000' : '#fff'
                            };
                        }
                    });
                }
                
                // API 호출
                const response = await fetch('/api/sheets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'saveToSheet',
                        sheetName: sheetName,
                        values: values,
                        marketColors: marketColors
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showSuccess(`${manualOrders.length}건의 주문이 "${sheetName}" 시트에 저장되었습니다.`);
                    
                    // 저장 후 초기화 여부 확인
                    if (confirm('저장이 완료되었습니다. 주문 목록을 초기화하시겠습니까?')) {
                        manualOrders = [];
                        orderCounter = 0;
                        updateOrderList();
                        saveOrders();
                    }
                } else {
                    showError('저장 실패: ' + (result.error || '알 수 없는 오류'));
                }
                
            } catch (error) {
                console.error('저장 오류:', error);
                showError('저장 중 오류가 발생했습니다.');
            } finally {
                if (window.hideLoading) window.hideLoading();
            }
        }
    };
})();

window.ManualOrder = ManualOrder;
