// staff.js: manages staff registration and assignment for floors

// Retrieve staff list from localStorage or return empty array
function getStoredStaff() {
  const data = localStorage.getItem('staffList');
  return data ? JSON.parse(data) : [];
}

// Save staff list back to localStorage
function saveStaffList(list) {
  localStorage.setItem('staffList', JSON.stringify(list));
}

// Populate floor selector with unique floor numbers from sample bed data or default values
function populateFloorOptions() {
  const floorSelect = document.getElementById('staffFloor');
  // Example: floors 1–3; adapt if more floors exist
  const floors = [1, 2, 3];
  floors.forEach(floor => {
    const option = document.createElement('option');
    option.value = floor;
    option.textContent = floor;
    floorSelect.appendChild(option);
  });
}

// Render staff table from stored list
function renderStaffTable() {
  const staffList = getStoredStaff();
  const tbody = document.querySelector('#staffTable tbody');
  const noStaffMessage = document.getElementById('noStaffMessage');
  // Clear existing rows
  tbody.innerHTML = '';
  if (staffList.length === 0) {
    noStaffMessage.style.display = 'block';
    return;
  }
  noStaffMessage.style.display = 'none';
  staffList.forEach((staff, index) => {
    const tr = document.createElement('tr');
    const nameTd = document.createElement('td');
    nameTd.textContent = staff.name;
    tr.appendChild(nameTd);
    const contactTd = document.createElement('td');
    contactTd.textContent = staff.contact;
    tr.appendChild(contactTd);
    const floorTd = document.createElement('td');
    floorTd.textContent = staff.floor;
    tr.appendChild(floorTd);
    // Action cell with delete button
    const actionTd = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.textContent = t('delete');
    delBtn.className = 'delete-button';
    delBtn.addEventListener('click', () => {
      // Remove staff from list and update
      const updatedList = getStoredStaff();
      updatedList.splice(index, 1);
      saveStaffList(updatedList);
      renderStaffTable();
    });
    actionTd.appendChild(delBtn);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });
}

// Event handler for form submission
function handleFormSubmit(event) {
  event.preventDefault();
  const nameInput = document.getElementById('staffName');
  const contactInput = document.getElementById('staffContact');
  const floorSelect = document.getElementById('staffFloor');
  const name = nameInput.value.trim();
  const contact = contactInput.value.trim();
  const floor = parseInt(floorSelect.value, 10);
  if (!name || !contact || isNaN(floor)) {
    alert(t('fillAllFields'));
    return;
  }
  const list = getStoredStaff();
  list.push({ name, contact, floor });
  saveStaffList(list);
  // Reset form
  nameInput.value = '';
  contactInput.value = '';
  floorSelect.selectedIndex = 0;
  renderStaffTable();
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  populateFloorOptions();
  renderStaffTable();
  const form = document.getElementById('staffForm');
  form.addEventListener('submit', handleFormSubmit);
  // Register dynamic update on language change
  if (window.languageChangeHandlers) {
    window.languageChangeHandlers.push(() => {
      renderStaffTable();
    });
  }
});