class Dashboard {
    constructor() {
        this.currentSection = 'overview';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        this.charts = {};
        this.isScraping = false;
        this.shouldStopScraping = false;

        this.init();
        this.setupEventListeners();
        this.loadDashboardData();
    }

    init() {
        // Check authentication
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }

        // Update user info
        document.getElementById('userFullname').textContent = currentUser.firstName;
        document.getElementById('userEmail').textContent = currentUser.email;

        // Initialize charts
        this.initCharts();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('a').getAttribute('href').substring(1);
                this.navigateToSection(section);
            });
        });

        // Sidebar toggle
        document.getElementById('toggleSidebar').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Filters
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        // Data actions
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('importData').addEventListener('click', () => this.importData());
        document.getElementById('clearData').addEventListener('click', () => this.confirmClearData());

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage').addEventListener('click', () => this.nextPage());

        // Scraping
        document.getElementById('scrapeForm').addEventListener('submit', (e) => this.handleScrape(e));
        document.getElementById('stopScrape').addEventListener('click', () => this.stopScraping());
        document.getElementById('clearLog').addEventListener('click', () => this.clearLog());

        // Settings
        document.getElementById('profileForm').addEventListener('submit', (e) => this.handleProfileUpdate(e));
        document.getElementById('passwordForm').addEventListener('submit', (e) => this.handlePasswordUpdate(e));
        document.getElementById('notificationForm').addEventListener('submit', (e) => this.handleNotificationSettings(e));

        // Data management
        document.getElementById('backupData').addEventListener('click', () => this.backupData());
        document.getElementById('restoreData').addEventListener('click', () => this.restoreData());
        document.getElementById('clearAllData').addEventListener('click', () => this.confirmClearAllData());

        // Modal actions
        document.getElementById('confirmAction').addEventListener('click', () => this.handleConfirmAction());
        document.getElementById('cancelAction').addEventListener('click', () => this.hideModal());
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelpModal());
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => this.hideModal());
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Password visibility toggles
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => this.togglePasswordVisibility(e));
        });
    }

    navigateToSection(section) {
        // Update active section
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
        document.querySelector(`.nav-links a[href="#${section}"]`).parentElement.classList.add('active');

        // Update current section
        this.currentSection = section;

        // Load section-specific data
        if (section === 'data-management') {
            this.loadDataTable();
        } else if (section === 'analytics') {
            this.updateCharts();
        }
    }

    async loadDashboardData() {
        try {
            // Load statistics
            const stats = await this.getStatistics();
            this.updateStatistics(stats);

            // Load recent activity
            const activities = await this.getRecentActivity();
            this.updateActivityList(activities);

            // Update charts if on analytics section
            if (this.currentSection === 'analytics') {
                this.updateCharts();
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showAlert('Error loading dashboard data', 'error');
        }
    }

    async getStatistics() {
        // In a real application, this would fetch from an API
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const colleges = new Set(students.map(s => s.college));
        const sessions = new Set(students.map(s => s.session));

        return {
            totalStudents: students.length,
            totalColleges: colleges.size,
            activeSessions: sessions.size,
            lastUpdate: new Date().toLocaleString()
        };
    }

    updateStatistics(stats) {
        document.getElementById('totalStudents').textContent = stats.totalStudents;
        document.getElementById('totalColleges').textContent = stats.totalColleges;
        document.getElementById('activeSessions').textContent = stats.activeSessions;
        document.getElementById('lastUpdate').textContent = stats.lastUpdate;
    }

    async getRecentActivity() {
        // In a real application, this would fetch from an API
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        return activities.slice(0, 5); // Return last 5 activities
    }

    updateActivityList(activities) {
        const activityList = document.getElementById('activityList');
        activityList.innerHTML = '';

        activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = `activity-item ${activity.type}`;
            item.innerHTML = `
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-info">
                    <p>${activity.message}</p>
                    <small>${activity.details}</small>
                </div>
                <div class="activity-time">${activity.time}</div>
            `;
            activityList.appendChild(item);
        });
    }

    getActivityIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'warning': return 'fa-exclamation-circle';
            case 'error': return 'fa-times-circle';
            default: return 'fa-info-circle';
        }
    }

    initCharts() {
        // College Distribution Chart
        this.charts.college = new Chart(document.getElementById('collegeChart'), {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
                        '#f59e0b', '#10b981', '#3b82f6', '#6b7280'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });

        // Session Distribution Chart
        this.charts.session = new Chart(document.getElementById('sessionChart'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Students per Session',
                    data: [],
                    backgroundColor: '#6366f1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Yearly Growth Chart
        this.charts.growth = new Chart(document.getElementById('growthChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Student Growth',
                    data: [],
                    borderColor: '#6366f1',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Data Quality Chart
        this.charts.quality = new Chart(document.getElementById('qualityChart'), {
            type: 'doughnut',
            data: {
                labels: ['Complete', 'Partial', 'Missing'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    updateCharts() {
        const students = JSON.parse(localStorage.getItem('students') || '[]');

        // Update College Distribution
        const collegeData = this.getCollegeDistribution(students);
        this.charts.college.data.labels = collegeData.labels;
        this.charts.college.data.datasets[0].data = collegeData.values;
        this.charts.college.update();

        // Update Session Distribution
        const sessionData = this.getSessionDistribution(students);
        this.charts.session.data.labels = sessionData.labels;
        this.charts.session.data.datasets[0].data = sessionData.values;
        this.charts.session.update();

        // Update Yearly Growth
        const growthData = this.getYearlyGrowth(students);
        this.charts.growth.data.labels = growthData.labels;
        this.charts.growth.data.datasets[0].data = growthData.values;
        this.charts.growth.update();

        // Update Data Quality
        const qualityData = this.getDataQuality(students);
        this.charts.quality.data.datasets[0].data = qualityData;
        this.charts.quality.update();
    }

    getCollegeDistribution(students) {
        const distribution = {};
        students.forEach(student => {
            distribution[student.college] = (distribution[student.college] || 0) + 1;
        });

        return {
            labels: Object.keys(distribution),
            values: Object.values(distribution)
        };
    }

    getSessionDistribution(students) {
        const distribution = {};
        students.forEach(student => {
            distribution[student.session] = (distribution[student.session] || 0) + 1;
        });

        return {
            labels: Object.keys(distribution),
            values: Object.values(distribution)
        };
    }

    getYearlyGrowth(students) {
        const years = {};
        students.forEach(student => {
            const year = student.session.split('-')[0];
            years[year] = (years[year] || 0) + 1;
        });

        const sortedYears = Object.keys(years).sort();
        return {
            labels: sortedYears,
            values: sortedYears.map(year => years[year])
        };
    }

    getDataQuality(students) {
        let complete = 0, partial = 0, missing = 0;
        const requiredFields = ['name', 'college', 'session', 'registration'];

        students.forEach(student => {
            const filledFields = requiredFields.filter(field => student[field]);
            if (filledFields.length === requiredFields.length) complete++;
            else if (filledFields.length > 0) partial++;
            else missing++;
        });

        return [complete, partial, missing];
    }

    async handleScrape(e) {
        e.preventDefault();
        if (this.isScraping) return;

        const form = e.target;
        const startReg = form.startReg.value;
        const endReg = form.endReg.value;
        const outputFile = form.outputFile.value;
        const filterEconomics = form.filterEconomics.checked;
        const delay = parseInt(form.delayRange.value);

        // Validate inputs
        if (!this.validateScrapeInputs(startReg, endReg, outputFile)) {
            return;
        }

        this.showConfirmModal(
            'Start Scraping',
            `Are you sure you want to start scraping from ${startReg} to ${endReg}?`,
            () => this.startScraping(startReg, endReg, outputFile, filterEconomics, delay)
        );
    }

    validateScrapeInputs(startReg, endReg, outputFile) {
        const validations = [
            this.validateField('startReg', /^\d{11}$/.test(startReg), 'Registration number must be 11 digits'),
            this.validateField('endReg', /^\d{11}$/.test(endReg), 'Registration number must be 11 digits'),
            this.validateField('outputFile', /^[A-Za-z0-9\s\-_]+$/.test(outputFile), 'Invalid filename')
        ];

        if (!validations.every(Boolean)) {
            this.showAlert('Please fill all fields correctly', 'error');
            return false;
        }

        if (parseInt(startReg) >= parseInt(endReg)) {
            this.showAlert('Start registration number must be less than end registration number', 'error');
            return false;
        }

        return true;
    }

    validateField(id, isValid, errorMessage) {
        const input = document.getElementById(id);
        const validationMessage = input.nextElementSibling;
        
        if (!isValid) {
            input.classList.add('error');
            if (validationMessage && validationMessage.classList.contains('validation-message')) {
                validationMessage.textContent = errorMessage;
            }
        } else {
            input.classList.remove('error');
            if (validationMessage && validationMessage.classList.contains('validation-message')) {
                validationMessage.textContent = '';
            }
        }
        
        return isValid;
    }

    async startScraping(startReg, endReg, outputFile, filterEconomics, delay) {
        this.isScraping = true;
        this.shouldStopScraping = false;
        this.scrapedData = [];
        this.currentIndex = parseInt(startReg);
        this.successCount = 0;
        this.failCount = 0;
        this.startTime = new Date();

        // Update UI
        this.updateUIState(true);
        this.showProgress();
        this.startTimer();
        this.addLogEntry('Starting scraping process...', 'info');

        try {
            while (this.currentIndex <= parseInt(endReg) && !this.shouldStopScraping) {
                await this.scrapeRegistration(this.currentIndex, filterEconomics);
                this.currentIndex++;
                this.updateProgress(startReg, endReg);
                await this.sleep(delay);
            }

            if (!this.shouldStopScraping) {
                this.addLogEntry('Scraping completed successfully!', 'success');
                this.handleDownload(outputFile);
            } else {
                this.addLogEntry('Scraping stopped by user', 'info');
            }

        } catch (error) {
            this.addLogEntry(`Error: ${error.message}`, 'error');
            console.error('Scraping error:', error);
        } finally {
            this.isScraping = false;
            this.updateUIState(false);
            this.stopTimer();
        }
    }

    async scrapeRegistration(regNumber, filterEconomics) {
        try {
            const response = await fetch('http://regicard.nu.edu.bd/verification.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Origin': 'http://regicard.nu.edu.bd',
                    'Referer': 'http://regicard.nu.edu.bd/single_regi.php'
                },
                body: `reg=${regNumber}`
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const table = doc.querySelector('table');

            if (!table) {
                throw new Error('No data found');
            }

            // Extract data from table
            const studentData = {};
            table.querySelectorAll('tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length === 2) {
                    const key = cells[0].textContent.trim().replace(':', '').trim();
                    const value = cells[1].textContent.trim();
                    studentData[key] = value;
                }
            });

            // Check if it's an Economics student
            if (filterEconomics && studentData['Subject Name'] !== 'ECONOMICS') {
                this.addLogEntry(`Skipped ${regNumber} (Not Economics)`, 'info');
                return;
            }

            // Add timestamp
            studentData['ScrapedAt'] = new Date().toISOString();

            // Store data
            this.scrapedData.push(studentData);
            this.successCount++;
            this.addLogEntry(`Successfully scraped ${regNumber}`, 'success');

        } catch (error) {
            this.failCount++;
            this.addLogEntry(`Failed to scrape ${regNumber}: ${error.message}`, 'error');
        }
    }

    updateProgress(startReg, endReg) {
        const total = parseInt(endReg) - parseInt(startReg) + 1;
        const current = this.currentIndex - parseInt(startReg);
        const percentage = Math.round((current / total) * 100);

        // Update progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }

        // Update percentage text
        const progressPercentage = document.querySelector('.progress-percentage');
        if (progressPercentage) {
            progressPercentage.textContent = `${percentage}%`;
        }

        // Update status
        const progressStatus = document.querySelector('.progress-status');
        if (progressStatus) {
            progressStatus.textContent = `Processing registration number: ${this.currentIndex}`;
        }

        // Update stats
        document.getElementById('successCount').textContent = this.successCount;
        document.getElementById('failCount').textContent = this.failCount;
    }

    startTimer() {
        this.timer = setInterval(() => {
            const elapsed = new Date() - this.startTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('timeElapsed').textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    updateUIState(isScraping) {
        const startButton = document.getElementById('startScrape');
        const stopButton = document.getElementById('stopScrape');
        const form = document.getElementById('scrapeForm');

        if (startButton) startButton.disabled = isScraping;
        if (stopButton) stopButton.disabled = !isScraping;
        if (form) {
            Array.from(form.elements).forEach(element => {
                if (element.type !== 'button') {
                    element.disabled = isScraping;
                }
            });
        }
    }

    showProgress() {
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
    }

    stopScraping() {
        this.showConfirmModal(
            'Stop Scraping',
            'Are you sure you want to stop the scraping process?',
            () => {
                this.shouldStopScraping = true;
                this.addLogEntry('Stopping scraping process...', 'info');
            }
        );
    }

    handleDownload(filename) {
        if (this.scrapedData.length === 0) {
            this.showAlert('No data to download', 'error');
            return;
        }

        const data = {
            metadata: {
                scrapedAt: new Date().toISOString(),
                totalRecords: this.scrapedData.length,
                successfulScrapes: this.successCount,
                failedScrapes: this.failCount,
                timeElapsed: document.getElementById('timeElapsed').textContent
            },
            data: this.scrapedData
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.addLogEntry('Data downloaded successfully', 'success');
    }

    addLogEntry(message, type = 'info') {
        const logContent = document.getElementById('logContent');
        if (!logContent) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        
        let icon;
        switch (type) {
            case 'success':
                icon = 'fa-check-circle';
                break;
            case 'error':
                icon = 'fa-times-circle';
                break;
            default:
                icon = 'fa-info-circle';
        }

        entry.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        logContent.appendChild(entry);
        logContent.scrollTop = logContent.scrollHeight;
    }

    clearLog() {
        const logContent = document.getElementById('logContent');
        if (logContent) {
            logContent.innerHTML = '';
        }
    }

    handleSearch(query) {
        if (this.currentSection === 'data-management') {
            this.loadDataTable(query);
        }
    }

    applyFilters() {
        const college = document.getElementById('collegeFilter').value;
        const session = document.getElementById('sessionFilter').value;
        this.loadDataTable(null, { college, session });
    }

    async loadDataTable(searchQuery = null, filters = {}) {
        try {
            const students = JSON.parse(localStorage.getItem('students') || '[]');
            let filteredData = students;

            // Apply search
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filteredData = filteredData.filter(student => 
                    student.name.toLowerCase().includes(query) ||
                    student.registration.toString().includes(query) ||
                    student.college.toLowerCase().includes(query)
                );
            }

            // Apply filters
            if (filters.college) {
                filteredData = filteredData.filter(student => student.college === filters.college);
            }
            if (filters.session) {
                filteredData = filteredData.filter(student => student.session === filters.session);
            }

            // Update pagination
            this.totalPages = Math.ceil(filteredData.length / this.itemsPerPage);
            this.currentPage = Math.min(this.currentPage, this.totalPages);
            this.updatePagination();

            // Get current page data
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            const pageData = filteredData.slice(start, end);

            // Update table
            this.updateDataTable(pageData);

            // Update filters
            this.updateFilters(students);

        } catch (error) {
            console.error('Error loading data table:', error);
            this.showAlert('Error loading data', 'error');
        }
    }

    updateDataTable(data) {
        const tbody = document.getElementById('dataTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        data.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.registration}</td>
                <td>${student.name}</td>
                <td>${student.college}</td>
                <td>${student.session}</td>
                <td>
                    <button class="action-btn" onclick="dashboard.viewStudent('${student.registration}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" onclick="dashboard.editStudent('${student.registration}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn danger" onclick="dashboard.deleteStudent('${student.registration}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateFilters(students) {
        const colleges = new Set(students.map(s => s.college));
        const sessions = new Set(students.map(s => s.session));

        const collegeFilter = document.getElementById('collegeFilter');
        const sessionFilter = document.getElementById('sessionFilter');

        // Update college filter
        collegeFilter.innerHTML = '<option value="">All Colleges</option>';
        colleges.forEach(college => {
            collegeFilter.innerHTML += `<option value="${college}">${college}</option>`;
        });

        // Update session filter
        sessionFilter.innerHTML = '<option value="">All Sessions</option>';
        sessions.forEach(session => {
            sessionFilter.innerHTML += `<option value="${session}">${session}</option>`;
        });
    }

    updatePagination() {
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }

        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage === this.totalPages;
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadDataTable();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadDataTable();
        }
    }

    viewStudent(registration) {
        // Implement student view modal
        console.log('View student:', registration);
    }

    editStudent(registration) {
        // Implement student edit modal
        console.log('Edit student:', registration);
    }

    deleteStudent(registration) {
        this.showConfirmModal(
            'Delete Student',
            `Are you sure you want to delete student with registration number ${registration}?`,
            () => {
                // Implement student deletion
                console.log('Delete student:', registration);
            }
        );
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        const form = e.target;
        const firstName = form.firstName.value;
        const email = form.email.value;
        const mobile = form.mobile.value;

        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === currentUser.id);

            if (userIndex === -1) {
                throw new Error('User not found');
            }

            // Update user data
            users[userIndex] = {
                ...users[userIndex],
                firstName,
                email,
                mobile
            };

            // Update storage
            localStorage.setItem('users', JSON.stringify(users));
            if (localStorage.getItem('currentUser')) {
                localStorage.setItem('currentUser', JSON.stringify({
                    ...currentUser,
                    firstName,
                    email,
                    mobile
                }));
            } else {
                sessionStorage.setItem('currentUser', JSON.stringify({
                    ...currentUser,
                    firstName,
                    email,
                    mobile
                }));
            }

            // Update UI
            document.getElementById('userFullname').textContent = firstName;
            document.getElementById('userEmail').textContent = email;

            this.showAlert('Profile updated successfully', 'success');

        } catch (error) {
            console.error('Error updating profile:', error);
            this.showAlert('Error updating profile', 'error');
        }
    }

    async handlePasswordUpdate(e) {
        e.preventDefault();
        const form = e.target;
        const currentPassword = form.currentPassword.value;
        const newPassword = form.newPassword.value;
        const confirmPassword = form.confirmPassword.value;

        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.id === currentUser.id);

            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const hashedCurrentPassword = await this.hashPassword(currentPassword);
            if (hashedCurrentPassword !== user.password) {
                this.showAlert('Current password is incorrect', 'error');
                return;
            }

            // Validate new password
            if (newPassword !== confirmPassword) {
                this.showAlert('New passwords do not match', 'error');
                return;
            }

            // Update password
            const hashedNewPassword = await this.hashPassword(newPassword);
            user.password = hashedNewPassword;
            localStorage.setItem('users', JSON.stringify(users));

            // Clear form
            form.reset();

            this.showAlert('Password updated successfully', 'success');

        } catch (error) {
            console.error('Error updating password:', error);
            this.showAlert('Error updating password', 'error');
        }
    }

    async handleNotificationSettings(e) {
        e.preventDefault();
        const form = e.target;
        const settings = {
            emailNotifications: form.emailNotifications.checked,
            scrapeNotifications: form.scrapeNotifications.checked,
            updateNotifications: form.updateNotifications.checked
        };

        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === currentUser.id);

            if (userIndex === -1) {
                throw new Error('User not found');
            }

            // Update user settings
            users[userIndex] = {
                ...users[userIndex],
                notificationSettings: settings
            };

            // Update storage
            localStorage.setItem('users', JSON.stringify(users));

            this.showAlert('Notification settings updated', 'success');

        } catch (error) {
            console.error('Error updating notification settings:', error);
            this.showAlert('Error updating settings', 'error');
        }
    }

    async backupData() {
        try {
            const students = JSON.parse(localStorage.getItem('students') || '[]');
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const activities = JSON.parse(localStorage.getItem('activities') || '[]');

            const backup = {
                timestamp: new Date().toISOString(),
                students,
                users,
                activities
            };

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showAlert('Backup created successfully', 'success');

        } catch (error) {
            console.error('Error creating backup:', error);
            this.showAlert('Error creating backup', 'error');
        }
    }

    async restoreData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            try {
                const file = e.target.files[0];
                const text = await file.text();
                const backup = JSON.parse(text);

                // Validate backup data
                if (!backup.timestamp || !backup.students || !backup.users) {
                    throw new Error('Invalid backup file');
                }

                this.showConfirmModal(
                    'Restore Data',
                    'This will overwrite all current data. Are you sure you want to continue?',
                    () => {
                        // Restore data
                        localStorage.setItem('students', JSON.stringify(backup.students));
                        localStorage.setItem('users', JSON.stringify(backup.users));
                        localStorage.setItem('activities', JSON.stringify(backup.activities));

                        this.showAlert('Data restored successfully', 'success');
                        this.loadDashboardData();
                    }
                );

            } catch (error) {
                console.error('Error restoring backup:', error);
                this.showAlert('Error restoring backup', 'error');
            }
        };
        input.click();
    }

    confirmClearData() {
        this.showConfirmModal(
            'Clear Data',
            'Are you sure you want to clear all student data? This action cannot be undone.',
            () => {
                localStorage.removeItem('students');
                this.showAlert('Data cleared successfully', 'success');
                this.loadDashboardData();
            }
        );
    }

    confirmClearAllData() {
        this.showConfirmModal(
            'Clear All Data',
            'Are you sure you want to clear all data including users and activities? This action cannot be undone.',
            () => {
                localStorage.clear();
                window.location.href = 'login.html';
            }
        );
    }

    handleLogout() {
        this.showConfirmModal(
            'Logout',
            'Are you sure you want to logout?',
            () => {
                localStorage.removeItem('currentUser');
                sessionStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            }
        );
    }

    showConfirmModal(title, message, callback) {
        const modal = document.getElementById('confirmModal');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmButton = document.getElementById('confirmAction');

        if (modal && confirmMessage && confirmButton) {
            confirmMessage.textContent = message;
            confirmButton.onclick = () => {
                this.hideModal();
                callback();
            };
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
        }
    }

    showHelpModal() {
        const modal = document.getElementById('helpModal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
        }
    }

    hideModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
        });
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `custom-alert ${type}`;
        alert.textContent = message;

        document.body.appendChild(alert);

        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }

    togglePasswordVisibility(e) {
        const button = e.target.closest('.toggle-password');
        const input = button.previousElementSibling;
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
}); 