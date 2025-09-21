<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>주문입력 모듈</title>
    
    <style>
        /* 기본 스타일 */
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #f8f9fa;
        }
        
        .section-container {
            background: #ffffff;
            border-radius: 8px;
            border: 1px solid #dee2e6;
            margin-bottom: 20px;
        }
        
        .section-title {
            padding: 20px;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .section-title-text {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 18px;
            font-weight: 500;
            color: #212529;
        }
        
        .manual-order-section {
            padding: 20px;
        }
        
        /* 폼 스타일 */
        .manual-order-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .form-row-table {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .form-group-wrapper {
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        
        .form-group label {
            font-size: 12px;
            font-weight: 400;
            color: #6c757d;
        }
        
        .required {
            color: #dc3545;
        }
        
        .form-input-direct,
        .form-input-readonly {
            padding: 8px 12px;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 300;
            transition: all 0.2s;
        }
        
        .form-input-readonly {
            background: #f8f9fa;
            cursor: not-allowed;
        }
        
        .form-input-direct:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        
        .text-center {
            text-align: center !important;
        }
        
        .text-right {
            text-align: right !important;
        }
        
        /* 수량 컨트롤 */
        .quantity-control {
            display: flex;
            align-items: center;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .qty-btn {
            width: 24px;
            height: 32px;
            border: none;
            background: #f8f9fa;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        
        .qty-btn:hover {
            background: #e9ecef;
        }
        
        .qty-input {
            width: 32px;
            border: none;
            text-align: center;
            font-size: 14px;
            font-weight: 300;
        }
        
        /* 버튼 스타일 */
        .btn-add-order {
            padding: 10px 24px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 400;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-add-order:hover {
            background: #1d4ed8;
        }
        
        .btn-search-address {
            padding: 8px 16px;
            background: #ffffff;
            color: #2563eb;
            border: 1px solid #2563eb;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 400;
            white-space: nowrap;
            transition: all 0.2s;
        }
        
        .btn-search-address:hover {
            background: #e7f3ff;
            border-color: #1d4ed8;
        }
        
        /* 검색 결과 */
        .search-results {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            max-height: 200px;
            overflow-y: auto;
            z-index: 100;
            display: none;
        }
        
        .search-results.show {
            display: block;
        }
        
        .search-item {
            padding: 10px;
            cursor: pointer;
            border-bottom: 1px solid #f1f3f5;
            font-size: 13px;
        }
        
        .search-item:hover {
            background: #f8f9fa;
        }
        
        /* 메시지 */
        .error-message,
        .success-message {
            padding: 12px;
            border-radius: 4px;
            margin: 16px 0;
            display: none;
            font-size: 14px;
        }
        
        .error-message {
            background: #fee2e2;
            color: #dc3545;
            border: 1px solid #fecaca;
        }
        
        .success-message {
            background: #d1fae5;
            color: #10b981;
            border: 1px solid #a7f3d0;
        }
        
        .error-message.show,
        .success-message.show {
            display: block;
        }
        
        /* 주문 리스트 */
        .manual-order-list {
            margin-top: 20px;
        }
        
        .empty-list {
            text-align: center;
            padding: 40px;
            color: #6c757d;
            font-size: 14px;
        }
        
        .order-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 6px;
            margin-bottom: 8px;
        }
        
        .order-info {
            display: flex;
            gap: 20px;
            font-size: 13px;
        }
        
        .order-label {
            color: #6c757d;
        }
        
        .order-value {
            color: #212529;
            font-weight: 400;
        }
        
        .btn-remove {
            padding: 4px 12px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .btn-remove:hover {
            background: #c82333;
        }
        
        /* 하단 버튼 그룹 */
        .form-row-bottom {
            display: flex;
            gap: 20px;
            align-items: flex-end;
        }
        
        /* 주소 모달 */
        .address-modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        
        .address-modal.show {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .address-modal-content {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            width: 500px;
            max-width: 90%;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        
        .address-modal-header {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #dee2e6;
        }
        
        .address-modal-header h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 500;
            color: #212529;
        }
        
        .address-display {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .address-display label {
            font-weight: 400;
            color: #495057;
            display: inline-block;
            min-width: 70px;
        }
        
        .modal-btn {
            padding: 8px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 400;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .modal-btn-primary {
            background: #2563eb;
            color: white;
        }
        
        .modal-btn-primary:hover {
            background: #1d4ed8;
        }
        
        .modal-btn-secondary {
            background: #e9ecef;
            color: #495057;
        }
        
        .modal-btn-secondary:hover {
            background: #dee2e6;
        }
        
        .address-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
    </style>
</head>
<body>
    <div class="section-container">
        <div class="section-title">
            <div class="section-title-text">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z"></path>
                    <path d="M2 17L12 22L22 17"></path>
                    <path d="M2 12L12 17L22 12"></path>
                </svg>
                건별 입력
            </div>
        </div>
        
        <div class="manual-order-section">
            <form id="manualOrderForm" class="manual-order-form">
                <div class="form-row-table">
                    <!-- 1묶음: 구분 -->
                    <div class="form-group-wrapper">
                        <div class="form-group" style="width: 100px;">
                            <label>구분 <span class="required">*</span></label>
                            <select id="manualOrderType" class="form-input-direct">
                                <option value="" style="color: #dc3545;">선택필수</option>
                                <option value="CS발송">CS발송</option>
                                <option value="전화주문">전화주문</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- 2묶음: 상품 관련 -->
                    <div class="form-group-wrapper">
                        <div class="form-group" style="width: 150px;">
                            <label>상품 검색</label>
                            <div style="position: relative;">
                                <input type="text" id="manualProductSearch" class="form-input-direct" placeholder="검색...">
                                <div id="productSearchResults" class="search-results"></div>
                            </div>
                        </div>
                        <div class="form-group" style="width: 200px;">
                            <label>옵션명 <span class="required">*</span></label>
                            <input type="text" id="manualOptionName" class="form-input-readonly" readonly>
                        </div>
                        <div class="form-group" style="width: 90px;">
                            <label>단가 <span class="required">*</span></label>
                            <input type="text" id="manualUnitPrice" class="form-input-direct text-right">
                        </div>
                        <div class="form-group" style="width: 80px;">
                            <label>수량 <span class="required">*</span></label>
                            <div class="quantity-control">
                                <button type="button" class="qty-btn qty-minus" onclick="changeQuantity(-1)">−</button>
                                <input type="text" id="manualQuantity" value="1" class="qty-input text-center" onchange="validateQuantity()">
                                <button type="button" class="qty-btn qty-plus" onclick="changeQuantity(1)">+</button>
                            </div>
                        </div>
                        <div class="form-group" style="width: 90px;">
                            <label>택배비</label>
                            <input type="text" id="manualShippingCost" class="form-input-direct text-right" placeholder="0">
                        </div>
                        <div class="form-group" style="width: 90px;">
                            <label>기타비용</label>
                            <input type="text" id="manualExtraCost" class="form-input-direct text-right" placeholder="0">
                        </div>
                        <div class="form-group" style="width: 120px;">
                            <label>금액</label>
                            <input type="text" id="manualTotalAmount" class="form-input-readonly text-right" readonly>
                        </div>
                    </div>
                    
                    <!-- 3묶음: 주문자/수령인 정보 -->
                    <div class="form-group-wrapper">
                        <div class="form-group" style="width: 80px;">
                            <label>주문자</label>
                            <input type="text" id="manualOrderer" class="form-input-direct text-center">
                        </div>
                        <div class="form-group" style="width: 120px;">
                            <label>주문자 전화번호</label>
                            <input type="tel" id="manualOrdererPhone" class="form-input-direct text-center" placeholder="010-0000-0000">
                        </div>
                        <div class="form-group" style="width: 80px;">
                            <label>수령인 <span class="required">*</span></label>
                            <input type="text" id="manualReceiver" class="form-input-direct text-center" required>
                        </div>
                        <div class="form-group" style="width: 120px;">
                            <label>수령인 전화번호 <span class="required">*</span></label>
                            <input type="tel" id="manualReceiverPhone" class="form-input-direct text-center" placeholder="010-0000-0000" required>
                        </div>
                        <div class="form-group" style="width: 700px;">
                            <label>주소 <span class="required">*</span></label>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="manualAddress" class="form-input-readonly" readonly required style="flex: 1;">
                                <button type="button" onclick="searchAddress()" class="btn-search-address">주소검색</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 배송 메시지 및 주문 추가 버튼 -->
                <div class="form-row-bottom">
                    <div class="form-group" style="width: 500px;">
                        <label>배송 메시지</label>
                        <input type="text" id="manualDeliveryMsg" class="form-input-direct">
                    </div>
                    <div class="form-group">
                        <button type="button" id="addManualOrder" class="btn-add-order" onclick="addOrder()">주문 추가</button>
                    </div>
                </div>
            </form>
            
            <div id="manualOrderError" class="error-message"></div>
            <div id="manualOrderSuccess" class="success-message"></div>
            
            <div id="manualOrderList" class="manual-order-list">
                <div class="empty-list">추가된 주문이 없습니다</div>
            </div>
        </div>
    </div>
    
    <!-- 주소 모달 -->
    <div id="addressModal" class="address-modal">
        <div class="address-modal-content">
            <div class="address-modal-header">
                <h3>주소 상세 입력</h3>
            </div>
            <div class="address-modal-body">
                <div class="address-display">
                    <div><label>우편번호:</label> <span id="modalZipcode"></span></div>
                    <div><label>주소:</label> <span id="modalAddress"></span></div>
                </div>
                <div class="form-group">
                    <label>상세주소 입력</label>
                    <input type="text" id="modalAddressDetail" class="form-input-direct" placeholder="동/호수 등을 입력하세요" style="width: 100%;">
                </div>
            </div>
            <div class="address-modal-footer">
                <button type="button" class="modal-btn modal-btn-secondary" onclick="cancelAddressModal()">취소</button>
                <button type="button" class="modal-btn modal-btn-primary" onclick="confirmAddress()">확인</button>
            </div>
        </div>
    </div>
    
    <!-- Daum 우편번호 서비스 -->
    <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
    
    <script>
        // 전역 변수
        let manualOrders = [];
        let tempAddressData = {};
        let productData = {};
        
        // 초기화
        document.addEventListener('DOMContentLoaded', async function() {
            await loadProductData();
            setupEventListeners();
        });
        
        // 제품 데이터 로드
        async function loadProductData() {
            try {
                const response = await fetch('/api/sheets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getProductData'
                    })
                });
                
                const result = await response.json();
                if (result.productData) {
                    productData = result.productData;
                }
            } catch (error) {
                console.error('제품 데이터 로드 실패:', error);
            }
        }
        
        // 이벤트 리스너 설정
        function setupEventListeners() {
            // 상품 검색
            document.getElementById('manualProductSearch').addEventListener('input', searchProduct);
            
            // 가격 계산
            document.getElementById('manualUnitPrice').addEventListener('input', calculateTotal);
            document.getElementById('manualQuantity').addEventListener('input', calculateTotal);
            document.getElementById('manualShippingCost').addEventListener('input', calculateTotal);
            document.getElementById('manualExtraCost').addEventListener('input', calculateTotal);
            
            // 모달 외부 클릭시 닫기
            document.getElementById('addressModal').addEventListener('click', function(e) {
                if (e.target === this) {
                    cancelAddressModal();
                }
            });
            
            // 엔터키로 확인
            document.getElementById('modalAddressDetail').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmAddress();
                }
            });
        }
        
        // 상품 검색
        function searchProduct() {
            const keyword = this.value.toLowerCase();
            const results = document.getElementById('productSearchResults');
            
            if (keyword.length < 2) {
                results.classList.remove('show');
                return;
            }
            
            const matches = Object.keys(productData).filter(name => 
                name.toLowerCase().includes(keyword)
            ).slice(0, 10);
            
            if (matches.length > 0) {
                results.innerHTML = matches.map(name => 
                    `<div class="search-item" onclick="selectProduct('${name}')">${name}</div>`
                ).join('');
                results.classList.add('show');
            } else {
                results.classList.remove('show');
            }
        }
        
        // 상품 선택
        function selectProduct(productName) {
            document.getElementById('manualOptionName').value = productName;
            document.getElementById('productSearchResults').classList.remove('show');
            document.getElementById('manualProductSearch').value = '';
            
            // 제품 정보 적용
            if (productData[productName]) {
                const info = productData[productName];
                if (info['셀러공급가']) {
                    document.getElementById('manualUnitPrice').value = info['셀러공급가'];
                    calculateTotal();
                }
            }
        }
        
        // 수량 변경
        function changeQuantity(delta) {
            const input = document.getElementById('manualQuantity');
            const current = parseInt(input.value) || 1;
            const newValue = Math.max(1, current + delta);
            input.value = newValue;
            calculateTotal();
        }
        
        function validateQuantity() {
            const input = document.getElementById('manualQuantity');
            const value = parseInt(input.value) || 1;
            input.value = Math.max(1, value);
            calculateTotal();
        }
        
        // 총액 계산
        function calculateTotal() {
            const unitPrice = parseFloat(document.getElementById('manualUnitPrice').value) || 0;
            const quantity = parseInt(document.getElementById('manualQuantity').value) || 1;
            const shipping = parseFloat(document.getElementById('manualShippingCost').value) || 0;
            const extra = parseFloat(document.getElementById('manualExtraCost').value) || 0;
            
            const total = (unitPrice * quantity) + shipping + extra;
            document.getElementById('manualTotalAmount').value = total.toLocaleString('ko-KR');
        }
        
        // 주소 검색
        function searchAddress() {
            new daum.Postcode({
                oncomplete: function(data) {
                    tempAddressData.zonecode = data.zonecode;
                    tempAddressData.address = data.roadAddress || data.jibunAddress;
                    
                    if(data.buildingName !== '') {
                        tempAddressData.address += ' (' + data.buildingName + ')';
                    }
                    
                    document.getElementById('modalZipcode').textContent = tempAddressData.zonecode;
                    document.getElementById('modalAddress').textContent = tempAddressData.address;
                    document.getElementById('modalAddressDetail').value = '';
                    document.getElementById('addressModal').classList.add('show');
                    
                    setTimeout(() => {
                        document.getElementById('modalAddressDetail').focus();
                    }, 100);
                }
            }).open();
        }
        
        // 주소 확인
        function confirmAddress() {
            const detailAddress = document.getElementById('modalAddressDetail').value.trim();
            
            let fullAddress = tempAddressData.address;
            if (detailAddress) {
                fullAddress += ' ' + detailAddress;
            }
            
            document.getElementById('manualAddress').value = fullAddress;
            document.getElementById('addressModal').classList.remove('show');
            
            const deliveryMsg = document.getElementById('manualDeliveryMsg');
            if (deliveryMsg) {
                deliveryMsg.focus();
            }
        }
        
        // 주소 취소
        function cancelAddressModal() {
            document.getElementById('addressModal').classList.remove('show');
            tempAddressData = {};
        }
        
        // 주문 추가
        function addOrder() {
            // 유효성 검사
            const orderType = document.getElementById('manualOrderType').value;
            const optionName = document.getElementById('manualOptionName').value;
            const unitPrice = document.getElementById('manualUnitPrice').value;
            const receiver = document.getElementById('manualReceiver').value;
            const receiverPhone = document.getElementById('manualReceiverPhone').value;
            const address = document.getElementById('manualAddress').value;
            
            if (!orderType) {
                showError('구분을 선택해주세요.');
                return;
            }
            
            if (!optionName || !unitPrice) {
                showError('상품 정보를 입력해주세요.');
                return;
            }
            
            if (!receiver || !receiverPhone || !address) {
                showError('수령인 정보를 모두 입력해주세요.');
                return;
            }
            
            // 주문 데이터 생성
            const orderData = {
                마켓명: orderType,
                옵션명: optionName,
                단가: parseFloat(unitPrice),
                수량: parseInt(document.getElementById('manualQuantity').value) || 1,
                택배비: parseFloat(document.getElementById('manualShippingCost').value) || 0,
                기타비용: parseFloat(document.getElementById('manualExtraCost').value) || 0,
                주문자: document.getElementById('manualOrderer').value || receiver,
                '주문자 전화번호': document.getElementById('manualOrdererPhone').value || receiverPhone,
                수령인: receiver,
                '수령인 전화번호': receiverPhone,
                주소: address,
                배송메세지: document.getElementById('manualDeliveryMsg').value,
                _isManual: true
            };
            
            // 총액 계산
            orderData['상품금액'] = (orderData.단가 * orderData.수량) + orderData.택배비 + orderData.기타비용;
            
            // 리스트에 추가
            manualOrders.push(orderData);
            updateOrderList();
            
            // 폼 초기화
            resetForm();
            
            showSuccess(`주문이 추가되었습니다. (총 ${manualOrders.length}건)`);
        }
        
        // 주문 목록 업데이트
        function updateOrderList() {
            const list = document.getElementById('manualOrderList');
            
            if (manualOrders.length === 0) {
                list.innerHTML = '<div class="empty-list">추가된 주문이 없습니다</div>';
                return;
            }
            
            list.innerHTML = manualOrders.map((order, index) => `
                <div class="order-item">
                    <div class="order-info">
                        <div><span class="order-label">구분:</span> <span class="order-value">${order.마켓명}</span></div>
                        <div><span class="order-label">상품:</span> <span class="order-value">${order.옵션명}</span></div>
                        <div><span class="order-label">수량:</span> <span class="order-value">${order.수량}</span></div>
                        <div><span class="order-label">수령인:</span> <span class="order-value">${order.수령인}</span></div>
                        <div><span class="order-label">금액:</span> <span class="order-value">${order.상품금액.toLocaleString('ko-KR')}원</span></div>
                    </div>
                    <button class="btn-remove" onclick="removeOrder(${index})">삭제</button>
                </div>
            `).join('');
        }
        
        // 주문 삭제
        function removeOrder(index) {
            manualOrders.splice(index, 1);
            updateOrderList();
            showSuccess(`주문이 삭제되었습니다. (남은 주문: ${manualOrders.length}건)`);
        }
        
        // 폼 초기화
        function resetForm() {
            document.getElementById('manualOrderForm').reset();
            document.getElementById('manualQuantity').value = '1';
            document.getElementById('manualTotalAmount').value = '';
        }
        
        // 메시지 표시
        function showError(message) {
            const el = document.getElementById('manualOrderError');
            el.textContent = message;
            el.classList.add('show');
            setTimeout(() => el.classList.remove('show'), 3000);
        }
        
        function showSuccess(message) {
            const el = document.getElementById('manualOrderSuccess');
            el.textContent = message;
            el.classList.add('show');
            setTimeout(() => el.classList.remove('show'), 3000);
        }
        
        // 부모 창에서 호출할 수 있는 함수
        window.getManualOrders = function() {
            return manualOrders;
        };
        
        window.clearManualOrders = function() {
            manualOrders = [];
            updateOrderList();
        };
    </script>
</body>
</html>