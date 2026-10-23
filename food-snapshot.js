import { normalizeSearch, normalizeProduct, PAGE_SIZE } from './food-api.js';
const aliases={苹果:'apple',橙子:'orange',猕猴桃:'kiwi',香蕉:'banana',西兰花:'broccoli',燕麦:'oats',鸡蛋:'egg',酸奶:'yogurt',牛奶:'milk',面包:'bread',米饭:'rice',豆腐:'tofu',鸡肉:'chicken',鱼:'fish',土豆:'potato',面条:'noodles',豆类:'beans',パン:'bread',빵:'bread',ミルク:'milk',우유:'milk',ご飯:'rice',밥:'rice'};
export function snapshotSearch(snapshot,query,page=1){
 if(!snapshot||snapshot.version!==1||!Array.isArray(snapshot.products)||!snapshot.queries||!Number.isInteger(page)||page<1||page>100)throw Error('invalid_snapshot');
 const key=(aliases[query.trim()]??query.trim()).toLocaleLowerCase(),group=Object.hasOwn(snapshot.queries,key)?snapshot.queries[key]:null;
 if(!group||!Array.isArray(group.codes)||typeof group.capturedAt!=='string'||!Number.isFinite(new Date(group.capturedAt).getTime()))return null;
 const codes=new Set(group.codes),products=snapshot.products.filter(product=>codes.has(product?.code)&&normalizeProduct(product));
 if(!products.length)return null;
 return {...normalizeSearch({count:products.length,products:products.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE)},page),source:'snapshot',capturedAt:group.capturedAt};
}
