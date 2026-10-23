import { renderNutrition } from './nutrition.js';
import { getLanguage, translateText } from './i18n.js';
import { localDate, validRecord } from './records.js';
import { normalizePhotoService } from './photo-core.js';
import { prepareMealPhoto, requestPhotoService, photoError, PHOTO_ERRORS } from './photo-client.js';

export function setupPhotoDiary({ $, element, getDate, saveRecords }) {
  const key='daily-bites.photo-service.v1';
  let photo,previewUrl,controller,busy=false,serial=0;
  const dialog=$('#photo-dialog'),form=$('#photo-review-form');
  const status=message=>{$('#photo-status').textContent=message;};
  try{$('#photo-service-url').value=localStorage.getItem(key)||document.querySelector('meta[name="photo-service"]')?.content||'';}catch{/* Address can still be entered for this page. */}
  function controls(){
    for(const id of ['photo-upload','photo-camera','photo-recognize','photo-check-service','photo-save-service','photo-service-url','photo-service-token'])$(`#${id}`).disabled=busy||(id==='photo-recognize'&&(!photo||!$('#photo-consent').checked));
    $('#photo-cancel').hidden=!busy;$('#photo-review-save').disabled=busy;
    $('#photo-recognition-area').setAttribute('aria-busy',String(busy));
  }
  function clearResults(){$('#photo-items').replaceChildren();$('#photo-review').hidden=true;$('#photo-warning').textContent='';}
  function clearPhoto(){if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=undefined;photo=undefined;$('#photo-preview').removeAttribute('src');$('#photo-preview').hidden=true;$('#photo-placeholder').hidden=false;}
  function stop(){serial++;controller?.abort();controller=undefined;busy=false;controls();}
  dialog.addEventListener('close',()=>{stop();clearPhoto();clearResults();$('#photo-consent').checked=false;controls();});
  $('#photo-close').addEventListener('click',()=>dialog.close());
  $('#photo-cancel').addEventListener('click',()=>{stop();status('已取消识别，没有保存任何记录。');});
  $('#photo-manual').addEventListener('click',()=>{dialog.close();$('#add-record').click();});
  $('#photo-open').addEventListener('click',()=>{
    $('#photo-date').value=getDate();$('#photo-meal').value='lunch';
    status($('#photo-service-url').value?'选择一张清晰餐食照片，核对后再保存。':'尚未设置识别服务，请先展开服务设置。');
    $('#photo-service-settings').open=!$('#photo-service-url').value;
    dialog.showModal();controls();
  });
  for(const id of ['photo-upload','photo-camera'])$(`#${id}`).addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file||busy)return;
    const id=++serial;busy=true;controls();status('正在本地压缩照片，尚未上传…');
    try{const prepared=await prepareMealPhoto(file);if(id!==serial)return;clearPhoto();clearResults();photo=prepared;previewUrl=URL.createObjectURL(prepared.blob);$('#photo-preview').src=previewUrl;$('#photo-preview').hidden=false;$('#photo-placeholder').hidden=true;status('照片已就绪。确认发送后开始识别。');}
    catch(error){if(id===serial)status(error.message);}
    finally{event.target.value='';if(id===serial){busy=false;controls();}}
  });
  $('#photo-consent').addEventListener('change',controls);
  $('#photo-save-service').addEventListener('click',()=>{
    try{const origin=normalizePhotoService($('#photo-service-url').value);localStorage.setItem(key,origin);$('#photo-service-url').value=origin;status('服务地址已保存；访问码不会保存在浏览器存储中。');}
    catch(error){status(error.message==='photo_service_invalid'?PHOTO_ERRORS.photo_service_invalid:'无法保存服务地址，请检查浏览器存储设置。');}
  });
  async function run(health=false){
    if(busy||!health&&(!photo||!$('#photo-consent').checked))return;
    const id=++serial,requestController=new AbortController();controller=requestController;let timedOut=false;
    const timer=setTimeout(()=>{timedOut=true;requestController.abort();},health?10000:55000);
    busy=true;controls();if(!health)clearResults();status(health?'正在检测识别服务…':'正在识别餐食，请稍候…');
    try{
      const result=await requestPhotoService({url:$('#photo-service-url').value,token:$('#photo-service-token').value,image:photo?.dataUrl,language:getLanguage(),signal:requestController.signal,health});
      if(id!==serial||!dialog.open)return;
      if(health){status('服务已连接；实际识别还取决于模型权限和额度。');return;}
      if(!result.is_food){status('没有识别到可用的餐食，请重新拍照或手动记录。');return;}
      showReview(result);status('识别完成，请核对名称、份量和营养估算，再勾选保存。');
    }catch(error){if(id===serial)status(timedOut?PHOTO_ERRORS.recognition_timeout:error.name==='AbortError'?'已取消识别，没有保存任何记录。':PHOTO_ERRORS[error.message]?photoError(error):error.message==='photo_service_invalid'?PHOTO_ERRORS.photo_service_invalid:error.message);}
    finally{clearTimeout(timer);if(id===serial){controller=undefined;busy=false;controls();}}
  }
  $('#photo-check-service').addEventListener('click',()=>run(true));
  $('#photo-recognize').addEventListener('click',()=>run());
  function field(label,name,value,options={}){
    const wrapper=element('label','',label),input=element(options.textarea?'textarea':'input');input.name=name;input.value=value??'';
    if(options.textarea){input.rows=2;input.maxLength=400;}else if(options.numeric){input.type='number';input.min=0;input.max=options.max??2000;input.step=options.integer?'1':'.1';input.placeholder='可不填';}else{input.type='text';input.maxLength=name==='food'?120:40;input.required=name==='food';}
    wrapper.append(input);return wrapper;
  }
  function showReview(result){
    $('#photo-warning').textContent=result.warning;$('#photo-warning').translate=false;
    $('#photo-items').replaceChildren(...result.items.map((item,index)=>{
      const row=element('fieldset','photo-item');row.append(element('legend','',`识别食物 ${index+1}`));
      const selection=element('label','photo-select-row'),check=element('input');check.type='checkbox';check.name='selected';check.checked=item.confidence!=='low';selection.append(check,element('span','','将这项加入记录'));
      const confidence=element('span',`photo-confidence ${item.confidence}`,{low:'不确定，默认未勾选',medium:'有一定把握，仍需核对',high:'模型自评较有把握，仍需核对'}[item.confidence]);selection.append(confidence);row.append(selection);
      const basics=element('div','form-row');basics.append(field('食物名称','food',item.name),field('估算份量，可修改','portion',item.grams===null?'':`${item.grams} ${translateText('克')}`));
      const nutrition=element('div','photo-nutrition-inputs');for(const [key,label] of [['calories','估算热量（kcal）'],['protein','蛋白质（g）'],['carbs','碳水（g）'],['fat','脂肪（g）']])nutrition.append(field(label,key,item[key],{numeric:true,max:key==='calories'?20000:2000,integer:key==='calories'}));
      let nutrientPreview=renderNutrition(item,element);
      nutrition.addEventListener('input',()=>{
        const values={...item};for(const key of ['protein','carbs','fat']){const raw=nutrition.querySelector(`[name=${key}]`).value;values[key]=raw===''?null:Number(raw);}
        const updated=renderNutrition(values,element);updated.open=nutrientPreview.open;nutrientPreview.replaceWith(updated);nutrientPreview=updated;
      });
      row.append(basics,nutrition,element('p','muted','照片不能可靠推断维生素、矿物质或水；这些项目保持未提供，可保存后按标签编辑。'),nutrientPreview,field('识别备注，可修改','note',item.note,{textarea:true}));
      const enabled=()=>{for(const input of row.querySelectorAll('input,textarea'))if(input!==check)input.disabled=!check.checked;};check.addEventListener('change',enabled);enabled();return row;
    }));
    $('#photo-review').hidden=false;
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();if(busy||!dialog.open||$('#photo-review').hidden)return;
    const rows=[...document.querySelectorAll('.photo-item')].filter(row=>row.querySelector('[name=selected]').checked);
    if(!rows.length){status('请至少勾选一种食物；不确定的项目可以不保存。');return;}
    const records=rows.map(row=>{
      const value=name=>row.querySelector(`[name=${name}]`).value.trim();
      return {id:crypto.randomUUID(),date:$('#photo-date').value,meal:$('#photo-meal').value,food:value('food'),portion:value('portion'),
        calories:value('calories')===''?null:Number(value('calories')),protein:value('protein')===''?null:Number(value('protein')),carbs:value('carbs')===''?null:Number(value('carbs')),fat:value('fat')===''?null:Number(value('fat')),
        note:[translateText('拍照识别估算，已人工核对。'),value('note')].filter(Boolean).join(' '),source:'photo'};
    });
    if(!records.every(validRecord)){status('请检查要保存的食物名称、日期、份量与营养数值。');return;}
    if(saveRecords(records)){dialog.close();}else status('保存失败，识别结果仍保留，请检查本地存储。');
  });
  controls();
}
