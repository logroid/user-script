// ==UserScript==
// @name         Mask Prime Video
// @namespace    https://logroid.blogspot.com/
// @version      20210915.1200
// @description  プライムビデオの特定のコンテンツを非表示にする
// @author       logroid
// @match        https://www.amazon.co.jp/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// @updateURL    https://logroid.github.io/user-script/Mask_Prime_Video.user.js
// @downloadURL  https://logroid.github.io/user-script/Mask_Prime_Video.user.js
// ==/UserScript==

(() => {
  'use strict';
  const maskNameList = ['ザ・マスクド・シンガー'];
  const maskIdList = ['B09B8NL1JK', 'B09B8XLHW3'];

  const maskNameListSelector = maskNameList.map(v => { return 'a[aria-label*="' + v + '"], img[alt*="' + v + '"]' })
  const maskIdListSelector = maskIdList.map(v => { return 'a[href*="/video/detail/' + v + '/"], a[href*="/dp/' + v + '/"]' })
  GM_addStyle(maskNameListSelector.join(",") + "{ display:none !important; }\n" + maskIdListSelector.join(",") + "{ display:none !important; }\n");
})();
