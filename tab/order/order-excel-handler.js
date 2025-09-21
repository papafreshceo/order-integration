window.OrderExcelHandler = {
    panel: null,
    uploadedFiles: [],
    
    init() {
        this.panel = document.getElementById('om-panel-excel');
        this.createUI();
    },
    
    createUI() {
        this.panel.innerHTML = `
            <div class="om-table-header">
                <h3 class="om-table-title">Excel 주문 통합</h3>
                <div class="om-table-controls">
                    <button class="om-btn" onclick="OrderExcelHandler.selectFile()">파일 선택</button>
                    <span id="om-excel-status" style="margin-left:12px;color:#6c757d;font-size:12px"></span>
                </div>
                <div class="om-table-actions">
                    <button class="om-btn" onclick="OrderExcelHandler.verify()">검증</button>
                    <button class="om-btn om-btn-primary" onclick="OrderExcelHandler.process()">통합 실행</button>
                </div>
            </div>
            <div style="padding:24px">
                <div id="om-excel-drop" style="border:2px dashed #dee2e6;border-radius:8px;padding:40px;text-align:center;cursor:pointer"
                     ondrop="OrderExcelHandler.handleDrop(event)"
                     ondragover="event.preventDefault()"
                     ondragleave="event.currentTarget.style.borderColor='#dee2e6'"
                     ondragenter="event.currentTarget.style.borderColor='#2563eb'">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2" style="margin:0 auto">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p style="margin-top:12px;color:#6c757d">Excel 파일을 드래그하거나 클릭하여 선택</p>
                </div>
                <input type="file" id="om-excel-file" accept=".xlsx,.xls,.csv" multiple style="display:none" onchange="OrderExcelHandler.handleFiles(event)">
            </div>
            <div class="om-table-wrapper">
                <table class="om-table">
                    <thead></thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
    },
    
    selectFile() {
        document.getElementById('om-excel-file').click();
    },
    
    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.style.borderColor = '#dee2e6';
        this.handleFiles(e);
    },
    
    handleFiles(e) {
        const files = e.target.files || e.dataTransfer.files;
        this.uploadedFiles = Array.from(files);
        
        document.getElementById('om-excel-status').textContent = 
            `${this.uploadedFiles.length}개 파일 선택됨`;
    },
    
    verify() {
        if (this.uploadedFiles.length === 0) {
            alert('파일을 선택하세요');
            return;
        }
        alert('검증 기능 구현 예정');
    },
    
    process() {
        if (this.uploadedFiles.length === 0) {
            alert('파일을 선택하세요');
            return;
        }
        alert('통합 기능 구현 예정');
    }
};