// Utility functions for the examination system

class Utils {
    // Show modal with message
    static showModal(title, message, callback = null) {
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalTitle.textContent = title;
        modalMessage.innerHTML = message;
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        modalOk.onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            if (callback) callback();
        };
    }

    // Show success message
    static showSuccess(message) {
        this.showModal('Success', message);
    }

    // Show error message
    static showError(message) {
        this.showModal('Error', message);
    }

    // Show confirmation dialog
    static showConfirm(title, message, onConfirm, onCancel = null) {
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalOk.textContent = 'Confirm';
        
        // Create cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'modal-btn';
        cancelBtn.style.marginLeft = '10px';
        cancelBtn.style.background = '#718096';
        
        modalOk.parentNode.appendChild(cancelBtn);
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        modalOk.onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            cancelBtn.remove();
            modalOk.textContent = 'OK';
            if (onConfirm) onConfirm();
        };
        
        cancelBtn.onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            cancelBtn.remove();
            modalOk.textContent = 'OK';
            if (onCancel) onCancel();
        };
    }

    // Format time (seconds to HH:MM:SS)
    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Generate random string
    static generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // Format date for display
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Hash password (simple client-side hashing - in production use proper server-side hashing)
    static async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Local storage helpers
    static setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    static getLocalStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    static removeLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    // Add loading state to button
    static setButtonLoading(button, loading = true) {
        if (loading) {
            button.classList.add('btn-loading');
            button.disabled = true;
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
        }
    }

    // Shuffle array
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Add animation class and remove after animation
    static addAnimation(element, animationClass, duration = 1000) {
        element.classList.add(animationClass);
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, duration);
    }

    // Check if current time is between start and end times
    static isTimeInRange(startTime, endTime) {
        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(endTime);
        return now >= start && now <= end;
    }

    // Calculate time remaining until exam end
    static getTimeRemaining(endTime) {
        const now = new Date();
        const end = new Date(endTime);
        const difference = end - now;
        
        if (difference <= 0) return 0;
        
        return Math.floor(difference / 1000); // Return seconds
    }

    // Escape HTML to prevent XSS
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Create element with attributes
    static createElement(tag, attributes = {}, textContent = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (textContent) {
            element.textContent = textContent;
        }
        
        return element;
    }

    // Copy text to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }

    // Auto-save functionality
    static createAutoSave(dataGetter, interval = 30000) {
        return setInterval(() => {
            const data = dataGetter();
            if (data) {
                this.setLocalStorage('auto_save', {
                    data: data,
                    timestamp: Date.now()
                });
            }
        }, interval);
    }

    // Clear auto-save
    static clearAutoSave() {
        this.removeLocalStorage('auto_save');
    }

    // Get auto-save data
    static getAutoSave() {
        const autoSave = this.getLocalStorage('auto_save');
        if (autoSave && (Date.now() - autoSave.timestamp) < 300000) { // 5 minutes
            return autoSave.data;
        }
        return null;
    }
}

// Make Utils available globally
window.Utils = Utils;