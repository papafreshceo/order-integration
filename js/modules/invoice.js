// js/modules/invoice.js - 송장등록 모듈

window.InvoiceModule = {
    // 송장 등록
    register() {
        const orderNo = document.getElementById('orderNo').value;
        const invoiceNo = document.getElementById('invoiceNo').value;
        const courier = document.getElementById('courier').value;
        
        if (!orderNo || !invoiceNo) {
            alert('주문번호와 송장번호를 입력해주세요');
            return;
        }
        
        const resultDiv = document.getElementById('invoiceResult');
        if (resultDiv) {
            resultDiv.innerHTML = `<p class="info-text">등록 중...</p>`;
            
            // API 호출 시뮬레이션
            setTimeout(() => {
                resultDiv.innerHTML = `
                    <p class="info-text" style="color: #10b981;">
                        ✓ 송장 등록 완료<br>
                        주문번호: ${orderNo}<br>
                        송장번호: ${invoiceNo}<br>
                        택배사: ${courier}
                    </p>
                `;
                
                // 입력 필드 초기화
                document.getElementById('orderNo').value = '';
                document.getElementById('invoiceNo').value = '';
            }, 1000);
        }
    }
};

// 전역 함수로 등록
window.registerInvoice = function() {
    InvoiceModule.register();
};