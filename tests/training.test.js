import test from 'node:test';
import assert from 'node:assert/strict';
import { validBody, validTraining, bodyEstimate, workoutEnergy, dailyEnergy, dailyTemplate, trainingAdvice } from '../training.js';
import { validFitness } from '../fitness.js';
const profile={goal:'health',weight:70,height:175,age:30,sex:'male',activity:'moderate',target:null};
const workout={id:'a',date:'2026-10-23',type:'cardio',exercise:'walking',minutes:30,intensity:'moderate',done:false,weight:70,details:'快走'};
test('Mifflin calculation uses body measurements, age, formula sex and activity without adding exercise',()=>{
 assert.deepEqual(bodyEstimate(profile),{resting:1649,maintenance:2556});
 assert.deepEqual(bodyEstimate({...profile,sex:'female'}),{resting:1483,maintenance:2298});
 assert.deepEqual(bodyEstimate({...profile,activity:null}),{resting:1649,maintenance:null});
 for(const change of [{age:null},{height:null},{sex:null},{weight:null},{age:17},{height:NaN},{activity:'toString'}]) assert.equal(bodyEstimate({...profile,...change}),null);
});
test('MET gross and net consumption use saved weight and preserve current-weight fallback',()=>{
 assert.deepEqual(workoutEnergy(workout,{weight:90}),{gross:140,net:103,met:3.8,weight:70,currentWeight:false});
 assert.equal(workoutEnergy({...workout,weight:null},{weight:null}),null);
 assert.equal(workoutEnergy({...workout,weight:null},{weight:60}).currentWeight,true);
 assert.equal(workoutEnergy({...workout,weight:70},{weight:90}).gross,140);
 assert.equal(workoutEnergy({...workout,minutes:60},profile).gross,279);
 assert.equal(workoutEnergy({...workout,type:'strength'},profile),null);
});
test('daily planned and completed expenditure remain separate and flag missing weight',()=>{
 assert.deepEqual(dailyEnergy([workout,{...workout,id:'b',done:true},{...workout,id:'c',weight:null}],{weight:null}),{planned:280,completed:140,netCompleted:103,unknown:1});
 assert.deepEqual(dailyEnergy([],profile),{planned:0,completed:0,netCompleted:0,unknown:0});
});
test('legacy profiles/workouts remain valid but new fields are validated',()=>{
 assert.equal(validFitness({profile:{goal:'health',weight:null,target:null},workouts:[{id:'old',date:'2026-10-23',type:'cardio',minutes:30,intensity:'moderate',done:false}]}),true);
 assert.equal(validBody({...profile,age:30.5}),false);
 assert.equal(validTraining({...workout,exercise:'jogging',type:'strength'}),false);
 assert.equal(validTraining({...workout,weight:0}),false);
 assert.equal(validTraining({...workout,details:'x'.repeat(1501)}),false);
});
test('templates include concrete content and recovery without automatic completion',()=>{
 const monday=dailyTemplate('2026-10-19',{goal:'muscle',experience:'beginner'});
 assert.equal(monday.type,'strength');assert.match(monday.details,/8–12 次/);assert.equal(monday.minutes,25);
 assert.equal(dailyTemplate('2026-10-20',{goal:'health',experience:'regular'}).minutes,40);
 assert.equal(dailyTemplate('2026-10-25',profile).type,'mobility');
 assert.equal(monday.done,undefined);
});
test('advice responds to data gaps, target, goal and training load',()=>{
 assert.match(trainingAdvice({...profile,target:1200,goal:'muscle'},[{...workout,type:'strength',minutes:90}]).join(' '),/低于估算静息代谢/);
 assert.match(trainingAdvice({...profile,target:1200,goal:'muscle'},[workout]).join(' '),/增肌/);
 assert.match(trainingAdvice({goal:'health',weight:null},[]).join(' '),/补充体重/);
});
