DROP TABLE IF EXISTS events;

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    location VARCHAR(100),
    date VARCHAR(50),
    image_url TEXT,
    category VARCHAR(50),
    stock INT,
    price VARCHAR(50),
    theme_color VARCHAR(20), -- Hex Code untuk efek background
    is_major BOOLEAN -- True=Slider Besar, False=Event Kecil
);

-- 1. KONSER BESAR (Slider Utama)
INSERT INTO events (name, location, date, image_url, category, stock, price, theme_color, is_major) VALUES
('GO YOUN JUNG: Fan Meeting', 'Netflix Hall Jakarta', '15 Feb 2026', 'https://placehold.co/600x800/1a1a1a/FFF?text=GO+YOUN+JUNG', 'Fan Meeting', 500, 'IDR 2.500.000', '#5b21b6', TRUE), -- Ungu
('BABYMONSTER: See You There', 'Tennis Indoor Senayan', '08 June 2026', 'https://placehold.co/600x800/880000/FFF?text=BABYMONSTER', 'K-Pop', 2000, 'IDR 3.000.000', '#991b1b', TRUE), -- Merah Darah
('NewJeans: Bunnies Camp', 'GBK Madya Stadium', '20 July 2026', 'https://placehold.co/600x800/000088/FFF?text=NewJeans', 'K-Pop', 3000, 'IDR 2.800.000', '#1e40af', TRUE), -- Biru
('IVE: Show What I Have', 'ICE BSD Hall 5', '24 Aug 2026', 'https://placehold.co/600x800/880088/FFF?text=IVE+WORLD+TOUR', 'K-Pop', 2500, 'IDR 2.700.000', '#d946ef', TRUE), -- Pink Neon
('Westlife: The Hits', 'Prambanan Temple', '02 Oct 2026', 'https://placehold.co/600x800/CCAA00/FFF?text=WESTLIFE', 'Pop', 5000, 'IDR 1.500.000', '#eab308', TRUE); -- Kuning Emas

-- 2. KONSER KECIL / UMKM (Event Calendar)
INSERT INTO events (name, location, date, image_url, category, stock, price, theme_color, is_major) VALUES
('Jazz Coffee Night', 'Kopi Tuku Cipete', '20 Jan 2026', 'https://placehold.co/400x300/333/FFF?text=Jazz+Night', 'Indie', 50, 'IDR 50.000', '#333', FALSE),
('Campus Band Festival', 'Binus Anggrek Hall', '25 Jan 2026', 'https://placehold.co/400x300/444/FFF?text=Band+Fest', 'Festival', 200, 'Free Entry', '#444', FALSE),
('Standup Indo Jaksel', 'Tebet Comedy Club', '30 Jan 2026', 'https://placehold.co/400x300/555/FFF?text=Standup', 'Comedy', 100, 'IDR 75.000', '#555', FALSE),
('Indie Folk Parade', 'M Bloc Space', '05 Feb 2026', 'https://placehold.co/400x300/666/FFF?text=Folk+Parade', 'Music', 300, 'IDR 100.000', '#666', FALSE);