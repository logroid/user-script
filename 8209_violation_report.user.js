// ==UserScript==
// @name         ヤフオク! 違反通報
// @namespace    https://logroid.blogspot.com/
// @version      20200305.2348
// @description  ヤフオク! で違反通報をサポートするスクリプト
// @author       logroid
// @match        https://auctions.yahoo.co.jp/*
// @match        https://page.auctions.yahoo.co.jp/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @run-at       document-end
// @updateURL    https://logroid.github.io/user-script/8209_violation_report.user.js
// @downloadURL  https://logroid.github.io/user-script/8209_violation_report.user.js
// ==/UserScript==

(function() {
  'use strict';
  var pathname = window.location.pathname;
  var limit = 86400000 * 8;
  var key = 'violation';
  var violation = {};

  function load() {
    var v = JSON.parse(GM_getValue(key, '{}'));
    var vv = {};
    var now = new Date().getTime();
    Object.keys(v).forEach(k => {
      var ts = v[k];
      if (ts + limit > now) {
        vv[k] = ts;
      }
    });
    violation = vv;
  }
  function save() {
    GM_setValue(key, JSON.stringify(violation));
  }
  load();
  if (window.location.host == 'page.auctions.yahoo.co.jp') {
    var $vr = $('a:contains("違反商品の申告")').clone(true);
    $vr.addClass('violation-report');
    $('#ProductTitle').append($vr);
    GM_addStyle(
      '.violation-report{ display: block; text-align: center; border-radius: 10px; border: 1px solid red; padding: 10px; color: white !important; background: red; }'
    );
    if (window.location.href.match(/\/auction\/(\w+)$/)) {
      var aid = RegExp.$1;
      if (violation[aid] != undefined) {
        GM_addStyle(
          '#ProductTitle:before{ content: "🚨通報済み"; display: block; font-size: 30px; text-align: center; }'
        );
      }
    }
  } else {
    switch (pathname) {
      case '/search/search':
        var aids = Object.keys(violation);
        GM_addStyle(
          aids
            .map(id => {
              return 'a[href$="/jp/auction/' + id + '"]';
            })
            .join(',') + '{ font-weight:bold; color:red !important; }'
        );
        GM_addStyle(
          aids
            .map(id => {
              return 'a[href$="/jp/auction/' + id + '"]:before';
            })
            .join(',') +
            '{ content: "🚨"; display: inline-block; font-size: 30px; }'
        );
        break;
      case '/jp/config/violation_report':
        var href = $(
          'a:contains("商品ページに戻る"), a:contains("商品詳細ページに戻る")'
        ).attr('href');
        if (href.match(/\/auction\/(\w+)$/)) {
          var aid = RegExp.$1;
          violation[aid] = new Date().getTime();
          save();
        }
        break;
      case '/jp/show/violation_report':
        $('html,body').animate({
          scrollTop: $('form[action$="/config/violation_report"]').offset().top
        });
        $('input[name="violation_code"][value="other"]').prop('checked', true);
        $('select[name="other_violation_code"]').val('1003');
        GM_addStyle(
          'input[type="submit"][value="送信"] {padding: 10px 30px;,margin: 0 30px;}'
        );
        break;
    }
  }
})();
