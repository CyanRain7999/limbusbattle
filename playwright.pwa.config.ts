import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/pwa',timeout:45000,workers:1,reporter:'list',
  use:{baseURL:'http://127.0.0.1:4174/limbusbattle/',viewport:{width:844,height:390},hasTouch:true,isMobile:true,
    launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE},screenshot:'only-on-failure'},
  webServer:{command:'npm run preview -- --port 4174 --strictPort --base /limbusbattle/',url:'http://127.0.0.1:4174/limbusbattle/',reuseExistingServer:false,timeout:30000}
});
