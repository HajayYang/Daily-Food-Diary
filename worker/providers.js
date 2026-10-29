import { PHOTO_SCHEMA, validateRecognition } from '../photo-core.js';

// Only official Alibaba Cloud API hosts are accepted. The browser never chooses
// a provider endpoint, model or provider key in a recognition request.
const LEGACY_REGIONS = {
  'dashscope.aliyuncs.com':'cn-beijing',
  'dashscope-intl.aliyuncs.com':'ap-southeast-1',
  'dashscope-us.aliyuncs.com':'us-east-1',
  'cn-hongkong.dashscope.aliyuncs.com':'cn-hongkong',
};
export function dashscopeEndpoint(base) {
  try {
    if(typeof base!=='string'||!base.trim())return null;
    const url=new URL(base.trim());
    if(url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash||!/^\/compatible-mode\/v1\/?$/.test(url.pathname))return null;
    const workspace=url.hostname.match(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(cn-beijing|ap-southeast-1|us-east-1|eu-central-1|cn-hongkong)\.maas\.aliyuncs\.com$/);
    const region=workspace?.[1]??(Object.hasOwn(LEGACY_REGIONS,url.hostname)?LEGACY_REGIONS[url.hostname]:null);
    if(!region)return null;
    return {url:`${url.origin}/compatible-mode/v1/chat/completions`,region};
  }catch{return null;}
}
export function resolveVisionProvider(env) {
  const provider=env.VISION_PROVIDER??'openai';
  const model=provider==='dashscope'?(env.DASHSCOPE_MODEL||'qwen3-vl-flash'):(env.VISION_MODEL||'gpt-4.1-mini');
  if(typeof model!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_./:-]{0,119}$/.test(model))return null;
  if(provider==='openai'&&typeof env.OPENAI_API_KEY==='string'&&env.OPENAI_API_KEY.trim())return {provider,model,key:env.OPENAI_API_KEY,url:'https://api.openai.com/v1/responses'};
  if(provider==='dashscope'&&typeof env.DASHSCOPE_API_KEY==='string'&&env.DASHSCOPE_API_KEY.trim()) {
    const endpoint=dashscopeEndpoint(env.DASHSCOPE_BASE_URL);
    if(endpoint)return {provider,model,key:env.DASHSCOPE_API_KEY,...endpoint};
  }
  return null;
}
export function visionRequest(config,payload,instructions) {
  if(config.provider==='openai')return {model:config.model,store:false,instructions,
    input:[{role:'user',content:[{type:'input_text',text:`Describe the pictured meal in ${payload.language}. Return only the requested JSON.`},{type:'input_image',image_url:payload.image,detail:'auto'}]}],
    text:{format:{type:'json_schema',name:'meal_photo',strict:true,schema:PHOTO_SCHEMA}},max_output_tokens:2500};
  // Bailian JSON Object mode supports non-thinking Qwen3-VL models. It does not
  // enforce our schema, so validateRecognition remains mandatory after parsing.
  return {model:config.model,enable_thinking:false,stream:false,max_tokens:2500,response_format:{type:'json_object'},messages:[
    {role:'system',content:`${instructions}\nReturn exactly one JSON object matching this JSON schema: ${JSON.stringify(PHOTO_SCHEMA)}`},
    {role:'user',content:[{type:'image_url',image_url:{url:payload.image}},{type:'text',text:`Describe the pictured meal in ${payload.language}. Return only the requested JSON.`}]},
  ]};
}
export function visionResult(config,body) {
  let text;
  if(config.provider==='openai') {
    if(body.status!=='completed')throw Error('invalid_recognition');
    text=(body.output||[]).flatMap(item=>item.content||[]).filter(content=>content.type==='output_text').map(content=>content.text).join('');
  }else {
    const choice=body.choices?.[0];
    if(body.choices?.length!==1||choice?.finish_reason!=='stop'||choice.message?.refusal||typeof choice.message?.content!=='string')throw Error('invalid_recognition');
    text=choice.message.content;
  }
  return validateRecognition(JSON.parse(text));
}
