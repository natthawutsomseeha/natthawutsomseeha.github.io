// Sample data for devices
const devicesData = [
  { id: 'DEV-101', floor: 1, location: 'ห้อง 101', status: 'online', battery: 85 },
  { id: 'DEV-102', floor: 1, location: 'ห้อง 102', status: 'offline', battery: 20 },
  { id: 'DEV-201', floor: 2, location: 'ห้อง 201', status: 'online', battery: 60 },
  { id: 'DEV-202', floor: 2, location: 'ห้อง 202', status: 'online', battery: 75 },
  { id: 'DEV-301', floor: 3, location: 'ห้อง 301', status: 'offline', battery: 10 }
];

// DOM element for device cards
const devicesContainer = document.getElementById('devicesContainer');

// Render device cards
function renderDevices() {
  devicesContainer.innerHTML = '';
  devicesData.forEach(device => {
    const card = document.createElement('div');
    card.className = 'device-card';

    // Device heading
    const heading = document.createElement('h3');
    heading.textContent = device.id;
    card.appendChild(heading);

    // Floor and location. Attempt to translate 'floor' and 'room' labels
    const info = document.createElement('div');
    info.className = 'device-info';
    // Extract numeric part of location (assumes format like 'ห้อง 101')
    let locationNum = device.location;
    // Replace Thai word for room with translation, if present
    if (typeof locationNum === 'string') {
      // Remove common prefixes such as 'ห้อง' or whitespace
      const match = locationNum.match(/\d+/);
      const roomNumber = match ? match[0] : locationNum;
      info.textContent = `${t('floor')} ${device.floor} - ${t('room')} ${roomNumber}`;
    } else {
      info.textContent = `${t('floor')} ${device.floor}`;
    }
    card.appendChild(info);

    // Status
    const statusDiv = document.createElement('div');
    statusDiv.className = 'device-status';
    if (device.status === 'online') {
      statusDiv.textContent = t('online');
      statusDiv.classList.add('status-online');
    } else {
      statusDiv.textContent = t('offline');
      statusDiv.classList.add('status-offline');
    }
    card.appendChild(statusDiv);

    // Battery progress bar
    const batteryWrapper = document.createElement('div');
    batteryWrapper.className = 'battery-progress';
    const batteryBar = document.createElement('div');
    batteryBar.className = 'battery-bar';
    batteryBar.style.width = `${device.battery}%`;
    // Determine battery color
    if (device.battery > 50) {
      batteryBar.classList.add('battery-green');
    } else if (device.battery > 30) {
      batteryBar.classList.add('battery-yellow');
    } else {
      batteryBar.classList.add('battery-red');
    }
    batteryWrapper.appendChild(batteryBar);
    card.appendChild(batteryWrapper);

    // Battery text
    const batteryText = document.createElement('div');
    batteryText.className = 'battery-text';
    batteryText.textContent = t('battery').replace('{value}', device.battery);
    card.appendChild(batteryText);

    // Test button
    const testBtn = document.createElement('button');
    testBtn.className = 'device-test-button';
    testBtn.textContent = t('testDevice');
    testBtn.addEventListener('click', () => {
      alert(`${t('testDevice')}: ${device.id}`);
    });
    card.appendChild(testBtn);

    devicesContainer.appendChild(card);
  });
}

// Initialize devices list on page load
renderDevices();

// Register dynamic content refresh for language changes
if (window.languageChangeHandlers) {
  window.languageChangeHandlers.push(() => {
    renderDevices();
  });
}