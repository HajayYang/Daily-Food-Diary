// Each value describes the whole recorded portion, or the stated 100 g/100 ml basis.
// Vitamins/minerals remain separate: unlike units and nutrients must never be summed.
export const NUTRIENTS = {
  carbs:{label:'糖类（碳水化合物）',unit:'g',max:2000}, sugars:{label:'其中糖',unit:'g',max:2000},
  fat:{label:'脂肪',unit:'g',max:2000}, saturatedFat:{label:'饱和脂肪',unit:'g',max:2000}, protein:{label:'蛋白质',unit:'g',max:2000},
  vitaminC:{label:'维生素 C',unit:'mg',max:10000}, vitaminA:{label:'维生素 A（RAE）',unit:'µg',max:100000},
  vitaminD:{label:'维生素 D',unit:'µg',max:10000}, vitaminB12:{label:'维生素 B12',unit:'µg',max:10000},
  calcium:{label:'钙',unit:'mg',max:20000}, iron:{label:'铁',unit:'mg',max:20000},
  potassium:{label:'钾',unit:'mg',max:20000}, sodium:{label:'钠',unit:'mg',max:20000},
  water:{label:'水',unit:'g',max:20000}, fiber:{label:'膳食纤维',unit:'g',max:2000},
};
export const VITAMINS=['vitaminC','vitaminA','vitaminD','vitaminB12'];
export const MINERALS=['calcium','iron','potassium','sodium'];
export function validNutrients(record){
  return Object.entries(NUTRIENTS).every(([key,{max}])=>record[key]==null||(typeof record[key]==='number'&&Number.isFinite(record[key])&&record[key]>=0&&record[key]<=max))
    &&(record.nutritionSource==null||typeof record.nutritionSource==='string'&&record.nutritionSource.length<=200);
}
export function scaleNutrients(food,grams){
  return Object.fromEntries(Object.keys(NUTRIENTS).map(key=>[key,food[key]==null?null:Math.round(food[key]*grams/100*1000)/1000]));
}
export function nutrientTotals(records){
  return Object.fromEntries(Object.keys(NUTRIENTS).map(key=>[key,{total:Math.round(records.reduce((sum,record)=>sum+(record[key]??0),0)*1000)/1000,missing:records.filter(record=>record[key]==null).length}]));
}
export function renderNutrition(data,element,basis='营养数值对应本条记录的份量。'){
  const details=element('details','six-nutrients');details.append(element('summary','','六类营养信息'));
  const dl=element('dl','six-nutrients-grid');
  function value(key){const span=element('span','nutrient-value');span.append(element('span','',NUTRIENTS[key].label),document.createTextNode(': '),element('span','',data[key]==null?'未提供':`${data[key]} ${NUTRIENTS[key].unit}`));return span;}
  for(const [label,keys] of [['糖类（碳水化合物）',['carbs','sugars']],['脂肪',['fat','saturatedFat']],['蛋白质',['protein']],['维生素（已收录项目）',VITAMINS],['无机盐（矿物质）',MINERALS],['水',['water']]]){
    const row=element('div'),dd=element('dd');
    if(keys.length===1)dd.textContent=data[keys[0]]==null?'未提供':`${data[keys[0]]} ${NUTRIENTS[keys[0]].unit}`;
    else for(const key of keys)dd.append(value(key));
    row.append(element('dt','',label),dd);dl.append(row);
  }
  details.append(element('p','muted',basis),dl,element('p','muted','维生素和矿物质按具体项目列出，不相加成总克数；未提供不代表没有。糖是碳水的一部分，不等于游离糖。'));
  if(data.nutritionSource){const source=element('p','nutrition-source');source.append(element('span','','数据来源'),document.createTextNode(': '));const text=element('span','',data.nutritionSource);text.translate=false;source.append(text);details.append(source);}
  return details;
}
// Generic USDA SR Legacy approximations per 100 g edible portion, matching food states.
// Values differ by cultivar, cooking and brand. Unlisted nutrients remain unknown.
export const REFERENCE_SOURCE='USDA SR Legacy · 通用食材近似值 / 100 g';
export const REFERENCE_NUTRITION={
  rice:{saturatedFat:0.077,water:68.44,sugars:.05,vitaminC:0,vitaminA:0,vitaminD:0,vitaminB12:0,calcium:10,iron:.2,potassium:35,sodium:1,fiber:.4},
  chicken:{saturatedFat:1.01,water:65.26,sugars:0,vitaminC:0,vitaminA:6,vitaminD:.1,vitaminB12:.34,calcium:15,iron:1.04,potassium:256,sodium:74,fiber:0},
  egg:{saturatedFat:3.267,water:74.62,sugars:1.12,vitaminC:0,vitaminA:149,vitaminD:2.2,vitaminB12:1.11,calcium:50,iron:1.19,potassium:126,sodium:124,fiber:0},
  banana:{saturatedFat:0.112,water:74.91,sugars:12.23,vitaminC:8.7,vitaminA:3,vitaminD:0,vitaminB12:0,calcium:5,iron:.26,potassium:358,sodium:1,fiber:2.6},
  oats:{saturatedFat:1.217,water:10.84,sugars:.99,vitaminC:0,vitaminA:0,vitaminD:0,vitaminB12:0,calcium:52,iron:4.25,potassium:362,sodium:6,fiber:10.1},
  broccoli:{saturatedFat:0.079,water:89.25,sugars:1.39,vitaminC:64.9,vitaminA:77,vitaminD:0,vitaminB12:0,calcium:40,iron:.67,potassium:293,sodium:41,fiber:3.3},
  apple:{saturatedFat:0.028,protein:.26,carbs:13.81,fat:.17,water:85.56,sugars:10.39,vitaminC:4.6,vitaminA:3,vitaminD:0,vitaminB12:0,calcium:6,iron:.12,potassium:107,sodium:1,fiber:2.4},
  orange:{saturatedFat:0.015,protein:.94,carbs:11.75,fat:.12,water:86.75,sugars:9.35,vitaminC:53.2,vitaminA:11,vitaminD:0,vitaminB12:0,calcium:40,iron:.1,potassium:181,sodium:0,fiber:2.4},
  kiwi:{saturatedFat:0.029,protein:1.14,carbs:14.66,fat:.52,water:83.07,sugars:8.99,vitaminC:92.7,vitaminA:4,vitaminD:0,vitaminB12:0,calcium:34,iron:.31,potassium:312,sodium:3,fiber:3},
  yogurt:{saturatedFat:2.096,protein:3.47,carbs:4.66,fat:3.25,water:87.9,sugars:4.66,vitaminC:.5,vitaminA:27,vitaminD:.1,vitaminB12:.37,calcium:121,iron:.05,potassium:155,sodium:46,fiber:0},
};
