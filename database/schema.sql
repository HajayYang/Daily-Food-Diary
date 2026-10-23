-- Public recipe catalog only. Personal diaries and health profiles do not belong here.
pragma foreign_keys = on;
pragma application_id = 1145194836;
pragma user_version = 1;
create table catalog_meta (key text primary key, value text not null) strict;
create table cuisines (
 id text primary key, name text not null, region text not null, description text not null,
 position integer not null unique check(position >= 0)
) strict;
create table ingredients (
 id text primary key, name text not null, unit text not null,
 allergens text not null check(json_valid(allergens) and json_type(allergens)='array')
) strict;
create table recipes (
 id text primary key, cuisine_id text not null references cuisines(id),
 name text not null, category text not null check(category in ('plant','meat','staple')),
 emoji text not null, minutes integer not null check(minutes > 0 and minutes <= 10080),
 servings integer not null check(servings > 0 and servings <= 100), tip text not null,
 position integer not null unique check(position >= 0)
) strict;
create index recipes_cuisine_category on recipes(cuisine_id,category,position);
create table recipe_ingredients (
 recipe_id text not null references recipes(id) on delete cascade,
 ingredient_id text not null references ingredients(id),
 amount real not null check(amount > 0 and amount < 1000000),
 position integer not null check(position >= 0),
 primary key(recipe_id,ingredient_id), unique(recipe_id,position)
) strict;
create index recipe_ingredients_lookup on recipe_ingredients(ingredient_id,recipe_id);
create table recipe_steps (
 recipe_id text not null references recipes(id) on delete cascade,
 position integer not null check(position >= 0), instruction text not null check(length(instruction)>0),
 primary key(recipe_id,position)
) strict;
create table recipe_aliases (
 recipe_id text not null references recipes(id) on delete cascade,
 alias text not null, primary key(recipe_id,alias)
) strict;
create table translations (
 source text primary key, en text not null, ja text not null, ko text not null
) strict;
create table recipe_search (
 recipe_id text not null references recipes(id) on delete cascade,
 language text not null check(language in ('zh-CN','en','ja','ko')),
 search_text text not null, primary key(recipe_id,language)
) strict;
create index recipe_search_language on recipe_search(language,recipe_id);
-- Value units are per 100 g edible ingredient, with a source for every known value.
-- A missing row means unknown; it must never be interpreted as zero.
create table nutrient_definitions (
 key text primary key, label text not null, unit text not null,
 maximum real not null check(maximum > 0)
) strict;
create table ingredient_nutrients (
 ingredient_id text not null references ingredients(id) on delete cascade,
 nutrient_key text not null references nutrient_definitions(key),
 value real not null check(value >= 0 and value <= 100000),
 basis_grams real not null default 100 check(basis_grams=100), source text not null check(length(source)>0),
 primary key(ingredient_id,nutrient_key)
) strict;
