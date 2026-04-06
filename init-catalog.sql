DELETE FROM product_tags WHERE product_id IN ('631a3db5-ac07-492c-a994-8cd56923c112','4f18544b-70a5-4352-8e19-0d070f46745d','cc789f85-1476-452a-8100-9e74502198e0','d4edfedb-dbe9-4dd9-aae8-009489394955','1ca35e86-4b4c-4124-b6b5-076ba4134d0d','a1258cd2-176c-4507-ade6-746dab5ad625','d77f9ae6-e9a8-4a3e-86bd-b72af75cbc49');
DELETE FROM products WHERE id IN ('631a3db5-ac07-492c-a994-8cd56923c112','4f18544b-70a5-4352-8e19-0d070f46745d','cc789f85-1476-452a-8100-9e74502198e0','d4edfedb-dbe9-4dd9-aae8-009489394955','1ca35e86-4b4c-4124-b6b5-076ba4134d0d','a1258cd2-176c-4507-ade6-746dab5ad625','d77f9ae6-e9a8-4a3e-86bd-b72af75cbc49');
DELETE FROM tags WHERE name IN ('electronic','jazz','classical');
INSERT INTO products (id,name,description,price,artist,venue,city,date,capacity) VALUES ('cc789f85-1476-452a-8100-9e74502198e0','After Hours Til Dawn','The Weeknd cinematic After Hours Til Dawn stadium tour lands in Barcelona.',115,'The Weeknd','Palau Sant Jordi','Barcelona','2025-07-19',17000);
INSERT INTO product_tags VALUES ('cc789f85-1476-452a-8100-9e74502198e0','pop');
INSERT INTO products (id,name,description,price,artist,venue,city,date,capacity) VALUES ('d4edfedb-dbe9-4dd9-aae8-009489394955','Hit Me Hard and Soft Tour','Billie Eilish intimate arena tour.',90,'Billie Eilish','Palacio Vistalegre','Madrid','2025-09-20',15000);
INSERT INTO product_tags VALUES ('d4edfedb-dbe9-4dd9-aae8-009489394955','pop');
INSERT INTO products (id,name,description,price,artist,venue,city,date,capacity) VALUES ('d77f9ae6-e9a8-4a3e-86bd-b72af75cbc49','The Eras Tour','Taylor Swift record-breaking Eras Tour.',150,'Taylor Swift','Estadio Santiago Bernabeu','Madrid','2025-06-14',81000);
INSERT INTO product_tags VALUES ('d77f9ae6-e9a8-4a3e-86bd-b72af75cbc49','pop');
