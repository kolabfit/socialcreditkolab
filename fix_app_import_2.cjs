const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import { LogOut, User as UserIcon, BarChart3, Users, Star, Activity, FileText, Settings } from 'lucide-react';",
  "import { LogOut, User as UserIcon, BarChart3, Users, Star, Activity, FileText, Settings, Clock } from 'lucide-react';"
);

fs.writeFileSync('src/App.tsx', code);
