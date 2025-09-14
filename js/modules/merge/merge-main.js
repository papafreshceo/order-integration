// js/modules/merge/merge-main.js - 메인 컨트롤러

window.MergeModule = {
    // 상태 관리
    state: {
        uploadedFiles: [],
        mappingData: null,
        processedData: null,
        statistics: null
    },
    
    // 초기화
    async init() {
        console.log('MergeModule 초기화');
        
        // 매핑 데이터 로드
        await this.loadMappingData();
        
        // UI 초기화
        MergeUI.init();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
    },
    
    // 매핑 데이터 로드
    async loadMappingData() {
        try {
            const response = await fetch('/api/merge-mapping');
            const data = await response.json();
            
            if (data.success) {
                this.state.mappingData = data.mapping;
                console.log('매핑 데이터 로드 완료:', this.state.mappingData);
            }
        } catch (error) {
            console.error('매핑 데이터 로드 실패:', error);
            // 기본 매핑 사용
            this.state.mappingData = MERGE_CONFIG;
        }
    },
    
    // 이벤트 리스너 설정
    setupEventListeners() {
        // 파일 업로드
        const fileInput = document.getElementById('mergeFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        // 드래그앤드롭
        const dropZone = document.getElementById('mergeDropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            dropZone.addEventListener('drop', (e) => this.handleDrop(e));
            dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        }
        
        // 처리 버튼
        const processBtn = document.getElementById('mergeProcessBtn');
        if (processBtn) {
            processBtn.addEventListener('click', () => this.processFiles());
        }
        
        // 내보내기 버튼
        const exportBtn = document.getElementById('mergeExportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
    },
    
    // 파일 선택 처리
    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.addFiles(files);
    },
    
    // 드래그 오버
    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('dragover');
    },
    
    // 드롭
    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
        
        const files = Array.from(event.dataTransfer.files);
        this.addFiles(files);
    },
    
    // 드래그 나감
    handleDragLeave(event) {
        event.currentTarget.classList.remove('dragover');
    },
    
    // 파일 추가
    async addFiles(files) {
        const validFiles = files.filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            return ['xlsx', 'xls', 'csv'].includes(ext);
        });
        
        if (validFiles.length === 0) {
            ToastManager.warning('유효한 엑셀 파일이 없습니다');
            return;
        }
        
        for (const file of validFiles) {
            await MergeReader.readFile(file);
        }
        
        MergeUI.updateFileList(this.state.uploadedFiles);
    },
    
    // 파일 처리
    async processFiles() {
        if (this.state.uploadedFiles.length === 0) {
            ToastManager.warning('업로드된 파일이 없습니다');
            return;
        }
        
        LoadingManager.showFullLoading();
        
        try {
            // 데이터 처리
            const result = await MergeProcessor.process(this.state.uploadedFiles, this.state.mappingData);
            this.state.processedData = result.data;
            
            // 통계 생성
            this.state.statistics = MergeStatistics.generate(result.data);
            
            // UI 업데이트
            MergeUI.displayResults(result.data, this.state.statistics);
            
            ToastManager.success(`${result.data.length}개 주문 통합 완료`);
        } catch (error) {
            console.error('파일 처리 실패:', error);
            ToastManager.error('파일 처리 중 오류가 발생했습니다');
        } finally {
            LoadingManager.hideFullLoading();
        }
    },
    
    // 데이터 내보내기
    async exportData() {
        if (!this.state.processedData) {
            ToastManager.warning('내보낼 데이터가 없습니다');
            return;
        }
        
        const type = await MergeUI.showExportDialog();
        
        if (type === 'excel') {
            MergeExport.toExcel(this.state.processedData, this.state.statistics);
        } else if (type === 'sheets') {
            await MergeExport.toSheets(this.state.processedData, this.state.statistics);
        }
    },
    
    // 파일 제거
    removeFile(index) {
        this.state.uploadedFiles.splice(index, 1);
        MergeUI.updateFileList(this.state.uploadedFiles);
    }
};