import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_APPEARANCE, validAppearance, imageDimensions } from '../appearance.js';
test('appearance storage validates theme, style and transparency boundaries',()=>{
 assert.equal(validAppearance(DEFAULT_APPEARANCE),true);
 for(const theme of ['white','black','green','blue']) for(const buttonStyle of ['normal','glass']) for(const opacity of [0,100]) assert.equal(validAppearance({theme,buttonStyle,opacity}),true);
 for(const override of [{theme:'unknown'},{buttonStyle:'other'},{opacity:-1},{opacity:101},{opacity:20.5},{opacity:'25'}]) assert.equal(validAppearance({...DEFAULT_APPEARANCE,...override}),false);
 assert.equal(validAppearance(null),false);
});
test('background resizing preserves aspect ratio without upscaling',()=>{
 assert.deepEqual(imageDimensions(4000,2000),{width:2400,height:1200});
 assert.deepEqual(imageDimensions(1000,2000),{width:1000,height:2000});
 assert.deepEqual(imageDimensions(1200,3600),{width:800,height:2400});
 assert.throws(()=>imageDimensions(0,100));
 assert.throws(()=>imageDimensions(10000,10000));
 assert.throws(()=>imageDimensions(NaN,100));
});
