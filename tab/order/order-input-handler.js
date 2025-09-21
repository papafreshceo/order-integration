window.OrderInputHandler = {
    manualOrders: [],
    tempAddressData: {},
    productData: {},
    
    async init() {
        await this.loadProductData();
        this.setupEventListeners();
        console.log('OrderInputHandler 초기화 완료');
    },
    
    async loadProductData() {
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
                this.productData = result.productData;
                console.log('제품 데이터 로드:', Object.keys(this.productData).length);
            }
        } catch (error) {
            console.error('제품 데이터 로드 실패:', error);
        }
    },
    
    setupEventListeners() {
        // 상품 검색
        const searchInput = document.getElementById('manualProductSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchProduct());
        }
        
        // 가격 계산 이벤트
        const priceInputs = ['manualUnitPrice', 'manualQuantity', 'manualShippingCost', 'manualExtraCost'];
        priceInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => this.calculateTotal());
            }
        });
        
        // 주문 추가 버튼
        const addBtn = document.getElementById('addManualOrder');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addOrder());
        }
        
        // 주소 모달 이벤트
        const addressModal = document.getElementById('addressModal');
        if (addressModal) {
            addressModal.addEventListener('click', (e) => {
                if (e.target === addressModal) {
                    this.cancelAddressModal();
                }
            });
        }
        
        const detailInput = document.getElementById('modalAddressDetail');
        if (detailInput) {
            detailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.confirmAddress();
                }
            });
        }
    },
    
    searchProduct() {
        const input = document.getElementById('manualProductSearch');
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
    
    selectProduct(productName) {
        document.getElementById('manualOptionName').value = productName;
        document.getElementById('productSearchResults').classList.remove('show');
        document.getElementById('manualProductSearch').value = '';
        
        // 제품 정보 적용
        if (this.productData[productName]) {
            const info = this.productData[productName];
            if (info['셀러공급가']) {
                document.getElementById('manualUnitPrice').value = info['셀러공급가'];
                this.calculateTotal();
            }
        }
    },
    
    changeQuantity(delta) {
        const input = document.getElementById('manualQuantity');
        const current = parseInt(input.value) || 1;
        const newValue = Math.max(1, current + delta);
        input.value = newValue;
        this.calculateTotal();
    },
    
    validateQuantity() {
        const input = document.getElementById('manualQuantity');
        const value = parseInt(input.value) || 1;
        input.value = Math.max(1, value);
        this.calculateTotal();
    },
    
    calculateTotal() {
        const unitPrice = parseFloat(document.getElementById('manualUnitPrice').value) || 0;
        const quantity = parseInt(document.getElementById('manualQuantity').value) || 1;
        const shipping = parseFloat(document.getElementById('manualShippingCost').value) || 0;
        const extra = parseFloat(document.getElementById('manualExtraCost').value) || 0;
        
        const total = (unitPrice * quantity) + shipping + extra;
        document.getElementById('manualTotalAmount').value = total.toLocaleString('ko-KR');
    },
    
    searchAddress() {
        new daum.Postcode({
            oncomplete: (data) => {
                this.tempAddressData.zonecode = data.zonecode;
                this.tempAddressData.address = data.roadAddress || data.jibunAddress;
                
                if(data.buildingName !== '') {
                    this.tempAddressData.address += ' (' + data.buildingName + ')';
                }
                
                document.getElementById('modalZipcode').textContent = this.tempAddressData.zonecode;
                document.getElementById('modalAddress').textContent = this.tempAddressData.address;
                document.getElementById('modalAddressDetail').value = '';
                document.getElementById('addressModal').classList.add('show');
                
                setTimeout(() => {
                    document.getElementById('modalAddressDetail').focus();
                }, 100);
            }
        }).open();
    },
    
    confirmAddress() {
        const detailAddress = document.getElementById('modalAddressDetail').value.trim();
        
        let fullAddress = this.tempAddressData.address;
        if (detailAddress) {
            fullAddress += ' ' + detailAddress;
        }
        
        document.getElementById('manualAddress').value = fullAddress;
        document.getElementById('addressModal').classList.remove('show');
        
        const deliveryMsg = document.getElementById('manualDeliveryMsg');
        if (deliveryMsg) {
            deliveryMsg.focus();
        }
    },
    
    cancelAddressModal() {
        document.getElementById('addressModal').classList.remove('show');
        this.tempAddressData = {};
    },
    
    addOrder() {
        // 유효성 검사
        const orderType = document.getElementById('manualOrderType').value;
        const optionName = document.getElementById('manualOptionName').value;
        const unitPrice = document.getElementById('manualUnitPrice').value;
        const receiver = document.getElementById('manualReceiver').value;
        const receiverPhone = document.getElementById('manualReceiverPhone').value;
        const address = document.getElementById('manualAddress').value;
        
        if (!orderType) {
            this.showError('구분을 선택해주세요.');
            return;
        }
        
        if (!optionName || !unitPrice) {
            this.showError('상품 정보를 입력해주세요.');
            return;
        }
        
        if (!receiver || !receiverPhone || !address) {
            this.showError('수령인 정보를 모두 입력해주세요.');
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
        this.manualOrders.push(orderData);
        this.updateOrderList();
        
        // 폼 초기화
        this.resetForm();
        
        this.showSuccess(`주문이 추가되었습니다. (총 ${this.manualOrders.length}건)`);
    },
    
    updateOrderList() {
        const list = document.getElementById('manualOrderList');
        
        if (this.manualOrders.length === 0) {
            list.innerHTML = '<div class="empty-list">추가된 주문이 없습니다</div>';
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
                </div>
                <button class="btn-remove" onclick="OrderInputHandler.removeOrder(${index})">삭제</button>
            </div>
        `).join('');
    },
    
    removeOrder(index) {
        this.manualOrders.splice(index, 1);
        this.updateOrderList();
        this.showSuccess(`주문이 삭제되었습니다. (남은 주문: ${this.manualOrders.length}건)`);
    },
    
    resetForm() {
        document.getElementById('manualOrderForm').reset();
        document.getElementById('manualQuantity').value = '1';
        document.getElementById('manualTotalAmount').value = '';
    },
    
    showError(message) {
        const el = document.getElementById('manualOrderError');
        el.textContent = message;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 3000);
    },
    
    showSuccess(message) {
        const el = document.getElementById('manualOrderSuccess');
        el.textContent = message;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 3000);
    },
    
    // 외부에서 호출 가능한 메서드
    getOrders() {
        return this.manualOrders;
    },
    
    clearOrders() {
        this.manualOrders = [];
        this.updateOrderList();
    }
};