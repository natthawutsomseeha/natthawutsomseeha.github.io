/*
 * Language and theme management script
 *
 * This module defines a simple internationalisation (i18n) framework and a
 * dark‑mode theme switcher for the IV alert dashboard. It exposes a global
 * function `t(key)` which returns the appropriate translation for the
 * currently selected language, and utilities to initialise the language
 * selector, apply static translations to elements annotated with
 * `data-i18n`, and toggle a dark theme.
 */

// Translation dictionary. Each key corresponds to a string identifier
// used throughout the site. Languages supported: Thai (th), English (en)
// and Lao (la). Where Lao translations are approximate, Thai phrasing is
// reused or transliterated. Keys containing placeholders (e.g. {floor})
// should be interpolated when used.
const translations = {
  th: {
    navHome: 'หน้าแรก',
    navDashboard: 'แดชบอร์ด',
    navDevices: 'อุปกรณ์',
    navReports: 'รายงาน',
    navStaff: 'เจ้าหน้าที่',
    homeTitle: 'ยินดีต้อนรับสู่ระบบแจ้งเตือนระดับน้ำเกลือ',
    homeDescription: 'ระบบนี้ออกแบบมาเพื่อช่วยแพทย์และพยาบาลมอนิเตอร์ระดับน้ำเกลือและอัตราการไหลของสารน้ำแบบเรียลไทม์ ลดภาระงานและเพิ่มความปลอดภัยแก่ผู้ป่วย',
    homeGoDashboard: 'ไปที่แดชบอร์ด',
    homeManageDevices: 'จัดการอุปกรณ์',
    homeViewReports: 'ดูรายงาน',
    homeManageStaff: 'จัดการเจ้าหน้าที่',
    selectFloor: 'เลือกชั้น:',
    selectBed: 'เลือกเตียง:',
    testButton: 'ทดสอบ',
    bed: 'เตียง',
    patient: 'ผู้ป่วย',
    fluidType: 'สาร',
    level: 'ระดับ',
    flowRate: 'อัตราไหล',
    highFlowRate: 'อัตราไหลเร็ว',
    changeBag: 'เปลี่ยนถุงแล้ว',
    allFloors: 'ทุกชั้น',
    floor: 'ชั้น',
    room: 'ห้อง',
    testAlert: 'กำลังทดสอบ: ชั้น {floor} เตียง {bed} ถูกตั้งค่าใกล้หมด (2%)',
    confirmChange: 'ยืนยันเปลี่ยนถุง: เตียง {floor}-{bed}',
    bagEmpty: 'ถุงน้ำเกลือหมด: ชั้น {floor} เตียง {bed}',
    staffNotify: 'แจ้งเตือนผู้ดูแลชั้น {floor}: {recipients}',
    noStaff: 'ไม่พบผู้ดูแลสำหรับชั้น {floor}',
    manageDevices: 'จัดการอุปกรณ์',
    guidanceText: 'คำแนะนำ: โปรดติดตั้งเซนเซอร์ตรวจจับระดับน้ำเกลือให้ถูกต้อง โดยวางเซนเซอร์ที่ด้านล่างของถุงน้ำเกลือ และตรวจสอบการเชื่อมต่อก่อนใช้งาน ท่านสามารถใช้ปุ่ม \"ทดสอบอุปกรณ์\" เพื่อทดสอบการเชื่อมต่อของแต่ละอุปกรณ์',
    testDevice: 'ทดสอบอุปกรณ์',
    online: 'ออนไลน์',
    offline: 'ออฟไลน์',
    battery: 'แบตเตอรี่: {value}%',
    reportsTitle: 'รายงานสรุป',
    reportsDescription: 'กราฟด้านล่างแสดงจำนวนการแจ้งเตือนถุงน้ำเกลือใกล้หมดในแต่ละวัน',
    alertCount: 'จำนวนถุงใกล้หมด',
    trendTitle: 'แนวโน้มการแจ้งเตือนถุงน้ำเกลือใกล้หมดในรอบสัปดาห์',
    day: 'วัน',
    alertNumber: 'จำนวนการแจ้งเตือน',
    monday: 'จันทร์',
    tuesday: 'อังคาร',
    wednesday: 'พุธ',
    thursday: 'พฤหัส',
    friday: 'ศุกร์',
    saturday: 'เสาร์',
    sunday: 'อาทิตย์',
    manageStaff: 'กำหนดและจัดการเจ้าหน้าที่',
    staffName: 'ชื่อเจ้าหน้าที่:',
    staffContact: 'ติดต่อ:',
    staffFloor: 'ชั้นที่ดูแล:',
    addStaff: 'เพิ่มเจ้าหน้าที่',
    registeredStaff: 'รายชื่อเจ้าหน้าที่ที่ลงทะเบียน',
    columnName: 'ชื่อ',
    columnContact: 'ติดต่อ',
    columnFloor: 'ชั้น',
    columnActions: 'การจัดการ',
    delete: 'ลบ',
    noStaffRegistered: 'ยังไม่มีเจ้าหน้าที่ถูกลงทะเบียน',
    fillAllFields: 'กรุณากรอกข้อมูลให้ครบถ้วน',
    darkMode: 'โหมดมืด',
    lightMode: 'โหมดสว่าง'
    ,
    navLangTh: 'ไทย',
    navLangEn: 'English',
    navLangLa: 'ລາວ'

    ,
    // Generic labels
    close: 'ปิด'

    ,
    /* Patient management translations */
    navPatients: 'ผู้ป่วย',
    managePatients: 'ลงทะเบียนผู้ป่วย',
    patientFormTitle: 'บันทึกข้อมูลผู้ป่วย',
    patientName: 'ชื่อผู้ป่วย:',
    patientID: 'รหัสผู้ป่วย:',
    patientAge: 'อายุ:',
    patientGender: 'เพศ:',
    patientGenderMale: 'ชาย',
    patientGenderFemale: 'หญิง',
    patientGenderOther: 'อื่น',
    patientFloor: 'ชั้น:',
    patientBed: 'เตียง:',
    patientDiagnosis: 'การวินิจฉัย:',
    patientMedication: 'ยา/การรักษา:',
    patientAllergies: 'ประวัติแพ้ยา:',
    patientHeartRate: 'อัตราการเต้นหัวใจ (bpm):',
    patientBloodPressure: 'ความดันเลือด (mmHg):',
    patientHeight: 'ความสูง (ซม.):',
    patientWeight: 'น้ำหนัก (กก.):',
    patientOxygen: 'เปอร์เซ็นต์ออกซิเจนในเลือด (%):',
    patientRespiration: 'อัตราการหายใจ (ครั้ง/นาที):',
    patientNotes: 'หมายเหตุ:',
    savePatient: 'บันทึกผู้ป่วย',
    patientSaved: 'บันทึกข้อมูลผู้ป่วยเรียบร้อย',
    patientDetails: 'รายละเอียดผู้ป่วย',
    noPatientData: 'ไม่มีข้อมูลผู้ป่วย'
    ,
    /* Detection alerts */
    movementAlert: 'ตรวจพบการเคลื่อนไหวผิดปกติ!',
    allergyAlert: 'ตรวจพบผื่นแพ้หรืออาการผิดปกติ!'

    ,
    /* Role selection and user dashboard */
    selectRole: 'เลือกบทบาทผู้ใช้',
    doctorRole: 'แพทย์/พยาบาล',
    userRole: 'ผู้ใช้ทั่วไป',
    doctorDescription: 'สำหรับเจ้าหน้าที่โรงพยาบาลเพื่อดูแลผู้ป่วยและอุปกรณ์ทั้งหมด',
    userDescription: 'สำหรับผู้ใช้ทั่วไปที่ซื้ออุปกรณ์ไปใช้งานที่บ้าน',
    continueAs: 'เข้าสู่ระบบ',
    userDashboardTitle: 'แดชบอร์ดผู้ใช้',
    userDashboardDescription: 'ตรวจสอบถุงน้ำเกลือและกล้องวงจรปิดของคุณที่บ้าน',
    myDevice: 'อุปกรณ์ของฉัน',
    noDevice: 'ยังไม่มีอุปกรณ์เชื่อมต่อ',
    purchaseDevice: 'สั่งซื้ออุปกรณ์',
    logout: 'ออกจากระบบ',
    navContact: 'ติดต่อเรา',
    contactTitle: 'ช่องทางการติดต่อ',
    contactDescription: 'หากคุณต้องการความช่วยเหลือเกี่ยวกับอุปกรณ์หรือระบบ กรุณาติดต่อทีมสนับสนุนผ่านช่องทางด้านล่าง',
    supportEmail: 'อีเมล: support@example.com',
    supportPhone: 'โทรศัพท์: 1234-567-890'
  },
  en: {
    navHome: 'Home',
    navDashboard: 'Dashboard',
    navDevices: 'Devices',
    navReports: 'Reports',
    navStaff: 'Staff',
    homeTitle: 'Welcome to the IV Alert System',
    homeDescription: 'This system is designed to help doctors and nurses monitor saline levels and fluid flow rates in real‑time, reducing workload and increasing patient safety.',
    homeGoDashboard: 'Go to Dashboard',
    homeManageDevices: 'Manage Devices',
    homeViewReports: 'View Reports',
    homeManageStaff: 'Manage Staff',
    selectFloor: 'Select Floor:',
    selectBed: 'Select Bed:',
    testButton: 'Test',
    bed: 'Bed',
    patient: 'Patient',
    fluidType: 'Fluid',
    level: 'Level',
    flowRate: 'Flow Rate',
    highFlowRate: 'High Flow Rate',
    changeBag: 'Bag Changed',
    allFloors: 'All Floors',
    floor: 'Floor',
    room: 'Room',
    testAlert: 'Testing: Floor {floor} Bed {bed} set to near empty (2%)',
    confirmChange: 'Confirm bag change: Bed {floor}-{bed}',
    bagEmpty: 'IV bag empty: Floor {floor} Bed {bed}',
    staffNotify: 'Notify staff on floor {floor}: {recipients}',
    noStaff: 'No staff assigned for floor {floor}',
    manageDevices: 'Manage Devices',
    guidanceText: 'Guidance: Please install the saline level sensor correctly by placing it at the bottom of the IV bag and check connectivity before use. You can use the “Test Device” button to test each device’s connection.',
    testDevice: 'Test Device',
    online: 'Online',
    offline: 'Offline',
    battery: 'Battery: {value}%',
    reportsTitle: 'Summary Report',
    reportsDescription: 'The graph below shows the number of near‑empty IV bag alerts each day.',
    alertCount: 'Number of Near‑Empty Bags',
    trendTitle: 'Trend of Near‑Empty IV Bag Alerts Over the Week',
    day: 'Day',
    alertNumber: 'Number of Alerts',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    manageStaff: 'Assign and Manage Staff',
    staffName: 'Staff Name:',
    staffContact: 'Contact:',
    staffFloor: 'Floor:',
    addStaff: 'Add Staff',
    registeredStaff: 'Registered Staff',
    columnName: 'Name',
    columnContact: 'Contact',
    columnFloor: 'Floor',
    columnActions: 'Actions',
    delete: 'Delete',
    noStaffRegistered: 'No staff registered yet',
    fillAllFields: 'Please complete all fields',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode'
    ,
    navLangTh: 'Thai',
    navLangEn: 'English',
    navLangLa: 'Lao'

    ,
    // Generic labels
    close: 'Close'

    ,
    /* Patient management translations */
    navPatients: 'Patients',
    managePatients: 'Manage Patients',
    patientFormTitle: 'Patient Registration',
    patientName: 'Patient Name:',
    patientID: 'Patient ID:',
    patientAge: 'Age:',
    patientGender: 'Gender:',
    patientGenderMale: 'Male',
    patientGenderFemale: 'Female',
    patientGenderOther: 'Other',
    patientFloor: 'Floor:',
    patientBed: 'Bed:',
    patientDiagnosis: 'Diagnosis:',
    patientMedication: 'Medication/Treatment:',
    patientAllergies: 'Allergies:',
    patientHeartRate: 'Heart Rate (bpm):',
    patientBloodPressure: 'Blood Pressure (mmHg):',
    patientHeight: 'Height (cm):',
    patientWeight: 'Weight (kg):',
    patientOxygen: 'Blood Oxygen Saturation (%):',
    patientRespiration: 'Respiratory Rate (breaths/min):',
    patientNotes: 'Notes:',
    savePatient: 'Save Patient',
    patientSaved: 'Patient data saved successfully',
    patientDetails: 'Patient Details',
    noPatientData: 'No patient data'
    ,
    /* Detection alerts */
    movementAlert: 'Abnormal movement detected!',
    allergyAlert: 'Possible allergic reaction detected!'

    ,
    /* Role selection and user dashboard */
    selectRole: 'Select user role',
    doctorRole: 'Doctor/Nurse',
    userRole: 'Home User',
    doctorDescription: 'For hospital staff to manage all patients and devices',
    userDescription: 'For individuals who purchase the device for home use',
    continueAs: 'Continue as',
    userDashboardTitle: 'User Dashboard',
    userDashboardDescription: 'Monitor your IV bag and camera at home',
    myDevice: 'My Device',
    noDevice: 'No device connected yet',
    purchaseDevice: 'Purchase Device',
    logout: 'Logout',
    navContact: 'Contact Us',
    contactTitle: 'Contact Support',
    contactDescription: 'If you need assistance with the device or system, please contact our support team via the methods below.',
    supportEmail: 'Email: support@example.com',
    supportPhone: 'Phone: 123-456-7890'
  },
  la: {
    navHome: 'ໜ້າຫຼັກ',
    navDashboard: 'ແດດບອດ',
    navDevices: 'ອຸປະກອນ',
    navReports: 'ລາຍງານ',
    navStaff: 'ພະນັກງານ',
    homeTitle: 'ຍິນດີຕ້ອນຮັບສູ່ລະບົບແຈ້ງເຕືອນລະດັບນໍ້າເກືອ',
    homeDescription: 'ລະບົບນີ້ອອກແບບເພື່ອຊ່ວຍແພດແລະພະຍາບານຕິດຕາມລະດັບນໍ້າເກືອແລະອັດຕາການໄຫຼຂອງຂອງເຫຼວໃນເວລາຈິງ, ລົດພາລະການແລະເພີ່ມຄວາມປອດໄພແກ່ຜູ້ປ່ວຍ.',
    homeGoDashboard: 'ໄປທີ່ແດດບອດ',
    homeManageDevices: 'ຈັດການອຸປະກອນ',
    homeViewReports: 'ເບິ່ງລາຍງານ',
    homeManageStaff: 'ຈັດການພະນັກງານ',
    selectFloor: 'ເລືອກຊັ້ນ:',
    selectBed: 'ເລືອກຕຽງ:',
    testButton: 'ທົດສອບ',
    bed: 'ເຕັງ',
    patient: 'ຜູ້ປ່ວຍ',
    fluidType: 'ສານ',
    level: 'ລະດັບ',
    flowRate: 'ອັດຕາໄຫຼ',
    highFlowRate: 'ອັດຕາໄຫຼໄວ',
    changeBag: 'ປ່ຽນຖົງແລ້ວ',
    allFloors: 'ທຸກຊັ້ນ',
    floor: 'ຊັ້ນ',
    room: 'ຫ້ອງ',
    testAlert: 'ກຳລັງທົດສອບ: ຊັ້ນ {floor} ເຕັງ {bed} ຖືກຕັ້ງຄ່າໃກ້ຫມົດ (2%)',
    confirmChange: 'ຢືນຢັນການປ່ຽນຖົງ: ເຕັງ {floor}-{bed}',
    bagEmpty: 'ຖົງນໍ້າເກືອຫມົດ: ຊັ້ນ {floor} ເຕັງ {bed}',
    staffNotify: 'ແຈ້ງເຕືອນພະນັກງານຊັ້ນ {floor}: {recipients}',
    noStaff: 'ບໍ່ພົບພະນັກງານສໍາລັບຊັ້ນ {floor}',
    manageDevices: 'ຈັດການອຸປະກອນ',
    guidanceText: 'ຄໍານໍາ: ກະລຸນາຕິດຕັ້ງເ຋ັນເຊີຣກວດລະດັບນໍ້າເກືອໃຫ້ຖືກຕ້ອງ ໂດຍວາງເຊັນເຊີຣໃສ່ທ້າຍຖົງນໍ້າເກືອ ແລະກວດສອບການເຊື່ອມຕໍ່ກ່ອນໃຊ້ງານ ທ່ານສາມາດໃຊ້ປຸ່ມ “ທົດສອບອຸປະກອນ” ເພື່ອທົດສອບການເຊື່ອມຕໍ່ຂອງແຕ່ລະອຸປະກອນ',
    testDevice: 'ທົດສອບອຸປະກອນ',
    online: 'ອອນໄລນ໌',
    offline: 'ອອບໄລນ໌',
    battery: 'ແບັດເຕີຣີ: {value}%',
    reportsTitle: 'ລາຍງານສະຫຼຸບ',
    reportsDescription: 'ກາຟດ້ານລຸ່ມສະແດງຈໍານວນການແຈ້ງເຕືອນຖົງນໍ້າເກືອໃກ້ຫມົດໃນແຕ່ລະມື້',
    alertCount: 'ຈໍານວນຖົງໃກ້ຫມົດ',
    trendTitle: 'ແນວໂນ້ມການແຈ້ງເຕືອນຖົງນໍ້າເກືອໃກ້ຫມົດໃນອາທິດ',
    day: 'ມື້',
    alertNumber: 'ຈໍານວນການແຈ້ງເຕືອນ',
    monday: 'ຈັນ',
    tuesday: 'ອັງຄານ',
    wednesday: 'ພຸດ',
    thursday: 'ພະຫັດ',
    friday: 'ສຸກ',
    saturday: 'ເສົາ',
    sunday: 'ອາທິດ',
    manageStaff: 'ກໍານົດແລະຈັດການພະນັກງານ',
    staffName: 'ຊື່ພະນັກງານ:',
    staffContact: 'ຕິດຕໍ່:',
    staffFloor: 'ຊັ້ນ:',
    addStaff: 'ເພີ່ມພະນັກງານ',
    registeredStaff: 'ລາຍຊື່ພະນັກງານທີ່ລົງທະບຽນ',
    columnName: 'ຊື່',
    columnContact: 'ຕິດຕໍ່',
    columnFloor: 'ຊັ້ນ',
    columnActions: 'ຈັດການ',
    delete: 'ລຶບ',
    noStaffRegistered: 'ຍັງບໍ່ມີພະນັກງານໄດ້ລົງທະບຽນ',
    fillAllFields: 'ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບຖ້ວນ',
    darkMode: 'ໂມດມືດ',
    lightMode: 'ໂມດແສງ'
    ,
    navLangTh: 'ໄທ',
    navLangEn: 'ອັງກິດ',
    navLangLa: 'ລາວ'

    ,
    // Generic labels
    close: 'ປິດ'

    ,
    /* Patient management translations */
    navPatients: 'ຜູ້ປ່ວຍ',
    managePatients: 'ຈັດການຜູ້ປ່ວຍ',
    patientFormTitle: 'ການລົງທະບຽນຜູ້ປ່ວຍ',
    patientName: 'ຊື່ຜູ້ປ່ວຍ:',
    patientID: 'ລະຫັດຜູ້ປ່ວຍ:',
    patientAge: 'ອາຍຸ:',
    patientGender: 'ເພດ:',
    patientGenderMale: 'ຊາຍ',
    patientGenderFemale: 'ຍິງ',
    patientGenderOther: 'ອື່ນ',
    patientFloor: 'ຊັ້ນ:',
    patientBed: 'ເຕັງ:',
    patientDiagnosis: 'ການວິນິດໄຊ:',
    patientMedication: 'ຢາ/ການຮັກສາ:',
    patientAllergies: 'ປະຫວັດແພ້ຢາ:',
    patientHeartRate: 'ອັດຕາການເຕັ້ນຫົວໃຈ (bpm):',
    patientBloodPressure: 'ຄວາມດັນເລືອດ (mmHg):',
    patientHeight: 'ສູງ (ຊມ.):',
    patientWeight: 'ນ້ຳໜັກ (ກກ.):',
    patientOxygen: 'ອັດຕາອອກຊິເຈນໃນເລືອດ (%):',
    patientRespiration: 'ອັດຕາຫາຍໃຈ (ຄັ້ງ/ນາທີ):',
    patientNotes: 'ໝາຍເຫດ:',
    savePatient: 'ບັນທຶກຜູ້ປ່ວຍ',
    patientSaved: 'ບັນທຶກຂໍ້ມູນຜູ້ປ່ວຍສໍາເລັດ',
    patientDetails: 'ລາຍລະອຽດຜູ້ປ່ວຍ',
    noPatientData: 'ບໍ່ມີຂໍ້ມູນຜູ້ປ່ວຍ'
    ,
    /* Detection alerts */
    movementAlert: 'ພົບການເຄື່ອນໄຫວຜິດປົກກະຕິ!',
    allergyAlert: 'ອາດຈະແພ້ຢາ ຫຼືອາການຜິດປົກກະຕິ!'

    ,
    /* Role selection and user dashboard */
    selectRole: 'ເລືອກບົດບາດຜູ້ໃຊ້',
    doctorRole: 'ແພດ/ພະຍາບານ',
    userRole: 'ຜູ້ໃຊ້ທົ່ວໄປ',
    doctorDescription: 'ສໍາລັບພະນັກງານໂຮງພະຍາບານເພື່ອຈັດການຜູ້ປ່ວຍແລະອຸປະກອນທັງໝົດ',
    userDescription: 'ສໍາລັບບຸກຄົນທີ່ຊື້ອຸປະກອນໄປໃຊ້ທີ່ບ້ານ',
    continueAs: 'ເຂົ້າລະບົບຢູ່ບົດບາດ',
    userDashboardTitle: 'ແດດບອດຜູ້ໃຊ້',
    userDashboardDescription: 'ກວດສອບຖົງນໍ້າເກືອແລະກ້ອງຂອງທ່ານທີ່ບ້ານ',
    myDevice: 'ອຸປະກອນຂອງຂ້ອຍ',
    noDevice: 'ບໍ່ມີອຸປະກອນເຊື່ອມຕໍ່',
    purchaseDevice: 'ສັ່ງຊື້ອຸປະກອນ',
    logout: 'ອອກລະບົບ',
    navContact: 'ຕິດຕໍ່ພວກເຮົາ',
    contactTitle: 'ຊ່ອງທາງການຕິດຕໍ່',
    contactDescription: 'ຖ້າທ່ານຕ້ອງການຄວາມຊ່ວຍເຫຼືອກ່ອນພິສູດອຸປະກອນ ຫລື ລະບົບ ກະລຸນາຕິດຕໍ່ທີມສະໜັບສະໜູນຂອງພວກເຮົາໂດຍຜ່ານຊ່ອງທາງທີ່ລະບຸ',
    supportEmail: 'ອີເມວ: support@example.com',
    supportPhone: 'ໂທລະສັບ: 123-456-7890'
  }
};

// Current language; fallback to Thai if undefined
let currentLanguage = localStorage.getItem('language') || 'th';

/**
 * Translate a key to the current language. If the key is not found in the
 * selected language it falls back to Thai. If still not found, the key
 * itself is returned. Placeholders in the form {placeholder} are left
 * untouched – they should be replaced by the caller using `replace()`.
 *
 * @param {string} key - The translation key
 * @returns {string} The translated string
 */
function t(key) {
  const langDict = translations[currentLanguage] || translations.th;
  return langDict[key] || translations.th[key] || key;
}

/**
 * Apply translations to all elements annotated with the `data-i18n` attribute.
 * For inputs, the placeholder attribute is updated; for other elements the
 * text content is updated.
 */
function applyStaticTranslations() {
  document.documentElement.lang = currentLanguage;
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const translation = t(key);
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      // For form controls set the placeholder instead of text content
      if (typeof el.placeholder === 'string') {
        el.placeholder = translation;
      }
      // Do not overwrite text content of input elements
      return;
    }
    if (tag === 'option') {
      el.textContent = translation;
    } else {
      el.textContent = translation;
    }
  });
  // Update dark mode toggle text after translation
  updateDarkModeButton();
}

/**
 * Set the current language and persist it to localStorage. Reapply static
 * translations and call any registered dynamic handlers.
 *
 * @param {string} lang - New language code
 */
function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  applyStaticTranslations();
  // Call dynamic handlers to refresh content
  callLanguageChangeHandlers();
}

// Array of callbacks that pages can register to run when the language changes.
window.languageChangeHandlers = window.languageChangeHandlers || [];

/**
 * Call each registered language change handler. Catch and ignore errors
 * thrown by individual handlers so they don't interfere with one another.
 */
function callLanguageChangeHandlers() {
  window.languageChangeHandlers.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Error in language change handler:', e);
    }
  });
}

/**
 * Toggle dark mode on or off and persist the choice to localStorage. The
 * presence of the `dark-mode` class on the body element determines the
 * active theme. When toggled, the dark mode button text is updated.
 */
function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
  updateDarkModeButton();
}

/**
 * Initialise dark mode based on previously saved preference. If no
 * preference exists, the default is light mode.
 */
function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  if (saved === 'true') {
    document.body.classList.add('dark-mode');
  }
  updateDarkModeButton();
}

/**
 * Update the dark mode toggle button text according to the current theme and
 * language. If dark mode is active the button will show the label for
 * switching back to light mode; otherwise it shows the label for dark mode.
 */
function updateDarkModeButton() {
  const btn = document.getElementById('darkModeToggle');
  if (!btn) return;
  const isDark = document.body.classList.contains('dark-mode');
  btn.textContent = isDark ? t('lightMode') : t('darkMode');
}

/**
 * Initialise language and theme selectors. Should be called once on page
 * load. Sets up event listeners for the language select dropdown and the
 * dark mode toggle button.
 */
function initLanguage() {
  // Set the language select to the saved language
  const select = document.getElementById('languageSelect');
  if (select) {
    select.value = currentLanguage;
    select.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }
  // Attach dark mode toggle
  const darkBtn = document.getElementById('darkModeToggle');
  if (darkBtn) {
    darkBtn.addEventListener('click', toggleDarkMode);
  }
  // Apply saved theme
  initDarkMode();
  // Apply static translations on initial load
  applyStaticTranslations();
  // Register a handler to update the dark mode button when language changes
  if (window.languageChangeHandlers) {
    window.languageChangeHandlers.push(() => {
      updateDarkModeButton();
    });
  }
}

// Run initialisation when DOM is ready
document.addEventListener('DOMContentLoaded', initLanguage);