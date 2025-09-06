/*
 * Script for the user (home) dashboard. This file defines a simplified
 * interface that shows a single device for home users. It provides
 * monitoring of IV bag level, flow rate, a test button to simulate near
 * empty bags, a button to reset after changing the bag, and webcam
 * monitoring with pose detection to detect abnormal movement. The
 * functions here are adapted from the main script but tailored for a
 * single device and without multi‑floor controls.
 */

// Define a single device for the home user. By default the bed is 101 on
// floor 1, but this can be changed if needed. The patient name will be
// updated from localStorage if the user has registered information for
// this bed (key "1-101").
const userBed = { floor: 1, bed: '101', patient: '', level: 100, flowRate: 60, fluidType: 'NaCl' };

// DOM elements
const userContainer = document.getElementById('userDeviceContainer');
const alertArea = document.getElementById('alertArea');
const modalOverlay = document.getElementById('modalOverlay');
const modalAlert = document.getElementById('modalAlert');
const modalMessage = document.getElementById('modalMessage');
const modalClose = document.getElementById('modalClose');
// Patient modal elements
const patientModalOverlay = document.getElementById('patientModalOverlay');
const patientModal = document.getElementById('patientModal');
const patientVideo = document.getElementById('patientVideo');
const patientInfo = document.getElementById('patientInfo');
const patientClose = document.getElementById('patientClose');
const poseCanvasEl = document.getElementById('poseCanvas');

// Button elements
const logoutButton = document.getElementById('logoutButton');

// State variables for webcam and detection
let currentStream = null;
let motionDetectionInterval = null;
let prevFrameData = null;
let motionCanvas = null;
let motionCtx = null;
let pose = null;
let camera = null;
let poseCanvas = null;
let poseCtx = null;
let prevNose = null;
let poseDetectionActive = false;

// Keep track of whether an alert has already been shown for this device
let alerted = false;

// Play a sequence of audible tones to draw attention. We reuse the same
// beep logic as the doctor dashboard but customise it to play four
// pulses with varying frequencies and longer durations. This meets
// medical alarm recommendations that specify multiple frequency peaks
// between 150–1000 Hz and sufficient duration【469157844427484†L131-L141】.
function playBeep() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  const beepDuration = 0.45; // seconds per beep
  const pause = 0.1;         // pause between beeps
  const frequencies = [880, 660, 990, 770];
  frequencies.forEach((freq, index) => {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    // Set moderate volume so alarms stand out above ambient noise【469157844427484†L178-L184】
    gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const startTime = audioCtx.currentTime + index * (beepDuration + pause);
    osc.start(startTime);
    osc.stop(startTime + beepDuration);
  });
}

// Show a modal pop‑up with a given message. Hides automatically after 6 seconds.
function showModal(message) {
  modalMessage.innerHTML = message.replace(/\n/g, '<br>');
  modalOverlay.classList.remove('hidden');
  modalAlert.classList.remove('hidden');
  setTimeout(() => {
    hideModal();
  }, 6000);
}

function hideModal() {
  modalOverlay.classList.add('hidden');
  modalAlert.classList.add('hidden');
}

// Handle empty bag event for the user. Since there are no assigned staff in
// home mode, simply alert the user.
function handleEmpty() {
  playBeep();
  // Construct message using translation; specify floor and bed
  const msg = t('bagEmpty')
    .replace('{floor}', userBed.floor)
    .replace('{bed}', userBed.bed);
  showModal(msg);
}

// Render the user device card. This function reads patient data from
// localStorage (if registered via patients page on doctor interface) and
// updates the patient name displayed. It then creates a single card with
// level, flow rate, test button, change bag button, and click handler
// for opening the patient modal.
function renderDevice() {
  if (!userContainer) return;
  userContainer.innerHTML = '';
  // Load patient info from localStorage to update name if available
  let patientsMap = {};
  const raw = localStorage.getItem('patients');
  if (raw) {
    try {
      patientsMap = JSON.parse(raw);
    } catch {
      patientsMap = {};
    }
  }
  const key = `${userBed.floor}-${userBed.bed}`;
  if (patientsMap[key] && patientsMap[key].name) {
    userBed.patient = patientsMap[key].name;
  }
  const card = document.createElement('div');
  card.className = 'bed-card';
  // Heading with icon
  const heading = document.createElement('h3');
  const icon = document.createElement('img');
  icon.src = 'bed.png';
  icon.alt = 'bed';
  icon.className = 'bed-icon';
  heading.appendChild(icon);
  heading.appendChild(document.createTextNode(`${t('bed')} ${userBed.floor}-${userBed.bed}`));
  card.appendChild(heading);
  // Patient name
  const patient = document.createElement('div');
  patient.className = 'patient';
  patient.textContent = `${t('patient')}: ${userBed.patient}`;
  card.appendChild(patient);
  // Fluid type
  const fluid = document.createElement('div');
  fluid.className = 'fluid-type';
  fluid.textContent = `${t('fluidType')}: ${userBed.fluidType}`;
  card.appendChild(fluid);
  // Progress bar
  const progress = document.createElement('div');
  progress.className = 'progress';
  const bar = document.createElement('div');
  bar.className = 'progress-bar';
  bar.style.width = `${userBed.level}%`;
  if (userBed.level > 50) {
    bar.classList.add('progress-green');
  } else if (userBed.level > 30) {
    bar.classList.add('progress-yellow');
  } else {
    bar.classList.add('progress-red');
  }
  progress.appendChild(bar);
  card.appendChild(progress);
  // Level text
  const levelDisplay = document.createElement('div');
  levelDisplay.className = 'level-display';
  levelDisplay.style.marginBottom = '6px';
  levelDisplay.style.fontSize = '13px';
  levelDisplay.textContent = `${t('level')}: ${userBed.level.toFixed(0)}%`;
  card.appendChild(levelDisplay);
  // Flow rate
  const flow = document.createElement('div');
  flow.className = 'flow-rate';
  flow.textContent = `${t('flowRate')}: ${userBed.flowRate} mL/h`;
  // Highlight high flow rates > 80 mL/h
  if (userBed.flowRate > 80) {
    const span = document.createElement('span');
    span.className = 'high-flow';
    span.textContent = ` (${t('highFlowRate')})`;
    flow.appendChild(span);
  }
  card.appendChild(flow);
  // Buttons container
  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.gap = '8px';
  // Test button
  const testBtn = document.createElement('button');
  testBtn.className = 'test-button';
  testBtn.textContent = t('testButton');
  testBtn.addEventListener('click', () => {
    // Immediately empty the bag and trigger alert
    userBed.level = 0;
    alerted = false;
    renderDevice();
    // Trigger bag empty handler to play alarm and show modal
    handleEmpty();
    // Also show a test alert message to indicate simulation
    showAlert(
      t('testAlert')
        .replace('{floor}', userBed.floor)
        .replace('{bed}', userBed.bed)
    );
  });
  btnContainer.appendChild(testBtn);
  // Change bag button
  const changeBtn = document.createElement('button');
  changeBtn.className = 'change-button';
  changeBtn.textContent = t('changeBag');
  changeBtn.addEventListener('click', () => {
    userBed.level = 100;
    userBed.flowRate = 60;
    alerted = false;
    // Remove alert message
    hideAlert();
    renderDevice();
    showAlert(
      t('confirmChange')
        .replace('{floor}', userBed.floor)
        .replace('{bed}', userBed.bed)
    );
  });
  btnContainer.appendChild(changeBtn);
  card.appendChild(btnContainer);
  // Add click handler to open patient modal (excluding buttons)
  card.addEventListener('click', (e) => {
    // Avoid triggering when clicking on buttons
    if (e.target instanceof HTMLButtonElement) return;
    openPatientModal(userBed);
  });
  userContainer.appendChild(card);
}

// Show a brief alert in the alert area (top of page)
function showAlert(message) {
  if (!alertArea) return;
  alertArea.textContent = message;
  alertArea.classList.remove('hidden');
  setTimeout(() => {
    hideAlert();
  }, 4000);
}

function hideAlert() {
  if (!alertArea) return;
  alertArea.classList.add('hidden');
  alertArea.textContent = '';
}

// Start simulation of fluid depletion. Decrease the level gradually based on the flow rate
function startSimulation() {
  // Clear any existing interval
  if (window.userSimulationInterval) clearInterval(window.userSimulationInterval);
  window.userSimulationInterval = setInterval(() => {
    // Decrease level; slower rate than doctor page for home use
    const decrement = 0.1 + (userBed.flowRate / 1000);
    userBed.level -= decrement;
    if (userBed.level < 0) userBed.level = 0;
    // If bag is empty and we haven't alerted yet, trigger alert
    if (userBed.level <= 0 && !alerted) {
      alerted = true;
      handleEmpty();
    }
    // Update UI
    renderDevice();
  }, 2000);
}

// Event listener for logout: clear role and redirect to home page
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('role');
    window.location.href = 'index.html';
  });
}

// Open patient modal: similar to doctor page but using userBed information
function openPatientModal(bed) {
  // Load patient data
  let patients = {};
  const raw = localStorage.getItem('patients');
  if (raw) {
    try {
      patients = JSON.parse(raw);
    } catch {
      patients = {};
    }
  }
  const key = `${bed.floor}-${bed.bed}`;
  const info = patients[key];
  // Clear previous content
  if (patientInfo) patientInfo.innerHTML = '';
  // Build detail list or show no data
  if (info) {
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
  // Close handlers
  if (patientClose) patientClose.onclick = closePatientModal;
  if (patientModalOverlay) patientModalOverlay.onclick = closePatientModal;
  // Start webcam and detection
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      currentStream = stream;
      if (patientVideo) patientVideo.srcObject = stream;
      startMotionDetection();
      const startPoseIfReady = () => {
        if (patientVideo.videoWidth && patientVideo.videoHeight) {
          startPoseDetection();
        } else {
          requestAnimationFrame(startPoseIfReady);
        }
      };
      startPoseIfReady();
    }).catch(() => {
      if (patientVideo) patientVideo.removeAttribute('srcObject');
    });
  }
}

function closePatientModal() {
  patientModalOverlay.classList.add('hidden');
  patientModal.classList.add('hidden');
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  if (patientVideo) patientVideo.srcObject = null;
  stopMotionDetection();
  stopPoseDetection();
}

function translateGender(code) {
  if (code === 'male') return t('patientGenderMale');
  if (code === 'female') return t('patientGenderFemale');
  if (code === 'other') return t('patientGenderOther');
  return code;
}

// Detection alert (inside patient modal)
function showDetectionAlert(key) {
  const detectionAlert = document.getElementById('detectionAlert');
  if (!detectionAlert) return;
  const isVisible = !detectionAlert.classList.contains('hidden');
  detectionAlert.textContent = t(key);
  if (!isVisible) {
    detectionAlert.classList.remove('hidden');
    playBeep();
    setTimeout(() => {
      detectionAlert.classList.add('hidden');
    }, 4000);
  }
}

// Motion detection using frame differencing
function startMotionDetection() {
  prevFrameData = null;
  if (motionDetectionInterval) clearInterval(motionDetectionInterval);
  motionCanvas = document.createElement('canvas');
  motionCtx = motionCanvas.getContext('2d');
  motionDetectionInterval = setInterval(detectMotion, 1000);
}

function stopMotionDetection() {
  if (motionDetectionInterval) {
    clearInterval(motionDetectionInterval);
    motionDetectionInterval = null;
  }
  prevFrameData = null;
}

function detectMotion() {
  if (!patientVideo || !patientVideo.videoWidth || !patientVideo.videoHeight) return;
  motionCanvas.width = patientVideo.videoWidth;
  motionCanvas.height = patientVideo.videoHeight;
  motionCtx.drawImage(patientVideo, 0, 0, motionCanvas.width, motionCanvas.height);
  const frame = motionCtx.getImageData(0, 0, motionCanvas.width, motionCanvas.height).data;
  if (prevFrameData && frame.length === prevFrameData.length) {
    let diffSum = 0;
    const len = frame.length;
    for (let i = 0; i < len; i += 4) {
      const r = frame[i];
      const g = frame[i + 1];
      const b = frame[i + 2];
      const pr = prevFrameData[i];
      const pg = prevFrameData[i + 1];
      const pb = prevFrameData[i + 2];
      const diff = Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);
      diffSum += diff;
    }
    const avgDiff = diffSum / (len / 4);
    if (avgDiff > 50) {
      showDetectionAlert('movementAlert');
    }
  }
  prevFrameData = new Uint8ClampedArray(frame);
}

// Pose detection for nose movement
function startPoseDetection() {
  if (poseDetectionActive) return;
  poseDetectionActive = true;
  poseCanvas = poseCanvasEl;
  if (!poseCanvas) {
    poseDetectionActive = false;
    return;
  }
  poseCtx = poseCanvas.getContext('2d');
  if (!pose) {
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
  camera.start();
  prevNose = null;
}

function stopPoseDetection() {
  if (!poseDetectionActive) return;
  poseDetectionActive = false;
  if (camera) {
    try { camera.stop(); } catch (e) {}
  }
  prevNose = null;
  if (poseCanvas && poseCtx) {
    poseCtx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
  }
}

function onPoseResults(results) {
  if (!poseDetectionActive || !poseCanvas || !poseCtx) return;
  poseCanvas.width = patientVideo.videoWidth;
  poseCanvas.height = patientVideo.videoHeight;
  poseCtx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
  if (results.poseLandmarks) {
    try {
      const connections = Pose.POSE_CONNECTIONS;
      drawConnectors(poseCtx, results.poseLandmarks, connections, { color: '#00FF00', lineWidth: 2 });
      drawLandmarks(poseCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
    } catch (e) {}
    const nose = results.poseLandmarks[0];
    if (nose && typeof nose.x === 'number' && typeof nose.y === 'number') {
      if (prevNose) {
        const dx = nose.x - prevNose.x;
        const dy = nose.y - prevNose.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.05) {
          showDetectionAlert('movementAlert');
        }
      }
      prevNose = { x: nose.x, y: nose.y };
    }
  }
}

// Initialise user dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
  renderDevice();
  // Delay simulation start slightly to allow for user gesture on audio context
  setTimeout(() => {
    startSimulation();
  }, 500);
  // Handle language change updates for dynamic content
  if (window.languageChangeHandlers) {
    window.languageChangeHandlers.push(() => {
      renderDevice();
    });
  }
});