import { MAX_PHOTO_BYTES, normalizePhotoService, validateRecognition } from './photo-core.js';
export const PHOTO_ERRORS = {
  photo_service_invalid:'请输入 HTTPS 识别服务根地址，本地开发可用 localhost。',
  not_configured:'识别服务尚未配置模型密钥或访问码，请联系服务管理员。',
  unauthorized:'识别服务访问码不正确，请检查后重试。',
  origin_not_allowed:'识别服务未允许当前网站，请让管理员配置网站来源。',
  rate_limited:'识别请求较多，请稍后再试。', provider_busy:'视觉模型暂时限流，请稍后重试。',
  provider_unavailable:'视觉模型服务不可用，请检查服务端模型权限、密钥或额度。',
  recognition_timeout:'识别超时，请重试或使用更清晰、较小的照片。',
  recognition_failed:'暂时无法可靠识别，请重新拍照或手动记录。',
  invalid_recognition:'识别结果格式异常，请重试；没有保存任何记录。',
  invalid_request:'照片请求无效，请重新选择图片。', image_too_large:'照片处理后仍过大，请选择更小的图片。',
  network_error:'无法连接识别服务，请检查服务地址、网络与跨域设置。',
};
export function photoError(error) { return PHOTO_ERRORS[error?.message] || PHOTO_ERRORS.network_error; }
export async function prepareMealPhoto(file) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('请选择 JPG、PNG 或 WebP 餐食照片。');
  if(file.size>12*1024*1024)throw new Error('照片超过 12 MB，请缩小后重试。');
  const image=await createImageBitmap(file).catch(()=>{throw new Error('餐食照片无法读取，请换一张图片。');});
  try {
    if(!image.width||!image.height||image.width*image.height>80000000)throw new Error('餐食照片尺寸过大，请缩小后重试。');
    const ratio=Math.min(1,1600/Math.max(image.width,image.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));
    const context=canvas.getContext('2d');if(!context)throw new Error('浏览器无法处理照片，请更新浏览器。');
    context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
    let blob;
    for(const quality of [.8,.6,.45]){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(blob&&blob.size<=MAX_PHOTO_BYTES)break;}
    if(!blob||blob.size>MAX_PHOTO_BYTES)throw new Error(PHOTO_ERRORS.image_too_large);
    const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('餐食照片无法读取，请换一张图片。'));reader.readAsDataURL(blob);});
    return {blob,dataUrl};
  }finally{image.close();}
}
export async function requestPhotoService({url,token,image,language,signal,health=false,fetcher=globalThis.fetch}) {
  const origin=normalizePhotoService(url);
  if(!token.trim())throw new Error('请填写识别服务访问码，不要填写模型 API 密钥。');
  let response;
  try{response=await fetcher(`${origin}/api/${health?'health':'recognize-meal'}`,{
    method:health?'GET':'POST',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',redirect:'error',signal,
    headers:{Authorization:`Bearer ${token.trim()}`,...(health?{}:{'Content-Type':'application/json'})},
    ...(health?{}:{body:JSON.stringify({image,language})}),
  });}catch(error){if(error.name==='AbortError')throw error;throw new Error('network_error');}
  let data;try{data=await response.json();}catch{throw new Error('invalid_recognition');}
  if(!response.ok)throw new Error(PHOTO_ERRORS[data?.error?.code]?data.error.code:'network_error');
  if(health){if(data.ready!==true)throw new Error('not_configured');return data;}
  return validateRecognition(data);
}
