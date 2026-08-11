(() => {
  const body = document.body;
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress span');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const toast = document.querySelector('.toast');
  const questionDrawer = document.getElementById('question-drawer');
  const questionOverlay = document.querySelector('.question-overlay');
  const questionOpeners = document.querySelectorAll('.js-open-question');
  const questionClosers = document.querySelectorAll('.js-question-close');

  requestAnimationFrame(() => body.classList.add('loaded'));

  // v30 mobile first-screen intro. The initial state is set in <head> before
  // the first paint. We wait for two painted frames, then animate exactly the
  // five approved elements: title, lead, two hero buttons and "Есть вопрос?".
  const playMobileIntro = () => {
    const root = document.documentElement;
    const mobile = window.matchMedia && window.matchMedia('(max-width: 760px)').matches;
    if (!mobile || !root.classList.contains('mobile-intro-prep')) {
      root.classList.remove('mobile-intro-prep');
      return;
    }

    const targets = [
      { el: document.querySelector('.hero-content h1'), y: 38, scale: .975, delay: 0 },
      { el: document.querySelector('.hero-content .hero-lead'), y: 30, scale: 1, delay: 110 },
      { el: document.querySelector('.hero-content .hero-cta .btn:nth-child(1)'), y: 22, scale: 1, delay: 220 },
      { el: document.querySelector('.hero-content .hero-cta .btn:nth-child(2)'), y: 22, scale: 1, delay: 310 },
      { el: document.querySelector('.question-fab'), y: 22, scale: 1, delay: 400 }
    ].filter(item => item.el);

    const start = () => {
      const animations = targets.map(({ el, y, scale, delay }) => el.animate([
        { opacity: 0, transform: `translate3d(0, ${y}px, 0) scale(${scale})` },
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' }
      ], {
        duration: 720,
        delay,
        easing: 'cubic-bezier(.16,1,.3,1)',
        fill: 'both'
      }));

      // WAAPI owns the start state now, so removing the prep class cannot flash.
      root.classList.remove('mobile-intro-prep');

      Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
        animations.forEach(animation => animation.cancel());
      });
    };

    // Safari can execute JS before its first visible frame. Two rAFs plus a
    // small delay guarantee a visible starting frame before playback begins.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(start, 90);
      });
    });

    // Safety: never leave requested content hidden if animations are unavailable.
    window.setTimeout(() => root.classList.remove('mobile-intro-prep'), 1800);
  };

  playMobileIntro();

  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (progress) {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progress.style.width = `${Math.min(100, (y / max) * 100)}%`;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.classList.toggle('active', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileMenu.classList.toggle('open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    if (!body.classList.contains('question-open')) {
      body.style.overflow = open ? 'hidden' : '';
    }
  };

  const setQuestionDrawer = (open) => {
    if (!questionDrawer || !questionOverlay) return;
    questionOpeners.forEach(btn => btn.setAttribute("aria-expanded", String(open)));
    body.classList.toggle("question-open", open);

    if (open) {
      setMenu(false);
      questionOverlay.hidden = false;
      requestAnimationFrame(() => {
        questionOverlay.classList.add("open");
        questionDrawer.classList.add("open");
        questionDrawer.setAttribute("aria-hidden", "false");
      });
      body.style.overflow = "hidden";
      questionDrawer.scrollTo({ top: 0, behavior: 'auto' });
      setTimeout(() => questionDrawer.querySelector("textarea, input")?.focus({ preventScroll: true }), 280);
      return;
    }

    questionOverlay.classList.remove("open");
    questionDrawer.classList.remove("open");
    questionDrawer.setAttribute("aria-hidden", "true");
    body.style.overflow = "";
    setTimeout(() => {
      if (!questionDrawer.classList.contains("open")) questionOverlay.hidden = true;
    }, 420);
  };

  menuToggle?.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  questionOpeners.forEach(btn => {
    btn.addEventListener('click', () => setQuestionDrawer(true));
  });
  questionClosers.forEach(btn => {
    btn.addEventListener('click', () => setQuestionDrawer(false));
  });
  questionOverlay?.addEventListener('click', () => setQuestionDrawer(false));

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      setMenu(false);
      setQuestionDrawer(false);
    }
  });

  const revealItems = [...document.querySelectorAll('.reveal')];
  const revealModes = ['reveal-left', 'reveal-focus', 'reveal-right'];
  revealItems.forEach((el, index) => {
    el.classList.add(revealModes[index % revealModes.length]);
    const previous = revealItems[index - 1];
    const sameGroup = previous && previous.parentElement === el.parentElement;
    el.style.setProperty('--reveal-delay', sameGroup ? `${Math.min(240, (index % 4) * 70)}ms` : '0ms');
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
  revealItems.forEach(el => observer.observe(el));

  const scrollToForm = () => {
    const target = document.getElementById('parts-form');
    if (!target) return;
    const headerOffset = (header?.offsetHeight || 88) + 6;
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.history.replaceState(null, '', '#request');
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  document.querySelectorAll('[data-scroll-to-form]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToForm();
    });
  });

  const tabs = [...document.querySelectorAll('.request-tab')];
  const panels = [...document.querySelectorAll('[data-form-panel]')];
  const tabsWrap = document.querySelector('.request-tabs');
  const requestShell = document.querySelector('.request-shell');

  const updateTabIndicator = (activeTab) => {
    if (!tabsWrap || !activeTab) return;
    const activeIndex = Math.max(0, tabs.indexOf(activeTab));
    tabsWrap.dataset.active = String(activeIndex);
  };

  const syncRequestShellHeight = () => {
    if (!requestShell || !tabsWrap || !panels.length) return;
    let maxPanelHeight = 0;
    panels.forEach(panel => {
      const wasHidden = panel.hidden;
      const prev = {
        position: panel.style.position,
        visibility: panel.style.visibility,
        pointerEvents: panel.style.pointerEvents,
        inset: panel.style.inset,
        display: panel.style.display
      };
      if (wasHidden) {
        panel.hidden = false;
        panel.style.position = 'absolute';
        panel.style.visibility = 'hidden';
        panel.style.pointerEvents = 'none';
        panel.style.inset = '0';
        panel.style.display = 'block';
      }
      maxPanelHeight = Math.max(maxPanelHeight, panel.offsetHeight);
      if (wasHidden) {
        panel.hidden = true;
        panel.style.position = prev.position;
        panel.style.visibility = prev.visibility;
        panel.style.pointerEvents = prev.pointerEvents;
        panel.style.inset = prev.inset;
        panel.style.display = prev.display;
      }
    });
    requestShell.style.setProperty('--request-shell-min-height', `${tabsWrap.offsetHeight + maxPanelHeight}px`);
  };

  const holdViewport = (lockedY, duration = 820) => {
    const started = performance.now();
    const html = document.documentElement;
    const oldBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';

    const keep = (now) => {
      window.scrollTo(0, lockedY);
      if (now - started < duration) {
        requestAnimationFrame(keep);
      } else {
        window.scrollTo(0, lockedY);
        html.style.scrollBehavior = oldBehavior;
      }
    };
    requestAnimationFrame(keep);
  };

  updateTabIndicator(document.querySelector('.request-tab.active') || tabs[0]);
  syncRequestShellHeight();
  window.addEventListener('resize', syncRequestShellHeight);

  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      if (tab.classList.contains('active')) return;

      const lockedY = window.scrollY;
      const key = tab.dataset.form;

      tabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      updateTabIndicator(tab);

      panels.forEach(panel => {
        const active = panel.dataset.formPanel === key;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
      });

      syncRequestShellHeight();
      // Lock the viewport through the whole tab/form transition so the page cannot jump.
      window.scrollTo({ top: lockedY, behavior: 'auto' });
      holdViewport(lockedY, 1100);
      tab.blur();
    });
  });

  let toastTimer;
  const showToast = (text) => {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  };

  const isMobile = () => window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  document.querySelectorAll('.js-phone').forEach(link => {
    link.addEventListener('click', async (e) => {
      if (isMobile()) return;
      e.preventDefault();
      const text = link.dataset.copy || link.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        const tmp = document.createElement('textarea');
        tmp.value = text;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        tmp.remove();
      }
      showToast('Номер скопирован');
    });
  });

  const errorContainer = (field) => field.closest('.fuel') || field.closest('label');

  const clearFieldError = (field) => {
    const container = errorContainer(field);
    if (!container) return;
    container.classList.remove('has-error');
    container.querySelector('.validation-message')?.remove();
  };

  const validationText = (field) => {
    if (field.validity.valueMissing) return 'Заполните это поле';
    if (field.validity.typeMismatch) return 'Введите корректный e-mail';
    if (field.validity.tooShort) return `Введите не менее ${field.minLength} символов`;
    if (field.validity.patternMismatch) return field.name === 'check' ? 'Проверьте ответ' : 'Проверьте введённое значение';
    return 'Проверьте введённые данные';
  };

  const markFieldError = (field) => {
    const container = errorContainer(field);
    if (!container) return;
    clearFieldError(field);
    container.classList.add('has-error');
    const message = document.createElement('span');
    message.className = 'validation-message';
    message.textContent = validationText(field);
    container.appendChild(message);
  };

  const firstInvalidField = (form) => {
    const fields = [...form.querySelectorAll('input, textarea, select')].filter(field => !field.disabled && field.type !== 'hidden');
    const seenRadioGroups = new Set();
    for (const field of fields) {
      if (field.type === 'radio') {
        if (seenRadioGroups.has(field.name)) continue;
        seenRadioGroups.add(field.name);
        const group = fields.filter(item => item.type === 'radio' && item.name === field.name);
        if (field.required && !group.some(item => item.checked)) return field;
        continue;
      }
      if (!field.checkValidity()) return field;
    }
    return null;
  };

  const revealInvalidField = (form) => {
    form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    form.querySelectorAll('.validation-message').forEach(el => el.remove());
    const field = firstInvalidField(form);
    if (!field) return false;
    markFieldError(field);
    const target = errorContainer(field) || field;
    const drawer = form.closest('.question-drawer');
    if (drawer) {
      const drawerTop = target.getBoundingClientRect().top - drawer.getBoundingClientRect().top + drawer.scrollTop - 22;
      drawer.scrollTo({ top: Math.max(0, drawerTop), behavior: 'smooth' });
      window.setTimeout(() => {
        try { field.focus({ preventScroll: true }); } catch (_) { field.focus(); }
      }, 350);
      return true;
    }
    const headerOffset = (header?.offsetHeight || 88) + 18;
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.setTimeout(() => {
      try { field.focus({ preventScroll: true }); } catch (_) { field.focus(); }
    }, 420);
    return true;
  };

  document.querySelectorAll('form input, form textarea, form select').forEach(field => {
    const clear = () => clearFieldError(field);
    field.addEventListener('input', clear);
    field.addEventListener('change', clear);
  });

  const submitFormDirect = (form, title, formType) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (revealInvalidField(form)) return;

      const submitButton = form.querySelector('.form-submit');
      const submitLabel = submitButton?.querySelector('span');
      const originalLabel = submitLabel?.textContent || '';
      if (submitButton) submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Отправляем…';

      const payload = new FormData(form);
      payload.append('subject', title);
      payload.append('form_type', formType);

      try {
        const response = await fetch('send.php', {
          method: 'POST',
          body: payload,
          headers: { 'Accept': 'application/json' }
        });

        let result = null;
        try { result = await response.json(); } catch (_) {}

        if (!response.ok || !result?.ok) {
          throw new Error(result?.message || 'Ошибка отправки');
        }

        showToast('Запрос отправлен');
        form.reset();
        form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
        form.querySelectorAll('.validation-message').forEach(el => el.remove());
        if (formType === 'question') {
          setTimeout(() => setQuestionDrawer(false), 450);
        }
      } catch (error) {
        console.error(error);
        showToast('Не удалось отправить. Попробуйте позже');
      } finally {
        if (submitButton) submitButton.disabled = false;
        if (submitLabel) submitLabel.textContent = originalLabel;
      }
    });
  };

  document.querySelectorAll('.part-form').forEach(form => submitFormDirect(form, 'Запрос на подбор запчасти — сайт Оригинал', 'parts'));
  const questionForm = document.getElementById('question-form');
  if (questionForm) submitFormDirect(questionForm, 'Вопрос продавцу — сайт Оригинал', 'question');

  document.querySelectorAll('.back-to-top').forEach(btn => {
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
})();
