// Sample data for beds
const bedsData = [
  { floor: 1, bed: '101', patient: 'คุณ A', level: 85, flowRate: 50, fluidType: 'NaCl' },
  { floor: 1, bed: '102', patient: 'คุณ B', level: 20, flowRate: 75, fluidType: 'ยาปฏิชีวนะ' },
  { floor: 1, bed: '103', patient: 'คุณ C', level: 55, flowRate: 60, fluidType: 'NaCl' },
  { floor: 2, bed: '201', patient: 'คุณ D', level: 40, flowRate: 80, fluidType: 'วิตามิน' },
  { floor: 2, bed: '202', patient: 'คุณ E', level: 70, flowRate: 45, fluidType: 'NaCl' },
  { floor: 2, bed: '203', patient: 'คุณ F', level: 30, flowRate: 90, fluidType: 'สารอาหาร' },
  { floor: 3, bed: '301', patient: 'คุณ G', level: 95, flowRate: 40, fluidType: 'น้ำตาล' },
  { floor: 3, bed: '302', patient: 'คุณ H', level: 15, flowRate: 100, fluidType: 'ยาฉีด' },
  { floor: 3, bed: '303', patient: 'คุณ I', level: 50, flowRate: 55, fluidType: 'NaCl' }
];

// DOM elements
const bedsContainer = document.getElementById('bedsContainer');
const alertArea = document.getElementById('alertArea');
// Building and test controls elements (may not exist on other pages)
const buildingContainer = document.getElementById('buildingContainer');
const testFloorSelect = document.getElementById('testFloorSelect');
const testBedSelect = document.getElementById('testBedSelect');
const testSelectedButton = document.getElementById('testSelectedButton');
// Elements for modal pop-up alerts
const modalOverlay = document.getElementById('modalOverlay');
const modalAlert = document.getElementById('modalAlert');
const modalMessage = document.getElementById('modalMessage');
const modalClose = document.getElementById('modalClose');

// Elements for patient detail modal
const patientModalOverlay = document.getElementById('patientModalOverlay');
const patientModal = document.getElementById('patientModal');
const patientVideo = document.getElementById('patientVideo');
const patientInfo = document.getElementById('patientInfo');
const patientClose = document.getElementById('patientClose');

// Variable to hold current webcam stream so we can stop it when closing
let currentStream = null;

// Variables for motion detection
let motionDetectionInterval = null;
let prevFrameData = null;
let motionCanvas = null;
let motionCtx = null;

// Variables for pose detection using MediaPipe
let pose = null;
let camera = null;
let poseCanvas = null;
let poseCtx = null;
let prevNose = null;
let poseDetectionActive = false;

// State variables for simulation and alerts
let simulationInterval = null;
// Keep track of beds that have triggered empty alert to avoid repeated notifications
const alertedBeds = new Set();

// Currently selected floor for display (null means all floors)
let selectedFloor = null;

// Function to play a short beep sound using Web Audio API
function playBeep() {
  // Play a multi‑pulse alarm sound using four distinct frequencies. Medical alarm guidelines
  // recommend using multiple frequency components in the 150–1000 Hz range and
  // having the alarm loud enough to stand out above ambient noise【469157844427484†L131-L141】
  //【469157844427484†L178-L184】. Here we play four tones (880 Hz, 660 Hz, 990 Hz and
  // 770 Hz) sequentially with short pauses. Each beep lasts 0.45 s with a 0.1 s pause
  // between beeps, resulting in a more distinct and longer alert (~2.2 s).
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  const beepDuration = 0.45;
  const pause = 0.1;
  const frequencies = [880, 660, 990, 770];
  frequencies.forEach((freq, index) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    // Use a moderate volume so the alarm is audible above ambient noise but not too loud.
    gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const startTime = audioCtx.currentTime + index * (beepDuration + pause);
    oscillator.start(startTime);
    oscillator.stop(startTime + beepDuration);
  });
}

// Show modal pop-up notification with message
function showModal(message) {
  // Allow line breaks by converting newline characters to <br>
  modalMessage.innerHTML = message.replace(/\n/g, '<br>');
  modalOverlay.classList.remove('hidden');
  modalAlert.classList.remove('hidden');
  // Automatically hide modal after 5 seconds
  setTimeout(() => {
    hideModal();
  }, 5000);
}

// Hide modal pop-up
function hideModal() {
  modalOverlay.classList.add('hidden');
  modalAlert.classList.add('hidden');
}

// Attach event listener for modal close button
modalClose.addEventListener('click', hideModal);

// Attach event listeners for patient modal close
if (patientClose) {
  patientClose.addEventListener('click', closePatientModal);
}
if (patientModalOverlay) {
  patientModalOverlay.addEventListener('click', closePatientModal);
}

// Handle when a bag becomes empty
function handleEmpty(bed) {
  // Play beep sound
  playBeep();
  // Retrieve staff list from localStorage and filter by floor
  const staffDataRaw = localStorage.getItem('staffList');
  let staffList = [];
  if (staffDataRaw) {
    try {
      staffList = JSON.parse(staffDataRaw);
    } catch (e) {
      staffList = [];
    }
  }
  const staffForFloor = staffList.filter(s => Number(s.floor) === bed.floor);
  // Construct staff message
  let staffMessage = '';
  if (staffForFloor.length > 0) {
    const recipients = staffForFloor.map(s => `${s.name} (${s.contact})`).join(', ');
    // Translate staff notification message
    staffMessage = t('staffNotify')
      .replace('{floor}', bed.floor)
      .replace('{recipients}', recipients);
  } else {
    staffMessage = t('noStaff').replace('{floor}', bed.floor);
  }
  // Show modal pop-up with floor, bed and staff information
  showModal(
    t('bagEmpty')
      .replace('{floor}', bed.floor)
      .replace('{bed}', bed.bed) +
      '\n' + staffMessage
  );
}

/**
 * Open the patient detail modal for the given bed. This function reads
 * patient information from localStorage using the key "patients".
 * Each patient record is stored under a key of the form "floor-bed"
 * (e.g. "2-201"). When the modal opens it will attempt to access
 * the user's webcam via the MediaDevices API. If permission is
 * denied or not supported, the video area will remain blank.
 *
 * @param {Object} bed - The bed object containing floor and bed identifiers
 */
function openPatientModal(bed) {
  if (!patientModalOverlay || !patientModal) return;
  // Load patient data from localStorage
  let patients = {};
  const raw = localStorage.getItem('patients');
  if (raw) {
    try {
      patients = JSON.parse(raw);
    } catch (e) {
      patients = {};
    }
  }
  const key = `${bed.floor}-${bed.bed}`;
  const info = patients[key];
  // Clear previous content
  if (patientInfo) patientInfo.innerHTML = '';
  // Build detail list
  if (info) {
    // Define fields to display. Use translation keys for labels and remove trailing colons
    // Build an array of fields to display. We include floor and bed at
    // the top to remind caregivers which location this patient belongs to.
    const fields = [
      { label: t('patientFloor').replace(/:$/, ''), value: bed.floor },
      { label: t('patientBed').replace(/:$/, ''), value: bed.bed },
      { label: t('patientName').replace(/:$/, ''), value: info.name },
      { label: t('patientID').replace(/:$/, ''), value: info.id },
      { label: t('patientAge').replace(/:$/, ''), value: info.age },
      { label: t('patientGender').replace(/:$/, ''), value: translateGender(info.gender) },
      { label: t('patientDiagnosis').replace(/:$/, ''), value: info.diagnosis || '-' },
      { label: t('patientMedication').replace(/:$/, ''), value: info.medication || '-' },
      { label: t('patientAllergies').replace(/:$/, ''), value: info.allergies || '-' },
      { label: t('patientHeight').replace(/:$/, ''), value: info.height || '-' },
      { label: t('patientWeight').replace(/:$/, ''), value: info.weight || '-' },
      { label: t('patientBloodPressure').replace(/:$/, ''), value: info.bloodPressure || '-' },
      { label: t('patientNotes').replace(/:$/, ''), value: info.notes || '-' }
    ];
    fields.forEach(item => {
      const div = document.createElement('div');
      div.innerHTML = `<strong>${item.label}:</strong> ${item.value}`;
      patientInfo.appendChild(div);
    });
  } else {
    const p = document.createElement('p');
    p.textContent = t('noPatientData');
    patientInfo.appendChild(p);
  }
  // Show modal
  patientModalOverlay.classList.remove('hidden');
  patientModal.classList.remove('hidden');
  // Attach close handlers dynamically in case elements were not bound
  if (patientClose) {
    patientClose.onclick = closePatientModal;
  }
  if (patientModalOverlay) {
    patientModalOverlay.onclick = closePatientModal;
  }
  // Start webcam stream
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      currentStream = stream;
      if (patientVideo) {
        patientVideo.srcObject = stream;
      }
      // Once stream starts, begin motion detection
      startMotionDetection();

      // Begin pose detection once video metadata is loaded
      // Wait for video to have dimensions before starting pose
      const startPoseIfReady = () => {
        if (patientVideo.videoWidth && patientVideo.videoHeight) {
          startPoseDetection();
        } else {
          // Retry until video has dimensions
          requestAnimationFrame(startPoseIfReady);
        }
      };
      startPoseIfReady();
    }).catch(() => {
      // If webcam access fails, leave video blank
      if (patientVideo) {
        patientVideo.removeAttribute('srcObject');
      }
    });
  }
}

/**
 * Close the patient detail modal and stop any active webcam stream.
 */
function closePatientModal() {
  if (!patientModalOverlay || !patientModal) return;
  patientModalOverlay.classList.add('hidden');
  patientModal.classList.add('hidden');
  // Stop webcam if running
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  if (patientVideo) {
    patientVideo.srcObject = null;
  }

  // Stop motion detection when modal closes
  stopMotionDetection();

  // Stop pose detection and clear skeleton when modal closes
  stopPoseDetection();
}

// Helper: translate gender code to display string
function translateGender(code) {
  if (code === 'male') return t('patientGenderMale');
  if (code === 'female') return t('patientGenderFemale');
  if (code === 'other') return t('patientGenderOther');
  return code;
}

// Show a detection alert inside the patient modal. Accepts a translation key.
function showDetectionAlert(key) {
  const detectionAlert = document.getElementById('detectionAlert');
  if (!detectionAlert) return;
  // If an alert is already visible, simply update the text without triggering another beep
  const isVisible = !detectionAlert.classList.contains('hidden');
  detectionAlert.textContent = t(key);
  if (!isVisible) {
    detectionAlert.classList.remove('hidden');
    // Play beep only when alert becomes visible
    playBeep();
    // Hide after 4 seconds
    setTimeout(() => {
      detectionAlert.classList.add('hidden');
    }, 4000);
  }
}

// Start motion detection loop. This resets previous frame data and starts
// an interval to compare successive frames from the webcam. If significant
// changes are detected the system will display an alert.
function startMotionDetection() {
  // Reset previous frame and any existing detection loop
  prevFrameData = null;
  if (motionDetectionInterval) {
    clearInterval(motionDetectionInterval);
  }
  motionDetectionInterval = setInterval(detectMotion, 1000);
}

// Stop motion detection loop and clear stored data
function stopMotionDetection() {
  if (motionDetectionInterval) {
    clearInterval(motionDetectionInterval);
    motionDetectionInterval = null;
  }
  prevFrameData = null;
}

// Start pose detection using MediaPipe Pose. Draws skeleton on a canvas over the video
// and monitors nose movement to detect abnormal motion. Requires that MediaPipe
// scripts have been loaded in HTML and that the video stream is active.
function startPoseDetection() {
  // Guard against multiple initialisations
  if (poseDetectionActive) return;
  poseDetectionActive = true;
  // Get canvas element and context
  poseCanvas = document.getElementById('poseCanvas');
  if (!poseCanvas) {
    poseDetectionActive = false;
    return;
  }
  poseCtx = poseCanvas.getContext('2d');
  // Initialize Pose solution if not already created
  if (!pose) {
    // Initialize the MediaPipe Pose solution. Use Pose.Pose when loaded from CDN.
    pose = new Pose.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.4/${file}`
    });
    pose.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    pose.onResults(onPoseResults);
  }
  // Create camera helper if not yet created
  if (!camera) {
    camera = new Camera(patientVideo, {
      onFrame: async () => {
        if (pose) {
          await pose.send({ image: patientVideo });
        }
      },
      width: patientVideo.videoWidth || 640,
      height: patientVideo.videoHeight || 480
    });
  }
  // Start camera stream for Pose detection
  camera.start();
  // Reset previous nose position
  prevNose = null;
}

// Stop pose detection and clear drawing canvas
function stopPoseDetection() {
  // Ensure flag is reset
  if (!poseDetectionActive) return;
  poseDetectionActive = false;
  // Stop camera if available
  if (camera) {
    try {
      camera.stop();
    } catch (e) {
      // Some versions of camera may not support stop
    }
  }
  // Clear previous nose data
  prevNose = null;
  // Clear canvas drawing
  if (poseCanvas && poseCtx) {
    poseCtx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
  }
}

// Handle pose results. Draw the skeleton and trigger movement alert if
// the nose moves significantly between frames. Landmarks are normalised
// coordinates between 0 and 1.
function onPoseResults(results) {
  if (!poseDetectionActive || !poseCanvas || !poseCtx) return;
  // Set canvas dimensions to match the video frame
  poseCanvas.width = patientVideo.videoWidth;
  poseCanvas.height = patientVideo.videoHeight;
  // Clear previous drawing
  poseCtx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
  if (results.poseLandmarks) {
    // Draw connectors and landmarks using MediaPipe drawing utils. These globals
    // are provided by drawing_utils.js.
    try {
      // Draw skeleton using MediaPipe drawing utils. Pose.POSE_CONNECTIONS provides the list of connections
      const connections = Pose.POSE_CONNECTIONS;
      drawConnectors(poseCtx, results.poseLandmarks, connections, { color: '#00FF00', lineWidth: 2 });
      drawLandmarks(poseCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
    } catch (e) {
      // If drawing utils are not available, silently ignore
    }
    // Monitor nose movement; nose is landmark index 0
    const nose = results.poseLandmarks[0];
    if (nose && typeof nose.x === 'number' && typeof nose.y === 'number') {
      if (prevNose) {
        const dx = nose.x - prevNose.x;
        const dy = nose.y - prevNose.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // If nose moved more than a threshold, trigger abnormal movement alert
        // Use a larger threshold (0.05) to reduce false positives and focus on significant movement
        if (dist > 0.05) {
          showDetectionAlert('movementAlert');
        }
      }
      // Update previous nose position
      prevNose = { x: nose.x, y: nose.y };
    }
  }
}

// Perform a single motion detection step. Compares current webcam
// frame to the previous frame using pixel differences. If the
// average difference exceeds a threshold, it triggers a movement
// alert. Thresholds may need tuning for real‑world use.
function detectMotion() {
  // Ensure a video stream is available
  if (!patientVideo || !patientVideo.srcObject) return;
  const video = patientVideo;
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return;
  // Prepare off‑screen canvas
  if (!motionCanvas) {
    motionCanvas = document.createElement('canvas');
    motionCanvas.width = w;
    motionCanvas.height = h;
    motionCtx = motionCanvas.getContext('2d');
  } else {
    if (motionCanvas.width !== w || motionCanvas.height !== h) {
      motionCanvas.width = w;
      motionCanvas.height = h;
    }
  }
  // Draw current frame to canvas
  motionCtx.drawImage(video, 0, 0, w, h);
  const frame = motionCtx.getImageData(0, 0, w, h).data;
  if (prevFrameData) {
    let diffSum = 0;
    const length = frame.length;
    // Compute sum of absolute differences for RGB channels
    for (let i = 0; i < length; i += 4) {
      const r = frame[i];
      const g = frame[i + 1];
      const b = frame[i + 2];
      const pr = prevFrameData[i];
      const pg = prevFrameData[i + 1];
      const pb = prevFrameData[i + 2];
      const diff = Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);
      diffSum += diff;
    }
    const avgDiff = diffSum / (length / 4);
    // If average difference is above threshold, trigger alert
    if (avgDiff > 50) {
      showDetectionAlert('movementAlert');
    }
  }
  // Copy current frame data for next comparison
  prevFrameData = new Uint8ClampedArray(frame);
}

// Render the building floor buttons
function renderBuilding() {
  if (!buildingContainer) return;
  buildingContainer.innerHTML = '';
  // Determine unique floors and sort ascending
  const floors = Array.from(new Set(bedsData.map(b => b.floor))).sort((a, b) => a - b);
  // Button for all floors
  const allBtn = document.createElement('div');
  allBtn.className = 'floor-button';
  allBtn.textContent = t('allFloors');
  if (selectedFloor === null) allBtn.classList.add('selected');
  allBtn.addEventListener('click', () => {
    selectedFloor = null;
    renderBuilding();
    renderBeds();
  });
  buildingContainer.appendChild(allBtn);
  // Create a button for each floor
  floors.forEach(floor => {
    const btn = document.createElement('div');
    btn.className = 'floor-button';
    btn.textContent = `${t('floor')} ${floor}`;
    if (selectedFloor === floor) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      selectedFloor = floor;
      renderBuilding();
      renderBeds();
    });
    buildingContainer.appendChild(btn);
  });
}

// Populate the test controls (floor and bed selects)
function populateTestControls() {
  if (!testFloorSelect || !testBedSelect) return;
  // Populate floor options
  testFloorSelect.innerHTML = '';
  const floors = Array.from(new Set(bedsData.map(b => b.floor))).sort((a, b) => a - b);
  floors.forEach(floor => {
    const option = document.createElement('option');
    option.value = floor;
    option.textContent = floor;
    testFloorSelect.appendChild(option);
  });
  updateTestBedSelect();
}

// Update the bed select based on selected floor
function updateTestBedSelect() {
  if (!testFloorSelect || !testBedSelect) return;
  const selected = parseInt(testFloorSelect.value, 10);
  testBedSelect.innerHTML = '';
  const bedsForFloor = bedsData.filter(b => b.floor === selected);
  bedsForFloor.forEach(bed => {
    const option = document.createElement('option');
    option.value = bed.bed;
    option.textContent = bed.bed;
    testBedSelect.appendChild(option);
  });
}

// Start simulation of fluid flow
function startSimulation() {
  if (simulationInterval) return; // Avoid starting multiple intervals
  simulationInterval = setInterval(() => {
    bedsData.forEach(bed => {
      // Only decrease level if above zero
      if (bed.level > 0) {
        // Simulate decrease in fluid level. Reduce more slowly to allow longer
        // simulation time. We use a small base decrement plus a flow rate
        // contribution scaled by 1000. This slows the rate so bags do not
        // empty too quickly during demonstration.
        const decrement = 0.1 + (bed.flowRate / 1000);
        bed.level = Math.max(0, bed.level - decrement);
        // When level drops to zero or below threshold, trigger alert if not already alerted
        if (bed.level <= 0 && !alertedBeds.has(bed)) {
          alertedBeds.add(bed);
          handleEmpty(bed);
        }
      } else {
        // Already zero – ensure we only alert once
        if (!alertedBeds.has(bed)) {
          alertedBeds.add(bed);
          handleEmpty(bed);
        }
      }
    });
    // Update UI with the latest data (always display all beds)
    renderBeds();
  }, 1000); // Update every second
}

// Populate floor selector

// Render bed cards (always show all beds)
function renderBeds() {
  // Clear existing
  bedsContainer.innerHTML = '';
  // Determine which beds to show based on selected floor
  let bedsToShow;
  if (selectedFloor === null) {
    bedsToShow = bedsData;
  } else {
    bedsToShow = bedsData.filter(bed => bed.floor === selectedFloor);
  }
  // Load patient map from localStorage to update names if available
  let patientsMap = {};
  const rawPatients = localStorage.getItem('patients');
  if (rawPatients) {
    try {
      patientsMap = JSON.parse(rawPatients);
    } catch {
      patientsMap = {};
    }
  }
  bedsToShow.forEach(bed => {
    // Update displayed patient name if information is available
    const key = `${bed.floor}-${bed.bed}`;
    if (patientsMap[key] && patientsMap[key].name) {
      bed.patient = patientsMap[key].name;
    }
    const card = document.createElement('div');
    card.className = 'bed-card';

    const heading = document.createElement('h3');
    // Add bed icon before the heading text
    const icon = document.createElement('img');
    icon.src = 'bed.png';
    icon.alt = 'bed';
    icon.className = 'bed-icon';
    // Append icon and text to heading
    heading.appendChild(icon);
    // Use translation for bed label
    heading.appendChild(
      document.createTextNode(`${t('bed')} ${bed.floor}-${bed.bed}`)
    );
    card.appendChild(heading);

    const patient = document.createElement('div');
    patient.className = 'patient';
    patient.textContent = `${t('patient')}: ${bed.patient}`;
    card.appendChild(patient);

    const fluidType = document.createElement('div');
    fluidType.className = 'fluid-type';
    fluidType.textContent = `${t('fluidType')}: ${bed.fluidType}`;
    card.appendChild(fluidType);

    // Progress bar wrapper
    const progress = document.createElement('div');
    progress.className = 'progress';
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.width = `${bed.level}%`;
    // Determine color class
    if (bed.level > 50) {
      progressBar.classList.add('progress-green');
    } else if (bed.level > 30) {
      progressBar.classList.add('progress-yellow');
    } else {
      progressBar.classList.add('progress-red');
    }
    progress.appendChild(progressBar);
    card.appendChild(progress);

    // Display percentage value
    const levelDisplay = document.createElement('div');
    levelDisplay.className = 'level-display';
    levelDisplay.style.marginBottom = '6px';
    levelDisplay.style.fontSize = '13px';
    // Show integer part of level
    levelDisplay.textContent = `${t('level')}: ${bed.level.toFixed(0)}%`;
    card.appendChild(levelDisplay);

    // Flow rate display
    const flow = document.createElement('div');
    flow.className = 'flow-rate';
    // If flow rate is considered high (> 80 mL/h), emphasise it
    if (bed.flowRate > 80) {
      flow.classList.add('high-flow');
      flow.textContent = `${t('highFlowRate')}: ${bed.flowRate} mL/h`;
    } else {
      flow.textContent = `${t('flowRate')}: ${bed.flowRate} mL/h`;
    }
    card.appendChild(flow);

    // Change bag button
    const changeBtn = document.createElement('button');
    changeBtn.className = 'change-button';
    changeBtn.textContent = t('changeBag');
    changeBtn.addEventListener('click', () => {
      // Reset the level to 100 and optionally reset flow rate
      bed.level = 100;
      // Optionally set flow rate back to a normal value
      bed.flowRate = 60;
      renderBeds();
      showAlert(
        t('confirmChange')
          .replace('{floor}', bed.floor)
          .replace('{bed}', bed.bed)
      );
    });
    card.appendChild(changeBtn);

    // Add click handler to open patient modal unless clicking the change button
    card.addEventListener('click', (e) => {
      // If the click originated from the change button, do not open modal
      if (e.target.closest('.change-button')) return;
      openPatientModal(bed);
    });

    bedsContainer.appendChild(card);
  });
}

// Display summary of near-empty beds (< 30% level)

// Show alert message
function showAlert(message) {
  alertArea.textContent = message;
  alertArea.classList.remove('hidden');
  // Auto hide after 4 seconds
  setTimeout(() => {
    alertArea.classList.add('hidden');
  }, 4000);
}

// Set up event listeners for test controls if present
if (testFloorSelect && testBedSelect) {
  testFloorSelect.addEventListener('change', updateTestBedSelect);
}
if (testSelectedButton) {
  testSelectedButton.addEventListener('click', () => {
    if (!testFloorSelect || !testBedSelect) return;
    const floorValue = parseInt(testFloorSelect.value, 10);
    const bedId = testBedSelect.value;
    const bed = bedsData.find(b => b.floor === floorValue && b.bed === bedId);
    if (bed) {
      // For test purposes immediately empty the bag and trigger the alert.  We
      // set the level to 0 and call the empty handler directly so that a
      // notification pops up without waiting for the simulation loop.  This
      // helps users see exactly how the alert behaves when a bag runs out.
      bed.level = 0;
      // Remove from alerted set so that handleEmpty will be invoked even if it was previously alerted
      alertedBeds.delete(bed);
      // Immediately trigger the empty handler to show the alert and play beep
      handleEmpty(bed);
      // Update the UI to reflect the empty bag
      renderBeds();
    }
  });
}

// Initialize page: render all beds
renderBeds();
// Render building and populate test controls once after DOM content is available
renderBuilding();
populateTestControls();

// Register dynamic content refresh on language change
if (window.languageChangeHandlers) {
  window.languageChangeHandlers.push(() => {
    renderBuilding();
    renderBeds();
    populateTestControls();
    updateTestBedSelect();
  });
}

// Start the continuous simulation once the page has fully loaded and user has interacted (e.g., due to autoplay restrictions)
// Use a short timeout so that the AudioContext can be created after user gesture (clicking on the page)
window.addEventListener('load', () => {
  setTimeout(() => {
    startSimulation();
  }, 500);
});