// Student functionality for examination platform

class StudentService {
    constructor() {
        this.currentExam = null;
        this.currentAttempt = null;
        this.autoSaveInterval = null;
        this.currentQuestionIndex = 0;
        this.markedForReview = new Set();
    }

    // Initialize student dashboard
    initializeDashboard() {
        this.setupTabNavigation();
        this.loadExamHistory();
        this.setupEventListeners();
        this.loadHistorySummary();
        this.checkAndHideExamCodeTab();
    }

    // Setup tab navigation
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('#studentDashboard .nav-btn:not(.logout-btn)');
        const tabContents = document.querySelectorAll('#studentDashboard .tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    content.classList.add('hidden');
                    content.style.display = 'none';
                });

                // Add active class to clicked button
                button.classList.add('active');

                // Show corresponding content
                const tabId = button.id.replace('Tab', 'Content');
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                    tabContent.classList.remove('hidden');
                    tabContent.style.display = 'block';
                    Utils.addAnimation(tabContent, 'fade-in');
                }
            });
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Join exam button
        document.getElementById('joinExamBtn').addEventListener('click', () => {
            this.joinExamByCode();
        });

        // Student logout (removed from dropdown)
        const studentLogoutBtn = document.getElementById('studentLogout');
        if (studentLogoutBtn) {
            studentLogoutBtn.addEventListener('click', () => {
                authService.logout();
                window.location.reload();
            });
        }

        // Exam code input enter key
        document.getElementById('examCodeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinExamByCode();
            }
        });

        // Three dots menu toggle
        document.getElementById('studentMenuTrigger').addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('studentDropdownMenu');
            dropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            const dropdown = document.getElementById('studentDropdownMenu');
            if (!dropdown.classList.contains('hidden')) {
                dropdown.classList.add('hidden');
            }
        });
    }

    // Load history summary
    loadHistorySummary() {
        const summaryContainer = document.getElementById('historySummary');
        const currentUser = authService.getCurrentUser();
        const attempts = Utils.getLocalStorage('exam_attempts') || [];
        const exams = Utils.getLocalStorage('exams') || [];
        
        const userAttempts = attempts.filter(a => a.user_id === currentUser.id && a.is_submitted);
        
        if (userAttempts.length === 0) {
            summaryContainer.innerHTML = `
                <h4>Welcome to ExamSecure</h4>
                <p>You haven't taken any exams yet. Enter an exam code above to get started!</p>
            `;
            return;
        }

        const totalExams = userAttempts.length;
        const totalScore = userAttempts.reduce((sum, attempt) => {
            const exam = exams.find(e => e.id === attempt.exam_id);
            return sum + (exam ? (attempt.total_score / exam.total_marks) * 100 : 0);
        }, 0);
        const averageScore = Math.round(totalScore / totalExams);
        const passedExams = userAttempts.filter(attempt => {
            const exam = exams.find(e => e.id === attempt.exam_id);
            return exam ? (attempt.total_score / exam.total_marks) * 100 >= 60 : false;
        }).length;

        summaryContainer.innerHTML = `
            <h4>Your Performance Summary</h4>
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-value">${totalExams}</span>
                    <div class="stat-label">Exams Taken</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${averageScore}%</span>
                    <div class="stat-label">Average Score</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${passedExams}</span>
                    <div class="stat-label">Passed</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${totalExams - passedExams}</span>
                    <div class="stat-label">Need Review</div>
                </div>
            </div>
        `;
    }

    // Load exam history
    loadExamHistory() {
        const historyList = document.getElementById('examHistoryList');
        const currentUser = authService.getCurrentUser();
        const attempts = Utils.getLocalStorage('exam_attempts') || [];
        const exams = Utils.getLocalStorage('exams') || [];
        
        const userAttempts = attempts.filter(a => a.user_id === currentUser.id);
        
        if (userAttempts.length === 0) {
            historyList.innerHTML = '<p>No exam history yet.</p>';
            return;
        }

        historyList.innerHTML = userAttempts.map(attempt => {
            const exam = exams.find(e => e.id === attempt.exam_id);
            const percentage = exam ? Math.round((attempt.total_score / exam.total_marks) * 100) : 0;
            const statusColor = percentage >= 60 ? '#38a169' : '#e53e3e';
            const statusText = attempt.is_submitted ? 'Completed' : 'In Progress';
            
            return `
                <div class="exam-item" data-attempt-id="${attempt.id}">
                    <div class="exam-main-info">
                        <div class="item-info">
                            <h4>${exam ? Utils.escapeHtml(exam.title) : 'Unknown Exam'}</h4>
                            <p><strong>Score:</strong> <span style="color: ${statusColor}; font-weight: bold;">${attempt.total_score}/${exam ? exam.total_marks : '?'} (${percentage}%)</span></p>
                            <p><strong>Status:</strong> ${statusText}</p>
                            <p><strong>Date:</strong> ${Utils.formatDate(attempt.start_time)}</p>
                        </div>
                        <div class="item-actions">
                            ${!attempt.is_submitted ? 
                                `<button class="action-btn view-btn" onclick="window.studentService.resumeExam(${attempt.id})">Resume</button>` :
                                `<button class="action-btn view-btn" onclick="window.studentService.toggleDetailedResults(${attempt.id})" id="toggle-btn-${attempt.id}">View Results</button>`
                            }
                        </div>
                    </div>
                    <div class="detailed-results hidden" id="results-${attempt.id}"></div>
                </div>
            `;
        }).join('');
    }

    // Join exam by code
    joinExamByCode() {
        const examCode = document.getElementById('examCodeInput').value.trim().toUpperCase();
        
        if (!examCode) {
            Utils.showError('Please enter an exam code.');
            return;
        }

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

        this.startExam(exam.id);
        document.getElementById('examCodeInput').value = '';
    }

    // Start exam
    startExam(examId) {
        const exams = Utils.getLocalStorage('exams') || [];
        const exam = exams.find(e => e.id === examId);
        
        if (!exam) {
            Utils.showError('Exam not found.');
            return;
        }

        Utils.showConfirm(
            'Start Exam',
            `Are you ready to start "${exam.title}"? Duration: ${exam.duration_minutes} minutes. Once started, you must complete the exam in fullscreen mode.`,
            () => {
                this.initializeExam(exam);
            }
        );
    }

    // Initialize exam
    initializeExam(exam) {
        this.currentExam = exam;
        
        // Create or get existing attempt
        const currentUser = authService.getCurrentUser();
        let attempts = Utils.getLocalStorage('exam_attempts') || [];
        
        let attempt = attempts.find(a => 
            a.exam_id === exam.id && 
            a.user_id === currentUser.id && 
            !a.is_submitted
        );

        if (!attempt) {
            attempt = {
                id: attempts.length + 1,
                exam_id: exam.id,
                user_id: currentUser.id,
                start_time: new Date().toISOString(),
                end_time: null,
                total_score: 0,
                is_submitted: false,
                warning_count: 0,
                auto_submitted: false
            };
            attempts.push(attempt);
            Utils.setLocalStorage('exam_attempts', attempts);
        }

        this.currentAttempt = attempt;

        // Show exam interface
        this.showExamInterface();
        
        // Start fullscreen monitoring
        window.fullscreenService.startMonitoring();
        
        // Setup auto-save
        this.setupAutoSave();
        
        // Log exam start
        authService.auditLog('start_exam', { exam_id: exam.id, attempt_id: attempt.id });
    }

    // Resume exam
    resumeExam(attemptId) {
        const attempts = Utils.getLocalStorage('exam_attempts') || [];
        const attempt = attempts.find(a => a.id === attemptId);
        
        if (!attempt) {
            Utils.showError('Exam attempt not found.');
            return;
        }

        const exams = Utils.getLocalStorage('exams') || [];
        const exam = exams.find(e => e.id === attempt.exam_id);
        
        if (!exam) {
            Utils.showError('Exam not found.');
            return;
        }

        this.currentExam = exam;
        this.currentAttempt = attempt;
        
        this.showExamInterface();
        window.fullscreenService.startMonitoring();
        this.setupAutoSave();
    }

    // Show exam interface
    showExamInterface() {
        // Hide dashboard, show exam interface
        document.getElementById('studentDashboard').classList.add('hidden');
        document.getElementById('examInterface').classList.remove('hidden');
        
        // Setup exam interface
        document.getElementById('examTitleDisplay').textContent = this.currentExam.title;
        
        // Setup student info
        const currentUser = authService.getCurrentUser();
        document.getElementById('studentName').textContent = `${currentUser.first_name} ${currentUser.last_name}`;
        document.getElementById('studentEmail').textContent = currentUser.email;
        
        // Setup timer
        window.examTimer.start(this.currentExam.duration_minutes * 60, () => {
            this.autoSubmitExam('Time expired');
        });
        
        // Load questions
        this.loadExamQuestions();
        
        // Load existing answers
        this.loadExistingAnswers();
        
        // Enter fullscreen
        window.fullscreenService.enterFullscreen();
    }

    // Load exam questions
    loadExamQuestions() {
        const questions = [...this.currentExam.questions];
        
        // Shuffle options for multiple choice questions (but keep original order for admin)
        questions.forEach(question => {
            if (question.question_type === 'multiple_choice' && question.options) {
                // Create pairs of options and indices, shuffle, then reconstruct
                const optionPairs = question.options.map((option, index) => ({ option, index }));
                const shuffled = Utils.shuffleArray(optionPairs);
                question.shuffledOptions = shuffled.map(pair => pair.option);
                question.originalIndices = shuffled.map(pair => pair.index);
            }
        });
        
        // Store questions for exam session
        this.currentExam.displayQuestions = questions;
        
        // Generate question navigation
        this.generateQuestionNavigation();
        
        // Show first question
        this.currentQuestionIndex = 0;
        this.showQuestion(0);
    }

    // Generate question navigation
    generateQuestionNavigation() {
        const navContainer = document.getElementById('questionButtons');
        const questions = this.currentExam.displayQuestions;
        
        navContainer.innerHTML = questions.map((_, index) => 
            `<button class="question-nav-btn" onclick="studentService.showQuestion(${index})">${index + 1}</button>`
        ).join('');
    }

    // Show specific question
    showQuestion(index) {
        const questions = this.currentExam.displayQuestions;
        if (index < 0 || index >= questions.length) return;
        
        this.currentQuestionIndex = index;
        const question = questions[index];
        
        // Update navigation
        document.querySelectorAll('.question-nav-btn').forEach((btn, i) => {
            btn.classList.remove('current');
            if (i === index) btn.classList.add('current');
        });
        
        // Display question
        const questionDisplay = document.getElementById('questionDisplay');
        questionDisplay.innerHTML = this.renderQuestion(question, index);
        
        // Load existing answer for this question
        this.loadExistingAnswer(index);
        
        // Update navigation buttons
        document.getElementById('prevQuestion').disabled = index === 0;
        document.getElementById('nextQuestion').disabled = index === questions.length - 1;
        
        Utils.addAnimation(questionDisplay, 'fade-in');
    }

    // Render question HTML
    renderQuestion(question, index) {
        let optionsHtml = '';
        
        if (question.question_type === 'multiple_choice') {
            const options = question.shuffledOptions || question.options;
            optionsHtml = `
                <div class="question-options">
                    ${options.map((option, optionIndex) => `
                        <div class="option-item">
                            <input type="radio" name="question_${index}" value="${Utils.escapeHtml(option)}" 
                                   id="q${index}_opt${optionIndex}" onchange="studentService.saveAnswer(${index}, this.value)">
                            <label for="q${index}_opt${optionIndex}">${Utils.escapeHtml(option)}</label>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (question.question_type === 'true_false') {
            optionsHtml = `
                <div class="question-options">
                    <div class="option-item">
                        <input type="radio" name="question_${index}" value="True" 
                               id="q${index}_true" onchange="studentService.saveAnswer(${index}, this.value)">
                        <label for="q${index}_true">True</label>
                    </div>
                    <div class="option-item">
                        <input type="radio" name="question_${index}" value="False" 
                               id="q${index}_false" onchange="studentService.saveAnswer(${index}, this.value)">
                        <label for="q${index}_false">False</label>
                    </div>
                </div>
            `;
        } else if (question.question_type === 'short_answer') {
            optionsHtml = `
                <div class="question-options">
                    <textarea name="question_${index}" placeholder="Enter your answer here..." 
                              rows="4" onchange="studentService.saveAnswer(${index}, this.value)"
                              id="q${index}_text"></textarea>
                </div>
            `;
        }
        
        return `
            <div class="question-content">
                <div class="question-header">
                    <span class="question-number">Question ${index + 1} of ${this.currentExam.displayQuestions.length}</span>
                    <span class="question-marks">Marks: ${question.marks}</span>
                </div>
                <div class="question-text">${Utils.escapeHtml(question.question_text)}</div>
                ${optionsHtml}
            </div>
        `;
    }

    // Save answer
    saveAnswer(questionIndex, answer) {
        if (!this.currentAttempt) return;
        
        const studentAnswers = Utils.getLocalStorage('student_answers') || [];
        const question = this.currentExam.displayQuestions[questionIndex];
        const originalQuestionId = question.id || questionIndex;
        
        // Remove existing answer for this question
        const filteredAnswers = studentAnswers.filter(a => 
            !(a.attempt_id === this.currentAttempt.id && 
              (a.question_id === originalQuestionId || a.question_index === questionIndex))
        );
        
        // Add new answer
        const answerRecord = {
            id: studentAnswers.length + 1,
            attempt_id: this.currentAttempt.id,
            question_id: originalQuestionId,
            question_index: questionIndex,
            answer_text: answer,
            is_correct: this.checkAnswer(question, answer),
            marks_awarded: this.checkAnswer(question, answer) ? question.marks : 0
        };
        
        filteredAnswers.push(answerRecord);
        Utils.setLocalStorage('student_answers', filteredAnswers);
        
        // Update navigation to show answered
        const navBtn = document.querySelector(`.question-nav-btn:nth-child(${questionIndex + 1})`);
        if (navBtn) {
            if (answer.trim()) {
                navBtn.classList.add('answered');
                navBtn.classList.remove('unattempted');
            } else {
                navBtn.classList.remove('answered');
                navBtn.classList.add('unattempted');
            }
        }
        
        // Auto-save
        this.saveProgress();
    }

    // Check if answer is correct
    checkAnswer(question, answer) {
        if (!answer || !question.correct_answer) return false;
        
        const studentAnswer = answer.trim().toLowerCase();
        const correctAnswer = question.correct_answer.trim().toLowerCase();
        
        // For multiple choice and true/false, exact match required
        if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
            return studentAnswer === correctAnswer;
        }
        
        // For short answer, allow more flexible matching
        if (question.question_type === 'short_answer') {
            // Exact match
            if (studentAnswer === correctAnswer) return true;
            
            // Remove common variations (spaces, punctuation)
            const cleanStudent = studentAnswer.replace(/[^\w]/g, '');
            const cleanCorrect = correctAnswer.replace(/[^\w]/g, '');
            
            if (cleanStudent === cleanCorrect) return true;
            
            // For mathematical answers, try parsing as numbers
            const studentNum = parseFloat(studentAnswer);
            const correctNum = parseFloat(correctAnswer);
            if (!isNaN(studentNum) && !isNaN(correctNum)) {
                return Math.abs(studentNum - correctNum) < 0.01; // Allow small floating point differences
            }
        }
        
        return false;
    }

    // Load existing answers
    loadExistingAnswers() {
        if (!this.currentAttempt) return;
        
        const studentAnswers = Utils.getLocalStorage('student_answers') || [];
        const attemptAnswers = studentAnswers.filter(a => a.attempt_id === this.currentAttempt.id);
        
        // Load existing answers and mark navigation
        attemptAnswers.forEach(answer => {
            const questionIndex = answer.question_index;
            const navBtn = document.querySelector(`.question-nav-btn:nth-child(${questionIndex + 1})`);
            if (navBtn) {
                if (this.markedForReview.has(questionIndex)) {
                    navBtn.classList.add('marked-review');
                    navBtn.classList.remove('unattempted', 'answered');
                } else {
                    navBtn.classList.add('answered');
                    navBtn.classList.remove('unattempted', 'marked-review');
                }
            }
        });
        
        // Mark unanswered questions
        for (let i = 0; i < this.currentExam.displayQuestions.length; i++) {
            const hasAnswer = attemptAnswers.some(a => 
                a.question_index === i && a.answer_text && a.answer_text.trim()
            );
            const navBtn = document.querySelector(`.question-nav-btn:nth-child(${i + 1})`);
            if (navBtn && !hasAnswer && !this.markedForReview.has(i)) {
                navBtn.classList.add('unattempted');
                navBtn.classList.remove('answered', 'marked-review');
            }
        }
    }

    // Setup auto-save
    setupAutoSave() {
        this.autoSaveInterval = Utils.createAutoSave(() => {
            return {
                attempt_id: this.currentAttempt.id,
                current_question: this.currentQuestionIndex,
                timestamp: Date.now()
            };
        }, 15000); // Save every 15 seconds
    }

    // Save progress
    saveProgress() {
        if (!this.currentAttempt) return;
        
        // Calculate current score
        const studentAnswers = Utils.getLocalStorage('student_answers') || [];
        const attemptAnswers = studentAnswers.filter(a => a.attempt_id === this.currentAttempt.id);
        const totalScore = attemptAnswers.reduce((sum, answer) => sum + answer.marks_awarded, 0);
        
        // Update attempt
        const attempts = Utils.getLocalStorage('exam_attempts') || [];
        const attemptIndex = attempts.findIndex(a => a.id === this.currentAttempt.id);
        if (attemptIndex !== -1) {
            attempts[attemptIndex].total_score = totalScore;
            Utils.setLocalStorage('exam_attempts', attempts);
            this.currentAttempt.total_score = totalScore;
        }
    }

    // Submit exam
    submitExam() {
        Utils.showConfirm(
            'Submit Exam',
            'Are you sure you want to submit your exam? You cannot change your answers after submission.',
            () => {
                this.finalizeExam(false);
            }
        );
    }

    // Auto-submit exam
    autoSubmitExam(reason) {
        this.finalizeExam(true, reason);
    }

    // Finalize exam submission
    finalizeExam(autoSubmitted = false, reason = '') {
        if (!this.currentAttempt) return;
        
        // Save final progress
        this.saveProgress();
        
        // Update attempt as submitted
        const attempts = Utils.getLocalStorage('exam_attempts') || [];
        const attemptIndex = attempts.findIndex(a => a.id === this.currentAttempt.id);
        if (attemptIndex !== -1) {
            attempts[attemptIndex].is_submitted = true;
            attempts[attemptIndex].auto_submitted = autoSubmitted;
            attempts[attemptIndex].end_time = new Date().toISOString();
            Utils.setLocalStorage('exam_attempts', attempts);
        }
        
        // Clean up
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        Utils.clearAutoSave();
        
        // Exit fullscreen and stop monitoring
        window.fullscreenService.stopMonitoring();
        window.fullscreenService.exitFullscreen();
        
        // Stop timer
        window.examTimer.stop();
        
        // Show results
        const percentage = Math.round((this.currentAttempt.total_score / this.currentExam.total_marks) * 100);
        Utils.showModal(
            'Exam Submitted',
            `Your exam has been ${autoSubmitted ? 'automatically ' : ''}submitted${reason ? ` (${reason})` : ''}.\n\nScore: ${this.currentAttempt.total_score}/${this.currentExam.total_marks} (${percentage}%)`,
            () => {
                // Return to dashboard
                this.returnToDashboard();
            }
        );
        
        // Log exam submission
        authService.auditLog('submit_exam', { 
            exam_id: this.currentExam.id, 
            attempt_id: this.currentAttempt.id,
            auto_submitted: autoSubmitted,
            reason: reason 
        });
    }

    // Return to dashboard
    returnToDashboard() {
        document.getElementById('examInterface').classList.add('hidden');
        document.getElementById('studentDashboard').classList.remove('hidden');
        
        this.currentExam = null;
        this.currentAttempt = null;
        this.currentQuestionIndex = 0;
        
        // Reload dashboard data
        this.loadExamHistory();
        this.loadHistorySummary();
        this.checkAndHideExamCodeTab();
    }

    // Setup default tab (always show Exam Results first)  
    checkAndHideExamCodeTab() {
        // Always show exam results tab first
        const examCodeTab = document.getElementById('examCodeTab');
        const examHistoryTab = document.getElementById('examHistoryTab');
        const examCodeContent = document.getElementById('examCodeContent');
        const examHistoryContent = document.getElementById('examHistoryContent');
        
        if (examCodeTab && examHistoryTab && examCodeContent && examHistoryContent) {
            // Ensure exam results is the active tab
            examCodeTab.classList.remove('active');
            examHistoryTab.classList.add('active');
            examCodeContent.classList.remove('active');
            examCodeContent.classList.add('hidden');
            examHistoryContent.classList.add('active');
            examHistoryContent.classList.remove('hidden');
        }
    }


    // Toggle detailed exam results (inline display)
    toggleDetailedResults(attemptId) {
        const resultsDiv = document.getElementById(`results-${attemptId}`);
        const toggleBtn = document.getElementById(`toggle-btn-${attemptId}`);
        
        if (resultsDiv.classList.contains('hidden')) {
            // Show results
            const attempts = Utils.getLocalStorage('exam_attempts') || [];
            const numericAttemptId = parseInt(attemptId);
            const attempt = attempts.find(a => a.id === numericAttemptId);
            
            if (!attempt) {
                Utils.showError('Exam attempt not found.');
                return;
            }

            const exams = Utils.getLocalStorage('exams') || [];
            const exam = exams.find(e => e.id === attempt.exam_id);
            
            if (!exam) {
                Utils.showError('Exam not found.');
                return;
            }

            // Get student answers
            const studentAnswers = Utils.getLocalStorage('student_answers') || [];
            const attemptAnswers = studentAnswers.filter(a => a.attempt_id === attempt.id);
            
            this.showInlineDetailedResults(resultsDiv, exam, attempt, attemptAnswers);
            resultsDiv.classList.remove('hidden');
            toggleBtn.textContent = 'Hide Results';
        } else {
            // Hide results
            resultsDiv.classList.add('hidden');
            toggleBtn.textContent = 'View Results';
        }
    }

    // View detailed exam results (legacy method for compatibility)
    viewDetailedResults(attemptId) {
        this.toggleDetailedResults(attemptId);
    }

    // Show inline detailed results
    showInlineDetailedResults(containerDiv, exam, attempt, studentAnswers) {
        const percentage = Math.round((attempt.total_score / exam.total_marks) * 100);
        const statusColor = percentage >= 60 ? '#38a169' : '#e53e3e';
        const passStatus = percentage >= 60 ? 'PASSED' : 'NEEDS REVIEW';
        
        let correctCount = 0;
        let questionsHtml = '';
        
        exam.questions.forEach((question, index) => {
            const studentAnswer = studentAnswers.find(a => 
                a.question_id === question.id || a.question_index === index
            );
            
            const isCorrect = studentAnswer ? studentAnswer.is_correct : false;
            if (isCorrect) correctCount++;
            
            const resultColor = isCorrect ? '#38a169' : '#e53e3e';
            const resultStatus = isCorrect ? 'Correct' : 'Incorrect';
            const studentAnswerText = studentAnswer ? studentAnswer.answer_text : 'No answer provided';
            
            questionsHtml += `
                <div style="margin-bottom: 1.5rem; padding: 1.5rem; border-left: 6px solid ${resultColor}; background: ${isCorrect ? '#f0fff4' : '#ffeaea'}; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                        <span style="color: white; font-size: 0.9rem; font-weight: 600; margin-right: 0.75rem; padding: 0.4rem 0.8rem; background: ${resultColor}; border-radius: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${resultStatus}</span>
                        <h5 style="margin: 0; color: #2d3748; flex: 1; font-size: 1.1rem; font-weight: 600;">Question ${index + 1} (${question.marks} mark${question.marks > 1 ? 's' : ''})</h5>
                        <span style="color: white; font-weight: bold; font-size: 1rem; background: ${resultColor}; padding: 0.4rem 0.8rem; border-radius: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${studentAnswer ? studentAnswer.marks_awarded : 0}/${question.marks}</span>
                    </div>
                    <div style="background: #f7fafc; padding: 1.2rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e2e8f0;">
                        <p style="margin: 0; color: #2d3748; font-weight: 500; line-height: 1.6; font-size: 1rem;">${Utils.escapeHtml(question.question_text)}</p>
                    </div>
                    <div style="background: ${isCorrect ? '#ffffff' : '#fff5f5'}; padding: 1.2rem; border-radius: 8px; margin-bottom: 1rem; border: 2px solid ${resultColor};">
                        <p style="margin: 0 0 0.8rem 0;"><strong style="color: #2d3748; font-size: 1rem;">Your Answer:</strong></p>
                        <p style="margin: 0; color: ${resultColor}; font-weight: bold; font-size: 1.1rem; padding: 0.8rem; background: ${isCorrect ? '#f0fff4' : '#ffeaea'}; border-radius: 6px; border: 1px solid ${resultColor};">${Utils.escapeHtml(studentAnswerText)}</p>
                    </div>
                    ${!isCorrect ? `
                        <div style="background: #f0fff4; padding: 1.2rem; border-radius: 8px; border: 2px solid #38a169;">
                            <p style="margin: 0 0 0.8rem 0;"><strong style="color: #2d3748; font-size: 1rem;">✅ Correct Answer:</strong></p>
                            <p style="margin: 0; color: #38a169; font-weight: bold; font-size: 1.1rem; padding: 0.8rem; background: #c6f6d5; border-radius: 6px; border: 1px solid #38a169;">${Utils.escapeHtml(question.correct_answer)}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        const content = `
            <div style="width: 100%; padding: 1.5rem; background: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div style="text-align: center; padding: 1.5rem; margin-bottom: 1.5rem; background: ${statusColor}; color: white; border-radius: 8px;">
                    <h3 style="margin: 0; color: white;">${Utils.escapeHtml(exam.title)} - Detailed Results</h3>
                    <h2 style="margin: 0.5rem 0; font-size: 2rem;">${attempt.total_score}/${exam.total_marks}</h2>
                    <p style="margin: 0.25rem 0; font-size: 1.1rem; opacity: 0.9;">${percentage}% - ${passStatus}</p>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.8;">${correctCount} out of ${exam.questions.length} questions correct</p>
                </div>
                <div style="margin-bottom: 1rem;">
                    <h4 style="color: #2d3748; margin-bottom: 1rem; text-align: center;">Question by Question Review</h4>
                    ${questionsHtml}
                </div>
            </div>
        `;
        
        containerDiv.innerHTML = content;
    }

    // Clear current answer
    clearCurrentAnswer() {
        const currentIndex = this.currentQuestionIndex;
        const question = this.currentExam.displayQuestions[currentIndex];
        
        // Clear form inputs
        const inputs = document.querySelectorAll(`input[name="question_${currentIndex}"], textarea[name="question_${currentIndex}"]`);
        inputs.forEach(input => {
            if (input.type === 'radio' || input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
        
        // Remove from storage
        const studentAnswers = Utils.getLocalStorage('student_answers') || [];
        const filteredAnswers = studentAnswers.filter(a => 
            !(a.attempt_id === this.currentAttempt.id && 
              (a.question_id === question.id || a.question_index === currentIndex))
        );
        Utils.setLocalStorage('student_answers', filteredAnswers);
        
        // Update navigation button
        const navBtn = document.querySelector(`.question-nav-btn:nth-child(${currentIndex + 1})`);
        if (navBtn) {
            navBtn.classList.remove('answered');
            navBtn.classList.add('unattempted');
        }
        
        this.saveProgress();
        Utils.showSuccess('Answer cleared.');
    }

    // Mark question for review
    markForReview() {
        const currentIndex = this.currentQuestionIndex;
        
        // Check if any option is selected
        const inputs = document.querySelectorAll(`input[name="question_${currentIndex}"], textarea[name="question_${currentIndex}"]`);
        let hasAnswer = false;
        let answerValue = '';
        
        inputs.forEach(input => {
            if ((input.type === 'radio' || input.type === 'checkbox') && input.checked) {
                hasAnswer = true;
                answerValue = input.value;
            } else if (input.type === 'textarea' && input.value.trim()) {
                hasAnswer = true;
                answerValue = input.value.trim();
            }
        });
        
        if (!hasAnswer) {
            Utils.showError('Please select an answer before marking for review.');
            return;
        }
        
        // Save current answer first
        this.saveAnswer(currentIndex, answerValue);
        
        // Add to marked for review
        this.markedForReview.add(currentIndex);
        
        // Update navigation button with marked-review status
        const navBtn = document.querySelector(`.question-nav-btn:nth-child(${currentIndex + 1})`);
        if (navBtn) {
            navBtn.classList.add('marked-review');
            navBtn.classList.remove('unattempted', 'answered');
        }
        
        Utils.showSuccess('Question marked for review.');
    }

    // Save and move to next question
    saveAndNext() {
        const currentIndex = this.currentQuestionIndex;
        
        // Save current answer
        const selectedInput = document.querySelector(`input[name="question_${currentIndex}"]:checked`) || 
                            document.querySelector(`textarea[name="question_${currentIndex}"]`);
        
        if (selectedInput && selectedInput.value.trim()) {
            this.saveAnswer(currentIndex, selectedInput.value);
        }
        
        // Move to next question
        const totalQuestions = this.currentExam.displayQuestions.length;
        if (currentIndex < totalQuestions - 1) {
            this.showQuestion(currentIndex + 1);
        } else {
            Utils.showModal(
                'End of Exam',
                'You have reached the last question. Please review your answers and submit when ready.',
                () => {
                    // Go to first unanswered question if any
                    const unansweredIndex = this.findFirstUnanswered();
                    if (unansweredIndex !== -1) {
                        this.showQuestion(unansweredIndex);
                    }
                }
            );
        }
    }

    // Find first unanswered question
    findFirstUnanswered() {
        const studentAnswers = Utils.getLocalStorage('student_answers') || [];
        const attemptAnswers = studentAnswers.filter(a => a.attempt_id === this.currentAttempt.id);
        
        for (let i = 0; i < this.currentExam.displayQuestions.length; i++) {
            const hasAnswer = attemptAnswers.some(a => 
                a.question_index === i && a.answer_text && a.answer_text.trim()
            );
            if (!hasAnswer) {
                return i;
            }
        }
        return -1;
    }

    // Load existing answer for a specific question
    loadExistingAnswer(questionIndex) {
        if (!this.currentAttempt) return;
        
        const studentAnswers = Utils.getLocalStorage('student_answers') || [];
        const existingAnswer = studentAnswers.find(a => 
            a.attempt_id === this.currentAttempt.id && a.question_index === questionIndex
        );
        
        if (existingAnswer && existingAnswer.answer_text) {
            const question = this.currentExam.displayQuestions[questionIndex];
            
            if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
                // Select the radio button with the saved answer
                const radioButton = document.querySelector(`input[name="question_${questionIndex}"][value="${existingAnswer.answer_text}"]`);
                if (radioButton) {
                    radioButton.checked = true;
                }
            } else if (question.question_type === 'short_answer') {
                // Set the textarea value
                const textarea = document.querySelector(`textarea[name="question_${questionIndex}"]`);
                if (textarea) {
                    textarea.value = existingAnswer.answer_text;
                }
            }
        }
    }
}

// Initialize student service
const studentService = new StudentService();

// Make student service available globally
window.studentService = studentService;