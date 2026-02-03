(function () {
  var content = document.getElementById('content');
  var tree = document.getElementById('tree');
  var drawer = document.getElementById('drawer');
  var openBtn = document.getElementById('openDrawer');
  var closeBtn = document.getElementById('closeDrawer');
  var breadcrumb = document.getElementById('breadcrumb');
  var emptyState = document.getElementById('emptyState');
  var pageTitle = document.getElementById('pageTitle');
  var searchInput = document.getElementById('searchInput');
  var searchResults = document.getElementById('searchResults');
  var scrollTopBtn = document.getElementById('scrollTop');
  var scrollTopFab = document.getElementById('scrollTopFab');
  var searchIndex = [];
  var selectionKey = 'ruankao-selection';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  function countPointsInTopic(topic) {
    return (topic.points || []).length;
  }

  function countPointsInModule(mod) {
    if (mod.submodules) {
      return mod.submodules.reduce(function (sum, s) {
        return sum + s.topics.reduce(function (tSum, t) { return tSum + countPointsInTopic(t); }, 0);
      }, 0);
    }
    return mod.topics.reduce(function (sum, t) { return sum + countPointsInTopic(t); }, 0);
  }

  function fieldBlock(label, valueNode, extraClass) {
    var wrap = el('div', 'field' + (extraClass ? ' ' + extraClass : ''));
    wrap.appendChild(el('div', 'field-label', label));
    var val = el('div', 'field-value');
    if (typeof valueNode === 'string') {
      val.textContent = valueNode;
    } else if (valueNode) {
      val.appendChild(valueNode);
    }
    wrap.appendChild(val);
    return wrap;
  }

  function stepsBlock(steps) {
    var ol = el('ol', 'steps');
    steps.forEach(function (s) { ol.appendChild(el('li', '', s)); });
    return ol;
  }

  function pitfallsBlock(pitfalls) {
    var ul = el('ul', 'pitfalls');
    pitfalls.forEach(function (p) { ul.appendChild(el('li', '', p)); });
    return ul;
  }

  function examplesBlock(examples) {
    var wrap = el('div', 'examples');
    examples.forEach(function (ex, idx) {
      var box = el('div', 'example');
      void idx;
      if (ex.question) box.appendChild(el('div', 'example-line', ex.question));
      if (ex.options && ex.options.length) {
        var optionsWrap = el('div', 'options');
        var answerKey = String(ex.answer || '').trim().toUpperCase();
        var resultLine = el('div', 'example-result');
        var analysisTitle = null;
        var analysisLine = el('div', 'example-line', ex.analysis || '');
        analysisLine.style.display = 'none';
        var locked = false;
        if (ex.analysis) {
          analysisTitle = el('div', 'example-title', '解析');
          analysisTitle.style.display = 'none';
        }

        ex.options.forEach(function (opt) {
          var key = '';
          var text = '';
          if (typeof opt === 'string') {
            var m = opt.match(/^([A-D])\\b[\\.、\\s-]*/i);
            key = m ? m[1].toUpperCase() : opt.trim();
            text = opt.replace(/^([A-D])\\b[\\.、\\s-]*/i, '').trim();
          } else {
            key = String(opt.key || '').toUpperCase();
            text = opt.text || '';
          }
          var btn = el('button', 'option');
          btn.dataset.key = key;
          btn.textContent = (key ? key + '. ' : '') + text;
          btn.addEventListener('click', function () {
            if (locked) return;
            optionsWrap.querySelectorAll('.option').forEach(function (b) {
              b.classList.remove('selected', 'correct', 'wrong');
            });
            btn.classList.add('selected');
            if (answerKey && key === answerKey) {
              btn.classList.add('correct');
              resultLine.textContent = '结果：正确';
              resultLine.className = 'example-result correct';
            } else {
              btn.classList.add('wrong');
              resultLine.textContent = '结果：错误';
              resultLine.className = 'example-result wrong';
            }
            if (answerKey) {
              var answerLine = box.querySelector('.example-answer');
              if (!answerLine) {
                answerLine = el('div', 'example-line example-answer', '正确答案：' + answerKey);
                box.appendChild(answerLine);
              } else {
                answerLine.textContent = '正确答案：' + answerKey;
              }
            }
            if (ex.analysis) {
              analysisLine.style.display = 'block';
              if (analysisTitle) analysisTitle.style.display = 'block';
            }
            locked = true;
            optionsWrap.querySelectorAll('.option').forEach(function (b) {
              b.disabled = true;
              b.classList.add('locked');
            });
          });
          optionsWrap.appendChild(btn);
        });
        box.appendChild(optionsWrap);
        box.appendChild(resultLine);
        if (ex.analysis) {
          if (analysisTitle) box.appendChild(analysisTitle);
          box.appendChild(analysisLine);
        }
      } else {
        if (ex.answer) {
          box.appendChild(el('div', 'example-title', '答案'));
          box.appendChild(el('div', 'example-line', ex.answer));
        }
        if (ex.analysis) {
          box.appendChild(el('div', 'example-title', '解析'));
          box.appendChild(el('div', 'example-line', ex.analysis));
        }
      }
      wrap.appendChild(box);
    });
    return wrap;
  }

  function imagesField(images) {
    var wrap = el('div', 'images');
    images.forEach(function (img) {
      var imgEl = document.createElement('img');
      imgEl.src = img.src;
      imgEl.alt = img.alt || '';
      wrap.appendChild(imgEl);
      if (img.caption) wrap.appendChild(el('div', 'caption', img.caption));
    });
    return wrap;
  }

  function notesField(notes) {
    var wrap = el('div', 'notes');
    wrap.textContent = notes.join('；');
    return wrap;
  }

  function contentBlock(text) {
    var wrap = el('div', 'content-block');
    text.split(/\n+/).forEach(function (lineText, idx) {
      var t = lineText.trim();
      if (idx === 0 && t.indexOf('概念：') === 0) {
        t = t.slice('概念：'.length).trim();
      }
      if (t) wrap.appendChild(el('p', '', t));
    });
    return wrap;
  }

  function firstLine(text) {
    if (!text) return '';
    return text.split(/\n+/)[0].trim();
  }

  function renderGlossaryItem(p, idx) {
    var item = el('div', 'glossary-item');
    if (p.id) item.id = 'point-' + p.id;
    var header = el('div', 'glossary-header');
    header.appendChild(el('div', 'glossary-term', p.title || ''));
    header.appendChild(el('div', 'glossary-num', String(idx + 1)));
    item.appendChild(header);
    var defWrap = el('div', 'glossary-def');
    function addLine(text) {
      if (!text) return;
      var t = String(text).trim();
      if (!t || t === '无') return;
      defWrap.appendChild(el('div', 'glossary-line', t));
    }
    if (p.summary) addLine(p.summary);
    if (p.content) {
      p.content.split(/\n+/).forEach(function (lineText) { addLine(lineText); });
    }
    if (p.rules) addLine(p.rules);
    if (p.pitfalls && p.pitfalls.length) {
      addLine('易错点：' + p.pitfalls.join('；'));
    }
    if (p.examples && p.examples.length && p.examples[0].question) {
      addLine('例：' + p.examples[0].question);
    }
    if (defWrap.childNodes.length) item.appendChild(defWrap);
    return item;
  }

  function renderPoint(p, idx) {
    var point = el('div', 'point');
    if (p.id) point.id = 'point-' + p.id;
    void idx;

    var fieldIndex = 0;
    function addField(node) {
      if (!node) return;
      if (fieldIndex === 0) node.classList.add('field-first');
      fieldIndex += 1;
      point.appendChild(node);
    }

    if (p.content) addField(fieldBlock('概念', contentBlock(p.content)));
    if (p.summary) addField(fieldBlock('总结', p.summary));
    if (p.conclusion) addField(fieldBlock('结论', p.conclusion));
    if (p.rules) addField(fieldBlock('规则', p.rules));
    if (p.pitfalls && p.pitfalls.length) addField(fieldBlock('易错点', pitfallsBlock(p.pitfalls)));
    if (p.steps && p.steps.length) addField(fieldBlock('解题步骤', stepsBlock(p.steps)));
    if (p.examples && p.examples.length) addField(fieldBlock('例题', examplesBlock(p.examples)));
    if (p.images && p.images.length) addField(fieldBlock('图片', imagesField(p.images)));
    if (p.notes && p.notes.length) addField(fieldBlock('备注', notesField(p.notes)));

    return point;
  }

  function showEmpty() {
    if (content) content.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
  }

  function hideEmpty() {
    if (content) content.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
  }

  function renderContent(selection, focusPointId) {
    content.innerHTML = '';
    if (!selection || !selection.topic || !selection.topic.points || selection.topic.points.length === 0) {
      showEmpty();
      return;
    }
    saveSelection(selection);
    var modSection = el('section', 'module');
    modSection.id = 'module-' + selection.module.id;
    var topicDiv = el('div', 'topic');
    topicDiv.id = 'topic-' + selection.topic.id;
    if (selection.topic.type === 'glossary') {
      selection.topic.points.forEach(function (p, idx) { topicDiv.appendChild(renderGlossaryItem(p, idx)); });
    } else {
      selection.topic.points.forEach(function (p, idx) { topicDiv.appendChild(renderPoint(p, idx)); });
    }
    modSection.appendChild(topicDiv);
    content.appendChild(modSection);
    hideEmpty();
    if (focusPointId) {
      var target = document.getElementById('point-' + focusPointId);
      if (target) {
        setTimeout(function () {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      }
    }
  }

  function saveSelection(selection) {
    if (!selection || !selection.module) return;
    var payload = {
      moduleId: selection.module.id,
      subId: selection.sub ? selection.sub.id : null,
      topicId: selection.topic ? selection.topic.id : null
    };
    try {
      localStorage.setItem(selectionKey, JSON.stringify(payload));
    } catch (e) {
      /* ignore */
    }
  }

  function loadSelection() {
    try {
      var raw = localStorage.getItem(selectionKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setBreadcrumb(data, selection) {
    if (!breadcrumb || !selection || !selection.module) return;
    breadcrumb.innerHTML = '当前位置：';
    var moduleName = selection.module.name || '模块';
    var hasSubmodules = !!selection.module.submodules;
    var moduleHasSingleTopic = !hasSubmodules && selection.module.topics && selection.module.topics.length === 1;
    var parts = [{ name: moduleName, type: 'module' }];
    if (!moduleHasSingleTopic) {
      if (hasSubmodules && selection.sub) {
        parts.push({ name: selection.sub.name, type: 'sub' });
      }
      if (selection.topic) {
        parts.push({ name: selection.topic.name, type: 'topic' });
      }
    }

    parts.forEach(function (p, idx) {
      var btn = document.createElement('button');
      btn.textContent = p.name;
      btn.addEventListener('click', function () {
        if (p.type === 'module') {
          var sel = findSelection(data, selection.module.id, null, null);
          setBreadcrumb(data, sel);
          renderContent(sel);
          return;
        }
        if (p.type === 'sub' && hasSubmodules && selection.sub) {
          var selSub = findSelection(data, selection.module.id, selection.sub.id, null);
          setBreadcrumb(data, selSub);
          renderContent(selSub);
          return;
        }
        if (p.type === 'topic' && selection.topic) {
          var selTopic = findSelection(data, selection.module.id, selection.sub ? selection.sub.id : null, selection.topic.id);
          setBreadcrumb(data, selTopic);
          renderContent(selTopic);
        }
      });
      breadcrumb.appendChild(btn);
      if (idx < parts.length - 1) {
        var sep = document.createElement('span');
        sep.textContent = '/';
        breadcrumb.appendChild(sep);
      }
    });
  }

  function findSelection(data, moduleId, subId, topicId) {
    var mod = data.modules.find(function (m) { return m.id === moduleId; });
    if (!mod) return null;
    var topic = null;
    if (mod.submodules) {
      var sub = mod.submodules.find(function (s) { return s.id === subId; });
      if (!sub) return { module: mod, sub: null, topic: null };
      if (topicId) topic = sub.topics.find(function (t) { return t.id === topicId; });
      if (!topic) topic = sub.topics.find(function (t) { return (t.points || []).length > 0; });
      return { module: mod, sub: sub, topic: topic || null };
    } else {
      if (topicId) topic = mod.topics.find(function (t) { return t.id === topicId; });
      if (!topic) topic = mod.topics.find(function (t) { return (t.points || []).length > 0; });
      return { module: mod, sub: null, topic: topic || null };
    }
  }

  function setActive(btn) {
    document.querySelectorAll('.tree button').forEach(function (b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
  }

  function renderTree(data) {
    tree.innerHTML = '';
    data.modules.forEach(function (mod) {
      var moduleLi = el('li');
      var moduleBtn = el('button', 'level-1');
      moduleBtn.innerHTML = '<span>' + mod.name + '</span><span class="badge">' + countPointsInModule(mod) + '</span>';
      moduleBtn.addEventListener('click', function () {
        setActive(moduleBtn);
        var sel = findSelection(data, mod.id, null, null);
        setBreadcrumb(data, sel);
        renderContent(sel);
        drawer.classList.remove('open');
      });
      moduleLi.appendChild(moduleBtn);

      var childUl = el('ul');
      var isEnglish = mod.id === 'english';
      if (!isEnglish) {
        if (mod.submodules) {
          mod.submodules.forEach(function (sub) {
            var subLi = el('li');
            var subBtn = el('button', 'level-2');
            var subCount = sub.topics.reduce(function (sum, t) { return sum + countPointsInTopic(t); }, 0);
            subBtn.innerHTML = '<span>' + sub.name + '</span><span class="badge">' + subCount + '</span>';
            subBtn.addEventListener('click', function () {
              setActive(subBtn);
              var sel = findSelection(data, mod.id, sub.id, null);
              setBreadcrumb(data, sel);
              renderContent(sel);
              drawer.classList.remove('open');
            });
            subLi.appendChild(subBtn);

            var topicUl = el('ul');
            sub.topics.forEach(function (topic) {
              var topicLi = el('li');
              var topicBtn = el('button', 'level-3');
              var tCount = countPointsInTopic(topic);
              topicBtn.innerHTML = '<span>' + topic.name + '</span><span class="badge">' + tCount + '</span>';
              topicBtn.addEventListener('click', function () {
                setActive(topicBtn);
                var sel = findSelection(data, mod.id, sub.id, topic.id);
                setBreadcrumb(data, sel);
                renderContent(sel);
                drawer.classList.remove('open');
              });
              topicLi.appendChild(topicBtn);
              topicUl.appendChild(topicLi);
            });

            subLi.appendChild(topicUl);
            childUl.appendChild(subLi);
          });
        } else {
          mod.topics.forEach(function (topic) {
            var topicLi = el('li');
            var topicBtn = el('button', 'level-2');
            var tCount = countPointsInTopic(topic);
            topicBtn.innerHTML = '<span>' + topic.name + '</span><span class="badge">' + tCount + '</span>';
            topicBtn.addEventListener('click', function () {
              setActive(topicBtn);
              var sel = findSelection(data, mod.id, null, topic.id);
              setBreadcrumb(data, sel);
              renderContent(sel);
              drawer.classList.remove('open');
            });
            topicLi.appendChild(topicBtn);
            childUl.appendChild(topicLi);
          });
        }
      }

      moduleLi.appendChild(childUl);
      tree.appendChild(moduleLi);
    });
  }

  function buildSearchIndex(data) {
    var items = [];
    data.modules.forEach(function (mod) {
      if (mod.submodules) {
        mod.submodules.forEach(function (sub) {
          sub.topics.forEach(function (topic) {
            (topic.points || []).forEach(function (p) {
              items.push(makeSearchItem(mod, sub, topic, p));
            });
          });
        });
      } else {
        mod.topics.forEach(function (topic) {
          (topic.points || []).forEach(function (p) {
            items.push(makeSearchItem(mod, null, topic, p));
          });
        });
      }
    });
    return items;
  }

  function normalize(text) {
    return String(text || '').toLowerCase();
  }

  function makeSearchItem(mod, sub, topic, p) {
    var labelParts = [mod.name];
    if (sub) labelParts.push(sub.name);
    if (topic) labelParts.push(topic.name);
    var title = p.title || '';
    var label = labelParts.join(' / ') + (title ? ' · ' + title : '');
    var fields = [
      p.title,
      p.summary,
      p.content,
      p.conclusion,
      p.rules,
      (p.pitfalls || []).join(' '),
      (p.steps || []).join(' '),
      (p.examples || []).map(function (ex) { return [ex.question, ex.answer, ex.analysis].join(' '); }).join(' ')
    ].join(' ');
    return {
      label: label,
      keyword: normalize(label + ' ' + fields),
      moduleId: mod.id,
      subId: sub ? sub.id : null,
      topicId: topic.id,
      pointId: p.id || null
    };
  }

  function renderSearchResults(list, data) {
    if (!searchResults) return;
    searchResults.innerHTML = '';
    if (!list.length) {
      searchResults.classList.remove('open');
      return;
    }
    list.forEach(function (item) {
      var btn = el('button', 'search-item', item.label);
      btn.addEventListener('click', function () {
        var sel = findSelection(data, item.moduleId, item.subId, item.topicId);
        setBreadcrumb(data, sel);
        renderContent(sel, item.pointId);
        if (searchResults) searchResults.classList.remove('open');
      });
      searchResults.appendChild(btn);
    });
    searchResults.classList.add('open');
  }

  function attachSearch(data) {
    if (!searchInput || !searchResults) return;
    searchIndex = buildSearchIndex(data);
    searchInput.addEventListener('input', function () {
      var q = normalize(searchInput.value.trim());
      if (!q) {
        searchResults.classList.remove('open');
        searchResults.innerHTML = '';
        return;
      }
      var matched = searchIndex.filter(function (item) { return item.keyword.indexOf(q) !== -1; }).slice(0, 10);
      renderSearchResults(matched, data);
    });
    document.addEventListener('click', function (e) {
      if (!searchResults.contains(e.target) && e.target !== searchInput) {
        searchResults.classList.remove('open');
      }
    });
  }

  function init(data) {
    if (pageTitle && data.title) pageTitle.textContent = data.title;
    renderTree(data);
    var stored = loadSelection();
    var sel = null;
    if (stored && stored.moduleId) {
      sel = findSelection(data, stored.moduleId, stored.subId, stored.topicId);
      if (sel && (!sel.topic || !sel.topic.points || sel.topic.points.length === 0)) {
        sel = null;
      }
    }
    if (!sel) {
      var firstModule = data.modules.find(function (m) { return countPointsInModule(m) > 0; });
      if (firstModule) {
        sel = findSelection(data, firstModule.id, null, null);
      }
    }
    if (sel) {
      setBreadcrumb(data, sel);
      renderContent(sel);
    } else {
      renderContent(null);
    }
    attachSearch(data);
  }

  function loadData() {
    fetch('data.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) { init(data); })
      .catch(function () {
        if (emptyState) {
          emptyState.style.display = 'block';
          emptyState.textContent = '数据加载失败';
        }
      });
  }

  openBtn.addEventListener('click', function () { drawer.classList.add('open'); });
  closeBtn.addEventListener('click', function () { drawer.classList.remove('open'); });
  drawer.addEventListener('click', function (e) { if (e.target === drawer) drawer.classList.remove('open'); });
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  if (scrollTopFab) {
    scrollTopFab.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  if (scrollTopFab) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 200) {
        scrollTopFab.classList.add('show');
      } else {
        scrollTopFab.classList.remove('show');
      }
    });
  }

  loadData();
})();
