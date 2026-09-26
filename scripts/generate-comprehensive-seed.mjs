import fs from 'fs';
import path from 'path';

const workspaces = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    code: 'B1',
    name: 'DEMO_BASIC_01 - Apex Mart Colombo',
    type: 'grocery',
    city: 'Colombo',
    invPrefix: 'HA-INV-10',
    ordPrefix: 'ORD-B1-',
  },
  {
    id: 'a2000000-0000-0000-0000-000000000002',
    code: 'B2',
    name: 'DEMO_BASIC_02 - Apex Express Kandy',
    type: 'pharmacy_grocery',
    city: 'Kandy',
    invPrefix: 'HA-INV-20',
    ordPrefix: 'ORD-B2-',
  },
  {
    id: 'a3000000-0000-0000-0000-000000000003',
    code: 'BU1',
    name: 'DEMO_BUSINESS_01 - Harsh Apex Tech Galle',
    type: 'electronics',
    city: 'Galle',
    invPrefix: 'HA-INV-30',
    ordPrefix: 'ORD-BU1-',
  },
  {
    id: 'a4000000-0000-0000-0000-000000000004',
    code: 'BU2',
    name: 'DEMO_BUSINESS_02 - Apex Logistics Negombo',
    type: 'logistics',
    city: 'Negombo',
    invPrefix: 'HA-INV-40',
    ordPrefix: 'ORD-BU2-',
  },
  {
    id: 'a5000000-0000-0000-0000-000000000005',
    code: 'P1',
    name: 'DEMO_PREMIUM_01 - Apex Enterprise Holdings',
    type: 'enterprise',
    city: 'Colombo',
    invPrefix: 'HA-INV-50',
    ordPrefix: 'ORD-P1-',
  },
  {
    id: 'a6000000-0000-0000-0000-000000000006',
    code: 'P2',
    name: 'DEMO_PREMIUM_02 - Apex Global Industrial',
    type: 'industrial',
    city: 'Jaffna',
    invPrefix: 'HA-INV-60',
    ordPrefix: 'ORD-P2-',
  },
];

const customerNames = [
  ['Sunil Jayawardena', '+94 77 234 5678', 'sunil.j@gmail.com', '142 Havelock Road'],
  ['Kumari Alwis', '+94 71 876 5432', 'kumari.alwis@yahoo.com', '56 Rajagiriya Road'],
  ['Mohamed Rizwan', '+94 76 543 2198', 'm.rizwan.trading@gmail.com', '88 Keyzer Street, Pettah'],
  ['Priyantha Gunasekara', '+94 77 654 3210', 'priyantha.guna@outlook.com', '23 Temple Road, Nugegoda'],
  ['Chamari Dissanayake', '+94 72 345 6789', 'chamari.d@gmail.com', '77 Stanley Tillakaratne Mawatha'],
  ['Siva Subramaniam', '+94 77 889 9001', 'siva.subra@gmail.com', '12 Sea Street'],
  ['Anushka Bandara', '+94 75 112 2334', 'anushka.b@hotmail.com', '98 High Level Road, Maharagama'],
  ['Malik Mansoor', '+94 77 998 8776', 'malik.mansoor@gmail.com', '34 Wekande Road'],
  ['Kavindi Senaratne', '+94 71 445 5667', 'kavindi.sena@gmail.com', '5 Anderson Road, Dehiwala'],
  ['Dinesh Samarawickrama', '+94 70 334 4556', 'dinesh.sam@gmail.com', '19 Galle Road, Mount Lavinia'],
  ['Shalini Weerasinghe', '+94 77 667 7889', 'shalini.w@gmail.com', '40 Duplication Road'],
  ['Ruwan Edirisinghe', '+94 76 778 8990', 'ruwan.ediri@yahoo.com', '62 Baseline Road, Dematagoda'],
  ['Thilini Fonseka', '+94 71 223 3445', 'thilini.fonseka@gmail.com', '110 Hospital Road, Kalubowila'],
  ['Asanka Karunaratne', '+94 78 556 6778', 'asanka.k@gmail.com', '85 Sri Saranankara Road'],
  ['Fathima Zeenath', '+94 77 443 3221', 'zeenath.fathima@gmail.com', '27 Maligawatta Place'],
  ['Pradeep Kumara', '+94 70 889 9002', 'pradeep.kumara@gmail.com', '14 Negombo Road, Peliyagoda'],
  ['Hiruni Rathnayake', '+94 77 119 9228', 'hiruni.rathna@gmail.com', '73 Nawala Road'],
  ['Mahesh Wickramasinghe', '+94 76 123 9876', 'mahesh.wick@gmail.com', '29 Jubilee Post, Mirihana'],
  ['Nimanthi Abeysekera', '+94 71 990 0112', 'nimanthi.a@gmail.com', '91 Pagoda Road, Nugegoda'],
  ['Roshan Liyanage', '+94 77 554 4332', 'roshan.liya@gmail.com', '52 Old Kesbewa Road'],
];

const employeeTemplates = [
  ['EMP-001', 'Kasun Perera', 'Owner & General Director', 'Executive', 220000],
  ['EMP-002', 'Buddhika Senanayake', 'Operations General Manager', 'Operations', 140000],
  ['EMP-003', 'Sanduni Wijeratne', 'Head of Sales & Billing', 'Sales', 85000],
  ['EMP-004', 'Nuwan Jayalath', 'Inventory & Logistics Lead', 'Logistics', 90000],
  ['EMP-005', 'Kavinda Maduranga', 'Senior Counter Cashier', 'Sales', 65000],
  ['EMP-006', 'Dharshani Mendis', 'Financial Analyst & Accounts', 'Finance', 105000],
];

const expenseCats = [
  ['Store & Office Rent', 'Monthly commercial premises lease'],
  ['Electricity & Water Utilities', 'CEB & commercial utilities'],
  ['Staff Salaries & Overtime', 'Monthly payroll disbursements'],
  ['Logistics, Delivery & Fuel', 'Fleet fuel and transport charges'],
  ['Equipment & IT Maintenance', 'Hardware, thermal rolls, and network maintenance'],
  ['Marketing & Customer Loyalty', 'Promotional campaigns and SMS alerts'],
  ['Security & Municipal Taxes', 'Premises security and local council rates'],
  ['Packaging & Consumables', 'Eco bags, boxes, and parcel wrap'],
  ['Accounting & Professional Fees', 'Auditing, secretarial and legal retainer'],
  ['Miscellaneous Operational Contingency', 'Store daily operational petty expenses'],
];

let sql = `-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - 05_SEED_DEMO_WORKSPACES_DATA.SQL
-- Realistic Sri Lankan Sample Data for ALL 6 Demo Workspaces
-- Seeded per workspace: 10 Categories, 30 Products, 20 Customers,
-- 40 Orders, 15 Invoices, 10 Expenses, 6 Employees
-- ============================================================

`;

for (let wIdx = 0; wIdx < workspaces.length; wIdx++) {
  const ws = workspaces[wIdx];
  const hexWsIdx = (wIdx + 1).toString();

  sql += `\n-- ============================================================\n`;
  sql += `-- WORKSPACE ${ws.code}: ${ws.name} (${ws.city})\n`;
  sql += `-- ============================================================\n\n`;

  // 1. Categories (10 categories per workspace)
  sql += `-- 1. CATEGORIES FOR ${ws.code}\n`;
  sql += `INSERT INTO categories (id, business_id, name, slug, description, image_url) VALUES\n`;
  const catIds = [];
  const catNames = [
    'Beverages & Refreshments',
    'Rice, Grains & Pulses',
    'Spices, Herbs & Seasoning',
    'Bakery & Confectionery',
    'Dairy, Eggs & Butter',
    'Snacks & Crisps',
    'Household Cleaning & Laundry',
    'Personal Care & Toiletries',
    'Stationery & Office Supplies',
    'Fresh Produce & Essentials',
  ];

  for (let c = 1; c <= 10; c++) {
    const hexCat = c.toString(16).padStart(2, '0');
    const catId = `ca${hexWsIdx}000${hexCat}-0000-0000-0000-000000000001`;
    catIds.push(catId);
    const slug = `cat-${ws.code.toLowerCase()}-${c}`;
    const comma = c === 10 ? '\n' : ',\n';
    sql += `('${catId}', '${ws.id}', '${catNames[c - 1]}', '${slug}', '${catNames[c - 1]} for ${ws.city} branch', '/demo-assets/categories/cat-${c}.webp')${comma}`;
  }
  sql += `ON CONFLICT (business_id, slug) DO NOTHING;\n\n`;

  // 2. Products (30 products per workspace)
  sql += `-- 2. PRODUCTS FOR ${ws.code} (30 Products)\n`;
  sql += `INSERT INTO products (id, business_id, category_id, name, sku, barcode, description, cost_price, selling_price, stock_quantity, min_stock_level, image_url, status) VALUES\n`;
  const prodIds = [];
  for (let p = 1; p <= 30; p++) {
    const hexProd = p.toString(16).padStart(2, '0');
    const prodId = `da${hexWsIdx}000${hexProd}-0000-0000-0000-000000000001`;
    prodIds.push(prodId);
    const catId = catIds[(p - 1) % 10];
    const sku = `SKU-${ws.code}-${p.toString().padStart(3, '0')}`;
    const barcode = `79357${hexWsIdx}${p.toString().padStart(5, '0')}`;
    const cost = 250 + (p * 45);
    const selling = Math.round(cost * 1.35 / 10) * 10;
    const stock = 15 + ((p * 7) % 65);
    const minStock = 8;
    const name = `Sri Lanka Quality Product ${ws.code} #${p}`;
    const desc = `Commercial Grade Item ${p} for ${ws.name}`;
    const comma = p === 30 ? '\n' : ',\n';
    sql += `('${prodId}', '${ws.id}', '${catId}', '${name}', '${sku}', '${barcode}', '${desc}', ${cost}.00, ${selling}.00, ${stock}, ${minStock}, '/demo-assets/products/prod-${(p % 10) + 1}.webp', 'active')${comma}`;
  }
  sql += `ON CONFLICT (business_id, sku) DO NOTHING;\n\n`;

  // 3. Inventory Sync
  sql += `-- 3. INVENTORY FOR ${ws.code}\n`;
  sql += `INSERT INTO inventory (business_id, product_id, quantity, reserved_quantity, location)\n`;
  sql += `SELECT business_id, id, stock_quantity, 0, '${ws.city} Main Store'\n`;
  sql += `FROM products WHERE business_id = '${ws.id}'\n`;
  sql += `ON CONFLICT (business_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity;\n\n`;

  // 4. Customers (20 customers per workspace)
  sql += `-- 4. CUSTOMERS FOR ${ws.code} (20 Customers)\n`;
  sql += `INSERT INTO customers (id, business_id, name, phone, email, address, total_purchases, total_orders, outstanding_balance, last_purchase_at) VALUES\n`;
  const custIds = [];
  for (let c = 1; c <= 20; c++) {
    const hexCust = c.toString(16).padStart(2, '0');
    const custId = `cc${hexWsIdx}000${hexCust}-0000-0000-0000-000000000001`;
    custIds.push(custId);
    const [cName, cPhone, cEmailBase, cAddr] = customerNames[c - 1];
    const email = `${cEmailBase.split('@')[0]}.${ws.code.toLowerCase()}@gmail.com`;
    const totPurch = 12000 + (c * 2400);
    const totOrders = 3 + (c % 15);
    const outstanding = (c % 5 === 0) ? (c * 750) : 0;
    const comma = c === 20 ? '\n' : ',\n';
    sql += `('${custId}', '${ws.id}', '${cName}', '${cPhone}', '${email}', '${cAddr}, ${ws.city}', ${totPurch}.00, ${totOrders}, ${outstanding}.00, NOW() - INTERVAL '${c} days')${comma}`;
  }
  sql += `ON CONFLICT (id) DO NOTHING;\n\n`;

  // 5. Employees (6 employees per workspace)
  sql += `-- 5. EMPLOYEES FOR ${ws.code} (6 Employees)\n`;
  sql += `INSERT INTO employees (id, business_id, employee_id_number, name, email, phone, position, department, salary, join_date, status, avatar_url) VALUES\n`;
  for (let e = 1; e <= 6; e++) {
    const hexEmp = e.toString(16).padStart(2, '0');
    const empId = `ee${hexWsIdx}000${hexEmp}-0000-0000-0000-000000000001`;
    const [eCode, eName, ePos, eDept, eSal] = employeeTemplates[e - 1];
    const email = `${eName.toLowerCase().replace(/[^a-z]/g, '.')}.${ws.code.toLowerCase()}@harshapex.lk`;
    const phone = `+94 77 ${wIdx}1${e} 45${e}2`;
    const comma = e === 6 ? '\n' : ',\n';
    sql += `('${empId}', '${ws.id}', '${eCode}-${ws.code}', '${eName}', '${email}', '${phone}', '${ePos}', '${eDept}', ${eSal}.00, '2023-01-15', 'active', '/demo-assets/employees/emp-${e}.webp')${comma}`;
  }
  sql += `ON CONFLICT (business_id, employee_id_number) DO NOTHING;\n\n`;

  // 6. Expense Categories (10 categories per workspace)
  sql += `-- 6. EXPENSE CATEGORIES FOR ${ws.code}\n`;
  sql += `INSERT INTO expense_categories (id, business_id, name, description) VALUES\n`;
  const expCatIds = [];
  for (let ec = 1; ec <= 10; ec++) {
    const hexEc = ec.toString(16).padStart(2, '0');
    const expCatId = `ec${hexWsIdx}000${hexEc}-0000-0000-0000-000000000001`;
    expCatIds.push(expCatId);
    const [ecName, ecDesc] = expenseCats[ec - 1];
    const comma = ec === 10 ? '\n' : ',\n';
    sql += `('${expCatId}', '${ws.id}', '${ecName}', '${ecDesc}')${comma}`;
  }
  sql += `ON CONFLICT (business_id, name) DO NOTHING;\n\n`;

  // 7. Expenses (10 expenses per workspace)
  sql += `-- 7. EXPENSES FOR ${ws.code} (10 Expenses)\n`;
  sql += `INSERT INTO expenses (id, business_id, category_id, expense_number, expense_date, description, amount, payment_method, notes) VALUES\n`;
  for (let ex = 1; ex <= 10; ex++) {
    const hexEx = ex.toString(16).padStart(2, '0');
    const expId = `ea${hexWsIdx}000${hexEx}-0000-0000-0000-000000000001`;
    const expCatId = expCatIds[ex - 1];
    const num = `EXP-${ws.code}-2026-${ex.toString().padStart(3, '0')}`;
    const amount = 8500 + (ex * 3200);
    const method = ex % 3 === 0 ? 'cash' : ex % 3 === 1 ? 'card' : 'bank_transfer';
    const comma = ex === 10 ? '\n' : ',\n';
    sql += `('${expId}', '${ws.id}', '${expCatId}', '${num}', CURRENT_DATE - INTERVAL '${ex * 2} days', '${expenseCats[ex - 1][0]} - ${ws.city}', ${amount}.00, '${method}', 'Disbursed for ${ws.city} branch operational expenses')${comma}`;
  }
  sql += `ON CONFLICT (business_id, expense_number) DO NOTHING;\n\n`;

  // 8. Orders (40 orders per workspace)
  sql += `-- 8. ORDERS FOR ${ws.code} (40 Orders)\n`;
  sql += `INSERT INTO orders (id, business_id, order_number, customer_id, status, payment_status, payment_method, subtotal, discount_amount, tax_amount, total_amount, notes, created_at) VALUES\n`;
  const orderIds = [];
  for (let o = 1; o <= 40; o++) {
    const hexOrd = o.toString(16).padStart(2, '0');
    const ordId = `aa${hexWsIdx}000${hexOrd}-0000-0000-0000-000000000001`;
    orderIds.push(ordId);
    const custId = custIds[(o - 1) % 20];
    const ordNum = `${ws.ordPrefix}${1000 + o}`;
    const method = o % 3 === 0 ? 'cash' : o % 3 === 1 ? 'card' : 'bank_transfer';
    const subtotal = 2500 + (o * 350);
    const discount = (o % 4 === 0) ? 200 : 0;
    const total = subtotal - discount;
    const comma = o === 40 ? '\n' : ',\n';
    sql += `('${ordId}', '${ws.id}', '${ordNum}', '${custId}', 'completed', 'paid', '${method}', ${subtotal}.00, ${discount}.00, 0, ${total}.00, 'Order ${o} processed in ${ws.city}', NOW() - INTERVAL '${o * 4} hours')${comma}`;
  }
  sql += `ON CONFLICT (business_id, order_number) DO NOTHING;\n\n`;

  // 9. Order Items (1 item per order)
  sql += `-- 9. ORDER ITEMS FOR ${ws.code}\n`;
  sql += `INSERT INTO order_items (id, business_id, order_id, product_id, quantity, unit_price, cost_price, discount_amount, total_price) VALUES\n`;
  for (let oi = 1; oi <= 40; oi++) {
    const hexOi = oi.toString(16).padStart(2, '0');
    const oiId = `bb${hexWsIdx}000${hexOi}-0000-0000-0000-000000000001`;
    const ordId = orderIds[oi - 1];
    const prodId = prodIds[(oi - 1) % 30];
    const price = 850 + (oi * 50);
    const cost = 600 + (oi * 35);
    const comma = oi === 40 ? '\n' : ',\n';
    sql += `('${oiId}', '${ws.id}', '${ordId}', '${prodId}', 2, ${price}.00, ${cost}.00, 0, ${(price * 2)}.00)${comma}`;
  }
  sql += `ON CONFLICT (id) DO NOTHING;\n\n`;

  // 10. Invoices (15 invoices per workspace)
  sql += `-- 10. INVOICES FOR ${ws.code} (15 Invoices)\n`;
  sql += `INSERT INTO invoices (id, business_id, order_id, customer_id, invoice_number, issue_date, due_date, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount, status, notes) VALUES\n`;
  for (let inv = 1; inv <= 15; inv++) {
    const hexInv = inv.toString(16).padStart(2, '0');
    const invId = `ba${hexWsIdx}000${hexInv}-0000-0000-0000-000000000001`;
    const ordId = orderIds[inv - 1];
    const custId = custIds[(inv - 1) % 20];
    const invNum = `${ws.invPrefix}${100 + inv}`;
    const total = 4200 + (inv * 600);
    const comma = inv === 15 ? '\n' : ',\n';
    sql += `('${invId}', '${ws.id}', '${ordId}', '${custId}', '${invNum}', CURRENT_DATE - INTERVAL '${inv} days', CURRENT_DATE + INTERVAL '${14 - inv} days', ${total}.00, 0, 0, ${total}.00, ${total}.00, 0, 'paid', 'Official VAT Receipt ${inv}')${comma}`;
  }
  sql += `ON CONFLICT (business_id, invoice_number) DO NOTHING;\n\n`;
}

fs.writeFileSync(path.join(process.cwd(), 'supabase', 'migrations', '05_seed_demo_workspaces_data.sql'), sql);
console.log('Successfully generated complete 05_seed_demo_workspaces_data.sql! Total size:', sql.length);
