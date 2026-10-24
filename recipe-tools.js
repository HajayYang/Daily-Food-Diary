import { recipeRows, estimateRecipe, recipeFood } from './recipe-nutrition.js';
import { renderNutrition } from './nutrition.js';
import { translateText } from './i18n.js';

export function setupRecipeTools({$,element,getDate,addPlan,toast}) {
  let draft,planDraft;
  $('#close-recipe-plan').addEventListener('click',()=>$('#recipe-plan-dialog').close());
  $('#recipe-plan-form').addEventListener('submit',event=>{
    event.preventDefault();if(!planDraft)return;
    const plan={id:crypto.randomUUID(),date:$('#recipe-plan-date').value,meal:$('#recipe-plan-meal').value,recipeId:planDraft.recipeId,name:planDraft.name,status:'planned',food:planDraft.food};
    if(addPlan(plan))$('#recipe-plan-dialog').close();
  });
  return {render(recipe,ingredients,servings) {
    const root=element('section','recipe-estimator'),heading=element('h4','','食谱营养估算与用餐计划');
    root.append(heading,element('p','muted','按生食材可食重量估算；鸡蛋暂按 50 g/个、蒜按 3 g/瓣，可按实际称重修改。油按实际吃下的量填写。'));
    const rows=recipeRows(ingredients),fields=element('details','recipe-estimate-inputs');fields.append(element('summary','','核对食材克数与每 100 克营养值'));
    for(const row of rows) {
      const item=element('div','estimate-ingredient'),name=element('strong','',row.name),controls=element('div','estimate-fields');
      item.append(name,element('small','',`${row.amount} ${translateText(row.unit)}`));
      const label=element('label','','实际计入克数'),grams=element('input');Object.assign(grams,{type:'number',min:'0',max:'20000',step:'.01',value:row.grams??''});
      grams.addEventListener('input',()=>{row.grams=grams.value===''?null:Number(grams.value);update();});label.append(grams);controls.append(label);
      for(const [key,title] of [['calories','热量 kcal / 100 g'],['protein','蛋白质 g / 100 g'],['carbs','碳水 g / 100 g'],['fat','脂肪 g / 100 g']]) {
        const label=element('label','',title),input=element('input');Object.assign(input,{type:'number',min:'0',max:key==='calories'?'1000':'100',step:'.001',value:row.values[key]??'',placeholder:translateText('未提供')});
        input.addEventListener('input',()=>{row.values[key]=input.value===''?null:Number(input.value);update();});label.append(input);controls.append(label);
      }
      item.append(controls,element('small','muted',Object.keys(row.values).length?'USDA SR Legacy 通用近似值，可按实际标签修改。':'此食材暂无匹配数据，可按可靠标签补充；空值保持未知。'));fields.append(item);
    }
    const portions=element('div','form-row');
    function amount(label,value) {const wrapper=element('label','',label),input=element('input');Object.assign(input,{type:'number',min:'.1',max:'20',step:'.1',value:String(value)});wrapper.append(input);portions.append(wrapper);input.addEventListener('input',update);return input;}
    const batch=amount('本锅实际总份数',servings),eaten=amount('计划食用份数',1),summary=element('div','macro-grid'),nutrition=element('div'),status=element('p','muted'),plan=element('button','primary','安排这道菜');plan.type='button';
    function update() {
      try {
        const estimates=estimateRecipe(rows,Number(batch.value),Number(eaten.value)),food=recipeFood(recipe.name,estimates,Number(eaten.value));
        summary.replaceChildren(...[['calories','热量','kcal'],['protein','蛋白质','g'],['carbs','碳水','g'],['fat','脂肪','g']].map(([key,title,unit])=>{
          const card=element('div'),value=estimates[key];card.append(element('small','',title),element('strong','',`${value.value} ${unit}`),element('small','',value.missing?translateText('已知部分，缺失 {count} 项').replace('{count}',value.missing):'该项食材数据齐全'));return card;
        }));
        nutrition.replaceChildren(renderNutrition(food,element,'对应计划食用份数；食材缺失时，本份对应营养值保持未知。'));
        status.textContent='估算不含烹调营养损失，品牌、油脂吸收和剩余汤汁会改变结果；缺失项不会作为完整数值入账。';plan.disabled=false;
        draft={recipeId:recipe.id,name:recipe.name,food};
      }catch(error){draft=null;plan.disabled=true;summary.replaceChildren();nutrition.replaceChildren();status.textContent=error.message;}
    }
    plan.addEventListener('click',()=>{if(!draft){toast('请检查总份数和实际食用份数。');return;}planDraft=structuredClone(draft);$('#recipe-plan-name').textContent=recipe.name;$('#recipe-plan-date').value=getDate();$('#recipe-plan-meal').value='lunch';$('#recipe-plan-dialog').showModal();});
    root.append(fields,portions,summary,nutrition,status,plan);update();return root;
  }};
}
