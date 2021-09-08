const Parser = require("acorn");

//require('acorn-es7-plugin')(Parser);


function validate(code) {
    let v = false;
    try {
        v = (Parser.parse(code, {ecmaVersion: "latest", allowReturnOutsideFunction: true}));
    } catch (e) {
        console.log(e);
    }
    return v;
}

import {expect} from 'chai';

describe('Utils', () => {

    it('should validate basic code', () => {

        //expect(validate('return 1 + "')).equal(false);
        expect(validate('return 1 + 2')).not.equal(false);

    });

    it('should validate anonymous return', () => {

        //expect(validate('return 1 + "')).equal(false);
        expect(validate(`(()=>{training_data = [
  [[0,0],[0]],
  [[1,0],[1]],
  [[0,1],[1]],
  [[1,1],[0]]
];

return training_data;})();`)).not.equal(false);

    });

    it('should validate es5', () => {

        expect(validate(`class Err {
constructor(name){
this.name=name;
}
}`)).not.equal(false);
        //expect(validate('return 1 + 2')).not.equal(false);

    });

    it('should validate es7 async promise', () => {
        expect(validate(`async function f(){
    return new Promise((a)=>{
        setTimeout(()=>{ a('YES') },2000);
    });
}`)).not.equal(false);
    });

    it('should validate es7 async await promise', () => {


        expect(validate(`async function f(){
    return new Promise((a)=>{
        setTimeout(()=>{ a('YES') },2000);
    });
    let v = await f();
}


return v;`)).not.equal(false);
    });

    it('should validate es7 async promise resolve', () => {


        expect(validate(`class A {
    m = async () => {
        return await Promise.resolve();
    };
}`)).not.equal(false);

    });

    it('should validate es7 resolve', () => {

let escaped = `function resolveAfter2Seconds() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('resolved');
    }, 2000);
  });
}

async function asyncCall() {
  console.log('calling');
  const result = await resolveAfter2Seconds();
  console.log(result);
}

asyncCall();
`;
       let code = `const _____ = async function (){ ${escaped} }; return _____();`
        expect(validate(code)).not.equal(false);

    });


});
