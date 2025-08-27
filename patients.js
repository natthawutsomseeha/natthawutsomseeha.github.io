/*
 * Patients management script
 *
 * This script handles the patient registration form. When the form is
 * submitted, the patient details are stored in localStorage under the
 * key "patients". Each patient record is stored in an object keyed by
 * "floor-bed" (e.g. "2-201"). The form fields include basic
 * demographic data, assignment to a specific floor and bed, and
 * optional medical information. After saving, the form is reset and a
 * confirmation message is displayed. On subsequent visits to the
 * dashboard page, the patient name will appear on the bed card and
 * details will be available in the modal.
 */

// Define a list of beds to populate floor/bed selectors.
// This should mirror the beds defined in the dashboard script.
const bedsList = [
  { floor: 1, bed: '101' },
  { floor: 1, bed: '102' },
  { floor: 1, bed: '103' },
  { floor: 2, bed: '201' },
  { floor: 2, bed: '202' },
  { floor: 2, bed: '203' },
  { floor: 3, bed: '301' },
  { floor: 3, bed: '302' },
  { floor: 3, bed: '303' }
];

// Populate the floor select with available floors
function populateFloorOptions() {
  const floorSelect = document.getElementById('patientFloorSelect');
  if (!floorSelect) return;
  // Get unique floors
  const uniqueFloors = Array.from(new Set(bedsList.map(b => b.floor)));
  // Clear existing options
  floorSelect.innerHTML = '';
  uniqueFloors.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f;
    floorSelect.appendChild(opt);
  });
}

// Populate the bed select based on selected floor and occupancy
function populateBedOptions() {
  const floorSelect = document.getElementById('patientFloorSelect');
  const bedSelect = document.getElementById('patientBedSelect');
  if (!floorSelect || !bedSelect) return;
  const selectedFloor = parseInt(floorSelect.value);
  // Load existing patients to determine occupancy
  let patients = {};
  const raw = localStorage.getItem('patients');
  if (raw) {
    try {
      patients = JSON.parse(raw);
    } catch {
      patients = {};
    }
  }
  // Clear existing bed options
  bedSelect.innerHTML = '';
  bedsList.filter(b => b.floor === selectedFloor).forEach(b => {
    const key = `${b.floor}-${b.bed}`;
    const occupied = Boolean(patients[key]);
    const opt = document.createElement('option');
    opt.value = b.bed;
    // Append a check mark or cross depending on occupancy
    opt.textContent = occupied ? `${b.bed} ✗` : `${b.bed} ✓`;
    // Set option text colour to differentiate state
    opt.style.color = occupied ? 'red' : 'green';
    bedSelect.appendChild(opt);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('patientForm');
  const messageDiv = document.getElementById('patientMessage');

  // Utility to show a temporary message below the form
  function showMessage(msg) {
    if (!messageDiv) return;
    messageDiv.textContent = msg;
    messageDiv.style.color = 'green';
    // Hide after a few seconds
    setTimeout(() => {
      messageDiv.textContent = '';
    }, 4000);
  }

  // Populate floor and bed selectors on page load
  populateFloorOptions();
  populateBedOptions();

  // Update bed options when floor changes
  const floorSelect = document.getElementById('patientFloorSelect');
  if (floorSelect) {
    floorSelect.addEventListener('change', () => {
      populateBedOptions();
    });
  }

  // Form submission handler
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Gather form data
      const data = {
        id: form.patientId.value.trim(),
        name: form.patientName.value.trim(),
        age: form.patientAge.value ? form.patientAge.value.trim() : '',
        gender: form.patientGender.value,
        floor: form.patientFloorSelect.value.trim(),
        bed: form.patientBedSelect.value.trim(),
        diagnosis: form.patientDiagnosis.value.trim(),
        medication: form.patientMedication.value.trim(),
        allergies: form.patientAllergies.value.trim(),
        height: form.patientHeight.value.trim(),
        weight: form.patientWeight.value.trim(),
        bloodPressure: form.patientBloodPressure.value.trim(),
        notes: form.patientNotes.value.trim()
      };
      // Validate required fields: id, name, floor, bed
      if (!data.id || !data.name || !data.floor || !data.bed) {
        showMessage(t('fillAllFields'));
        return;
      }
      // Load existing patients map
      let patients = {};
      const rawData = localStorage.getItem('patients');
      if (rawData) {
        try {
          patients = JSON.parse(rawData);
        } catch {
          patients = {};
        }
      }
      // Store using floor-bed key
      const key = `${data.floor}-${data.bed}`;
      patients[key] = data;
      localStorage.setItem('patients', JSON.stringify(patients));
      // Show confirmation message
      showMessage(t('patientSaved'));
      // Reset the form
      form.reset();
      // repopulate selects to update occupancy status
      populateBedOptions();
    });
  }
  // Register a language change handler to re-render select options when language changes
  if (window.languageChangeHandlers) {
    window.languageChangeHandlers.push(() => {
      // Re-populate floor and bed selectors so that any colour/icon resets remain intact
      populateFloorOptions();
      populateBedOptions();
    });
  }
});