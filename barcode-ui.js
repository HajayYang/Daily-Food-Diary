import { createBarcodeClient, validBarcode, barcodeRecord } from './barcode.js';
import { renderNutrition } from './nutrition.js';
import { translateText } from './i18n.js';
export function setupBarcode({$,element,getDate,openForm,getRestrictions}){
 const dialog=$('#barcode-dialog'),client=createBarcodeClient();let controller,request=0,stream,timer,detector,product;
 const status=text=>$('#barcode-status').textContent=text;
 function stopCamera(){clearTimeout(timer);stream?.getTracks().forEach(track=>track.stop());stream=null;$('#barcode-video').srcObject=null;$('#barcode-video').hidden=true;$('#barcode-stop-camera').hidden=true;}
 function cancel(){request++;controller?.abort();controller=undefined;stopCamera();$('#barcode-search').disabled=false;}
 $('#barcode-open').addEventListener('click',()=>{product=null;$('#barcode-result').hidden=true;status('输入包装条码，或在支持的浏览器使用摄像头扫描。');$('#barcode-form').reset();dialog.showModal();});
 $('#close-barcode').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',cancel);$('#barcode-stop-camera').addEventListener('click',stopCamera);
 async function lookup(code){
  if(!validBarcode(code)){status('请输入有效的 EAN / UPC 条码，校验位需正确。');return;}
  cancel();product=null;$('#barcode-result').hidden=true;const serial=request;controller=new AbortController();const currentController=controller;const timeout=setTimeout(()=>currentController.abort(),15000);$('#barcode-search').disabled=true;status('正在按条码查询食品标签…');
  try{const data=await client.lookup(code,controller.signal);if(serial!==request||!dialog.open)return;if(!data){status('没有找到此条码，可改用手动输入或拍照识别。');return;}product=data;$('#barcode-product-name').textContent=data.name;$('#barcode-product-name').translate=false;$('#barcode-nutrition').replaceChildren(renderNutrition(data,element,'营养基准：每 100 克 / 100 毫升，以商品原标签为准'));$('#barcode-amount').value=100;$('#barcode-result').hidden=false;const restrictions=getRestrictions();status(restrictions?.allergens.length||restrictions?.exclude.length?'已设置饮食禁忌，请核对下面的配料、过敏原与痕量提示。':'查询完成，请核对原包装基准与实际份量。');
   $('#barcode-ingredients').textContent=[data.ingredients,data.allergens,data.traces].filter(Boolean).join(' · ')||translateText('未提供，请查看原包装');$('#barcode-ingredients').translate=false;
  }catch(error){if(serial===request)status(error.name==='AbortError'?'条码查询已取消或超时，请重试。':error.message);}finally{clearTimeout(timeout);if(serial===request){controller=undefined;$('#barcode-search').disabled=false;}}
 }
 $('#barcode-form').addEventListener('submit',event=>{event.preventDefault();lookup($('#barcode-code').value.trim());});
 $('#barcode-use').addEventListener('click',()=>{if(!product)return;try{const record=barcodeRecord(product,Number($('#barcode-amount').value),$('#barcode-unit').value,getDate(),$('#barcode-meal').value);dialog.close();openForm(record.meal,record);}catch(error){status(error.message);}});
 $('#barcode-camera').addEventListener('click',async()=>{
  cancel();if(!globalThis.BarcodeDetector||!navigator.mediaDevices?.getUserMedia){status('此浏览器不支持扫码，请手动输入包装上的数字条码。');return;}
  const serial=++request;
  try{const formats=await BarcodeDetector.getSupportedFormats();if(serial!==request||!dialog.open)return;if(!formats.some(format=>['ean_13','ean_8','upc_a'].includes(format)))throw Error();detector=new BarcodeDetector({formats:formats.filter(format=>['ean_13','ean_8','upc_a'].includes(format))});const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});if(serial!==request||!dialog.open){media.getTracks().forEach(track=>track.stop());return;}stream=media;const video=$('#barcode-video');video.hidden=false;video.srcObject=media;$('#barcode-stop-camera').hidden=false;await video.play();status('将包装条码放在镜头中，识别在本机进行。');
   async function scan(){if(!stream||serial!==request)return;try{const codes=await detector.detect(video);const found=codes.find(code=>validBarcode(code.rawValue));if(found){$('#barcode-code').value=found.rawValue;lookup(found.rawValue);return;}}catch{/* Retry while video settles. */}if(stream&&serial===request)timer=setTimeout(scan,350);}scan();
  }catch{stopCamera();status('无法开启摄像头，请允许权限或手动输入条码。');}
 });
}
