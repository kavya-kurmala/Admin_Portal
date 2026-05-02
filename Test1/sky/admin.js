const API_URL = "http://127.0.0.1:5000/api";

const captchas = { login:'', signup:'', forgot:'' };

function generateCaptcha(type) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    captchas[type] = code;
    document.getElementById(type + 'CaptchaText').textContent = code;
}

generateCaptcha('login');
generateCaptcha('signup');
generateCaptcha('forgot');

// ===== PAGE NAVIGATION =====
function showPage(pageId) {
    document.querySelectorAll('.form-page').forEach(p => p.classList.remove('active'));
    setTimeout(() => document.getElementById(pageId).classList.add('active'), 50);
    document.querySelectorAll('.error-msg').forEach(e => e.classList.remove('show'));
    document.querySelectorAll('input').forEach(i => i.classList.remove('error'));
}

function togglePass(inputId, btn) {
    const input = document.getElementById(inputId);
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.innerHTML = isPass
        ? '<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}

// ===== HELPERS =====
function showError(id, msg) {
    const el = document.getElementById(id);
    if (msg) el.querySelector('span').textContent = msg;
    el.classList.add('show');
}

function clearAllErrors(formId) {
    document.querySelectorAll('#' + formId + ' .error-msg').forEach(e => e.classList.remove('show'));
    document.querySelectorAll('#' + formId + ' input').forEach(i => i.classList.remove('error'));
}

function shakeForm(formId) {
    const form = document.getElementById(formId);
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 400);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showToast(msg) {
    document.getElementById('toastMsg').textContent = msg;
    document.getElementById('toast').classList.add('show');
    setTimeout(() => document.getElementById('toast').classList.remove('show'), 3000);
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function checkStrength(val) {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const labels = ['', 'Weak', 'Medium', 'Strong', 'Very Strong'];
    const classes = ['', 'weak', 'medium', 'strong', 'very-strong'];

    for (let i = 1; i <= 4; i++) {
        const bar = document.getElementById('str' + i);
        bar.className = 'strength-bar';
        if (i <= score) bar.classList.add(classes[score]);
    }

    document.getElementById('strengthLabel').textContent = val.length > 0 ? labels[score] : '';
}

// ===== SHOW DASHBOARD =====
function showDashboard(email) {
    document.getElementById('authWrapper').style.display = 'none';
    document.getElementById('dashboardWrapper').classList.add('active');
    document.body.style.alignItems = 'stretch';

    const name = email.split('@')[0];
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);

    document.getElementById('dashName').textContent = displayName;
    document.getElementById('dashAvatar').textContent = displayName.substring(0, 2).toUpperCase();

    if (window.innerWidth <= 768) {
        document.getElementById('menuToggle').style.display = 'flex';
    }
}

function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("adminEmail");

    document.getElementById('dashboardWrapper').classList.remove('active');
    document.getElementById('authWrapper').style.display = 'flex';
    document.body.style.alignItems = '';
    showToast('Signed out successfully');
    showPage('loginPage');
}

// ===== NAV ITEMS =====
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', function() {
        const page = this.getAttribute('data-page');

        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');

        document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));

        if (page === 'dashboard') {
            document.getElementById('dashboardSection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'Dashboard';
        } else if (page === 'learner') {
            document.getElementById('learnerSection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'Learner Management';
        } else if (page === 'verifier') {
            document.getElementById('verifierSection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'Verifier Management';
        } else if (page === 'collaborator') {
            document.getElementById('collaboratorSection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'Collaborator Management';
        } else if (page === 'opportunity') {
            document.getElementById('opportunitySection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'Opportunity Management';
            loadOpportunities();
        } else if (page === 'reports') {
            document.getElementById('reportsSection').classList.add('active');
            document.getElementById('pageTitle').textContent = 'Reports and Analytics';
        }
    });
});

// ===== TABS =====
function changeChartPeriod(period) {
    document.querySelectorAll('.tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === period) {
            btn.classList.add('active');
        }
    });

    const chartData = {
        daily: 'M0,120 Q50,110 100,90 T200,70 T300,50 T400,40',
        weekly: 'M0,110 Q50,95 100,85 T200,65 T300,45 T400,35',
        monthly: 'M0,100 Q50,85 100,75 T200,55 T300,40 T400,30',
        quarterly: 'M0,90 Q50,75 100,65 T200,50 T300,35 T400,25',
        yearly: 'M0,80 Q50,65 100,55 T200,40 T300,30 T400,20'
    };

    const linePath = document.getElementById('linePath');
    const lineArea = document.getElementById('lineArea');

    const path = chartData[period];
    linePath.setAttribute('d', path);
    lineArea.setAttribute('d', path + ' L400,150 L0,150 Z');
}

// ===== NOTIFICATIONS =====
function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.classList.toggle('active');
}

function markAllRead() {
    document.querySelectorAll('.notif-item.unread').forEach(item => {
        item.classList.remove('unread');
    });
    showToast('All notifications marked as read');
}

document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('notificationDropdown');
    const btn = document.getElementById('notifBtn');

    if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// ===== THEME TOGGLE =====
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);

    const icon = document.getElementById('themeIcon');

    if (newTheme === 'dark') {
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    } else {
        icon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
    }
}

// ===== SEARCH =====
function openSearch() {
    document.getElementById('searchContainer').classList.add('active');
    document.getElementById('searchInput').focus();
}

function closeSearch() {
    document.getElementById('searchContainer').classList.remove('active');
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSearch();
        closeCourseModal();
        closeOpportunityModal();
        closeOpportunityDetailsModal();
        closeCollaboratorCoursesModal();
        closeQuickAddModal();
        closeBulkUploadModal();
        closeQuickAddVerifierModal();
        closeBulkUploadVerifierModal();
        closeVerifierDetailsModal();
    }
});

document.getElementById('searchContainer').addEventListener('click', function(e) {
    if (e.target === this) {
        closeSearch();
    }
});

// ===== COURSE MODAL =====
function openCourseDetails(courseName, stats) {
    document.getElementById('modalCourseTitle').textContent = courseName;
    document.getElementById('modalEnrolled').textContent = stats.enrolled;
    document.getElementById('modalCompleted').textContent = stats.completed;
    document.getElementById('modalInProgress').textContent = stats.inProgress;
    document.getElementById('modalHalfDone').textContent = stats.halfDone;
    document.getElementById('courseModal').classList.add('active');
}

function closeCourseModal() {
    document.getElementById('courseModal').classList.remove('active');
}

document.getElementById('courseModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeCourseModal();
    }
});

// ===== OPPORTUNITY DETAILS MODAL =====
function openOpportunityDetails(title, details) {
    document.getElementById('opportunityDetailTitle').textContent = title;
    document.getElementById('opportunityDetailDuration').textContent = details.duration;
    document.getElementById('opportunityDetailStartDate').textContent = details.startDate;
    document.getElementById('opportunityDetailApplicants').textContent = details.applicants;
    document.getElementById('opportunityDetailDescription').textContent = details.description;
    document.getElementById('opportunityDetailFuture').textContent = details.futureOpportunities;
    document.getElementById('opportunityDetailPrereqs').textContent = details.prerequisites;

    const skillsContainer = document.getElementById('opportunityDetailSkills');
    skillsContainer.innerHTML = '';

    details.skills.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.textContent = skill;
        skillsContainer.appendChild(tag);
    });

    document.getElementById('opportunityDetailsModal').classList.add('active');
}

function closeOpportunityDetailsModal() {
    document.getElementById('opportunityDetailsModal').classList.remove('active');
}

function applyToOpportunity() {
    showToast('Application submitted successfully!');
    closeOpportunityDetailsModal();
}

document.getElementById('opportunityDetailsModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeOpportunityDetailsModal();
    }
});

// ===== COLLABORATOR COURSES MODAL =====
function openCollaboratorCourses(name, role) {
    document.getElementById('collaboratorName').textContent = name + "'s Submitted Courses";
    document.getElementById('collaboratorRole').textContent = 'Role: ' + role;
    document.getElementById('collaboratorCoursesModal').classList.add('active');
}

function closeCollaboratorCoursesModal() {
    document.getElementById('collaboratorCoursesModal').classList.remove('active');
}

function approveCourse(courseName) {
    showToast(courseName + ' has been approved!');
}

function rejectCourse(courseName) {
    showToast(courseName + ' has been rejected.');
}

function viewCourseDetails(courseName) {
    showToast('Viewing details for ' + courseName);
}

document.getElementById('collaboratorCoursesModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeCollaboratorCoursesModal();
    }
});

// ===== OPPORTUNITY MODAL =====
let editingOpportunityId = null;

function openOpportunityModal() {
    document.getElementById('opportunityModal').classList.add('active');
}

function closeOpportunityModal() {
    document.getElementById('opportunityModal').classList.remove('active');

    if (!editingOpportunityId) {
        document.getElementById('opportunityForm').reset();
    }
}

document.getElementById('opportunityModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeOpportunityModal();
    }
});

// ===== OPPORTUNITY FORM SUBMIT =====
document.getElementById('opportunityForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
        showToast("Please login first");
        return;
    }

    const name = document.getElementById('oppName').value.trim();
    const duration = document.getElementById('oppDuration').value.trim();
    const start_date = document.getElementById('oppStartDate').value;
    const description = document.getElementById('oppDescription').value.trim();
    const skills = document.getElementById('oppSkills').value.trim();
    const category = document.getElementById('oppCategory').value;
    const future_opportunities = document.getElementById('oppFuture').value.trim();
    const max_applicants = document.getElementById('oppMaxApplicants').value.trim();

    if (!name || !duration || !start_date || !description || !skills || !category || !future_opportunities) {
        showToast('Please fill all required fields');
        return;
    }

    const payload = {
        name,
        duration,
        start_date,
        description,
        skills,
        category,
        future_opportunities,
        max_applicants: max_applicants ? parseInt(max_applicants) : null
    };

    try {
        const url = editingOpportunityId
            ? `${API_URL}/opportunities/${editingOpportunityId}`
            : `${API_URL}/opportunities`;

        const method = editingOpportunityId ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Failed to save opportunity");
            return;
        }

        showToast(editingOpportunityId ? "Opportunity updated successfully!" : "Opportunity created successfully!");

        editingOpportunityId = null;
        closeOpportunityModal();
        this.reset();
        loadOpportunities();

    } catch (error) {
        showToast("Backend not connected. Please run Flask server.");
    }
});

// ===== LOAD OPPORTUNITIES FROM BACKEND =====
async function loadOpportunities() {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/opportunities`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Unable to load opportunities");
            return;
        }

        renderOpportunities(data);

    } catch (error) {
        showToast("Could not load opportunities");
    }
}

function renderOpportunities(opportunities) {
    const grid = document.querySelector('.opportunities-grid');

    if (!grid) return;

    grid.innerHTML = "";

    if (opportunities.length === 0) {
        grid.innerHTML = `
            <div style="padding: 20px; text-align: center; width: 100%;">
                No opportunities created yet.
            </div>
        `;
        return;
    }

    opportunities.forEach(op => {
        const skillsArray = op.skills
            ? op.skills.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        const card = document.createElement('div');
        card.className = 'opportunity-card';

        card.innerHTML = `
            <div class="opportunity-card-header">
                <h5>${escapeHtml(op.name)}</h5>
                <div class="opportunity-meta">
                    <span>${escapeHtml(op.duration)}</span>
                    <span>${escapeHtml(op.start_date)}</span>
                </div>
            </div>

            <p class="opportunity-description">${escapeHtml(op.description)}</p>

            <div class="opportunity-skills">
                <div class="opportunity-skills-label">Skills You'll Gain</div>
                <div class="skills-tags">
                    ${skillsArray.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
                </div>
            </div>

            <div class="opportunity-footer">
                <span class="applicants-count">
                    ${op.max_applicants ? escapeHtml(op.max_applicants + " max applicants") : "No limit"}
                </span>

                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button class="view-course-btn" onclick="viewOpportunity(${op.id})">View Details</button>
                    <button class="view-course-btn" onclick="editOpportunity(${op.id})">Edit</button>
                    <button class="view-course-btn" onclick="deleteOpportunity(${op.id})">Delete</button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

async function viewOpportunity(id) {
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${API_URL}/opportunities/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const op = await res.json();

        if (!res.ok) {
            showToast(op.error || "Opportunity not found");
            return;
        }

        openOpportunityDetails(op.name, {
            duration: op.duration,
            startDate: op.start_date,
            description: op.description,
            skills: op.skills ? op.skills.split(',').map(s => s.trim()) : [],
            applicants: op.max_applicants || 0,
            futureOpportunities: op.future_opportunities,
            prerequisites: op.category
        });

    } catch (error) {
        showToast("Could not open opportunity details");
    }
}

async function editOpportunity(id) {
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${API_URL}/opportunities/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const op = await res.json();

        if (!res.ok) {
            showToast(op.error || "Opportunity not found");
            return;
        }

        editingOpportunityId = id;

        document.getElementById('oppName').value = op.name;
        document.getElementById('oppDuration').value = op.duration;
        document.getElementById('oppStartDate').value = op.start_date;
        document.getElementById('oppDescription').value = op.description;
        document.getElementById('oppSkills').value = op.skills;
        document.getElementById('oppCategory').value = op.category;
        document.getElementById('oppFuture').value = op.future_opportunities;
        document.getElementById('oppMaxApplicants').value = op.max_applicants || "";

        openOpportunityModal();

    } catch (error) {
        showToast("Could not edit opportunity");
    }
}

async function deleteOpportunity(id) {
    const confirmDelete = confirm("Are you sure you want to delete this opportunity?");

    if (!confirmDelete) return;

    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${API_URL}/opportunities/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Delete failed");
            return;
        }

        showToast("Opportunity deleted successfully");
        loadOpportunities();

    } catch (error) {
        showToast("Could not delete opportunity");
    }
}
// ===== QUICK ADD STUDENT MODAL =====
function openQuickAddModal() {
    document.getElementById('quickAddModal').classList.add('active');
}

function closeQuickAddModal() {
    document.getElementById('quickAddModal').classList.remove('active');
}

document.getElementById('quickAddModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeQuickAddModal();
    }
});

document.getElementById('quickAddForm').addEventListener('submit', function(e) {
    e.preventDefault();
    showToast('Student added successfully! Email invitation sent.');
    closeQuickAddModal();
    this.reset();
});

// ===== BULK UPLOAD MODAL =====
function openBulkUploadModal() {
    document.getElementById('bulkUploadModal').classList.add('active');
}

function closeBulkUploadModal() {
    document.getElementById('bulkUploadModal').classList.remove('active');
}

document.getElementById('bulkUploadModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeBulkUploadModal();
    }
});

document.getElementById('bulkUploadForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const fileInput = document.getElementById('csvFileInput');

    if (fileInput.files.length === 0) {
        showToast('Please select a CSV file');
        return;
    }

    showToast('Students uploaded successfully! Email invitations sent.');
    closeBulkUploadModal();
    this.reset();
    document.getElementById('fileName').textContent = '';
});

function handleFileSelect(event) {
    const file = event.target.files[0];

    if (file) {
        document.getElementById('fileName').textContent = '✓ Selected: ' + file.name;
    }
}

function downloadSampleCSV() {
    const csvContent = 'First Name,Last Name,Email\nJohn,Doe,john.doe@example.com\nJane,Smith,jane.smith@example.com';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_students.csv';
    a.click();

    window.URL.revokeObjectURL(url);
}

// ===== QUICK ADD VERIFIER MODAL =====
function openQuickAddVerifierModal() {
    document.getElementById('quickAddVerifierModal').classList.add('active');
}

function closeQuickAddVerifierModal() {
    document.getElementById('quickAddVerifierModal').classList.remove('active');
}

document.getElementById('quickAddVerifierModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeQuickAddVerifierModal();
    }
});

document.getElementById('quickAddVerifierForm').addEventListener('submit', function(e) {
    e.preventDefault();
    showToast('Verifier added successfully! Email invitation sent.');
    closeQuickAddVerifierModal();
    this.reset();
});

// ===== BULK UPLOAD VERIFIER MODAL =====
function openBulkUploadVerifierModal() {
    document.getElementById('bulkUploadVerifierModal').classList.add('active');
}

function closeBulkUploadVerifierModal() {
    document.getElementById('bulkUploadVerifierModal').classList.remove('active');
}

document.getElementById('bulkUploadVerifierModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeBulkUploadVerifierModal();
    }
});

document.getElementById('bulkUploadVerifierForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const fileInput = document.getElementById('csvVerifierFileInput');

    if (fileInput.files.length === 0) {
        showToast('Please select a CSV file');
        return;
    }

    showToast('Verifiers uploaded successfully! Email invitations sent.');
    closeBulkUploadVerifierModal();
    this.reset();
    document.getElementById('verifierFileName').textContent = '';
});

function handleVerifierFileSelect(event) {
    const file = event.target.files[0];

    if (file) {
        document.getElementById('verifierFileName').textContent = '✓ Selected: ' + file.name;
    }
}

function downloadSampleVerifierCSV() {
    const csvContent = 'First Name,Last Name,Email,Subject\nDr. John,Doe,john.doe@qf.edu.qa,Mathematics\nProf. Jane,Smith,jane.smith@qf.edu.qa,Physics';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_verifiers.csv';
    a.click();

    window.URL.revokeObjectURL(url);
}

// ===== VERIFIER DETAILS MODAL =====
function openVerifierDetails(name, stats) {
    document.getElementById('verifierName').textContent = name;
    document.getElementById('verifierTotalStudents').textContent = stats.totalStudents;
    document.getElementById('verifierCertified').textContent = stats.certified;
    document.getElementById('verifierInProgress').textContent = stats.inProgress;

    const container = document.getElementById('subjectsContainer');
    container.innerHTML = '';

    stats.subjects.forEach(subject => {
        const div = document.createElement('div');
        div.className = 'subject-item';

        div.innerHTML = `
            <span class="subject-name">${subject.name}</span>
            <span class="subject-students">${subject.students} students</span>
        `;

        container.appendChild(div);
    });

    document.getElementById('verifierDetailsModal').classList.add('active');
}

function closeVerifierDetailsModal() {
    document.getElementById('verifierDetailsModal').classList.remove('active');
}

document.getElementById('verifierDetailsModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeVerifierDetailsModal();
    }
});

// ===== STUDENT FILTERS =====
function filterStudents() {
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;

    const rows = document.querySelectorAll('#studentsTableBody tr');

    rows.forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        let showRow = true;

        if (statusFilter !== 'all' && rowStatus !== statusFilter) {
            showRow = false;
        }

        row.style.display = showRow ? '' : 'none';
    });
}

// ===== VERIFIER FILTERS =====
function filterVerifiers() {
    const statusFilter = document.getElementById('verifierStatusFilter').value;
    const dateFrom = document.getElementById('verifierDateFrom').value;
    const dateTo = document.getElementById('verifierDateTo').value;

    const rows = document.querySelectorAll('#verifiersTableBody tr');

    rows.forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        let showRow = true;

        if (statusFilter !== 'all' && rowStatus !== statusFilter) {
            showRow = false;
        }

        row.style.display = showRow ? '' : 'none';
    });
}

// ===== LOGIN =====
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearAllErrors('loginForm');

    let valid = true;

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const captchaInput = document.getElementById('loginCaptchaInput').value.trim();
    const rememberMe = document.getElementById('rememberMe')?.checked || false;

    if (!email || !isValidEmail(email)) {
        showError('loginEmailErr');
        document.getElementById('loginEmail').classList.add('error');
        valid = false;
    }

    if (!password) {
        showError('loginPasswordErr', 'Please enter your password');
        document.getElementById('loginPassword').classList.add('error');
        valid = false;
    }

    if (!captchaInput) {
        showError('loginCaptchaErr', 'Please enter the captcha code');
        valid = false;
    } else if (captchaInput !== captchas.login) {
        showError('loginCaptchaErr', 'Captcha does not match. Please try again.');
        valid = false;
        generateCaptcha('login');
    }

    if (!valid) {
        shakeForm('loginForm');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password,
                remember_me: rememberMe
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Invalid email or password");
            generateCaptcha('login');
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("adminEmail", data.admin.email);

        showToast("Login successful! Redirecting...");
        generateCaptcha('login');

        setTimeout(() => {
            showDashboard(data.admin.email);
            loadOpportunities();
        }, 800);

    } catch (error) {
        showToast("Backend not connected. Please run Flask server.");
    }
});

// ===== SIGNUP =====
document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearAllErrors('signupForm');

    let valid = true;

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirmPassword = document.getElementById('signupConfirmPassword').value.trim();
    const captchaInput = document.getElementById('signupCaptchaInput').value.trim();

    if (!name) {
        showError('signupNameErr');
        document.getElementById('signupName').classList.add('error');
        valid = false;
    }

    if (!email || !isValidEmail(email)) {
        showError('signupEmailErr');
        document.getElementById('signupEmail').classList.add('error');
        valid = false;
    }

    if (!password || password.length < 8) {
        showError('signupPasswordErr');
        document.getElementById('signupPassword').classList.add('error');
        valid = false;
    }

    if (!confirmPassword || password !== confirmPassword) {
        showError('signupConfirmPasswordErr');
        document.getElementById('signupConfirmPassword').classList.add('error');
        valid = false;
    }

    if (!captchaInput) {
        showError('signupCaptchaErr', 'Please enter the captcha code');
        valid = false;
    } else if (captchaInput !== captchas.signup) {
        showError('signupCaptchaErr', 'Captcha does not match.');
        valid = false;
        generateCaptcha('signup');
    }

    if (!valid) {
        shakeForm('signupForm');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                full_name: name,
                email,
                password,
                confirm_password: confirmPassword
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Signup failed");
            return;
        }

        showToast("Account created successfully!");
        generateCaptcha('signup');
        this.reset();
        checkStrength('');

        setTimeout(() => showPage('loginPage'), 1200);

    } catch (error) {
        showToast("Backend not connected. Please run Flask server.");
    }
});

// ===== FORGOT PASSWORD =====
document.getElementById('forgotForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearAllErrors('forgotForm');

    let valid = true;

    const email = document.getElementById('forgotEmail').value.trim();
    const captchaInput = document.getElementById('forgotCaptchaInput').value.trim();

    if (!email || !isValidEmail(email)) {
        showError('forgotEmailErr');
        document.getElementById('forgotEmail').classList.add('error');
        valid = false;
    }

    if (!captchaInput) {
        showError('forgotCaptchaErr', 'Please enter the captcha code');
        valid = false;
    } else if (captchaInput !== captchas.forgot) {
        showError('forgotCaptchaErr', 'Captcha does not match.');
        valid = false;
        generateCaptcha('forgot');
    }

    if (!valid) {
        shakeForm('forgotForm');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        showToast(data.message || "If the email exists, reset link has been generated");
        generateCaptcha('forgot');
        this.reset();

    } catch (error) {
        showToast("Backend not connected. Please run Flask server.");
    }
});

// ===== CLEAR ERRORS ON INPUT =====
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() {
        this.classList.remove('error');

        const err = this.closest('.form-group')?.querySelector('.error-msg');

        if (err) err.classList.remove('show');
    });
});

// ===== RESPONSIVE SIDEBAR =====
window.addEventListener('resize', () => {
    const toggle = document.getElementById('menuToggle');

    if (toggle) {
        toggle.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
    }
});

// ===== AUTO LOGIN CHECK =====
window.addEventListener("load", function() {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("adminEmail");

    if (token && email) {
        showDashboard(email);
        loadOpportunities();
    }
});