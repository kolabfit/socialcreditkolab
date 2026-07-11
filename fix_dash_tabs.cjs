const fs = require('fs');

function updateDashboard(file) {
  let code = fs.readFileSync(file, 'utf8');

  // Insert import
  if (!code.includes("AttendanceHistoryTab")) {
    code = code.replace(
      "import WfhApprovalTable",
      "import AttendanceHistoryTab from './AttendanceHistoryTab';\nimport WfhApprovalTable"
    );
  }

  // Insert tab render
  const target = `{activeTab === 'settings' && (`;
  if (code.includes(target)) {
    const tabCode = `{activeTab === 'attendance' && <AttendanceHistoryTab />}
          
          {activeTab === 'settings' && (`;
    code = code.replace(target, tabCode);
  } else {
    // AcademicDashboard doesn't have settings, maybe profile?
    const target2 = `{activeTab === 'profile' && (`;
    if (code.includes(target2)) {
      const tabCode = `{activeTab === 'attendance' && <AttendanceHistoryTab />}
            
            {activeTab === 'profile' && (`;
      code = code.replace(target2, tabCode);
    }
  }

  fs.writeFileSync(file, code);
  console.log("Updated " + file);
}

updateDashboard('src/components/FieldDashboard.tsx');
updateDashboard('src/components/AcademicDashboard.tsx');
