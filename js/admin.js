// Admin functionality for examination management

class AdminService {
    constructor() {
        this.currentQuestionCount = 0;
    }

    // Initialize admin dashboard
    initializeDashboard() {
        this.setupTabNavigation();
        this.loadExams();
        this.loadStudents();
        this.loadResults();
        this.setupEventListeners();
    }

    // Setup tab navigation
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('#adminDashboard .nav-btn:not(.logout-btn)');
        const tabContents = document.querySelectorAll('#adminDashboard .tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked button
                button.classList.add('active');

                // Show corresponding content
                const tabId = button.id.replace('Tab', 'Content');
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                    Utils.addAnimation(tabContent, 'fade-in');
                }
            });
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Create exam form
        document.getElementById('createExamForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createExam();
        });

        // Add question button
        document.getElementById('addQuestion').addEventListener('click', () => {
            this.addQuestion();
        });

        // Add student button
        document.getElementById('addStudentBtn').addEventListener('click', () => {
            this.showAddStudentForm();
        });

        // Admin logout
        document.getElementById('adminLogout').addEventListener('click', () => {
            authService.logout();
            window.location.reload();
        });

        // Admin menu toggle
        document.getElementById('adminMenuTrigger').addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('adminDropdownMenu');
            dropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            const dropdown = document.getElementById('adminDropdownMenu');
            if (!dropdown.classList.contains('hidden')) {
                dropdown.classList.add('hidden');
            }
        });
    }

    // Add new question to exam form
    addQuestion() {
        this.currentQuestionCount++;
        const questionsContainer = document.getElementById('questionsContainer');
        
        const questionDiv = Utils.createElement('div', { className: 'question-item' });
        questionDiv.innerHTML = `
            <div class="question-header">
                <span class="question-number">Question ${this.currentQuestionCount}</span>
                <button type="button" class="remove-question" onclick="adminService.removeQuestion(this)">Remove</button>
            </div>
            <div class="input-group">
                <label>Question Text</label>
                <textarea name="question_text" required rows="3"></textarea>
            </div>
            <div class="input-group">
                <label>Question Type</label>
                <select name="question_type" onchange="adminService.handleQuestionTypeChange(this)" required>
                    <option value="">Select Type</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="short_answer">Short Answer</option>
                </select>
            </div>
            <div class="input-group">
                <label>Section</label>
                <input type="text" name="section_name" placeholder="e.g., Math, Science">
            </div>
            <div class="input-group">
                <label>Marks</label>
                <input type="number" name="marks" value="1" min="1" required>
            </div>
            <div class="options-container" style="display: none;">
                <label>Options</label>
                <div class="options-list">
                    <!-- Options will be added dynamically -->
                </div>
                <button type="button" class="add-option-btn" onclick="adminService.addOption(this)">Add Option</button>
            </div>
            <div class="correct-answer-container" style="display: none;">
                <div class="input-group">
                    <label>Correct Answer</label>
                    <input type="text" name="correct_answer" placeholder="Enter correct answer">
                </div>
            </div>
        `;
        
        questionsContainer.appendChild(questionDiv);
        Utils.addAnimation(questionDiv, 'slide-in');
    }

    // Remove question
    removeQuestion(button) {
        const questionItem = button.closest('.question-item');
        Utils.addAnimation(questionItem, 'fade-out');
        setTimeout(() => {
            questionItem.remove();
            this.renumberQuestions();
        }, 500);
    }

    // Renumber questions after removal
    renumberQuestions() {
        const questions = document.querySelectorAll('.question-item');
        questions.forEach((question, index) => {
            const questionNumber = question.querySelector('.question-number');
            questionNumber.textContent = `Question ${index + 1}`;
        });
        this.currentQuestionCount = questions.length;
    }

    // Handle question type change
    handleQuestionTypeChange(select) {
        const questionItem = select.closest('.question-item');
        const optionsContainer = questionItem.querySelector('.options-container');
        const correctAnswerContainer = questionItem.querySelector('.correct-answer-container');
        const questionType = select.value;

        // Hide all containers first
        optionsContainer.style.display = 'none';
        correctAnswerContainer.style.display = 'none';

        if (questionType === 'multiple_choice') {
            optionsContainer.style.display = 'block';
            const optionsList = optionsContainer.querySelector('.options-list');
            optionsList.innerHTML = ''; // Clear existing options
            
            // Add first two options by default
            this.addOption(optionsContainer.querySelector('.add-option-btn'));
            this.addOption(optionsContainer.querySelector('.add-option-btn'));
            
            // Update label
            const label = optionsContainer.querySelector('label');
            label.textContent = 'Options (Select the correct answer with the radio button)';
            
            Utils.addAnimation(optionsContainer, 'slide-down');
        } else if (questionType === 'true_false') {
            optionsContainer.style.display = 'block';
            const optionsList = optionsContainer.querySelector('.options-list');
            const radioName = `correct_tf_${Date.now()}`;
            optionsList.innerHTML = `
                <div class="option-input" style="background: #f8fafc; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                    <input type="radio" name="${radioName}" value="True" id="true_${radioName}">
                    <label for="true_${radioName}" style="margin-left: 8px; cursor: pointer; font-weight: 500;">True</label>
                </div>
                <div class="option-input" style="background: #f8fafc; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                    <input type="radio" name="${radioName}" value="False" id="false_${radioName}">
                    <label for="false_${radioName}" style="margin-left: 8px; cursor: pointer; font-weight: 500;">False</label>
                </div>
            `;
            
            // Update label
            const label = optionsContainer.querySelector('label');
            label.textContent = 'Select the correct answer:';
            
            Utils.addAnimation(optionsContainer, 'slide-down');
        } else if (questionType === 'short_answer') {
            correctAnswerContainer.style.display = 'block';
            Utils.addAnimation(correctAnswerContainer, 'slide-down');
        }
    }

    // Add option to multiple choice question
    addOption(button) {
        const optionsList = button.previousElementSibling;
        const questionItem = button.closest('.question-item');
        const questionNumber = questionItem.querySelector('.question-number').textContent.replace('Question ', '');
        const radioName = `correct_q${questionNumber}_${Date.now()}`;
        const optionNumber = optionsList.children.length + 1;
        
        const optionDiv = Utils.createElement('div', { className: 'option-input' });
        optionDiv.style.cssText = 'display: flex; align-items: center; margin-bottom: 8px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 5px; background: #f8fafc;';
        optionDiv.innerHTML = `
            <input type="radio" name="${radioName}" value="" id="radio_${radioName}_${optionNumber}" 
                   style="margin-right: 8px;" onchange="this.value = this.nextElementSibling.value">
            <label for="radio_${radioName}_${optionNumber}" style="font-weight: 500; color: #38a169; margin-right: 8px; min-width: 20px;">○</label>
            <input type="text" placeholder="Enter option text" 
                   style="flex: 1; border: 1px solid #e2e8f0; border-radius: 3px; padding: 5px;" 
                   onchange="this.previousElementSibling.previousElementSibling.value = this.value; if(this.previousElementSibling.previousElementSibling.checked) this.style.background = '#f0fff4';"
                   onkeyup="this.previousElementSibling.previousElementSibling.value = this.value;">
            <span style="margin: 0 8px; color: #718096; font-size: 0.9em;">Correct?</span>
            <button type="button" onclick="this.parentElement.remove()" 
                    style="margin-left: 8px; padding: 4px 8px; background: #e53e3e; color: white; border: none; border-radius: 3px; cursor: pointer;">
                Remove
            </button>
        `;
        
        // Add event listener to radio button to highlight correct answer
        const radioButton = optionDiv.querySelector('input[type="radio"]');
        const textInput = optionDiv.querySelector('input[type="text"]');
        const label = optionDiv.querySelector('label');
        
        radioButton.addEventListener('change', function() {
            // Reset all options in this question
            const allOptions = questionItem.querySelectorAll('.option-input');
            allOptions.forEach(opt => {
                const optText = opt.querySelector('input[type="text"]');
                const optLabel = opt.querySelector('label');
                optText.style.background = '#fff';
                optLabel.textContent = '○';
                optLabel.style.color = '#718096';
            });
            
            // Highlight selected correct answer
            if (this.checked) {
                textInput.style.background = '#f0fff4';
                label.textContent = '●';
                label.style.color = '#38a169';
            }
        });
        
        optionsList.appendChild(optionDiv);
        Utils.addAnimation(optionDiv, 'slide-in');
        
        // Focus on the text input
        textInput.focus();
    }

    // Create new exam
    async createExam() {
        const form = document.getElementById('createExamForm');
        const formData = new FormData(form);
        const editId = form.getAttribute('data-edit-id');
        const isEditing = !!editId;
        
        try {
            // Get form data
            let examData = {
                title: formData.get('examTitle') || document.getElementById('examTitle').value,
                description: formData.get('examDescription') || document.getElementById('examDescription').value,
                duration_minutes: parseInt(formData.get('examDuration') || document.getElementById('examDuration').value),
                start_time: formData.get('examStartTime') || document.getElementById('examStartTime').value,
                end_time: formData.get('examEndTime') || document.getElementById('examEndTime').value,
                questions: []
            };

            // If editing, preserve existing data
            if (isEditing) {
                const exams = Utils.getLocalStorage('exams') || [];
                const existingExam = exams.find(e => e.id === parseInt(editId));
                if (existingExam) {
                    examData.id = existingExam.id;
                    examData.exam_code = existingExam.exam_code;
                    examData.created_by = existingExam.created_by;
                    examData.created_at = existingExam.created_at;
                }
            } else {
                examData.exam_code = Utils.generateRandomString(8);
                examData.created_by = authService.getCurrentUser().id;
            }

            // Get questions
            const questionItems = document.querySelectorAll('.question-item');
            questionItems.forEach((item, index) => {
                const questionText = item.querySelector('[name="question_text"]').value;
                const questionType = item.querySelector('[name="question_type"]').value;
                const sectionName = item.querySelector('[name="section_name"]').value;
                const marks = parseInt(item.querySelector('[name="marks"]').value);
                
                let options = null;
                let correctAnswer = '';

                if (questionType === 'multiple_choice') {
                    options = [];
                    const optionInputs = item.querySelectorAll('.option-input');
                    optionInputs.forEach(optionInput => {
                        const text = optionInput.querySelector('input[type="text"]').value;
                        const isCorrect = optionInput.querySelector('input[type="radio"]').checked;
                        if (text) {
                            options.push(text);
                            if (isCorrect) correctAnswer = text;
                        }
                    });
                } else if (questionType === 'true_false') {
                    options = ['True', 'False'];
                    const checkedRadio = item.querySelector('input[type="radio"]:checked');
                    correctAnswer = checkedRadio ? checkedRadio.value : '';
                } else if (questionType === 'short_answer') {
                    correctAnswer = item.querySelector('[name="correct_answer"]').value;
                }

                examData.questions.push({
                    question_text: questionText,
                    question_type: questionType,
                    section_name: sectionName,
                    marks: marks,
                    options: options,
                    correct_answer: correctAnswer,
                    question_order: index + 1
                });
            });

            // Calculate total marks
            examData.total_marks = examData.questions.reduce((sum, q) => sum + q.marks, 0);

            // Save or update exam
            let exams = Utils.getLocalStorage('exams') || [];
            
            if (isEditing) {
                // Update existing exam
                const examIndex = exams.findIndex(e => e.id === parseInt(editId));
                if (examIndex !== -1) {
                    examData.is_active = exams[examIndex].is_active;
                    examData.updated_at = new Date().toISOString();
                    exams[examIndex] = examData;
                    
                    Utils.showSuccess(`Exam "${examData.title}" updated successfully!`);
                    authService.auditLog('update_exam', { exam_id: examData.id, exam_title: examData.title });
                } else {
                    Utils.showError('Exam not found for update.');
                    return;
                }
            } else {
                // Create new exam
                examData.id = Math.max(...exams.map(e => e.id || 0), 0) + 1;
                examData.created_at = new Date().toISOString();
                examData.is_active = true;

                exams.push(examData);
                
                Utils.showSuccess(`Exam "${examData.title}" created successfully! Exam Code: ${examData.exam_code}`);
                authService.auditLog('create_exam', { exam_id: examData.id, exam_title: examData.title });
            }

            Utils.setLocalStorage('exams', exams);
            
            // Reset form
            form.reset();
            document.getElementById('questionsContainer').innerHTML = '';
            this.currentQuestionCount = 0;
            this.resetFormToCreateMode();
            this.loadExams();

        } catch (error) {
            console.error('Create exam error:', error);
            Utils.showError('Failed to create exam. Please try again.');
        }
    }

    // Load exams list
    loadExams() {
        const examsList = document.getElementById('examsList');
        const exams = Utils.getLocalStorage('exams') || [];
        
        if (exams.length === 0) {
            examsList.innerHTML = '<p>No exams created yet.</p>';
            return;
        }

        examsList.innerHTML = exams.map(exam => `
            <div class="exam-item">
                <div class="item-info">
                    <h4>${Utils.escapeHtml(exam.title)}</h4>
                    <p><strong>Code:</strong> ${exam.exam_code} | <strong>Duration:</strong> ${exam.duration_minutes} mins | <strong>Questions:</strong> ${exam.questions.length} | <strong>Total Marks:</strong> ${exam.total_marks}</p>
                    <p><strong>Start:</strong> ${Utils.formatDate(exam.start_time)} | <strong>End:</strong> ${Utils.formatDate(exam.end_time)}</p>
                    <p>${Utils.escapeHtml(exam.description || '')}</p>
                </div>
                <div class="item-actions">
                    <button class="action-btn view-btn" onclick="adminService.viewExamDetails(${exam.id})">View</button>
                    <button class="action-btn edit-btn" onclick="adminService.manageParticipants(${exam.id})">Participants</button>
                    <button class="action-btn delete-btn" onclick="adminService.deleteExam(${exam.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Load students list
    loadStudents() {
        const studentsList = document.getElementById('studentsList');
        const students = authService.getAllStudents();
        
        if (students.length === 0) {
            studentsList.innerHTML = '<p>No students registered yet.</p>';
            return;
        }

        studentsList.innerHTML = students.map(student => `
            <div class="student-item">
                <div class="item-info">
                    <h4>${Utils.escapeHtml(student.first_name)} ${Utils.escapeHtml(student.last_name)}</h4>
                    <p><strong>Email:</strong> ${Utils.escapeHtml(student.email)}</p>
                    <p><strong>Status:</strong> ${student.is_active ? 'Active' : 'Inactive'}</p>
                    <p><strong>Registered:</strong> ${Utils.formatDate(student.created_at || new Date().toISOString())}</p>
                </div>
                <div class="item-actions">
                    <button class="action-btn ${student.is_active ? 'delete-btn' : 'edit-btn'}" 
                            onclick="adminService.toggleStudentStatus(${student.id})">
                        ${student.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="action-btn delete-btn" onclick="adminService.deleteStudent(${student.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Load results
    loadResults() {
        const resultsList = document.getElementById('resultsList');
        const attempts = Utils.getLocalStorage('exam_attempts') || [];
        const exams = Utils.getLocalStorage('exams') || [];
        const users = Utils.getLocalStorage('users') || [];
        
        if (attempts.length === 0) {
            resultsList.innerHTML = '<p>No exam results yet.</p>';
            return;
        }

        // Group attempts by exam code
        const groupedResults = {};
        attempts.forEach(attempt => {
            const exam = exams.find(e => e.id === attempt.exam_id);
            if (exam && attempt.is_submitted) {
                const examCode = exam.exam_code || exam.title;
                if (!groupedResults[examCode]) {
                    groupedResults[examCode] = {
                        exam: exam,
                        attempts: []
                    };
                }
                groupedResults[examCode].attempts.push(attempt);
            }
        });

        let resultsHtml = '';
        
        Object.keys(groupedResults).forEach(examCode => {
            const group = groupedResults[examCode];
            const exam = group.exam;
            const examAttempts = group.attempts;
            
            resultsHtml += `
                <div class="exam-group">
                    <div class="exam-group-header" onclick="this.parentElement.querySelector('.exam-attempts').classList.toggle('hidden')">
                        <h3>${exam.title} (${examCode})</h3>
                        <span class="student-count">${examAttempts.length} student${examAttempts.length !== 1 ? 's' : ''}</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <div class="exam-attempts">
                        ${examAttempts.map(attempt => {
                            const student = users.find(u => u.id === attempt.user_id);
                            const percentage = Math.round((attempt.total_score / exam.total_marks) * 100);
                            const statusColor = percentage >= 60 ? '#38a169' : '#e53e3e';
                            
                            return `
                                <div class="result-item">
                                    <div class="item-info">
                                        <h4>${student ? `${student.first_name} ${student.last_name}` : 'Unknown Student'}</h4>
                                        <p><strong>Score:</strong> <span style="color: ${statusColor}; font-weight: bold;">${attempt.total_score}/${exam.total_marks} (${percentage}%)</span></p>
                                        <p><strong>Status:</strong> Completed</p>
                                        <p><strong>Completed:</strong> ${Utils.formatDate(attempt.end_time || attempt.start_time)}</p>
                                    </div>
                                    <div class="item-actions">
                                        <button class="action-btn view-btn" onclick="adminService.viewDetailedResults(${attempt.id})">View Analysis</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
        
        resultsList.innerHTML = resultsHtml;
    }

    // Show add student form
    showAddStudentForm() {
        const email = prompt('Enter student email:');
        const firstName = prompt('Enter first name:');
        const lastName = prompt('Enter last name:');
        
        if (email && firstName && lastName) {
            this.addStudent(email, firstName, lastName);
        }
    }

    // Add new student
    async addStudent(email, firstName, lastName) {
        if (!Utils.isValidEmail(email)) {
            Utils.showError('Please enter a valid email address.');
            return;
        }

        const result = await authService.registerStudent(email, firstName, lastName);
        
        if (result.success) {
            Utils.showSuccess(`Student ${firstName} ${lastName} added successfully with default password: test@1234`);
            this.loadStudents();
            authService.auditLog('add_student', { student_email: email });
        } else {
            Utils.showError(result.message);
        }
    }

    // Toggle student status
    toggleStudentStatus(studentId) {
        const students = authService.getAllStudents();
        const student = students.find(s => s.id === studentId);
        
        if (student) {
            const result = authService.updateStudentStatus(studentId, !student.is_active);
            if (result.success) {
                Utils.showSuccess(result.message);
                this.loadStudents();
                authService.auditLog('toggle_student_status', { student_id: studentId, new_status: !student.is_active });
            } else {
                Utils.showError(result.message);
            }
        }
    }

    // Delete student
    deleteStudent(studentId) {
        Utils.showConfirm(
            'Delete Student',
            'Are you sure you want to delete this student? This action cannot be undone.',
            () => {
                const result = authService.deleteStudent(studentId);
                if (result.success) {
                    Utils.showSuccess(result.message);
                    this.loadStudents();
                    authService.auditLog('delete_student', { student_id: studentId });
                } else {
                    Utils.showError(result.message);
                }
            }
        );
    }

    // Delete exam
    deleteExam(examId) {
        Utils.showConfirm(
            'Delete Exam',
            'Are you sure you want to delete this exam? This action cannot be undone.',
            () => {
                try {
                    const exams = Utils.getLocalStorage('exams') || [];
                    const filteredExams = exams.filter(e => e.id !== examId);
                    Utils.setLocalStorage('exams', filteredExams);
                    
                    Utils.showSuccess('Exam deleted successfully.');
                    this.loadExams();
                    authService.auditLog('delete_exam', { exam_id: examId });
                } catch (error) {
                    Utils.showError('Failed to delete exam.');
                }
            }
        );
    }

    // Manage exam participants
    manageParticipants(examId) {
        const exams = Utils.getLocalStorage('exams') || [];
        const exam = exams.find(e => e.id === examId);
        const students = authService.getAllStudents();
        const participants = Utils.getLocalStorage('exam_participants') || [];
        
        if (!exam) {
            Utils.showError('Exam not found.');
            return;
        }

        if (students.length === 0) {
            Utils.showError('No students available. Please add students first.');
            return;
        }

        // Create participants management interface
        const participantsHtml = `
            <div style="text-align: left;">
                <p style="margin-bottom: 15px;"><strong>Select students who can take this exam:</strong></p>
                <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 5px; padding: 10px;">
                    ${students.map(student => {
                        const isAllowed = participants.some(p => p.exam_id === examId && p.user_id === student.id && p.is_allowed);
                        return `
                            <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 5px; background: ${isAllowed ? '#f0fff4' : '#fff'};">
                                <input type="checkbox" id="student_${student.id}" ${isAllowed ? 'checked' : ''} 
                                       onchange="adminService.toggleParticipant(${examId}, ${student.id}, this.checked)">
                                <label for="student_${student.id}" style="margin-left: 10px; flex: 1; cursor: pointer;">
                                    <strong>${Utils.escapeHtml(student.first_name)} ${Utils.escapeHtml(student.last_name)}</strong><br>
                                    <small style="color: #666;">${Utils.escapeHtml(student.email)}</small>
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="margin-top: 15px; padding: 10px; background: #f8fafc; border-radius: 5px;">
                    <small><strong>Note:</strong> Only selected students will be able to access this exam using the exam code.</small>
                </div>
            </div>
        `;

        // Create modal with custom close handler
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalTitle.textContent = `Manage Participants - ${exam.title}`;
        modalMessage.innerHTML = participantsHtml;
        modalOk.textContent = 'Done';
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        modalOk.onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            modalOk.textContent = 'OK';
            
            // Show success message with participant count
            const currentParticipants = Utils.getLocalStorage('exam_participants') || [];
            const allowedCount = currentParticipants.filter(p => p.exam_id === examId && p.is_allowed).length;
            Utils.showSuccess(`Participants updated successfully! ${allowedCount} student(s) can now access this exam.`);
        };
    }

    // Toggle exam participant
    toggleParticipant(examId, userId, isAllowed) {
        try {
            let participants = Utils.getLocalStorage('exam_participants') || [];
            
            // Remove existing entry
            participants = participants.filter(p => !(p.exam_id === examId && p.user_id === userId));
            
            // Add new entry
            participants.push({
                id: participants.length + 1,
                exam_id: examId,
                user_id: userId,
                is_allowed: isAllowed
            });
            
            Utils.setLocalStorage('exam_participants', participants);
            authService.auditLog('toggle_participant', { exam_id: examId, user_id: userId, is_allowed: isAllowed });
        } catch (error) {
            console.error('Toggle participant error:', error);
        }
    }

    // View exam details
    viewExamDetails(examId) {
        const exams = Utils.getLocalStorage('exams') || [];
        const exam = exams.find(e => e.id === examId);
        
        if (!exam) {
            Utils.showError('Exam not found.');
            return;
        }

        const participants = Utils.getLocalStorage('exam_participants') || [];
        const allowedParticipants = participants.filter(p => p.exam_id === examId && p.is_allowed);
        const attempts = Utils.getLocalStorage('exam_attempts') || [];
        const examAttempts = attempts.filter(a => a.exam_id === examId);

        const questionsHtml = exam.questions.map((q, index) => {
            let optionsDisplay = '';
            if (q.options && q.question_type === 'multiple_choice') {
                optionsDisplay = q.options.map(option => 
                    `<li style="color: ${option === q.correct_answer ? '#38a169' : '#4a5568'}; font-weight: ${option === q.correct_answer ? 'bold' : 'normal'};">
                        ${Utils.escapeHtml(option)} ${option === q.correct_answer ? '✓ (Correct)' : ''}
                    </li>`
                ).join('');
                optionsDisplay = `<ul style="margin: 5px 0; padding-left: 20px;">${optionsDisplay}</ul>`;
            } else if (q.question_type === 'true_false') {
                optionsDisplay = `<ul style="margin: 5px 0; padding-left: 20px;">
                    <li style="color: ${q.correct_answer === 'True' ? '#38a169' : '#4a5568'}; font-weight: ${q.correct_answer === 'True' ? 'bold' : 'normal'};">
                        True ${q.correct_answer === 'True' ? '✓ (Correct)' : ''}
                    </li>
                    <li style="color: ${q.correct_answer === 'False' ? '#38a169' : '#4a5568'}; font-weight: ${q.correct_answer === 'False' ? 'bold' : 'normal'};">
                        False ${q.correct_answer === 'False' ? '✓ (Correct)' : ''}
                    </li>
                </ul>`;
            }

            return `
                <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong style="color: #2d3748;">Q${index + 1}:</strong>
                        <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">
                            ${q.marks} mark${q.marks > 1 ? 's' : ''}
                        </span>
                    </div>
                    <p style="margin: 8px 0; color: #2d3748; font-weight: 500;">${Utils.escapeHtml(q.question_text)}</p>
                    <div style="margin: 8px 0;">
                        <strong style="color: #4a5568;">Type:</strong> 
                        <span style="text-transform: capitalize;">${q.question_type.replace('_', ' ')}</span>
                        ${q.section_name ? `| <strong>Section:</strong> ${Utils.escapeHtml(q.section_name)}` : ''}
                    </div>
                    ${optionsDisplay}
                    ${q.question_type === 'short_answer' ? 
                        `<div style="margin: 8px 0;"><strong style="color: #38a169;">Correct Answer:</strong> ${Utils.escapeHtml(q.correct_answer)}</div>` : 
                        ''
                    }
                </div>
            `;
        }).join('');

        const detailsHtml = `
            <div style="text-align: left; max-height: 500px; overflow-y: auto;">
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div><strong>Exam Code:</strong> <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 4px;">${exam.exam_code}</span></div>
                        <div><strong>Duration:</strong> ${exam.duration_minutes} minutes</div>
                        <div><strong>Total Questions:</strong> ${exam.questions.length}</div>
                        <div><strong>Total Marks:</strong> ${exam.total_marks}</div>
                        <div><strong>Participants:</strong> ${allowedParticipants.length} student(s)</div>
                        <div><strong>Attempts:</strong> ${examAttempts.length} attempt(s)</div>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong>Available:</strong> ${Utils.formatDate(exam.start_time)} to ${Utils.formatDate(exam.end_time)}
                    </div>
                    ${exam.description ? `<div><strong>Description:</strong> ${Utils.escapeHtml(exam.description)}</div>` : ''}
                </div>
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button onclick="adminService.editExam(${examId})" style="background: #3182ce; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                        Edit Exam
                    </button>
                    <button onclick="adminService.manageParticipants(${examId})" style="background: #38a169; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                        Manage Participants
                    </button>
                </div>
                
                <h4 style="color: #2d3748; margin-bottom: 15px;">Questions:</h4>
                ${questionsHtml}
            </div>
        `;

        // Create modal with custom styling
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalTitle.textContent = `Exam Details - ${exam.title}`;
        modalMessage.innerHTML = detailsHtml;
        modalOk.textContent = 'Close';
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        modalOk.onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            modalOk.textContent = 'OK';
        };
    }

    // View detailed results
    viewDetailedResults(attemptId) {
        const attempts = Utils.getLocalStorage('exam_attempts') || [];
        const answers = Utils.getLocalStorage('student_answers') || [];
        const attempt = attempts.find(a => a.id === attemptId);
        
        if (!attempt) {
            Utils.showError('Exam attempt not found.');
            return;
        }

        const exams = Utils.getLocalStorage('exams') || [];
        const users = Utils.getLocalStorage('users') || [];
        const exam = exams.find(e => e.id === attempt.exam_id);
        const student = users.find(u => u.id === attempt.user_id);
        const studentAnswers = answers.filter(a => a.attempt_id === attemptId);
        
        // Calculate section-wise results
        const sections = {};
        let totalCorrect = 0;
        let totalQuestions = exam.questions.length;
        
        exam.questions.forEach((question, index) => {
            const sectionName = question.section_name || 'General';
            if (!sections[sectionName]) {
                sections[sectionName] = {
                    total_marks: 0,
                    scored_marks: 0,
                    total_questions: 0,
                    correct_answers: 0,
                    questions: []
                };
            }
            
            const studentAnswer = studentAnswers.find(a => a.question_id === question.id || a.question_index === index);
            const isCorrect = studentAnswer ? studentAnswer.is_correct : false;
            const marksAwarded = studentAnswer ? studentAnswer.marks_awarded : 0;
            
            sections[sectionName].total_marks += question.marks;
            sections[sectionName].scored_marks += marksAwarded;
            sections[sectionName].total_questions += 1;
            if (isCorrect) {
                sections[sectionName].correct_answers += 1;
                totalCorrect += 1;
            }
            
            sections[sectionName].questions.push({
                question,
                studentAnswer,
                index: index + 1,
                isCorrect,
                marksAwarded
            });
        });

        // Generate section-wise breakdown
        const sectionsHtml = Object.keys(sections).map(sectionName => {
            const section = sections[sectionName];
            const percentage = Math.round((section.scored_marks / section.total_marks) * 100);
            
            const questionsHtml = section.questions.map(q => `
                <div style="margin-bottom: 1.5rem; padding: 1rem; border-left: 4px solid ${q.isCorrect ? '#38a169' : '#e53e3e'}; background: ${q.isCorrect ? '#f0fff4' : '#fef5e7'}; border-radius: 8px;">
                    <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                        <span style="color: ${q.isCorrect ? '#38a169' : '#e53e3e'}; font-size: 1.2rem; font-weight: bold; margin-right: 0.5rem;">${q.isCorrect ? '✓' : '✗'}</span>
                        <h5 style="margin: 0; color: #2d3748; flex: 1;">Question ${q.index} (${q.question.marks} mark${q.question.marks > 1 ? 's' : ''})</h5>
                        <span style="color: ${q.isCorrect ? '#38a169' : '#e53e3e'}; font-weight: bold;">${q.marksAwarded}/${q.question.marks}</span>
                    </div>
                    <p style="margin-bottom: 0.75rem; color: #4a5568; font-weight: 500;">${Utils.escapeHtml(q.question.question_text)}</p>
                    <div style="background: white; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem;">
                        <p style="margin: 0;"><strong style="color: #2d3748;">Student Answer:</strong> <span style="color: ${q.isCorrect ? '#38a169' : '#e53e3e'}; font-weight: bold;">${q.studentAnswer ? Utils.escapeHtml(q.studentAnswer.answer_text) : 'No answer provided'}</span></p>
                    </div>
                    ${!q.isCorrect ? `
                        <div style="background: #e6fffa; padding: 0.75rem; border-radius: 4px; border: 1px solid #38a169;">
                            <p style="margin: 0;"><strong style="color: #2d3748;">Correct Answer:</strong> <span style="color: #38a169; font-weight: bold;">${Utils.escapeHtml(q.question.correct_answer)}</span></p>
                        </div>
                    ` : ''}
                </div>
            `).join('');
            
            return `
                <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="background: ${percentage >= 70 ? '#f0fff4' : percentage >= 50 ? '#fffbeb' : '#fef5e7'}; padding: 12px; border-bottom: 1px solid #e2e8f0;">
                        <h4 style="margin: 0; color: #2d3748;">${sectionName}</h4>
                        <div style="margin-top: 5px; font-size: 0.9em; color: #4a5568;">
                            Score: <strong>${section.scored_marks}/${section.total_marks}</strong> (${percentage}%) | 
                            Correct: <strong>${section.correct_answers}/${section.total_questions}</strong>
                        </div>
                        <div style="width: 100%; background: #e2e8f0; height: 6px; border-radius: 3px; margin-top: 8px;">
                            <div style="width: ${percentage}%; background: ${percentage >= 70 ? '#38a169' : percentage >= 50 ? '#f56500' : '#e53e3e'}; height: 100%; border-radius: 3px;"></div>
                        </div>
                    </div>
                    <div style="padding: 12px;">
                        ${questionsHtml}
                    </div>
                </div>
            `;
        }).join('');

        const overallPercentage = Math.round((attempt.total_score / exam.total_marks) * 100);
        const accuracyPercentage = Math.round((totalCorrect / totalQuestions) * 100);
        
        const detailsHtml = `
            <div style="text-align: left; max-height: 600px; overflow-y: auto;">
                <!-- Overall Summary -->
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #2d3748;">${student ? `${student.first_name} ${student.last_name}` : 'Student'} - ${exam.title}</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
                            <div style="font-size: 1.5em; font-weight: bold; color: ${overallPercentage >= 70 ? '#38a169' : overallPercentage >= 50 ? '#f56500' : '#e53e3e'};">
                                ${overallPercentage}%
                            </div>
                            <div style="font-size: 0.9em; color: #4a5568;">Overall Score</div>
                            <div style="font-size: 0.8em; color: #718096;">${attempt.total_score}/${exam.total_marks} marks</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
                            <div style="font-size: 1.5em; font-weight: bold; color: ${accuracyPercentage >= 70 ? '#38a169' : accuracyPercentage >= 50 ? '#f56500' : '#e53e3e'};">
                                ${accuracyPercentage}%
                            </div>
                            <div style="font-size: 0.9em; color: #4a5568;">Accuracy</div>
                            <div style="font-size: 0.8em; color: #718096;">${totalCorrect}/${totalQuestions} correct</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
                            <div style="font-size: 1.5em; font-weight: bold; color: ${attempt.warning_count === 0 ? '#38a169' : attempt.warning_count === 1 ? '#f56500' : '#e53e3e'};">
                                ${attempt.warning_count}/2
                            </div>
                            <div style="font-size: 0.9em; color: #4a5568;">Warnings</div>
                            <div style="font-size: 0.8em; color: #718096;">${attempt.auto_submitted ? 'Auto-submitted' : 'Completed'}</div>
                        </div>
                    </div>
                    <div style="font-size: 0.9em; color: #4a5568;">
                        <strong>Completed:</strong> ${Utils.formatDate(attempt.end_time || attempt.start_time)} | 
                        <strong>Status:</strong> ${attempt.is_submitted ? (attempt.auto_submitted ? 'Auto-Submitted' : 'Submitted') : 'In Progress'}
                    </div>
                </div>
                
                <!-- Section-wise Breakdown -->
                <h4 style="color: #2d3748; margin-bottom: 15px;">Section-wise Performance:</h4>
                ${sectionsHtml}
            </div>
        `;

        // Create modal with custom styling
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalTitle.textContent = 'Detailed Exam Results';
        modalMessage.innerHTML = detailsHtml;
        modalOk.textContent = 'Close';
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        modalOk.onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            modalOk.textContent = 'OK';
        };
    }

    // Edit exam functionality
    editExam(examId) {
        const exams = Utils.getLocalStorage('exams') || [];
        const exam = exams.find(e => e.id === examId);
        
        if (!exam) {
            Utils.showError('Exam not found.');
            return;
        }

        // Switch to create exam tab and populate form
        document.getElementById('createExamTab').click();
        
        // Populate form fields
        document.getElementById('examTitle').value = exam.title;
        document.getElementById('examDescription').value = exam.description || '';
        document.getElementById('examDuration').value = exam.duration_minutes;
        document.getElementById('examStartTime').value = exam.start_time ? new Date(exam.start_time).toISOString().slice(0, 16) : '';
        document.getElementById('examEndTime').value = exam.end_time ? new Date(exam.end_time).toISOString().slice(0, 16) : '';
        
        // Clear existing questions
        const questionsContainer = document.getElementById('questionsContainer');
        questionsContainer.innerHTML = '';
        this.currentQuestionCount = 0;
        
        // Add existing questions
        exam.questions.forEach((question, index) => {
            this.addQuestion();
            const questionItem = questionsContainer.lastElementChild;
            
            // Fill question details
            questionItem.querySelector('[name="question_text"]').value = question.question_text;
            questionItem.querySelector('[name="question_type"]').value = question.question_type;
            questionItem.querySelector('[name="section_name"]').value = question.section_name || '';
            questionItem.querySelector('[name="marks"]').value = question.marks;
            
            // Trigger question type change to show options
            this.handleQuestionTypeChange(questionItem.querySelector('[name="question_type"]'));
            
            // Fill options and correct answers
            if (question.question_type === 'multiple_choice' && question.options) {
                const optionsList = questionItem.querySelector('.options-list');
                optionsList.innerHTML = ''; // Clear default options
                
                question.options.forEach((option, optIndex) => {
                    this.addOption(questionItem.querySelector('.add-option-btn'));
                    const optionInput = optionsList.lastElementChild;
                    const textInput = optionInput.querySelector('input[type="text"]');
                    const radioInput = optionInput.querySelector('input[type="radio"]');
                    
                    textInput.value = option;
                    radioInput.value = option;
                    
                    if (option === question.correct_answer) {
                        radioInput.checked = true;
                        textInput.style.background = '#f0fff4';
                        optionInput.querySelector('label').textContent = '●';
                        optionInput.querySelector('label').style.color = '#38a169';
                    }
                });
            } else if (question.question_type === 'true_false') {
                const correctRadio = questionItem.querySelector(`input[type="radio"][value="${question.correct_answer}"]`);
                if (correctRadio) correctRadio.checked = true;
            } else if (question.question_type === 'short_answer') {
                questionItem.querySelector('[name="correct_answer"]').value = question.correct_answer;
            }
        });
        
        // Store exam ID for update
        document.getElementById('createExamForm').setAttribute('data-edit-id', examId);
        
        // Change form title and button text
        document.querySelector('#createExamContent h3').textContent = 'Edit Examination';
        document.querySelector('#createExamForm .submit-btn').textContent = 'Update Exam';
        
        Utils.showSuccess('Exam loaded for editing. Make your changes and click "Update Exam".');
    }

    // Reset form to create mode
    resetFormToCreateMode() {
        document.querySelector('#createExamContent h3').textContent = 'Create New Examination';
        document.querySelector('#createExamForm .submit-btn').textContent = 'Create Exam';
        document.getElementById('createExamForm').removeAttribute('data-edit-id');
    }
}

// Initialize admin service
const adminService = new AdminService();

// Make admin service available globally
window.adminService = adminService;