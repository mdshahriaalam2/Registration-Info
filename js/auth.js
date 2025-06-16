class AuthManager {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeAutocomplete();
        this.checkAuthStatus();
    }

    initializeElements() {
        // Form elements
        this.loginForm = document.getElementById('loginForm');
        this.signupForm = document.getElementById('signupForm');
        this.switchBtns = document.querySelectorAll('.switch-btn');
        this.switchSlider = document.querySelector('.switch-slider');
        
        // Login form elements
        this.loginEmail = document.getElementById('loginEmail');
        this.loginPassword = document.getElementById('loginPassword');
        this.rememberMe = document.getElementById('rememberMe');
        this.loginButton = document.getElementById('loginButton');
        
        // Signup form elements
        this.firstName = document.getElementById('firstName');
        this.fatherName = document.getElementById('fatherName');
        this.email = document.getElementById('email');
        this.educationLevel = document.getElementById('educationLevel');
        this.college = document.getElementById('college');
        this.mobile = document.getElementById('mobile');
        this.password = document.getElementById('password');
        this.confirmPassword = document.getElementById('confirmPassword');
        this.termsCheckbox = document.getElementById('termsCheckbox');
        this.signupButton = document.querySelector('#signupForm .auth-button');
        
        // Password elements
        this.passwordToggles = document.querySelectorAll('.toggle-password');
        this.strengthBar = document.querySelector('.strength-bar');
        this.strengthText = document.querySelector('.strength-text span');
        this.passwordRequirements = document.querySelectorAll('.password-requirements li');
        
        // Modal elements
        this.termsModal = document.getElementById('termsModal');
        this.termsLink = document.querySelector('.terms-link');
        this.closeModalBtn = document.querySelector('.close-modal');
        this.acceptTermsBtn = document.getElementById('acceptTerms');
    }

    initializeEventListeners() {
        // Form switch
        this.switchBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchForm(btn.dataset.form));
        });

        // Login form
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.loginButton.addEventListener('click', () => this.loginForm.requestSubmit());

        // Signup form
        this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        this.signupButton.addEventListener('click', () => this.signupForm.requestSubmit());

        // Password toggle visibility
        this.passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const input = e.target.closest('.password-input-group').querySelector('input');
                const icon = e.target.closest('.toggle-password').querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });

        // Password strength check
        this.password.addEventListener('input', () => this.checkPasswordStrength());
        this.confirmPassword.addEventListener('input', () => this.validatePasswordMatch());

        // Terms modal
        this.termsLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.openTermsModal();
        });
        this.closeModalBtn.addEventListener('click', () => this.closeTermsModal());
        this.acceptTermsBtn.addEventListener('click', () => this.acceptTerms());
        this.termsModal.addEventListener('click', (e) => {
            if (e.target === this.termsModal) this.closeTermsModal();
        });

        // Form validation
        this.initializeFormValidation();
    }

    initializeAutocomplete() {
        // Sample data for autocomplete (replace with actual data from backend)
        const firstNameSuggestions = [
            'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Mary',
            'Robert', 'Lisa', 'William', 'Jennifer', 'Richard', 'Linda', 'Joseph'
        ];
        
        const lastNameSuggestions = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
            'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez'
        ];
        
        const collegeSuggestions = [
            'University of Dhaka', 'University of Chittagong', 'University of Rajshahi',
            'University of Khulna', 'University of Barishal', 'University of Sylhet',
            'University of Rangpur', 'University of Mymensingh', 'Dhaka College',
            'Notre Dame College', 'Holy Cross College', 'Eden College', 'Viqarunnisa Noon College'
        ];

        // Populate datalists
        this.populateDatalist('firstNameSuggestions', firstNameSuggestions);
        this.populateDatalist('lastNameSuggestions', lastNameSuggestions);
        this.populateDatalist('collegeSuggestions', collegeSuggestions);
    }

    populateDatalist(id, suggestions) {
        const datalist = document.getElementById(id);
        if (datalist) {
            suggestions.forEach(suggestion => {
                const option = document.createElement('option');
                option.value = suggestion;
                datalist.appendChild(option);
            });
        }
    }

    switchForm(formType) {
        // Update switch buttons
        this.switchBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.form === formType);
        });

        // Update slider position
        this.switchSlider.style.transform = formType === 'signup' ? 'translateX(100%)' : 'translateX(0)';

        // Show/hide forms
        this.loginForm.classList.toggle('active', formType === 'login');
        this.signupForm.classList.toggle('active', formType === 'signup');

        // Reset forms
        this.resetForms();
    }

    resetForms() {
        // Reset login form
        this.loginForm.reset();
        this.clearValidation(this.loginForm);

        // Reset signup form
        this.signupForm.reset();
        this.clearValidation(this.signupForm);
        this.strengthBar.className = 'strength-bar';
        this.strengthText.textContent = '';
        this.passwordRequirements.forEach(req => req.classList.remove('valid'));
    }

    async handleLogin(e) {
        e.preventDefault();
        
        if (!this.validateLoginForm()) return;

        const loginData = {
            email: this.loginEmail.value.trim(),
            password: this.loginPassword.value,
            remember: this.rememberMe.checked
        };

        try {
            // Simulate API call
            await this.simulateApiCall();
            
            // Store user data
            const userData = {
                email: loginData.email,
                firstName: 'John', // This would come from the API
                lastName: 'Doe',   // This would come from the API
                educationLevel: 'Bachelor\'s',
                college: 'Example University',
                mobile: '+1234567890'
            };
            
            localStorage.setItem('user', JSON.stringify(userData));
            if (loginData.remember) {
                localStorage.setItem('rememberedEmail', loginData.email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            // Redirect to chat page
            window.location.href = 'chat.html';
        } catch (error) {
            this.showError(this.loginForm, 'Invalid email or password');
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        if (!this.validateSignupForm()) return;

        const signupData = {
            firstName: this.firstName.value.trim(),
            fatherName: this.fatherName.value.trim(),
            email: this.email.value.trim(),
            educationLevel: this.educationLevel.value,
            college: this.college.value.trim(),
            mobile: this.mobile.value.trim(),
            password: this.password.value
        };

        try {
            // Simulate API call
            await this.simulateApiCall();
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(signupData));
            
            // Show success message and switch to login
            this.showSuccess('Account created successfully! Please log in.');
            this.switchForm('login');
        } catch (error) {
            this.showError(this.signupForm, 'Error creating account. Please try again.');
        }
    }

    validateLoginForm() {
        let isValid = true;
        this.clearValidation(this.loginForm);

        // Email validation
        if (!this.validateEmail(this.loginEmail.value)) {
            this.showError(this.loginEmail, 'Please enter a valid email address');
            isValid = false;
        }

        // Password validation
        if (!this.loginPassword.value) {
            this.showError(this.loginPassword, 'Please enter your password');
            isValid = false;
        }

        return isValid;
    }

    validateSignupForm() {
        let isValid = true;
        this.clearValidation(this.signupForm);

        // Name validation
        if (!this.firstName.value.trim()) {
            this.showError(this.firstName, 'Please enter your first name');
            isValid = false;
        }
        if (!this.fatherName.value.trim()) {
            this.showError(this.fatherName, 'Please enter your father\'s name');
            isValid = false;
        }

        // Email validation
        if (!this.validateEmail(this.email.value)) {
            this.showError(this.email, 'Please enter a valid email address');
            isValid = false;
        }

        // Education validation
        if (!this.educationLevel.value) {
            this.showError(this.educationLevel, 'Please select your education level');
            isValid = false;
        }

        // College validation
        if (!this.college.value.trim()) {
            this.showError(this.college, 'Please enter your college name');
            isValid = false;
        }

        // Mobile validation
        if (!this.validateMobile(this.mobile.value)) {
            this.showError(this.mobile, 'Please enter a valid mobile number');
            isValid = false;
        }

        // Enhanced password validation
        if (!this.password.value) {
            this.showError(this.password, 'Please enter a password');
            isValid = false;
        } else if (this.password.value.length < 8) {
            this.showError(this.password, 'Password must be at least 8 characters long');
            isValid = false;
        } else if (!this.validatePasswordStrength()) {
            this.showError(this.password, 'Password does not meet all requirements');
            isValid = false;
        }

        // Confirm password validation
        if (this.password.value !== this.confirmPassword.value) {
            this.showError(this.confirmPassword, 'Passwords do not match');
            isValid = false;
        }

        // Terms validation
        if (!this.termsCheckbox.checked) {
            this.showError(this.termsCheckbox, 'Please accept the terms and conditions');
            isValid = false;
        }

        return isValid;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validateMobile(mobile) {
        const mobileRegex = /^\+?[\d\s-]{10,}$/;
        return mobileRegex.test(mobile);
    }

    validatePasswordStrength() {
        const password = this.password.value;
        return (
            password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[!@#$%^&*(),.?":{}|<>]/.test(password)
        );
    }

    validatePasswordMatch() {
        const password = this.password.value;
        const confirm = this.confirmPassword.value;
        const message = this.confirmPassword.parentElement.nextElementSibling;

        if (confirm && password !== confirm) {
            message.textContent = 'Passwords do not match';
            return false;
        } else {
            message.textContent = '';
            return true;
        }
    }

    showError(element, message) {
        const formGroup = element.closest('.form-group');
        const validationMessage = formGroup.querySelector('.validation-message') || 
                                document.createElement('div');
        
        if (!formGroup.querySelector('.validation-message')) {
            validationMessage.className = 'validation-message';
            formGroup.appendChild(validationMessage);
        }
        
        validationMessage.textContent = message;
        element.classList.add('error');
    }

    clearValidation(element) {
        const formGroup = element.closest('.form-group');
        if (formGroup) {
            const validationMessage = formGroup.querySelector('.validation-message');
            if (validationMessage) validationMessage.textContent = '';
            element.classList.remove('error');
        }
    }

    showSuccess(message) {
        // Create success message element
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = message;
        
        // Add to document
        document.body.appendChild(successMessage);
        
        // Remove after animation
        setTimeout(() => {
            successMessage.classList.add('fade-out');
            setTimeout(() => successMessage.remove(), 300);
        }, 3000);
    }

    openTermsModal() {
        this.termsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeTermsModal() {
        this.termsModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    acceptTerms() {
        this.termsCheckbox.checked = true;
        this.closeTermsModal();
    }

    initializeFormValidation() {
        // Real-time validation for all inputs
        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.value) {
                    this.clearValidation(input);
                }
            });
        });
    }

    checkAuthStatus() {
        const user = localStorage.getItem('user');
        if (user) {
            window.location.href = 'chat.html';
        }

        // Check for remembered email
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            this.loginEmail.value = rememberedEmail;
            this.rememberMe.checked = true;
        }
    }

    async simulateApiCall() {
        return new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
    }

    checkPasswordStrength() {
        const password = this.password.value;
        let strength = 0;
        let requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        // Update requirements list
        Object.entries(requirements).forEach(([requirement, met]) => {
            const li = document.querySelector(`[data-requirement="${requirement}"]`);
            if (li) {
                li.classList.toggle('valid', met);
            }
            if (met) strength++;
        });

        // Update strength meter
        this.strengthBar.className = 'strength-bar';
        let strengthClass = '';
        let strengthText = '';

        if (strength <= 2) {
            strengthClass = 'weak';
            strengthText = 'Too weak';
        } else if (strength === 3) {
            strengthClass = 'medium';
            strengthText = 'Medium';
        } else if (strength === 4) {
            strengthClass = 'strong';
            strengthText = 'Strong';
        } else {
            strengthClass = 'very-strong';
            strengthText = 'Very strong';
        }

        this.strengthBar.classList.add(strengthClass);
        this.strengthText.textContent = strengthText;
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
}); 