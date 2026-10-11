-- The owner weighs food raw (2026-10-11). The curated values are per 100 g as eaten, so a bare
-- staple name ("pirinç", "kıyma", "et") found the cooked food and undercounted a raw weighing up
-- to about 2.8×. This adds the raw/dry staples, moves the bare-name aliases to them, and puts the
-- state in the cooked foods' names; the cooked foods stay findable by their own names.
-- Values per 100 g raw, rounded from USDA FoodData Central (SR Legacy) standard entries; carbs are
-- total carbohydrate, as in the rest of the list.

insert into public.foods (id, name_tr, category, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, typical_portion_g, unit_weights) values
  ('rice_raw', 'Pirinç (çiğ)', 'carb', 360, 6.6, 79, 0.6, 80, '{"yemekKasigi": 13}'),
  ('pasta_dry', 'Makarna (kuru)', 'carb', 371, 13, 75, 1.5, 80, '{}'),
  ('bulgur_dry', 'Bulgur (kuru)', 'carb', 342, 12.3, 76, 1.3, 80, '{"yemekKasigi": 12}'),
  ('lentils_dry', 'Mercimek (kuru)', 'protein', 352, 24.6, 63, 1.1, 60, '{"yemekKasigi": 12}'),
  ('beef_mince_raw', 'Kıyma (çiğ, orta yağlı)', 'protein', 215, 18.6, 0, 15, 125, '{}'),
  ('beef_mince_lean_raw', 'Yağsız kıyma (çiğ)', 'protein', 137, 21.4, 0, 5, 125, '{}'),
  ('beef_raw', 'Dana eti (çiğ, yağsız)', 'protein', 150, 21, 0, 7, 150, '{}'),
  ('potato_raw', 'Patates (çiğ)', 'carb', 77, 2, 17, 0.1, 200, '{"adet": 170}'),
  ('chicken_thigh_raw', 'Tavuk but (çiğ, derisiz)', 'protein', 121, 19.7, 0, 4.1, 150, '{"adet": 110}');

update public.foods set name_tr = v.name_tr
  from (values
    ('white_rice', 'Pirinç pilavı (pişmiş)'),
    ('spaghetti', 'Makarna (haşlanmış)'),
    ('bulgur', 'Bulgur pilavı (pişmiş)'),
    ('lentils', 'Yeşil mercimek (haşlanmış)'),
    ('potato', 'Patates (haşlanmış)'),
    ('steak', 'Biftek (pişmiş)')
  ) as v (id, name_tr)
 where public.foods.id = v.id;

-- Bare names move to the raw food; the cooked food keeps its dish names ("pirinç pilavı", "pilav",
-- "biftek", "haşlanmış patates") and still appears under the bare name as a prefix match.
delete from public.food_aliases a
 using (values
   ('white_rice', 'pirinç'), ('white_rice', 'beyaz pirinç'), ('white_rice', 'rice'),
   ('spaghetti', 'makarna'), ('spaghetti', 'pasta'),
   ('bulgur', 'bulgur'),
   ('lentils', 'mercimek'), ('lentils', 'lentils'),
   ('bolognese', 'kıyma'),
   ('steak', 'dana eti'), ('steak', 'kırmızı et'), ('steak', 'et'),
   ('potato', 'patates'), ('potato', 'potato'),
   ('chicken_thigh', 'tavuk but'), ('chicken_thigh', 'chicken thigh'),
   ('chicken_breast_grilled', 'tavuk göğsü'), ('chicken_breast_grilled', 'tavuk'), ('chicken_breast_grilled', 'chicken')
 ) as d (food_id, alias)
 where a.food_id = d.food_id and a.alias = d.alias;

insert into public.food_aliases (food_id, alias) values
  ('rice_raw', 'pirinç'), ('rice_raw', 'çiğ pirinç'), ('rice_raw', 'beyaz pirinç'), ('rice_raw', 'baldo'), ('rice_raw', 'osmancık'), ('rice_raw', 'rice'),
  ('pasta_dry', 'makarna'), ('pasta_dry', 'kuru makarna'), ('pasta_dry', 'pasta'), ('pasta_dry', 'penne'), ('pasta_dry', 'erişte'),
  ('bulgur_dry', 'bulgur'), ('bulgur_dry', 'kuru bulgur'), ('bulgur_dry', 'pilavlık bulgur'),
  ('lentils_dry', 'mercimek'), ('lentils_dry', 'kuru mercimek'), ('lentils_dry', 'kırmızı mercimek'), ('lentils_dry', 'lentils'),
  ('beef_mince_raw', 'kıyma'), ('beef_mince_raw', 'çiğ kıyma'), ('beef_mince_raw', 'dana kıyma'), ('beef_mince_raw', 'orta yağlı kıyma'),
  ('beef_mince_lean_raw', 'yağsız kıyma'), ('beef_mince_lean_raw', 'az yağlı kıyma'),
  ('beef_raw', 'et'), ('beef_raw', 'dana eti'), ('beef_raw', 'kırmızı et'), ('beef_raw', 'çiğ et'), ('beef_raw', 'kuşbaşı'), ('beef_raw', 'dana kuşbaşı'),
  ('potato_raw', 'patates'), ('potato_raw', 'çiğ patates'), ('potato_raw', 'potato'),
  ('chicken_thigh_raw', 'tavuk but'), ('chicken_thigh_raw', 'çiğ tavuk but'), ('chicken_thigh_raw', 'chicken thigh'),
  ('chicken_breast_raw', 'tavuk göğsü'), ('chicken_breast_raw', 'tavuk'), ('chicken_breast_raw', 'chicken');
