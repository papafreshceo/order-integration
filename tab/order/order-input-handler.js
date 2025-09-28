window.OrderInputHandler = {
    manualOrders: [],
    tempAddressData: {},
    productData: {},
    
    async init() {
        this.render();
        await this.loadProductData();
        this.setupEventListeners();
        await this.loadTempOrders(); // 임시저장 자동 불러오기
        console.log('OrderInputHandler 초기화 완료');
    },
    
    render() {
        const container = document.getElementById('om-panel-input');
        if (!container) return;
        
        container.innerHTML = `
            <style>
                .input-container {
                    padding: 0;
                    background: transparent;
                }

                .panel-header {
                    background: #ffffff;
                    padding: 24px;
                    border: 1px solid #dee2e6;
                    border-radius: 8px 8px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .panel-title {
                    font-size: 18px;
                    font-weight: 500;
                    color: #042848;
                    margin: 0;
                }

                .input-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-top: none;
                    border-radius: 0 0 8px 8px;
                    padding: 24px;
                    margin-bottom: 24px;
                }

                .form-row {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 16px;
                    align-items: flex-end;
                    flex-wrap: wrap;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-label {
                    font-size: 12px;
                    font-weight: 300;
                    color: #6c757d;
                }

                .form-input {
                    padding: 8px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    color: #042848;
                    background: #ffffff;
                    transition: all 0.2s;
                    height: 32px;
                }

.form-input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* 숫자 입력란 스핀버튼 제거 */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

input[type="number"] {
    -moz-appearance: textfield;
}

.form-input[readonly] {
    background: #f8f9fa;
    cursor: not-allowed;
}

.required {
    color: #dc3545;
}

.quantity-control {
    display: flex;
    align-items: center;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    overflow: hidden;
    background: #ffffff;
    height: 32px;
}

                .qty-btn {
                    width: 30px;
                    height: 32px;
                    border: none;
                    background: #f8f9fa;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .qty-btn:hover {
                    background: #e9ecef;
                }

                .qty-input {
                    width: 40px;
                    height: 32px;
                    border: none;
                    text-align: center;
                    font-size: 14px;
                    font-weight: 300;
                }

                .btn-add {
                    padding: 10px 24px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    background: #2563eb;
                    color: #ffffff;
                    height: 32px;
                    display: flex;
                    align-items: center;
                }

                .btn-add:hover {
                    background: #1d4ed8;
                }

                .btn-search-address {
                    padding: 8px 16px;
                    background: #ffffff;
                    color: #2563eb;
                    border: 1px solid #2563eb;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 300;
                    white-space: nowrap;
                    transition: all 0.2s;
                    height: 32px;
                    display: flex;
                    align-items: center;  /* 텍스트 수직 중앙 정렬 추가 */
                }

                .btn-search-address:hover {
                    background: #f0f8ff;
                    border-color: #1d4ed8;
                }

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
                    margin-top: 2px;
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

                .order-list-section {
                    background: #ffffff;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .list-header {
                    padding: 16px 24px;
                    border-bottom: 1px solid #dee2e6;
                    background: #f8f9fa;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .list-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: #042848;
                }

                #inputOrderList {
                    overflow-x: auto;
                    overflow-y: auto;
                    max-height: 400px;
                }
                
                .order-table {
                    width: 1800px !important;
                    min-width: 1800px !important;
                }
                
                .order-table tbody tr {
                    position: relative;
                }
                
                .order-table tbody tr:hover {
                    background: #f0f8ff !important;
                }

                .order-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
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
                    font-weight: 300;
                }

                .order-value {
                    color: #042848;
                    font-weight: 400;
                }

                .btn-remove {
                    padding: 6px 12px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 300;
                    transition: all 0.2s;
                }

                .btn-remove:hover {
                    background: #c82333;
                }

                .empty-message {
                    padding: 40px;
                    text-align: center;
                    color: #6c757d;
                    font-size: 14px;
                }
                
                .loading-message {
                    padding: 40px;
                    text-align: center;
                    color: #2563eb;
                    font-size: 14px;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }

                .message-box {
                    padding: 12px 16px;
                    border-radius: 6px;
                    margin: 16px 0;
                    display: none;
                    font-size: 14px;
                    font-weight: 300;
                }

                .message-box.error {
                    background: #fee2e2;
                    color: #dc3545;
                    border: 1px solid #fecaca;
                }

                .message-box.success {
                    background: #d1fae5;
                    color: #10b981;
                    border: 1px solid #a7f3d0;
                }

                .message-box.show {
                    display: block;
                }
                
                .message-box.info {
                    background: #dbeafe;
                    color: #2563eb;
                    border: 1px solid #93c5fd;
                }
                
                .message-box.lime {
                    background: #ecfccb;
                    color: #84cc16;
                    border: 1px solid #bef264;
                }

                .address-modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                }

                .address-modal.show {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .address-modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: 16px;
                    width: 500px;
                    max-width: 90%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }

                .modal-header {
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #dee2e6;
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 500;
                    color: #042848;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                }

                .btn-modal {
                    padding: 8px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-modal.secondary {
                    background: #e9ecef;
                    color: #495057;
                }

                .btn-modal.primary {
                    background: #2563eb;
                    color: white;
                }

                .btn-modal:hover {
                    opacity: 0.9;
                }


                /* 커스텀 툴팁 스타일 */
                .custom-tooltip {
                    position: fixed;
                    background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #e5e7eb 100%);
                    color: #1f2937;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #d1d5db;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                    z-index: 10000;
                    display: none;
                    min-width: 320px;
                    backdrop-filter: blur(10px);
                    animation: tooltipFadeIn 0.3s ease;
                }

                @keyframes tooltipFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .custom-tooltip.show {
                    display: block;
                }

                .tooltip-header {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                }

                .tooltip-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
                    font-size: 14px;
                }

                .tooltip-label {
                    opacity: 0.9;
                    font-weight: 300;
                }

                .tooltip-value {
                    font-weight: 500;
                    text-align: right;
                }

                .tooltip-amount {
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid rgba(255,255,255,0.2);
                    font-size: 18px;
                    font-weight: 600;
                    text-align: right;
                }

            </style>
            
            <div class="input-container">
                <div class="panel-header">
                    <h2 class="panel-title">건별 주문 입력</h2>
                </div>

                <div class="input-section">
                    <form id="inputOrderForm">
                    <!-- 첫 번째 행: 구분, 상품 정보 -->
<div class="form-row">
    <div class="form-group" style="width: 120px;">
        <label class="form-label">구분 <span class="required">*</span></label>
        <select class="form-input" id="inputOrderType">
    <option value="전화주문" selected>전화주문</option>
    <option value="기타">기타</option>
</select>
    </div>
    
    <div class="form-group" style="width: 200px;">
        <label class="form-label">상품 검색</label>
        <div style="position: relative;">
            <input type="text" class="form-input" id="inputProductSearch" placeholder="품종/품목/옵션명 검색">
            <div id="optionSearchResults" class="search-results"></div>
        </div>
    </div>
    
    <div class="form-group" style="width: 250px;">
        <label class="form-label">옵션명 <span class="required">*</span></label>
        <input type="text" class="form-input" id="inputOptionName" readonly style="background: #f8f9fa;">
    </div>
    
    <div class="form-group" style="width: 100px;">
    <label class="form-label">단가 <span class="required">*</span></label>
    <input type="text" class="form-input" id="inputUnitPrice" style="text-align: right;">
</div>
    
    <div class="form-group" style="width: 100px;">
        <label class="form-label">수량 <span class="required">*</span></label>
        <div class="quantity-control">
            <button type="button" class="qty-btn" onclick="OrderInputHandler.changeQuantity(-1)">−</button>
            <input type="number" class="qty-input" id="inputQuantity" value="1" min="1">
            <button type="button" class="qty-btn" onclick="OrderInputHandler.changeQuantity(1)">+</button>
        </div>
    </div>
    
    <div class="form-group" style="width: 100px;">
    <label class="form-label">택배비</label>
    <input type="text" class="form-input" id="inputShipping" placeholder="0" style="text-align: right;">
</div>

    <div class="form-group" style="width: 120px;">
    <label class="form-label">판매가</label>
    <input type="text" class="form-input" id="inputTotalPrice" readonly style="text-align: right; background: #f8f9fa;">
</div>


    <div class="form-group" style="width: 140px;">
    <label class="form-label">발송요청일</label>
    <input type="text" class="form-input" id="inputRequestDate" placeholder="선택" readonly style="cursor: pointer;">
</div>
                        
                        <!-- 두 번째 행: 주문자/수령인 정보 -->
                        <div class="form-row">
                            <div class="form-group" style="width: 100px;">
                                <label class="form-label">주문자</label>
                                <input type="text" class="form-input" id="inputOrderer">
                            </div>
                            
                            <div class="form-group" style="width: 140px;">
                                <label class="form-label">주문자 전화번호</label>
                                <input type="tel" class="form-input" id="inputOrdererPhone" placeholder="010-0000-0000">
                            </div>
                            
                            <div class="form-group" style="width: 100px;">
                                <label class="form-label">수령인 <span class="required">*</span></label>
                                <input type="text" class="form-input" id="inputReceiver">
                            </div>
                            
                            <div class="form-group" style="width: 140px;">
                                <label class="form-label">수령인 전화번호 <span class="required">*</span></label>
                                <input type="tel" class="form-input" id="inputReceiverPhone" placeholder="010-0000-0000">
                            </div>
                            
                            <div class="form-group" style="flex: 1; min-width: 300px;">
    <label class="form-label">주소 <span class="required">*</span></label>
    <div style="display: flex; gap: 8px;">
        <input type="text" class="form-input" id="inputAddress" readonly style="flex: 1;">
        <button type="button" class="btn-search-address" onclick="OrderInputHandler.searchAddress()">주소검색</button>
    </div>
</div>
                        </div>
                        
                        <!-- 세 번째 행: 배송 메시지 및 추가 버튼 -->
                        <div class="form-row">
                            <div class="form-group" style="flex: 1; max-width: 500px;">
                                <label class="form-label">배송 메시지</label>
                                <input type="text" class="form-input" id="inputDeliveryMsg">
                            </div>
                            
                            <div class="form-group">
                                <button type="button" class="btn-add" onclick="OrderInputHandler.addOrder()">주문 추가</button>
                            </div>
                        </div>
                    </form>
                    
                    <div id="inputMessage" class="message-box"></div>
                </div>

 <!-- 주문 접수 내역 테이블 섹션 (주문조회 스타일) -->
<div class="table-section" style="background: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; margin-top: 24px;">
    <div class="table-header" style="padding: 16px 24px; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center; background: #f8f9fa;">
        <div class="table-header-left" style="display: flex; align-items: center; gap: 12px;">
            <h3 class="table-title" style="font-size: 16px; font-weight: 500; color: #042848; margin: 0;">주문 접수 내역</h3>
            <div class="result-info" style="display: flex; align-items: center; gap: 20px; font-size: 13px; color: #6c757d; margin-right: 8px;">
                <span>총 <span class="result-count" id="totalOrderCount" style="color: #2563eb; font-weight: 500;">0</span>건</span>
            </div>
            <button class="btn-action" onclick="OrderInputHandler.loadUnshippedOrders()" 
                style="padding: 6px 12px; border: 1px solid #ffb3ba; border-radius: 6px; background: #ffe0e6; color: #042848; font-size: 12px; font-weight: 300; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                미발송주문 불러오기
            </button>
        </div>
        <div class="table-actions" style="display: flex; gap: 8px;">
            <button class="btn-action" onclick="OrderInputHandler.saveOrders()" 
                style="padding: 6px 12px; border: 1px solid #dee2e6; border-radius: 6px; background: #10b981; color: white; font-size: 12px; font-weight: 300; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;">
                <svg width="24" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                주문확정등록
            </button>
        </div>
    </div>

                    
                    <div class="table-wrapper" style="overflow-x: auto; overflow-y: auto; height: calc(100vh - 500px); min-height: 300px; max-height: 500px;">
                        <div id="inputOrderList">
                            <div class="empty-message" style="padding: 40px; text-align: center; color: #6c757d; font-size: 14px;">
                                접수된 주문이 없습니다
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 주소 모달 -->
            <div id="addressModal" class="address-modal">
                <div class="address-modal-content">
                    <div class="modal-header">
                        <h3>주소 상세 입력</h3>
                    </div>
                    <div style="margin: 20px 0;">
                        <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                            <p style="margin: 0 0 8px 0;"><strong>우편번호:</strong> <span id="modalZipcode"></span></p>
                            <p style="margin: 0;"><strong>주소:</strong> <span id="modalAddress"></span></p>
                        </div>
                        <div class="form-group">
                            <label class="form-label">상세주소</label>
                            <input type="text" class="form-input" id="modalDetail" placeholder="동/호수 등을 입력하세요">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-modal secondary" onclick="OrderInputHandler.cancelAddress()">취소</button>
                        <button class="btn-modal primary" onclick="OrderInputHandler.confirmAddress()">확인</button>
                    </div>
                </div>
            </div>
            <!-- 커스텀 툴팁 -->
            <div id="customTooltip" class="custom-tooltip"></div>
        `;
        
        // Daum 우편번호 서비스 스크립트 추가
        if (!document.querySelector('script[src*="daumcdn.net"]')) {
            const script = document.createElement('script');
            script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
            document.head.appendChild(script);
        }
    },
    
    async loadProductData() {
        try {
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getProductData' })
            });
            
            const result = await response.json();
            if (result.productData) {
                this.productData = result.productData;
                console.log('제품 데이터 로드:', Object.keys(this.productData).length);
            }
        } catch (error) {
            console.error('제품 데이터 로드 실패:', error);
        }
    },
    

    generateOrderNumber() {
        const today = new Date();
        const dateStr = today.getFullYear() + 
            String(today.getMonth() + 1).padStart(2, '0') + 
            String(today.getDate()).padStart(2, '0');
        
        // 로컬스토리지에서 오늘 날짜의 카운터 가져오기
        const counterKey = `orderCounter_${dateStr}`;
        let counter = parseInt(localStorage.getItem(counterKey) || '0') + 1;
        localStorage.setItem(counterKey, counter.toString());
        
        return `PH${dateStr}${String(counter).padStart(3, '0')}`;
    },




// loadProductData 함수 끝나는 부분 뒤에 추가
async loadTempOrders() {
    try {
        console.log('loadTempOrders 시작');
        
        // 사용자 이메일 확인
        const userEmail = window.currentUser?.email || localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
        console.log('사용자 이메일:', userEmail);
        
        if (!userEmail || userEmail === 'unknown') {
            console.log('유효한 이메일 없음');
            return;
        }
        
        // 로딩 표시
        const list = document.getElementById('inputOrderList');
        if (list) {
            list.innerHTML = '<div class="loading-message">임시저장 주문 불러오는 중...</div>';
        }
        
        const response = await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getTempOrders',
                userEmail: userEmail
            })
        });
        
        console.log('응답 상태:', response.status);
        
        if (!response.ok) {
            console.error('임시저장 로드 실패: HTTP', response.status);
            this.updateOrderList();
            return;
        }
        
        const result = await response.json();
        console.log('getTempOrders API 응답:', result);
        console.log('result.success:', result.success);
        console.log('result.orders:', result.orders);
        console.log('result.orders?.length:', result.orders?.length);
        
        if (result.success && result.orders && result.orders.length > 0) {
            // 필드 매핑 추가
            this.manualOrders = result.orders.map(order => ({
    ...order,
    주문번호: order.주문번호 || order.접수번호 || order.orderNumber || '',  // 접수번호 매핑 추가
    사용자이메일: order.사용자이메일 || order.userEmail,
    저장시간: order.저장시간 || order.timestamp,
    상품금액: order.상품금액 || order.totalPrice || 0,
    입금확인: order.입금확인 || ''
}));
            this.updateOrderList();
            console.log(`임시저장된 ${this.manualOrders.length}건의 주문 자동 로드 완료`);
            this.showMessage(`임시저장된 ${this.manualOrders.length}건의 주문을 불러왔습니다.`, 'info');
        } else {
            this.manualOrders = [];
            this.updateOrderList();
            console.log('임시저장된 주문 없음 - result:', result);
        }
    } catch (error) {
        console.error('임시저장 로드 오류:', error);
        this.manualOrders = [];
        this.updateOrderList();
    }
},

async saveTempOrder(orderData, isUnshipped = false) {
    try {
        const userEmail = window.currentUser?.email || localStorage.getItem('userEmail') || 'unknown';
        console.log('saveTempOrder - 사용자:', userEmail);
        
        const koreaTime = new Date().toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // 전화번호 형식 보존
        const formatPhone = (phone) => {
            if (!phone) return '';
            let phoneStr = String(phone).replace(/[^0-9]/g, '');
            if (phoneStr && !phoneStr.startsWith('0')) {
                phoneStr = '0' + phoneStr;
            }
            return phoneStr ? `'${phoneStr}` : '';
        };
        
        const tempData = [[
            userEmail,
            orderData.주문번호 || this.generateOrderNumber(),  // 주문번호
            koreaTime,  // 주문일시
            orderData.마켓명,
            orderData.옵션명,
            orderData.수량,
            isUnshipped ? '' : orderData.단가,  // 미발송주문은 단가 없음
            isUnshipped ? '' : (orderData.택배비 || 0),  // 미발송주문은 택배비 없음
            isUnshipped ? (orderData.최종결제금액 || orderData.상품금액) : orderData.상품금액,  // 미발송은 최종결제금액 사용
            orderData.주문자,
            formatPhone(orderData['주문자 전화번호']),
            orderData.수령인,
            formatPhone(orderData['수령인 전화번호']),
            orderData.주소,
            orderData.배송메세지 || '',
            orderData['특이/요청사항'] || '',
            orderData.발송요청일 || '',
            '',  // 상태
            '',  // 입금확인
            isUnshipped ? '미발송주문' : ''  // 비고
        ]];
        
        const response = await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'appendToSheet',
                spreadsheetId: 'orders',
                range: '임시저장!A:T',  // T열까지 확장
                values: [tempData]
            })
        });
        
        const result = await response.json();
        console.log('임시저장 결과:', result);
        return result.success;

    } catch (error) {
        console.error('임시저장 실패:', error);
        return false;
    }
},

async deleteTempOrders() {
    try {
        const response = await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'deleteTempOrders',
                userEmail: window.currentUser?.email || 'unknown'
            })
        });
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('임시저장 삭제 실패:', error);
        return false;
    }
},


setupEventListeners() {
    // 상품 검색 이벤트 리스너 추가
    const searchInput = document.getElementById('inputProductSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => this.searchProduct());
    }
    
    // 가격 계산
    ['inputUnitPrice', 'inputQuantity', 'inputShipping'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => this.calculateTotal());
    });

    // 모달 상세주소 엔터키
    const modalDetail = document.getElementById('modalDetail');
    if (modalDetail) {
        modalDetail.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.confirmAddress();
            }
        });
    }

    const requestDateInput = document.getElementById('inputRequestDate');
if (requestDateInput) {
    requestDateInput.addEventListener('click', function() {
        const tempInput = document.createElement('input');
        tempInput.type = 'date';
        tempInput.style.position = 'absolute';
        tempInput.style.opacity = '0';
        document.body.appendChild(tempInput);
        tempInput.addEventListener('change', function() {
            requestDateInput.value = this.value;
            document.body.removeChild(tempInput);
        });
        tempInput.click();
    });
}
},
    
    searchBreed() {
        const input = document.getElementById('inputBreed');
        const keyword = input.value.toLowerCase();
        const results = document.getElementById('breedSearchResults');
        
        if (keyword.length < 1) {
            results.classList.remove('show');
            return;
        }
        
        const breeds = new Set();
        Object.keys(this.productData).forEach(optionName => {
            const product = this.productData[optionName];
            if (product['품종']) {
                breeds.add(product['품종']);
            }
        });
        
        const matches = Array.from(breeds)
            .filter(breed => breed.toLowerCase().includes(keyword))
            .slice(0, 10);
        
        if (matches.length > 0) {
            results.innerHTML = matches.map(breed => 
                `<div class="search-item" onclick="OrderInputHandler.selectBreed('${breed.replace(/'/g, "\\'")}')">${breed}</div>`
            ).join('');
            results.classList.add('show');
        } else {
            results.classList.remove('show');
        }
    },
    
    searchItem() {
        const input = document.getElementById('inputItem');
        const keyword = input.value.toLowerCase();
        const results = document.getElementById('itemSearchResults');
        const selectedBreed = document.getElementById('inputBreed').value;
        
        if (keyword.length < 1) {
            results.classList.remove('show');
            return;
        }
        
        const items = new Set();
        Object.keys(this.productData).forEach(optionName => {
            const product = this.productData[optionName];
            if (!selectedBreed || product['품종'] === selectedBreed) {
                if (product['품목']) {
                    items.add(product['품목']);
                }
            }
        });
        
        const matches = Array.from(items)
            .filter(item => item.toLowerCase().includes(keyword))
            .slice(0, 10);
        
        if (matches.length > 0) {
            results.innerHTML = matches.map(item => 
                `<div class="search-item" onclick="OrderInputHandler.selectItem('${item.replace(/'/g, "\\'")}')">${item}</div>`
            ).join('');
            results.classList.add('show');
        } else {
            results.classList.remove('show');
        }
    },
    
    searchOption() {
    const input = document.getElementById('inputOptionName');
    const keyword = input.value.toLowerCase();
    const results = document.getElementById('optionSearchResults');
    
    if (keyword.length < 1) {
        results.classList.remove('show');
        return;
    }
    
    // 품종, 품목, 옵션명 모두에서 검색
    let matches = Object.keys(this.productData).filter(optionName => {
        const product = this.productData[optionName];
        
        // 옵션명에 키워드 포함
        if (optionName.toLowerCase().includes(keyword)) return true;
        
        // 품종에 키워드 포함
        if (product['품종'] && product['품종'].toLowerCase().includes(keyword)) return true;
        
        // 품목에 키워드 포함
        if (product['품목'] && product['품목'].toLowerCase().includes(keyword)) return true;
        
        return false;
    }).slice(0, 20);  // 더 많은 결과 표시
    
    if (matches.length > 0) {
        results.innerHTML = matches.map(name => 
            `<div class="search-item" onclick="OrderInputHandler.selectOption('${name.replace(/'/g, "\\'")}')">${name}</div>`
        ).join('');
        results.classList.add('show');
    } else {
        results.classList.remove('show');
    }
},
    
searchProduct() {
    const input = document.getElementById('inputProductSearch');
    const keyword = input.value.toLowerCase();
    const results = document.getElementById('optionSearchResults');
    
    if (keyword.length < 1) {
        results.classList.remove('show');
        return;
    }
    
    // 품종, 품목, 옵션명 모두에서 검색
    let matches = Object.keys(this.productData).filter(optionName => {
        const product = this.productData[optionName];
        
        // 옵션명에 키워드 포함
        if (optionName.toLowerCase().includes(keyword)) return true;
        
        // 품종에 키워드 포함
        if (product['품종'] && product['품종'].toLowerCase().includes(keyword)) return true;
        
        // 품목에 키워드 포함
        if (product['품목'] && product['품목'].toLowerCase().includes(keyword)) return true;
        
        return false;
    }).slice(0, 20);
    
    if (matches.length > 0) {
        results.innerHTML = matches.map(name => 
            `<div class="search-item" onclick="OrderInputHandler.selectOption('${name.replace(/'/g, "\\'")}')">${name}</div>`
        ).join('');
        results.classList.add('show');
    } else {
        results.classList.remove('show');
    }
},

    selectBreed(breed) {
        document.getElementById('inputBreed').value = breed;
        document.getElementById('breedSearchResults').classList.remove('show');
        this.updateOptionSuggestions();
    },
    
    selectItem(item) {
        document.getElementById('inputItem').value = item;
        document.getElementById('itemSearchResults').classList.remove('show');
        this.updateOptionSuggestions();
    },
    
    selectOption(name) {
    // 옵션명 필드에 선택된 값 설정
    const optionInput = document.getElementById('inputOptionName');
    if (optionInput) {
        optionInput.value = name;
    }
    
    // 검색 결과 숨기기
    const searchResults = document.getElementById('optionSearchResults');
    if (searchResults) {
        searchResults.classList.remove('show');
    }
    
    // 검색 입력란 초기화
    const searchInput = document.getElementById('inputProductSearch');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // 제품 데이터가 있으면 C무료판매가를 단가로 설정
    if (this.productData[name]) {
        const product = this.productData[name];
        
        // C무료판매가만 사용, 없으면 0
        const price = product['C무료판매가'] || 0;
        const priceInput = document.getElementById('inputUnitPrice');
        if (priceInput) {
            priceInput.value = price;
        }
        
        // 판매가 계산
        this.calculateTotal();
    }
},
    
    updateOptionSuggestions() {
        const selectedBreed = document.getElementById('inputBreed').value;
        const selectedItem = document.getElementById('inputItem').value;
        
        if (selectedBreed || selectedItem) {
            const matches = Object.keys(this.productData).filter(optionName => {
                const product = this.productData[optionName];
                
                if (selectedBreed && product['품종'] !== selectedBreed) return false;
                if (selectedItem && product['품목'] !== selectedItem) return false;
                
                return true;
            });
            
            if (matches.length === 1) {
                this.selectOption(matches[0]);
            }
        }
    },
    
    changeQuantity(delta) {
    const input = document.getElementById('inputQuantity');
    const current = parseInt(input.value) || 1;
    input.value = Math.max(1, current + delta);
    this.calculateTotal();  // 수량 변경시 판매가 재계산
},
    
    searchAddress() {
        new daum.Postcode({
            oncomplete: (data) => {
                this.tempAddressData = {
                    zonecode: data.zonecode,
                    address: data.roadAddress || data.jibunAddress
                };
                
                if(data.buildingName) {
                    this.tempAddressData.address += ' (' + data.buildingName + ')';
                }
                
                document.getElementById('modalZipcode').textContent = this.tempAddressData.zonecode;
                document.getElementById('modalAddress').textContent = this.tempAddressData.address;
                document.getElementById('modalDetail').value = '';
                document.getElementById('addressModal').classList.add('show');
                setTimeout(() => document.getElementById('modalDetail').focus(), 100);
            }
        }).open();
    },
    
    confirmAddress() {
        const detail = document.getElementById('modalDetail').value.trim();
        let fullAddress = this.tempAddressData.address;
        if (detail) fullAddress += ' ' + detail;
        
        document.getElementById('inputAddress').value = fullAddress;
        document.getElementById('addressModal').classList.remove('show');
    },
    
    cancelAddress() {
        document.getElementById('addressModal').classList.remove('show');
        this.tempAddressData = {};
    },
    
async addOrder() {
    const required = ['inputOrderType', 'inputOptionName', 'inputUnitPrice', 'inputReceiver', 'inputReceiverPhone', 'inputAddress'];
    for (const id of required) {
        if (!document.getElementById(id).value) {
            this.showMessage('필수 항목을 모두 입력하세요.', 'error');
            return;
        }
    }
    
    const orderData = {
        주문번호: this.generateOrderNumber(),
        마켓명: document.getElementById('inputOrderType').value,
        옵션명: document.getElementById('inputOptionName').value,
        단가: parseFloat(document.getElementById('inputUnitPrice').value.replace(/,/g, '')) || 0,
        수량: parseInt(document.getElementById('inputQuantity').value) || 1,
        택배비: parseFloat(document.getElementById('inputShipping').value.replace(/,/g, '')) || 0,
        주문자: document.getElementById('inputOrderer').value || document.getElementById('inputReceiver').value,
        '주문자 전화번호': document.getElementById('inputOrdererPhone').value || document.getElementById('inputReceiverPhone').value,
        수령인: document.getElementById('inputReceiver').value,
        '수령인 전화번호': document.getElementById('inputReceiverPhone').value,
        주소: document.getElementById('inputAddress').value,
        배송메세지: document.getElementById('inputDeliveryMsg').value,
        발송요청일: document.getElementById('inputRequestDate').value,
        비고: ''
    };
    
    
        
        orderData['상품금액'] = (orderData.단가 * orderData.수량) + orderData.택배비;
        
        // 임시저장에 추가
const saved = await this.saveTempOrder(orderData);

if (saved) {
    this.manualOrders.push(orderData);
    this.updateOrderList();
    this.resetForm();
    this.showMessage(`주문이 추가되었습니다. (총 ${this.manualOrders.length}건)`, 'success');
} else {
    this.showMessage('주문 추가 중 오류가 발생했습니다.', 'error');
}
    },
    
        updateOrderList() {
    const list = document.getElementById('inputOrderList');
    const count = document.getElementById('totalOrderCount');
    
    if (count) {
        count.textContent = this.manualOrders.length;
    }
    
    if (this.manualOrders.length === 0) {
        list.innerHTML = '<div class="empty-message">접수된 주문이 없습니다</div>';
        return;
    }
    
    // 마켓 색상 가져오기
    const getMarketColor = (market) => {
        const colors = {
            'CS발송': 'rgb(255, 0, 0)',
            '전화주문': 'rgb(0, 0, 255)'
        };
        return colors[market] || 'rgb(128, 128, 128)';
    };
    
  
    // 테이블 HTML 생성 (주문조회 스타일)
list.innerHTML = `
    <table class="search-table" style="width: 100%; border-collapse: collapse; min-width: 1500px; table-layout: fixed;">
        <thead style="position: sticky; top: 0; background: #f8f9fa; z-index: 10;">
            <tr>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 40px;">번호</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 80px;">마켓명</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 120px;">주문번호</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 140px;">주문일시</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 80px;">주문자</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 100px;">주문자전화</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 80px;">수령인</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 100px;">수령인전화</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 200px;">주소</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 120px;">배송메세지</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 180px;">옵션명</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 50px;">수량</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 90px;">발송요청일</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 80px;">금액</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 80px;">확인</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 60px;">삭제</th>
                <th style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400; color: #042848; border-bottom: 2px solid #dee2e6; width: 100px;">비고</th>
            </tr>
        </thead>
        <tbody>
            ${this.manualOrders.map((order, index) => {
                const marketColor = order.마켓명 === 'CS발송' ? 'rgb(255, 0, 0)' : 
                                  order.마켓명 === '전화주문' ? 'rgb(0, 0, 255)' :
                                  order.마켓명 === '기타' ? 'rgb(128, 128, 128)' :
                                  'rgb(128, 128, 128)';
                
                 return `
                <tr style="border-bottom: 1px solid #f1f3f5;" 
                    onmouseover="this.style.background='#f0f8ff'; OrderInputHandler.showTooltip(event, ${index})" 
                    onmouseout="this.style.background=''; OrderInputHandler.hideTooltip()">
                    <td style="padding: 8px; text-align: center; font-size: 12px; font-weight: 300;">${index + 1}</td>
                    <td style="padding: 8px; text-align: center;">
                        <span style="display: inline-block; padding: 3px 8px; background: ${marketColor}; color: white; border-radius: 4px; font-size: 11px; font-weight: 500;">
                            ${order.마켓명 || '-'}
                        </span>
                    </td>
                    <td style="padding: 8px; text-align: center; font-size: 11px; font-weight: 300; font-family: monospace;">
                        ${order.주문번호 || '-'}
                    </td>
                    <td style="padding: 8px; text-align: center; font-size: 11px; font-weight: 300;">
                        ${order.저장시간 || order.주문일시 || '-'}
                    </td>
                    <td style="padding: 8px; font-size: 12px; font-weight: 300;">${order.주문자 || '-'}</td>
                    <td style="padding: 8px; font-size: 11px; font-weight: 300;">${order['주문자 전화번호'] || '-'}</td>
                    <td style="padding: 8px; font-size: 12px; font-weight: 300;">${order.수령인 || '-'}</td>
                    <td style="padding: 8px; font-size: 11px; font-weight: 300;">${order['수령인 전화번호'] || '-'}</td>
                    <td style="padding: 8px; font-size: 11px; font-weight: 300; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${order.주소 || ''}">
                        ${order.주소 || '-'}
                    </td>
                    <td style="padding: 8px; font-size: 11px; font-weight: 300;">${order.배송메세지 || '-'}</td>
                    <td style="padding: 8px; font-size: 11px; font-weight: 300;">${order.옵션명 || '-'}</td>
                    <td style="padding: 8px; text-align: center; font-size: 12px; font-weight: 400;">
                        ${order.수량 || 1}
                    </td>
                    <td style="padding: 8px; text-align: center; font-size: 11px;">
                        ${order.발송요청일 ? 
                            `<span style="background: #e9d5ff; padding: 3px 8px; border-radius: 4px; display: inline-block; font-weight: 400;">
                                ${order.발송요청일}
                            </span>` : '-'}
                    </td>
                    <td style="padding: 8px; text-align: right; font-size: 12px; font-weight: 400;">
                        ${(order.상품금액 || 0).toLocaleString()}원
                    </td>
                    <td style="padding: 8px; text-align: center;">
                        ${order.입금확인 ? 
                            `<span style="padding: 3px 8px; background: #e0e7ff; color: #4f46e5; border-radius: 4px; font-size: 11px; font-weight: 500;">
                                입금완료
                            </span>` : 
                            (order.상품금액 > 0 ? 
                                `<button onclick="OrderInputHandler.confirmPayment(${index})" 
                                    style="padding: 4px 10px; background: #10b981; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; height: 24px;">
                                    입금확인
                                </button>` : '-')}
                    </td>
                    <td style="padding: 8px; text-align: center;">
                        <button onclick="OrderInputHandler.removeOrder(${index})" 
                            style="padding: 4px 10px; background: #84cc16; color: white; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; height: 24px;">
                            제외
                        </button>
                    </td>
                    <td style="padding: 8px; text-align: center; font-size: 11px; font-weight: 300;">
                        ${order.비고 ? 
                            `<span style="background: #fee2e2; color: #dc3545; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 400;">
                                ${order.비고}
                            </span>` : '-'}
                    </td>
                </tr>`;
            }).join('')}
        </tbody>
    </table>

        
    `;
},

async confirmPayment(index) {
    try {
        const order = this.manualOrders[index];
        const userEmail = window.currentUser?.email || localStorage.getItem('userEmail') || 'unknown';
        const confirmTime = new Date().toLocaleString('ko-KR');
        
        console.log('입금확인 시작:', {
            index: index,
            userEmail: userEmail,
            confirmTime: confirmTime,
            order: order
        });
        
        // 입금확인 시간 업데이트
        const response = await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'updatePaymentConfirmation',
                userEmail: userEmail,
                orderIndex: index,
                confirmTime: confirmTime
            })
        });
        
        console.log('API 응답 상태:', response.status);
        
        const result = await response.json();
        console.log('API 응답 결과:', result);
        
        if (result.success) {
            // 로컬 데이터 업데이트
            this.manualOrders[index].입금확인 = confirmTime;
            this.updateOrderList();
            this.showMessage(`${index + 1}번 주문 입금 확인되었습니다.`, 'success');
        } else {
            console.error('API 에러 메시지:', result.error);
            throw new Error(result.error || '입금확인 업데이트 실패');
        }
    } catch (error) {
        console.error('입금확인 처리 상세 오류:', {
            message: error.message,
            stack: error.stack
        });
        this.showMessage(`입금확인 실패: ${error.message}`, 'error');
    }
},
    
    async removeOrder(index) {  // async 추가
    // 삭제할 주문 정보
    const deletedOrder = this.manualOrders[index];
    
    this.manualOrders.splice(index, 1);
    this.updateOrderList();
    
    // 임시저장 업데이트
    await this.deleteTempOrders();  // 전체 삭제 후
    for (const order of this.manualOrders) {
        await this.saveTempOrder(order);  // 남은 것만 다시 저장
    }
    
    this.showMessage(`주문이 제외되었습니다. (남은 주문: ${this.manualOrders.length}건)`, 'lime');
},
    
    resetForm() {
        document.getElementById('inputOrderForm').reset();
        document.getElementById('inputQuantity').value = '1';
    },
    
    showMessage(text, type) {
        const msg = document.getElementById('inputMessage');
        msg.textContent = text;
        msg.className = `message-box ${type} show`;
        setTimeout(() => msg.classList.remove('show'), 3000);
    },
    
    calculateTotal() {
    const unitPriceValue = document.getElementById('inputUnitPrice').value.replace(/,/g, '');
    const shippingValue = document.getElementById('inputShipping').value.replace(/,/g, '');
    
    const unitPrice = parseFloat(unitPriceValue) || 0;
    const quantity = parseInt(document.getElementById('inputQuantity').value) || 1;
    const shipping = parseFloat(shippingValue) || 0;
    
    const totalPrice = (unitPrice * quantity) + shipping;
    
    const totalPriceInput = document.getElementById('inputTotalPrice');
    if (totalPriceInput) {
        totalPriceInput.value = totalPrice.toLocaleString('ko-KR');
    }
},

showTooltip(event, index) {
    const order = this.manualOrders[index];
    const tooltip = document.getElementById('customTooltip');
    
    const tooltipHTML = `
        <div class="tooltip-header">주문 상세 정보</div>
        <div class="tooltip-row">
            <span class="tooltip-label">마켓명</span>
            <span class="tooltip-value">${order.마켓명 || '-'}</span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">옵션명</span>
            <span class="tooltip-value">${order.옵션명 || '-'}</span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">주문자</span>
            <span class="tooltip-value">${order.주문자 || '-'}</span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">수령인</span>
            <span class="tooltip-value">${order.수령인 || '-'}</span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">수량</span>
            <span class="tooltip-value">${order.수량 || 1}개</span>
        </div>
        <div class="tooltip-amount">
            총 ${(order.상품금액 || 0).toLocaleString()}원
        </div>
    `;
    
    tooltip.innerHTML = tooltipHTML;
    tooltip.classList.add('show');
    
    // 툴팁 위치 계산 - 기본값: 마우스 아래 왼쪽
    const rect = event.target.closest('tr').getBoundingClientRect();
    let left = event.clientX - 335;  // 마우스 왼쪽
    let top = event.clientY + 15;    // 마우스 아래
    
    // 화면 경계 체크
    if (left < 10) {  // 왼쪽 화면 밖으로 나가면
        left = event.clientX + 15;  // 오른쪽으로 표시
    }
    if (top + 250 > window.innerHeight) {  // 아래 화면 밖으로 나가면
        top = event.clientY - 250;  // 위로 표시
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
},

hideTooltip() {
    const tooltip = document.getElementById('customTooltip');
    if (tooltip) {
        tooltip.classList.remove('show');
    }
},

async saveOrders() {
    if (this.manualOrders.length === 0) {
        this.showMessage('저장할 주문이 없습니다.', 'error');
        return;
    }
    
    const saveButton = document.querySelector('.btn-save');
    if (saveButton) {
        saveButton.textContent = '저장 중...';
        saveButton.disabled = true;
    }
    
    try {
        const today = new Date();
        const sheetName = today.getFullYear() + 
                         String(today.getMonth() + 1).padStart(2, '0') + 
                         String(today.getDate()).padStart(2, '0');
        
        const headers = window.mappingData?.standardFields;
        if (!headers) {
            this.showMessage('매핑 데이터를 찾을 수 없습니다.', 'error');
            return;
        }
        
        // 제품 정보로 주문 데이터 보강
        const enrichedOrders = this.manualOrders.map(order => {
            const productInfo = this.productData[order.옵션명];
            if (productInfo) {
                return {
                    ...order,
                    출고처: productInfo['출고처'] || '',
                    송장주체: productInfo['송장주체'] || '',
                    벤더사: productInfo['벤더사'] || '',
                    발송지명: productInfo['발송지명'] || '',
                    발송지주소: productInfo['발송지주소'] || '',
                    발송지연락처: productInfo['발송지연락처'] || '',
                    출고비용: productInfo['출고비용'] || 0
                };
            }
            return order;
        });
        
        const values = [headers];
        const marketCounters = {};
        
        enrichedOrders.forEach((order, index) => {
            const marketName = order.마켓명;
            
            if (!marketCounters[marketName]) {
                marketCounters[marketName] = 0;
            }
            marketCounters[marketName]++;
            
            const row = headers.map(header => {
                if (header === '연번') return index + 1;
                
                if (header === '마켓') {
                    let initial = marketName.charAt(0);
                    if (window.mappingData?.markets?.[marketName]?.initial) {
                        initial = window.mappingData.markets[marketName].initial;
                    }
                    return initial + String(marketCounters[marketName]).padStart(3, '0');
                }
                
                if (header === '결제일') return new Date().toISOString().split('T')[0] + ' 00:00:00';
                if (header === '주문번호') return 'M' + Date.now() + index;
                if (header === '상품주문번호') return 'M' + Date.now() + index;
                
                const value = order[header];
                return value !== undefined && value !== null ? String(value) : '';
            });
            values.push(row);
        });
        
        const marketColors = {};
        if (window.mappingData?.markets) {
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
        
        const response = await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'saveToSheet',
                sheetName: sheetName,
                values: values,
                marketColors: marketColors,
                spreadsheetId: 'orders'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            await this.deleteTempOrders();
            this.showMessage(`${this.manualOrders.length}건의 주문이 저장되었습니다.`, 'success');
            this.manualOrders = [];
            this.updateOrderList();
            this.resetForm();
        } else {
            throw new Error(result.error || '저장 실패');
        }
        
    } catch (error) {
        console.error('저장 오류:', error);
        this.showMessage('저장 중 오류가 발생했습니다: ' + error.message, 'error');
    } finally {
        const saveButton = document.querySelector('.btn-save');
        if (saveButton) {
            saveButton.textContent = '저장';
            saveButton.disabled = false;
        }
    }
}, // 콤마 유지



async loadUnshippedOrders() {
    const loadButton = document.querySelector('.btn-load-unshipped');
    if (loadButton) {
        loadButton.textContent = '불러오는 중...';
        loadButton.disabled = true;
    }
    
    try {
        const allUnshippedOrders = [];
        const foundSheets = [];
        let daysBack = 0;
        const maxDaysToCheck = 10;
        
        while (foundSheets.length < 3 && daysBack < maxDaysToCheck) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - daysBack);
            const sheetName = targetDate.getFullYear() + 
                             String(targetDate.getMonth() + 1).padStart(2, '0') + 
                             String(targetDate.getDate()).padStart(2, '0');
            
            console.log(`[${daysBack}일 전] 시트 확인: ${sheetName}`);
            
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getOrdersByDate',  // getMarketData 대신 이것 사용
                    sheetName: sheetName,
                    spreadsheetId: 'orders'
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                foundSheets.push(sheetName);
                console.log(`✓ 유효한 시트: ${sheetName} (${result.data.length}개 행)`);
                
                // 마켓별 건수 확인
                const marketCount = {};
                result.data.forEach(order => {
                    const market = order['마켓명'] || '빈값';
                    marketCount[market] = (marketCount[market] || 0) + 1;
                });
                console.log('마켓별 건수:', marketCount);
                
                // CS발송/전화주문만 필터링
                const targetMarketOrders = result.data.filter(order => 
                    order['마켓명'] === 'CS발송' || order['마켓명'] === '전화주문'
                );
                console.log(`CS발송/전화주문: ${targetMarketOrders.length}건`);
                
                // 각 주문의 택배사/송장번호 확인
                targetMarketOrders.forEach((order, idx) => {
                    if (idx < 5) { // 처음 5개만 로그
                        console.log(`[${idx}] 주문번호: ${order['주문번호']}, 택배사: "${order['택배사']}", 송장번호: "${order['송장번호']}"`);
                    }
                });
                
                // 미발송 필터링
                const unshipped = targetMarketOrders.filter(order => {
                    const hasNoShipping = (!order['택배사'] || order['택배사'].trim() === '') && 
                                         (!order['송장번호'] || order['송장번호'].trim() === '');
                    return hasNoShipping;
                });
                console.log(`미발송: ${unshipped.length}건`);
                
                unshipped.forEach(order => {
                    order._sheetDate = sheetName;
                    allUnshippedOrders.push(order);
                });
            }
            
            daysBack++;
        }
        
        console.log(`조회 완료: ${foundSheets.length}개 시트에서 총 ${allUnshippedOrders.length}건`);
        
        if (allUnshippedOrders.length === 0) {
            this.showMessage(`최근 ${foundSheets.length}개 시트에 CS발송/전화주문 미발송이 없습니다.`, 'info');
            return;
        }
        

        
        // 모달 표시
        this.showUnshippedOrdersModal(allUnshippedOrders);
        
    } catch (error) {
        console.error('미발송 주문 불러오기 오류:', error);
        this.showMessage('미발송 주문을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
        const loadButton = document.querySelector('.btn-load-unshipped');
        if (loadButton) {
            loadButton.textContent = '미발송주문 불러오기';
            loadButton.disabled = false;
        }
    }
},
showUnshippedOrdersModal(orders) {
    // 기존 모달 제거
    const existingModal = document.getElementById('unshippedOrdersModal');
    if (existingModal) existingModal.remove();
    
    // 정렬: 1순위 주문자, 2순위 등록일(시트날짜)
    orders.sort((a, b) => {
        // 1순위: 주문자
        const ordererA = a['주문자'] || '';
        const ordererB = b['주문자'] || '';
        const ordererCompare = ordererA.localeCompare(ordererB);
        if (ordererCompare !== 0) return ordererCompare;
        
        // 2순위: 등록일 (_sheetDate)
        const dateA = a._sheetDate || '';
        const dateB = b._sheetDate || '';
        return dateA.localeCompare(dateB);
    });
    
    // 모달 HTML 생성
    const modal = document.createElement('div');
    modal.id = 'unshippedOrdersModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; width: 90%; max-width: 1200px; max-height: 80vh; display: flex; flex-direction: column;">
            <div style="padding: 20px; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 500;">미발송 주문 선택</h3>
                <button onclick="document.getElementById('unshippedOrdersModal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6c757d;">×</button>
            </div>
            
            <div style="padding: 16px; background: #f8f9fa; border-bottom: 1px solid #dee2e6;">
                <div style="display: flex; gap: 12px; align-items: center;">
                    <button onclick="OrderInputHandler.selectAllUnshipped(true)" style="padding: 6px 12px; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 13px; cursor: pointer;">전체 선택</button>
                    <button onclick="OrderInputHandler.selectAllUnshipped(false)" style="padding: 6px 12px; background: #ffffff; color: #495057; border: 1px solid #dee2e6; border-radius: 6px; font-size: 13px; cursor: pointer;">전체 해제</button>
                    <span style="font-size: 13px; color: #6c757d;">총 ${orders.length}건</span>
                </div>
            </div>
            
            <div style="flex: 1; overflow-y: auto; padding: 16px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead style="position: sticky; top: 0; background: white; z-index: 10;">
                        <tr style="border-bottom: 2px solid #dee2e6;">
                            <th style="padding: 8px; text-align: center; width: 40px;">
                                <input type="checkbox" id="selectAllCheckbox" onchange="OrderInputHandler.selectAllUnshipped(this.checked)">
                            </th>
                            <th style="padding: 8px; text-align: left;">주문자</th>
                            <th style="padding: 8px; text-align: left;">주문자 전화번호</th>
                            <th style="padding: 8px; text-align: left;">수령인</th>
                            <th style="padding: 8px; text-align: center;">마켓</th>
                            <th style="padding: 8px; text-align: center;">등록일</th>
                            <th style="padding: 8px; text-align: left;">옵션명</th>
                            <th style="padding: 8px; text-align: center;">수량</th>
                            <th style="padding: 8px; text-align: right;">금액</th>
                            <th style="padding: 8px; text-align: left;">주문번호</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map((order, index) => `
                            <tr style="border-bottom: 1px solid #f1f3f5;">
                                <td style="padding: 8px; text-align: center;">
                                    <input type="checkbox" class="order-checkbox" data-index="${index}">
                                </td>
                                <td style="padding: 8px; font-weight: 500;">${order['주문자'] || '-'}</td>
                                <td style="padding: 8px;">${order['주문자전화번호'] || order['주문자 전화번호'] || '-'}</td>
                                <td style="padding: 8px;">${order['수령인'] || order['수취인'] || '-'}</td>
                                <td style="padding: 8px; text-align: center;">
                                    <span style="padding: 2px 6px; background: ${order['마켓명'] === 'CS발송' ? '#fee2e2' : '#e0e7ff'}; color: ${order['마켓명'] === 'CS발송' ? '#dc3545' : '#4f46e5'}; border-radius: 4px; font-size: 11px; font-weight: 500;">
                                        ${order['마켓명']}
                                    </span>
                                </td>
                                <td style="padding: 8px; text-align: center; font-weight: 500;">
                                    ${order._sheetDate ? order._sheetDate.substring(4, 6) + '/' + order._sheetDate.substring(6, 8) : '-'}
                                </td>
                                <td style="padding: 8px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${order['옵션명'] || ''}">${order['옵션명'] || '-'}</td>
                                <td style="padding: 8px; text-align: center; ${parseInt(order['수량']) >= 2 ? 'color: #dc3545; font-weight: 600;' : ''}">${order['수량'] || '1'}</td>
                                <td style="padding: 8px; text-align: right; font-weight: 500;">${(parseFloat(order['상품금액']) || 0).toLocaleString()}원</td>
                                <td style="padding: 8px; font-family: monospace; font-size: 11px;">${order['주문번호'] || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div style="padding: 20px; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 12px;">
                <button onclick="document.getElementById('unshippedOrdersModal').remove()" style="padding: 10px 24px; background: #ffffff; color: #495057; border: 1px solid #dee2e6; border-radius: 6px; font-size: 14px; cursor: pointer;">취소</button>
                <button onclick="OrderInputHandler.addSelectedOrders(${JSON.stringify(orders).replace(/"/g, '&quot;')})" style="padding: 10px 24px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">선택한 주문 추가</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
},

selectAllUnshipped(checked) {
    const checkboxes = document.querySelectorAll('.order-checkbox');
    checkboxes.forEach(cb => cb.checked = checked);
    
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) selectAllCheckbox.checked = checked;
},

async addSelectedOrders(orders) {
    const checkboxes = document.querySelectorAll('.order-checkbox:checked');
    const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
    
    if (selectedIndices.length === 0) {
        this.showMessage('선택한 주문이 없습니다.', 'error');
        return;
    }
    
    // 선택한 주문들을 임시저장 및 로컬 배열에 추가
    for (const index of selectedIndices) {
        const order = orders[index];
        const orderData = {
            주문번호: order['주문번호'],  // 원본 주문번호 사용
            마켓명: order['마켓명'],
            옵션명: order['옵션명'] || '',
            단가: '',  // 미발송은 단가 없음
            수량: parseInt(order['수량'] || 1),
            택배비: '',  // 미발송은 택배비 없음
            주문자: order['주문자'] || '',
            '주문자 전화번호': order['주문자 전화번호'] || order['주문자전화번호'] || '',
            수령인: order['수령인'] || order['수취인'] || '',
            '수령인 전화번호': order['수령인 전화번호'] || order['수령인전화번호'] || '',
            주소: order['수령인주소'] || order['수취인주소'] || order['주소'] || '',
            배송메세지: order['배송메세지'] || order['배송메시지'] || '',
            발송요청일: order['발송요청일'] || '',
            최종결제금액: parseFloat(order['최종결제금액'] || order['상품금액'] || 0),
            상품금액: parseFloat(order['최종결제금액'] || order['상품금액'] || 0),
            비고: '미발송주문',
            _원본주문번호: order['주문번호']
        };
        
        // 임시저장 시트에 저장
        await this.saveTempOrder(orderData, true);  // isUnshipped = true
        
        // 로컬 배열에 추가
        this.manualOrders.push(orderData);
    }
    
    this.updateOrderList();
    this.showMessage(`${selectedIndices.length}건의 미발송 주문을 추가했습니다.`, 'success');
    
    // 모달 닫기
    document.getElementById('unshippedOrdersModal').remove();
},

saveToCache() {
    try {
        localStorage.setItem('orderInputCache', JSON.stringify(this.manualOrders));
    } catch (error) {
        console.error('캐시 저장 실패:', error);
    }
},

clearCache() {
    try {
        localStorage.removeItem('orderInputCache');
    } catch (error) {
        console.error('캐시 삭제 실패:', error);
    }
},

fullReset() {
    // 모든 데이터 초기화
    this.manualOrders = [];
    this.tempAddressData = {};
    this.productData = {};
    
    // 캐시 삭제
    this.clearCache();
    
    // DOM 완전 재렌더링
    const container = document.getElementById('om-panel-input');
    if (container) {
        container.innerHTML = '';
        this.render();
        this.setupEventListeners();
        this.loadProductData();
    }
    
    console.log('OrderInputHandler 완전 초기화 완료');
}
};