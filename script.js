/* Dovetail – мебельное ателье */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky header ---------- */

  var header = $('.header');
  if (header) {
    var headerTick = false;
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      headerTick = false;
    };
    window.addEventListener('scroll', function () {
      if (!headerTick) {
        headerTick = true;
        window.requestAnimationFrame(onScroll);
      }
    }, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu ---------- */

  var menuToggle = $('.menu-toggle');
  var menu = $('#menu');
  var menuTimer = null;

  function setMenu(open) {
    if (!menuToggle || !menu) return;
    window.clearTimeout(menuTimer);
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.documentElement.classList.toggle('menu-open', open);

    if (open) {
      menu.hidden = false;
      window.requestAnimationFrame(function () {
        menu.classList.add('is-open');
      });
    } else {
      menu.classList.remove('is-open');
      menuTimer = window.setTimeout(function () {
        if (!menu.classList.contains('is-open')) menu.hidden = true;
      }, reduceMotion ? 0 : 520);
    }
  }

  if (menuToggle && menu) {
    menuToggle.addEventListener('click', function () {
      setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', menu).forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        setMenu(false);
        menuToggle.focus();
      }
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* ---------- Scroll reveals ---------- */

  var revealItems = $$('.rv');
  if (revealItems.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      revealItems.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  /* ---------- Tagline: word by word ---------- */

  var tagline = $('[data-words]');
  if (tagline) {
    var words = tagline.textContent.trim().split(/\s+/);
    tagline.textContent = '';
    words.forEach(function (word, i) {
      var span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      tagline.appendChild(span);
      if (i < words.length - 1) tagline.appendChild(document.createTextNode(' '));
    });

    if (!reduceMotion) {
      var wordEls = $$('.w', tagline);
      var wordTick = false;
      var paintWords = function () {
        var line = window.innerHeight * 0.84;
        wordEls.forEach(function (el) {
          if (el.getBoundingClientRect().top < line) el.classList.add('is-on');
        });
        wordTick = false;
      };
      var requestWords = function () {
        if (!wordTick) {
          wordTick = true;
          window.requestAnimationFrame(paintWords);
        }
      };
      window.addEventListener('scroll', requestWords, { passive: true });
      window.addEventListener('resize', requestWords);
      paintWords();
    }
  }

  /* ---------- Directions ---------- */

  var dir = $('.dir');
  if (dir) {
    var rows = $$('.dir-row', dir);
    var stageImgs = $$('.dir-stage img', dir);
    var canHover = window.matchMedia('(hover: hover)').matches;

    var activate = function (index) {
      rows.forEach(function (row, i) { row.classList.toggle('is-active', i === index); });
      stageImgs.forEach(function (img, i) { img.classList.toggle('is-active', i === index); });
    };

    rows.forEach(function (row, index) {
      row.addEventListener('mouseenter', function () {
        if (canHover) activate(index);
      });
      row.addEventListener('focus', function () { activate(index); });
      row.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        activate(index);
      });
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate(index);
        }
      });
    });
  }

  /* ---------- Quiz ---------- */

  var quiz = $('#quiz-form');
  if (quiz) {
    var steps = $$('.qs', quiz);
    var bars = $$('.quiz-bar i', quiz);
    var stepLabel = $('#quiz-step-label', quiz);
    var backBtn = $('#quiz-back', quiz);
    var nextBtn = $('#quiz-next', quiz);
    var submitBtn = $('#quiz-submit', quiz);
    var quizTop = $('.quiz-top', quiz);
    var quizNav = $('.quiz-nav', quiz);
    var quizDone = $('.quiz-done', quiz);
    var quizError = $('.quiz-error', quiz);
    var shapeWrap = $('#shape-opts', quiz);
    var summaryList = $('#quiz-summary', quiz);
    var resetBtn = $('#quiz-reset', quiz);
    var step = 1;

    var shapes = {
      'Кухня': ['Прямая', 'Угловая', 'П-образная', 'С островом'],
      'Шкаф или гардеробная': ['Встроенный в нишу', 'На всю стену', 'Гардеробная комната', 'Угловой'],
      'Мебель для ванной': ['Тумба под раковину', 'Тумба и пенал', 'Стеновые панели', 'Всё вместе'],
      'Другая мебель': ['Консоль или стеллаж', 'Кровать или изголовье', 'Мебель на металлокаркасе', 'Другое']
    };

    function checked(name) {
      return quiz.querySelector('input[name="' + name + '"]:checked');
    }

    function buildShapes() {
      if (!shapeWrap) return;
      var type = checked('type');
      var list = (type && shapes[type.value]) || shapes['Кухня'];
      shapeWrap.textContent = '';
      list.forEach(function (value) {
        var label = document.createElement('label');
        label.className = 'opt';
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'shape';
        input.value = value;
        var text = document.createElement('span');
        text.textContent = value;
        label.appendChild(input);
        label.appendChild(text);
        shapeWrap.appendChild(label);
      });
    }

    function stepReady(n) {
      if (n === 1) return !!checked('type');
      if (n === 2) return !!checked('shape');
      if (n === 3) return !!checked('material');
      return true;
    }

    function render() {
      steps.forEach(function (field) {
        field.hidden = Number(field.dataset.step) !== step;
      });
      bars.forEach(function (bar, i) {
        bar.classList.toggle('is-on', i < step);
      });
      if (stepLabel) stepLabel.textContent = 'Шаг ' + step + ' из 4';
      if (backBtn) backBtn.hidden = step === 1;
      if (nextBtn) {
        nextBtn.hidden = step === 4;
        nextBtn.disabled = !stepReady(step);
      }
      if (submitBtn) submitBtn.hidden = step !== 4;
      if (quizError) quizError.hidden = true;

      var current = steps[step - 1];
      if (current) {
        var focusable = current.querySelector('input:not([type="hidden"])');
        if (focusable && step !== 4 && !reduceMotion) {
          // не перехватываем фокус при первом рендере
        }
      }
    }

    function phoneValid(value) {
      var digits = String(value || '').replace(/\D/g, '');
      return digits.length >= 9 && digits.length <= 13;
    }

    function setFieldError(input, message) {
      var field = input.closest('.field');
      if (!field) return;
      var error = $('.field-error', field);
      field.classList.toggle('has-error', !!message);
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (error) error.textContent = message || '';
    }

    if (shapeWrap) buildShapes();
    render();

    quiz.addEventListener('change', function (e) {
      if (e.target.name === 'type') buildShapes();
      if (e.target.name === 'phone') setFieldError(e.target, '');
      render();
    });

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (!stepReady(step)) return;
        if (step < 4) {
          step += 1;
          render();
          var field = steps[step - 1];
          if (field && !reduceMotion) {
            field.animate(
              [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
              { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' }
            );
          }
          var first = field && field.querySelector('input');
          if (first && window.matchMedia('(min-width: 768px)').matches) first.focus({ preventScroll: true });
        }
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (step > 1) {
          step -= 1;
          render();
        }
      });
    }

    quiz.addEventListener('submit', function (e) {
      e.preventDefault();
      var phone = quiz.querySelector('input[name="phone"]');
      if (!phone || !phoneValid(phone.value)) {
        if (phone) {
          setFieldError(phone, 'Укажите номер, например +375 29 336-05-50');
          phone.focus();
        }
        return;
      }
      setFieldError(phone, '');

      if (summaryList) {
        var rowsData = [
          ['Что нужно', checked('type') ? checked('type').value : ''],
          ['Форма', checked('shape') ? checked('shape').value : ''],
          ['Материал', checked('material') ? checked('material').value : '']
        ];
        var lengthInput = quiz.querySelector('input[name="length"]');
        if (lengthInput && lengthInput.value.trim()) {
          rowsData.push(['Длина стены', lengthInput.value.trim() + ' м']);
        }
        summaryList.textContent = '';
        rowsData.forEach(function (pair) {
          if (!pair[1]) return;
          var wrap = document.createElement('div');
          var dt = document.createElement('dt');
          var dd = document.createElement('dd');
          dt.textContent = pair[0];
          dd.textContent = pair[1];
          wrap.appendChild(dt);
          wrap.appendChild(dd);
          summaryList.appendChild(wrap);
        });
      }

      steps.forEach(function (field) { field.hidden = true; });
      if (quizTop) quizTop.hidden = true;
      if (quizNav) quizNav.hidden = true;
      if (quizError) quizError.hidden = true;
      if (quizDone) quizDone.hidden = false;
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        quiz.reset();
        step = 1;
        buildShapes();
        if (quizDone) quizDone.hidden = true;
        if (quizTop) quizTop.hidden = false;
        if (quizNav) quizNav.hidden = false;
        if (summaryList) summaryList.textContent = '';
        render();
      });
    }
  }

  /* ---------- Consult form ---------- */

  var consult = $('#consult');
  if (consult) {
    var consultDone = $('.consult-done', consult);
    var consultBtn = consult.querySelector('button[type="submit"]');
    var consultFields = $('.consult-fields', consult);

    function consultValid() {
      var name = consult.querySelector('input[name="name"]');
      var phone = consult.querySelector('input[name="phone"]');
      var ok = true;
      [name, phone].forEach(function (input) {
        if (!input) return;
        var field = input.closest('.field');
        var error = field ? $('.field-error', field) : null;
        var message = '';
        if (input === name && input.value.trim().length < 2) message = 'Как к вам обращаться?';
        if (input === phone && !/^\D*\d(?:\D*\d){8,12}\D*$/.test(input.value)) {
          message = 'Укажите номер, например +375 29 336-05-50';
        }
        if (field) field.classList.toggle('has-error', !!message);
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
        if (error) error.textContent = message;
        if (message) ok = false;
      });
      return ok;
    }

    consult.addEventListener('input', function (e) {
      if (e.target.name === 'name' || e.target.name === 'phone') {
        var field = e.target.closest('.field');
        if (field) field.classList.remove('has-error');
        e.target.setAttribute('aria-invalid', 'false');
      }
    });

    consult.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!consultValid()) {
        var invalid = consult.querySelector('.field.has-error input');
        if (invalid) invalid.focus();
        return;
      }
      if (consultFields) consultFields.hidden = true;
      if (consultBtn) consultBtn.hidden = true;
      if (consultDone) {
        consultDone.hidden = false;
        var heading = consultDone.querySelector('.heading-4');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
        }
      }
    });
  }

  /* ---------- Gallery lightbox ---------- */

  var lb = $('#lb');
  if (lb && typeof lb.showModal === 'function') {
    var items = $$('.g-item');
    var lbImg = $('#lb-img');
    var lbCap = $('#lb-cap');
    var lbPrev = $('.lb-prev', lb);
    var lbNext = $('.lb-next', lb);
    var lbClose = $('.lb-close', lb);
    var current = 0;
    var lastFocus = null;

    function paintSlide() {
      var source = items[current] && items[current].querySelector('img');
      if (!source || !lbImg) return;
      lbImg.src = source.currentSrc || source.src;
      lbImg.alt = source.alt || '';
      if (lbCap) lbCap.textContent = source.alt || '';
    }

    function openSlide(index) {
      current = (index + items.length) % items.length;
      paintSlide();
      lastFocus = document.activeElement;
      if (!lb.open) lb.showModal();
      document.documentElement.classList.add('lb-open');
    }

    function stepSlide(delta) {
      current = (current + delta + items.length) % items.length;
      paintSlide();
    }

    items.forEach(function (item, index) {
      item.addEventListener('click', function () { openSlide(index); });
    });

    if (lbPrev) lbPrev.addEventListener('click', function () { stepSlide(-1); });
    if (lbNext) lbNext.addEventListener('click', function () { stepSlide(1); });
    if (lbClose) lbClose.addEventListener('click', function () { lb.close(); });

    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepSlide(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); stepSlide(1); }
    });

    lb.addEventListener('click', function (e) {
      if (e.target === lb) lb.close();
    });

    lb.addEventListener('close', function () {
      document.documentElement.classList.remove('lb-open');
      if (lbImg) lbImg.removeAttribute('src');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    });
  }

  /* ---------- Scrollspy ---------- */

  var navLinks = $$('.nav a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var sections = navLinks
      .map(function (link) { return document.getElementById(link.getAttribute('href').slice(1)); })
      .filter(Boolean);

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          var isCurrent = link.getAttribute('href') === '#' + entry.target.id;
          if (isCurrent) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { spy.observe(section); });
  }
})();
