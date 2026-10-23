// Only known ingredients are matched; label checks are still needed for traces/brands.
const foods={
 oats:['原味燕麦',['gluten'],['oats','オーツ','귀리']],rice:['糙米饭',[],['rice','ご飯','쌀']],potato:['薯类',[],['potato','いも','감자']],
 milk:['牛奶',['milk'],['milk','乳','ミルク','우유']],soyDrink:['钙强化无糖豆饮',['soy'],['soy drink','豆浆','豆乳','두유']],
 riceDrink:['钙强化无糖米饮',[],['rice drink','ライスミルク','라이스 음료']],
 fruit:['完整水果',[],['fruit','果物','과일']],orange:['橙子',[],['orange','オレンジ','오렌지','水果','fruit','果物','과일']],apple:['苹果',[],['apple','りんご','사과','水果','fruit','果物','과일']],
 fish:['鱼',['fish'],['fish','魚','생선']],chicken:['去皮禽肉',[],['chicken','鸡','肉','鶏','닭']],tofu:['豆腐',['soy'],['tofu','두부']],egg:['鸡蛋',['egg'],['egg','卵','달걀']],
 lentils:['扁豆',[],['lentils','レンズ豆','렌틸콩']],chickpeas:['鹰嘴豆',[],['chickpeas','ひよこ豆','병아리콩']],
 broccoli:['西兰花',[],['broccoli','ブロッコリー','브로콜리']],carrot:['胡萝卜',[],['carrot','にんじん','당근']],greens:['绿叶菜',[],['greens','葉野菜','잎채소']],
};
export function ingredient(id){const [label,allergens,aliases]=foods[id];return {id,label,allergens,aliases};}
export function allowedIngredient(food,restrictions={allergens:[],exclude:[]}){
  const haystack=[food.label,...food.aliases].join(' ').toLocaleLowerCase();
  return !food.allergens.some(key=>restrictions.allergens.includes(key))&&!restrictions.exclude.some(value=>haystack.includes(value.toLocaleLowerCase().trim()));
}
export function buildMenuPlan(diet,restrictions={allergens:[],exclude:[]}){
 const choose=ids=>ids.map(ingredient).find(food=>allowedIngredient(food,restrictions));
 const protein=diet==='vegan'?['tofu','lentils','chickpeas']:diet==='vegetarian'?['tofu','egg','lentils','chickpeas']:['fish','chicken','tofu','egg','lentils','chickpeas'];
 const drink=diet==='vegan'?['soyDrink','riceDrink']:['milk','soyDrink','riceDrink'];
 return [
  ['breakfast',[['oats','rice','potato'],drink,['apple','orange']]],
  ['lunch',[['rice','potato','oats'],protein,['broccoli','carrot','greens'],['carrot','greens','broccoli']]],
  ['dinner',[['potato','rice','oats'],[...protein].reverse(),['greens','carrot','broccoli'],['carrot','broccoli','greens']]],
  ['snack',[['orange','apple']]],
 ].map(([meal,groups])=>{const used=new Set();const picked=groups.map(ids=>{const food=choose(ids.filter(id=>!used.has(id)));if(food)used.add(food.id);return food;});return {meal,ingredients:picked.filter(Boolean),unavailable:picked.some(food=>!food)};});
}
