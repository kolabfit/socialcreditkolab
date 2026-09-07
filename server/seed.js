/**
 * Seed Script — Ko+Lab Social Credit Score
 * 
 * Menjalankan script ini akan memasukkan data awal ke Supabase:
 * - 5 Startups
 * - 1 Field (HR) user
 * - 4 Academic users
 * - 28 Intern users
 * - 3 Rubric Aspects
 * 
 * Usage: node server/seed.js
 */
import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { supabase } from './config/supabase.js';

const startups = [
  { id: 's1', name: 'Kroombox', description: '' },
  { id: 's2', name: 'JagoAI', description: '' },
  { id: 's3', name: 'Uniinside', description: '' },
  { id: 's4', name: 'Ngolab', description: '' },
  { id: 's5', name: 'Sorgummi', description: '' },
];

const startupNames = startups.map(s => s.name);

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function seed() {
  console.log('🌱 Starting seed process...\n');

  // 1. Seed startups
  console.log('📦 Seeding startups...');
  const { error: startupError } = await supabase
    .from('startups')
    .upsert(startups, { onConflict: 'id' });
  if (startupError) {
    console.error('❌ Startup seed error:', startupError);
    return;
  }
  console.log(`   ✅ ${startups.length} startups seeded`);

  // 2. Seed rubric aspects
  console.log('📊 Seeding rubric aspects...');
  const rubrics = [
    { id: '1', name: 'Kedisiplinan & Kepatuhan Aturan', weight: 30 },
    { id: '2', name: 'Kualitas Pekerjaan / Project', weight: 40 },
    { id: '3', name: 'Sikap & Perilaku (Attitude)', weight: 30 },
  ];
  const { error: rubricError } = await supabase
    .from('rubric_aspects')
    .upsert(rubrics, { onConflict: 'id' });
  if (rubricError) {
    console.error('❌ Rubric seed error:', rubricError);
    return;
  }
  console.log(`   ✅ ${rubrics.length} rubric aspects seeded`);

  // 3. Seed users
  console.log('👤 Seeding users...');

  const fieldPassword = await hashPassword('kolabcreativehub');
  const academicPassword = await hashPassword('dosenakademik@26');
  const internPassword = await hashPassword('pesertamagang@26');

  const users = [
    // Field (HR)
    {
      id: 'u1',
      name: 'Pembimbing Lapangan (HR)',
      email: 'hr.kolab@gmail.com',
      password_hash: fieldPassword,
      role: 'field',
      score: 0,
      status: 'active',
    },
    // Academics
    {
      id: 'acad_0',
      name: 'Robbi Hendriyanto (Pembimbing Akademik)',
      email: 'robbi.hendriyanto@kolab.com',
      password_hash: academicPassword,
      role: 'academic',
      score: 0,
      lecturer_code: 'RHN',
      advised_startups: [startupNames[0]],
      status: 'active',
    },
    {
      id: 'acad_1',
      name: 'Heru Nugroho (Pembimbing Akademik)',
      email: 'heru.nugroho@kolab.com',
      password_hash: academicPassword,
      role: 'academic',
      score: 0,
      lecturer_code: 'HRO',
      advised_startups: [startupNames[1]],
      status: 'active',
    },
    {
      id: 'acad_2',
      name: 'Muhammad Yusuf Ramadhan (Pembimbing Akademik)',
      email: 'muhammad.yusuf.ramadhan@kolab.com',
      password_hash: academicPassword,
      role: 'academic',
      score: 0,
      lecturer_code: 'MFH',
      advised_startups: [startupNames[2]],
      status: 'active',
    },
    {
      id: 'acad_3',
      name: 'Muhammad Nugraha (Pembimbing Akademik)',
      email: 'muhammad.nugraha@kolab.com',
      password_hash: academicPassword,
      role: 'academic',
      score: 0,
      lecturer_code: 'MHN',
      advised_startups: [startupNames[3]],
      status: 'active',
    },
    // Interns
    ...generateInterns(internPassword),
  ];

  const { error: usersError } = await supabase
    .from('users')
    .upsert(users, { onConflict: 'id' });

  if (usersError) {
    console.error('❌ Users seed error:', usersError);
    return;
  }
  console.log(`   ✅ ${users.length} users seeded`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   HR/Field:   hr.kolab@gmail.com / kolabcreativehub');
  console.log('   Academic:   robbi.hendriyanto@kolab.com / dosenakademik@26');
  console.log('   Intern:     muhammad0@gmail.com / pesertamagang@26');
}

function generateInterns(hashedPassword) {
  const internData = [
    { idx: 0, name: 'Muhammad Hafizh Raharja', email: 'muhammad0@gmail.com', nim: '607124000055', startup: 0 },
    { idx: 1, name: 'Salman Ridhwan Qomarudin', email: 'salman1@gmail.com', nim: '607012430004', startup: 1 },
    { idx: 2, name: 'AFRISYA DWIKY MAULIDDINKA', email: 'afrisya2@gmail.com', nim: '607012400072', startup: 2 },
    { idx: 3, name: 'Shafnat Fuaini Ramadhan', email: 'shafnat3@gmail.com', nim: '607012400075', startup: 3 },
    { idx: 4, name: 'Inaya Faridah', email: 'inaya4@gmail.com', nim: '607012430016', startup: 4 },
    { idx: 5, name: 'Fazrina Esa Putri Permana', email: 'fazrina5@gmail.com', nim: '607012400047', startup: 0 },
    { idx: 6, name: 'Dalfa Munawwarotul Mahmudah', email: 'dalfa6@gmail.com', nim: '607012430008', startup: 1 },
    { idx: 7, name: 'Rafi Abi Assyarif', email: 'rafi7@gmail.com', nim: '607012400069', startup: 2 },
    { idx: 8, name: 'Amelia Waruwu', email: 'amelia8@gmail.com', nim: '607012400052', startup: 3 },
    { idx: 9, name: 'Andi Ahmad Nurmadani', email: 'andi9@gmail.com', nim: '607012400044', startup: 4 },
    { idx: 10, name: 'Muhammad Faisal Rahman', email: 'muhammad10@gmail.com', nim: '607012400003', startup: 0 },
    { idx: 11, name: 'Tazkya Mutia Ramadhan', email: 'tazkya11@gmail.com', nim: '607012400128', startup: 1 },
    { idx: 12, name: 'Alya Permata Nur Fajri', email: 'alya12@gmail.com', nim: '607012430005', startup: 2 },
    { idx: 13, name: 'Muhammad Bagus Burhan', email: 'muhammad13@gmail.com', nim: '607012430010', startup: 3 },
    { idx: 14, name: 'Andi Bayu Hanggoro', email: 'andi14@gmail.com', nim: '607012400019', startup: 4 },
    { idx: 15, name: 'Zulfahmi', email: 'zulfahmi15@gmail.com', nim: '607012400053', startup: 0 },
    { idx: 16, name: 'Rizky Nurdiansyah', email: 'rizky16@gmail.com', nim: '607012400064', startup: 1 },
    { idx: 17, name: 'Vemas Seftaesa Dwi Setiawan', email: 'vemas17@gmail.com', nim: '607012400076', startup: 2 },
    { idx: 18, name: 'Fahreza Azhar Ramadhan', email: 'fahreza18@gmail.com', nim: '607012400060', startup: 3 },
    { idx: 19, name: 'Nanda Candikia', email: 'nanda19@gmail.com', nim: '607012430009', startup: 4 },
    { idx: 20, name: 'Anak Agung Rizky Jhotama', email: 'anak20@gmail.com', nim: '607012400131', startup: 0 },
    { idx: 21, name: 'Zahara', email: 'zahara21@gmail.com', nim: '607012400136', startup: 1 },
    { idx: 22, name: 'Rafi Khairan Putra', email: 'rafi22@gmail.com', nim: '607012400123', startup: 2 },
    { idx: 23, name: 'M. Dandy Alfariji', email: 'm.23@gmail.com', nim: '607012400092', startup: 3 },
    { idx: 24, name: 'Cantika anggi anggraheni', email: 'cantika24@gmail.com', nim: '607012400106', startup: 4 },
    { idx: 25, name: 'Naura Ramadhani', email: 'naura25@gmail.com', nim: '607012430011', startup: 0 },
    { idx: 26, name: 'Amadea Salsabila', email: 'amadea26@gmail.com', nim: '607012400063', startup: 1 },
    { idx: 27, name: 'April Adzania', email: 'april27@gmail.com', nim: '607012400100', startup: 2 },
    { idx: 28, name: 'Siti Amany Fakhirah Riby', email: 'siti28@gmail.com', nim: '607012400008', startup: 3 },
    { idx: 29, name: 'Nadine Nathania Pelleng', email: 'nadine29@gmail.com', nim: '607012400125', startup: 4 },
    { idx: 30, name: 'Dian Tri Sari Daeli', email: 'dian30@gmail.com', nim: '607012430001', startup: 0 },
    { idx: 31, name: 'Muhammad Taqi Izdihar', email: 'muhammad31@gmail.com', nim: '607012430006', startup: 1 },
    { idx: 32, name: 'Johanes Darren Yehuda', email: 'johanes32@gmail.com', nim: '607012400035', startup: 2 },
  ];

  return internData.map(d => ({
    id: `intern_${d.idx}`,
    name: d.name,
    email: d.email,
    password_hash: hashedPassword,
    role: 'intern',
    score: 0,
    nim: d.nim,
    startup: startupNames[d.startup],
    status: 'active',
  }));
}

seed().catch(console.error);
