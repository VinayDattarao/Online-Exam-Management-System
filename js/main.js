// Main application controller

class ExamApp {
    constructor() {
        this.currentView = 'login-selector';
        this.initialize();
    }

    // Initialize the application
    initialize() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.showInitialView();
    }

    // Setup global event listeners
    setupEventListeners() {
        // Role toggle buttons
        document.getElementById('studentRoleBtn').addEventListener('click', () => {
            this.switchRole('student');
        });

        document.getElementById('adminRoleBtn').addEventListener('click', () => {
            this.switchRole('admin');
        });

        // Direct login form submissions
        document.getElementById('studentDirectLogin').addEventListener('submit', (e) => {
            this.handleDirectLogin(e, 'student');
        });

        document.getElementById('adminDirectLogin').addEventListener('submit', (e) => {
            this.handleDirectLogin(e, 'admin');
        });

        // Direct registration links
        document.getElementById('studentDirectSignup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('student-register');
        });

        document.getElementById('adminDirectSignup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('admin-register');
        });

        // Direct password reset links
        document.getElementById('studentDirectReset').addEventListener('click', (e) => {
            e.preventDefault();
            this.handlePasswordReset('student');
        });

        document.getElementById('adminDirectReset').addEventListener('click', (e) => {
            e.preventDefault();
            this.handlePasswordReset('admin');
        });

        // Back to selector buttons
        document.getElementById('backToSelector').addEventListener('click', () => {
            this.showView('login-selector');
        });

        document.getElementById('backToSelectorStudent').addEventListener('click', () => {
            this.showView('login-selector');
        });

        // Login form submissions
        document.getElementById('adminLoginSubmit').addEventListener('submit', (e) => {
            this.handleAdminLogin(e);
        });

        document.getElementById('studentLoginSubmit').addEventListener('submit', (e) => {
            this.handleStudentLogin(e);
        });

        // Password reset links
        document.getElementById('adminForgotPassword').addEventListener('click', (e) => {
            e.preventDefault();
            this.handlePasswordReset('admin');
        });

        document.getElementById('studentForgotPassword').addEventListener('click', (e) => {
            e.preventDefault();
            this.handlePasswordReset('student');
        });

        // Registration links
        document.getElementById('adminSignupLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('admin-register');
        });

        document.getElementById('studentSignupLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('student-register');
        });

        // Back to login links
        document.getElementById('adminLoginLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('admin-login');
        });

        document.getElementById('studentLoginLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('student-login');
        });

        // Back to selector from registration
        document.getElementById('backToSelectorFromAdminReg').addEventListener('click', () => {
            this.showView('login-selector');
        });

        document.getElementById('backToSelectorFromStudentReg').addEventListener('click', () => {
            this.showView('login-selector');
        });

        // Registration form submissions
        document.getElementById('adminRegisterSubmit').addEventListener('submit', (e) => {
            this.handleAdminRegistration(e);
        });

        document.getElementById('studentRegisterSubmit').addEventListener('submit', (e) => {
            this.handleStudentRegistration(e);
        });

        // Student exam code entry
        document.getElementById('studentExamCodeSubmit').addEventListener('submit', (e) => {
            this.handleStudentExamCodeEntry(e);
        });

        document.getElementById('studentLogoutFromCodeEntry').addEventListener('click', () => {
            authService.logout();
            this.showView('login-selector');
        });

        // Prevent form submission on Enter in exam interface
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !document.getElementById('examInterface').classList.contains('hidden')) {
                // Only prevent if not in textarea or specific input fields
                if (e.target.tagName !== 'TEXTAREA' && !e.target.classList.contains('allow-enter')) {
                    e.preventDefault();
                }
            }
        });

        // Window beforeunload warning during exam
        window.addEventListener('beforeunload', (e) => {
            if (!document.getElementById('examInterface').classList.contains('hidden')) {
                e.preventDefault();
                e.returnValue = 'You are currently taking an exam. Are you sure you want to leave?';
                return e.returnValue;
            }
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            if (!document.getElementById('examInterface').classList.contains('hidden')) {
                e.preventDefault();
                history.pushState(null, null, location.href);
                Utils.showModal(
                    'Navigation Blocked',
                    'Browser navigation is disabled during the exam.'
                );
            }
        });
    }

    // Check authentication status on page load
    checkAuthStatus() {
        if (authService.isAuthenticated()) {
            const user = authService.getCurrentUser();
            if (user.role === 'admin') {
                this.showAdminDashboard();
            } else if (user.role === 'student') {
                this.showStudentDashboard();
            }
        }
    }

    // Show initial view
    showInitialView() {
        if (!authService.isAuthenticated()) {
            this.showView('login-selector');
            // Ensure student role is properly selected initially
            this.switchRole('student');
        }
    }

    // Show specific view
    showView(viewName) {
        // Hide all views
        this.hideAllViews();
        
        // Show selected view
        switch(viewName) {
            case 'login-selector':
                document.getElementById('loginSelector').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('loginSelector'), 'fade-in');
                break;
            case 'admin-login':
                document.getElementById('adminLoginForm').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('adminLoginForm'), 'slide-in');
                document.getElementById('adminEmail').focus();
                break;
            case 'student-login':
                document.getElementById('studentLoginForm').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('studentLoginForm'), 'slide-in');
                document.getElementById('studentEmail').focus();
                break;
            case 'admin-register':
                document.getElementById('adminRegisterForm').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('adminRegisterForm'), 'slide-in');
                document.getElementById('adminRegEmail').focus();
                break;
            case 'student-register':
                document.getElementById('studentRegisterForm').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('studentRegisterForm'), 'slide-in');
                document.getElementById('studentRegEmail').focus();
                break;
            case 'student-exam-code':
                document.getElementById('studentExamCodeEntry').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('studentExamCodeEntry'), 'slide-in');
                document.getElementById('studentExamCodeInput').focus();
                break;
        }
        
        this.currentView = viewName;
    }

    // Switch between student and admin roles
    switchRole(role) {
        const studentBtn = document.getElementById('studentRoleBtn');
        const adminBtn = document.getElementById('adminRoleBtn');
        const roleToggle = document.querySelector('.role-toggle');
        const studentLoginSide = document.getElementById('studentLoginSide');
        const adminLoginSide = document.getElementById('adminLoginSide');
        const studentInfoSide = document.getElementById('studentInfoSide');
        const adminInfoSide = document.getElementById('adminInfoSide');

        if (role === 'student') {
            studentBtn.classList.add('active');
            adminBtn.classList.remove('active');
            roleToggle.classList.add('student-active');
            studentLoginSide.classList.remove('hidden');
            adminLoginSide.classList.add('hidden');
            studentInfoSide.classList.remove('hidden');
            adminInfoSide.classList.add('hidden');
        } else {
            adminBtn.classList.add('active');
            studentBtn.classList.remove('active');
            roleToggle.classList.remove('student-active');
            adminLoginSide.classList.remove('hidden');
            studentLoginSide.classList.add('hidden');
            adminInfoSide.classList.remove('hidden');
            studentInfoSide.classList.add('hidden');
        }
    }

    // Handle direct login (from the new layout)
    async handleDirectLogin(e, role) {
        e.preventDefault();
        
        const emailId = role === 'student' ? 'studentDirectEmail' : 'adminDirectEmail';
        const passwordId = role === 'student' ? 'studentDirectPassword' : 'adminDirectPassword';
        
        const email = document.getElementById(emailId).value;
        const password = document.getElementById(passwordId).value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!email || !password) {
            Utils.showError('Please enter both email and password.');
            return;
        }

        Utils.setButtonLoading(submitBtn, true);
        
        try {
            const result = await authService.login(email, password, role);
            
            if (result.success) {
                if (role === 'admin') {
                    Utils.showSuccess('Login successful!');
                    this.showAdminDashboard();
                } else {
                    // Always go to student dashboard, not exam code entry
                    Utils.showSuccess('Login successful! Welcome to your dashboard.');
                    this.showStudentDashboard();
                }
                
                // Clear form
                e.target.reset();
            } else {
                Utils.showError(result.message);
            }
        } catch (error) {
            Utils.showError('Login failed. Please try again.');
            console.error(`${role} login error:`, error);
        } finally {
            Utils.setButtonLoading(submitBtn, false);
        }
    }

    // Hide all views
    hideAllViews() {
        const views = [
            'loginSelector',
            'adminLoginForm', 
            'studentLoginForm',
            'adminRegisterForm',
            'studentRegisterForm',
            'studentExamCodeEntry',
            'adminDashboard',
            'studentDashboard',
            'examInterface'
        ];
        
        views.forEach(viewId => {
            document.getElementById(viewId).classList.add('hidden');
        });
    }

    // Handle admin login (legacy form)
    async handleAdminLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail')?.value;
        const password = document.getElementById('adminPassword')?.value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!email || !password) {
            Utils.showError('Please enter both email and password.');
            return;
        }

        Utils.setButtonLoading(submitBtn, true);
        
        try {
            const result = await authService.login(email, password, 'admin');
            
            if (result.success) {
                Utils.showSuccess('Login successful!');
                this.showAdminDashboard();
                
                // Clear form
                document.getElementById('adminLoginSubmit').reset();
            } else {
                Utils.showError(result.message);
            }
        } catch (error) {
            Utils.showError('Login failed. Please try again.');
            console.error('Admin login error:', error);
        } finally {
            Utils.setButtonLoading(submitBtn, false);
        }
    }

    // Handle student login
    async handleStudentLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('studentEmail').value;
        const password = document.getElementById('studentPassword').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!email || !password) {
            Utils.showError('Please enter both email and password.');
            return;
        }

        Utils.setButtonLoading(submitBtn, true);
        
        try {
            const result = await authService.login(email, password, 'student');
            
            if (result.success) {
                // Always go to student dashboard
                Utils.showSuccess('Login successful! Welcome to your dashboard.');
                this.showStudentDashboard();
                
                // Clear form
                document.getElementById('studentLoginSubmit').reset();
            } else {
                Utils.showError(result.message);
            }
        } catch (error) {
            Utils.showError('Login failed. Please try again.');
            console.error('Student login error:', error);
        } finally {
            Utils.setButtonLoading(submitBtn, false);
        }
    }

    // Show admin dashboard
    showAdminDashboard() {
        this.hideAllViews();
        document.getElementById('adminDashboard').classList.remove('hidden');
        Utils.addAnimation(document.getElementById('adminDashboard'), 'fade-in');
        
        // Load admin user info
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            const adminInfo = document.getElementById('adminUserInfo');
            if (adminInfo) {
                adminInfo.textContent = `Welcome, ${currentUser.first_name} ${currentUser.last_name}`;
            }
        }
        
        // Initialize admin service
        if (window.adminService) {
            adminService.initializeDashboard();
        }
        
        // Prevent browser navigation during admin session
        history.pushState(null, null, location.href);
        this.currentView = 'admin-dashboard';
    }

    // Show student dashboard
    showStudentDashboard() {
        this.hideAllViews();
        document.getElementById('studentDashboard').classList.remove('hidden');
        Utils.addAnimation(document.getElementById('studentDashboard'), 'fade-in');
        
        // Initialize student service
        if (window.studentService) {
            studentService.initializeDashboard();
        }
        
        // Prevent browser navigation during student session
        history.pushState(null, null, location.href);
        this.currentView = 'student-dashboard';
    }

    // Handle password change with modal form
    handlePasswordReset(role) {
        this.currentPasswordChangeRole = role;
        this.showPasswordChangeModal();
    }

    // Show password change modal
    showPasswordChangeModal() {
        const modal = document.getElementById('changePasswordModal');
        modal.classList.remove('hidden');
        
        // Setup modal event listeners
        this.setupPasswordModalEventListeners();
        
        // Focus on email input
        document.getElementById('modalCurrentEmail').focus();
    }

    // Setup password modal event listeners
    setupPasswordModalEventListeners() {
        const modal = document.getElementById('changePasswordModal');
        const form = document.getElementById('changePasswordForm');
        const closeBtn = document.getElementById('closePasswordModal');
        const cancelBtn = document.getElementById('cancelPasswordChange');

        // Close modal
        closeBtn.onclick = () => this.hidePasswordChangeModal();
        cancelBtn.onclick = () => this.hidePasswordChangeModal();

        // Close when clicking outside modal
        window.onclick = (event) => {
            if (event.target === modal) {
                this.hidePasswordChangeModal();
            }
        };

        // Handle form submission
        form.onsubmit = (e) => {
            e.preventDefault();
            this.processPasswordChange();
        };
    }

    // Hide password change modal
    hidePasswordChangeModal() {
        const modal = document.getElementById('changePasswordModal');
        modal.classList.add('hidden');
        document.getElementById('changePasswordForm').reset();
    }

    // Process password change from modal
    async processPasswordChange() {
        const email = document.getElementById('modalCurrentEmail').value;
        const currentPassword = document.getElementById('modalCurrentPassword').value;
        const newPassword = document.getElementById('modalNewPassword').value;
        const confirmPassword = document.getElementById('modalConfirmPassword').value;

        if (!Utils.isValidEmail(email)) {
            Utils.showError('Please enter a valid email address.');
            return;
        }

        if (newPassword.length < 8) {
            Utils.showError('New password must be at least 8 characters long.');
            return;
        }

        if (confirmPassword !== newPassword) {
            Utils.showError('Passwords do not match.');
            return;
        }

        const result = await authService.changePassword(email, currentPassword, newPassword, this.currentPasswordChangeRole);
        
        if (result.success) {
            this.hidePasswordChangeModal();
            Utils.showSuccess('Password changed successfully! Please login with your new password.');
        } else {
            Utils.showError(result.message);
        }
    }

    // Handle admin registration
    async handleAdminRegistration(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminRegEmail').value;
        const password = document.getElementById('adminRegPassword').value;
        const confirmPassword = document.getElementById('adminRegConfirmPassword').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!email || !password || !confirmPassword) {
            Utils.showError('Please fill in all fields.');
            return;
        }

        if (!Utils.isValidEmail(email)) {
            Utils.showError('Please enter a valid email address.');
            return;
        }

        if (password !== confirmPassword) {
            Utils.showError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            Utils.showError('Password must be at least 8 characters long.');
            return;
        }

        Utils.setButtonLoading(submitBtn, true);
        
        try {
            // Check if user already exists
            const users = Utils.getLocalStorage('users') || [];
            if (users.find(u => u.email === email)) {
                Utils.showError('An account with this email already exists.');
                return;
            }

            const hashedPassword = await Utils.hashPassword(password);
            const newAdmin = {
                id: users.length + 1,
                email,
                password: hashedPassword,
                role: 'admin',
                first_name: email.split('@')[0],
                last_name: '',
                is_active: true,
                created_at: new Date().toISOString()
            };

            users.push(newAdmin);
            Utils.setLocalStorage('users', users);
            
            Utils.showSuccess('Admin account created successfully! You can now login.');
            this.showView('admin-login');
            
            // Clear form
            document.getElementById('adminRegisterSubmit').reset();
        } catch (error) {
            Utils.showError('Registration failed. Please try again.');
            console.error('Admin registration error:', error);
        } finally {
            Utils.setButtonLoading(submitBtn, false);
        }
    }

    // Handle student registration
    async handleStudentRegistration(e) {
        e.preventDefault();
        
        const email = document.getElementById('studentRegEmail').value;
        const password = document.getElementById('studentRegPassword').value;
        const confirmPassword = document.getElementById('studentRegConfirmPassword').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!email || !password || !confirmPassword) {
            Utils.showError('Please fill in all fields.');
            return;
        }

        if (!Utils.isValidEmail(email)) {
            Utils.showError('Please enter a valid email address.');
            return;
        }

        if (password !== confirmPassword) {
            Utils.showError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            Utils.showError('Password must be at least 8 characters long.');
            return;
        }

        Utils.setButtonLoading(submitBtn, true);
        
        try {
            // Check if user already exists
            const users = Utils.getLocalStorage('users') || [];
            if (users.find(u => u.email === email)) {
                Utils.showError('An account with this email already exists.');
                return;
            }

            const hashedPassword = await Utils.hashPassword(password);
            const newStudent = {
                id: users.length + 1,
                email,
                password: hashedPassword,
                role: 'student',
                first_name: email.split('@')[0],
                last_name: '',
                is_active: true,
                created_at: new Date().toISOString()
            };

            users.push(newStudent);
            Utils.setLocalStorage('users', users);
            
            Utils.showSuccess('Student account created successfully! You can now login.');
            this.showView('student-login');
            
            // Clear form
            document.getElementById('studentRegisterSubmit').reset();
        } catch (error) {
            Utils.showError('Registration failed. Please try again.');
            console.error('Student registration error:', error);
        } finally {
            Utils.setButtonLoading(submitBtn, false);
        }
    }

    // Handle student exam code entry
    async handleStudentExamCodeEntry(e) {
        e.preventDefault();
        
        const examCode = document.getElementById('studentExamCodeInput').value.trim().toUpperCase();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!examCode) {
            Utils.showError('Please enter an exam code.');
            return;
        }

        Utils.setButtonLoading(submitBtn, true);
        
        try {
            const exams = Utils.getLocalStorage('exams') || [];
            const exam = exams.find(e => e.exam_code === examCode && e.is_active);
            
            if (!exam) {
                Utils.showError('Invalid exam code or exam not found.');
                return;
            }

            // Check if student is allowed to take this exam
            const currentUser = authService.getCurrentUser();
            const participants = Utils.getLocalStorage('exam_participants') || [];
            const isAllowed = participants.some(p => 
                p.exam_id === exam.id && 
                p.user_id === currentUser.id && 
                p.is_allowed
            );

            if (!isAllowed) {
                Utils.showError('You are not authorized to take this exam.');
                return;
            }

            // Check if exam is still available
            if (!Utils.isTimeInRange(exam.start_time, exam.end_time)) {
                Utils.showError('This exam is not currently available.');
                return;
            }

            // Check if student has already completed this exam
            const attempts = Utils.getLocalStorage('exam_attempts') || [];
            const hasCompleted = attempts.some(a => 
                a.exam_id === exam.id && 
                a.user_id === currentUser.id && 
                a.is_submitted
            );

            if (hasCompleted) {
                Utils.showError('You have already completed this exam.');
                return;
            }

            // Success - start the exam
            Utils.showSuccess(`Exam "${exam.title}" found! Click OK to start.`);
            
            // Clear form
            document.getElementById('studentExamCodeSubmit').reset();
            
            // Initialize exam
            if (window.studentService) {
                window.studentService.initializeExam(exam);
            }

        } catch (error) {
            Utils.showError('Failed to access exam. Please try again.');
            console.error('Exam code entry error:', error);
        } finally {
            Utils.setButtonLoading(submitBtn, false);
        }
    }

    // Initialize demo data
    initializeDemoData() {
        // Check if demo data already exists
        const exams = Utils.getLocalStorage('exams') || [];
        const users = Utils.getLocalStorage('users') || [];
        
        if (exams.length === 0) {
            // Create sample exam
            const sampleExam = {
                id: 1,
                title: 'Sample Mathematics Test',
                description: 'A basic mathematics assessment covering algebra and geometry.',
                duration_minutes: 30,
                total_marks: 10,
                exam_code: 'MATH2024',
                created_by: 1,
                created_at: new Date().toISOString(),
                start_time: new Date().toISOString(),
                end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
                is_active: true,
                questions: [
                    {
                        id: 1,
                        question_text: 'What is 2 + 2?',
                        question_type: 'multiple_choice',
                        options: ['3', '4', '5', '6'],
                        correct_answer: '4',
                        marks: 2,
                        section_name: 'Basic Arithmetic',
                        question_order: 1
                    },
                    {
                        id: 2,
                        question_text: 'Is the square root of 16 equal to 4?',
                        question_type: 'true_false',
                        options: ['True', 'False'],
                        correct_answer: 'True',
                        marks: 2,
                        section_name: 'Square Roots',
                        question_order: 2
                    },
                    {
                        id: 3,
                        question_text: 'What is the formula for the area of a circle?',
                        question_type: 'short_answer',
                        options: null,
                        correct_answer: 'πr²',
                        marks: 3,
                        section_name: 'Geometry',
                        question_order: 3
                    },
                    {
                        id: 4,
                        question_text: 'Solve for x: 2x + 5 = 11',
                        question_type: 'short_answer',
                        options: null,
                        correct_answer: '3',
                        marks: 3,
                        section_name: 'Algebra',
                        question_order: 4
                    }
                ]
            };
            
            Utils.setLocalStorage('exams', [sampleExam]);
        }

        // Create sample students if none exist
        const students = users.filter(u => u.role === 'student');
        if (students.length === 0) {
            // Create sample students with hashed passwords
            Utils.hashPassword('test@1234').then(hash => {
                const sampleStudents = [
                    {
                        id: 2,
                        email: 'student1@test.com',
                        password: hash,
                        role: 'student',
                        first_name: 'John',
                        last_name: 'Doe',
                        is_active: true,
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 3,
                        email: 'student2@test.com',
                        password: hash,
                        role: 'student',
                        first_name: 'Jane',
                        last_name: 'Smith',
                        is_active: true,
                        created_at: new Date().toISOString()
                    }
                ];
                
                // Add sample students to existing users
                const allUsers = Utils.getLocalStorage('users') || [];
                Utils.setLocalStorage('users', [...allUsers, ...sampleStudents]);
                
                // Allow sample students to take the sample exam
                const participants = [
                    { id: 1, exam_id: 1, user_id: 2, is_allowed: true },
                    { id: 2, exam_id: 1, user_id: 3, is_allowed: true }
                ];
                Utils.setLocalStorage('exam_participants', participants);
            }).catch(error => {
                console.error('Error creating demo students:', error);
            });
        }
    }

    // Show application info
    showAppInfo() {
        Utils.showModal(
            'ExamSecure - Online Examination System',
            `
                Version: 1.0.0
                
                Features:
                • Secure authentication system
                • Fullscreen enforcement with warnings
                • Real-time exam timer
                • Multiple question types
                • Automatic grading
                • Admin dashboard for exam management
                • Student portal for taking exams
                
                Default Admin Login:
                Email: admin@examsecure.com
                Password: admin123
                
                Sample Student Login:
                Email: student1@test.com
                Password: test@1234
                
                Demo Exam Code: MATH2024
            `
        );
    }

    // Cleanup on page unload
    cleanup() {
        // Clear intervals and timeouts
        if (window.examTimer) {
            window.examTimer.stop();
        }
        
        if (window.fullscreenService) {
            window.fullscreenService.stopMonitoring();
        }
        
        if (window.studentService && window.studentService.autoSaveInterval) {
            clearInterval(window.studentService.autoSaveInterval);
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    const app = new ExamApp();
    
    // Initialize demo data
    app.initializeDemoData();
    
    // Make app available globally for debugging
    window.examApp = app;
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        app.cleanup();
    });
    
    // Add keyboard shortcut for app info (Ctrl+I)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'i' && document.getElementById('loginSelector')) {
            e.preventDefault();
            app.showAppInfo();
        }
    });
    
    console.log('ExamSecure application initialized successfully');
});

// Make ExamApp available globally
window.ExamApp = ExamApp;