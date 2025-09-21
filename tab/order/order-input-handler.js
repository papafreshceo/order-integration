window.OrderInputHandler = {
    manualOrders: [],
    tempAddressData: {},
    productData: {},
    
    async init() {
        this.render();
        await this.loadProductData();
        this.setupEventListeners();
        console.log('OrderInputHandler 초기화 완료');
    },
    
    render() {
        const container = document.getElementById('om-panel-input');
        if (!container) return;
        
        container.innerHTML = `
            <style>
                .input-section {
                    padding: 20px;
                    background: #ffffff;
                }
                
                .form-row {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
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
                
                .form-input {
                    padding: 8px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 300;
                }
                
                .form-input:focus {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }
                
                .form-input[readonly] {
                    background: #f8f9fa;
                    cursor: not-allowed;
                }
                
                .quantity-control {
                    display: flex;
                    align-items: center;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    overflow: hidden;
                    width: 100px;
                }
                
                .qty-btn {
                    width: 30px;
                    height: 32px;
                    border: none;
                    background: #f8f9fa;
                    cursor: pointer;
                    font-size: 16px;
                }
                
                .qty-btn:hover {
                    background: #e9ecef;
                }
                
                .qty-input {
                    width: 40px;
                    border: none;
                    text-align: center;
                    font-size: 14px;
                }
                
                .btn-primary {
                    padding: 10px 24px;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 400;
                    cursor: pointer;
                }
                
                .btn-primary:hover {
                    background: #1d4ed8;
                }
                
                .btn-address {
                    padding: 8px 16px;
                    background: #ffffff;
                    color: #2563eb;
                    border: 1px solid #2563eb;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    white-space: nowrap;
                }
                
                .btn-address:hover {
                    background: #e7f3ff;
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
                
                .message {
                    padding: 12px;
                    border-radius: 4px;
                    margin: 16px 0;
                    display: none;
                    font-size: 14px;
                }
                
                .message.error {
                    background: #fee2e2;
                    color: #dc3545;
                    border: 1px solid #fecaca;
                }
                
                .message.success {
                    background: #d1fae5;
                    color: #10b981;
                    border: 1px solid #a7f3d0;
                }
                
                .message.show {
                    display: block;
                }
                
                .order-list {
                    margin-top: 20px;
                    border-top: 1px solid #dee2e6;
                    padding-top: 20px;
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
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    width: 500px;
                    max-width: 90%;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }
            </style>
            
            <div class="input-section">
                <h3>건별 주문 입력</h3>
                
                <form id="inputOrderForm">
                    <div class="form-row">
                        <div class="form-group" style="width: 120px;">
                            <label>구분 <span class="required">*</span></label>
                            <select class="form-input" id="inputOrderType">
                                <option value="">선택</option>
                                <option value="CS발송">CS발송</option>
                                <option value="전화주문">전화주문</option>
                            </select>
                        </div>
                        
                        <div class="form-group" style="width: 200px;">
                            <label>상품 검색</label>
                            <div style="position: relative;">
                                <input type="text" class="form-input" id="inputProductSearch" placeholder="상품명 검색...">
                                <div id="productSearchResults" class="search-results"></div>
                            </div>
                        </div>
                        
                        <div class="form-group" style="width: 250px;">
                            <label>옵션명 <span class="required">*</span></label>
                            <input type="text" class="form-input" id="inputOptionName" readonly>
                        </div>
                        
                        <div class="form-group" style="width: 100px;">
                            <label>단가 <span class="required">*</span></label>
                            <input type="number" class="form-input" id="inputUnitPrice">
                        </div>
                        
                        <div class="form-group" style="width: 100px;">
                            <label>수량 <span class="required">*</span></label>
                            <div class="quantity-control">
                                <button type="button" class="qty-btn" onclick="OrderInputHandler.changeQuantity(-1)">−</button>
                                <input type="number" class="qty-input" id="inputQuantity" value="1" min="1">
                                <button type="button" class="qty-btn" onclick="OrderInputHandler.changeQuantity(1)">+</button>
                            </div>
                        </div>
                        
                        <div class="form-group" style="width: 100px;">
                            <label>택배비</label>
                            <input type="number" class="form-input" id="inputShipping" value="0">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group" style="width: 120px;">
                            <label>주문자</label>
                            <input type="text" class="form-input" id="inputOrderer">
                        </div>
                        
                        <div class="form-group" style="width: 150px;">
                            <label>주문자 전화번호</label>
                            <input type="tel" class="form-input" id="inputOrdererPhone">
                        </div>
                        
                        <div class="form-group" style="width: 120px;">
                            <label>수령인 <span class="required">*</span></label>
                            <input type="text" class="form-input" id="inputReceiver">
                        </div>
                        
                        <div class="form-group" style="width: 150px;">
                            <label>수령인 전화번호 <span class="required">*</span></label>
                            <input type="tel" class="form-input" id="inputReceiverPhone">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group" style="flex: 1;">
                            <label>주소 <span class="required">*</span></label>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" class="form-input" id="inputAddress" readonly style="flex: 1;">
                                <button type="button" class="btn-address" onclick="OrderInputHandler.searchAddress()">주소검색</button>
                            </div>
                        </div>
                        
                        <div class="form-group" style="width: 300px;">
                            <label>배송 메시지</label>
                            <input type="text" class="form-input" id="inputDeliveryMsg">
                        </div>
                        
                        <div class="form-group" style="align-self: flex-end;">
                            <button type="button" class="btn-primary" onclick="OrderInputHandler.addOrder()">주문 추가</button>
                        </div>
                    </div>
                </form>
                
                <div id="inputMessage" class="message"></div>
                
                <div class="order-list">
                    <h4>추가된 주문 목록</h4>
                    <div id="inputOrderList">
                        <p style="text-align: center; color: #6c757d;">추가된 주문이 없습니다</p>
                    </div>
                </div>
            </div>
            
            <!-- 주소 모달 -->
            <div id="addressModal" class="address-modal">
                <div class="address-modal-content">
                    <h3>주소 상세 입력</h3>
                    <div style="margin: 20px 0;">
                        <p><strong>우편번호:</strong> <span id="modalZipcode"></span></p>
                        <p><strong>주소:</strong> <span id="modalAddress"></span></p>
                    </div>
                    <div class="form-group">
                        <label>상세주소</label>
                        <input type="text" class="form-input" id="modalDetail" placeholder="상세주소를 입력하세요">
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button class="btn-address" onclick="OrderInputHandler.cancelAddress()" style="margin-right: 8px;">취소</button>
                        <button class="btn-primary" onclick="OrderInputHandler.confirmAddress()">확인</button>
                    </div>
                </div>
            </div>
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
    
    setupEventListeners() {
        const searchInput = document.getElementById('inputProductSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchProduct());
        }
        
        ['inputUnitPrice', 'inputQuantity', 'inputShipping'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.calculateTotal());
        });
    },
    
    searchProduct() {
        const input = document.getElementById('inputProductSearch');
        const keyword = input.value.toLowerCase();
        const results = document.getElementById('productSearchResults');
        
        if (keyword.length < 2) {
            results.classList.remove('show');
            return;
        }
        
        const matches = Object.keys(this.productData).filter(name => 
            name.toLowerCase().includes(keyword)
        ).slice(0, 10);
        
        if (matches.length > 0) {
            results.innerHTML = matches.map(name => 
                `<div class="search-item" onclick="OrderInputHandler.selectProduct('${name.replace(/'/g, "\\'")}')">${name}</div>`
            ).join('');
            results.classList.add('show');
        } else {
            results.classList.remove('show');
        }
    },
    
    selectProduct(name) {
        document.getElementById('inputOptionName').value = name;
        document.getElementById('productSearchResults').classList.remove('show');
        document.getElementById('inputProductSearch').value = '';
        
        if (this.productData[name] && this.productData[name]['셀러공급가']) {
            document.getElementById('inputUnitPrice').value = this.productData[name]['셀러공급가'];
        }
    },
    
    changeQuantity(delta) {
        const input = document.getElementById('inputQuantity');
        const current = parseInt(input.value) || 1;
        input.value = Math.max(1, current + delta);
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
    
    addOrder() {
        // 유효성 검사
        const required = ['inputOrderType', 'inputOptionName', 'inputUnitPrice', 'inputReceiver', 'inputReceiverPhone', 'inputAddress'];
        for (const id of required) {
            if (!document.getElementById(id).value) {
                this.showMessage('필수 항목을 모두 입력하세요.', 'error');
                return;
            }
        }
        
        const orderData = {
            마켓명: document.getElementById('inputOrderType').value,
            옵션명: document.getElementById('inputOptionName').value,
            단가: parseFloat(document.getElementById('inputUnitPrice').value),
            수량: parseInt(document.getElementById('inputQuantity').value) || 1,
            택배비: parseFloat(document.getElementById('inputShipping').value) || 0,
            주문자: document.getElementById('inputOrderer').value,
            '주문자 전화번호': document.getElementById('inputOrdererPhone').value,
            수령인: document.getElementById('inputReceiver').value,
            '수령인 전화번호': document.getElementById('inputReceiverPhone').value,
            주소: document.getElementById('inputAddress').value,
            배송메세지: document.getElementById('inputDeliveryMsg').value
        };
        
        this.manualOrders.push(orderData);
        this.updateOrderList();
        this.resetForm();
        this.showMessage(`주문이 추가되었습니다. (총 ${this.manualOrders.length}건)`, 'success');
    },
    
    updateOrderList() {
        const list = document.getElementById('inputOrderList');
        if (this.manualOrders.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #6c757d;">추가된 주문이 없습니다</p>';
            return;
        }
        
        list.innerHTML = this.manualOrders.map((order, index) => `
            <div class="order-item">
                <div class="order-info">
                    <span>${order.마켓명}</span>
                    <span>${order.옵션명}</span>
                    <span>수량: ${order.수량}</span>
                    <span>${order.수령인}</span>
                </div>
                <button class="btn-remove" onclick="OrderInputHandler.removeOrder(${index})">삭제</button>
            </div>
        `).join('');
    },
    
    removeOrder(index) {
        this.manualOrders.splice(index, 1);
        this.updateOrderList();
    },
    
    resetForm() {
        document.getElementById('inputOrderForm').reset();
        document.getElementById('inputQuantity').value = '1';
    },
    
    showMessage(text, type) {
        const msg = document.getElementById('inputMessage');
        msg.textContent = text;
        msg.className = `message ${type} show`;
        setTimeout(() => msg.classList.remove('show'), 3000);
    }
};