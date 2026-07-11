const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace standard import
code = code.replace(
  "import { Users, Activity, FileText, BarChart3, Settings, ShieldCheck, User as UserIcon, LogOut, CheckCircle, ShieldAlert, Star } from 'lucide-react';",
  "import { Users, Activity, FileText, BarChart3, Settings, ShieldCheck, User as UserIcon, LogOut, CheckCircle, ShieldAlert, Star, Clock } from 'lucide-react';"
);

fs.writeFileSync('src/App.tsx', code);
