// Each unit: [symbol, toBase(value), fromBase(value)]
const lin = (symbol, factor) => [symbol, v => v * factor, v => v / factor];

const CATEGORIES = {
  Temperature: {
    Celsius: ['°C', c => c, c => c],
    Fahrenheit: ['°F', f => ((f - 32) * 5) / 9, c => (c * 9) / 5 + 32],
    Kelvin: ['K', k => k - 273.15, c => c + 273.15]
  },
  Length: {
    Meter: lin('m', 1),
    Kilometer: lin('km', 1000),
    Centimeter: lin('cm', 0.01),
    Millimeter: lin('mm', 0.001),
    Mile: lin('mi', 1609.344),
    Yard: lin('yd', 0.9144),
    Foot: lin('ft', 0.3048),
    Inch: lin('in', 0.0254)
  },
  Mass: {
    Kilogram: lin('kg', 1),
    Gram: lin('g', 0.001),
    Milligram: lin('mg', 0.000001),
    Tonne: lin('t', 1000),
    Pound: lin('lb', 0.45359237),
    Ounce: lin('oz', 0.028349523125)
  },
  Volume: {
    Liter: lin('L', 1),
    Milliliter: lin('mL', 0.001),
    'Cubic meter': lin('m³', 1000),
    'US gallon': lin('gal', 3.785411784),
    'US cup': lin('cup', 0.2365882365),
    'US fluid ounce': lin('fl oz', 0.0295735295625)
  },
  Speed: {
    'Meter per second': lin('m/s', 1),
    'Kilometer per hour': lin('km/h', 1 / 3.6),
    'Mile per hour': lin('mph', 0.44704),
    Knot: lin('kn', 1852 / 3600)
  },
  Time: {
    Second: lin('s', 1),
    Minute: lin('min', 60),
    Hour: lin('h', 3600),
    Day: lin('d', 86400),
    Week: lin('wk', 604800)
  },
  Data: {
    Bit: lin('bit', 0.125),
    Byte: lin('B', 1),
    Kilobyte: lin('KB', 1e3),
    Megabyte: lin('MB', 1e6),
    Gigabyte: lin('GB', 1e9),
    Terabyte: lin('TB', 1e12)
  }
};

const $ = id => document.getElementById(id);
const valueEl = $('value'), fromEl = $('from'), toEl = $('to');
const resultEl = $('result'), formulaEl = $('formula');
const copyBtn = $('copy'), copyLabel = copyBtn.firstElementChild;
const tabsEl = $('tabs'), themeBtn = $('theme');
let category = 'Temperature';

function convert(value, from, to) {
  const units = CATEGORIES[category];
  return units[to][2](units[from][1](value));
}

function format(n) {
  n += 0; // turns -0 into 0
  const abs = Math.abs(n);
  if (abs >= 1e15 || (abs > 0 && abs < 1e-6)) return n.toExponential(4).replace(/\.?0+e/, 'e');
  return new Intl.NumberFormat('en', { maximumFractionDigits: 6 }).format(n);
}

function update() {
  const raw = valueEl.value.trim();
  const value = Number(raw);
  resultEl.classList.remove('hint');

  if (raw === '' || !Number.isFinite(value)) {
    resultEl.textContent = 'Enter a valid number';
    resultEl.classList.add('hint');
    formulaEl.textContent = '';
    return;
  }

  const units = CATEGORIES[category];
  const toSymbol = units[toEl.value][0];
  resultEl.textContent = `${format(convert(value, fromEl.value, toEl.value))} ${toSymbol}`;
  formulaEl.textContent = `1 ${units[fromEl.value][0]} = ${format(convert(1, fromEl.value, toEl.value))} ${toSymbol}`;

  resultEl.style.animation = 'none';
  void resultEl.offsetWidth; // restart the small fade-in
  resultEl.style.animation = '';
}

function fillSelect(select, units, index) {
  const names = Object.keys(units);
  select.innerHTML = names.map(n => `<option value="${n}">${n} (${units[n][0]})</option>`).join('');
  select.value = names[index];
}

function setCategory(name) {
  category = name;
  fillSelect(fromEl, CATEGORIES[name], 0);
  fillSelect(toEl, CATEGORIES[name], 1);
  tabsEl.querySelectorAll('.tab').forEach(tab => tab.setAttribute('aria-pressed', tab.textContent === name));
  update();
}

tabsEl.innerHTML = Object.keys(CATEGORIES)
  .map(name => `<button type="button" class="tab" aria-pressed="false">${name}</button>`)
  .join('');
tabsEl.addEventListener('click', e => {
  if (e.target.matches('.tab')) setCategory(e.target.textContent);
});

$('converter-form').addEventListener('submit', e => e.preventDefault());
valueEl.addEventListener('input', update);
fromEl.addEventListener('change', update);
toEl.addEventListener('change', update);

$('swap').addEventListener('click', () => {
  [fromEl.value, toEl.value] = [toEl.value, fromEl.value];
  update();
});

copyBtn.addEventListener('click', async () => {
  if (resultEl.classList.contains('hint')) return;
  try {
    await navigator.clipboard.writeText(resultEl.textContent);
    copyLabel.textContent = 'Copied ✓';
  } catch {
    copyLabel.textContent = 'Press Ctrl+C';
  }
  setTimeout(() => (copyLabel.textContent = 'Copy result'), 1500);
});

// Theme: follows the system setting until the visitor picks one
const root = document.documentElement;
const applyTheme = theme => {
  root.dataset.theme = theme;
  themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
};
let savedTheme;
try { savedTheme = localStorage.getItem('theme'); } catch {}
applyTheme(savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

themeBtn.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('theme', next); } catch {}
});

setCategory(category);