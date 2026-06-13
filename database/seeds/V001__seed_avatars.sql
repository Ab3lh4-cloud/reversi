-- ============================================================
-- Seed V001: Populate avatars table with 12 anime avatars
-- Project: Othello Mobile Web (reversi)
-- ============================================================

INSERT INTO avatars (code, name, asset_key, sort_order, is_active) VALUES
    ('anime_boy_01',  'Anime Boy 01',  'avatars/anime_boy_01.png',  1,  TRUE),
    ('anime_boy_02',  'Anime Boy 02',  'avatars/anime_boy_02.png',  2,  TRUE),
    ('anime_girl_01', 'Anime Girl 01', 'avatars/anime_girl_01.png', 3,  TRUE),
    ('anime_girl_02', 'Anime Girl 02', 'avatars/anime_girl_02.png', 4,  TRUE),
    ('ninja_01',      'Ninja',         'avatars/ninja_01.png',      5,  TRUE),
    ('mage_01',       'Mage',          'avatars/mage_01.png',       6,  TRUE),
    ('warrior_01',    'Warrior',       'avatars/warrior_01.png',    7,  TRUE),
    ('fox_01',        'Fox Spirit',    'avatars/fox_01.png',        8,  TRUE),
    ('cat_01',        'Cat Girl',      'avatars/cat_01.png',        9,  TRUE),
    ('moon_01',       'Moon Princess', 'avatars/moon_01.png',       10, TRUE),
    ('star_01',       'Star Knight',   'avatars/star_01.png',       11, TRUE),
    ('samurai_01',    'Samurai',       'avatars/samurai_01.png',    12, TRUE)
ON CONFLICT (code) DO NOTHING;
