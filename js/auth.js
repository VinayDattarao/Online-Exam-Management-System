// Authentication system for the examination platform

class AuthService {
    constructor() {
        this.currentUser = null;
        this.initializeDefaultAdmin();
    }

    // Initialize default admin account
    async initializeDefaultAdmin() {
        const defaultAdmin = {
            id: 1,
            email: 'admin@examsecure.com',
            password: await Utils.hashPassword('admin123'),
            role: 'admin',
            first_name: 'System',
            last_name: 'Administrator',
            is_active: true
        };

        // Store in localStorage for demo purposes
        let users = Utils.getLocalStorage('users') || [];
        if (!users.find(u => u.email === defaultAdmin.email)) {
            users.push(defaultAdmin);
            Utils.setLocalStorage('users', users);
        }
    }

    // Login user
    async login(email, password, role) {
        try {
            const hashedPassword = await Utils.hashPassword(password);
            const users = Utils.getLocalStorage('users') || [];
            
            const user = users.find(u => 
                u.email === email && 
                u.password === hashedPassword && 
                u.role === role && 
                u.is_active
            );

            if (user) {
                this.currentUser = user;
                Utils.setLocalStorage('current_user', user);
                Utils.setLocalStorage('login_time', Date.now());
                return { success: true, user };
            } else {
                return { success: false, message: 'Invalid credentials or user not found' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed. Please try again.' };
        }
    }

    // Register new student
    async registerStudent(email, firstName, lastName, password = 'test@1234') {
        try {
            const users = Utils.getLocalStorage('users') || [];
            
            // Check if user already exists
            if (users.find(u => u.email === email)) {
                return { success: false, message: 'User with this email already exists' };
            }

            const hashedPassword = await Utils.hashPassword(password);
            const newUser = {
                id: users.length + 1,
                email,
                password: hashedPassword,
                role: 'student',
                first_name: firstName,
                last_name: lastName,
                is_active: true,
                created_at: new Date().toISOString()
            };

            users.push(newUser);
            Utils.setLocalStorage('users', users);
            
            return { success: true, user: newUser };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Registration failed. Please try again.' };
        }
    }

    // Change password with current password verification
    async changePassword(email, currentPassword, newPassword, role) {
        try {
            const users = Utils.getLocalStorage('users') || [];
            const hashedCurrentPassword = await Utils.hashPassword(currentPassword);
            const user = users.find(u => u.email === email && u.password === hashedCurrentPassword && u.role === role);
            
            if (!user) {
                return { success: false, message: 'Invalid email, current password, or role' };
            }

            const hashedNewPassword = await Utils.hashPassword(newPassword);
            const userIndex = users.findIndex(u => u.id === user.id);
            users[userIndex].password = hashedNewPassword;
            Utils.setLocalStorage('users', users);
            
            return { success: true, message: 'Password changed successfully' };
        } catch (error) {
            console.error('Password change error:', error);
            return { success: false, message: 'Password change failed. Please try again.' };
        }
    }

    // Reset password (legacy method - kept for compatibility)
    async resetPassword(email, newPassword) {
        try {
            const users = Utils.getLocalStorage('users') || [];
            const userIndex = users.findIndex(u => u.email === email);
            
            if (userIndex === -1) {
                return { success: false, message: 'User not found' };
            }

            const hashedPassword = await Utils.hashPassword(newPassword);
            users[userIndex].password = hashedPassword;
            Utils.setLocalStorage('users', users);
            
            return { success: true, message: 'Password reset successfully' };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, message: 'Password reset failed. Please try again.' };
        }
    }

    // Check if user is logged in
    isAuthenticated() {
        const user = Utils.getLocalStorage('current_user');
        const loginTime = Utils.getLocalStorage('login_time');
        
        // Session timeout after 8 hours
        if (user && loginTime && (Date.now() - loginTime) < 8 * 60 * 60 * 1000) {
            this.currentUser = user;
            return true;
        }
        
        this.logout();
        return false;
    }

    // Get current user
    getCurrentUser() {
        if (!this.isAuthenticated()) {
            return null;
        }
        return this.currentUser;
    }

    // Logout user
    logout() {
        this.currentUser = null;
        Utils.removeLocalStorage('current_user');
        Utils.removeLocalStorage('login_time');
        Utils.clearAutoSave();
    }

    // Check if user has specific role
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    // Get all students (admin only)
    getAllStudents() {
        if (!this.hasRole('admin')) {
            return [];
        }
        
        const users = Utils.getLocalStorage('users') || [];
        return users.filter(u => u.role === 'student');
    }

    // Delete student (admin only)
    deleteStudent(studentId) {
        if (!this.hasRole('admin')) {
            return { success: false, message: 'Unauthorized' };
        }

        try {
            const users = Utils.getLocalStorage('users') || [];
            const filteredUsers = users.filter(u => u.id !== studentId);
            Utils.setLocalStorage('users', filteredUsers);
            
            return { success: true, message: 'Student deleted successfully' };
        } catch (error) {
            console.error('Delete student error:', error);
            return { success: false, message: 'Failed to delete student' };
        }
    }

    // Update student status (admin only)
    updateStudentStatus(studentId, isActive) {
        if (!this.hasRole('admin')) {
            return { success: false, message: 'Unauthorized' };
        }

        try {
            const users = Utils.getLocalStorage('users') || [];
            const userIndex = users.findIndex(u => u.id === studentId);
            
            if (userIndex === -1) {
                return { success: false, message: 'Student not found' };
            }

            users[userIndex].is_active = isActive;
            Utils.setLocalStorage('users', users);
            
            return { success: true, message: 'Student status updated successfully' };
        } catch (error) {
            console.error('Update student status error:', error);
            return { success: false, message: 'Failed to update student status' };
        }
    }

    // Generate secure session token
    generateSessionToken() {
        return Utils.generateRandomString(32);
    }

    // Validate strong password
    isStrongPassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    }

    // Get password strength
    getPasswordStrength(password) {
        let score = 0;
        const checks = [
            password.length >= 8,
            /[A-Z]/.test(password),
            /[a-z]/.test(password),
            /\d/.test(password),
            /[!@#$%^&*(),.?":{}|<>]/.test(password),
            password.length >= 12
        ];
        
        checks.forEach(check => {
            if (check) score++;
        });
        
        if (score < 3) return 'Weak';
        if (score < 5) return 'Medium';
        return 'Strong';
    }

    // Audit log for security
    auditLog(action, details = {}) {
        const logs = Utils.getLocalStorage('audit_logs') || [];
        const logEntry = {
            id: logs.length + 1,
            user_id: this.currentUser ? this.currentUser.id : null,
            action,
            details,
            timestamp: new Date().toISOString(),
            ip_address: 'localhost' // In production, get real IP
        };
        
        logs.push(logEntry);
        
        // Keep only last 1000 logs
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        
        Utils.setLocalStorage('audit_logs', logs);
    }

    // Get audit logs (admin only)
    getAuditLogs() {
        if (!this.hasRole('admin')) {
            return [];
        }
        
        return Utils.getLocalStorage('audit_logs') || [];
    }
}

// Initialize auth service
const authService = new AuthService();

// Make auth service available globally
window.authService = authService;