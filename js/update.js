// Variables to store data
let phoneData = [];
let recordToDelete = null;
const STORAGE_KEY = 'phoneDirectoryData';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        // Redirect to login page if not logged in
        window.location.href = 'login.html';
        return;
    }
    
    // Add logout button
    const headerElement = document.querySelector('header');
    const logoutButton = document.createElement('button');
    logoutButton.id = 'logoutBtn';
    logoutButton.className = 'logout-btn';
    logoutButton.textContent = 'تسجيل الخروج';
    headerElement.appendChild(logoutButton);
    
    // Set up logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    });
    
    // Load phone data
    fetchPhoneData();
    
    // Set up event listeners
    document.getElementById('addRecordBtn').addEventListener('click', showAddRecordModal);
    document.getElementById('importExcelBtn').addEventListener('click', showImportExcelModal);
    document.getElementById('saveChangesBtn').addEventListener('click', saveChanges);
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
    
    // Modal close buttons
    document.querySelectorAll('.close-modal, .cancel-btn').forEach(element => {
        element.addEventListener('click', closeAllModals);
    });
    
    // Form submissions
    document.getElementById('addRecordForm').addEventListener('submit', handleAddRecord);
    document.getElementById('editRecordForm').addEventListener('submit', handleEditRecord);
    document.getElementById('importExcelForm').addEventListener('submit', handleImportExcel);
    
    // Delete confirmation
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeAllModals);
    
    // Feedback link
    document.getElementById('feedbackLink').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'mailto:hamoud.2218@cpa.gov.om';
    });
});

// Fetch phone data from localStorage or JSON file
async function fetchPhoneData() {
    try {
        // First try to get data from localStorage
        const storedData = localStorage.getItem(STORAGE_KEY);
        
        if (storedData) {
            // Use data from localStorage if available
            phoneData = JSON.parse(storedData);
            renderTable();
            console.log('Data loaded from localStorage');
        } else {
            // Fall back to JSON file if no localStorage data
            const response = await fetch('data/phone_data.json');
            phoneData = await response.json();
            renderTable();
            console.log('Data loaded from JSON file');
            
            // Save initial data to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(phoneData));
        }
    } catch (error) {
        console.error('Error loading phone data:', error);
        alert('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.');
    }
}

// Render the data table
function renderTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    // Flatten the data structure for the table
    const flatData = [];
    phoneData.forEach(company => {
        company.employees.forEach(employee => {
            flatData.push({
                company: company.company,
                employee: employee.name,
                phone: employee.phone
            });
        });
    });
    
    // Create table rows
    flatData.forEach((record, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${record.company}</td>
            <td>${record.employee || 'غير محدد'}</td>
            <td>${record.phone}</td>
            <td class="action-cell">
                <button class="edit-btn" data-index="${index}">تعديل</button>
                <button class="delete-btn" data-index="${index}">حذف</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            showEditRecordModal(flatData[index], index);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            showDeleteConfirmation(flatData[index], index);
        });
    });
}

// Show add record modal
function showAddRecordModal() {
    document.getElementById('addRecordModal').style.display = 'block';
    document.getElementById('addRecordForm').reset();
}

// Show edit record modal
function showEditRecordModal(record, index) {
    const modal = document.getElementById('editRecordModal');
    document.getElementById('editRecordId').value = index;
    document.getElementById('editCompanyName').value = record.company;
    document.getElementById('editEmployeeName').value = record.employee || '';
    document.getElementById('editPhoneNumber').value = record.phone;
    
    modal.style.display = 'block';
}

// Show import Excel modal
function showImportExcelModal() {
    document.getElementById('importExcelModal').style.display = 'block';
    document.getElementById('importExcelForm').reset();
}

// Show delete confirmation
function showDeleteConfirmation(record, index) {
    recordToDelete = { record, index };
    document.getElementById('confirmationModal').style.display = 'block';
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Handle add record form submission
function handleAddRecord(e) {
    e.preventDefault();
    
    const companyName = document.getElementById('companyName').value.trim();
    const employeeName = document.getElementById('employeeName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    
    // Find if company already exists
    let companyIndex = phoneData.findIndex(company => company.company === companyName);
    
    if (companyIndex === -1) {
        // Create new company
        phoneData.push({
            company: companyName,
            employees: [{
                name: employeeName,
                phone: phoneNumber
            }]
        });
    } else {
        // Add employee to existing company
        phoneData[companyIndex].employees.push({
            name: employeeName,
            phone: phoneNumber
        });
    }
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Update table and close modal
    renderTable();
    closeAllModals();
    
    // Show success message
    alert('تم إضافة السجل بنجاح وحفظه بشكل دائم!');
}

// Handle edit record form submission
function handleEditRecord(e) {
    e.preventDefault();
    
    const index = parseInt(document.getElementById('editRecordId').value);
    const newCompanyName = document.getElementById('editCompanyName').value.trim();
    const newEmployeeName = document.getElementById('editEmployeeName').value.trim();
    const newPhoneNumber = document.getElementById('editPhoneNumber').value.trim();
    
    // Get the flat data for reference
    const flatData = [];
    phoneData.forEach(company => {
        company.employees.forEach(employee => {
            flatData.push({
                company: company.company,
                employee: employee.name,
                phone: employee.phone
            });
        });
    });
    
    const oldRecord = flatData[index];
    
    // Remove the old record
    let oldCompanyIndex = phoneData.findIndex(company => company.company === oldRecord.company);
    let oldEmployeeIndex = phoneData[oldCompanyIndex].employees.findIndex(
        employee => employee.name === oldRecord.employee && employee.phone === oldRecord.phone
    );
    
    phoneData[oldCompanyIndex].employees.splice(oldEmployeeIndex, 1);
    
    // If company has no more employees, remove it
    if (phoneData[oldCompanyIndex].employees.length === 0) {
        phoneData.splice(oldCompanyIndex, 1);
    }
    
    // Add the updated record
    let newCompanyIndex = phoneData.findIndex(company => company.company === newCompanyName);
    
    if (newCompanyIndex === -1) {
        // Create new company
        phoneData.push({
            company: newCompanyName,
            employees: [{
                name: newEmployeeName,
                phone: newPhoneNumber
            }]
        });
    } else {
        // Add employee to existing company
        phoneData[newCompanyIndex].employees.push({
            name: newEmployeeName,
            phone: newPhoneNumber
        });
    }
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Update table and close modal
    renderTable();
    closeAllModals();
    
    // Show success message
    alert('تم تعديل السجل بنجاح وحفظه بشكل دائم!');
}

// Confirm delete action
function confirmDelete() {
    if (!recordToDelete) return;
    
    const { record } = recordToDelete;
    
    // Find and remove the record
    let companyIndex = phoneData.findIndex(company => company.company === record.company);
    if (companyIndex !== -1) {
        let employeeIndex = phoneData[companyIndex].employees.findIndex(
            employee => employee.name === record.employee && employee.phone === record.phone
        );
        
        if (employeeIndex !== -1) {
            phoneData[companyIndex].employees.splice(employeeIndex, 1);
            
            // If company has no more employees, remove it
            if (phoneData[companyIndex].employees.length === 0) {
                phoneData.splice(companyIndex, 1);
            }
        }
    }
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Update table and close modal
    renderTable();
    closeAllModals();
    recordToDelete = null;
    
    // Show success message
    alert('تم حذف السجل بنجاح وحفظ التغييرات بشكل دائم!');
}

// Save changes to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(phoneData));
        console.log('Data saved to localStorage');
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

// Save changes button handler
function saveChanges() {
    if (saveToLocalStorage()) {
        alert('تم حفظ جميع التغييرات بنجاح!');
    } else {
        alert('حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.');
    }
}

// Handle import Excel
function handleImportExcel(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('يرجى اختيار ملف Excel صالح.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get the first sheet
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            
            // Process the data
            processImportedData(jsonData);
            
            // Close modal
            closeAllModals();
        } catch (error) {
            console.error('Error processing Excel file:', error);
            alert('حدث خطأ أثناء معالجة ملف Excel. تأكد من أن الملف بالتنسيق الصحيح.');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Process imported Excel data
function processImportedData(jsonData) {
    // Expected format: [{Company: '...', Employee: '...', Phone: '...'}]
    if (!jsonData || !jsonData.length) {
        alert('لم يتم العثور على بيانات في ملف Excel.');
        return;
    }
    
    // Create new data structure
    const newData = [];
    const companyMap = {};
    
    jsonData.forEach(row => {
        const company = row.Company || row.company || row.الشركة || row['اسم الشركة'] || '';
        const employee = row.Employee || row.employee || row.الموظف || row['اسم الموظف'] || '';
        const phone = row.Phone || row.phone || row.الهاتف || row['رقم الهاتف'] || '';
        
        if (!company || !phone) return; // Skip invalid rows
        
        if (!companyMap[company]) {
            companyMap[company] = {
                company: company,
                employees: []
            };
            newData.push(companyMap[company]);
        }
        
        companyMap[company].employees.push({
            name: employee,
            phone: phone.toString()
        });
    });
    
    // Replace or merge with existing data
    if (confirm('هل تريد استبدال البيانات الحالية أو دمجها مع البيانات المستوردة؟\nاضغط "موافق" للاستبدال أو "إلغاء" للدمج.')) {
        // Replace
        phoneData = newData;
    } else {
        // Merge
        newData.forEach(newCompany => {
            const existingCompanyIndex = phoneData.findIndex(
                company => company.company === newCompany.company
            );
            
            if (existingCompanyIndex === -1) {
                // Add new company
                phoneData.push(newCompany);
            } else {
                // Merge employees
                newCompany.employees.forEach(newEmployee => {
                    const existingEmployeeIndex = phoneData[existingCompanyIndex].employees.findIndex(
                        employee => employee.name === newEmployee.name && employee.phone === newEmployee.phone
                    );
                    
                    if (existingEmployeeIndex === -1) {
                        // Add new employee
                        phoneData[existingCompanyIndex].employees.push(newEmployee);
                    }
                });
            }
        });
    }
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Update table
    renderTable();
    alert('تم استيراد البيانات بنجاح وحفظها بشكل دائم!');
}

// Export to Excel
function exportToExcel() {
    // Prepare data for export
    const exportData = [];
    
    phoneData.forEach(company => {
        company.employees.forEach(employee => {
            exportData.push({
                'اسم الشركة': company.company,
                'اسم الموظف': employee.name || '',
                'رقم الهاتف': employee.phone
            });
        });
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'بيانات الهواتف');
    
    // Generate Excel file
    XLSX.writeFile(workbook, 'بيانات_الهواتف.xlsx');
}
