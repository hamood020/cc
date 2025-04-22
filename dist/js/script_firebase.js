// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJVhr2Xo5NIRKiUy6Ge7cGFrCa_ihJkf8",
  authDomain: "phone-directory-app-5e7d2.firebaseapp.com",
  projectId: "phone-directory-app-5e7d2",
  storageBucket: "phone-directory-app-5e7d2.appspot.com",
  messagingSenderId: "1098765432",
  appId: "1:1098765432:web:abc123def456ghi789jkl"
};

// Variables to store data
let phoneData = [];
let searchResults = [];

// Initialize Firebase
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const phoneCollection = db.collection('phoneDirectory');
    
    // Load phone data
    fetchPhoneData();
    
    // Set up search functionality
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Function to fetch phone data from Firestore
    async function fetchPhoneData() {
        try {
            // Show loading indicator
            document.getElementById('resultsContainer').innerHTML = '<div class="loading">جاري تحميل البيانات...</div>';
            
            // Get data from Firestore
            const snapshot = await phoneCollection.doc('data').get();
            
            if (snapshot.exists && snapshot.data().phoneData) {
                // Use data from Firestore if available
                phoneData = snapshot.data().phoneData;
                console.log('Data loaded from Firestore');
            } else {
                // Fall back to JSON file if no Firestore data
                try {
                    const response = await fetch('data/phone_data.json');
                    phoneData = await response.json();
                    console.log('Data loaded from JSON file');
                    
                    // Save initial data to Firestore
                    await saveToFirestore();
                } catch (jsonError) {
                    console.error('Error loading JSON data:', jsonError);
                    phoneData = [];
                }
            }
            
            // Clear loading indicator
            document.getElementById('resultsContainer').innerHTML = '<p class="no-results">أدخل كلمة البحث للعثور على النتائج</p>';
        } catch (error) {
            console.error('Error loading phone data from Firestore:', error);
            document.getElementById('resultsContainer').innerHTML = '<p class="error">حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.</p>';
        }
    }
    
    // Function to save data to Firestore
    async function saveToFirestore() {
        try {
            await phoneCollection.doc('data').set({
                phoneData: phoneData,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Data saved to Firestore');
            return true;
        } catch (error) {
            console.error('Error saving to Firestore:', error);
            return false;
        }
    }
    
    // Perform search
    function performSearch() {
        const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (!searchTerm) {
            resultsContainer.innerHTML = '<p class="no-results">أدخل كلمة البحث للعثور على النتائج</p>';
            return;
        }
        
        // Filter data based on search term
        searchResults = [];
        
        phoneData.forEach(company => {
            const companyMatches = company.company.toLowerCase().includes(searchTerm);
            const matchingEmployees = company.employees.filter(emp => 
                (emp.name && emp.name.toLowerCase().includes(searchTerm)) || 
                emp.phone.toLowerCase().includes(searchTerm)
            );
            
            if (companyMatches || matchingEmployees.length > 0) {
                const resultItem = {
                    company: company.company,
                    employees: companyMatches ? company.employees : matchingEmployees
                };
                
                searchResults.push(resultItem);
            }
        });
        
        // Display results
        displayResults(searchTerm);
    }
    
    // Display search results
    function displayResults(searchTerm) {
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (searchResults.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">لا توجد نتائج مطابقة لكلمة البحث</p>';
            return;
        }
        
        let resultsHTML = '';
        
        searchResults.forEach(result => {
            resultsHTML += `
                <div class="result-item">
                    <div class="company-name">${result.company}</div>
                    <ul class="employee-list">
            `;
            
            result.employees.forEach(employee => {
                const highlightName = employee.name && employee.name.toLowerCase().includes(searchTerm);
                const highlightPhone = employee.phone.toLowerCase().includes(searchTerm);
                
                resultsHTML += `
                    <li class="employee-item">
                        <span class="employee-name ${highlightName ? 'highlight' : ''}">${employee.name || 'غير محدد'}</span>
                        <span class="employee-phone ${highlightPhone ? 'highlight' : ''}">${employee.phone}</span>
                    </li>
                `;
            });
            
            resultsHTML += `
                    </ul>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = resultsHTML;
    }
});
