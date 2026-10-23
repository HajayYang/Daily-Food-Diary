import { FOOD_API_ORIGIN, normalizeProduct } from './food-api.js';
import { NUTRIENTS } from './nutrition.js';
export function validBarcode(code){
 if(typeof code!=='string'||! /^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code))return false;
 let sum=0;for(let index=code.length-2,weight=3;index>=0;index--,weight=weight===3?1:3)sum+=Number(code[index])*weight;
 return (10-sum%10)%10===Number(code.at(-1));
}
export function productURL(code){if(!validBarcode(code))throw Error('请输入有效的 EAN / UPC 条码，校验位需正确。');return `${FOOD_API_ORIGIN}/api/v2/product/${code}.json?fields=code,product_name,product_name_zh,generic_name,brands,ingredients_text,ingredients_text_zh,allergens,traces,serving_size,nutriments`;}
export function createBarcodeClient({fetcher=globalThis.fetch,now=Date.now}={}){
 const cache=new Map();let last=-Infinity;
 return {async lookup(code,signal){const url=productURL(code);if(cache.has(code))return cache.get(code);if(now()-last<1000)throw Error('查询较频繁，请稍后再试。');last=now();const response=await fetcher(url,{signal,credentials:'omit',referrerPolicy:'no-referrer',headers:{Accept:'application/json'}});if(response.status===404)return null;if(!response.ok)throw Error('条码食品库暂不可用，请稍后重试。');let data;try{data=await response.json();}catch{throw Error('条码食品库返回了无效数据。');}if(data.status===0)return null;const product=normalizeProduct(data.product);if(!product||product.code.replace(/^0+/,'')!==code.replace(/^0+/,''))throw Error('条码食品库返回了无效数据。');if(cache.size>=50)cache.delete(cache.keys().next().value);cache.set(code,product);return product;}};
}
export function barcodeRecord(product,amount,unit,date,meal){
 if(typeof amount!=='number'||!Number.isFinite(amount)||amount<.1||amount>5000||!['g','ml'].includes(unit))throw Error('请填写 0.1–5000 的实际份量，并核对克或毫升。');
 const record={id:'',date,meal,food:product.name.slice(0,120),portion:`${amount} ${unit}`,calories:product.kcal===null?null:Math.round(product.kcal*amount/100),note:'',source:'barcode',barcode:product.code,nutritionSource:`Open Food Facts · ${product.url}`};
 for(const key of Object.keys(NUTRIENTS))record[key]=product[key]==null?null:Math.round(product[key]*amount/100*1000)/1000;
 return record;
}
