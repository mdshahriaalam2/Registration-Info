import db from './database.js';

class App {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadInitialData();
    }

    initializeElements() {
        // Search and filter elements
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.filterCollege = document.getElementById('filterCollege');
        this.filterSession = document.getElementById('filterSession');
        
        // Table elements
        this.tableBody = document.getElementById('studentTableBody');
        
        // Modal elements
        this.modal = document.getElementById('studentModal');
        this.modalContent = document.getElementById('studentDetails');
        this.closeModal = document.querySelector('.close');
        
        // Stats elements
        this.totalStudents = document.getElementById('totalStudents');
        this.totalColleges = document.getElementById('totalColleges');
        this.currentSession = document.getElementById('currentSession');
    }

    bindEvents() {
        // Search events
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // Filter events
        this.filterCollege.addEventListener('change', () => this.handleFilter());
        this.filterSession.addEventListener('change', () => this.handleFilter());

        // Modal events
        this.closeModal.addEventListener('click', () => this.closeStudentModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeStudentModal();
        });

        // File import event
        this.setupFileImport();
    }

    async loadInitialData() {
        try {
            // Load and display all students
            const students = await db.getAllStudents();
            this.displayStudents(students);

            // Update filters
            await this.updateFilters();

            // Update stats
            await this.updateStats();

        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load data. Please refresh the page.');
        }
    }

    async handleSearch() {
        const query = this.searchInput.value.trim();
        if (!query) {
            await this.loadInitialData();
            return;
        }

        try {
            const results = await db.searchStudents(query);
            this.displayStudents(results);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed. Please try again.');
        }
    }

    async handleFilter() {
        const college = this.filterCollege.value;
        const session = this.filterSession.value;

        try {
            let students;
            if (college && session) {
                // Filter by both college and session
                const collegeStudents = await db.filterByCollege(college);
                students = collegeStudents.filter(s => s.session === session);
            } else if (college) {
                students = await db.filterByCollege(college);
            } else if (session) {
                students = await db.filterBySession(session);
            } else {
                students = await db.getAllStudents();
            }

            this.displayStudents(students);
        } catch (error) {
            console.error('Filter error:', error);
            this.showError('Filtering failed. Please try again.');
        }
    }

    displayStudents(students) {
        this.tableBody.innerHTML = '';
        
        if (students.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data">No students found</td>
                </tr>
            `;
            return;
        }

        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.registrationNo}</td>
                <td>${student.name}</td>
                <td>${student.college}</td>
                <td>${student.session}</td>
                <td>
                    <button class="action-btn view-btn" data-reg="${student.registrationNo}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;

            // Add click event to view button
            const viewBtn = row.querySelector('.view-btn');
            viewBtn.addEventListener('click', () => this.showStudentDetails(student.registrationNo));

            this.tableBody.appendChild(row);
        });
    }

    async showStudentDetails(regNo) {
        try {
            const student = await db.getStudentByRegNo(regNo);
            if (!student) {
                this.showError('Student not found');
                return;
            }

            this.modalContent.innerHTML = `
                <h2>Student Details</h2>
                <div class="student-info">
                    <p><strong>Registration No:</strong> ${student.registrationNo}</p>
                    <p><strong>Name:</strong> ${student.name}</p>
                    <p><strong>Subject:</strong> ${student.subject}</p>
                    <p><strong>Session:</strong> ${student.session}</p>
                    <p><strong>Father's Name:</strong> ${student.fatherName}</p>
                    <p><strong>Mother's Name:</strong> ${student.motherName}</p>
                    <p><strong>College:</strong> ${student.college}</p>
                </div>
            `;

            this.modal.style.display = 'block';
        } catch (error) {
            console.error('Error showing student details:', error);
            this.showError('Failed to load student details');
        }
    }

    closeStudentModal() {
        this.modal.style.display = 'none';
    }

    async updateFilters() {
        try {
            const colleges = await db.getUniqueColleges();
            const sessions = await db.getUniqueSessions();

            // Update college filter
            this.filterCollege.innerHTML = '<option value="">All Colleges</option>';
            colleges.forEach(college => {
                const option = document.createElement('option');
                option.value = college;
                option.textContent = college;
                this.filterCollege.appendChild(option);
            });

            // Update session filter
            this.filterSession.innerHTML = '<option value="">All Sessions</option>';
            sessions.forEach(session => {
                const option = document.createElement('option');
                option.value = session;
                option.textContent = session;
                this.filterSession.appendChild(option);
            });
        } catch (error) {
            console.error('Error updating filters:', error);
        }
    }

    async updateStats() {
        try {
            const stats = await db.getStats();
            this.totalStudents.textContent = stats.totalStudents;
            this.totalColleges.textContent = stats.totalColleges;
            this.currentSession.textContent = stats.currentSession;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    setupFileImport() {
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        // Create import button
        const importBtn = document.createElement('button');
        importBtn.className = 'import-btn';
        importBtn.innerHTML = '<i class="fas fa-file-import"></i> Import Data';
        importBtn.style.position = 'fixed';
        importBtn.style.bottom = '20px';
        importBtn.style.right = '20px';
        importBtn.style.padding = '12px 24px';
        importBtn.style.backgroundColor = 'var(--secondary-color)';
        importBtn.style.color = 'white';
        importBtn.style.border = 'none';
        importBtn.style.borderRadius = '8px';
        importBtn.style.cursor = 'pointer';
        importBtn.style.boxShadow = 'var(--card-shadow)';
        document.body.appendChild(importBtn);

        // Handle file import
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                await db.importFromText(text);
                await this.loadInitialData();
                this.showSuccess('Data imported successfully!');
            } catch (error) {
                console.error('Import error:', error);
                this.showError('Failed to import data');
            }

            // Reset file input
            fileInput.value = '';
        });
    }

    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            ${message}
        `;
        this.showNotification(notification);
    }

    showSuccess(message) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${message}
        `;
        this.showNotification(notification);
    }

    showNotification(notification) {
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: '1000',
            animation: 'slideIn 0.3s ease'
        });

        // Add specific styles based on type
        if (notification.className.includes('error')) {
            notification.style.backgroundColor = 'var(--accent-color)';
        } else {
            notification.style.backgroundColor = '#2ecc71';
        }

        // Add to document
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add notification animations to style
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new App();
}); 