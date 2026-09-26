import fs from 'fs';
import path from 'path';

const baseDir = path.join(process.cwd(), 'public', 'demo-assets');
const productsDir = path.join(baseDir, 'products');
const categoriesDir = path.join(baseDir, 'categories');
const avatarsDir = path.join(baseDir, 'avatars');

[productsDir, categoriesDir, avatarsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const logoBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'logo.png'));

// Copy logo for products prod-1.webp through prod-10.webp
for (let i = 1; i <= 10; i++) {
  const pPath = path.join(productsDir, `prod-${i}.webp`);
  if (!fs.existsSync(pPath)) {
    fs.writeFileSync(pPath, logoBuffer);
  }
}

// Copy logo for categories cat-1.webp through cat-10.webp
for (let i = 1; i <= 10; i++) {
  const cPath = path.join(categoriesDir, `cat-${i}.webp`);
  if (!fs.existsSync(cPath)) {
    fs.writeFileSync(cPath, logoBuffer);
  }
}

// Copy logo for avatars
const avatars = [
  'user-basic1.webp',
  'user-basic2.webp',
  'user-business1.webp',
  'user-business2.webp',
  'user-premium1.webp',
  'user-premium2.webp',
  'user-admin.webp'
];

for (const av of avatars) {
  const aPath = path.join(avatarsDir, av);
  if (!fs.existsSync(aPath)) {
    fs.writeFileSync(aPath, logoBuffer);
  }
}

console.log('✓ Demo asset placeholders created successfully in public/demo-assets/');
