// Database configuration
const DB_NAME = 'RegistrationCardDB';
const DB_VERSION = 1;
const STORE_NAME = 'students';

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    // Initialize the database
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database connected successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'registrationNo' });
                    
                    // Create indexes for searching
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('college', 'college', { unique: false });
                    store.createIndex('session', 'session', { unique: false });
                }
            };
        });
    }

    // Add a student record
    async addStudent(student) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(student);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Add multiple student records
    async addStudents(students) {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        return new Promise((resolve, reject) => {
            let completed = 0;
            const total = students.length;

            students.forEach(student => {
                const request = store.add(student);
                
                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };
                
                request.onerror = () => {
                    console.error('Error adding student:', student.registrationNo);
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };
            });
        });
    }

    // Get all students
    async getAllStudents() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Search students
    async searchStudents(query) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const students = request.result;
                const searchResults = students.filter(student => {
                    const searchStr = query.toLowerCase();
                    return (
                        student.registrationNo.toString().includes(searchStr) ||
                        student.name.toLowerCase().includes(searchStr) ||
                        student.college.toLowerCase().includes(searchStr)
                    );
                });
                resolve(searchResults);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Filter students by college
    async filterByCollege(college) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('college');
            const request = index.getAll(college);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Filter students by session
    async filterBySession(session) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('session');
            const request = index.getAll(session);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get unique colleges
    async getUniqueColleges() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const students = request.result;
                const colleges = [...new Set(students.map(student => student.college))];
                resolve(colleges);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Get unique sessions
    async getUniqueSessions() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const students = request.result;
                const sessions = [...new Set(students.map(student => student.session))];
                resolve(sessions);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Get student by registration number
    async getStudentByRegNo(regNo) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(regNo);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get database statistics
    async getStats() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const students = request.result;
                const stats = {
                    totalStudents: students.length,
                    totalColleges: new Set(students.map(s => s.college)).size,
                    currentSession: students.length > 0 ? students[0].session : 'N/A'
                };
                resolve(stats);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Import data from text file
    async importFromText(text) {
        const students = this.parseTextData(text);
        return this.addStudents(students);
    }

    // Parse text data into student objects
    parseTextData(text) {
        const students = [];
        const sections = text.split('***********************************').filter(section => section.trim());

        sections.forEach(section => {
            const lines = section.trim().split('\n');
            const student = {};

            lines.forEach(line => {
                const [key, value] = line.split(':').map(s => s.trim());
                if (key && value) {
                    switch (key) {
                        case 'Registration No':
                            student.registrationNo = value;
                            break;
                        case 'Subject Name':
                            student.subject = value;
                            break;
                        case 'Academic Session':
                            student.session = value;
                            break;
                        case 'Student\'s Name':
                            student.name = value;
                            break;
                        case 'Father\'s Name':
                            student.fatherName = value;
                            break;
                        case 'Mother\'s Name':
                            student.motherName = value;
                            break;
                        case 'College Name':
                            student.college = value;
                            break;
                    }
                }
            });

            if (student.registrationNo) {
                students.push(student);
            }
        });

        return students;
    }
}

// Create and export database instance
const db = new Database();
export default db; 