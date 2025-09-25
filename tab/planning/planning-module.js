// planning-module.js
window.PlanningModule = {
    currentView: 'calendar',
    currentDate: new Date(),
    currentTab: 'tasks', // tasks, short, long
    tasksData: [],
    shortTermData: [],
    longTermData: [],
    
    async init() {
        await this.loadAllData();
        this.render();
        this.bindEvents();
    },
    
    async loadAllData() {
        try {
            // 업무지시 데이터
            const tasksResponse = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getData',
                    spreadsheetId: '1PhLfmWEP-XZ_3cv85okVksG3Q28zwS8qE7L5kyW76SY',
                    range: '업무지시!A:K'
                })
            });
            
            // 단기계획 데이터
            const shortResponse = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getData',
                    spreadsheetId: '1PhLfmWEP-XZ_3cv85okVksG3Q28zwS8qE7L5kyW76SY',
                    range: '단기계획!A:L'
                })
            });
            
            // 장기계획 데이터
            const longResponse = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getData',
                    spreadsheetId: '1PhLfmWEP-XZ_3cv85okVksG3Q28zwS8qE7L5kyW76SY',
                    range: '장기계획!A:M'
                })
            });
            
            const tasksResult = await tasksResponse.json();
            const shortResult = await shortResponse.json();
            const longResult = await longResponse.json();
            
            if (tasksResult.success) {
                this.tasksData = this.parseSheetData(tasksResult.data);
            }
            if (shortResult.success) {
                this.shortTermData = this.parseSheetData(shortResult.data);
            }
            if (longResult.success) {
                this.longTermData = this.parseSheetData(longResult.data);
            }
        } catch (error) {
            console.error('데이터 로드 실패:', error);
        }
    },
    
    parseSheetData(data) {
        if (!data || data.length < 2) return [];
        const headers = data[0];
        return data.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
            });
            return obj;
        });
    },
    
    render() {
        const container = document.getElementById('planning-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="planning-header">
                <div class="tabs">
                    <button class="tab-btn ${this.currentTab === 'tasks' ? 'active' : ''}" 
                            onclick="PlanningModule.switchTab('tasks')">업무지시</button>
                    <button class="tab-btn ${this.currentTab === 'short' ? 'active' : ''}" 
                            onclick="PlanningModule.switchTab('short')">단기계획</button>
                    <button class="tab-btn ${this.currentTab === 'long' ? 'active' : ''}" 
                            onclick="PlanningModule.switchTab('long')">장기계획</button>
                </div>
                <div class="view-toggle">
                    <button class="view-btn ${this.currentView === 'calendar' ? 'active' : ''}" 
                            onclick="PlanningModule.switchView('calendar')">캘린더</button>
                    <button class="view-btn ${this.currentView === 'list' ? 'active' : ''}" 
                            onclick="PlanningModule.switchView('list')">리스트</button>
                </div>
            </div>
            
            <div class="planning-content">
                ${this.currentView === 'calendar' ? this.renderCalendar() : this.renderList()}
            </div>
            
            <button class="fab-add" onclick="PlanningModule.openAddModal()">+</button>
        `;
    },
    
    renderCalendar() {
        // 캘린더 렌더링 로직
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 해당 월의 업무 필터링
        const monthTasks = this.filterTasksByMonth(year, month);
        
        return `
            <div class="calendar-navigation">
                <button onclick="PlanningModule.previousMonth()">◀</button>
                <span class="current-month">${year}년 ${month + 1}월</span>
                <button onclick="PlanningModule.nextMonth()">▶</button>
                <button onclick="PlanningModule.goToToday()">오늘</button>
            </div>
            <div class="calendar-grid">
                ${this.generateCalendarGrid(year, month, monthTasks)}
            </div>
        `;
    },
    
    renderList() {
        let data = [];
        if (this.currentTab === 'tasks') data = this.tasksData;
        else if (this.currentTab === 'short') data = this.shortTermData;
        else data = this.longTermData;
        
        // 상태별 그룹화
        const grouped = {
            '진행중': [],
            '대기': [],
            '완료': []
        };
        
        data.forEach(item => {
            const status = item['상태'] || '대기';
            if (!grouped[status]) grouped[status] = [];
            grouped[status].push(item);
        });
        
        return `
            <div class="list-view">
                ${Object.entries(grouped).map(([status, items]) => `
                    <div class="list-group">
                        <h3 class="group-title">${status} (${items.length})</h3>
                        <div class="list-items">
                            ${items.map(item => this.renderListItem(item)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    renderListItem(item) {
        const priorityClass = {
            '높음': 'priority-high',
            '중간': 'priority-medium', 
            '낮음': 'priority-low',
            '긴급': 'priority-urgent'
        };
        
        if (this.currentTab === 'tasks') {
            return `
                <div class="list-item ${priorityClass[item['우선순위']] || ''}">
                    <div class="item-header">
                        <span class="item-title">${item['업무제목']}</span>
                        <span class="item-priority">${item['우선순위']}</span>
                    </div>
                    <div class="item-meta">
                        <span>담당자: ${item['담당자']}</span>
                        <span>마감일: ${item['마감일']}</span>
                    </div>
                    <div class="item-content">${item['업무내용']}</div>
                </div>
            `;
        }
        // 단기계획, 장기계획 렌더링...
    },
    
    async saveTask(data) {
        const range = this.currentTab === 'tasks' ? '업무지시' : 
                     this.currentTab === 'short' ? '단기계획' : '장기계획';
        
        const response = await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'appendData',
                spreadsheetId: '1PhLfmWEP-XZ_3cv85okVksG3Q28zwS8qE7L5kyW76SY',
                range: `${range}!A:Z`,
                values: [Object.values(data)]
            })
        });
        
        const result = await response.json();
        if (result.success) {
            await this.loadAllData();
            this.render();
        }
    }
};