import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {openCatalog} from '../database/api.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const PAGE_LANGUAGES=[['zh-CN','cookbook.html','简体中文'],['en','cookbook.en.html','English'],['ja','cookbook.ja.html','日本語'],['ko','cookbook.ko.html','한국어']];
const copy={
 'zh-CN':{title:'今天吃什么 · 菜谱目录',back:'返回每日食记',intro:'108 道菜，家常菜与八大菜系各 12 道。此目录直接从公开 SQLite 数据库生成，无需 JavaScript、WebAssembly 或本地缓存。可使用浏览器查找（Ctrl+F）搜索菜名或食材。',ingredients:'需要的食材',steps:'做法步骤',tip:'配餐小建议',portion:'人份',minutes:'分钟',note:'家庭搭配参考，按实际食材、过敏情况和健康需求调整。'} ,
 en:{title:'What to cook · Recipe directory',back:'Back to Daily Bites',intro:'108 dishes: 12 home-style recipes and 12 from each of eight Chinese cuisines. Generated from the public SQLite database. No JavaScript, WebAssembly or cache required. Use browser Find (Ctrl+F) to search dishes or ingredients.',ingredients:'Ingredients',steps:'Method',tip:'Meal pairing tip',portion:'servings',minutes:'minutes',note:'Home cooking references. Adjust for ingredients, allergies and individual health needs.'},
 ja:{title:'今日は何を作る？ · レシピ一覧',back:'Daily Bites に戻る',intro:'家庭料理と中国八大料理、各12品の計108品。公開 SQLite から生成した一覧です。JavaScript、WebAssembly、キャッシュ不要。ブラウザー検索（Ctrl+F）で料理名や食材を探せます。',ingredients:'材料',steps:'作り方',tip:'献立のヒント',portion:'人分',minutes:'分',note:'家庭向けの参考です。食材、アレルギー、健康上の必要に応じて調整してください。'},
 ko:{title:'오늘은 무엇을 만들까 · 레시피 목록',back:'Daily Bites로 돌아가기',intro:'가정식과 중국 8대 요리 각 12개, 총 108개입니다. 공개 SQLite에서 생성되며 JavaScript, WebAssembly, 캐시가 필요하지 않습니다. 브라우저 찾기(Ctrl+F)로 요리나 식재료를 검색하세요.',ingredients:'필요한 재료',steps:'조리법',tip:'식단 구성 팁',portion:'인분',minutes:'분',note:'가정식 참고 자료입니다. 식재료, 알레르기 및 개인 건강 요구에 맞게 조정하세요.'}
};
export function cookbookPages(){
 const db=openCatalog();
 try{
  const metadata=db.repository.metadata(),recipes=[];
  for(let page=1;;page++){const r=db.repository.search({page});recipes.push(...r.recipes);if(page>=r.pages)break;}
  return Object.fromEntries(PAGE_LANGUAGES.map(([lang,file])=>{
   const c=copy[lang],index={en:0,ja:1,ko:2}[lang],t=text=>index===undefined?text:metadata.translations[text]?.[index]??text;
   const nav=PAGE_LANGUAGES.map(([l,f,label])=>`<a href="./${f}" lang="${l}"${l===lang?' aria-current="page"':''}>${label}</a>`).join(' · ');
   const contents=metadata.cuisines.map(cuisine=>`<section id="${escape(cuisine.id)}"><h2>${escape(t(cuisine.name))}</h2><p>${escape(t(cuisine.description))}</p>${recipes.filter(r=>r.cuisine===cuisine.id).map(r=>`<article id="${escape(r.id)}"><h3>${escape(r.emoji)} ${escape(t(r.name))}</h3><p>${r.servings} ${c.portion} · ${r.minutes} ${c.minutes}</p><h4>${c.ingredients}</h4><ul>${r.ingredients.map(i=>`<li>${escape(t(i.name))} · ${i.amount} ${escape(t(i.unit))}</li>`).join('')}</ul><h4>${c.steps}</h4><ol>${r.steps.map(s=>`<li>${escape(t(s))}</li>`).join('')}</ol><p><strong>${c.tip}</strong> · ${escape(t(r.tip))}</p></article>`).join('')}</section>`).join('');
   return [file,`<!doctype html>\n<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${c.title}</title><style>body{max-width:1000px;margin:32px auto;padding:0 24px;font:16px/1.8 system-ui,sans-serif;color:#303e33;background:#f6f7f2}a{color:#35633d}nav{display:flex;gap:16px;flex-wrap:wrap}article{padding:24px;margin:22px 0;background:#fff;border:1px solid #dfe5d7;border-radius:16px}li{margin:6px 0}h2{margin-top:48px}h3{font-size:24px}footer{margin:32px 0}@media print{body{margin:0;background:white}article{break-inside:avoid}nav{display:none}}</style></head><body><header><a href="./index.html#cookbook">${c.back}</a><h1>${c.title}</h1><p>${c.intro}</p><p>${nav}</p><nav aria-label="Cuisine">${metadata.cuisines.map(cuisine=>`<a href="#${escape(cuisine.id)}">${escape(t(cuisine.name))}</a>`).join('')}</nav></header><main>${contents}</main><footer>${c.note}<br>Hangjay-Yang · MIT · SQLite ${escape(metadata.version)}</footer></body></html>\n`];
  }));
 }finally{db.close();}
}
export async function buildCookbookPages({check=false}={}){
 for(const [file,html] of Object.entries(cookbookPages())){
  const url=new URL(`../${file}`,import.meta.url);
  if(check){if(await readFile(url,'utf8')!==html)throw Error(`Run npm run cookbook:build: ${file} is out of date`);}else await writeFile(url,html);
 }
 console.log('PASS four plain HTML recipe directories generated from the verified SQLite catalog (108 recipes each).');
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)await buildCookbookPages({check:process.argv.includes('--check')});
