(() => {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  if (!window.location.hash) {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  const root = document.documentElement;
  const revealBlocks = Array.from(document.querySelectorAll('[data-reveal]'));

  function runRevealAnimation() {
    // Initial hidden state if not already handled by inline script
    root.classList.add('reveal-ready');

    // Ensure all blocks start hidden
    revealBlocks.forEach(block => block.classList.remove('is-visible'));

    // Staggered entrance
    requestAnimationFrame(() => {
      revealBlocks.forEach((block, index) => {
        const delay = index * 30;
        window.setTimeout(() => {
          block.classList.add('is-visible');
        }, delay);
      });
    });
  }

  runRevealAnimation();

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      runRevealAnimation();
    }
  });

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const themeToggles = Array.from(document.querySelectorAll('.js-theme-toggle'));
  const themeSlots = Array.from(document.querySelectorAll('.theme-toggle-slot'));
  const headerClock = document.getElementById('header-clock');
  const visitorStatusLine = document.getElementById('visitor-status-line');
  const visitorStoreUrl = visitorStatusLine ? visitorStatusLine.dataset.visitorStoreUrl || '' : '';
  const projectRowsContainers = Array.from(document.querySelectorAll('.Site-module__projectRows'));
  const justgoTrigger = document.getElementById('justgo-trigger-wrap');
  const justgoAnchor = document.getElementById('justgo-trigger');
  const enochTrigger = document.getElementById('enoch-trigger-wrap');
  const enochAnchor = document.getElementById('enoch-trigger');
  const songbadTrigger = document.getElementById('songbad-trigger-wrap');
  const songbadAnchor = document.getElementById('songbad-trigger');
  const twitterTrigger = document.getElementById('twitter-trigger-wrap');
  const twitterAnchor = document.getElementById('twitter-trigger');
  const twitterCard = document.getElementById('twitter-card');
  const presentDurationElements = Array.from(document.querySelectorAll('[data-present-start]'));
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const THEME_STORAGE_KEY = 'theme-preference';
  const LEGACY_THEME_STORAGE_KEY = 'theme';

  function readStoredThemePreference() {
    try {
      const savedPreference = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedPreference === 'system' || savedPreference === 'light' || savedPreference === 'dark') {
        return savedPreference;
      }

      const legacyTheme = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
      if (legacyTheme === 'light' || legacyTheme === 'dark') {
        return legacyTheme;
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function writeThemePreference(preference) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
      localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    } catch (error) {
    }
  }

  function resolveSystemTheme() {
    return prefersDark.matches ? 'dark' : 'light';
  }

  function resolveThemeFromPreference(preference) {
    if (preference === 'light' || preference === 'dark') {
      return preference;
    }
    return resolveSystemTheme();
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;

    if (themeMeta) {
      themeMeta.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#fafafa');
    }

    themeToggles.forEach((btn) => {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });

    themeSlots.forEach((slot) => {
      slot.classList.toggle('ThemeToggle-module__slotActive', slot.dataset.themeSlot === theme);
    });
  }

  let themePreference = readStoredThemePreference() || 'system';
  setTheme(resolveThemeFromPreference(themePreference));

  const transitionOverlay = document.getElementById('theme-transition-overlay');

  themeToggles.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const currentTheme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      themePreference = nextTheme;
      writeThemePreference(themePreference);

      const updateTheme = () => {
        setTheme(nextTheme);
      };

      if (document.startViewTransition) {
        document.documentElement.dataset.themeTransitioning = 'true';
        const transition = document.startViewTransition(updateTheme);
        try {
          await transition.finished;
        } finally {
          delete document.documentElement.dataset.themeTransitioning;
        }
      } else if (transitionOverlay) {
        transitionOverlay.style.setProperty('--overlay-bg', getComputedStyle(root).getPropertyValue('--bg'));
        transitionOverlay.dataset.visible = 'true';

        await new Promise(r => setTimeout(r, 40));
        updateTheme();

        await new Promise(r => setTimeout(r, 160));
        transitionOverlay.dataset.visible = 'false';
      } else {
        updateTheme();
      }
    });
  });

  function handleSystemThemeChange() {
    if (themePreference === 'system') {
      setTheme(resolveSystemTheme());
    }
  }

  prefersDark.addEventListener('change', handleSystemThemeChange);

  function startHeaderClock(timeZone) {
    if (!headerClock) {
      return;
    }

    let intervalId = null;
    let timeoutId = null;
    const timeElement = document.createElement('span');
    const hourElement = document.createElement('span');
    const hourTensElement = createDigitReel();
    const hourOnesElement = createDigitReel();
    const colonElement = document.createElement('span');
    const minuteElement = document.createElement('span');
    const minuteTensElement = createDigitReel();
    const minuteOnesElement = createDigitReel();
    const allDigitReels = [hourTensElement, hourOnesElement, minuteTensElement, minuteOnesElement];
    const cityElement = document.createElement('span');

    timeElement.className = 'HeaderClock-module__time';
    timeElement.setAttribute('aria-hidden', 'true');
    hourElement.className = 'HeaderClock-module__digits';
    colonElement.className = 'HeaderClock-module__colon';
    colonElement.textContent = ':';
    minuteElement.className = 'HeaderClock-module__digits';
    cityElement.className = 'HeaderClock-module__city';
    cityElement.textContent = '\u00A0in Dhaka';
    hourElement.append(hourTensElement.element, hourOnesElement.element);
    minuteElement.append(minuteTensElement.element, minuteOnesElement.element);
    timeElement.append(hourElement, colonElement, minuteElement);
    const formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone
    });

    function ensureClockMarkup() {
      if (!headerClock.contains(timeElement) || !headerClock.contains(cityElement)) {
        headerClock.textContent = '';
        headerClock.append(timeElement, cityElement);
      }
    }

    function parseTimeParts(timeLabel) {
      const timeParts = timeLabel.split(':');
      if (timeParts.length !== 2) {
        return null;
      }

      const [hours, minutes] = timeParts;
      if (!hours || !minutes) {
        return null;
      }

      return { hours, minutes };
    }

    function normalizeTwoDigits(value) {
      return String(value).padStart(2, '0').slice(-2);
    }

    function createDigitReel() {
      const element = document.createElement('span');
      const track = document.createElement('span');
      element.className = 'HeaderClock-module__digitChar';
      track.className = 'HeaderClock-module__digitTrack';

      for (let index = 0; index < 20; index += 1) {
        const glyph = document.createElement('span');
        glyph.className = 'HeaderClock-module__digitGlyph';
        glyph.textContent = String(index % 10);
        track.appendChild(glyph);
      }

      element.appendChild(track);
      return {
        element,
        track,
        value: null,
        resetHandler: null,
        stepPx: 0
      };
    }

    function measureReelStep(reel) {
      const firstGlyph = reel.track.firstElementChild;
      const measuredStep = firstGlyph instanceof HTMLElement
        ? firstGlyph.getBoundingClientRect().height
        : reel.element.getBoundingClientRect().height;

      if (Number.isFinite(measuredStep) && measuredStep > 0) {
        reel.stepPx = measuredStep;
      }

      return reel.stepPx;
    }

    function setReelPosition(reel, position, animate) {
      const stepPx = measureReelStep(reel);
      if (!(stepPx > 0)) {
        return;
      }

      const offsetPx = position * stepPx;
      if (!animate) {
        reel.track.style.transition = 'none';
        reel.track.style.transform = `translateY(${-offsetPx}px)`;
        void reel.track.offsetWidth;
        reel.track.style.transition = '';
        return;
      }

      reel.track.style.transform = `translateY(${-offsetPx}px)`;
    }

    function updateDigitReel(reel, nextValue) {
      const parsed = Number.parseInt(nextValue, 10);
      if (!Number.isFinite(parsed)) {
        return;
      }

      if (typeof reel.resetHandler === 'function') {
        reel.track.removeEventListener('transitionend', reel.resetHandler);
        reel.resetHandler = null;
      }

      if (!Number.isInteger(reel.value)) {
        reel.value = parsed;
        setReelPosition(reel, parsed, false);
        return;
      }

      if (reel.value === parsed) {
        return;
      }

      const targetPosition = parsed < reel.value ? parsed + 10 : parsed;
      reel.value = parsed;
      setReelPosition(reel, targetPosition, true);

      if (targetPosition >= 10) {
        reel.resetHandler = (event) => {
          if (event.propertyName !== 'transform') {
            return;
          }
          reel.track.removeEventListener('transitionend', reel.resetHandler);
          reel.resetHandler = null;
          setReelPosition(reel, parsed, false);
        };

        reel.track.addEventListener('transitionend', reel.resetHandler);
      }
    }

    function setTwoDigitValue(tensReel, onesReel, value) {
      const normalizedValue = normalizeTwoDigits(value);
      updateDigitReel(tensReel, normalizedValue[0]);
      updateDigitReel(onesReel, normalizedValue[1]);
    }

    function syncReelMetricsAndPositions() {
      allDigitReels.forEach((reel) => {
        measureReelStep(reel);
        if (Number.isInteger(reel.value)) {
          setReelPosition(reel, reel.value, false);
        }
      });
    }

    function cleanupTimers() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }

    function renderClock() {
      const now = new Date();
      const timeLabel = formatter.format(now);
      const timeParts = parseTimeParts(timeLabel);
      if (!timeParts) {
        headerClock.textContent = `${timeLabel}\u00A0in Dhaka`;
        return;
      }

      ensureClockMarkup();
      syncReelMetricsAndPositions();
      setTwoDigitValue(hourTensElement, hourOnesElement, timeParts.hours);
      setTwoDigitValue(minuteTensElement, minuteOnesElement, timeParts.minutes);

      headerClock.setAttribute('aria-label', `${timeLabel} in Dhaka`);
    }

    function syncToMinuteBoundary() {
      cleanupTimers();
      const now = new Date();
      const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

      timeoutId = window.setTimeout(() => {
        renderClock();
        intervalId = window.setInterval(renderClock, 60000);
      }, msToNextMinute);
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        cleanupTimers();
      } else {
        renderClock();
        syncToMinuteBoundary();
      }
    }

    renderClock();
    syncToMinuteBoundary();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', syncReelMetricsAndPositions);

    if (window.visualViewport && typeof window.visualViewport.addEventListener === 'function') {
      window.visualViewport.addEventListener('resize', syncReelMetricsAndPositions);
    }
  }

  startHeaderClock('Asia/Dhaka');

  function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    return fetch(url, {
      ...options,
      cache: 'no-store',
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutId);
    });
  }

  function normalizeCountryLabel(value) {
    if (!value) {
      return '';
    }

    const raw = String(value).trim();
    if (!raw) {
      return '';
    }

    if (/^[a-z]{2}$/i.test(raw)) {
      try {
        const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
        const resolved = displayNames.of(raw.toUpperCase());
        if (typeof resolved === 'string' && resolved.trim().length > 0) {
          return resolved;
        }
      } catch (error) {
      }

      return raw.toUpperCase();
    }

    return raw;
  }

  function normalizeVisitorLocation(value) {
    if (!value) {
      return '';
    }

    return String(value).replace(/\s+/g, ' ').trim();
  }

  async function fetchCapitalCountryLabel(countryLookupValue, lookupType) {
    if (!countryLookupValue) {
      return '';
    }

    const endpoint = lookupType === 'alpha'
      ? `https://restcountries.com/v3.1/alpha/${encodeURIComponent(countryLookupValue)}?fields=name,capital`
      : `https://restcountries.com/v3.1/name/${encodeURIComponent(countryLookupValue)}?fields=name,capital`;

    try {
      const response = await fetchWithTimeout(endpoint, { method: 'GET' }, 2500);
      if (!response.ok) {
        return '';
      }

      const payload = await response.json();
      const countryDetails = Array.isArray(payload) ? payload[0] : payload;
      if (!countryDetails) {
        return '';
      }

      const countryName = normalizeCountryLabel(
        countryDetails && countryDetails.name && countryDetails.name.common
          ? countryDetails.name.common
          : countryLookupValue
      );
      const capitalName = countryDetails && Array.isArray(countryDetails.capital) && countryDetails.capital.length > 0
        ? normalizeVisitorLocation(countryDetails.capital[0])
        : '';

      if (capitalName && countryName) {
        return `${capitalName}, ${countryName}`;
      }

      return countryName;
    } catch (error) {
      return '';
    }
  }

  async function readLastVisitorLocation() {
    if (!visitorStoreUrl) {
      return '';
    }

    try {
      const response = await fetchWithTimeout(visitorStoreUrl, { method: 'GET' }, 2500);
      if (!response.ok) {
        return '';
      }

      const storedLocation = normalizeVisitorLocation(await response.text());
      if (!storedLocation) {
        return '';
      }

      if (storedLocation.includes(',')) {
        return storedLocation;
      }

      const lookupType = /^[a-z]{2}$/i.test(storedLocation) ? 'alpha' : 'name';
      const enrichedLocation = await fetchCapitalCountryLabel(storedLocation, lookupType);
      return enrichedLocation || normalizeCountryLabel(storedLocation);
    } catch (error) {
      return '';
    }
  }

  async function writeLastVisitorLocation(location) {
    if (!visitorStoreUrl || !location) {
      return;
    }

    try {
      await fetchWithTimeout(visitorStoreUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8'
        },
        body: location
      }, 2500);
    } catch (error) {
    }
  }

  async function fetchCurrentVisitorLocation() {
    try {
      const response = await fetchWithTimeout('https://api.country.is/', { method: 'GET' }, 2500);
      if (!response.ok) {
        return '';
      }

      const payload = await response.json();
      const countryCode = payload && payload.country ? String(payload.country).trim().toUpperCase() : '';
      if (!countryCode) {
        return '';
      }

      const resolvedLocation = await fetchCapitalCountryLabel(countryCode, 'alpha');
      return resolvedLocation || normalizeCountryLabel(countryCode);
    } catch (error) {
      return '';
    }
  }

  async function hydrateVisitorStatusLine() {
    if (!visitorStatusLine) {
      return;
    }

    const fallbackText = visitorStatusLine.textContent.trim() || 'Last visitor from somewhere on Earth.';
    const [lastLocation, currentLocation] = await Promise.all([
      readLastVisitorLocation(),
      fetchCurrentVisitorLocation()
    ]);

    if (lastLocation) {
      visitorStatusLine.textContent = `Last visitor from ${lastLocation}.`;
    } else if (currentLocation) {
      visitorStatusLine.textContent = `Last visitor from ${currentLocation}.`;
    } else {
      visitorStatusLine.textContent = fallbackText;
    }

    if (currentLocation) {
      void writeLastVisitorLocation(currentLocation);
    }
  }

  void hydrateVisitorStatusLine();

  if (twitterCard && twitterCard.parentElement !== document.body) {
    document.body.appendChild(twitterCard);
  }

  function setupHoverCard(options) {
    const {
      trigger,
      anchor,
      card,
      openClass,
      expandedControl
    } = options;

    if (!trigger || !card) {
      return;
    }

    let openTimeout = null;
    let closeTimeout = null;

    function clearTimers() {
      if (openTimeout) {
        clearTimeout(openTimeout);
        openTimeout = null;
      }
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    }

    function setOpenState(isOpen) {
      card.classList.toggle(openClass, isOpen);
      card.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      if (isOpen) {
        card.removeAttribute('inert');
      } else {
        card.setAttribute('inert', '');
      }
      if (expandedControl) {
        expandedControl.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
    }

    function positionCard() {
      const target = anchor || trigger;
      const rect = target.getBoundingClientRect();
      card.style.top = `${rect.top - 8}px`;
      card.style.left = `${rect.left + rect.width / 2}px`;
    }

    function openCard() {
      clearTimers();
      positionCard();
      setOpenState(true);
    }

    function closeCard() {
      clearTimers();
      setOpenState(false);
    }

    function scheduleOpen() {
      clearTimers();
      openTimeout = window.setTimeout(openCard, 120);
    }

    function scheduleClose() {
      clearTimers();
      closeTimeout = window.setTimeout(closeCard, 130);
    }

    trigger.addEventListener('mouseenter', scheduleOpen);
    trigger.addEventListener('mouseleave', scheduleClose);
    trigger.addEventListener('focusin', openCard);
    trigger.addEventListener('focusout', scheduleClose);
    card.addEventListener('mouseenter', openCard);
    card.addEventListener('mouseleave', scheduleClose);
    card.addEventListener('focusin', openCard);
    card.addEventListener('focusout', scheduleClose);
    window.addEventListener('scroll', closeCard, { passive: true });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeCard();
      }
    });
  }

  setupHoverCard({
    trigger: twitterTrigger,
    anchor: twitterAnchor,
    card: twitterCard,
    openClass: 'TwitterHoverCard-module__cardOpen'
  });

  function setupEmojiHoverParticles(options) {
    const {
      trigger,
      anchor,
      emojis
    } = options;

    if (!trigger || !anchor || !Array.isArray(emojis) || emojis.length === 0) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
      return;
    }
    const maxParticles = 12;
    const spawnIntervalMs = 170;
    const activeParticles = new Set();
    let isActive = false;
    let rafId = 0;
    let lastSpawnAt = 0;
    let pointerX = 0;
    let pointerY = 0;

    function randomBetween(min, max) {
      return Math.random() * (max - min) + min;
    }

    function getAnchorPoint() {
      const rect = anchor.getBoundingClientRect();
      return {
        x: rect.left + rect.width * 0.5,
        y: rect.top + rect.height * 0.45
      };
    }

    function setPointerToAnchor() {
      const point = getAnchorPoint();
      pointerX = point.x;
      pointerY = point.y;
    }

    function setPointerFromEvent(event) {
      if (!event || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
        setPointerToAnchor();
        return;
      }
      pointerX = event.clientX;
      pointerY = event.clientY;
    }

    function removeParticle(particle) {
      if (!activeParticles.has(particle)) {
        return;
      }
      activeParticles.delete(particle);
      particle.remove();
    }

    function clearParticles() {
      activeParticles.forEach((particle) => {
        particle.remove();
      });
      activeParticles.clear();
    }

    function createParticle() {
      if (activeParticles.size >= maxParticles) {
        return;
      }

      const particle = document.createElement('span');
      particle.className = 'JustGoSportsLink-module__emoji';
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      const startX = pointerX + randomBetween(-11, 11);
      const startY = pointerY + randomBetween(-6, 6);
      const driftX = randomBetween(-30, 30);
      const driftY = randomBetween(-48, -24);
      const rotate = randomBetween(-22, 22);
      const duration = randomBetween(1900, 2600);
      const fontSize = randomBetween(13, 19);

      particle.style.fontSize = `${fontSize}px`;
      particle.style.transform = `translate3d(${startX}px, ${startY}px, 0) scale(0.72)`;
      particle.style.opacity = '0';
      document.body.appendChild(particle);
      activeParticles.add(particle);

      const animation = particle.animate([
        {
          transform: `translate3d(${startX}px, ${startY}px, 0) scale(0.72) rotate(${rotate * -0.2}deg)`,
          opacity: 0
        },
        {
          transform: `translate3d(${startX + driftX * 0.24}px, ${startY + driftY * 0.26}px, 0) scale(1) rotate(${rotate * 0.45}deg)`,
          opacity: 0.96,
          offset: 0.24
        },
        {
          transform: `translate3d(${startX + driftX}px, ${startY + driftY}px, 0) scale(0.93) rotate(${rotate}deg)`,
          opacity: 0
        }
      ], {
        duration,
        easing: 'cubic-bezier(0.18, 0.9, 0.3, 1)',
        fill: 'forwards'
      });

      const cleanup = () => {
        removeParticle(particle);
      };
      animation.addEventListener('finish', cleanup, { once: true });
      animation.addEventListener('cancel', cleanup, { once: true });
    }

    function tick(timestamp) {
      if (!isActive) {
        return;
      }

      if (timestamp - lastSpawnAt >= spawnIntervalMs) {
        createParticle();
        lastSpawnAt = timestamp;
      }

      rafId = window.requestAnimationFrame(tick);
    }

    function start(event) {
      if (prefersReducedMotion.matches) {
        return;
      }

      setPointerFromEvent(event);
      if (isActive) {
        return;
      }

      isActive = true;
      lastSpawnAt = 0;
      rafId = window.requestAnimationFrame(tick);
    }

    function stop() {
      if (!isActive) {
        return;
      }

      isActive = false;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      lastSpawnAt = 0;
    }

    trigger.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') {
        return;
      }
      start(event);
    });

    trigger.addEventListener('pointermove', (event) => {
      if (!isActive || event.pointerType === 'touch') {
        return;
      }
      setPointerFromEvent(event);
    });

    trigger.addEventListener('pointerleave', stop);
    trigger.addEventListener('focusin', () => {
      start();
    });
    trigger.addEventListener('focusout', stop);
    window.addEventListener('blur', stop);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stop();
      }
    });

    prefersReducedMotion.addEventListener('change', (event) => {
      if (event.matches) {
        stop();
        clearParticles();
      }
    });
  }

  const justgoSportsEmojis = ['\u26BD', '\u{1F3C0}', '\u{1F3C8}', '\u26BE', '\u{1F3BE}', '\u{1F3D0}', '\u{1F3C9}', '\u{1F94A}', '\u{1F3D3}', '\u{1F3F8}'];
  const enochPlatformEmojis = ['\u{1F60A}', '\u{1F91D}', '\u{1F4DA}', '\u{1F393}', '\u{1F9E0}', '\u{1F4A1}', '\u270D', '\u{1F465}', '\u{1F50D}', '\u{1F4BC}', '\u{1F4CB}', '\u{1F6E0}\uFE0F'];
  const songbadNewsVideoEmojis = ['\u{1F4F0}', '\u{1F5DE}\uFE0F', '\u{1F4F9}', '\u{1F3A5}', '\u{1F4FA}', '\u{1F3A4}', '\u{1F4E1}', '\u25B6\uFE0F', '\u{1F4DD}', '\u{1F4FD}\uFE0F'];

  setupEmojiHoverParticles({
    trigger: justgoTrigger,
    anchor: justgoAnchor,
    emojis: justgoSportsEmojis
  });
  setupEmojiHoverParticles({
    trigger: enochTrigger,
    anchor: enochAnchor,
    emojis: enochPlatformEmojis
  });
  setupEmojiHoverParticles({
    trigger: songbadTrigger,
    anchor: songbadAnchor,
    emojis: songbadNewsVideoEmojis
  });

  projectRowsContainers.forEach((projectRowsContainer) => {
    const projectRowHighlight = projectRowsContainer.querySelector('.Site-module__projectRowHighlight');
    const projectRows = Array.from(
      projectRowsContainer.querySelectorAll('.Site-module__projectRow:not(.Site-module__projectRowHeader)')
    );

    if (!projectRowHighlight || projectRows.length === 0) {
      return;
    }

    function hideProjectHighlight() {
      projectRowHighlight.classList.remove('is-active');
    }

    function showProjectHighlight(row) {
      projectRowHighlight.style.height = `${row.offsetHeight}px`;
      projectRowHighlight.style.transform = `translateY(${row.offsetTop}px)`;
      projectRowHighlight.classList.add('is-active');
    }

    projectRows.forEach((row) => {
      row.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'touch') {
          return;
        }
        showProjectHighlight(row);
      });

      row.addEventListener('focus', () => {
        showProjectHighlight(row);
      });
    });

    projectRowsContainer.addEventListener('pointerleave', hideProjectHighlight);
    projectRowsContainer.addEventListener('focusout', (event) => {
      const nextFocused = event.relatedTarget;
      if (!nextFocused || !projectRowsContainer.contains(nextFocused)) {
        hideProjectHighlight();
      }
    });
  });

  function formatExperienceDuration(totalMonths) {
    if (totalMonths <= 0) {
      return '0mos';
    }

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const parts = [];

    if (years > 0) {
      parts.push(`${years}yr`);
    }
    if (months > 0) {
      parts.push(`${months}mo${months === 1 ? '' : 's'}`);
    }

    if (parts.length === 0) {
      return '0mos';
    }
    return parts.join(' ');
  }

  function getInclusiveMonthDiff(startYear, startMonth) {
    const now = new Date();
    return ((now.getFullYear() - startYear) * 12) + (now.getMonth() - (startMonth - 1)) + 1;
  }

  function updatePresentDurations() {
    presentDurationElements.forEach((element) => {
      const rawStart = element.dataset.presentStart || '';
      const match = rawStart.match(/^(\d{4})-(\d{2})$/);
      if (!match) {
        return;
      }

      const startYear = Number(match[1]);
      const startMonth = Number(match[2]);
      if (!Number.isFinite(startYear) || !Number.isFinite(startMonth) || startMonth < 1 || startMonth > 12) {
        return;
      }

      const totalMonths = Math.max(getInclusiveMonthDiff(startYear, startMonth), 1);
      element.textContent = `Present \u00B7 ${formatExperienceDuration(totalMonths)}`;
    });
  }

  document.querySelectorAll('.js-email-copy-trigger').forEach((container) => {
    const emailCopyLink = container.querySelector('a');
    const emailTooltip = container.querySelector('.inline-tooltip-local');
    if (!emailCopyLink || !emailTooltip) return;
    const email = 'connect.sayful@gmail.com';
    let hideTooltipTimeout = null;
    let resetCopiedTimeout = null;
    let isCopied = false;
    function isFocusVisible(element) { try { return element.matches(':focus-visible'); } catch (e) { return false; } }
    function shouldKeepTooltipOpen() { return emailCopyLink.matches(':hover') || (document.activeElement === emailCopyLink && isFocusVisible(emailCopyLink)); }

    function clearEmailTimers() {
      if (hideTooltipTimeout) {
        clearTimeout(hideTooltipTimeout);
        hideTooltipTimeout = null;
      }
      if (resetCopiedTimeout) {
        clearTimeout(resetCopiedTimeout);
        resetCopiedTimeout = null;
      }
    }

    function setTooltipText(text, success) {
      emailTooltip.textContent = text;
      emailTooltip.style.color = success ? 'var(--color-success)' : '';
    }

    function showTooltip() {
      clearTimeout(hideTooltipTimeout);
      emailTooltip.dataset.open = 'true';
    }

    function hideTooltipWithDelay() {
      clearTimeout(hideTooltipTimeout);
      hideTooltipTimeout = window.setTimeout(() => {
        if (!isCopied) {
          emailTooltip.dataset.open = 'false';
        }
      }, 250);
    }

    function resetTooltip() {
      isCopied = false;
      if (shouldKeepTooltipOpen()) {
        setTooltipText('Click to copy', false);
        emailTooltip.dataset.open = 'true';
        return;
      }
      emailTooltip.dataset.open = 'false';
    }

    async function copyEmailToClipboard() {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        return false;
      }
      try {
        await navigator.clipboard.writeText(email);
        return true;
      } catch (error) {
        return false;
      }
    }

    emailCopyLink.addEventListener('mouseenter', () => {
      if (!isCopied) {
        setTooltipText('Click to copy', false);
      }
      showTooltip();
    });

    emailCopyLink.addEventListener('mouseleave', hideTooltipWithDelay);
    emailCopyLink.addEventListener('focus', () => {
      if (!isCopied) {
        setTooltipText('Click to copy', false);
      }
      showTooltip();
    });
    emailCopyLink.addEventListener('blur', hideTooltipWithDelay);

    emailCopyLink.addEventListener('click', async (event) => {
      event.preventDefault();
      clearEmailTimers();
      const copied = await copyEmailToClipboard();

      if (!copied) {
        window.location.href = `mailto:${email}`;
        return;
      }

      isCopied = true;
      setTooltipText('Copied!', true);
      showTooltip();

      if (event.detail > 0) {
        emailCopyLink.blur();
      }

      resetCopiedTimeout = window.setTimeout(() => {
        resetTooltip();
      }, 1400);
    });
  });

  document.querySelectorAll('.js-tooltip-trigger').forEach((container) => {
    const triggerLink = container.querySelector('a');
    const tooltipElement = container.querySelector('.inline-tooltip-local');

    if (!triggerLink || !tooltipElement) {
      return;
    }

    let hideTooltipTimeout = null;

    function showTooltip() {
      clearTimeout(hideTooltipTimeout);
      tooltipElement.dataset.open = 'true';
    }

    function hideTooltipWithDelay() {
      clearTimeout(hideTooltipTimeout);
      hideTooltipTimeout = window.setTimeout(() => {
        tooltipElement.dataset.open = 'false';
      }, 250);
    }

    triggerLink.addEventListener('mouseenter', showTooltip);
    triggerLink.addEventListener('mouseleave', hideTooltipWithDelay);
    triggerLink.addEventListener('focus', showTooltip);
    triggerLink.addEventListener('blur', hideTooltipWithDelay);
  });

  /* Footer uncover effect logic */
  const footerUncoverContainer = document.querySelector('.Site-module__container');
  const footerUncoverFooter = document.querySelector('.SiteFooter-module__footer');

  function updateFooterUncover() {
    if (!footerUncoverContainer || !footerUncoverFooter) return;

    const footerHeight = footerUncoverFooter.offsetHeight;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const scrollTop = window.scrollY;

    // Calculate how much we've scrolled into the footer area
    const remaining = scrollHeight - clientHeight - scrollTop;
    const progress = Math.max(0, Math.min(1, 1 - (remaining / footerHeight)));

    document.documentElement.style.setProperty('--reveal-progress', progress);
  }

  window.addEventListener('scroll', updateFooterUncover, { passive: true });
  window.addEventListener('resize', updateFooterUncover);
  updateFooterUncover();

  updatePresentDurations();
})();
