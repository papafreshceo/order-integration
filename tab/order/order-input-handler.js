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

                .list-body {
                    padding: 20px;
                    max-height: 400px;
                    overflow-y: auto;
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
                    text-align: center;
                    padding: 40px;
                    color: #6c757d;
                    font-size: 14px;
                    font-weight: 300;
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
                                    <option value="">선택</option>
                                    <option value="CS발송">CS발송</option>
                                    <option value="전화주문">전화주문</option>
                                </select>
                            </div>
                            
                            <div class="form-group" style="width: 100px;">
                                <label class="form-label">품종</label>
                                <div style="position: relative;">
                                    <input type="text" class="form-input" id="inputBreed" placeholder="품종 입력">
                                    <div id="breedSearchResults" class="search-results"></div>
                                </div>
                            </div>
                            
                            <div class="form-group" style="width: 100px;">
                                <label class="form-label">품목</label>
                                <div style="position: relative;">
                                    <input type="text" class="form-input" id="inputItem" placeholder="품목 입력">
                                    <div id="itemSearchResults" class="search-results"></div>
                                </div>
                            </div>
                            
                            <div class="form-group" style="width: 250px;">
                                <label class="form-label">옵션명 <span class="required">*</span></label>
                                <div style="position: relative;">
                                    <input type="text" class="form-input" id="inputOptionName" placeholder="품종/품목 선택 또는 직접 입력">
                                    <div id="optionSearchResults" class="search-results"></div>
                                </div>
                            </div>
                            
                            <div class="form-group" style="width: 100px;">
                                <label class="form-label">단가 <span class="required">*</span></label>
                                <input type="number" class="form-input" id="inputUnitPrice" style="text-align: right;">
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
                                <input type="number" class="form-input" id="inputShipping" value="0" style="text-align: right;">
                            </div>

                            <div class="form-group" style="width: 140px;">
                                <label class="form-label">발송요청일</label>
                                <input type="date" class="form-input" id="inputRequestDate">
                            </div>
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
                                <div style="display: flex; gap: 8px; align-items: center;">
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

                <div class="order-list-section">
                    <div class="list-header">
                        <h3 class="list-title">추가된 주문 목록</h3>
                        <div>
                            <span style="font-size: 14px; color: #6c757d;">
                                총 <span id="totalOrderCount" style="color: #2563eb; font-weight: 500;">0</span>건
                            </span>
                        </div>
                    </div>
                    <div class="list-body">
                        <div id="inputOrderList">
                            <div class="empty-message">추가된 주문이 없습니다</div>
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
        // 품종 검색
        const breedInput = document.getElementById('inputBreed');
        if (breedInput) {
            breedInput.addEventListener('input', () => this.searchBreed());
        }
        
        // 품목 검색
        const itemInput = document.getElementById('inputItem');
        if (itemInput) {
            itemInput.addEventListener('input', () => this.searchItem());
        }
        
        // 옵션명 검색
        const optionInput = document.getElementById('inputOptionName');
        if (optionInput) {
            optionInput.addEventListener('input', () => this.searchOption());
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
        const selectedBreed = document.getElementById('inputBreed').value;
        const selectedItem = document.getElementById('inputItem').value;
        
        if (keyword.length < 2) {
            results.classList.remove('show');
            return;
        }
        
        let matches = Object.keys(this.productData).filter(optionName => {
            const product = this.productData[optionName];
            
            if (selectedBreed && product['품종'] !== selectedBreed) return false;
            if (selectedItem && product['품목'] !== selectedItem) return false;
            
            return optionName.toLowerCase().includes(keyword);
        }).slice(0, 10);
        
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
        document.getElementById('inputOptionName').value = name;
        document.getElementById('optionSearchResults').classList.remove('show');
        
        if (this.productData[name]) {
            const product = this.productData[name];
            
            if (product['품종']) {
                document.getElementById('inputBreed').value = product['품종'];
            }
            if (product['품목']) {
                document.getElementById('inputItem').value = product['품목'];
            }
            if (product['셀러공급가']) {
                document.getElementById('inputUnitPrice').value = product['셀러공급가'];
            }
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
    
    addOrder() {
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
            주문자: document.getElementById('inputOrderer').value || document.getElementById('inputReceiver').value,
            '주문자 전화번호': document.getElementById('inputOrdererPhone').value || document.getElementById('inputReceiverPhone').value,
            수령인: document.getElementById('inputReceiver').value,
            '수령인 전화번호': document.getElementById('inputReceiverPhone').value,
            주소: document.getElementById('inputAddress').value,
            배송메세지: document.getElementById('inputDeliveryMsg').value,
            발송요청일: document.getElementById('inputRequestDate').value,
            품종: document.getElementById('inputBreed').value,
            품목: document.getElementById('inputItem').value
        };
        
        orderData['상품금액'] = (orderData.단가 * orderData.수량) + orderData.택배비;
        
        this.manualOrders.push(orderData);
        this.updateOrderList();
        this.resetForm();
        this.showMessage(`주문이 추가되었습니다. (총 ${this.manualOrders.length}건)`, 'success');
    },
    
    updateOrderList() {
        const list = document.getElementById('inputOrderList');
        const count = document.getElementById('totalOrderCount');
        
        if (count) {
            count.textContent = this.manualOrders.length;
        }
        
        if (this.manualOrders.length === 0) {
            list.innerHTML = '<div class="empty-message">추가된 주문이 없습니다</div>';
            return;
        }
        
        list.innerHTML = this.manualOrders.map((order, index) => `
            <div class="order-item">
                <div class="order-info">
                    <div><span class="order-label">구분:</span> <span class="order-value">${order.마켓명}</span></div>
                    <div><span class="order-label">상품:</span> <span class="order-value">${order.옵션명}</span></div>
                    <div><span class="order-label">수량:</span> <span class="order-value">${order.수량}</span></div>
                    <div><span class="order-label">수령인:</span> <span class="order-value">${order.수령인}</span></div>
                    <div><span class="order-label">금액:</span> <span class="order-value">${order.상품금액.toLocaleString('ko-KR')}원</span></div>
                    ${order.발송요청일 ? `<div><span class="order-label">발송요청일:</span> <span class="order-value">${order.발송요청일}</span></div>` : ''}
                </div>
                <button class="btn-remove" onclick="OrderInputHandler.removeOrder(${index})">삭제</button>
            </div>
        `).join('');
    },
    
    removeOrder(index) {
        this.manualOrders.splice(index, 1);
        this.updateOrderList();
        this.showMessage(`주문이 삭제되었습니다. (남은 주문: ${this.manualOrders.length}건)`, 'success');
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
        // 필요시 총액 계산 로직
    }
};