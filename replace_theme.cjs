const fs = require('fs');
const path = require('path');

const targetDirs = [
    'src/pages/student',
    'src/pages/instructor',
    'src/pages/clubofficial',
    'src/pages/auth/admin',
    'src/pages/club',
    'src/pages/post'
];

const basePath = path.join(__dirname);

function replaceInFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    let newCode = code;

    // Background and Surface Colors
    newCode = newCode.replace(/bg-linear-to-br from-slate-900 via-slate-800 to-slate-900/g, 'bg-slate-50');
    newCode = newCode.replace(/bg-linear-to-br from-slate-900 via-blue-900 to-slate-900/g, 'bg-slate-50');
    newCode = newCode.replace(/from-slate-900 via-slate-800 to-slate-900/g, 'bg-slate-50');
    newCode = newCode.replace(/from-slate-900 via-slate-800/g, 'bg-slate-50');
    newCode = newCode.replace(/bg-slate-900/g, 'bg-slate-50');

    // Glassmorphism and Cards -> Solid White Cards
    newCode = newCode.replace(/backdrop-blur-xl/g, '');
    newCode = newCode.replace(/backdrop-blur-md/g, '');
    newCode = newCode.replace(/bg-white\/10/g, 'bg-white');
    newCode = newCode.replace(/bg-white\/5/g, 'bg-white');
    newCode = newCode.replace(/hover:bg-white\/10/g, 'hover:bg-slate-50');
    newCode = newCode.replace(/hover:bg-white\/15/g, 'hover:bg-slate-50');
    newCode = newCode.replace(/border-white\/20/g, 'border-slate-200');
    newCode = newCode.replace(/border-white\/10/g, 'border-slate-200');
    newCode = newCode.replace(/bg-slate-700\/60/g, 'bg-white');
    newCode = newCode.replace(/bg-slate-700\/30/g, 'bg-slate-50');
    newCode = newCode.replace(/hover:bg-slate-700\/30/g, 'hover:bg-slate-100');
    newCode = newCode.replace(/border-slate-600\/50/g, 'border-slate-300');
    newCode = newCode.replace(/hover:bg-slate-600\/70/g, 'hover:bg-slate-50');
    newCode = newCode.replace(/bg-slate-800/g, 'bg-white');

    // Shadows
    newCode = newCode.replace(/shadow-2xl/g, 'shadow-sm');
    newCode = newCode.replace(/hover:shadow-2xl/g, 'hover:shadow-md');

    // Text Colors
    newCode = newCode.replace(/text-white/g, 'text-slate-900');
    newCode = newCode.replace(/text-slate-100/g, 'text-slate-900');
    newCode = newCode.replace(/text-slate-200/g, 'text-slate-700');
    newCode = newCode.replace(/text-slate-300/g, 'text-slate-600');
    newCode = newCode.replace(/text-slate-400/g, 'text-slate-500');
    newCode = newCode.replace(/text-gray-400/g, 'text-slate-500');
    newCode = newCode.replace(/text-blue-200\/70/g, 'text-slate-500');
    newCode = newCode.replace(/text-blue-200\/60/g, 'text-slate-500');
    newCode = newCode.replace(/text-blue-200\/50/g, 'text-slate-500');
    newCode = newCode.replace(/text-blue-200/g, 'text-blue-600');
    newCode = newCode.replace(/text-blue-300\/70/g, 'text-slate-500');
    newCode = newCode.replace(/text-blue-300\/80/g, 'text-slate-600');

    // Custom Badge & Table specific fixes
    newCode = newCode.replace(/text-indigo-200/g, 'text-indigo-600');
    newCode = newCode.replace(/bg-indigo-500\/20 text-indigo-300/g, 'bg-indigo-50 text-indigo-700 border border-indigo-200');
    newCode = newCode.replace(/bg-blue-500\/20 text-blue-300/g, 'bg-blue-50 text-blue-700 border border-blue-200');
    newCode = newCode.replace(/bg-emerald-500\/20 text-emerald-300/g, 'bg-emerald-50 text-emerald-700 border border-emerald-200');
    newCode = newCode.replace(/bg-teal-500\/20 text-teal-300/g, 'bg-teal-50 text-teal-700 border border-teal-200');
    newCode = newCode.replace(/bg-sky-500\/20 text-sky-300/g, 'bg-sky-50 text-sky-700 border border-sky-200');
    newCode = newCode.replace(/bg-amber-500\/20 text-amber-300/g, 'bg-amber-50 text-amber-700 border border-amber-200');
    newCode = newCode.replace(/bg-red-500\/20 text-red-300/g, 'bg-red-50 text-red-700 border border-red-200');
    newCode = newCode.replace(/bg-orange-500\/20 text-orange-300/g, 'bg-orange-50 text-orange-700 border border-orange-200');

    // Icons / Small blocks
    newCode = newCode.replace(/bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500\/30/g, 'bg-blue-50 text-blue-600 border border-blue-100');
    newCode = newCode.replace(/bg-linear-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500\/30/g, 'bg-teal-50 text-teal-600 border border-teal-100');
    newCode = newCode.replace(/bg-linear-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500\/30/g, 'bg-emerald-50 text-emerald-600 border border-emerald-100');
    newCode = newCode.replace(/bg-linear-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500\/30/g, 'bg-amber-50 text-amber-600 border border-amber-100');
    newCode = newCode.replace(/bg-linear-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500\/30/g, 'bg-cyan-50 text-cyan-600 border border-cyan-100');
    newCode = newCode.replace(/bg-linear-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500\/30/g, 'bg-emerald-50 text-emerald-600 border border-emerald-100');
    newCode = newCode.replace(/bg-linear-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500\/30/g, 'bg-sky-50 text-sky-600 border border-sky-100');

    // Admin and Club Dashboard specific gradients
    newCode = newCode.replace(/from-blue-500 to-indigo-600 text-slate-900/g, 'from-blue-600 to-indigo-700 text-white');
    newCode = newCode.replace(/from-blue-600 to-indigo-600 text-slate-900/g, 'from-blue-600 to-indigo-700 text-white');
    newCode = newCode.replace(/from-red-500 to-rose-600 text-slate-900/g, 'from-red-600 to-rose-700 text-white');

    // Specific fix for header font text replacement problem where it thinks text-white was there
    newCode = newCode.replace(/bg-clip-text text-transparent/g, 'text-blue-700');
    newCode = newCode.replace(/from-slate-900 to-blue-200/g, '');

    // Borders
    newCode = newCode.replace(/divide-white\/10/g, 'divide-slate-200');

    // Input placeholders
    newCode = newCode.replace(/placeholder-slate-400/g, 'placeholder-slate-400'); // OK

    if (code !== newCode) {
        fs.writeFileSync(filePath, newCode);
        console.log(`Updated ${filePath}`);
    }
}

function walkDir(dir) {
    const absolutePath = path.join(basePath, dir);
    if (!fs.existsSync(absolutePath)) return;

    const files = fs.readdirSync(absolutePath);
    for (const file of files) {
        const fullPath = path.join(absolutePath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'components' && file !== 'shared') {
                // Only target the specific files needed
                // but since we only provided leaf dirs, we don't need to recursively go deep unless necessary
                walkDir(path.join(dir, file));
            }
        } else if (file.endsWith('.jsx')) {
            replaceInFile(fullPath);
        }
    }
}

targetDirs.forEach(walkDir);
console.log('Done replacing theme classes.');
