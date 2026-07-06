const STORAGE_KEY = "maintenance-store-v2";
const BROWSER_BACKUP_KEY = `${STORAGE_KEY}-browser-backup`;
const FILE_STORAGE_ENDPOINT = "/api/state";
const FILE_EXPORT_ENDPOINT = "/api/export";
const FILE_PING_ENDPOINT = "/api/ping";
let fileStorageAvailable = false;
let shouldPersistInitialState = false;
let fileSaveTimer = null;
let fileSaveInFlight = Promise.resolve();
let filePingTimer = null;
let fileSaveRetryTimer = null;
let fileSaveFailed = false;

const i18n = {
  ar: {
    appName: "مستودع مواد الصيانة",
    projectName: "تشغيل وصيانة قصر العزيزية - الرياض",
    companyName: "شركة أو إيه إن - قسم الصيانة",
    navDashboard: "المتابعة", navItems: "المواد", navTransactions: "الحركات", navReports: "التقارير", navSettings: "التعريفات",
    dashboardTitle: "المتابعة", dashboardSub: "ملخص حركة مستودع مواد الصيانة والتنبيهات المهمة.",
    itemsTitle: "المواد وقطع الغيار", itemsSub: "تعريف المواد حسب القسم والتصنيف والموقع وحدود إعادة الطلب.",
    transactionsTitle: "حركات المستودع", transactionsSub: "إدخال وصرف مواد وتسويات للمباني والأقسام المستفيدة.",
    reportsTitle: "التقارير", reportsSub: "رصيد المواد والحركات مع شعار الشركة وجاهزية الطباعة والتصدير.",
    settingsTitle: "التعريفات", settingsSub: "الأقسام والتصنيفات والوحدات والمواقع والمباني المستفيدة.",
    backup: "نسخة احتياطية", restore: "استرجاع", issueMaterials: "طلب شراء مواد / قطع غيار",
    metricItems: "إجمالي المواد", metricStock: "إجمالي الرصيد", metricLow: "تحت حد الطلب", metricMonth: "حركات الشهر",
    lowStock: "مواد وقطع غيار القسم المختار", recent: "آخر الحركات",
    code: "الكود", item: "المادة", itemAr: "الاسم العربي", itemEn: "الاسم الإنجليزي", category: "التصنيف", department: "القسم",
    unit: "الوحدة", location: "الموقع", stock: "الرصيد", minQty: "الحد الأدنى", reorderQty: "كمية إعادة الطلب",
    date: "التاريخ", type: "النوع", qty: "الكمية", requestNo: "رقم الطلب", building: "المبنى", requestedBy: "الفني",
    notes: "ملاحظات", newItem: "مادة جديدة", newTransaction: "طلب شراء مواد / قطع غيار", exportStockExcel: "تصدير الرصيد Excel",
    exportTransExcel: "تصدير الحركات Excel", printReport: "طباعة التقرير", importBuildings: "استيراد المباني من Excel/CSV",
    buildingTemplate: "نموذج المباني", categories: "التصنيفات", departments: "الأقسام", units: "الوحدات", locations: "المواقع",
    buildings: "المباني المستفيدة", technicians: "الفنيون", transactionTypes: "أنواع الحركة", cancel: "إلغاء", save: "حفظ", nameAr: "الاسم العربي",
    nameEn: "الاسم الإنجليزي", buildingNo: "رقم المبنى", effect: "الأثر على الرصيد",
    searchItems: "بحث بالكود أو الاسم أو القسم أو الموقع", searchTransactions: "بحث في الحركات",
    noLowStock: "لا توجد مواد تحت حد الطلب", noTransactions: "لا توجد حركات بعد", noItems: "لا توجد مواد مطابقة",
    noRows: "لا توجد بيانات", savedItem: "تم حفظ المادة", savedTransaction: "تم حفظ الحركة", savedMaster: "تم حفظ التعريف",
    restored: "تم استرجاع النسخة", badFile: "تعذر قراءة الملف", buildingsImported: "تم استيراد المباني",
    editItem: "تعديل مادة", addItem: "مادة جديدة", editTransaction: "تعديل حركة", addTransaction: "طلب شراء مواد / قطع غيار صيانة", addMaster: "إضافة",
    noDepartment: "بدون قسم", noBuilding: "بدون مبنى",
    navRequests: "طلبات المواد", requestsTitle: "طلبات المواد وقطع الغيار", requestsSub: "طلبات المواد القديمة والجديدة بنفس منطق تقرير Materials Request.",
    searchRequests: "بحث برقم الطلب أو المبنى أو الوصف أو القسم", newRequest: "طلب مواد جديد", reqSerial: "رقم الطلب", site: "الموقع",
    itemsCount: "البنود", urgent: "عاجل", requestPreview: "معاينة الطلب", availableStore: "متوفر/المستودع", orderNo: "رقم الأمر",
    description: "الوصف", section: "القسم", supervisor: "المشرف", storekeeper: "أمين المستودع", signature: "التوقيع",
    printingDate: "تاريخ الطباعة", page: "صفحة", roomNo: "رقم الغرفة", close: "إغلاق", toPdf: "PDF", toExcel: "Excel",
    purchaseHint: "اختر القسم أولاً لعرض المواد وقطع الغيار والفنيين التابعين له. قائمة المباني كاملة ومتاحة للاختيار.",
    noTechnician: "بدون فني",
    edit: "تعديل",
    delete: "حذف",
    deleted: "تم الحذف",
    editBuilding: "تعديل مبنى",
    searchSettings: "بحث في كل التعريفات",
    allBuildings: "كل المباني",
    allDepartments: "كل الأقسام",
    newReport: "تقرير جديد",
    dateFromHint: "من يوم-شهر-سنة",
    dateToHint: "إلى يوم-شهر-سنة",
    reportScope: "نطاق التقرير",
    reportRequestSummary: "ملخص الطلبات",
    reportRequestCount: "هذه المواد تخص عدد {count} طلب حسب رقم الطلب، وعدد البنود المعروضة {lines} مادة / قطعة غيار. إجمالي الكمية المطلوبة {qty}، من المستودع {storeQty}، مرفوع للشراء {raisedQty}، تم شراؤه فعلياً {purchasedQty}، والمتبقي {remainingQty}.",
    requestedQty: "الكمية المطلوبة",
    storeQty: "كمية المستودع",
    raisedPurchaseQty: "كمية مرفوعة للشراء",
    actualPurchasedQty: "كمية تم شراؤها",
    remainingQty: "الكمية المتبقية",
    editMaster: "تعديل تعريف",
    purchase: "تم رفعه إلى الشراء",
    purchasedActual: "تم الشراء فعلياً",
    reportStock: "تقرير المخزون",
    reportDepartments: "تقرير الأقسام",
    reportBuilding: "تقرير المباني",
    reportStoreProvided: "مواد تم توفيرها من المستودع",
    reportPurchased: "مواد تم شراؤها",
    reportNotPurchased: "مواد لم يتم شراؤها",
    reportIncompletePurchase: "مواد لم يكتمل شراؤها",
    searchOrderNo: "رقم أمر الصيانة",
    searchStoreNo: "رقم طلب المستودع",
    searchBuildingNo: "رقم المبنى",
    storeProvidedCheck: "تم توفيرها من المستودع",
    urgentVip: "عاجل VIP",
    raisePurchase: "الرفع للشراء",
    reorderRemaining: "إعادة طلب مواد لم يتم شراؤها",
    originalRequestPreview: "معاينة الطلب الأصلي",
    reorderRequestPreview: "معاينة طلب الإعادة",
    fromOriginalRequest: "من الطلب الأصلي",
    editRequestLine: "تحرير",
    notPurchasedQty: "لم يتم شراؤها",
    deleteRequest: "حذف الطلب",
    passwordRequired: "أدخل كلمة مرور المستخدم الحالي",
    wrongPassword: "كلمة المرور غير صحيحة",
    noRemainingItems: "لا توجد مواد متبقية لم يتم شراؤها لهذا الطلب",
    reorderedRemaining: "تم إنشاء إعادة طلب للمواد المتبقية",
    duplicateReorder: "تم عمل إعادة طلب بنفس البيانات مسبقاً",
    searchBuildings: "بحث برقم المبنى أو اسم المبنى",
    confirmDelete: "هل تريد حذف هذا السجل؟",
    loginTitle: "تسجيل الدخول",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    login: "دخول",
    logout: "خروج",
    loginFailed: "اسم المستخدم أو كلمة المرور غير صحيحة",
    users: "المستخدمون",
    newUser: "مستخدم جديد",
    savedUser: "تم حفظ المستخدم",
    role: "الصلاحية",
    roleAdmin: "آدمن كامل",
    roleManager: "مشرف",
    roleEntry: "إدخال وتقارير",
    roleGuest: "\u0636\u064a\u0641",
    newMaterialName: "مادة غير موجودة",
    newMaterialNamePlaceholder: "اكتب اسم المادة أو قطعة الغيار لإضافتها تلقائياً",
    createdMaterial: "تمت إضافة المادة تلقائياً",
    requestAlerts: "تنبيهات الطلبات والتكرار",
    oldRequestAlert: "طلب مواد تجاوز 7 أيام",
    duplicateMaterialAlert: "تكرار مادة لنفس المبنى خلال 10 أيام",
    noRequestAlerts: "لا توجد تنبيهات طلبات حالياً",
  },
  en: {
    appName: "Maintenance Materials Store",
    projectName: "Operation & Maintenance of Al Aziziyah Palace - Riyadh",
    companyName: "OAN Company - Maintenance Department",
    navDashboard: "Dashboard", navItems: "Materials", navTransactions: "Transactions", navReports: "Reports", navSettings: "Setup",
    dashboardTitle: "Dashboard", dashboardSub: "Maintenance store activity, stock alerts, and recent material movements.",
    itemsTitle: "Materials & Spare Parts", itemsSub: "Maintain materials by department, category, location, and reorder limits.",
    transactionsTitle: "Store Transactions", transactionsSub: "Receive, issue, and adjust materials for beneficiary departments and buildings.",
    reportsTitle: "Reports", reportsSub: "Stock and transaction reports with company branding and Excel export.",
    settingsTitle: "Setup", settingsSub: "Departments, categories, units, locations, buildings, and transaction types.",
    backup: "Backup", restore: "Restore", issueMaterials: "Material / Spare Parts Purchase Request",
    metricItems: "Total Materials", metricStock: "Total Stock", metricLow: "Below Minimum", metricMonth: "Monthly Moves",
    lowStock: "Selected Department Materials & Spare Parts", recent: "Recent Transactions",
    code: "Code", item: "Material", itemAr: "Arabic Name", itemEn: "English Name", category: "Category", department: "Department",
    unit: "Unit", location: "Location", stock: "Stock", minQty: "Minimum", reorderQty: "Reorder Qty",
    date: "Date", type: "Type", qty: "Qty", requestNo: "Request No.", building: "Building", requestedBy: "Technician",
    notes: "Notes", newItem: "New Material", newTransaction: "Material / Spare Parts Purchase Request", exportStockExcel: "Export Stock Excel",
    exportTransExcel: "Export Transactions Excel", printReport: "Print Report", importBuildings: "Import Buildings from Excel/CSV",
    buildingTemplate: "Building Template", categories: "Categories", departments: "Departments", units: "Units", locations: "Locations",
    buildings: "Beneficiary Buildings", technicians: "Technicians", transactionTypes: "Transaction Types", cancel: "Cancel", save: "Save", nameAr: "Arabic Name",
    nameEn: "English Name", buildingNo: "Building No.", effect: "Stock Effect",
    searchItems: "Search by code, name, department, or location", searchTransactions: "Search transactions",
    noLowStock: "No materials below minimum", noTransactions: "No transactions yet", noItems: "No matching materials",
    noRows: "No data", savedItem: "Material saved", savedTransaction: "Transaction saved", savedMaster: "Setup item saved",
    restored: "Backup restored", badFile: "Could not read file", buildingsImported: "Buildings imported",
    editItem: "Edit Material", addItem: "New Material", editTransaction: "Edit Transaction", addTransaction: "Maintenance Materials / Spare Parts Purchase Request", addMaster: "Add",
    noDepartment: "No department", noBuilding: "No building",
    navRequests: "Requests", requestsTitle: "Materials & Spare Parts Requests", requestsSub: "Legacy and new material requests using the familiar Materials Request workflow.",
    searchRequests: "Search by request no., building, description, or section", newRequest: "New Materials Request", reqSerial: "Req. SN", site: "Site",
    itemsCount: "Lines", urgent: "Urgent", requestPreview: "Request Preview", availableStore: "Available/Store", orderNo: "Order No.",
    description: "Description", section: "Section", supervisor: "Supervisor", storekeeper: "Storekeeper", signature: "Signature",
    printingDate: "Printing date", page: "Page", roomNo: "Room No.", close: "Close", toPdf: "PDF", toExcel: "Excel",
    purchaseHint: "Select a department first to show its materials, spare parts, and technicians. All buildings remain available.",
    noTechnician: "No technician",
    edit: "Edit",
    delete: "Delete",
    deleted: "Deleted",
    editBuilding: "Edit Building",
    searchSettings: "Search all setup lists",
    allBuildings: "All buildings",
    allDepartments: "All departments",
    newReport: "New Report",
    dateFromHint: "From day-month-year",
    dateToHint: "To day-month-year",
    reportScope: "Report scope",
    reportRequestSummary: "Requests summary",
    reportRequestCount: "These materials belong to {count} request(s) by request number, with {lines} displayed material / spare-part line(s). Total requested qty {qty}, store qty {storeQty}, raised-to-purchase qty {raisedQty}, actually purchased qty {purchasedQty}, remaining qty {remainingQty}.",
    requestedQty: "Requested Qty",
    storeQty: "Store Qty",
    raisedPurchaseQty: "Raised Purchase Qty",
    actualPurchasedQty: "Purchased Qty",
    remainingQty: "Remaining Qty",
    editMaster: "Edit Setup Item",
    purchase: "Raised to Purchase",
    purchasedActual: "Actually Purchased",
    reportStock: "Stock Report",
    reportDepartments: "Departments Report",
    reportBuilding: "Buildings Report",
    reportStoreProvided: "Provided from Store",
    reportPurchased: "Purchased Materials",
    reportNotPurchased: "Not Purchased Materials",
    reportIncompletePurchase: "Incomplete Purchased Materials",
    searchOrderNo: "Maintenance order no.",
    searchStoreNo: "Store request no.",
    searchBuildingNo: "Building no.",
    storeProvidedCheck: "Provided from store",
    urgentVip: "Urgent VIP",
    raisePurchase: "Raise for purchase",
    reorderRemaining: "Reorder unpurchased materials",
    originalRequestPreview: "Original request preview",
    reorderRequestPreview: "Reorder request preview",
    fromOriginalRequest: "from original request",
    editRequestLine: "Edit",
    notPurchasedQty: "Not purchased",
    deleteRequest: "Delete request",
    passwordRequired: "Enter the current user's password",
    wrongPassword: "Incorrect password",
    noRemainingItems: "No remaining unpurchased materials for this request",
    reorderedRemaining: "Remaining material reorder created",
    duplicateReorder: "A reorder with the same details already exists",
    searchBuildings: "Search by building number or name",
    confirmDelete: "Delete this record?",
    loginTitle: "Login",
    username: "Username",
    password: "Password",
    login: "Login",
    logout: "Logout",
    loginFailed: "Invalid username or password",
    users: "Users",
    newUser: "New User",
    savedUser: "User saved",
    role: "Role",
    roleAdmin: "Full admin",
    roleManager: "Supervisor",
    roleEntry: "Entry & reports",
    roleGuest: "Guest",
    newMaterialName: "New material",
    newMaterialNamePlaceholder: "Type a material or spare part name to add it automatically",
    createdMaterial: "Material added automatically",
    requestAlerts: "Request & Duplicate Alerts",
    oldRequestAlert: "Material request older than 7 days",
    duplicateMaterialAlert: "Duplicate material for same building within 10 days",
    noRequestAlerts: "No request alerts now",
  },
};

const seedData = {
  language: "ar",
  users: [
    { id: "user-admin", username: "admin", password: "0000", displayName: "Admin", role: "admin" },
  ],
  categories: [
    entry("cat-1", "ELEC", "كهرباء", "Electrical"),
    entry("cat-2", "PLMB", "سباكة", "Plumbing"),
    entry("cat-3", "HVAC", "تكييف وتهوية", "HVAC"),
    entry("cat-4", "TOOLS", "عدد وأدوات", "Tools"),
    entry("cat-5", "CIVIL", "مدني وتشطيبات", "Civil & Finishing"),
    entry("cat-6", "SAFETY", "سلامة", "Safety"),
    entry("cat-7", "CARP", "نجارة", "Carpentry"),
    entry("cat-8", "PAINT", "دهانات", "Paints"),
    entry("cat-9", "BUILD", "بناء", "Building"),
  ],
  departments: [
    entry("dep-1", "ELEC", "قسم الكهرباء", "Electrical Section"),
    entry("dep-2", "PLMB", "قسم السباكة", "Plumbing Section"),
    entry("dep-3", "HVAC", "قسم التكييف", "HVAC Section"),
    entry("dep-4", "CARP", "نجارة", "Carpentry Section"),
    entry("dep-5", "PAINT", "دهانات", "Painting Section"),
    entry("dep-6", "BUILD", "بناء", "Masonry Section"),
    entry("dep-7", "GEN", "الصيانة العامة", "General Maintenance"),
  ],
  units: [
    entry("unit-1", "PCS", "حبة", "Piece"),
    entry("unit-2", "BOX", "علبة", "Box"),
    entry("unit-3", "M", "متر", "Meter"),
    entry("unit-4", "LTR", "لتر", "Liter"),
    entry("unit-5", "SET", "طقم", "Set"),
  ],
  locations: [
    entry("loc-1", "A-01", "رف A-01", "Rack A-01"),
    entry("loc-2", "A-02", "رف A-02", "Rack A-02"),
    entry("loc-3", "B-01", "رف B-01", "Rack B-01"),
    entry("loc-4", "C-01", "رف C-01", "Rack C-01"),
  ],
  buildings: [
    building("bld-1", "PAL", "القصر الرئيسي", "Main Palace", "1"),
    building("bld-2", "ADMIN", "مبنى الإدارة", "Administration Building", "2"),
    building("bld-3", "GUEST", "مبنى الضيافة", "Guest Building", "3"),
    building("bld-4", "SERV", "منطقة الخدمات", "Service Area", "4"),
  ],
  technicians: [],
  transactionTypes: [
    { ...entry("tt-1", "IN", "إدخال", "Receive"), effect: 1 },
    { ...entry("tt-2", "OUT", "صرف مواد", "Issue Materials"), effect: -1 },
    { ...entry("tt-3", "ADJ+", "تسوية زيادة", "Positive Adjustment"), effect: 1 },
    { ...entry("tt-4", "ADJ-", "تسوية نقص", "Negative Adjustment"), effect: -1 },
  ],
  items: [
    item("item-1", "EL-001", "لمبة LED 18W", "LED Lamp 18W", "cat-1", "dep-1", "unit-1", "loc-1", 20, 60),
    item("item-2", "EL-002", "قاطع كهرباء 20 أمبير", "Circuit Breaker 20A", "cat-1", "dep-1", "unit-1", "loc-1", 10, 30),
    item("item-3", "EL-003", "شريط عازل كهربائي", "Electrical Insulation Tape", "cat-1", "dep-1", "unit-1", "loc-2", 25, 80),
    item("item-4", "EL-004", "مفتاح إنارة", "Light Switch", "cat-1", "dep-1", "unit-1", "loc-2", 15, 45),
    item("item-5", "PL-001", "محبس زاوية", "Angle Valve", "cat-2", "dep-2", "unit-1", "loc-2", 12, 35),
    item("item-6", "PL-002", "خلاط مغسلة", "Basin Mixer", "cat-2", "dep-2", "unit-1", "loc-2", 6, 18),
    item("item-7", "PL-003", "جلدة خلاط", "Mixer Washer", "cat-2", "dep-2", "unit-1", "loc-3", 30, 100),
    item("item-8", "PL-004", "ماسورة PVC نصف بوصة", "PVC Pipe 1/2 Inch", "cat-2", "dep-2", "unit-3", "loc-3", 40, 120),
    item("item-9", "AC-001", "فلتر مكيف", "AC Filter", "cat-3", "dep-3", "unit-1", "loc-3", 25, 80),
    item("item-10", "AC-002", "ثرموستات", "Thermostat", "cat-3", "dep-3", "unit-1", "loc-3", 8, 20),
    item("item-11", "AC-003", "سير مكيف", "AC Belt", "cat-3", "dep-3", "unit-1", "loc-4", 10, 30),
    item("item-12", "AC-004", "منظف ملفات", "Coil Cleaner", "cat-3", "dep-3", "unit-4", "loc-4", 12, 36),
    item("item-13", "CV-001", "سيليكون شفاف", "Clear Silicone", "cat-5", "dep-4", "unit-1", "loc-4", 18, 50),
    item("item-14", "CV-002", "دهان أبيض", "White Paint", "cat-5", "dep-4", "unit-4", "loc-4", 10, 30),
    item("item-15", "CV-003", "مفصل باب", "Door Hinge", "cat-5", "dep-4", "unit-1", "loc-1", 20, 60),
    item("item-16", "TL-001", "مفك متعدد", "Multi Screwdriver", "cat-4", "dep-7", "unit-1", "loc-1", 5, 12),
    item("item-17", "TL-002", "كماشة", "Pliers", "cat-4", "dep-7", "unit-1", "loc-1", 5, 12),
    item("item-18", "SF-001", "قفازات سلامة", "Safety Gloves", "cat-6", "dep-7", "unit-1", "loc-2", 30, 100),
  ],
  transactions: [],
};

seedData.transactions = seedData.items.map((it, index) => ({
  id: `tr-open-${index + 1}`,
  date: today(-20 + (index % 8)),
  itemId: it.id,
  typeId: "tt-1",
  qty: Math.max(it.reorderQty, it.minQty + 10),
  departmentId: it.departmentId,
  buildingId: "bld-1",
  requestedBy: "",
  requestNo: `OPEN-${String(index + 1).padStart(3, "0")}`,
  remarks: "رصيد افتتاحي",
}));

let state = normalizeState(structuredClone(seedData));
let currentView = "dashboard";
let lang = state.language || "ar";
let currentUser = null;
let itemSearchTimer = null;

document.addEventListener("DOMContentLoaded", initializeApp);

async function initializeApp() {
  state = await loadInitialState();
  if ((location.protocol === "http:" || location.protocol === "https:") && !fileStorageAvailable) {
    showHostedStorageRequired();
    return;
  }
  if (!fileStorageAvailable && location.protocol !== "http:" && location.protocol !== "https:") {
    showPortableStorageRequired();
    return;
  }
  lang = state.language || "ar";
  bindAuth();
  bindNavigation();
  bindForms();
  bindActions();
  applyLanguage();
  restoreSession();
  render();
  if (shouldPersistInitialState) saveState();
  window.addEventListener("beforeunload", flushStateBeforeUnload);
  startPortableServerHeartbeat();
}

function entry(id, code, nameAr, nameEn) {
  return { id, code, nameAr, nameEn };
}

function building(id, code, nameAr, nameEn, number) {
  return { id, code, nameAr, nameEn, number };
}

function item(id, code, nameAr, nameEn, categoryId, departmentId, unitId, locationId, minQty, reorderQty) {
  return { id, code, nameAr, nameEn, categoryId, departmentId, unitId, locationId, minQty, reorderQty, notes: "" };
}

function today(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadState() {
  const saved = readBrowserSavedState();
  if (!saved) return normalizeState(structuredClone(seedData));
  return normalizeState({ ...structuredClone(seedData), ...saved });
}

function readBrowserSavedState() {
  let latest = null;
  [BROWSER_BACKUP_KEY, STORAGE_KEY].forEach((key) => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (!latest || stateSavedAt(parsed) > stateSavedAt(latest)) latest = parsed;
    } catch {}
  });
  return latest;
}

function stateSavedAt(data) {
  return Date.parse(data?.__clientSavedAt || data?.updatedAt || "") || 0;
}

function statePayload() {
  return {
    ...state,
    language: lang,
    __clientSavedAt: new Date().toISOString(),
  };
}

function persistBrowserMirror(payload = statePayload()) {
  try {
    localStorage.setItem(BROWSER_BACKUP_KEY, JSON.stringify(payload));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}

async function loadInitialState() {
  const browserSaved = readBrowserSavedState();
  if (location.protocol === "http:" || location.protocol === "https:") {
    try {
      const response = await fetch(FILE_STORAGE_ENDPOINT, { cache: "no-store" });
      if (response.ok) {
        fileStorageAvailable = true;
        if (response.status !== 204) {
          const text = await response.text();
          if (text.trim()) {
            const fileSaved = JSON.parse(text);
            return normalizeState({ ...structuredClone(seedData), ...fileSaved });
          }
        }
        if (browserSaved) return normalizeState({ ...structuredClone(seedData), ...browserSaved });
        shouldPersistInitialState = true;
      }
    } catch {
      fileStorageAvailable = false;
    }
  }
  if (browserSaved) return normalizeState({ ...structuredClone(seedData), ...browserSaved });
  return loadState();
}

function normalizeState(data) {
  ["users", "categories", "departments", "units", "locations", "buildings", "technicians", "transactionTypes", "items", "transactions"].forEach((key) => {
    if (!Array.isArray(data[key])) data[key] = structuredClone(seedData[key]);
  });
  mergeSeedEntries(data, "categories", ["CARP", "PAINT", "BUILD"]);
  if (!data.users.some((row) => row.username === "admin")) data.users.unshift(structuredClone(seedData.users[0]));
  ["deletedItemIds", "deletedBuildingIds", "deletedTechnicianIds", "deletedLegacyRequestNos"].forEach((key) => {
    if (!Array.isArray(data[key])) data[key] = [];
  });
  if (!Array.isArray(data.requestLineQtyOverrides)) data.requestLineQtyOverrides = [];
  if (!Array.isArray(data.reorderRequests)) data.reorderRequests = [];
  data.users = data.users.map((user) => normalizeUserRole(user));
  data.items = data.items.filter((row) => !isLegacyMaterialRow(row));
  return syncLegacyAccessLists(data);
}

function normalizeUserRole(user) {
  const role = user.username === "admin" ? "admin" : (["admin", "manager", "entry", "guest"].includes(user.role) ? user.role : "entry");
  return { ...user, role };
}

function mergeSeedEntries(data, key, codes) {
  const existingCodes = new Set((data[key] || []).map((row) => normalizeText(row.code)));
  seedData[key]
    .filter((row) => codes.includes(row.code) && !existingCodes.has(normalizeText(row.code)))
    .forEach((row) => data[key].push(structuredClone(row)));
}

function syncLegacyAccessLists(data) {
  const legacy = legacyData();
  const departments = legacyDepartments(legacy.sections || []);
  const buildings = (legacy.buildings || []).map((row) => building(
    `legacy-building-${row.Building_No}`,
    clean(row.Building_No || ""),
    row.Building || "",
    row.Building || "",
    clean(row.Building_No || ""),
  ));
  const technicians = (legacy.technicians || []).map((row) => ({
    id: `legacy-technician-${row.id}`,
    code: String(row.id || row.en_name || ""),
    nameAr: row.ar_name || row.en_name || "",
    nameEn: row.en_name || row.ar_name || "",
    departmentId: departmentIdForLegacySection(departments, row.section),
    job: row.job || "",
  }));

  if (departments.length) data.departments = departments;
  if (buildings.length) {
    const deletedBuildings = new Set(data.deletedBuildingIds || []);
    const seedBuildingIds = new Set(seedData.buildings.map((row) => row.id));
    const currentBuildings = new Map(data.buildings.map((row) => [row.id, row]));
    const customBuildings = data.buildings.filter((row) => !String(row.id || "").startsWith("legacy-building-") && !seedBuildingIds.has(row.id) && !deletedBuildings.has(row.id));
    data.buildings = [...buildings.filter((row) => !deletedBuildings.has(row.id)).map((row) => currentBuildings.get(row.id) || row), ...customBuildings];
  }
  if (technicians.length) {
    const deletedTechnicians = new Set(data.deletedTechnicianIds || []);
    const currentTechnicians = new Map(data.technicians.map((row) => [row.id, row]));
    const customTechnicians = data.technicians.filter((row) => !String(row.id || "").startsWith("legacy-technician-") && !deletedTechnicians.has(row.id));
    data.technicians = [
      ...technicians.filter((row) => !deletedTechnicians.has(row.id)).map((row) => currentTechnicians.get(row.id) || row),
      ...customTechnicians.filter((row) => !technicians.some((tech) => tech.id === row.id)),
    ];
  }
  const dedupedItems = dedupeMaterialItems(
    data.items.filter((row) => !isLegacyMaterialRow(row) && !(data.deletedItemIds || []).includes(row.id) && !isExampleRow(row)),
    data.departments,
  );
  data.items = enforceItemCodePrefixes(dedupedItems.items, data.departments);
  mergeInventoryCatalog(data);
  data.transactions = (data.transactions || []).map((row) => ({
    ...row,
    itemId: dedupedItems.idMap.get(row.itemId) || row.itemId,
  }));
  data.transactions = data.transactions.map((row) => normalizeTransactionRefs(row, data));
  data.departments = localizeDepartmentNames(data.departments);
  return data;
}

function localizeDepartmentNames(departments) {
  return departments.map((row) => ({ ...row, nameAr: arabicDepartmentName(row.nameEn || row.nameAr || row.code) || row.nameAr }));
}

function normalizeTransactionRefs(row, data) {
  const item = byId(data.items, row.itemId);
  const technician = (data.technicians || []).find((tech) => tech.nameEn === row.requestedBy || tech.nameAr === row.requestedBy);
  return {
    ...row,
    departmentId: item?.departmentId || (byId(data.departments, row.departmentId) ? row.departmentId : data.departments[0]?.id || ""),
    buildingId: byId(data.buildings, row.buildingId) ? row.buildingId : "",
    technicianId: row.technicianId || technician?.id || "",
  };
}

function dedupeMaterialItems(items, departments) {
  const canonical = new Map();
  const idMap = new Map();
  const unique = [];
  items.forEach((row) => {
    const key = materialKey(row.nameEn || row.nameAr, row.departmentId || departmentIdFromItemCode(row.code, departments));
    if (!key.split("|")[1]) {
      unique.push(row);
      return;
    }
    const original = canonical.get(key);
    if (!original) {
      canonical.set(key, row);
      unique.push(row);
      return;
    }
    idMap.set(row.id, original.id);
  });
  return { items: unique, idMap };
}

function departmentIdFromItemCode(code, departments) {
  const prefix = String(code || "").split("-")[0] || "";
  return departments.find((row) => departmentCodePrefix(row) === prefix)?.id || "";
}

function enforceItemCodePrefixes(items, departments) {
  return items.map((row) => {
    if (isInventoryCatalogRow(row)) return row;
    const prefix = departmentCodePrefix(byId(departments, row.departmentId));
    if (!prefix) return row;
    const suffix = itemCodeSuffix(row.code);
    return { ...row, code: `${prefix}-${suffix || nextNumericSuffix(items, prefix)}` };
  });
}

function inventoryCatalog() {
  return window.inventoryCatalogData || { items: [], openingTransactions: [] };
}

function isInventoryCatalogRow(row) {
  return row?.source === "inventory-xlsx" || String(row?.id || "").startsWith("inventory-");
}

function isLegacyMaterialRow(row) {
  const id = String(row?.id || "");
  const notes = normalizeText(row?.notes || "");
  return id.startsWith("legacy-material-") || notes.includes("imported from material request");
}

function approvedStoreItems() {
  return state.items.filter((row) => !isLegacyMaterialRow(row));
}

function isApprovedStoreItemId(itemId) {
  const row = byId(state.items, itemId);
  return Boolean(row && !isLegacyMaterialRow(row));
}

function approvedStoreTransactions() {
  return state.transactions.filter((row) => isApprovedStoreItemId(row.itemId));
}

function mergeInventoryCatalog(data) {
  const catalog = inventoryCatalog();
  if (!Array.isArray(catalog.items) || !catalog.items.length) return;
  const deletedItems = new Set(data.deletedItemIds || []);
  const existingById = new Map(data.items.map((row) => [row.id, row]));
  const existingCatalogCodes = new Set(
    data.items
      .filter((row) => isInventoryCatalogRow(row))
      .map((row) => normalizeText(row.code)),
  );
  catalog.items.forEach((row) => {
    if (!row?.id || deletedItems.has(row.id)) return;
    if (existingById.has(row.id)) return;
    if (existingCatalogCodes.has(normalizeText(row.code))) return;
    data.items.push(structuredClone(row));
    existingCatalogCodes.add(normalizeText(row.code));
  });

  if (!Array.isArray(catalog.openingTransactions) || !catalog.openingTransactions.length) return;
  const existingTransactionIds = new Set((data.transactions || []).map((row) => row.id));
  const itemIds = new Set(data.items.map((row) => row.id));
  catalog.openingTransactions.forEach((row) => {
    if (!row?.id || existingTransactionIds.has(row.id) || deletedItems.has(row.itemId) || !itemIds.has(row.itemId)) return;
    data.transactions.push(structuredClone(row));
    existingTransactionIds.add(row.id);
  });
}

function isExampleRow(row) {
  const values = [row.code, row.nameAr, row.nameEn].map((value) => normalizeText(value));
  return values.some((value) => value === "مثال 1" || value === "مثال 2" || value === "example 1" || value === "example 2" || value === "cg");
}

function departmentIdForLegacySection(departments, section) {
  const normalized = normalizeText(section);
  if (isLegacyCivilSection(section)) return departmentByCode(departments, "CARP")?.id || "";
  return departments.find((row) => normalizeText(row.nameEn) === normalized || normalizeText(row.nameAr) === normalized)?.id || "";
}

function legacyDepartments(sections) {
  return sections.flatMap((row) => {
    if (!isLegacyCivilSection(row.Section)) return [legacyDepartmentEntry(row)];
    return [
      entry(`legacy-section-${row.Ssn}-carp`, "CARP", "نجارة", "Carpentry Section"),
      entry(`legacy-section-${row.Ssn}-paint`, "PAINT", "دهانات", "Painting Section"),
      entry(`legacy-section-${row.Ssn}-build`, "BUILD", "بناء", "Masonry Section"),
    ];
  });
}

function legacyDepartmentEntry(row) {
  const section = row.Section || "";
  const code = slugCode(section || row.Ssn);
  return entry(`legacy-section-${row.Ssn}`, code, arabicDepartmentName(section), section);
}

function arabicDepartmentName(section) {
  const normalized = normalizeText(section);
  if (normalized === "a/c" || normalized.includes("hvac")) return "تكييف";
  if (normalized.includes("electrical")) return "كهرباء";
  if (normalized.includes("electronic")) return "إلكترونيات";
  if (normalized.includes("plumbing")) return "سباكة";
  if (normalized.includes("mechanical")) return "ميكانيكا ولحام";
  if (normalized.includes("cleaning")) return "فريق النظافة";
  if (normalized.includes("farmers")) return "فريق الزراعة";
  if (normalized.includes("operator")) return "مشغلون";
  if (normalized.includes("preventive")) return "الصيانة الوقائية";
  if (normalized.includes("purchases")) return "المشتريات";
  if (normalized.includes("services")) return "الخدمات";
  if (normalized.includes("store")) return "المستودع";
  if (normalized.includes("carpentry") || normalized.includes("carpenter")) return "نجارة";
  if (normalized.includes("painting") || normalized.includes("painter")) return "دهانات";
  if (normalized.includes("masonry") || normalized.includes("building")) return "بناء";
  if (normalized.includes("general")) return "الصيانة العامة";
  return section || "";
}

function isLegacyCivilSection(section) {
  const normalized = normalizeText(section);
  return normalized.includes("carpenter") && normalized.includes("mason") && normalized.includes("painter");
}

function departmentByCode(departments, code) {
  return departments.find((row) => normalizeText(row.code) === normalizeText(code));
}

function departmentIdForLegacyLine(departments, line) {
  if (!isLegacyCivilSection(line.section)) return departmentIdForLegacySection(departments, line.section);
  const description = normalizeText(line.descrption);
  const painterWords = ["paint", "roller", "brush", "thinner", "enamel", "sigma", "varnish", "stain", "putty", "sand paper", "tape", "plastic roll"];
  const masonWords = ["mason", "gypsum", "cement", "concrete", "tile", "grout", "block", "mortar", "marble", "ceramic"];
  const carpenterWords = ["wood", "door", "hinge", "lock", "handle", "cabinet", "plywood", "mdf", "screw", "blade"];
  if (painterWords.some((word) => description.includes(word))) return departmentByCode(departments, "PAINT")?.id || "";
  if (masonWords.some((word) => description.includes(word))) return departmentByCode(departments, "BUILD")?.id || "";
  if (carpenterWords.some((word) => description.includes(word))) return departmentByCode(departments, "CARP")?.id || "";
  return departmentByCode(departments, "CARP")?.id || "";
}

function categoryIdForDepartment(departmentId, departments = seedData.departments) {
  const department = byId(departments, departmentId);
  const name = normalizeText(department?.nameEn || department?.nameAr || "");
  const code = normalizeText(department?.code || "");
  if (code === "carp" || name.includes("carpentry")) return categoryByCode("CARP")?.id || "cat-7";
  if (code === "paint" || name.includes("painting")) return categoryByCode("PAINT")?.id || "cat-8";
  if (code === "build" || name.includes("masonry") || name.includes("building")) return categoryByCode("BUILD")?.id || "cat-9";
  const category = seedData.categories.find((row) => name.includes(normalizeText(row.nameEn)) || name.includes(normalizeText(row.code)));
  return category?.id || seedData.categories[0]?.id || "";
}

function categoryIdForLegacyLine(line, departmentId, departments) {
  const description = normalizeText(line.descrption);
  if (description.includes("paint") || description.includes("roller") || description.includes("brush") || description.includes("varnish") || description.includes("thinner") || description.includes("enamel") || description.includes("sigma")) {
    return categoryByCode("PAINT")?.id || "cat-8";
  }
  if (description.includes("gypsum") || description.includes("cement") || description.includes("tile") || description.includes("grout") || description.includes("mortar") || description.includes("ceramic")) {
    return categoryByCode("BUILD")?.id || "cat-9";
  }
  if (description.includes("wood") || description.includes("door") || description.includes("hinge") || description.includes("lock") || description.includes("handle") || description.includes("cabinet")) {
    return categoryByCode("CARP")?.id || "cat-7";
  }
  return categoryIdForDepartment(departmentId, departments);
}

function categoryByCode(code) {
  return seedData.categories.find((row) => normalizeText(row.code) === normalizeText(code));
}

function unitIdForLegacyType(type) {
  const normalized = normalizeText(type);
  const found = seedData.units.find((row) => normalizeText(row.code) === normalized || normalizeText(row.nameEn) === normalized || normalizeText(row.nameAr) === normalized);
  return found?.id || seedData.units[0]?.id || "";
}

function materialKey(description, departmentId) {
  return `${normalizeText(departmentId)}|${normalizeText(description)}`;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeSearchText(value) {
  return normalizeText(value).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function normalizeCodeSearch(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function slugCode(value) {
  return String(value || "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toUpperCase().slice(0, 24) || "ACCESS";
}

function departmentCodePrefix(department) {
  const source = department?.nameEn || department?.nameAr || department?.code || "";
  if (/^a\s*\/?\s*c$/i.test(String(source).trim()) || /hvac/i.test(String(source))) return "AC";
  if (/electrical/i.test(String(source))) return "EL";
  if (/plumbing/i.test(String(source))) return "PL";
  if (/carpenter|carpentry/i.test(String(source))) return "CA";
  if (/painter|painting/i.test(String(source))) return "PA";
  if (/mason|masonry|building/i.test(String(source))) return "BU";
  if (/civil/i.test(String(source))) return "CA";
  if (/mechanical|welding/i.test(String(source))) return "ME";
  if (/store/i.test(String(source))) return "ST";
  if (/purchas/i.test(String(source))) return "PU";
  if (/services/i.test(String(source))) return "SE";
  const ascii = String(source).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (ascii.length >= 2) return ascii.slice(0, 2);
  const code = String(department?.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return (ascii + code).slice(0, 2) || "MT";
}

function itemCodeSuffix(code) {
  const parts = String(code || "").toUpperCase().split("-");
  return clean(parts.length > 1 ? parts.slice(1).join("-") : parts[0]).replace(/[^A-Z0-9]/g, "") || "";
}

function nextItemCodeForDepartment(departmentId, items = state.items, departments = state.departments, preferredSuffix = "") {
  const prefix = departmentCodePrefix(byId(departments, departmentId));
  const suffix = clean(preferredSuffix).replace(/[^A-Z0-9]/gi, "").toUpperCase() || nextNumericSuffix(items, prefix);
  return `${prefix}-${suffix}`;
}

function codeWithDepartmentPrefix(code, departmentId) {
  const prefix = departmentCodePrefix(byId(state.departments, departmentId));
  return `${prefix}-${itemCodeSuffix(code) || nextNumericSuffix(state.items, prefix)}`;
}

function nextNumericSuffix(items, prefix) {
  const start = departmentCodeStart(prefix);
  const max = items
    .map((row) => String(row.code || "").toUpperCase())
    .filter((code) => code.startsWith(`${prefix}-`))
    .map((code) => Number(code.split("-").pop()))
    .filter((num) => Number.isFinite(num))
    .reduce((highest, num) => Math.max(highest, num), 0);
  return String(Math.max(max + 1, start)).padStart(5, "0");
}

function departmentCodeStart(prefix) {
  const starts = {
    AC: 40001,
    EL: 10001,
    PL: 20001,
    CA: 30001,
    CM: 30001,
    PA: 31001,
    BU: 32001,
    ME: 50001,
    ST: 60001,
    PU: 70001,
    SE: 80001,
  };
  return starts[prefix] || 90001;
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  return Math.abs(hash).toString(36);
}

function saveState() {
  state.language = lang;
  persistBrowserMirror();
  if (fileStorageAvailable) {
    queueFileStateSave();
  } else {
    persistBrowserState();
  }
}

function persistBrowserState() {
  persistBrowserMirror();
  if (location.protocol === "http:" || location.protocol === "https:") {
    scheduleFileSaveRetry();
  } else {
    showPortableStorageRequired();
  }
}

function startPortableServerHeartbeat() {
  stopPortableServerHeartbeat();
  const ping = () => {
    if (!fileStorageAvailable) return;
    fetch(FILE_PING_ENDPOINT, { cache: "no-store" }).catch(() => {});
  };
  ping();
  filePingTimer = setInterval(ping, 5000);
}

function stopPortableServerHeartbeat() {
  if (filePingTimer) clearInterval(filePingTimer);
  filePingTimer = null;
}

function scheduleFileSaveRetry() {
  if (fileSaveRetryTimer) return;
  fileSaveRetryTimer = setTimeout(() => {
    fileSaveRetryTimer = null;
    fileStorageAvailable = true;
    persistFileState();
  }, 2000);
}

function showPortableStorageRequired() {
  document.body.innerHTML = `
    <main class="storage-required-screen" dir="rtl">
      <section class="storage-required-card">
        <img src="assets/oan-logo.png" alt="OAN" class="login-logo" />
        <h1>تشغيل التطبيق من ملف التشغيل مطلوب</h1>
        <p>لضمان حفظ البيانات داخل مجلد التطبيق ونقلها من جهاز إلى جهاز، يجب تشغيل التطبيق من ملف:</p>
        <strong>تشغيل التطبيق.bat</strong>
        <p>لا تفتح ملف index.html مباشرة، لأن المتصفح لا يستطيع الحفظ داخل مجلد التطبيق بهذه الطريقة.</p>
        <p>بعد التشغيل الصحيح سيتم حفظ البيانات تلقائيًا في:</p>
        <strong>data/application-data.json</strong>
      </section>
    </main>`;
}

function showHostedStorageRequired() {
  document.body.innerHTML = `
    <main class="storage-required-screen" dir="rtl">
      <section class="storage-required-card">
        <img src="assets/oan-logo.png" alt="OAN" class="login-logo" />
        <h1>Server storage is required</h1>
        <p>This hosted version must run through the Node.js server so all users read and save the same server-side data.</p>
        <p>Please check that the hosting service is running and that <strong>/api/state</strong> is reachable.</p>
      </section>
    </main>`;
}

function queueFileStateSave() {
  clearTimeout(fileSaveTimer);
  fileSaveTimer = setTimeout(persistFileState, 250);
}

function persistFileState() {
  if (!fileStorageAvailable) return;
  const payload = JSON.stringify(statePayload());
  persistBrowserMirror(JSON.parse(payload));
  fileSaveInFlight = fileSaveInFlight.catch(() => {}).then(() => fetch(FILE_STORAGE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  })).then((response) => {
    if (!response.ok) throw new Error("File save failed");
    fileSaveFailed = false;
  }).catch(() => {
    fileSaveFailed = true;
    fileStorageAvailable = false;
    scheduleFileSaveRetry();
  });
}

function flushStateBeforeUnload() {
  clearTimeout(fileSaveTimer);
  try {
    const snapshot = statePayload();
    persistBrowserMirror(snapshot);
    if (!fileStorageAvailable) return;
    const payload = JSON.stringify(snapshot);
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(FILE_STORAGE_ENDPOINT, blob);
      return;
    }
    fetch(FILE_STORAGE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

function tr(key) {
  return i18n[lang][key] || i18n.ar[key] || key;
}

function labelOf(row) {
  if (!row) return "";
  return lang === "en" ? (row.nameEn || row.nameAr || row.name || "") : (row.nameAr || row.name || row.nameEn || "");
}

function itemLabel(row) {
  if (!row) return "";
  return lang === "en" ? (row.nameEn || row.nameAr) : (row.nameAr || row.nameEn);
}

function byId(list, id) {
  return list.find((entry) => entry.id === id);
}

function stockFor(itemId) {
  return state.transactions
    .filter((transaction) => transaction.itemId === itemId && !transaction.raisePurchase)
    .reduce((total, transaction) => {
      const type = byId(state.transactionTypes, transaction.typeId);
      return total + Number(transaction.qty || 0) * Number(type?.effect || 0);
    }, 0);
}

function isLowStock(item, stock = stockFor(item.id)) {
  return stock <= Number(item.minQty || 0);
}

function applyLanguage() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.getElementById("languageBtn").textContent = lang === "ar" ? "EN" : "عربي";
  document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = tr(node.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => { node.placeholder = tr(node.dataset.i18nPlaceholder); });
  const titles = {
    dashboard: ["dashboardTitle", "dashboardSub"],
    items: ["itemsTitle", "itemsSub"],
    transactions: ["transactionsTitle", "transactionsSub"],
    materialRequests: ["requestsTitle", "requestsSub"],
    reports: ["reportsTitle", "reportsSub"],
    settings: ["settingsTitle", "settingsSub"],
  };
  document.getElementById("viewTitle").textContent = tr(titles[currentView][0]);
  document.getElementById("viewSubtitle").textContent = tr(titles[currentView][1]);
}

function bindAuth() {
  document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const username = value("loginUsername");
    const password = value("loginPassword");
    const user = state.users.find((row) => row.username === username && row.password === password);
    if (!user) {
      document.getElementById("loginError").textContent = tr("loginFailed");
      return;
    }
    currentUser = user;
    sessionStorage.setItem(`${STORAGE_KEY}-session`, user.id);
    document.getElementById("loginError").textContent = "";
    updateAuthView();
  });
  document.getElementById("logoutBtn").addEventListener("click", () => {
    currentUser = null;
    sessionStorage.removeItem(`${STORAGE_KEY}-session`);
    updateAuthView();
  });
}

function restoreSession() {
  const id = sessionStorage.getItem(`${STORAGE_KEY}-session`);
  currentUser = byId(state.users, id) || null;
  updateAuthView();
}

function updateAuthView() {
  document.getElementById("loginScreen").classList.toggle("hidden", Boolean(currentUser));
  document.getElementById("appShell").classList.toggle("auth-locked", !currentUser);
  document.getElementById("currentUserBadge").textContent = currentUser ? (currentUser.displayName || currentUser.username) : "";
  applyPermissions();
}

function currentRole() {
  return currentUser?.username === "admin" ? "admin" : (currentUser?.role || "entry");
}

function isGuest() { return currentRole() === "guest"; }
function canViewDashboard() { return !isGuest(); }
function canViewReports() { return !isGuest(); }
function canEditRequests() { return !isGuest(); }
function canExportRequests() { return !isGuest(); }
function canManageUsers() { return currentRole() === "admin"; }
function canManageSetup() { return currentRole() === "admin" || currentRole() === "manager"; }
function canViewUsers() { return canManageSetup(); }
function canManageMaterials() { return currentRole() === "admin" || currentRole() === "manager"; }
function canSensitive() { return currentRole() === "admin"; }

function canAccessView(view) {
  if (view === "dashboard") return canViewDashboard();
  if (view === "items") return canManageMaterials();
  if (view === "reports") return canViewReports();
  if (view === "settings") return canManageSetup();
  return true;
}

function setVisible(selector, visible) {
  document.querySelectorAll(selector).forEach((node) => { node.style.display = visible ? "" : "none"; });
}

function applyPermissions() {
  if (!document.getElementById("appShell")) return;
  setVisible(".nav-tab[data-view='dashboard']", canViewDashboard());
  setVisible(".nav-tab[data-view='items']", canManageMaterials());
  setVisible(".nav-tab[data-view='reports']", canViewReports());
  setVisible(".nav-tab[data-view='settings']", canManageSetup());
  setVisible("#addItemBtn", canManageMaterials());
  setVisible("#quickIssueBtn", canEditRequests());
  setVisible("#addTransactionBtn", canEditRequests());
  setVisible("#newTransactionBtn", canEditRequests());
  setVisible("#exportMaterialRequestExcelBtn", canExportRequests());
  setVisible(".request-edit-action", canEditRequests());
  setVisible(".request-export-action", canExportRequests());
  setVisible(".request-adjustments", canEditRequests());
  document.querySelectorAll(".inline-request-actions button").forEach((button) => {
    const action = button.getAttribute("onclick") || "";
    const allowedGuestAction = action.includes("printSelectedMaterialRequest") || action.includes("selectOriginalMaterialRequest");
    button.style.display = !isGuest() || allowedGuestAction ? "" : "none";
  });
  setVisible("#exportJsonBtn", canSensitive());
  setVisible("label[title='Restore']", canSensitive());
  setVisible("#addUserBtn", canManageUsers());
  setVisible("#usersPanel", canViewUsers());
  setVisible("[data-master]", canManageSetup());
  setVisible(".settings-actions .file-button", canManageSetup());
  setVisible("#downloadBuildingsTemplateBtn", canManageSetup());
  if (!canAccessView(currentView)) {
    document.querySelector(`.nav-tab[data-view='${isGuest() ? "materialRequests" : "dashboard"}']`)?.click();
  }
}

function render() {
  renderSelects();
  renderDashboard();
  renderItems();
  renderTransactions();
  renderMaterialRequests();
  renderReports();
  renderSettings();
  applyPermissions();
}

function bindNavigation() {
  document.querySelectorAll(".nav-tab").forEach((button) => {
    button.addEventListener("click", () => {
      if (!canAccessView(button.dataset.view)) return;
      currentView = button.dataset.view;
      document.querySelectorAll(".nav-tab").forEach((tab) => tab.classList.toggle("active", tab === button));
      document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === currentView));
      applyLanguage();
    });
  });
}

function bindActions() {
  updateAppClock();
  setInterval(updateAppClock, 30000);
  document.getElementById("languageBtn").addEventListener("click", () => {
    lang = lang === "ar" ? "en" : "ar";
    saveState();
    applyLanguage();
    render();
  });
  document.getElementById("addItemBtn").addEventListener("click", () => openItemDialog());
  document.getElementById("addTransactionBtn").addEventListener("click", () => openTransactionDialog());
  document.getElementById("newTransactionBtn").addEventListener("click", () => openTransactionDialog());
  document.getElementById("quickIssueBtn").addEventListener("click", () => openTransactionDialog(null, "tt-2"));
  document.getElementById("itemSearch").addEventListener("input", () => {
    clearTimeout(itemSearchTimer);
    itemSearchTimer = setTimeout(renderItems, 60);
  });
  document.getElementById("itemDepartment").addEventListener("change", () => updateItemCodeForDepartment());
  document.getElementById("transactionSearch").addEventListener("input", renderTransactions);
  document.getElementById("transactionDepartment").addEventListener("change", () => updateTransactionFilteredSelects());
  document.getElementById("transactionItem").addEventListener("change", syncTransactionDepartmentFromItem);
  document.getElementById("transactionNewItemName").addEventListener("input", () => {
    if (value("transactionNewItemName")) document.getElementById("transactionItem").value = "";
  });
  document.getElementById("dashboardStockDepartment").addEventListener("change", renderDashboard);
  document.getElementById("requestSearch").addEventListener("input", renderMaterialRequests);
  document.getElementById("requestOrderSearch")?.addEventListener("input", renderMaterialRequests);
  document.getElementById("requestStoreSearch")?.addEventListener("input", renderMaterialRequests);
  document.getElementById("requestBuildingSearch")?.addEventListener("input", renderMaterialRequests);
  document.getElementById("buildingSearch")?.addEventListener("input", renderBuildings);
  document.getElementById("settingsSearch")?.addEventListener("input", renderSettings);
  document.getElementById("reportTypeFilter")?.addEventListener("change", renderReports);
  document.getElementById("reportBuildingFilter")?.addEventListener("change", renderReports);
  document.getElementById("reportDepartmentFilter")?.addEventListener("change", renderReports);
  document.getElementById("reportFromDate")?.addEventListener("change", renderReports);
  document.getElementById("reportToDate")?.addEventListener("change", renderReports);
  document.getElementById("newReportBtn")?.addEventListener("click", resetReportFilters);
  document.getElementById("newMaterialRequestBtn")?.addEventListener("click", () => toast(tr("newRequest")));
  document.getElementById("printMaterialRequestBtn").addEventListener("click", printSelectedMaterialRequest);
  document.getElementById("exportMaterialRequestExcelBtn").addEventListener("click", exportSelectedRequestExcel);
  document.getElementById("exportJsonBtn").addEventListener("click", exportJson);
  document.getElementById("importJsonInput").addEventListener("change", importJson);
  document.getElementById("importBuildingsInput").addEventListener("change", importBuildings);
  document.getElementById("downloadBuildingsTemplateBtn").addEventListener("click", downloadBuildingsTemplate);
  document.getElementById("exportStockExcelBtn").addEventListener("click", () => exportExcel("stock"));
  document.getElementById("exportTransExcelBtn").addEventListener("click", () => exportExcel("transactions"));
  document.getElementById("printReportBtn").addEventListener("click", printCurrentReport);
  document.getElementById("printAlertsBtn").addEventListener("click", printDashboardReport);
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
  document.querySelectorAll("[data-master]").forEach((button) => button.addEventListener("click", () => openMasterDialog(button.dataset.master)));
  document.getElementById("addUserBtn").addEventListener("click", () => openUserDialog());
  document.getElementById("itemCode").addEventListener("change", autoSaveOpenItemCode);
  ["masterCode", "masterNameAr", "masterNameEn", "masterDepartment"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", autoSaveOpenTechnician);
  });
}

function bindForms() {
  document.getElementById("itemForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!canManageMaterials()) return;
    const id = value("itemId") || uid("item");
    const departmentId = value("itemDepartment");
    const codeValue = value("itemCode") || nextItemCodeForDepartment(departmentId, state.items);
    upsert(state.items, itemFromDialog(id, codeValue, departmentId));
    setItemStock(id, Number(value("itemStock") || 0));
    saveState();
    document.getElementById("itemDialog").close();
    toast(tr("savedItem"));
    render();
  });

  document.getElementById("transactionForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const id = value("transactionId") || uid("tr");
    const existingTransaction = byId(state.transactions, id);
    const itemId = resolveTransactionItem();
    if (!itemId) {
      toast(tr("noItems"));
      return;
    }
    const technician = byId(state.technicians || [], value("transactionRequestedBy"));
    const transaction = {
      id,
      date: value("transactionDate"),
      itemId,
      typeId: value("transactionType"),
      qty: Number(value("transactionQty") || 0),
      departmentId: value("transactionDepartment"),
      buildingId: value("transactionBuilding"),
      technicianId: value("transactionRequestedBy"),
      requestedBy: labelOf(technician),
      requestNo: value("transactionRequestNo"),
      storeProvided: document.getElementById("transactionStoreProvided").checked,
      urgentVip: document.getElementById("transactionUrgentVip").checked,
      raisePurchase: document.getElementById("transactionRaisePurchase").checked,
      purchasedActual: document.getElementById("transactionPurchasedActual").checked,
      sourceRequestKey: existingTransaction?.sourceRequestKey || pendingTransactionMeta?.sourceRequestKey,
      sourceLineIndex: existingTransaction?.sourceLineIndex ?? pendingTransactionMeta?.sourceLineIndex,
      remarks: value("transactionRemarks"),
    };
    const duplicate = duplicateTransactionWarning(transaction);
    upsert(state.transactions, transaction);
    saveState();
    pendingTransactionMeta = null;
    document.getElementById("transactionDialog").close();
    toast(duplicate || tr("savedTransaction"));
    render();
  });

  document.getElementById("masterForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!canManageSetup()) return;
    const kind = value("masterKind");
    const id = value("masterId") || uid(kind);
    const row = masterFromDialog(kind, id);
    upsert(state[kind], row);
    saveState();
    document.getElementById("masterDialog").close();
    toast(tr("savedMaster"));
    render();
  });

  document.getElementById("userForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!canManageUsers()) return;
    const id = value("userId") || uid("user");
    upsert(state.users, {
      id,
      username: value("userUsername"),
      password: value("userPassword"),
      displayName: value("userDisplayName") || value("userUsername"),
      role: value("userRole") || "entry",
    });
    saveState();
    document.getElementById("userDialog").close();
    toast(tr("savedUser"));
    renderUsers();
  });
}

function value(id) {
  return document.getElementById(id).value.trim();
}

function upsert(list, row) {
  const index = list.findIndex((entry) => entry.id === row.id);
  if (index >= 0) list[index] = row;
  else list.push(row);
}

function itemFromDialog(id, codeValue = value("itemCode"), departmentId = value("itemDepartment")) {
  const existing = byId(state.items, id);
  const keepOriginalCode = isInventoryCatalogRow(existing);
  return {
    ...existing,
    id,
    code: keepOriginalCode ? clean(codeValue).toUpperCase() : codeWithDepartmentPrefix(codeValue, departmentId),
    nameAr: value("itemNameAr"),
    nameEn: value("itemNameEn"),
    categoryId: value("itemCategory"),
    departmentId,
    unitId: value("itemUnit"),
    locationId: value("itemLocation"),
    minQty: Number(value("itemMinQty") || 0),
    notes: value("itemNotes"),
  };
}

function setItemStock(itemId, desiredStock) {
  const item = byId(state.items, itemId);
  if (!item || !Number.isFinite(desiredStock)) return;
  const currentStock = stockFor(itemId);
  const diff = Math.round(desiredStock - currentStock);
  if (!diff) return;
  const type = state.transactionTypes.find((row) => Number(row.effect || 0) === (diff > 0 ? 1 : -1));
  state.transactions.push({
    id: uid("stock"),
    date: today(),
    itemId,
    typeId: type?.id || state.transactionTypes[0]?.id || "",
    qty: Math.abs(diff),
    departmentId: item.departmentId,
    buildingId: "",
    technicianId: "",
    requestedBy: currentUserName(),
    requestNo: `STOCK-${Date.now().toString(36).toUpperCase()}`,
    storeProvided: true,
    urgentVip: false,
    raisePurchase: false,
    purchasedActual: false,
    remarks: "تعديل رصيد المادة",
  });
}

function masterFromDialog(kind, id) {
  const existing = byId(state[kind] || [], id) || {};
  const row = { ...existing, id, code: value("masterCode").toUpperCase(), nameAr: value("masterNameAr"), nameEn: value("masterNameEn") };
  if (kind === "transactionTypes") row.effect = Number(value("masterEffect") || 0);
  if (kind === "buildings") row.number = value("masterBuildingNo");
  if (kind === "technicians") row.departmentId = value("masterDepartment") || state.departments[0]?.id || "";
  return row;
}

function autoSaveOpenItemCode() {
  const id = value("itemId");
  if (!id) return;
  upsert(state.items, itemFromDialog(id));
  saveState();
  render();
  toast(tr("savedItem"));
}

function autoSaveOpenTechnician() {
  if (value("masterKind") !== "technicians") return;
  const id = value("masterId");
  if (!id || !value("masterCode") || !value("masterNameAr")) return;
  upsert(state.technicians, masterFromDialog("technicians", id));
  saveState();
  render();
  toast(tr("savedMaster"));
}

function resolveTransactionItem() {
  const typedName = value("transactionNewItemName");
  if (!typedName) return value("transactionItem") || "";
  const departmentId = value("transactionDepartment") || state.departments[0]?.id || "";
  const existing = approvedStoreItems().find((row) => row.departmentId === departmentId && [row.nameAr, row.nameEn, itemLabel(row)].some((name) => normalizeText(name) === normalizeText(typedName)));
  if (existing) return existing.id;
  const id = uid("item");
  const newItem = {
    id,
    code: nextItemCodeForDepartment(departmentId, state.items),
    nameAr: typedName,
    nameEn: typedName,
    categoryId: categoryIdForDepartment(departmentId, state.departments),
    departmentId,
    unitId: state.units[0]?.id || "",
    locationId: state.locations[0]?.id || "",
    minQty: 0,
    reorderQty: 0,
    notes: "Added from purchase request",
  };
  state.items.push(newItem);
  toast(tr("createdMaterial"));
  return id;
}

function renderSelects() {
  fillSelect("itemCategory", state.categories);
  fillSelect("itemDepartment", state.departments);
  fillSelect("itemUnit", state.units);
  fillSelect("itemLocation", state.locations);
  fillSelect("transactionType", state.transactionTypes);
  fillSelect("transactionDepartment", state.departments);
  fillSelect("transactionBuilding", [{ id: "", code: "", nameAr: "بدون مبنى", nameEn: "No building" }, ...state.buildings], (row) => row.id ? `${row.number || row.code} - ${labelOf(row)}` : labelOf(row));
  fillSelect("reportBuildingFilter", [{ id: "", code: "", nameAr: tr("allBuildings"), nameEn: tr("allBuildings") }, ...state.buildings], (row) => row.id ? `${row.number || row.code} - ${labelOf(row)}` : labelOf(row));
  fillSelect("reportDepartmentFilter", [{ id: "", code: "", nameAr: tr("allDepartments"), nameEn: tr("allDepartments") }, ...state.departments], (row) => row.id ? `${row.code} - ${labelOf(row)}` : labelOf(row));
  fillSelect("dashboardStockDepartment", state.departments, (row) => `${row.code} - ${labelOf(row)}`);
  fillSelect("masterDepartment", state.departments);
  fillRoleSelect();
  updateTransactionFilteredSelects();
}

function fillRoleSelect() {
  const select = document.getElementById("userRole");
  if (!select) return;
  const selected = select.value || "entry";
  const roles = [
    { id: "guest", label: tr("roleGuest") },
    { id: "entry", label: tr("roleEntry") },
    { id: "manager", label: tr("roleManager") },
    { id: "admin", label: tr("roleAdmin") },
  ];
  select.innerHTML = roles.map((role) => `<option value="${role.id}">${escapeHtml(role.label)}</option>`).join("");
  select.value = selected;
}

function fillSelect(id, list, labeler = (row) => `${row.code} - ${labelOf(row)}`) {
  const select = document.getElementById(id);
  if (!select) return;
  const selected = select.value;
  select.innerHTML = list.map((row) => `<option value="${row.id}">${escapeHtml(labeler(row))}</option>`).join("");
  if (selected && list.some((row) => row.id === selected)) select.value = selected;
}

function updateTransactionFilteredSelects() {
  const departmentId = value("transactionDepartment") || state.departments[0]?.id || "";
  const currentItem = value("transactionItem");
  const currentTechnician = value("transactionRequestedBy");
  const departmentItems = approvedStoreItems()
    .filter((row) => row.departmentId === departmentId)
    .sort((a, b) => String(a.code || "").localeCompare(String(b.code || ""), undefined, { numeric: true }));
  const departmentTechnicians = (state.technicians || []).filter((row) => row.departmentId === departmentId);
  fillSelect("transactionItem", [{ id: "", code: "", nameAr: "", nameEn: "" }, ...departmentItems], (row) => row.id ? `${row.code} - ${itemLabel(row)}` : "");
  const suggestions = document.getElementById("transactionNewItemSuggestions");
  if (suggestions) suggestions.innerHTML = departmentItems.map((row) => `<option value="${escapeHtml(itemLabel(row))}"></option>`).join("");
  fillSelect("transactionRequestedBy", [{ id: "", code: "", nameAr: tr("noTechnician"), nameEn: tr("noTechnician") }, ...departmentTechnicians], (row) => {
    if (!row.id) return labelOf(row);
    const job = row.job ? ` - ${row.job}` : "";
    return `${row.nameEn || row.nameAr}${job}`;
  });
  if (departmentItems.some((row) => row.id === currentItem)) document.getElementById("transactionItem").value = currentItem;
  else document.getElementById("transactionItem").value = "";
  if (departmentTechnicians.some((row) => row.id === currentTechnician)) document.getElementById("transactionRequestedBy").value = currentTechnician;
}

function syncTransactionDepartmentFromItem() {
  const item = byId(state.items, value("transactionItem"));
  if (!item?.departmentId) return;
  document.getElementById("transactionDepartment").value = item.departmentId;
  updateTransactionFilteredSelects();
  document.getElementById("transactionItem").value = item.id;
}

function renderRequestAlerts() {
  const target = document.getElementById("requestAlerts");
  if (!target) return;
  const alerts = [...oldMaterialRequestAlerts(), ...duplicateMaterialAlerts(), ...recentDuplicateTransactionAlerts()]
    .slice(0, 18);
  target.innerHTML = alerts.length
    ? alerts.map((alert) => `<div class="activity alert-card ${alert.kind || ""}"><strong>${escapeHtml(alert.title)}</strong><span>${escapeHtml(alert.detail)}</span></div>`).join("")
    : `<div class="empty">${tr("noRequestAlerts")}</div>`;
}

function oldMaterialRequestAlerts() {
  const todayDate = new Date(today());
  return legacyRequests().flatMap((request) => {
    const requestDate = parseAppDate(request.stDate);
    if (!requestDate) return [];
    const ageDays = daysBetween(requestDate, todayDate);
    if (ageDays < 7) return [];
    const openLines = request.lines.filter((line) => !line.store && !line.done && !line.cancel);
    if (!openLines.length) return [];
    const orders = uniqueValues(openLines.map((line) => line.orderNo)).slice(0, 5).join(", ");
    return [{
      kind: "warn",
      title: `${tr("oldRequestAlert")} - ${ageDays} يوم`,
      detail: `رقم طلب الصيانة: ${orders || "-"} | رقم طلب المستودع: ${padRequestNo(request.storeNo)} | رقم المبنى: ${request.BdNo || "-"} | البنود المفتوحة: ${openLines.length}`,
    }];
  });
}

function duplicateMaterialAlerts() {
  const entries = [];
  legacyRequests().forEach((request) => {
    const requestDate = parseAppDate(request.stDate);
    if (!requestDate) return;
    request.lines.forEach((line) => {
      const material = normalizeText(line.descrption);
      const buildingNo = normalizeText(request.BdNo || request.building);
      if (!material || !buildingNo || line.cancel) return;
      entries.push({ request, line, requestDate, material, buildingNo });
    });
  });

  const alerts = [];
  const seen = new Set();
  entries.forEach((entry, index) => {
    for (let next = index + 1; next < entries.length; next += 1) {
      const other = entries[next];
      if (entry.material !== other.material || entry.buildingNo !== other.buildingNo) continue;
      const diff = Math.abs(daysBetween(entry.requestDate, other.requestDate));
      if (diff > 10) continue;
      const key = [entry.material, entry.buildingNo, entry.request.storeNo, other.request.storeNo].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      alerts.push({
        kind: "duplicate",
        title: tr("duplicateMaterialAlert"),
        detail: `المادة: ${entry.line.descrption || ""} | رقم طلب الصيانة: ${uniqueValues([entry.line.orderNo, other.line.orderNo]).join(", ") || "-"} | رقم طلب المستودع: ${padRequestNo(entry.request.storeNo)}, ${padRequestNo(other.request.storeNo)} | رقم المبنى: ${entry.request.BdNo || other.request.BdNo || "-"}`,
      });
      break;
    }
  });
  return alerts;
}

function recentDuplicateTransactionAlerts() {
  const alerts = [];
  const seen = new Set();
  approvedStoreTransactions().forEach((row) => {
    const warning = duplicateTransactionWarning(row);
    if (!warning) return;
    const key = `${row.itemId}|${row.buildingId}|${row.date}`;
    if (seen.has(key)) return;
    seen.add(key);
    const item = byId(state.items, row.itemId);
    const building = byId(state.buildings, row.buildingId);
    alerts.push({
      kind: "duplicate",
      title: tr("duplicateMaterialAlert"),
      detail: `${itemLabel(item)} | ${row.date || ""} | رقم طلب الصيانة: ${row.requestNo || "-"} | رقم المبنى: ${building?.number || building?.code || "-"}`,
    });
  });
  return alerts.slice(0, 6);
}

function duplicateTransactionWarning(transaction) {
  if (!isApprovedStoreItemId(transaction?.itemId)) return "";
  if (!transaction?.itemId || !transaction?.buildingId || !transaction?.date) return "";
  const date = parseAppDate(transaction.date);
  if (!date) return "";
  const duplicate = approvedStoreTransactions().find((row) => {
    if (row.id === transaction.id || row.itemId !== transaction.itemId || row.buildingId !== transaction.buildingId) return false;
    const otherDate = parseAppDate(row.date);
    return otherDate && Math.abs(daysBetween(date, otherDate)) <= 10;
  });
  if (!duplicate) return "";
  const item = byId(state.items, transaction.itemId);
  const building = byId(state.buildings, transaction.buildingId);
  return `${tr("duplicateMaterialAlert")}: ${itemLabel(item)} | رقم المبنى ${building?.number || building?.code || "-"} | طلب سابق ${duplicate.requestNo || duplicate.date || "-"}`;
}

function parseAppDate(value) {
  if (!value) return null;
  const raw = String(value).slice(0, 10).trim();
  const parts = raw.includes("-") ? raw.split("-") : raw.split("/");
  if (parts.length !== 3) return null;
  const [a, b, c] = parts.map((part) => Number(part));
  if (![a, b, c].every(Number.isFinite)) return null;
  const year = String(parts[0]).length === 4 ? a : c;
  const month = String(parts[0]).length === 4 ? b : b;
  const day = String(parts[0]).length === 4 ? c : a;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(a, b) {
  return Math.floor((stripTime(b) - stripTime(a)) / 86400000);
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function renderDashboard() {
  const stockDepartmentId = selectedDashboardDepartmentId();
  const departmentStockRows = dashboardDepartmentStockRows(stockDepartmentId);
  const lowRows = departmentStockRows.filter((row) => isLowStock(row.item, row.stock));
  const departmentTransactions = dashboardDepartmentTransactions(stockDepartmentId, departmentStockRows);
  const month = new Date().toISOString().slice(0, 7);
  document.getElementById("metricItems").textContent = departmentStockRows.length;
  document.getElementById("metricStock").textContent = departmentStockRows.reduce((sum, row) => sum + row.stock, 0);
  document.getElementById("metricLow").textContent = lowRows.length;
  document.getElementById("metricMonth").textContent = departmentTransactions.filter((transaction) => transaction.date?.startsWith(month)).length;

  document.getElementById("lowStockBody").innerHTML = departmentStockRows.length
    ? departmentStockRows.map(({ item, stock }) => {
      const warn = isLowStock(item, stock);
      return `<tr class="${warn ? "low-stock-row" : ""}"><td>${escapeHtml(item.code)}</td><td>${escapeHtml(itemLabel(item))}</td><td><span class="badge ${warn ? "warn" : ""}">${stock}</span></td><td>${item.minQty}</td><td>${escapeHtml(labelOf(byId(state.departments, item.departmentId)))}</td></tr>`;
    }).join("")
    : `<tr><td colspan="5" class="empty">${tr("noRows")}</td></tr>`;

  document.getElementById("recentTransactions").innerHTML = departmentTransactions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)
    .map((transaction) => {
      const material = byId(state.items, transaction.itemId);
      const type = byId(state.transactionTypes, transaction.typeId);
      const department = byId(state.departments, transaction.departmentId);
      return `<div class="activity"><strong>${escapeHtml(labelOf(type))} - ${escapeHtml(itemLabel(material))}</strong><span>${transaction.date} | ${transaction.qty} | ${escapeHtml(labelOf(department) || tr("noDepartment"))}</span></div>`;
    })
    .join("") || `<div class="empty">${tr("noTransactions")}</div>`;

  renderRequestAlerts();
}

function selectedDashboardDepartmentId() {
  return value("dashboardStockDepartment") || state.departments[0]?.id || "";
}

function dashboardDepartmentStockRows(departmentId = selectedDashboardDepartmentId()) {
  return approvedStoreItems()
    .filter((item) => item.departmentId === departmentId)
    .map((item) => ({ item, stock: stockFor(item.id) }));
}

function dashboardDepartmentTransactions(departmentId = selectedDashboardDepartmentId(), stockRows = dashboardDepartmentStockRows(departmentId)) {
  const departmentItemIds = new Set(stockRows.map((row) => row.item.id));
  return approvedStoreTransactions().filter((transaction) => departmentItemIds.has(transaction.itemId));
}

function dashboardDepartmentTitle() {
  const department = byId(state.departments, selectedDashboardDepartmentId());
  return `${tr("lowStock")}${department ? ` - ${labelOf(department)}` : ""}`;
}

function renderItems() {
  const rawQuery = document.getElementById("itemSearch").value.trim();
  const query = normalizeSearchText(rawQuery);
  const codeQuery = normalizeCodeSearch(rawQuery);
  const rows = approvedStoreItems().filter((row) => {
    const values = [row.code, row.nameAr, row.nameEn, labelOf(byId(state.departments, row.departmentId)), labelOf(byId(state.locations, row.locationId))];
    const code = normalizeCodeSearch(row.code);
    return !query || normalizeSearchText(values.join(" ")).includes(query) || (codeQuery && code.includes(codeQuery));
  }).sort((a, b) => {
    if (!codeQuery) return String(a.code || "").localeCompare(String(b.code || ""), undefined, { numeric: true });
    const aCode = normalizeCodeSearch(a.code);
    const bCode = normalizeCodeSearch(b.code);
    const aRank = aCode === codeQuery ? 0 : aCode.startsWith(codeQuery) ? 1 : aCode.includes(codeQuery) ? 2 : 3;
    const bRank = bCode === codeQuery ? 0 : bCode.startsWith(codeQuery) ? 1 : bCode.includes(codeQuery) ? 2 : 3;
    return aRank - bRank || String(a.code || "").localeCompare(String(b.code || ""), undefined, { numeric: true });
  });
  document.getElementById("itemsBody").innerHTML = rows.length ? rows.map((row) => {
    const stock = stockFor(row.id);
    const warn = isLowStock(row, stock);
    return `<tr>
      <td>${escapeHtml(row.code)}</td>
      <td>${escapeHtml(row.nameAr)}</td>
      <td>${escapeHtml(row.nameEn || "")}</td>
      <td>${escapeHtml(labelOf(byId(state.categories, row.categoryId)))}</td>
      <td>${escapeHtml(labelOf(byId(state.departments, row.departmentId)))}</td>
      <td>${escapeHtml(labelOf(byId(state.units, row.unitId)))}</td>
      <td>${escapeHtml(labelOf(byId(state.locations, row.locationId)))}</td>
      <td><span class="badge ${warn ? "warn" : ""}">${stock}</span></td>
      <td><div class="row-actions"><button class="icon-button" title="${tr("edit")}" onclick="openItemDialog('${row.id}')">✎</button><button class="icon-button" title="Move" onclick="openTransactionDialog(null, null, '${row.id}')">⇄</button><button class="icon-button danger" title="${tr("delete")}" onclick="deleteItem('${row.id}')">×</button></div></td>
    </tr>`;
  }).join("") : `<tr><td colspan="9" class="empty">${tr("noItems")}</td></tr>`;
}

function renderTransactions() {
  const query = document.getElementById("transactionSearch").value.trim().toLowerCase();
  const rows = approvedStoreTransactions().filter((row) => {
    const material = byId(state.items, row.itemId);
    const values = [row.date, material?.code, material?.nameAr, material?.nameEn, labelOf(byId(state.transactionTypes, row.typeId)), row.requestNo, labelOf(byId(state.departments, row.departmentId)), labelOf(byId(state.buildings, row.buildingId))];
    return values.join(" ").toLowerCase().includes(query);
  }).sort((a, b) => b.date.localeCompare(a.date));
  document.getElementById("transactionsBody").innerHTML = rows.length ? rows.map((row) => {
    const material = byId(state.items, row.itemId);
    const buildingRow = byId(state.buildings, row.buildingId);
    return `<tr>
      <td>${row.date}</td>
      <td>${escapeHtml(itemLabel(material))}</td>
      <td>${escapeHtml(labelOf(byId(state.transactionTypes, row.typeId)))}</td>
      <td>${row.qty}</td>
      <td>${escapeHtml(row.requestNo || "")}</td>
      <td>${escapeHtml(labelOf(byId(state.departments, row.departmentId)))}</td>
      <td>${escapeHtml(buildingRow ? `${buildingRow.number || buildingRow.code} - ${labelOf(buildingRow)}` : "")}</td>
      <td><button class="icon-button" title="Edit" onclick="openTransactionDialog('${row.id}')">✎</button></td>
    </tr>`;
  }).join("") : `<tr><td colspan="8" class="empty">${tr("noRows")}</td></tr>`;
}

function renderReports() {
  const table = document.getElementById("stockReportTable");
  const body = document.getElementById("stockReportBody");
  const heading = document.getElementById("stockReportHeading");
  const summary = document.getElementById("reportSummary");
  const scopedRows = buildReportRows();

  if (scopedRows.type !== "stock") {
    const showBuildingNo = shouldShowReportBuildingNo(scopedRows);
    const buildingHead = showBuildingNo ? `<th>${tr("buildingNo")}</th>` : "";
    table.querySelector("thead").innerHTML = `<tr><th>${tr("reqSerial")}</th><th>${tr("date")}</th>${buildingHead}<th>${tr("orderNo")}</th><th>${tr("description")}</th><th>${tr("requestedQty")}</th><th>${tr("storeQty")}</th><th>${tr("raisedPurchaseQty")}</th><th>${tr("actualPurchasedQty")}</th><th>${tr("remainingQty")}</th><th>${tr("unit")}</th><th>${tr("section")}</th><th>${tr("requestedBy")}</th><th>${tr("urgent")}</th></tr>`;
    heading.textContent = scopedRows.title;
    summary.style.display = "flex";
    summary.innerHTML = reportSummaryHtml(scopedRows);
    const colspan = showBuildingNo ? 14 : 13;
    body.innerHTML = scopedRows.rows.length ? `${scopedRows.rows.map((row) => `<tr>
      <td>${escapeHtml(row.storeNo || "")}</td>
      <td>${escapeHtml(formatDateDisplay(row.date))}</td>
      ${showBuildingNo ? `<td>${escapeHtml(row.buildingNo || "")}</td>` : ""}
      <td>${escapeHtml(row.orderNo || "")}</td>
      <td>${escapeHtml(row.description || "")}</td>
      <td>${escapeHtml(row.qty ?? "")}</td>
      <td>${escapeHtml(row.storeQty ?? "")}</td>
      <td>${escapeHtml(row.raisedPurchaseQty ?? "")}</td>
      <td>${escapeHtml(row.actualPurchasedQty ?? "")}</td>
      <td>${escapeHtml(row.remainingQty ?? "")}</td>
      <td>${escapeHtml(row.unit || "")}</td>
      <td>${escapeHtml(row.section || "")}</td>
      <td>${escapeHtml(row.tech || "")}</td>
      <td>${row.urgent ? "✓" : ""}</td>
    </tr>`).join("")}${reportTotalsRowHtml(scopedRows, showBuildingNo)}` : `<tr><td colspan="${colspan}" class="empty">${tr("noRows")}</td></tr>`;
    return;
  }

  heading.textContent = "";
  summary.style.display = "none";
  summary.innerHTML = "";
  table.querySelector("thead").innerHTML = `<tr><th>${tr("code")}</th><th>${tr("itemAr")}</th><th>${tr("itemEn")}</th><th>${tr("category")}</th><th>${tr("department")}</th><th>${tr("unit")}</th><th>${tr("stock")}</th><th>${tr("minQty")}</th></tr>`;
  body.innerHTML = approvedStoreItems().map((row) => `<tr>
    <td>${escapeHtml(row.code)}</td>
    <td>${escapeHtml(row.nameAr)}</td>
    <td>${escapeHtml(row.nameEn || "")}</td>
    <td>${escapeHtml(labelOf(byId(state.categories, row.categoryId)))}</td>
    <td>${escapeHtml(labelOf(byId(state.departments, row.departmentId)))}</td>
    <td>${escapeHtml(labelOf(byId(state.units, row.unitId)))}</td>
    <td>${stockFor(row.id)}</td>
    <td>${row.minQty}</td>
  </tr>`).join("") || `<tr><td colspan="8" class="empty">${tr("noRows")}</td></tr>`;
}

function resetReportFilters() {
  document.getElementById("reportTypeFilter").value = "stock";
  document.getElementById("reportBuildingFilter").value = "";
  document.getElementById("reportDepartmentFilter").value = "";
  document.getElementById("reportFromDate").value = "";
  document.getElementById("reportToDate").value = "";
  renderReports();
}

function buildReportRows() {
  const type = document.getElementById("reportTypeFilter")?.value || "stock";
  const buildingId = document.getElementById("reportBuildingFilter")?.value || "";
  const departmentId = document.getElementById("reportDepartmentFilter")?.value || "";
  const from = document.getElementById("reportFromDate")?.value || "";
  const to = document.getElementById("reportToDate")?.value || "";
  const building = byId(state.buildings, buildingId);
  const department = byId(state.departments, departmentId);
  const rows = [];

  if (type === "stock") return { type, rows: [], title: "" };

  legacyRequests().forEach((request) => {
    const date = request.stDate || "";
    if (from && date < from) return;
    if (to && date > to) return;
    if (building) {
      const bText = normalizeText([request.BdNo, request.building].join(" "));
      const expected = normalizeText([building.number, building.code, building.nameAr, building.nameEn].join(" "));
      if (![building.number, building.code, building.nameAr, building.nameEn].some((part) => part && bText.includes(normalizeText(part)))) return;
      if (!expected) return;
    }
    request.lines.forEach((line, lineIndex) => {
      if (department) {
        const lineDepartmentId = departmentIdForLegacyLine(state.departments, line);
        if (lineDepartmentId !== department.id) return;
      }
      const qtyInfo = requestLineQuantities(request, line, lineIndex);
      rows.push({
        storeNo: requestDisplayNo(request),
        date,
        buildingNo: request.BdNo,
        building: request.building,
        orderNo: line.orderNo,
        description: line.descrption,
        qty: qtyInfo.qty,
        storeQty: qtyInfo.storeQty,
        raisedPurchaseQty: qtyInfo.raisedPurchaseQty,
        actualPurchasedQty: qtyInfo.actualPurchasedQty,
        remainingQty: qtyInfo.remainingQty,
        unit: line.type,
        section: line.section,
        tech: line.tech,
        urgent: line.urgent,
        store: line.store,
        done: line.done,
        cancel: line.cancel,
        purchase: !line.store,
        purchasedActual: !line.store && Boolean(line.done) && !line.cancel,
      });
    });
  });

  const typedRows = rows.filter((row) => {
    if (type === "storeProvided") return Boolean(row.store);
    if (type === "purchased") return !row.store && Boolean(row.done) && !row.cancel;
    if (type === "notPurchased") return !row.store && !row.done && !row.cancel;
    if (type === "incompletePurchase") return !row.store && !row.cancel && Number(row.remainingQty || 0) > 0;
    return true;
  });

  const parts = [];
  parts.push(tr(reportTitleKey(type)));
  if (building) parts.push(`${tr("building")}: ${building.number || building.code} - ${labelOf(building)}`);
  if (department) parts.push(`${tr("department")}: ${labelOf(department)}`);
  if (from || to) parts.push(`${from || "..."} / ${to || "..."}`);
  return { type, rows: typedRows, title: `${tr("reportScope")}: ${parts.join(" | ")}`, hasBuildingScope: Boolean(building) };
}

function requestLineQuantities(request, line, lineIndex = 0) {
  const qty = Number(line.Qty || 0);
  const storeQty = line.store ? qty : 0;
  const raisedPurchaseQty = line.store ? 0 : qty;
  const override = requestLineOverride(requestLineKey(request, line, lineIndex));
  const savedActualQty = override ? Number(override.actualPurchasedQty) : Number(line.actualPurchasedQty);
  const actualPurchasedQty = Number.isFinite(savedActualQty)
    ? Math.min(Math.max(savedActualQty, 0), raisedPurchaseQty)
    : (!line.store && line.done && !line.cancel ? qty : 0);
  return {
    qty,
    storeQty,
    raisedPurchaseQty,
    actualPurchasedQty,
    remainingQty: Math.max(raisedPurchaseQty - actualPurchasedQty, 0),
  };
}

function requestLineKey(request, line, lineIndex = 0) {
  return [
    request?.storeNo || line.storeNo || "",
    request?.reorderSuffix || "",
    line.orderNo || "",
    line.itmNo || "",
    hashString(line.descrption || ""),
    lineIndex,
  ].join("|");
}

function requestLineOverride(key) {
  return (state.requestLineQtyOverrides || []).find((row) => row.key === key);
}

function saveRequestLinePurchasedQty(key, value) {
  if (!canEditRequests()) return;
  const qty = Math.max(0, Number(value || 0));
  state.requestLineQtyOverrides = state.requestLineQtyOverrides || [];
  const index = state.requestLineQtyOverrides.findIndex((row) => row.key === key);
  if (index >= 0) state.requestLineQtyOverrides[index] = { key, actualPurchasedQty: qty };
  else state.requestLineQtyOverrides.push({ key, actualPurchasedQty: qty });
  saveState();
  renderReports();
  renderMaterialRequests();
}

function reportRequestCount(scopedRows) {
  return new Set((scopedRows.rows || []).map((row) => String(row.storeNo || "")).filter(Boolean)).size;
}

function reportSummaryText(scopedRows) {
  if (!scopedRows || scopedRows.type === "stock") return "";
  const totals = reportQuantityTotals(scopedRows);
  return tr("reportRequestCount")
    .replace("{count}", reportRequestCount(scopedRows))
    .replace("{lines}", (scopedRows.rows || []).length)
    .replace("{qty}", totals.qty)
    .replace("{storeQty}", totals.storeQty)
    .replace("{raisedQty}", totals.raisedPurchaseQty)
    .replace("{purchasedQty}", totals.actualPurchasedQty)
    .replace("{remainingQty}", totals.remainingQty);
}

function reportQuantityTotals(scopedRows) {
  return (scopedRows.rows || []).reduce((totals, row) => {
    totals.qty += Number(row.qty || 0);
    totals.storeQty += Number(row.storeQty || 0);
    totals.raisedPurchaseQty += Number(row.raisedPurchaseQty || 0);
    totals.actualPurchasedQty += Number(row.actualPurchasedQty || 0);
    totals.remainingQty += Number(row.remainingQty || 0);
    return totals;
  }, { qty: 0, storeQty: 0, raisedPurchaseQty: 0, actualPurchasedQty: 0, remainingQty: 0 });
}

function reportSummaryHtml(scopedRows) {
  const text = reportSummaryText(scopedRows);
  if (!text) return "";
  return `<strong>${escapeHtml(tr("reportRequestSummary"))}</strong><span>${escapeHtml(text)}</span>`;
}

function shouldShowReportBuildingNo(scopedRows) {
  return !scopedRows?.hasBuildingScope || ["storeProvided", "purchased", "notPurchased", "incompletePurchase"].includes(scopedRows.type);
}

function reportTotalsRowHtml(scopedRows, showBuildingNo) {
  const totals = reportQuantityTotals(scopedRows);
  const labelColspan = showBuildingNo ? 5 : 4;
  return `<tr class="report-total-row">
    <td colspan="${labelColspan}"><strong>${escapeHtml(tr("reportRequestSummary"))}</strong></td>
    <td><strong>${escapeHtml(totals.qty)}</strong></td>
    <td><strong>${escapeHtml(totals.storeQty)}</strong></td>
    <td><strong>${escapeHtml(totals.raisedPurchaseQty)}</strong></td>
    <td><strong>${escapeHtml(totals.actualPurchasedQty)}</strong></td>
    <td><strong>${escapeHtml(totals.remainingQty)}</strong></td>
    <td colspan="4"></td>
  </tr>`;
}

function reportTitleKey(type) {
  return {
    departments: "reportDepartments",
    building: "reportBuilding",
    storeProvided: "reportStoreProvided",
    purchased: "reportPurchased",
    notPurchased: "reportNotPurchased",
    incompletePurchase: "reportIncompletePurchase",
  }[type] || "reportStock";
}

function renderSettings() {
  renderChips("categoriesList", "categories", state.categories);
  renderChips("departmentsList", "departments", state.departments);
  renderChips("unitsList", "units", state.units);
  renderChips("locationsList", "locations", state.locations);
  renderBuildings();
  renderChips("techniciansList", "technicians", state.technicians || [], (row) => `${row.nameEn || row.nameAr} - ${labelOf(byId(state.departments, row.departmentId))}`);
  renderChips("transactionTypesList", "transactionTypes", state.transactionTypes, (row) => `${row.code} - ${labelOf(row)} (${row.effect > 0 ? "+" : ""}${row.effect})`);
  renderUsers();
}

function settingsQuery() {
  return normalizeText(document.getElementById("settingsSearch")?.value || "");
}

function matchesSettings(row, label = "") {
  const query = settingsQuery();
  if (!query) return true;
  return normalizeText([row.code, row.number, row.nameAr, row.nameEn, row.job, label].join(" ")).includes(query);
}

function renderChips(id, kind, list, labeler = (row) => `${row.code} - ${labelOf(row)}`) {
  const rows = list.filter((row) => matchesSettings(row, labeler(row)));
  document.getElementById(id).innerHTML = rows.length ? rows.map((row) => `<span class="chip action-chip"><span>${escapeHtml(labeler(row))}</span><button class="mini-button" title="${tr("edit")}" onclick="openMasterDialog('${kind}', '${row.id}')">✎</button><button class="mini-button danger" title="${tr("delete")}" onclick="deleteMaster('${kind}', '${row.id}')">×</button></span>`).join("") : `<div class="empty">${tr("noRows")}</div>`;
}

function renderBuildings() {
  const input = document.getElementById("buildingSearch");
  const query = input ? normalizeText(input.value) : "";
  const rows = state.buildings.filter((row) => {
    const text = [row.number, row.code, row.nameAr, row.nameEn].join(" ");
    return normalizeText(text).includes(query) && matchesSettings(row, text);
  });
  document.getElementById("buildingsBody").innerHTML = rows.length ? rows.slice(0, 500).map((row) => `<tr>
    <td>${escapeHtml(row.number || row.code || "")}</td>
    <td>${escapeHtml(labelOf(row))}</td>
    <td><div class="row-actions">
      <button class="icon-button" title="${tr("edit")}" onclick="openMasterDialog('buildings', '${row.id}')">✎</button>
      <button class="icon-button danger" title="${tr("delete")}" onclick="deleteBuilding('${row.id}')">×</button>
    </div></td>
  </tr>`).join("") : `<tr><td colspan="3" class="empty">${tr("noRows")}</td></tr>`;
}

function renderUsers() {
  const list = document.getElementById("usersList");
  if (!list) return;
  list.innerHTML = state.users.map((row) => `<span class="chip action-chip"><span>${escapeHtml(row.displayName || row.username)} (${escapeHtml(row.username)}) - ${escapeHtml(roleLabel(row.role))}</span><button class="mini-button" title="${tr("edit")}" onclick="openUserDialog('${row.id}')">✎</button>${row.username === "admin" ? "" : `<button class="mini-button danger" title="${tr("delete")}" onclick="deleteUser('${row.id}')">×</button>`}</span>`).join("");
}

function roleLabel(role) {
  return role === "admin" ? tr("roleAdmin") : role === "manager" ? tr("roleManager") : role === "guest" ? tr("roleGuest") : tr("roleEntry");
}

function openUserDialog(id) {
  if (!canManageUsers()) return;
  const row = id ? byId(state.users, id) : null;
  document.getElementById("userId").value = row?.id || "";
  document.getElementById("userUsername").value = row?.username || "";
  document.getElementById("userPassword").value = row?.password || "";
  document.getElementById("userDisplayName").value = row?.displayName || "";
  fillRoleSelect();
  document.getElementById("userRole").value = row?.role || "entry";
  document.getElementById("userDialog").showModal();
}

function deleteUser(id) {
  if (!canManageUsers()) return;
  const row = byId(state.users, id);
  if (!row || row.username === "admin") return;
  if (!confirm(tr("confirmDelete"))) return;
  state.users = state.users.filter((user) => user.id !== id);
  saveState();
  renderUsers();
  toast(tr("deleted"));
}

function openItemDialog(id) {
  if (!canManageMaterials()) return;
  const dialog = document.getElementById("itemDialog");
  const row = id ? byId(state.items, id) : null;
  const departmentId = row?.departmentId || state.departments[0]?.id || "";
  document.getElementById("itemDialogTitle").textContent = row ? tr("editItem") : tr("addItem");
  document.getElementById("itemId").value = row?.id || "";
  document.getElementById("itemCode").value = row?.code || nextItemCodeForDepartment(departmentId, state.items);
  document.getElementById("itemNameAr").value = row?.nameAr || "";
  document.getElementById("itemNameEn").value = row?.nameEn || "";
  document.getElementById("itemCategory").value = row?.categoryId || state.categories[0]?.id || "";
  document.getElementById("itemDepartment").value = departmentId;
  document.getElementById("itemUnit").value = row?.unitId || state.units[0]?.id || "";
  document.getElementById("itemLocation").value = row?.locationId || state.locations[0]?.id || "";
  document.getElementById("itemStock").value = row ? stockFor(row.id) : 0;
  document.getElementById("itemMinQty").value = row?.minQty ?? 0;
  document.getElementById("itemNotes").value = row?.notes || "";
  dialog.showModal();
}

function updateItemCodeForDepartment() {
  if (value("itemId")) return;
  const departmentId = value("itemDepartment");
  document.getElementById("itemCode").value = nextItemCodeForDepartment(departmentId, state.items);
}

function openTransactionDialog(id, typeId, itemId) {
  if (!canEditRequests()) return;
  pendingTransactionMeta = null;
  const dialog = document.getElementById("transactionDialog");
  const row = id ? byId(state.transactions, id) : null;
  const selectedItem = byId(state.items, row?.itemId || itemId);
  document.getElementById("transactionDialogTitle").textContent = row ? tr("editTransaction") : tr("addTransaction");
  document.getElementById("transactionId").value = row?.id || "";
  document.getElementById("transactionDate").value = row?.date || today();
  document.getElementById("transactionType").value = row?.typeId || typeId || state.transactionTypes[0]?.id || "";
  document.getElementById("transactionQty").value = row?.qty || 1;
  document.getElementById("transactionDepartment").value = row?.departmentId || selectedItem?.departmentId || state.departments[0]?.id || "";
  updateTransactionFilteredSelects();
  document.getElementById("transactionItem").value = row?.itemId || itemId || document.getElementById("transactionItem").value || "";
  document.getElementById("transactionNewItemName").value = "";
  document.getElementById("transactionBuilding").value = row?.buildingId || "";
  document.getElementById("transactionRequestedBy").value = row?.technicianId || "";
  document.getElementById("transactionRequestNo").value = row?.requestNo || "";
  document.getElementById("transactionStoreProvided").checked = Boolean(row?.storeProvided);
  document.getElementById("transactionUrgentVip").checked = Boolean(row?.urgentVip);
  document.getElementById("transactionRaisePurchase").checked = Boolean(row?.raisePurchase);
  document.getElementById("transactionPurchasedActual").checked = Boolean(row?.purchasedActual);
  document.getElementById("transactionRemarks").value = row?.remarks || "";
  dialog.showModal();
}

function openRequestLineTransactionDialog(reqKey, lineIndex) {
  if (!canEditRequests()) return;
  const request = legacyRequests().find((row) => requestKey(row) === String(reqKey));
  const line = request?.lines?.[lineIndex];
  if (!request || !line) return;
  const existing = state.transactions.find((row) => row.sourceRequestKey === requestKey(request) && Number(row.sourceLineIndex) === Number(lineIndex));
  if (existing) {
    openTransactionDialog(existing.id);
    return;
  }
  const itemId = findApprovedItemForLegacyLine(line);
  const building = state.buildings.find((row) => normalizeText(row.number || row.code) === normalizeText(request.BdNo));
  const technician = state.technicians.find((row) => normalizeText(row.nameEn) === normalizeText(line.tech) || normalizeText(row.nameAr) === normalizeText(line.tech));
  const issueType = state.transactionTypes.find((row) => row.id === "tt-2") || state.transactionTypes.find((row) => Number(row.effect || 0) < 0) || state.transactionTypes[0];
  const qty = requestLineQuantities(request, line, lineIndex);
  openTransactionDialog(null, issueType?.id || "", itemId);
  pendingTransactionMeta = { sourceRequestKey: requestKey(request), sourceLineIndex: lineIndex };
  applyTransactionPreset({
    date: request.stDate || today(),
    typeId: issueType?.id || "",
    qty: Number(qty.remainingQty || line.Qty || 1) || 1,
    departmentId: departmentIdForLegacyLine(state.departments, line) || byId(state.items, itemId)?.departmentId || state.departments[0]?.id || "",
    itemId,
    buildingId: building?.id || "",
    technicianId: technician?.id || "",
    requestNo: requestDisplayNo(request),
    storeProvided: Boolean(line.store),
    urgentVip: Boolean(line.urgent),
    raisePurchase: !line.store,
    purchasedActual: !line.store && Boolean(line.done) && !line.cancel,
    remarks: `Materials request ${requestDisplayNo(request)} / order ${line.orderNo || ""}`,
  });
}

function applyTransactionPreset(preset = {}) {
  if (preset.date) document.getElementById("transactionDate").value = preset.date;
  if (preset.typeId) document.getElementById("transactionType").value = preset.typeId;
  if (preset.qty) document.getElementById("transactionQty").value = preset.qty;
  if (preset.departmentId) {
    document.getElementById("transactionDepartment").value = preset.departmentId;
    updateTransactionFilteredSelects();
  }
  if (preset.itemId) document.getElementById("transactionItem").value = preset.itemId;
  if (preset.buildingId) document.getElementById("transactionBuilding").value = preset.buildingId;
  if (preset.technicianId) document.getElementById("transactionRequestedBy").value = preset.technicianId;
  if (preset.requestNo) document.getElementById("transactionRequestNo").value = preset.requestNo;
  if ("storeProvided" in preset) document.getElementById("transactionStoreProvided").checked = Boolean(preset.storeProvided);
  if ("urgentVip" in preset) document.getElementById("transactionUrgentVip").checked = Boolean(preset.urgentVip);
  if ("raisePurchase" in preset) document.getElementById("transactionRaisePurchase").checked = Boolean(preset.raisePurchase);
  if ("purchasedActual" in preset) document.getElementById("transactionPurchasedActual").checked = Boolean(preset.purchasedActual);
  if (preset.remarks) document.getElementById("transactionRemarks").value = preset.remarks;
}

function deleteItem(id) {
  if (!canManageMaterials()) return;
  if (!confirm(tr("confirmDelete"))) return;
  state.deletedItemIds = [...new Set([...(state.deletedItemIds || []), id])];
  state.items = state.items.filter((row) => row.id !== id);
  state.transactions = state.transactions.filter((row) => row.itemId !== id);
  saveState();
  render();
  toast(tr("deleted"));
}

function deleteBuilding(id) {
  if (!canManageSetup()) return;
  if (!confirm(tr("confirmDelete"))) return;
  state.deletedBuildingIds = [...new Set([...(state.deletedBuildingIds || []), id])];
  state.buildings = state.buildings.filter((row) => row.id !== id);
  state.transactions = state.transactions.map((row) => row.buildingId === id ? { ...row, buildingId: "" } : row);
  saveState();
  render();
  toast(tr("deleted"));
}

function deleteMaster(kind, id) {
  if (!canManageSetup()) return;
  if (kind === "buildings") return deleteBuilding(id);
  if (!confirm(tr("confirmDelete"))) return;
  if (kind === "technicians") state.deletedTechnicianIds = [...new Set([...(state.deletedTechnicianIds || []), id])];
  state[kind] = (state[kind] || []).filter((row) => row.id !== id);
  if (kind === "technicians") state.transactions = state.transactions.map((row) => row.technicianId === id ? { ...row, technicianId: "", requestedBy: "" } : row);
  saveState();
  render();
  toast(tr("deleted"));
}

function openMasterDialog(kind, id) {
  if (!canManageSetup()) return;
  const names = { categories: tr("category"), departments: tr("department"), units: tr("unit"), locations: tr("location"), buildings: tr("building"), technicians: tr("technicians"), transactionTypes: tr("type") };
  const row = id ? byId(state[kind], id) : null;
  document.getElementById("masterKind").value = kind;
  document.getElementById("masterId").value = row?.id || "";
  document.getElementById("masterDialogTitle").textContent = row ? tr("editMaster") : `${tr("addMaster")} ${names[kind]}`;
  document.getElementById("masterCode").value = row?.code || "";
  document.getElementById("masterNameAr").value = row?.nameAr || "";
  document.getElementById("masterNameEn").value = row?.nameEn || "";
  document.getElementById("masterDepartment").value = row?.departmentId || state.departments[0]?.id || "";
  document.getElementById("masterBuildingNo").value = row?.number || "";
  document.getElementById("masterEffect").value = row?.effect ?? "1";
  document.getElementById("effectLabel").style.display = kind === "transactionTypes" ? "grid" : "none";
  document.getElementById("buildingNumberLabel").style.display = kind === "buildings" ? "grid" : "none";
  document.getElementById("masterDepartmentLabel").style.display = kind === "technicians" ? "grid" : "none";
  document.getElementById("masterDialog").showModal();
}

let selectedLegacyRequestNo = null;
let pendingTransactionMeta = null;

function legacyData() {
  return window.LEGACY_ACCESS_DATA || {
    requestHeaders: [],
    requestLines: [],
    buildings: [],
    sections: [],
    technicians: [],
    sites: [],
    units: [],
  };
}

function legacyRequests() {
  const data = legacyData();
  const deleted = new Set((state.deletedLegacyRequestNos || []).map((value) => String(value)));
  const lineGroups = new Map();
  data.requestLines.forEach((line) => {
    const key = String(line.storeNo || "");
    if (!lineGroups.has(key)) lineGroups.set(key, []);
    lineGroups.get(key).push(line);
  });
  const originalRequests = data.requestHeaders.filter((header) => !deleted.has(requestKey(header))).map((header) => ({
    ...header,
    lines: lineGroups.get(String(header.storeNo || "")) || [],
  }));
  const reorderRequests = (state.reorderRequests || []).filter((request) => !deleted.has(requestKey(request)));
  const reordersBySource = new Map();
  reorderRequests.forEach((request) => {
    const sourceNo = String(request.sourceStoreNo || request.storeNo || "");
    if (!reordersBySource.has(sourceNo)) reordersBySource.set(sourceNo, []);
    reordersBySource.get(sourceNo).push(request);
  });
  reordersBySource.forEach((requests) => {
    requests.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  });

  const grouped = [];
  originalRequests.forEach((request) => {
    const sourceNo = String(request.storeNo || "");
    grouped.push(...(reordersBySource.get(sourceNo) || []), request);
    reordersBySource.delete(sourceNo);
  });
  reordersBySource.forEach((requests) => grouped.unshift(...requests));
  return grouped;
}

function requestKey(requestOrStoreNo, suffix = "") {
  if (typeof requestOrStoreNo === "object" && requestOrStoreNo) {
    return `${requestOrStoreNo.storeNo || ""}${requestOrStoreNo.reorderSuffix || ""}`;
  }
  return `${requestOrStoreNo || ""}${suffix || ""}`;
}

function requestDisplayNo(requestOrStoreNo, suffix = "") {
  const raw = typeof requestOrStoreNo === "object" && requestOrStoreNo ? requestOrStoreNo.storeNo : requestOrStoreNo;
  const mark = typeof requestOrStoreNo === "object" && requestOrStoreNo ? requestOrStoreNo.reorderSuffix : suffix;
  return `${padRequestNo(raw)}${mark ? ` ${mark}` : ""}`;
}

function latestReorderForOriginal(storeNo) {
  const deleted = new Set((state.deletedLegacyRequestNos || []).map((value) => String(value)));
  return (state.reorderRequests || [])
    .filter((request) => String(request.sourceStoreNo || request.storeNo || "") === String(storeNo || "") && !deleted.has(requestKey(request)))
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0] || null;
}

function renderMaterialRequests() {
  const body = document.getElementById("materialRequestsBody");
  const preview = document.getElementById("materialRequestPreview");
  if (!body || !preview) return;

  const query = document.getElementById("requestSearch")?.value.trim().toLowerCase() || "";
  const orderQuery = document.getElementById("requestOrderSearch")?.value.trim().toLowerCase() || "";
  const storeQuery = document.getElementById("requestStoreSearch")?.value.trim().toLowerCase() || "";
  const buildingQuery = document.getElementById("requestBuildingSearch")?.value.trim().toLowerCase() || "";
  const rows = legacyRequests().filter((request) => {
    const text = [
      request.storeNo,
      request.stDate,
      request.site,
      request.building,
      request.BdNo,
      request.RmNo,
      ...request.lines.flatMap((line) => [line.orderNo, line.descrption, line.section, line.tech]),
    ].join(" ").toLowerCase();
    const orderText = request.lines.map((line) => String(line.orderNo || "")).join(" ").toLowerCase();
    const storeText = [request.storeNo, requestDisplayNo(request), requestKey(request)].join(" ").toLowerCase();
    const buildingText = [request.BdNo, request.building].join(" ").toLowerCase();
    return text.includes(query)
      && (!orderQuery || orderText.includes(orderQuery))
      && (!storeQuery || storeText.includes(storeQuery))
      && (!buildingQuery || buildingText.includes(buildingQuery));
  });

  if (!selectedLegacyRequestNo && rows.length) selectedLegacyRequestNo = requestKey(rows[0]);
  if (rows.length && !rows.some((row) => requestKey(row) === String(selectedLegacyRequestNo))) selectedLegacyRequestNo = requestKey(rows[0]);

  body.innerHTML = rows.length ? rows.slice(0, 300).map((request) => {
    const urgentCount = request.lines.filter((line) => Boolean(line.urgent)).length;
    const storeCount = request.lines.filter((line) => Boolean(line.store)).length;
    const purchaseCount = Math.max(0, request.lines.length - storeCount);
    const purchasedActualCount = request.lines.filter((line) => !line.store && line.done && !line.cancel).length;
    const key = requestKey(request);
    const active = key === String(selectedLegacyRequestNo) ? " active-row" : "";
    const linkedReorder = request.reorderSuffix ? null : latestReorderForOriginal(request.storeNo);
    const originalButton = request.reorderSuffix ? `<button class="icon-button" title="${escapeHtml(tr("originalRequestPreview"))}" onclick="selectOriginalMaterialRequest('${escapeHtml(request.sourceStoreNo || request.storeNo)}')">↩</button>` : "";
    const reorderPreviewButton = linkedReorder ? `<button class="icon-button" title="${escapeHtml(tr("reorderRequestPreview"))}" onclick="selectReorderMaterialRequest('${escapeHtml(request.storeNo)}')">↥</button>` : "";
    const editActions = canEditRequests() ? `<button class="icon-button request-edit-action" title="${escapeHtml(tr("reorderRemaining"))}" onclick="reorderRemainingRequestItems('${escapeHtml(request.storeNo)}')">R</button>
            <button class="icon-button danger request-edit-action" title="${escapeHtml(tr("deleteRequest"))}" onclick="deleteMaterialRequest('${escapeHtml(key)}')">x</button>` : "";
    const inlineEditActions = canEditRequests() ? `<button class="ghost-button request-edit-action" onclick="reorderRemainingRequestItems('${escapeHtml(request.storeNo)}')">R ${tr("reorderRemaining")}</button><button class="ghost-button danger request-edit-action" onclick="deleteMaterialRequest('${escapeHtml(key)}')">x ${tr("deleteRequest")}</button>` : "";
    const inlineExportAction = canExportRequests() ? `<button class="ghost-button request-export-action" onclick="exportSelectedRequestExcel()">X ${tr("toExcel")}</button>` : "";
    const adjustments = canEditRequests() ? materialRequestAdjustmentTable(request) : "";
    return `<tr class="${active}">
      <td colspan="7">
        <div class="request-row-card">
          <div><small>${tr("reqSerial")}</small><b>${requestDisplayNo(request)}</b></div>
          <div><small>${tr("date")}</small>${escapeHtml(formatDateDisplay(request.stDate))}</div>
          <div><small>${tr("site")}</small>${escapeHtml(request.site || "")}</div>
          <div><small>${tr("buildingNo")}</small>${escapeHtml(request.BdNo || "")}</div>
          <div><small>${tr("roomNo")}</small>${escapeHtml(request.RmNo || "")}</div>
          <div class="request-building"><small>${tr("building")}</small>${escapeHtml(request.building || "")}</div>
          <div><small>${tr("itemsCount")}</small><span class="badge">${request.lines.length}</span></div>
          <div><small>${tr("urgent")}</small>${urgentCount ? `<span class="badge warn">${urgentCount}</span>` : `<span class="badge">0</span>`}</div>
          <div><small>${tr("availableStore")}</small><span class="badge">${storeCount}</span></div>
          <div><small>${tr("purchase")}</small><span class="badge">${purchaseCount}</span></div>
          <div><small>${tr("purchasedActual")}</small><span class="badge">${purchasedActualCount}</span></div>
          <div class="request-card-actions">
            <button class="primary-button" title="${escapeHtml(tr("requestPreview"))}" onclick="selectMaterialRequest('${escapeHtml(key)}')">${tr("requestPreview")}</button>
            ${originalButton}
            ${reorderPreviewButton}
            ${editActions}
          </div>
        </div>
      </td>
    </tr>${active ? `<tr class="inline-preview-row"><td colspan="7"><div class="inline-request-actions">${request.reorderSuffix ? `<button class="ghost-button" onclick="selectOriginalMaterialRequest('${escapeHtml(request.sourceStoreNo || request.storeNo)}')">↩ ${tr("originalRequestPreview")}</button>` : ""}<button class="ghost-button" onclick="reorderRemainingRequestItems('${escapeHtml(request.storeNo)}')">R ${tr("reorderRemaining")}</button><button class="ghost-button danger" onclick="deleteMaterialRequest('${escapeHtml(key)}')">x ${tr("deleteRequest")}</button><button class="ghost-button" onclick="printSelectedMaterialRequest()">⎙ ${tr("printReport")}</button><button class="ghost-button" onclick="exportSelectedRequestExcel()">X ${tr("toExcel")}</button></div>${materialRequestAdjustmentTable(request)}<div class="request-paper inline-request-paper">${materialRequestPaper(request)}</div></td></tr>` : ""}`;
  }).join("") : `<tr><td colspan="7" class="empty">${tr("noRows")}</td></tr>`;

  const selected = rows.find((row) => requestKey(row) === String(selectedLegacyRequestNo)) || rows[0];
  preview.innerHTML = selected ? "" : `<div class="empty">${tr("noRows")}</div>`;
  applyPermissions();
}

function materialRequestAdjustmentTable(request) {
  if (!request?.lines?.length) return "";
  const reqKey = requestKey(request);
  return `<div class="request-adjustments">
    <div class="adjustment-title">${escapeHtml(tr("purchasedActual"))}</div>
    <table>
      <thead><tr><th>${escapeHtml(tr("description"))}</th><th>${escapeHtml(tr("requestedQty"))}</th><th>${escapeHtml(tr("actualPurchasedQty"))}</th><th>${escapeHtml(tr("notPurchasedQty"))}</th><th>${escapeHtml(tr("editRequestLine"))}</th></tr></thead>
      <tbody>${request.lines.map((line, index) => {
        const key = requestLineKey(request, line, index);
        const qty = requestLineQuantities(request, line, index);
        return `<tr>
          <td>${escapeHtml(line.descrption || "")}</td>
          <td>${escapeHtml(qty.qty)}</td>
          <td><input class="qty-adjust-input" type="number" min="0" max="${escapeHtml(qty.raisedPurchaseQty)}" step="1" value="${escapeHtml(qty.actualPurchasedQty)}" onchange="saveRequestLinePurchasedQty('${escapeHtml(key)}', this.value)" ${line.store ? "disabled" : ""}></td>
          <td>${escapeHtml(qty.remainingQty)}</td>
          <td><button class="mini-button" title="${escapeHtml(tr("editRequestLine"))}" onclick="openRequestLineTransactionDialog('${escapeHtml(reqKey)}', ${index})">✎</button></td>
        </tr>`;
      }).join("")}</tbody>
    </table>
  </div>`;
}

function selectMaterialRequest(key) {
  selectedLegacyRequestNo = key;
  renderMaterialRequests();
}

function selectOriginalMaterialRequest(storeNo) {
  selectedLegacyRequestNo = requestKey(storeNo);
  renderMaterialRequests();
}

function selectReorderMaterialRequest(storeNo) {
  const reorder = latestReorderForOriginal(storeNo);
  if (!reorder) {
    toast(tr("noRemainingItems"));
    return;
  }
  selectedLegacyRequestNo = requestKey(reorder);
  renderMaterialRequests();
}

function reorderRemainingRequestItems(storeNo) {
  if (!canEditRequests()) return;
  const request = legacyRequests().find((row) => String(row.storeNo) === String(storeNo) && !row.reorderSuffix);
  if (!request) return;
  const building = state.buildings.find((row) => normalizeText(row.number || row.code) === normalizeText(request.BdNo));
  const issueType = state.transactionTypes.find((row) => row.id === "tt-2") || state.transactionTypes.find((row) => Number(row.effect || 0) < 0) || state.transactionTypes[0];
  const remainingLines = [];
  request.lines.forEach((line, index) => {
    const qty = requestLineQuantities(request, line, index);
    if (Number(qty.remainingQty || 0) <= 0 || line.store || line.cancel) return;
    remainingLines.push({
      ...line,
      Qty: Number(qty.remainingQty || 0),
      store: false,
      done: false,
      cancel: false,
      actualPurchasedQty: 0,
      sourceLineIndex: index,
    });
  });
  if (!remainingLines.length) {
    toast(tr("noRemainingItems"));
    return;
  }

  const reorderRequest = {
    ...request,
    id: uid("request-r"),
    sourceStoreNo: request.storeNo,
    reorderSuffix: "R",
    createdBy: currentUserName(),
    createdAt: new Date().toISOString(),
    lines: remainingLines,
  };
  const signature = reorderSignature(reorderRequest);
  const duplicate = (state.reorderRequests || []).find((row) => reorderSignature(row) === signature);
  if (duplicate) {
    selectedLegacyRequestNo = requestKey(duplicate);
    render();
    toast(`${tr("duplicateReorder")}: ${requestDisplayNo(duplicate)}`);
    return;
  }

  const created = [];
  remainingLines.forEach((line, index) => {
    const itemId = findApprovedItemForLegacyLine(line);
    if (!itemId) return;
    const technician = state.technicians.find((row) => normalizeText(row.nameEn) === normalizeText(line.tech) || normalizeText(row.nameAr) === normalizeText(line.tech));
    created.push({
      id: uid("reorder"),
      date: request.stDate || today(),
      itemId,
      typeId: issueType?.id || "",
      qty: Number(line.Qty || 0),
      departmentId: departmentIdForLegacyLine(state.departments, line) || byId(state.items, itemId)?.departmentId || state.departments[0]?.id || "",
      buildingId: building?.id || "",
      technicianId: technician?.id || "",
      requestedBy: currentUserName(),
      requestNo: requestDisplayNo(reorderRequest),
      storeProvided: false,
      urgentVip: Boolean(line.urgent),
      raisePurchase: true,
      purchasedActual: false,
      sourceRequestKey: requestKey(reorderRequest),
      sourceLineIndex: index,
      remarks: `Reorder remaining from materials request ${requestDisplayNo(reorderRequest)} / order ${line.orderNo || ""}`,
    });
  });
  state.reorderRequests = state.reorderRequests || [];
  state.reorderRequests.unshift(reorderRequest);
  state.transactions.push(...created);
  selectedLegacyRequestNo = requestKey(reorderRequest);
  saveState();
  render();
  toast(`${tr("reorderedRemaining")}: ${requestDisplayNo(reorderRequest)}`);
}

function reorderSignature(request) {
  const lines = (request.lines || []).map((line) => [
    normalizeText(line.orderNo),
    normalizeText(line.itmNo),
    normalizeText(line.descrption),
    Number(line.Qty || 0),
    normalizeText(line.type),
    normalizeText(line.section),
  ].join(":")).sort().join("|");
  return [request.sourceStoreNo || request.storeNo, request.BdNo || "", request.stDate || "", lines].join("||");
}

function findApprovedItemForLegacyLine(line) {
  const departmentId = departmentIdForLegacyLine(state.departments, line) || state.departments[0]?.id || "";
  const key = materialKey(line.descrption, departmentId);
  const approvedItems = approvedStoreItems();
  const byName = approvedItems.find((row) => materialKey(row.nameEn || row.nameAr, row.departmentId) === key);
  if (byName) return byName.id;
  const itemNo = normalizeText(line.itmNo);
  if (!itemNo) return "";
  const byCode = approvedItems.find((row) => normalizeText(row.code) === itemNo || normalizeText(itemCodeSuffix(row.code)) === itemNo);
  return byCode?.id || "";
}

function deleteMaterialRequest(key) {
  if (!canEditRequests()) return;
  const request = legacyRequests().find((row) => requestKey(row) === String(key));
  if (!request || !currentUser) return;
  const password = prompt(tr("passwordRequired"));
  if (password === null) return;
  if (password !== currentUser.password) {
    toast(tr("wrongPassword"));
    return;
  }
  if (!confirm(`${tr("confirmDelete")} ${requestDisplayNo(request)}`)) return;
  state.deletedLegacyRequestNos = [...new Set([...(state.deletedLegacyRequestNos || []), requestKey(request)])];
  if (request.reorderSuffix) {
    state.reorderRequests = (state.reorderRequests || []).filter((row) => requestKey(row) !== requestKey(request));
    state.transactions = (state.transactions || []).filter((row) => row.sourceRequestKey !== requestKey(request));
  }
  if (String(selectedLegacyRequestNo) === requestKey(request)) selectedLegacyRequestNo = null;
  saveState();
  renderMaterialRequests();
  toast(tr("deleted"));
}

function padRequestNo(value) {
  return String(value || "").padStart(7, "0");
}

function formatDateDisplay(value) {
  if (!value) return "";
  const raw = String(value).slice(0, 10);
  const parts = raw.includes("-") ? raw.split("-") : raw.split("/");
  if (parts.length !== 3) return raw;
  if (parts[0].length === 4) return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
  return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2]}`;
}

function materialRequestPaper(request) {
  const lines = request.lines.length ? request.lines : [{}];
  const userName = currentUserName();
  return `<div class="paper-head">
    <div>
      <img src="assets/oan-logo.png" class="paper-logo" alt="OAN">
      <div><b>Vat No.</b> 301087467200003</div>
    </div>
    <div class="paper-title">
      <div>قصر العزيزية - الرياض</div>
      <div>التشغيل والصيانة</div>
      <div>Al-Aziziya Palace - Riyadh</div>
      <div>Operation and Maintenance</div>
      <strong>Materials Request</strong>
    </div>
    <div>
      <div style="font-size:54px;font-weight:800;line-height:1;color:#444;text-align:center">tdix</div>
      <div style="text-align:center;color:#999;font-size:11px;letter-spacing:1px">MAINTENANCE</div>
    </div>
  </div>
  <div class="request-meta">
    <div><b>Req. SN.</b><span style="color:#b00000;font-size:18px;font-weight:700">${requestDisplayNo(request)}</span></div>
    <div><b>Req. Date</b> ${escapeHtml(formatDateDisplay(request.stDate))}</div>
    <div><b>Site</b> <span style="background:#ddd;padding:3px 18px">${escapeHtml(request.site || "")}</span></div>
    <div><b>Buld. No.</b> ${escapeHtml(request.BdNo || "")}</div>
    <div><b>Room No.</b> ${escapeHtml(request.RmNo || "")}</div>
  </div>
  ${request.reorderSuffix ? `<div style="text-align:center;font-weight:700;color:#b00000;margin:3px 0 6px">${escapeHtml(tr("reorderRemaining"))} ${escapeHtml(tr("fromOriginalRequest"))} ${requestDisplayNo(request.sourceStoreNo || request.storeNo)}</div>` : ""}
  <div style="text-align:right;font-weight:700;margin:4px 0 8px">${escapeHtml(request.building || "")}</div>
  <table>
    <thead>
      <tr>
        <th style="width:36px">#</th>
        <th style="width:90px">Order No.</th>
        <th>Description</th>
        <th style="width:70px">Qty.</th>
        <th style="width:82px">Type</th>
        <th style="width:110px">Section</th>
        <th style="width:110px">Requested by</th>
        <th style="width:58px">Urgent</th>
        <th style="width:95px">Available/Store</th>
        <th style="width:92px">Raised to Purchase</th>
        <th style="width:92px">Actually Purchased</th>
      </tr>
    </thead>
    <tbody>
      ${lines.map((line, index) => `<tr>
        <td style="text-align:center">${index + 1}</td>
        <td style="text-align:center">${escapeHtml(line.orderNo || "")}</td>
        <td>${escapeHtml(line.descrption || "")}</td>
        <td style="text-align:center">${escapeHtml(line.Qty ?? "")}</td>
        <td>${escapeHtml(line.type || "")}</td>
        <td>${escapeHtml(line.section || "")}</td>
        <td>${escapeHtml(line.tech || "")}</td>
        <td style="text-align:center">${line.urgent ? "☑" : "☐"}</td>
        <td style="text-align:center">${line.store ? "☑" : "☐"}</td>
        <td style="text-align:center">${line.store ? "☐" : "☑"}</td>
        <td style="text-align:center">${!line.store && line.done && !line.cancel ? "☑" : "☐"}</td>
      </tr>`).join("")}
    </tbody>
  </table>
  <div class="signatures">
    <div class="signature-box" dir="rtl">
      <b>Supervisor</b>
      <p>اعتماد مشرف الصيانة بصحة الحاجة الفنية لقطع الغيار وفق متطلبات العمل.</p>
      <div>اسم مشرف المناوب / ............................................</div>
      <div>التوقيع: ........................ التاريخ: ....../....../..........</div>
    </div>
    <div class="signature-box" dir="rtl">
      <b>Store</b>
      <p><b>Storekeeper \\</b> ${escapeHtml(userName || "Abubakr")} <b>/ أمين المستودع</b></p>
      <div>Signature: ............................................ : التوقيع</div>
      <div>Date: ........../........../............</div>
    </div>
  </div>
  <div class="paper-foot">
    <div>Printing date ${escapeHtml(printDateTime())}</div>
    <div>صفحة 1 من 1</div>
    <div>User.${escapeHtml(currentUserName())}</div>
  </div>`;
}

function selectedMaterialRequest() {
  return legacyRequests().find((row) => requestKey(row) === String(selectedLegacyRequestNo));
}

function currentUserName() {
  return currentUser?.displayName || currentUser?.username || "admin";
}

function printDateTime() {
  return new Date().toLocaleString(lang === "ar" ? "ar-SA" : "en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function updateAppClock() {
  const clock = document.getElementById("appClock");
  if (!clock) return;
  clock.textContent = new Date().toLocaleString(lang === "ar" ? "ar-SA" : "en-GB", {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function printMetaHtml() {
  return `<div class="print-meta">${escapeHtml(tr("username"))}: ${escapeHtml(currentUserName())} | ${escapeHtml(tr("printingDate"))}: ${escapeHtml(printDateTime())}</div>`;
}

function printSelectedMaterialRequest() {
  const selected = selectedMaterialRequest();
  if (!selected) return;
  printHtml(`Materials Request ${requestDisplayNo(selected)}`, `<main class="request-paper">${materialRequestPaper(selected)}</main>`, "landscape");
}

function printCurrentReport() {
  const scoped = buildReportRows();
  const exportRows = stockRowsForExport();
  const rows = scoped.type === "stock" ? exportRows : exportRows.slice(1, -2);
  const title = scoped.type === "stock" ? tr("reportStock") : scoped.title;
  const html = `<section class="print-report">
    <h1>${escapeHtml(title)}</h1>
    ${printMetaHtml()}
    ${tableHtml(rows)}
    ${scoped.type === "stock" ? "" : `<div class="report-summary print-summary">${reportSummaryHtml(scoped)}</div>`}
  </section>`;
  printHtml(title, html, "landscape");
}

function printDashboardReport() {
  const departmentId = selectedDashboardDepartmentId();
  const departmentStockRows = dashboardDepartmentStockRows(departmentId);
  const recent = dashboardDepartmentTransactions(departmentId, departmentStockRows).slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const lowTable = [[tr("code"), tr("item"), tr("stock"), tr("minQty"), tr("department")],
    ...departmentStockRows.map(({ item, stock }) => [item.code, itemLabel(item), stock, item.minQty, labelOf(byId(state.departments, item.departmentId))])];
  const recentTable = [[tr("date"), tr("item"), tr("qty"), tr("department"), tr("buildingNo"), tr("building"), tr("requestedBy")],
    ...recent.map((row) => {
      const buildingRow = byId(state.buildings, row.buildingId);
      return [row.date || "", itemLabel(byId(state.items, row.itemId)), row.qty || "", labelOf(byId(state.departments, row.departmentId)), buildingRow?.number || buildingRow?.code || "", labelOf(buildingRow), row.requestedBy || ""];
    })];
  const html = `<section class="print-report">
    <h1>${escapeHtml(dashboardDepartmentTitle())}</h1>
    ${printMetaHtml()}
    <h2>${escapeHtml(dashboardDepartmentTitle())}</h2>
    ${tableHtml(lowTable)}
    <h2>${escapeHtml(tr("recent"))}</h2>
    ${tableHtml(recentTable)}
  </section>`;
  printHtml(dashboardDepartmentTitle(), html, "landscape");
}

function tableHtml(rows) {
  if (!rows.length) return `<div class="empty">${escapeHtml(tr("noRows"))}</div>`;
  const [header, ...body] = rows;
  return `<table><thead><tr>${header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead><tbody>${body.map((row) => {
    const isTotal = row.some((cell) => String(cell || "") === tr("reportRequestSummary"));
    return `<tr${isTotal ? ' class="report-total-row"' : ""}>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`;
  }).join("")}</tbody></table>`;
}

function printHtml(title, bodyHtml, orientation = "portrait") {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html dir="${document.documentElement.dir}" lang="${document.documentElement.lang}">
    <head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${printCss(orientation)}</style></head>
    <body>${bodyHtml}</body></html>`);
  printWindow.document.close();

  const runPrint = () => {
    printWindow.focus();
    printWindow.print();
  };
  if (printWindow.document.readyState === "complete") {
    setTimeout(runPrint, 100);
  } else {
    printWindow.addEventListener("load", () => setTimeout(runPrint, 100), { once: true });
  }
}

function printCss(orientation) {
  return `
    @page { size: A4 ${orientation}; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111; background: #fff; font-family: Arial, Tahoma, sans-serif; font-size: 11px; }
    h1 { margin: 0 0 8px; font-size: 18px; text-align: center; }
    h2 { margin: 12px 0 6px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    th, td { border: 1px solid #777; padding: 4px 5px; vertical-align: top; }
    th { background: #eee; font-weight: 700; }
    .report-total-row td { background: #f2ead9; font-weight: 700; }
    .request-paper { width: 100%; color: #111; background: #fff; font-size: 11px; overflow: visible; }
    .request-paper .paper-head { display: grid; grid-template-columns: 150px 1fr 150px; gap: 12px; align-items: start; }
    .request-paper .paper-logo { max-width: 118px; max-height: 82px; object-fit: contain; }
    .request-paper .paper-title { text-align: center; line-height: 1.25; }
    .request-paper .paper-title strong { display: block; font-size: 17px; margin-top: 6px; }
    .request-paper .request-meta { display: grid; grid-template-columns: repeat(5, auto); gap: 8px; margin: 10px 0 6px; }
    .request-paper table { font-size: 10.5px; }
    .request-paper .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 34px; margin-top: 10px; text-align: center; }
    .request-paper .signature-box { min-height: 128px; border: 1px solid #aaa; padding: 10px 14px; display: grid; gap: 10px; line-height: 1.8; text-align: center; }
    .request-paper .signature-box p { margin: 4px 0 8px; line-height: 1.8; }
    .request-paper .paper-foot { display: flex; justify-content: space-between; margin-top: 8px; }
  `;
}

function exportSelectedRequestExcel() {
  if (!canExportRequests()) return;
  const selected = selectedMaterialRequest();
  if (!selected) return;
  const rows = [
    ["Req. SN", requestDisplayNo(selected)],
    [tr("username"), currentUserName()],
    [tr("printingDate"), printDateTime()],
    ["Req. Date", formatDateDisplay(selected.stDate)],
    ["Site", selected.site || ""],
    ["Building", selected.building || ""],
    ["Building No.", selected.BdNo || ""],
    [],
    ["#", "Order No.", "Description", "Qty.", "Type", "Section", "Requested by", "Urgent", "Available/Store"],
    ...selected.lines.map((line, index) => [index + 1, line.orderNo || "", line.descrption || "", line.Qty ?? "", line.type || "", line.section || "", line.tech || "", line.urgent ? "Yes" : "", line.store ? "Yes" : "", line.store ? "" : "Yes"]),
  ];
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><table>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</table></body></html>`;
  download(`reports/materials-request-${requestDisplayNo(selected).replace(/\s+/g, "-")}.xls`, "\ufeff" + html, "application/vnd.ms-excel");
}

function exportJson() {
  download(`backups/full-application-backup-${fileStamp()}.json`, JSON.stringify(state, null, 2), "application/json");
}

function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = normalizeState({ ...structuredClone(seedData), ...JSON.parse(reader.result) });
      lang = state.language || lang;
      saveState();
      applyLanguage();
      render();
      toast(tr("restored"));
    } catch {
      toast(tr("badFile"));
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

function importBuildings(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const rows = parseTableText(reader.result).filter((row) => row.length >= 2);
      const imported = rows
        .filter((row) => !/code|الكود|building/i.test(row[0]))
        .map((row) => building(uid("bld"), clean(row[0]).toUpperCase(), clean(row[2] || row[1]), clean(row[3] || row[1]), clean(row[1] || row[0])));
      if (imported.length) {
        state.buildings = imported;
        saveState();
        render();
      }
      toast(tr("buildingsImported"));
    } catch {
      toast(tr("badFile"));
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

function parseTableText(text) {
  if (/<table/i.test(text)) {
    const doc = new DOMParser().parseFromString(text, "text/html");
    return [...doc.querySelectorAll("tr")].map((tr) => [...tr.children].map((td) => clean(td.textContent)));
  }
  const delimiter = text.includes("\t") ? "\t" : ",";
  return text.split(/\r?\n/).filter(Boolean).map((line) => splitDelimited(line, delimiter));
}

function splitDelimited(line, delimiter) {
  const out = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { out.push(clean(current)); current = ""; }
    else current += char;
  }
  out.push(clean(current));
  return out;
}

function clean(value) {
  return String(value ?? "").replace(/^"|"$/g, "").trim();
}

function downloadBuildingsTemplate() {
  const rows = [["Code", "BuildingNo", "NameAr", "NameEn"], ["PAL", "1", "القصر الرئيسي", "Main Palace"], ["ADMIN", "2", "مبنى الإدارة", "Administration Building"]];
  download("buildings-template.csv", "\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
}

function exportExcel(kind) {
  const rows = kind === "stock" ? stockRowsForExport() : transactionRowsForExport();
  const title = kind === "stock" ? tr("exportStockExcel") : tr("exportTransExcel");
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
    <table>
      <tr><td colspan="${rows[0].length}"><b>${escapeHtml(tr("projectName"))}</b></td></tr>
      <tr><td colspan="${rows[0].length}"><b>${escapeHtml(tr("companyName"))}</b></td></tr>
      <tr><td colspan="${rows[0].length}"><b>${escapeHtml(title)}</b></td></tr>
      <tr><td colspan="${rows[0].length}">${escapeHtml(tr("username"))}: ${escapeHtml(currentUserName())}</td></tr>
      <tr><td colspan="${rows[0].length}">${escapeHtml(tr("printingDate"))}: ${escapeHtml(printDateTime())}</td></tr>
      ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}
    </table>
  </body></html>`;
  download(kind === "stock" ? `reports/stock-report-${fileStamp()}.xls` : `reports/transactions-report-${fileStamp()}.xls`, "\ufeff" + html, "application/vnd.ms-excel");
}

function stockRowsForExport() {
  const scoped = buildReportRows();
  if (scoped.type !== "stock") {
    const showBuildingNo = shouldShowReportBuildingNo(scoped);
    const header = showBuildingNo
      ? [tr("reqSerial"), tr("date"), tr("buildingNo"), tr("orderNo"), tr("description"), tr("requestedQty"), tr("storeQty"), tr("raisedPurchaseQty"), tr("actualPurchasedQty"), tr("remainingQty"), tr("unit"), tr("section"), tr("requestedBy"), tr("urgent")]
      : [tr("reqSerial"), tr("date"), tr("orderNo"), tr("description"), tr("requestedQty"), tr("storeQty"), tr("raisedPurchaseQty"), tr("actualPurchasedQty"), tr("remainingQty"), tr("unit"), tr("section"), tr("requestedBy"), tr("urgent")];
    const totals = reportQuantityTotals(scoped);
    const totalRow = showBuildingNo
      ? ["", "", "", "", tr("reportRequestSummary"), totals.qty, totals.storeQty, totals.raisedPurchaseQty, totals.actualPurchasedQty, totals.remainingQty, "", "", "", ""]
      : ["", "", "", tr("reportRequestSummary"), totals.qty, totals.storeQty, totals.raisedPurchaseQty, totals.actualPurchasedQty, totals.remainingQty, "", "", "", ""];
    return [[scoped.title], header,
      ...scoped.rows.map((row) => {
        const base = [row.storeNo || "", formatDateDisplay(row.date)];
        if (showBuildingNo) base.push(row.buildingNo || "");
        return [...base, row.orderNo || "", row.description || "", row.qty ?? "", row.storeQty ?? "", row.raisedPurchaseQty ?? "", row.actualPurchasedQty ?? "", row.remainingQty ?? "", row.unit || "", row.section || "", row.tech || "", row.urgent ? "Yes" : ""];
      }),
      totalRow,
      [],
      [reportSummaryText(scoped)]];
  }
  return [[tr("code"), tr("itemAr"), tr("itemEn"), tr("category"), tr("department"), tr("unit"), tr("stock"), tr("minQty")],
    ...approvedStoreItems().map((row) => [row.code, row.nameAr, row.nameEn || "", labelOf(byId(state.categories, row.categoryId)), labelOf(byId(state.departments, row.departmentId)), labelOf(byId(state.units, row.unitId)), stockFor(row.id), row.minQty])];
}

function transactionRowsForExport() {
  return [[tr("date"), tr("item"), tr("type"), tr("qty"), tr("requestNo"), tr("department"), tr("building"), tr("requestedBy"), tr("purchase"), tr("purchasedActual"), tr("notes")],
    ...approvedStoreTransactions().map((row) => {
      const buildingRow = byId(state.buildings, row.buildingId);
      return [row.date, itemLabel(byId(state.items, row.itemId)), labelOf(byId(state.transactionTypes, row.typeId)), row.qty, row.requestNo || "", labelOf(byId(state.departments, row.departmentId)), buildingRow ? `${buildingRow.number || buildingRow.code} - ${labelOf(buildingRow)}` : "", row.requestedBy || "", row.raisePurchase ? "Yes" : "", row.purchasedActual ? "Yes" : "", row.remarks || ""];
    })];
}

function csvCell(cell) {
  return `"${String(cell ?? "").replaceAll('"', '""')}"`;
}

async function download(filename, content, type) {
  if (fileStorageAvailable) {
    try {
      const response = await fetch(FILE_EXPORT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ filename, content, type }),
      });
      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        const savedName = result.filename || filename.split(/[\\/]/).pop();
        toast(lang === "ar" ? `تم حفظ الملف داخل مجلد التطبيق: ${savedName}` : `Saved inside the app folder: ${savedName}`);
        return;
      }
    } catch {
      // Fall back to the browser download when the local portable server is not available.
    }
  }
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function fileStamp() {
  return new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(message) {
  const toastEl = document.getElementById("toast");
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastEl.timer);
  toastEl.timer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}
