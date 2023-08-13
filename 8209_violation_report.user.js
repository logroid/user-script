// ==UserScript==
// @name         ヤフオク! 違反通報
// @namespace    https://logroid.blogspot.com/
// @version      20230813.2236
// @description  ヤフオク! で違反通報をサポートするスクリプト
// @author       logroid
// @match        https://auctions.yahoo.co.jp/*
// @match        https://page.auctions.yahoo.co.jp/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_openInTab
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @run-at       document-end
// @updateURL    https://logroid.github.io/user-script/8209_violation_report.user.js
// @downloadURL  https://logroid.github.io/user-script/8209_violation_report.user.js
// @homepage     https://logroid.blogspot.com/2020/03/8209violationreport.html
// ==/UserScript==

(function() {
  'use strict';

  // 違反通報クラス
  class ViolationReport {
    constructor() {
      this.limit = 86400000 * 8;
      this.key = 'violation';
      this.violation = {};
      this.load();
      this.addReportedCss();
      this.handlePage();
    }

    // 違反情報のロード
    load() {
      const v = JSON.parse(GM_getValue(this.key, '{}'));
      const now = new Date().getTime();
      this.violation = Object.keys(v).reduce((acc, k) => {
        const ts = v[k];
        if (ts + this.limit > now) {
          acc[k] = ts;
        }
        return acc;
      }, {});
    }

    // 違反情報の保存
    save() {
      GM_setValue(this.key, JSON.stringify(this.violation));
      this.addReportedCss();
    }

    // 違反通報済みのCSS追加
    addReportedCss() {
      const aids = Object.keys(this.violation);
      const createStyle = (selector, style) => {
        return aids.map(id => selector + id + style).join(',');
      };

      GM_addStyle(createStyle('a[href$="/jp/auction/', '"]{ font-weight:bold; color:red !important; }'));
      GM_addStyle(createStyle('a[href$="/jp/auction/', '"]:before{ content: "🚨"; display: inline-block; font-size: 30px; }'));
      GM_addStyle(createStyle('.Products__list a[href$="/jp/auction/', '"]:before{ content: "🚨"; display: inline-block; font-size: 50px; margin-top: -70px; position: absolute; }'));
    }

    // ページごとの処理
    handlePage() {
      const pathname = window.location.pathname;
      if (window.location.host === 'page.auctions.yahoo.co.jp') {
        this.handleProductPage(pathname);
      } else if (/^\/seller\//.test(pathname)) {
        this.handleSellerPage();
      } else {
        this.handleOtherPages(pathname);
      }
    }

    // 商品ページの処理
    handleProductPage(pathname) {
      const $vr = $('a:contains("違反商品の申告")').clone(true);
      $vr.addClass('violation-report');
      $('.l-contentsHead').append($vr);
      GM_addStyle('.violation-report{ display: block; text-align: center; border-radius: 10px; border: 1px solid red; padding: 10px; color: white !important; background: red; }');

      if (/^\/jp\/auction\/(\w+)$/.test(pathname)) {
        const aid = RegExp.$1;
        if (this.violation[aid] !== undefined) {
          GM_addStyle('.l-contentsHead:before{ content: "🚨通報済み"; display: block; font-size: 30px; text-align: center; }');
        }
      }
    }

    // 販売者ページの処理
    handleSellerPage() {
      let count = 0;
      const $header = $('.Options__items');
      $('ul.Products__items li').each((i, li) => {
        const $li = $(li);
        const $a = $li.find('.Product__title>a[href*="/jp/auction/"]');
        if ($a.length > 0) {
          $li.find('.Product__priceInfo').append(
            $('<label class="seller-checkbox">')
              .text('🚨')
              .append($('<input type="checkbox">').val($a.attr('href')))
          );
          count++;
        }
      });

      if (count > 0) {
        this.addBulkCheckOption($header);
        this.addBulkReportButton();
      }
    }

    // 一括チェックオプションの追加
    addBulkCheckOption($header) {
      if ($header !== null) {
        const $allCheck = $('<label>')
          .text('🚨一括チェック')
          .append($('<input type="checkbox">'));
        $allCheck.click(e => {
          const $target = $(e.target);
          $('.seller-checkbox input[type="checkbox"]')
            .prop('checked', $target.prop('checked'))
            .change();
        });
        $header.append($('<li>').append($allCheck));
      }

      GM_addStyle('.seller-checkbox input{ margin-left: 10px;  transform: scale(2); } .seller-checkbox { font-size: 20px }' +
        '.violation_report_all{position: fixed;right: 10px;margin-top: 70px;top: 100px;}' +
        '.violation_report_all button{font-size: 30px;}' +
        'li.Product[violation_report="true"]{background-color: #ffbcbc;}');

      $('.seller-checkbox input[type="checkbox"]').on('click change', e => {
        const $target = $(e.target),
          $parent = $target.closest('li.Product');
        $parent.attr('violation_report', $target.prop('checked'));
      });
    }

    // 一括通報ボタンの追加
    addBulkReportButton() {
      const $button = $('<button>').text('🚨一括通報');
      $button.click(() => {
        $('.Products__list input[type="checkbox"]:checked').each((i_, chk) => {
          const $chk = $(chk);
          if ($chk.val().match(/\/auction\/(\w+)$/)) {
            const aid = RegExp.$1;
            GM_openInTab('https://auctions.yahoo.co.jp/jp/show/violation_report?aID=' + aid, { insert: true });
          }
        });
      });
      $(document.body).append($('<div>').addClass('violation_report_all').append($button));
    }

    // その他のページの処理
    handleOtherPages(pathname) {
      switch (pathname) {
        case '/jp/config/violation_report':
          this.handleReportConfirmationPage();
          break;
        case '/jp/show/violation_report':
          this.handleReportPage();
          break;
      }
    }

    // 通報確認ページの処理
    handleReportConfirmationPage() {
      const href = $('a:contains("商品ページに戻る"), a:contains("商品詳細ページに戻る")').attr('href');
      if (href.match(/\/auction\/(\w+)$/)) {
        const aid = RegExp.$1;
        this.violation[aid] = new Date().getTime();
        this.save();
      }
    }

    // 通報ページの処理
    handleReportPage() {
      $('html,body').animate({
        scrollTop: $('form[action$="/config/violation_report"]').offset().top
      });
      $('input[name="violation_code"][value="other"]').prop('checked', true);
      const $sel = $('select[name="other_violation_code"]');
      if ($sel.find('option[value="1003"]').length > 0) {
        $sel.val('1003');
      } else if ($sel.find('option[value="2013"]').length > 0) {
        $sel.val('2013');
      }
      GM_addStyle('input[type="submit"][value="送信"] {padding: 10px 30px;margin: 0 30px;}');
    }
  }

  // 違反通報クラスのインスタンス化
  new ViolationReport();
})();
