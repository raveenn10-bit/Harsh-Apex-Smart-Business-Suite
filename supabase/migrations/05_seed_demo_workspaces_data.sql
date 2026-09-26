-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - 05_SEED_DEMO_WORKSPACES_DATA.SQL
-- Realistic Sri Lankan Fictional Sample Data for Demo Workspaces
-- (All UUIDs strictly use valid hex [0-9a-f])
-- ============================================================

-- Variables for Demo Businesses:
-- DEMO_BASIC_01: 'a1000000-0000-0000-0000-000000000001'
-- DEMO_BUSINESS_01: 'a3000000-0000-0000-0000-000000000003'
-- DEMO_PREMIUM_01: 'a5000000-0000-0000-0000-000000000005'

-- 1. CATEGORIES (For DEMO_BASIC_01)
INSERT INTO categories (id, business_id, name, slug, description, image_url) VALUES
('ca000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dairy & Eggs', 'dairy-eggs', 'Fresh milk, butter, cheese, and farm eggs', '/demo-assets/categories/dairy.webp'),
('ca000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Bakery & Bread', 'bakery-bread', 'Artisan breads, buns, pastries, and biscuits', '/demo-assets/categories/bakery.webp'),
('ca000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Beverages & Tea', 'beverages-tea', 'Ceylon tea, roasted coffee, juices, and soft drinks', '/demo-assets/categories/beverages.webp'),
('ca000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Rice & Grains', 'rice-grains', 'Samba, Keeri Samba, Red Rice, Basmati, dhal, and pulses', '/demo-assets/categories/grains.webp'),
('ca000005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Spices & Condiments', 'spices-condiments', 'Pure Ceylon cinnamon, black pepper, curry powder, sauces', '/demo-assets/categories/spices.webp'),
('ca000006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Snacks & Confectionery', 'snacks-confectionery', 'Chocolates, potato crisps, traditional Sri Lankan sweets', '/demo-assets/categories/snacks.webp'),
('ca000007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Household & Cleaning', 'household-cleaning', 'Detergents, floor cleaners, kitchen paper, sanitizers', '/demo-assets/categories/household.webp'),
('ca000008-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Personal Care', 'personal-care', 'Soaps, shampoos, dental care, lotions', '/demo-assets/categories/personal-care.webp'),
('ca000009-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Stationery & Office', 'stationery-office', 'Notebooks, pens, paper reams, office clips', '/demo-assets/categories/stationery.webp'),
('ca000010-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Fresh Fruits & Veg', 'fresh-produce', 'Island fresh vegetables, bananas, mangoes, pineapples', '/demo-assets/categories/fruits.webp')
ON CONFLICT (business_id, slug) DO NOTHING;

-- Clone categories to DEMO_BUSINESS_01 and DEMO_PREMIUM_01
INSERT INTO categories (id, business_id, name, slug, description, image_url)
SELECT gen_random_uuid(), 'a3000000-0000-0000-0000-000000000003', name, slug, description, image_url
FROM categories WHERE business_id = 'a1000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

INSERT INTO categories (id, business_id, name, slug, description, image_url)
SELECT gen_random_uuid(), 'a5000000-0000-0000-0000-000000000005', name, slug, description, image_url
FROM categories WHERE business_id = 'a1000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- 2. PRODUCTS FOR DEMO_BASIC_01 (30 Realistic Products)
INSERT INTO products (id, business_id, category_id, name, sku, barcode, description, cost_price, selling_price, stock_quantity, min_stock_level, image_url, status) VALUES
('da000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000003-0000-0000-0000-000000000001', 'Pure Ceylon BOPF Tea 500g', 'SKU-TEA-001', '793573100011', 'Premium high-grown Nuwara Eliya BOPF black tea', 1200.00, 1650.00, 45, 10, '/demo-assets/basic/products/product-001.webp', 'active'),
('da000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000004-0000-0000-0000-000000000001', 'Araliya Keeri Samba Rice 5kg', 'SKU-RICE-001', '793573100028', 'Finest polished Sri Lankan aromatic keeri samba', 1350.00, 1680.00, 80, 15, '/demo-assets/basic/products/product-002.webp', 'active'),
('da000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000004-0000-0000-0000-000000000001', 'Red Raw Kakulu Rice 5kg', 'SKU-RICE-002', '793573100035', 'Nutritious unpolished red rice rich in fiber', 950.00, 1250.00, 60, 10, '/demo-assets/basic/products/product-003.webp', 'active'),
('da000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', 'Pelwatte Fresh Milk 1L', 'SKU-MILK-001', '793573100042', '100% Sri Lankan full cream homogenized pasteurized milk', 420.00, 520.00, 32, 8, '/demo-assets/basic/products/product-004.webp', 'active'),
('da000005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', 'Highland Salted Butter 200g', 'SKU-BUTR-001', '793573100059', 'Pure creamy highland butter from Ambewela dairy farm', 680.00, 850.00, 18, 5, '/demo-assets/basic/products/product-005.webp', 'active'),
('da000006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000002-0000-0000-0000-000000000001', 'Munchee Super Cream Cracker 490g', 'SKU-BISC-001', '793573100066', 'Crispy, baked golden classic Sri Lankan crackers', 380.00, 480.00, 55, 12, '/demo-assets/basic/products/product-006.webp', 'active'),
('da000007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000002-0000-0000-0000-000000000001', 'Maliban Chocolate Biscuit 400g', 'SKU-BISC-002', '793573100073', 'Rich real chocolate cream filled sandwich biscuits', 410.00, 520.00, 40, 10, '/demo-assets/basic/products/product-007.webp', 'active'),
('da000008-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000005-0000-0000-0000-000000000001', 'Organic Ceylon Cinnamon Quills 100g', 'SKU-SPIC-001', '793573100080', 'Alba grade true Ceylon cinnamon quills', 850.00, 1200.00, 25, 5, '/demo-assets/basic/products/product-008.webp', 'active'),
('da000009-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000005-0000-0000-0000-000000000001', 'Roasted Curry Powder 250g', 'SKU-SPIC-002', '793573100097', 'Aromatic roasted Sri Lankan meat and fish curry mix', 320.00, 450.00, 50, 10, '/demo-assets/basic/products/product-009.webp', 'active'),
('da000010-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000003-0000-0000-0000-000000000001', 'Harischandra Pure Ground Coffee 200g', 'SKU-COFF-001', '793573100103', 'Freshly ground Sri Lankan robusta coffee', 460.00, 620.00, 30, 8, '/demo-assets/basic/products/product-010.webp', 'active'),
('da000011-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000008-0000-0000-0000-000000000001', 'Kohomba Herbal Ayurvedic Soap 100g', 'SKU-SOAP-001', '793573100110', 'Natural neem and herbal clarifying bath bar', 120.00, 165.00, 95, 20, '/demo-assets/basic/products/product-011.webp', 'active'),
('da000012-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000008-0000-0000-0000-000000000001', 'Siddhalepa Herbal Toothpaste 100g', 'SKU-DENT-001', '793573100127', 'Ayurvedic gum protection with clove oil & herbs', 210.00, 280.00, 60, 15, '/demo-assets/basic/products/product-012.webp', 'active'),
('da000013-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000007-0000-0000-0000-000000000001', 'Sunlight Washing Powder 1kg', 'SKU-DETG-001', '793573100134', 'Active floral stain remover laundry powder', 480.00, 620.00, 42, 10, '/demo-assets/basic/products/product-013.webp', 'active'),
('da000014-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000007-0000-0000-0000-000000000001', 'Vim Dishwash Liquid 500ml', 'SKU-DISH-001', '793573100141', 'Lemon degreasing kitchen dishwash gel', 310.00, 420.00, 35, 10, '/demo-assets/basic/products/product-014.webp', 'active'),
('da000015-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000006-0000-0000-0000-000000000001', 'Edinborough Tomato Ketchup 400g', 'SKU-SAUC-001', '793573100158', 'Farm fresh tomato dipping sauce', 340.00, 460.00, 28, 8, '/demo-assets/basic/products/product-015.webp', 'active'),
('da000016-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000004-0000-0000-0000-000000000001', 'Australian Red Split Dhal 1kg', 'SKU-DHAL-001', '793573100165', 'Grade A cleaned premium red split lentils', 390.00, 490.00, 110, 25, '/demo-assets/basic/products/product-016.webp', 'active'),
('da000017-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000004-0000-0000-0000-000000000001', 'Prima All-Purpose Wheat Flour 1kg', 'SKU-FLOR-001', '793573100172', 'Enriched fortified white wheat flour', 240.00, 310.00, 75, 20, '/demo-assets/basic/products/product-017.webp', 'active'),
('da000018-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000004-0000-0000-0000-000000000001', 'Brown Sugar Pelwatte 1kg', 'SKU-SUGR-001', '793573100189', 'Unrefined natural pure cane brown sugar', 360.00, 450.00, 65, 15, '/demo-assets/basic/products/product-018.webp', 'active'),
('da000019-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000005-0000-0000-0000-000000000001', 'Pure Coconut Oil Bottle 750ml', 'SKU-OIL-001', '793573100196', 'Cold-pressed traditional cooking coconut oil', 780.00, 990.00, 3, 10, '/demo-assets/basic/products/product-019.webp', 'active'),
('da000020-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000003-0000-0000-0000-000000000001', 'Elephant House Ginger Beer (EGB) 1L', 'SKU-BEVG-001', '793573100202', 'Iconic natural ginger carbonated soda bottle', 290.00, 390.00, 40, 10, '/demo-assets/basic/products/product-020.webp', 'active'),
('da000021-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000003-0000-0000-0000-000000000001', 'Kist Mixed Fruit Nectar 1L', 'SKU-BEVG-002', '793573100219', 'Tropical mango, passion fruit & banana nectar', 390.00, 520.00, 22, 6, '/demo-assets/basic/products/product-021.webp', 'active'),
('da000022-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000009-0000-0000-0000-000000000001', 'Atlas CR Single Ruled Book 120 Pgs', 'SKU-STAT-001', '793573100226', 'Hardcover school and office exercise book', 160.00, 240.00, 120, 20, '/demo-assets/basic/products/product-022.webp', 'active'),
('da000023-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000009-0000-0000-0000-000000000001', 'Atlas Chooty Ballpoint Pen Box (10pcs)', 'SKU-STAT-002', '793573100233', 'Smooth blue ink fine tip writing pens', 220.00, 320.00, 45, 10, '/demo-assets/basic/products/product-023.webp', 'active'),
('da000024-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000009-0000-0000-0000-000000000001', 'Double A A4 Copier Paper 80GSM (500 Sheets)', 'SKU-STAT-003', '793573100240', 'Bright white multipurpose premium print paper', 1850.00, 2350.00, 2, 8, '/demo-assets/basic/products/product-024.webp', 'active'),
('da000025-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000006-0000-0000-0000-000000000001', 'Kandos Milk Chocolate Bar 100g', 'SKU-CHOC-001', '793573100257', 'Smooth melt Sri Lankan creamy milk chocolate', 280.00, 380.00, 50, 10, '/demo-assets/basic/products/product-025.webp', 'active'),
('da000026-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', 'Kotmale Vanilla Flavoured Yoghurt (Cup)', 'SKU-YOGH-001', '793573100264', 'Rich creamy probiotic breakfast yoghurt cup', 70.00, 95.00, 85, 20, '/demo-assets/basic/products/product-026.webp', 'active'),
('da000027-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000005-0000-0000-0000-000000000001', 'MD Mango Chutney Jar 450g', 'SKU-CHUT-001', '793573100271', 'Sweet and spicy traditional Sri Lankan mango chutney', 450.00, 620.00, 20, 5, '/demo-assets/basic/products/product-027.webp', 'active'),
('da000028-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000007-0000-0000-0000-000000000001', 'Dettol Antiseptic Liquid 250ml', 'SKU-DETT-001', '793573100288', 'Antibacterial surface and first-aid disinfectant', 580.00, 750.00, 28, 6, '/demo-assets/basic/products/product-028.webp', 'active'),
('da000029-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000006-0000-0000-0000-000000000001', 'Ritzbury Cashew Nut Chocolate 100g', 'SKU-CHOC-002', '793573100295', 'Roasted whole crunchy cashew nut bar', 330.00, 450.00, 36, 8, '/demo-assets/basic/products/product-029.webp', 'active'),
('da000030-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000003-0000-0000-0000-000000000001', 'Milo Energy Chocolate Malt Powder 400g', 'SKU-MILO-001', '793573100301', 'Nutrient enriched active chocolate malt beverage', 740.00, 950.00, 1, 10, '/demo-assets/basic/products/product-030.webp', 'active')
ON CONFLICT (business_id, sku) DO UPDATE SET
    name = EXCLUDED.name,
    selling_price = EXCLUDED.selling_price,
    stock_quantity = EXCLUDED.stock_quantity;

-- 3. INVENTORY SYNC FOR PRODUCTS
INSERT INTO inventory (business_id, product_id, quantity, reserved_quantity, location)
SELECT business_id, id, stock_quantity, 0, 'Central Warehouse'
FROM products WHERE business_id = 'a1000000-0000-0000-0000-000000000001'
ON CONFLICT (business_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 4. CUSTOMERS FOR DEMO_BASIC_01 (20 Fictional Sri Lankan Customers)
INSERT INTO customers (id, business_id, name, phone, email, address, total_purchases, total_orders, outstanding_balance, last_purchase_at) VALUES
('cc000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Sunil Jayawardena', '+94 77 234 5678', 'sunil.j@gmail.com', '142 Havelock Road, Colombo 05', 48500.00, 12, 0.00, NOW() - INTERVAL '1 day'),
('cc000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Kumari Alwis', '+94 71 876 5432', 'kumari.alwis@yahoo.com', '56 Rajagiriya Road, Kotte', 32400.00, 8, 0.00, NOW() - INTERVAL '2 days'),
('cc000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Mohamed Rizwan', '+94 76 543 2198', 'm.rizwan.trading@gmail.com', '88 Keyzer Street, Pettah, Colombo 11', 125000.00, 24, 15000.00, NOW() - INTERVAL '3 days'),
('cc000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Priyantha Gunasekara', '+94 77 654 3210', 'priyantha.guna@outlook.com', '23 Temple Road, Nugegoda', 19800.00, 5, 0.00, NOW() - INTERVAL '4 days'),
('cc000005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Chamari Dissanayake', '+94 72 345 6789', 'chamari.d@gmail.com', '77 Stanley Tillakaratne Mawatha, Nugegoda', 62300.00, 15, 0.00, NOW() - INTERVAL '1 day'),
('cc000006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Siva Subramaniam', '+94 77 889 9001', 'siva.subra@gmail.com', '12 Sea Street, Colombo 11', 89400.00, 19, 4500.00, NOW() - INTERVAL '5 days'),
('cc000007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Anushka Bandara', '+94 75 112 2334', 'anushka.b@hotmail.com', '98 High Level Road, Maharagama', 27600.00, 6, 0.00, NOW() - INTERVAL '6 days'),
('cc000008-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Malik Mansoor', '+94 77 998 8776', 'malik.mansoor@gmail.com', '34 Wekande Road, Colombo 02', 54200.00, 11, 0.00, NOW() - INTERVAL '7 days'),
('cc000009-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Kavindi Senaratne', '+94 71 445 5667', 'kavindi.sena@gmail.com', '5 Anderson Road, Dehiwala', 15400.00, 4, 0.00, NOW() - INTERVAL '2 days'),
('cc000010-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dinesh Samarawickrama', '+94 70 334 4556', 'dinesh.sam@gmail.com', '19 Galle Road, Mount Lavinia', 71200.00, 14, 0.00, NOW() - INTERVAL '3 days'),
('cc000011-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Shalini Weerasinghe', '+94 77 667 7889', 'shalini.w@gmail.com', '40 Duplication Road, Colombo 04', 38900.00, 9, 0.00, NOW() - INTERVAL '4 days'),
('cc000012-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Ruwan Edirisinghe', '+94 76 778 8990', 'ruwan.ediri@yahoo.com', '62 Baseline Road, Dematagoda', 23100.00, 7, 0.00, NOW() - INTERVAL '5 days'),
('cc000013-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Thilini Fonseka', '+94 71 223 3445', 'thilini.fonseka@gmail.com', '110 Hospital Road, Kalubowila', 49000.00, 10, 0.00, NOW() - INTERVAL '1 day'),
('cc000014-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Asanka Karunaratne', '+94 78 556 6778', 'asanka.k@gmail.com', '85 Sri Saranankara Road, Dehiwala', 18300.00, 4, 0.00, NOW() - INTERVAL '8 days'),
('cc000015-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Fathima Zeenath', '+94 77 443 3221', 'zeenath.fathima@gmail.com', '27 Maligawatta Place, Colombo 10', 92500.00, 18, 0.00, NOW() - INTERVAL '3 days'),
('cc000016-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Pradeep Kumara', '+94 70 889 9002', 'pradeep.kumara@gmail.com', '14 Negombo Road, Peliyagoda', 34800.00, 8, 2200.00, NOW() - INTERVAL '6 days'),
('cc000017-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Hiruni Rathnayake', '+94 77 119 9228', 'hiruni.rathna@gmail.com', '73 Nawala Road, Rajagiriya', 58700.00, 13, 0.00, NOW() - INTERVAL '2 days'),
('cc000018-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Mahesh Wickramasinghe', '+94 76 123 9876', 'mahesh.wick@gmail.com', '29 Jubilee Post, Mirihana', 41200.00, 10, 0.00, NOW() - INTERVAL '4 days'),
('cc000019-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Nimanthi Abeysekera', '+94 71 990 0112', 'nimanthi.a@gmail.com', '91 Pagoda Road, Nugegoda', 26400.00, 6, 0.00, NOW() - INTERVAL '5 days'),
('cc000020-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Roshan Liyanage', '+94 77 554 4332', 'roshan.liya@gmail.com', '52 Old Kesbewa Road, Nugegoda', 67800.00, 14, 0.00, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 5. EMPLOYEES (6 Employees for DEMO_BASIC_01)
INSERT INTO employees (id, business_id, employee_id_number, name, email, phone, position, department, salary, join_date, status, avatar_url) VALUES
('ee000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-001', 'Kasun Perera', 'kasun.p@harshapex.lk', '+94 77 123 4561', 'Owner & Director', 'Executive', 180000.00, '2022-01-15', 'active', '/demo-assets/employees/emp-1.webp'),
('ee000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-002', 'Buddhika Senanayake', 'buddhika.s@harshapex.lk', '+94 77 223 3441', 'Store General Manager', 'Operations', 125000.00, '2022-04-01', 'active', '/demo-assets/employees/emp-2.webp'),
('ee000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-003', 'Sanduni Wijeratne', 'sanduni.w@harshapex.lk', '+94 71 334 4552', 'Senior Cashier & Sales Lead', 'Sales', 75000.00, '2022-08-15', 'active', '/demo-assets/employees/emp-3.webp'),
('ee000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-004', 'Nuwan Jayalath', 'nuwan.j@harshapex.lk', '+94 76 445 5663', 'Inventory & Stock Supervisor', 'Logistics', 80000.00, '2023-01-10', 'active', '/demo-assets/employees/emp-4.webp'),
('ee000005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-005', 'Kavinda Maduranga', 'kavinda.m@harshapex.lk', '+94 70 556 6774', 'Junior Cashier', 'Sales', 60000.00, '2023-06-01', 'active', '/demo-assets/employees/emp-5.webp'),
('ee000006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-006', 'Dharshani Mendis', 'dharshani.m@harshapex.lk', '+94 77 667 7885', 'Accountant & Compliance', 'Finance', 95000.00, '2023-03-20', 'active', '/demo-assets/employees/emp-6.webp')
ON CONFLICT (business_id, employee_id_number) DO NOTHING;

-- 6. EXPENSE CATEGORIES
INSERT INTO expense_categories (id, business_id, name, description) VALUES
('ec000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Store Rent & Rates', 'Monthly commercial lease and municipal rates'),
('ec000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Electricity & Water Utilities', 'CEB power bills and NWSDB commercial water rates'),
('ec000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Staff Salaries & Overtime', 'Monthly payroll disbursements'),
('ec000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Logistics & Fuel', 'Delivery van fuel and transport charges'),
('ec000005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Store Maintenance & IT', 'POS rolls, barcode scanners, and AC servicing')
ON CONFLICT (business_id, name) DO NOTHING;

-- 7. EXPENSES
INSERT INTO expenses (id, business_id, category_id, expense_number, expense_date, description, amount, payment_method, notes) VALUES
('ea000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec000001-0000-0000-0000-000000000001', 'EXP-2026-001', CURRENT_DATE - INTERVAL '15 days', 'Colombo Store Monthly Lease', 85000.00, 'bank_transfer', 'Paid to landlord directly'),
('ea000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec000002-0000-0000-0000-000000000001', 'EXP-2026-002', CURRENT_DATE - INTERVAL '10 days', 'CEB Commercial Electricity Bill', 24500.00, 'bank_transfer', 'High cooling usage this billing cycle'),
('ea000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec000004-0000-0000-0000-000000000001', 'EXP-2026-003', CURRENT_DATE - INTERVAL '5 days', 'Delivery Van Diesel & Maintenance', 14200.00, 'card', 'Islandwide store replenishment'),
('ea000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec000005-0000-0000-0000-000000000001', 'EXP-2026-004', CURRENT_DATE - INTERVAL '2 days', 'Thermal Receipt Paper Rolls (50 pack)', 6500.00, 'cash', 'Purchased from Pettah stationers')
ON CONFLICT (business_id, expense_number) DO NOTHING;

-- 8. ORDERS, ITEMS, INVOICES & PAYMENTS
INSERT INTO orders (id, business_id, order_number, customer_id, status, payment_status, payment_method, subtotal, discount_amount, tax_amount, total_amount, notes, created_at) VALUES
('aa000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-2026-1001', 'cc000001-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 4580.00, 0, 0, 4580.00, 'Counter checkout', NOW() - INTERVAL '3 hours'),
('aa000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-2026-1002', 'cc000002-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 7240.00, 240.00, 0, 7000.00, 'Family grocery run', NOW() - INTERVAL '5 hours'),
('aa000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-2026-1003', 'cc000003-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 15200.00, 200.00, 0, 15000.00, 'Bulk tea and spices', NOW() - INTERVAL '1 day'),
('aa000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-2026-1004', 'cc000005-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 3150.00, 0, 0, 3150.00, 'Weekend essentials', NOW() - INTERVAL '1 day'),
('aa000005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-2026-1005', 'cc000006-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 8900.00, 0, 0, 8900.00, 'Office pantry supplies', NOW() - INTERVAL '2 days')
ON CONFLICT (business_id, order_number) DO NOTHING;

-- Order Items
INSERT INTO order_items (id, business_id, order_id, product_id, quantity, unit_price, cost_price, discount_amount, total_price) VALUES
('bb000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'da000001-0000-0000-0000-000000000001', 2, 1650.00, 1200.00, 0, 3300.00),
('bb000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'da000003-0000-0000-0000-000000000001', 1, 1250.00, 950.00, 0, 1250.00),
('bb000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000001', 'da000002-0000-0000-0000-000000000001', 3, 1680.00, 1350.00, 0, 5040.00),
('bb000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000001', 'da000008-0000-0000-0000-000000000001', 1, 1200.00, 850.00, 0, 1200.00)
ON CONFLICT DO NOTHING;

-- Invoices
INSERT INTO invoices (id, business_id, order_id, customer_id, invoice_number, issue_date, due_date, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount, status, notes) VALUES
('ba000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'cc000001-0000-0000-0000-000000000001', 'HA-INV-01001', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 4580.00, 0, 0, 4580.00, 4580.00, 0, 'paid', 'POS Instant Receipt'),
('ba000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000001', 'cc000002-0000-0000-0000-000000000001', 'HA-INV-01002', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 7240.00, 240.00, 0, 7000.00, 7000.00, 0, 'paid', 'POS Card Receipt'),
('ba000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa000003-0000-0000-0000-000000000001', 'cc000003-0000-0000-0000-000000000001', 'HA-INV-01003', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '13 days', 15200.00, 200.00, 0, 15000.00, 15000.00, 0, 'paid', 'Wholesale Tea Supply')
ON CONFLICT (business_id, invoice_number) DO NOTHING;

-- Payments
INSERT INTO payments (id, business_id, invoice_id, order_id, customer_id, amount, payment_method, payment_reference, payment_date) VALUES
('fa000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ba000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'cc000001-0000-0000-0000-000000000001', 4580.00, 'cash', 'CASH-TENDER-01', NOW() - INTERVAL '3 hours'),
('fa000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ba000002-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000001', 'cc000002-0000-0000-0000-000000000001', 7000.00, 'card', 'VISA-APEX-9012', NOW() - INTERVAL '5 hours'),
('fa000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ba000003-0000-0000-0000-000000000001', 'aa000003-0000-0000-0000-000000000001', 'cc000003-0000-0000-0000-000000000001', 15000.00, 'bank_transfer', 'BOC-TX-883921', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
