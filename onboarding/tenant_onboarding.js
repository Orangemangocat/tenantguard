// Track current step
let currentStep = 1;
let selectedDocuments = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set up checkbox listeners
    setupCheckboxListeners();
    
    // Load any saved progress from localStorage
    loadProgress();
});

// Setup checkbox listeners to track selections
function setupCheckboxListeners() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"][name="doc"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectedDocuments();
            saveProgress();
        });
    });
}

// Update selected documents array
function updateSelectedDocuments() {
    selectedDocuments = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"][name="doc"]:checked');
    checkboxes.forEach(checkbox => {
        const option = checkbox.closest('.document-option');
        const title = option.querySelector('.option-title').textContent;
        const value = checkbox.value;
        selectedDocuments.push({ value, title });
    });
}

// Navigate to next step
function nextStep(step) {
    // Validate current step before proceeding
    if (!validateStep(currentStep)) {
        return;
    }

    // Update selected documents if moving from step 2
    if (currentStep === 2) {
        updateSelectedDocuments();
        generateUploadSection();
    }

    // Hide current step
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('completed');

    // Show next step
    currentStep = step;
    document.getElementById(`step-${step}`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${step}"]`).classList.add('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Save progress
    saveProgress();
}

// Navigate to previous step
function prevStep(step) {
    // Hide current step
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('active');

    // Show previous step
    currentStep = step;
    document.getElementById(`step-${step}`).classList.add('active');
    document.querySelector(`.progress-step[data-step="${step}"]`).classList.add('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Validate current step
function validateStep(step) {
    if (step === 2) {
        // Check if at least one document is selected or "not sure" is checked
        const checkboxes = document.querySelectorAll('input[type="checkbox"][name="doc"]:checked');
        if (checkboxes.length === 0) {
            alert('Please select at least one document type, or select "Not Sure / Don\'t Remember" if you\'re uncertain.');
            return false;
        }
    }
    return true;
}

// Generate upload section based on selected documents
function generateUploadSection() {
    const uploadSection = document.getElementById('upload-section');
    
    if (selectedDocuments.length === 0) {
        uploadSection.innerHTML = `
            <div class="upload-placeholder">
                <p>No documents selected. You can go back and select documents, or continue to complete your onboarding.</p>
            </div>
        `;
        return;
    }

    let html = '';
    selectedDocuments.forEach((doc, index) => {
        html += `
            <div class="upload-item" data-doc-value="${doc.value}">
                <h4>${doc.title}</h4>
                <div class="file-input-wrapper">
                    <input type="file" 
                           id="file-${doc.value}" 
                           accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                           multiple
                           onchange="handleFileSelect(this, '${doc.value}')">
                </div>
                <div class="date-input">
                    <label for="date-${doc.value}">When did you receive this? (Optional)</label>
                    <input type="date" id="date-${doc.value}" onchange="saveProgress()">
                </div>
                <span class="skip-link" onclick="skipDocument('${doc.value}')">Skip - I don't have this document</span>
                <div class="file-list" id="files-${doc.value}"></div>
            </div>
        `;
    });

    uploadSection.innerHTML = html;
}

// Handle file selection
function handleFileSelect(input, docValue) {
    const fileList = document.getElementById(`files-${docValue}`);
    const files = input.files;
    
    if (files.length > 0) {
        let html = '<div style="margin-top: 12px; font-size: 14px; color: #48bb78;">';
        html += '<strong>Selected files:</strong><ul style="margin-top: 8px; padding-left: 20px;">';
        
        for (let i = 0; i < files.length; i++) {
            html += `<li>${files[i].name} (${formatFileSize(files[i].size)})</li>`;
        }
        
        html += '</ul></div>';
        fileList.innerHTML = html;
    }
    
    saveProgress();
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Skip document upload
function skipDocument(docValue) {
    const uploadItem = document.querySelector(`[data-doc-value="${docValue}"]`);
    uploadItem.style.opacity = '0.5';
    uploadItem.querySelector('.file-input-wrapper').innerHTML = 
        '<p style="color: #718096; font-size: 14px;">✓ Skipped - We\'ll obtain this document through other means</p>';
    
    saveProgress();
}

// Save progress to localStorage
function saveProgress() {
    const progress = {
        currentStep: currentStep,
        selectedDocuments: selectedDocuments,
        checkboxStates: {},
        additionalNotes: document.getElementById('additional-notes')?.value || ''
    };

    // Save checkbox states
    const checkboxes = document.querySelectorAll('input[type="checkbox"][name="doc"]');
    checkboxes.forEach(checkbox => {
        progress.checkboxStates[checkbox.value] = checkbox.checked;
    });

    // Save date inputs
    progress.dates = {};
    selectedDocuments.forEach(doc => {
        const dateInput = document.getElementById(`date-${doc.value}`);
        if (dateInput) {
            progress.dates[doc.value] = dateInput.value;
        }
    });

    localStorage.setItem('tenantOnboardingProgress', JSON.stringify(progress));
}

// Load progress from localStorage
function loadProgress() {
    const savedProgress = localStorage.getItem('tenantOnboardingProgress');
    if (!savedProgress) return;

    try {
        const progress = JSON.parse(savedProgress);

        // Restore checkbox states
        if (progress.checkboxStates) {
            Object.keys(progress.checkboxStates).forEach(value => {
                const checkbox = document.querySelector(`input[type="checkbox"][value="${value}"]`);
                if (checkbox) {
                    checkbox.checked = progress.checkboxStates[value];
                }
            });
        }

        // Restore additional notes
        if (progress.additionalNotes) {
            const notesField = document.getElementById('additional-notes');
            if (notesField) {
                notesField.value = progress.additionalNotes;
            }
        }

        // Update selected documents
        updateSelectedDocuments();
    } catch (e) {
        console.error('Error loading progress:', e);
    }
}

// Clear progress (for testing or reset)
function clearProgress() {
    localStorage.removeItem('tenantOnboardingProgress');
    location.reload();
}

// Go to dashboard (placeholder)
function goToDashboard() {
    // Clear the saved progress
    localStorage.removeItem('tenantOnboardingProgress');
    
    // In a real implementation, this would redirect to the admin dashboard
    // For now, show a confirmation
    alert('Onboarding complete! In a real implementation, you would be redirected to your dashboard.');
    
    // Simulate redirect (replace with actual URL)
    // window.location.href = '/admin-dashboard';
    
    // For demo purposes, reload to step 1
    location.reload();
}

// Form submission handler (for actual implementation)
function submitOnboarding() {
    const formData = new FormData();
    
    // Add selected documents
    formData.append('selectedDocuments', JSON.stringify(selectedDocuments));
    
    // Add uploaded files
    selectedDocuments.forEach(doc => {
        const fileInput = document.getElementById(`file-${doc.value}`);
        if (fileInput && fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append(`files_${doc.value}`, fileInput.files[i]);
            }
        }
        
        // Add dates
        const dateInput = document.getElementById(`date-${doc.value}`);
        if (dateInput && dateInput.value) {
            formData.append(`date_${doc.value}`, dateInput.value);
        }
    });
    
    // Add additional notes
    const notes = document.getElementById('additional-notes').value;
    if (notes) {
        formData.append('additionalNotes', notes);
    }
    
    // In a real implementation, send to server
    // fetch('/api/onboarding/submit', {
    //     method: 'POST',
    //     body: formData
    // })
    // .then(response => response.json())
    // .then(data => {
    //     console.log('Success:', data);
    //     goToDashboard();
    // })
    // .catch(error => {
    //     console.error('Error:', error);
    //     alert('There was an error submitting your information. Please try again.');
    // });
    
    return formData;
}

// Export functions for external use
window.nextStep = nextStep;
window.prevStep = prevStep;
window.goToDashboard = goToDashboard;
window.handleFileSelect = handleFileSelect;
window.skipDocument = skipDocument;
window.clearProgress = clearProgress;
window.submitOnboarding = submitOnboarding;
