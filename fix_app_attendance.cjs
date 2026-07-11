const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "useState<'dashboard' | 'users' | 'scores' | 'activities' | 'reports' | 'settings' | 'profile'>",
  "useState<'dashboard' | 'users' | 'scores' | 'activities' | 'reports' | 'attendance' | 'settings' | 'profile'>"
);

const btnTarget = `<FileText className="w-5 h-5" /> Riwayat Penilaian
              </button>`;
const btnNew = `<FileText className="w-5 h-5" /> Riwayat Penilaian
              </button>
              <button onClick={() => setActiveTab('attendance')} className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all \${activeTab === 'attendance' ? 'bg-[#EAB308] text-black shadow-lg shadow-yellow-500/20' : 'text-neutral-400 hover:text-white hover:bg-white/5'}\`}>
                <Clock className="w-5 h-5" /> Riwayat Kehadiran
              </button>`;

code = code.replace(btnTarget, btnNew);

// Clock needs to be imported if not already. Let's just import it from lucide-react.
if(!code.includes("Clock")) {
  code = code.replace("Settings, ", "Settings, Clock, ");
}

fs.writeFileSync('src/App.tsx', code);
