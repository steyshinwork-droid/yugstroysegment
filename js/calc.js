/* ============================================================
   Калькуляторы ЮгСтройСегмент
   1) uss-pile-calc  — объём кучи по замерам (проверка доставки)
   2) uss-order-calc — расчёт нужного объёма, машин и стоимости
   Разметку блоков ставит HTML, скрипт сам находит их по id.
   ============================================================ */
(function () {
    'use strict';

    /* Насыпные плотности, т/м³ — середина диапазонов из статьи
       «Насыпная плотность» (articles/nasypnaya-plotnost.html).
       При правке плотностей править и там, и здесь. */
    var MATERIALS = [
        { id: 'scheben-5-20',   name: 'Щебень скальный 5–20 мм',   density: 1.375 },
        { id: 'scheben-20-40',  name: 'Щебень скальный 20–40 мм',  density: 1.315 },
        { id: 'scheben-grav',   name: 'Щебень гравийный 20–40 мм', density: 1.45  },
        { id: 'scheben-40-70',  name: 'Щебень скальный 40–70 мм',  density: 1.275 },
        { id: 'galka-krupn',    name: 'Щебень-галька 40–120 мм',   density: 1.525 },
        { id: 'otsev',          name: 'Отсев 0–5 мм',              density: 1.55  },
        { id: 'pesok',          name: 'Песок строительный',        density: 1.525 },
        { id: 'galka',          name: 'Галька декоративная',       density: 1.55  },
        { id: 'gps',            name: 'ГПС',                       density: 1.775 },
        { id: 'chernozem',      name: 'Чернозём',                  density: 1.1   },
        { id: 'pochvosmes',     name: 'Почвосмесь',                density: 0.85  },
        { id: 'keramzit-10-20', name: 'Керамзит 10–20 мм',         density: 0.375 },
        { id: 'keramzit-20-40', name: 'Керамзит 20–40 мм',         density: 0.315 }
    ];

    /* Цены — синхронизированы с index.html и товарными страницами.
       unit: 't' — цена за тонну, 'm3' — за кубометр. */
    var PRICES = {
        'scheben-5-20':   { price: 900,  unit: 't',  page: 'scheben.html',    label: 'Щебень' },
        'scheben-20-40':  { price: 900,  unit: 't',  page: 'scheben.html',    label: 'Щебень' },
        'scheben-grav':   { price: 900,  unit: 't',  page: 'scheben.html',    label: 'Щебень' },
        'scheben-40-70':  { price: 900,  unit: 't',  page: 'scheben.html',    label: 'Щебень' },
        'galka-krupn':    { price: 1000, unit: 'm3', page: 'galka.html',      label: 'Галька' },
        'otsev':          { price: 600,  unit: 't',  page: 'otsev.html',      label: 'Отсев' },
        'pesok':          { price: 600,  unit: 't',  page: 'pesok.html',      label: 'Песок' },
        'galka':          { price: 1000, unit: 'm3', page: 'galka.html',      label: 'Галька' },
        'gps':            { price: 900,  unit: 'm3', page: 'gps.html',        label: 'ГПС' },
        'chernozem':      { price: 3000, unit: 'm3', page: 'chernozem.html',  label: 'Чернозём' },
        'pochvosmes':     { price: 2500, unit: 'm3', page: 'pochvosmes.html', label: 'Почвосмесь' },
        'keramzit-10-20': { price: 5900, unit: 'm3', page: 'keramzit.html',   label: 'Керамзит' },
        'keramzit-20-40': { price: 5900, unit: 'm3', page: 'keramzit.html',   label: 'Керамзит' }
    };

    /* Реальный автопарк (данные владельца, 28 августа 2026).
       Тонары 30–40 м³ в подбор не включены сознательно: по габаритам они
       заходят далеко не везде в Сочи, и заказывают их единицы.
       Машина ограничена и объёмом кузова, и весом: лёгкий материал
       (чернозём, почвосмесь) упирается в объём, тяжёлый — в тоннаж. */
    var TRUCKS = [
        { name: 'мини-самосвал',    m3: 4,  tons: 6  },
        { name: 'КамАЗ',            m3: 11, tons: 15 },
        /* Большой самосвал: 20 м³ песка ≈ 30 т — штатный рейс, проходит почти везде.
           Лимит с небольшим запасом, чтобы расчётная плотность не дробила его на два.
           Машины на 25 м³ / до 40 т в подбор не включены: они идут только по прямой
           дороге без подъёмов, а это зависит от конкретного адреса — обещать нельзя. */
        { name: 'большой самосвал', m3: 22, tons: 32 }
    ];

    var WA_BASE = 'https://wa.me/79654811610?text=';

    function num(v) {
        v = parseFloat(String(v).replace(',', '.'));
        return isFinite(v) ? v : 0;
    }

    /* Разделитель разрядов без Intl — работает в любом браузере */
    function fmt(n, digits) {
        if (!isFinite(n)) return '0';
        var s = n.toFixed(digits === undefined ? 2 : digits);
        var parts = s.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return parts.join(',');
    }

    function byId(id) { return document.getElementById(id); }

    function optionsHtml(selectedId) {
        return MATERIALS.map(function (m) {
            return '<option value="' + m.id + '"' +
                   (m.id === selectedId ? ' selected' : '') + '>' + m.name + '</option>';
        }).join('');
    }

    function material(id) {
        for (var i = 0; i < MATERIALS.length; i++) {
            if (MATERIALS[i].id === id) return MATERIALS[i];
        }
        return MATERIALS[0];
    }

    /* Сколько машин: считаем и по объёму, и по весу — берём худшее из двух.
       Например 20 м³ песка весят 30 т, в одну машину не влезут по тоннажу. */
    function trucksFor(m3, tons) {
        /* Берём самую маленькую машину, которая увезёт заказ за один рейс:
           гонять мелкую несколько раз вместо одного рейса крупной смысла нет.
           Если не влезает даже в самую большую — считаем число рейсов по ней. */
        for (var i = 0; i < TRUCKS.length; i++) {
            var t = TRUCKS[i];
            if (m3 <= t.m3 && tons <= t.tons) {
                return { count: 1, name: t.name };
            }
        }
        var big = TRUCKS[TRUCKS.length - 1];
        var count = Math.max(Math.ceil(m3 / big.m3), Math.ceil(tons / big.tons), 1);
        return { count: count, name: big.name };
    }

    /* ===================== 1. КАЛЬКУЛЯТОР КУЧИ ===================== */

    function initPileCalc(root) {
        root.innerHTML =
            '<div class="calc">' +
              '<div class="calc__head">' +
                '<h3 class="calc__title">Калькулятор объёма кучи</h3>' +
                '<p class="calc__sub">Замерьте кучу рулеткой и введите размеры — посчитаем объём и вес.</p>' +
              '</div>' +
              '<div class="calc__row">' +
                '<label class="calc__field">' +
                  '<span>Форма кучи</span>' +
                  '<select id="pc-shape">' +
                    '<option value="cone">Конус (обычная горка)</option>' +
                    '<option value="trunc">Плоская куча (срезанная вершина)</option>' +
                    '<option value="prism">Валик (длинный вал)</option>' +
                  '</select>' +
                '</label>' +
                '<label class="calc__field">' +
                  '<span>Материал</span>' +
                  '<select id="pc-mat">' + optionsHtml('pesok') + '</select>' +
                '</label>' +
              '</div>' +
              '<div class="calc__row" id="pc-inputs"></div>' +
              '<div class="calc__result" id="pc-out"></div>' +
              '<p class="calc__note">Плотность взята средняя: влажный материал тяжелее сухого на 10–20%. ' +
              'Погрешность замера кучи рулеткой — обычно 5–10%.</p>' +
            '</div>';

        var shape = byId('pc-shape'), mat = byId('pc-mat'),
            inputs = byId('pc-inputs'), out = byId('pc-out');

        function fieldsHtml(s) {
            if (s === 'prism') {
                return field('pc-l', 'Длина вала, м', '20') +
                       field('pc-w', 'Ширина у основания, м', '3') +
                       field('pc-h', 'Высота, м', '0.5');
            }
            if (s === 'trunc') {
                return field('pc-d', 'Диаметр внизу, м', '4') +
                       field('pc-d2', 'Диаметр площадки сверху, м', '1.5') +
                       field('pc-h', 'Высота, м', '1.2');
            }
            return field('pc-d', 'Диаметр основания, м', '3.2') +
                   field('pc-h', 'Высота, м', '1.4');
        }

        function field(id, label, def) {
            return '<label class="calc__field">' +
                     '<span>' + label + '</span>' +
                     '<input type="number" id="' + id + '" value="' + def + '" min="0" step="0.1" inputmode="decimal">' +
                   '</label>';
        }

        function calc() {
            var s = shape.value, v = 0;
            if (s === 'prism') {
                v = 0.5 * num(byId('pc-w').value) * num(byId('pc-h').value) * num(byId('pc-l').value);
            } else if (s === 'trunc') {
                var R = num(byId('pc-d').value) / 2, r = num(byId('pc-d2').value) / 2,
                    h = num(byId('pc-h').value);
                v = (Math.PI / 3) * h * (R * R + R * r + r * r);
            } else {
                var rr = num(byId('pc-d').value) / 2;
                v = (Math.PI / 3) * rr * rr * num(byId('pc-h').value);
            }

            if (!(v > 0)) { out.innerHTML = ''; return; }

            var m = material(mat.value), tons = v * m.density;
            var html =
                '<div class="calc__main">' +
                  '<div class="calc__big"><b>' + fmt(v, 2) + '</b><span>м³</span></div>' +
                  '<div class="calc__big"><b>' + fmt(tons, 2) + '</b><span>тонн</span></div>' +
                '</div>' +
                '<p class="calc__hint">Это ' + m.name.toLowerCase() + ' при плотности ' +
                fmt(m.density, 2) + ' т/м³.</p>';

            /* Сверка с тем, что человек заказывал */
            html += '<div class="calc__check">' +
                      '<label class="calc__field calc__field--inline">' +
                        '<span>А заказывали сколько?</span>' +
                        '<input type="number" id="pc-order" placeholder="напр. 5" min="0" step="0.1" inputmode="decimal">' +
                        '<select id="pc-order-unit"><option value="m3">м³</option><option value="t">тонн</option></select>' +
                      '</label>' +
                      '<div id="pc-verdict"></div>' +
                    '</div>';

            out.innerHTML = html;

            var ordEl = byId('pc-order'), unitEl = byId('pc-order-unit'), verdict = byId('pc-verdict');

            function checkOrder() {
                var ordered = num(ordEl.value);
                if (!(ordered > 0)) { verdict.innerHTML = ''; return; }
                var actual = unitEl.value === 't' ? tons : v;
                var diff = actual - ordered;
                var pct = (diff / ordered) * 100;
                var unitName = unitEl.value === 't' ? 'т' : 'м³';

                if (pct >= -7) {
                    verdict.innerHTML =
                        '<div class="calc__verdict calc__verdict--ok">' +
                          'Похоже, привезли сколько нужно: по замеру ' + fmt(actual, 2) + ' ' + unitName +
                          ' против заказанных ' + fmt(ordered, 2) + ' ' + unitName + '. ' +
                          'Расхождение до 7% — это нормальная погрешность замера кучи рулеткой.' +
                        '</div>';
                } else {
                    var lack = Math.abs(diff);
                    verdict.innerHTML =
                        '<div class="calc__verdict calc__verdict--bad">' +
                          '<b>Не хватает примерно ' + fmt(lack, 2) + ' ' + unitName +
                          ' (' + fmt(Math.abs(pct), 0) + '%).</b><br>' +
                          'По замеру вышло ' + fmt(actual, 2) + ' ' + unitName + ', а заказывали ' +
                          fmt(ordered, 2) + ' ' + unitName + '. Прежде чем предъявлять поставщику, ' +
                          'перемерьте кучу ещё раз в двух направлениях — диаметр редко бывает ровным.' +
                          '<div class="calc__cta">' +
                            '<span>Нужен поставщик, который возит честно?</span>' +
                            '<a href="tel:+79654811610" class="calc__btn calc__btn--call">Позвонить: +7 965 481-16-10</a>' +
                            '<a href="' + WA_BASE + encodeURIComponent('Здравствуйте! Нужна доставка материала в Сочи.') +
                              '" target="_blank" rel="noopener" class="calc__btn calc__btn--wa">Написать в WhatsApp</a>' +
                          '</div>' +
                        '</div>';
                }
            }

            ordEl.addEventListener('input', checkOrder);
            unitEl.addEventListener('change', checkOrder);
        }

        function rebuild() {
            inputs.innerHTML = fieldsHtml(shape.value);
            inputs.querySelectorAll('input').forEach(function (i) {
                i.addEventListener('input', calc);
            });
            calc();
        }

        shape.addEventListener('change', rebuild);
        mat.addEventListener('change', calc);
        rebuild();
    }

    /* ===================== 2. КАЛЬКУЛЯТОР ЗАКАЗА ===================== */

    function initOrderCalc(root) {
        var preset = root.getAttribute('data-material') || 'pesok';

        root.innerHTML =
            '<div class="calc">' +
              '<div class="calc__head">' +
                '<h3 class="calc__title">Сколько нужно и сколько это стоит</h3>' +
                '<p class="calc__sub">Введите площадь и толщину слоя — посчитаем объём, вес, число машин и цену.</p>' +
              '</div>' +
              '<div class="calc__row">' +
                '<label class="calc__field">' +
                  '<span>Материал</span>' +
                  '<select id="oc-mat">' + optionsHtml(preset) + '</select>' +
                '</label>' +
                '<label class="calc__field">' +
                  '<span>Площадь, м²</span>' +
                  '<input type="number" id="oc-area" value="100" min="0" step="1" inputmode="decimal">' +
                '</label>' +
                '<label class="calc__field">' +
                  '<span>Толщина слоя, см</span>' +
                  '<input type="number" id="oc-depth" value="15" min="0" step="1" inputmode="decimal">' +
                '</label>' +
              '</div>' +
              '<label class="calc__check-line">' +
                '<input type="checkbox" id="oc-compact"> ' +
                '<span>Слой будет трамбоваться (добавить 15% на уплотнение)</span>' +
              '</label>' +
              '<div class="calc__result" id="oc-out"></div>' +
            '</div>';

        var mat = byId('oc-mat'), area = byId('oc-area'),
            depth = byId('oc-depth'), compact = byId('oc-compact'), out = byId('oc-out');

        function calc() {
            var a = num(area.value), d = num(depth.value) / 100;
            var v = a * d;
            if (compact.checked) v *= 1.15;

            if (!(v > 0)) { out.innerHTML = ''; return; }

            var m = material(mat.value), tons = v * m.density;
            var p = PRICES[m.id];
            var cost = p.unit === 't' ? tons * p.price : v * p.price;
            var tr = trucksFor(v, tons);

            var msg = 'Здравствуйте! Нужно ' + fmt(v, 1) + ' м³ (' + p.label.toLowerCase() +
                      '). Площадь ' + fmt(a, 0) + ' м², слой ' + fmt(num(depth.value), 0) + ' см.';

            out.innerHTML =
                '<div class="calc__main">' +
                  '<div class="calc__big"><b>' + fmt(v, 1) + '</b><span>м³</span></div>' +
                  '<div class="calc__big"><b>' + fmt(tons, 1) + '</b><span>тонн</span></div>' +
                  '<div class="calc__big"><b>' + tr.count + '</b><span>' +
                     (tr.count === 1 ? 'машина' : (tr.count < 5 ? 'машины' : 'машин')) + '</span></div>' +
                '</div>' +
                '<div class="calc__price">от ' + fmt(cost, 0) + ' ₽ <span>за материал</span></div>' +
                '<p class="calc__hint">Расчёт по цене ' + fmt(p.price, 0) + ' ₽/' +
                  (p.unit === 't' ? 'т' : 'м³') + ', ' + tr.count + ' × ' + tr.name +
                  '. Стоимость доставки на ваш адрес назовём по телефону.' +
                  (tr.count > 1 ? ' Если к участку идёт прямая дорога без подъёмов, часть объёма' +
                                  ' увезём машиной на 25 м³ (до 40 т) — рейсов выйдет меньше.' : '') +
                  '</p>' +
                '<div class="calc__cta">' +
                  '<a href="tel:+79654811610" class="calc__btn calc__btn--call">Позвонить: +7 965 481-16-10</a>' +
                  '<a href="' + WA_BASE + encodeURIComponent(msg) +
                    '" target="_blank" rel="noopener" class="calc__btn calc__btn--wa">Заказать в WhatsApp</a>' +
                '</div>';
        }

        [mat, area, depth].forEach(function (el) {
            el.addEventListener('input', calc);
            el.addEventListener('change', calc);
        });
        compact.addEventListener('change', calc);
        calc();
    }

    /* ===================== ЗАПУСК ===================== */

    function boot() {
        var pile = byId('uss-pile-calc');
        if (pile) initPileCalc(pile);
        var order = byId('uss-order-calc');
        if (order) initOrderCalc(order);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
