// ==UserScript==
// @name         NewtonApp
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Redefine the grecaptcha.enterprise.execute function
// @author       You
// @match        https://newton.xyz/app/login*
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';
    //https://yescaptcha.com/  这里填写 yescaptcha 的clientKey
    const clientKey="这里填写 yescaptcha 的clientKey";
    // 目标参数：
    const websiteKey = "6LeBJSorAAAAANtx8m0ODNOD95sNK-SnuvnJPybI";
    const websiteURL = "https://newton.xyz/app/login";
    // 验证码类型：
    const taskType = "RecaptchaV3TaskProxylessM1S7";
    const pageAction = "email_login_v2";

    async function createTask() {
  try {
    const url = "https://api.yescaptcha.com/createTask";
    const data = {
      clientKey: clientKey,
      task: {
        websiteURL: websiteURL,
        websiteKey: websiteKey,
        pageAction:pageAction,
        type: taskType
      }
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      agent: false,
      rejectUnauthorized: false
    });
    const result = await response.json();
    const taskId = result.taskId;
    if (taskId) {
      return taskId;
    } else {
      console.log(result);
    }
  } catch (error) {
    console.log(error);
  }
}
async function getResponse(taskID) {
  let times = 0;
  while (times < 120) {
    try {
      const url = "https://api.yescaptcha.com/getTaskResult";
      const data = {
        clientKey: clientKey,
        taskId: taskID
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        agent: false,
        rejectUnauthorized: false
      });
      const result = await response.json();
      const solution = result.solution;
      if (solution) {
        const response = solution.gRecaptchaResponse;
        if (response) {
          return response;
        }
      } else {
        console.log(result);
      }
    } catch (error) {
      console.log(error);
    }
    times += 3;
    await new Promise(resolve => setTimeout(resolve, 3000)); // 等待3秒钟
  }
}

    // 函数来检测grecaptcha.enterprise.execute是否存在
    function redefineGrecaptcha() {
        if (typeof grecaptcha !== 'undefined' && grecaptcha.enterprise && typeof grecaptcha.enterprise.execute === 'function') {
            // 保存原始的grecaptcha.enterprise.execute函数
            const originalExecute = grecaptcha.enterprise.execute;
            // 重定义grecaptcha.enterprise.execute函数
            grecaptcha.enterprise.execute =async function(...args) {
                console.log('grecaptcha.enterprise.execute被调用', args);
                const taskId = await createTask();
                 if (taskId) {
                     const response = await getResponse(taskId);
                     return response;
                 }else{
                     return originalExecute.apply(this, args);
                 }
            };
        } else {
            // 如果未定义，则稍后重试
            setTimeout(redefineGrecaptcha, 100);
        }
    }

    // 启动检测
    redefineGrecaptcha();
})();
