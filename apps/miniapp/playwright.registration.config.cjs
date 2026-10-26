const base=require('./playwright.config.cjs');
module.exports={...base,testIgnore:[],testMatch:'registration.spec.cjs',use:{...base.use,baseURL:'http://127.0.0.1:3101'},webServer:{...base.webServer,command:'pnpm start --hostname 127.0.0.1 --port 3101',url:'http://127.0.0.1:3101',env:{PHONE_REGISTRATION_ENABLED:'true',DATABASE_URL:'postgresql://unused-test-only',PHONE_DATA_KEY:'ab'.repeat(32)}}};
