// Variables to store data
let phoneData = [];
const STORAGE_KEY = 'phoneDirectoryData';

// Function to fetch the phone data
async function fetchPhoneData() {
    try {
        // First try to get data from localStorage
        const storedData = localStorage.getItem(STORAGE_KEY);
        
        if (storedData) {
            // Use data from localStorage if available
            phoneData = JSON.parse(storedData);
            // Don't display results initially, just store the data
            updateResultsCount(0);
            document.getElementById('resultsArea').innerHTML = '<p class="no-results">يرجى كتابة نص في مربع البحث للعرض</p>';
            console.log('Data loaded from localStorage');
        } else {
            // Fall back to JSON file if no localStorage data
            const response = await fetch('data/phone_data.json');
            phoneData = await response.json();
            // Don't display results initially, just store the data
            updateResultsCount(0);
            document.getElementById('resultsArea').innerHTML = '<p class="no-results">يرجى كتابة نص في مربع البحث للعرض</p>';
            console.log('Data loaded from JSON file');
            
            // Save initial data to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(phoneData));
        }
    } catch (error) {
        console.error('Error loading phone data:', error);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    fetchPhoneData();
    
    // Set up search functionality
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearButton');
    const searchOptions = document.querySelectorAll('input[name="searchType"]');
    
    // Real-time search as user types
    searchInput.addEventListener('input', performSearch);
    
    // Clear search button
    clearButton.addEventListener('click', function() {
        searchInput.value = '';
        // Don't show results when search is cleared
        updateResultsCount(0);
        document.getElementById('resultsArea').innerHTML = '<p class="no-results">يرجى كتابة نص في مربع البحث للعرض</p>';
    });
    
    // Search type change
    searchOptions.forEach(option => {
        option.addEventListener('change', performSearch);
    });
    
    // Feedback link
    document.getElementById('feedbackLink').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'mailto:hamoud.2218@cpa.gov.om';
    });
    
    // Check for localStorage updates when page becomes visible again
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                const newData = JSON.parse(storedData);
                // Only update if data has changed
                if (JSON.stringify(newData) !== JSON.stringify(phoneData)) {
                    phoneData = newData;
                    // Re-run search if there's text in the search box
                    const searchTerm = document.getElementById('searchInput').value.trim();
                    if (searchTerm) {
                        performSearch();
                    } else {
                        // Don't show results if search box is empty
                        updateResultsCount(0);
                        document.getElementById('resultsArea').innerHTML = '<p class="no-results">يرجى كتابة نص في مربع البحث للعرض</p>';
                    }
                    console.log('Data refreshed from localStorage');
                }
            }
        }
    });
});

// Check if the input is a phone number (contains only digits)
function isPhoneNumberSearch(searchTerm) {
    return /^\d+$/.test(searchTerm);
}

// Perform search based on input and selected search type
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    
    // Don't show results if search term is empty
    if (searchTerm === '') {
        updateResultsCount(0);
        document.getElementById('resultsArea').innerHTML = '<p class="no-results">يرجى كتابة نص في مربع البحث للعرض</p>';
        return;
    }
    
    // Check if search term is a phone number (contains only digits)
    const isPhoneSearch = isPhoneNumberSearch(searchTerm);
    
    // If it's a phone number search, we'll search across all phone numbers regardless of search type
    if (isPhoneSearch) {
        const results = searchByPhoneNumber(searchTerm);
        updateResultsCount(results.length);
        displayResults(results);
        return;
    }
    
    // If not a phone search, proceed with regular search based on type
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    
    let results = [];
    
    // Filter based on search type
    switch (searchType) {
        case 'company':
            results = phoneData.filter(company => 
                company.company.toLowerCase().includes(searchTerm)
            );
            break;
            
        case 'employee':
            results = phoneData.filter(company => 
                company.employees.some(employee => 
                    employee.name.toLowerCase().includes(searchTerm)
                )
            ).map(company => {
                // Only include matching employees
                return {
                    company: company.company,
                    employees: company.employees.filter(employee => 
                        employee.name.toLowerCase().includes(searchTerm)
                    )
                };
            });
            break;
            
        case 'all':
        default:
            results = phoneData.filter(company => 
                company.company.toLowerCase().includes(searchTerm) || 
                company.employees.some(employee => 
                    employee.name.toLowerCase().includes(searchTerm) || 
                    employee.phone.includes(searchTerm)
                )
            ).map(company => {
                // If search matches company name, include all employees
                if (company.company.toLowerCase().includes(searchTerm)) {
                    return company;
                }
                // Otherwise only include matching employees
                return {
                    company: company.company,
                    employees: company.employees.filter(employee => 
                        employee.name.toLowerCase().includes(searchTerm) || 
                        employee.phone.includes(searchTerm)
                    )
                };
            });
            break;
    }
    
    // Filter out companies with no employees
    results = results.filter(company => company.employees.length > 0);
    
    // Update results count and display
    updateResultsCount(results.length);
    displayResults(results);
}

// Search specifically by phone number
function searchByPhoneNumber(phoneNumber) {
    // Create a new array with filtered results
    const results = phoneData.map(company => {
        // Filter employees that match the phone number
        const matchingEmployees = company.employees.filter(employee => 
            employee.phone.includes(phoneNumber)
        );
        
        // If there are matching employees, return the company with only those employees
        if (matchingEmployees.length > 0) {
            return {
                company: company.company,
                employees: matchingEmployees
            };
        }
        
        // If no matching employees, return null
        return null;
    }).filter(company => company !== null); // Remove null entries
    
    return results;
}

// Update the results count display
function updateResultsCount(count) {
    document.getElementById('resultsCount').textContent = `نتائج البحث (${count})`;
}

// Display the search results
function displayResults(results) {
    const resultsArea = document.getElementById('resultsArea');
    resultsArea.innerHTML = '';
    
    if (results.length === 0) {
        resultsArea.innerHTML = '<p class="no-results">لا توجد نتائج مطابقة للبحث</p>';
        return;
    }
    
    results.forEach(company => {
        const companySection = document.createElement('div');
        companySection.className = 'company-section';
        
        const companyHeader = document.createElement('div');
        companyHeader.className = 'company-header';
        companyHeader.innerHTML = `
            <span>${company.company}</span>
            <span class="icon">📋</span>
        `;
        
        const table = document.createElement('table');
        table.className = 'employee-table';
        
        const tableHeader = document.createElement('thead');
        tableHeader.innerHTML = `
            <tr>
                <th>اسم الموظف</th>
                <th>رقم الهاتف</th>
            </tr>
        `;
        
        const tableBody = document.createElement('tbody');
        
        company.employees.forEach((employee, index) => {
            const row = document.createElement('tr');
            const colorClass = `phone-number-${(index % 5) + 1}`;
            
            row.innerHTML = `
                <td>${employee.name || 'غير محدد'}</td>
                <td>
                    <a href="tel:${employee.phone}" class="phone-number ${colorClass}">
                        ${employee.phone}
                    </a>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        table.appendChild(tableHeader);
        table.appendChild(tableBody);
        
        companySection.appendChild(companyHeader);
        companySection.appendChild(table);
        
        resultsArea.appendChild(companySection);
    });
}
