/**
 * cc-tool embed widget
 *
 * Usage: drop these two lines into a WordPress Custom HTML block:
 *   <div id="cc-tool"></div>
 *   <script src="https://common-cause.github.io/{repo}/src/embed.js"></script>
 *
 * The script finds the #cc-tool div, loads data/tree.json relative to itself,
 * and renders the decision tree. No dependencies, no build step.
 */
(function () {
  "use strict";

  // --- Resolve base URL ---
  // We need to know where tree.json lives relative to this script.
  // document.currentScript works when the script loads synchronously;
  // the querySelectorAll fallback covers deferred / async cases.
  var scriptEl = document.currentScript;
  if (!scriptEl) {
    var scripts = document.querySelectorAll("script[src]");
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf("embed.js") !== -1) {
        scriptEl = scripts[i];
        break;
      }
    }
  }
  var baseUrl = scriptEl
    ? scriptEl.src.replace(/\/src\/embed\.js([?#].*)?$/, "/")
    : "./";

  // --- Inject stylesheet ---
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = baseUrl + "src/embed.css";
  document.head.appendChild(link);

  // --- Find mount point ---
  var mount = document.getElementById("cc-tool");
  if (!mount) {
    console.warn("[cc-tool] No element with id='cc-tool' found on this page.");
    return;
  }
  mount.classList.add("cc-tool");

  // --- Load tree ---
  fetch(baseUrl + "data/tree.json")
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (tree) {
      initTool(tree);
    })
    .catch(function (err) {
      mount.innerHTML =
        '<p class="cc-tool__error">Unable to load tool content. Please try again later.</p>';
      console.error("[cc-tool] Failed to load tree.json:", err);
    });

  // --- Tool logic ---
  function initTool(tree) {
    var meta = tree.meta || {};
    var nodes = tree.nodes || {};
    // Each history entry is { nodeId, choiceIndex } — choiceIndex points into the
    // question node's `choices` array, so we can rebuild the breadcrumb trail.
    var history = [];
    var current = meta.start;

    function render() {
      mount.innerHTML = "";

      if (meta.title) {
        var h = el("h2", "cc-tool__title");
        h.textContent = meta.title;
        mount.appendChild(h);
      }

      if (history.length) {
        mount.appendChild(renderTrail());
      }

      var node = nodes[current];
      if (!node) {
        var err = el("p", "cc-tool__error");
        err.textContent = "Content not found for node: " + current;
        mount.appendChild(err);
        return;
      }

      if (node.type === "question") {
        renderQuestion(node);
      } else if (node.type === "result") {
        renderResult(node);
      } else {
        var unknown = el("p", "cc-tool__error");
        unknown.textContent = "Unknown node type: " + node.type;
        mount.appendChild(unknown);
      }
    }

    function renderQuestion(node) {
      var section = document.createElement("section");
      section.className = "cc-tool__question";

      var questionId = "cc-tool-q-" + current;
      section.setAttribute("aria-labelledby", questionId);

      var qText = el("p", "cc-tool__question-text");
      qText.id = questionId;
      qText.textContent = node.text;
      section.appendChild(qText);

      if (node.hint) {
        var hint = el("p", "cc-tool__hint");
        hint.textContent = node.hint;
        section.appendChild(hint);
      }

      var choices = el("div", "cc-tool__choices");
      (node.choices || []).forEach(function (choice, idx) {
        var btn = document.createElement("button");
        btn.className = "cc-tool__choice";
        btn.type = "button";
        btn.textContent = choice.label;
        btn.addEventListener("click", function () {
          history.push({ nodeId: current, choiceIndex: idx });
          current = choice.next;
          render();
        });
        choices.appendChild(btn);
      });
      section.appendChild(choices);

      if (history.length > 0) {
        section.appendChild(makeBackButton());
      }

      mount.appendChild(section);
    }

    function renderResult(node) {
      var section = document.createElement("section");
      section.className =
        "cc-tool__result cc-tool__result--" + (node.status || "default");

      var heading = el("h3", "cc-tool__result-heading");
      heading.setAttribute("role", "alert");
      heading.textContent = node.heading || "";
      section.appendChild(heading);

      if (node.body) {
        var body = el("p", "cc-tool__result-body");
        body.textContent = node.body;
        section.appendChild(body);
      }

      if (node.links && node.links.length) {
        var ul = el("ul", "cc-tool__links");
        node.links.forEach(function (lnk) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = lnk.url;
          a.textContent = lnk.label;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          li.appendChild(a);
          ul.appendChild(li);
        });
        section.appendChild(ul);
      }

      section.appendChild(makeBackButton());

      if (node.signup && node.signup.embed_code) {
        section.appendChild(renderSignup(node.signup));
      }

      mount.appendChild(section);
    }

    function renderSignup(signup) {
      var wrap = el("div", "cc-tool__signup");

      if (signup.heading) {
        var h = el("h4", "cc-tool__signup-heading");
        h.textContent = signup.heading;
        wrap.appendChild(h);
      }

      if (signup.body) {
        var p = el("p", "cc-tool__signup-body");
        p.textContent = signup.body;
        wrap.appendChild(p);
      }

      // Inject AN embed HTML; AN's own script handles rendering.
      // an_tag is available here if you need to pass it to AN via a hidden field
      // before the form renders — see Action Network embed documentation.
      var anWrap = document.createElement("div");
      anWrap.innerHTML = signup.embed_code || "";
      wrap.appendChild(anWrap);

      return wrap;
    }

    function makeBackButton() {
      var btn = document.createElement("button");
      btn.className = "cc-tool__back";
      btn.type = "button";
      btn.textContent = "\u2190 Back";
      btn.addEventListener("click", function () {
        if (history.length) {
          var prev = history.pop();
          current = prev.nodeId;
          render();
        }
      });
      return btn;
    }

    function renderTrail() {
      var nav = document.createElement("nav");
      nav.className = "cc-tool__trail";
      nav.setAttribute("aria-label", "Steps so far");

      var ol = el("ol", "cc-tool__trail-list");

      history.forEach(function (step, idx) {
        var qNode = nodes[step.nodeId];
        if (!qNode || qNode.type !== "question") return;
        var choice = (qNode.choices || [])[step.choiceIndex];
        if (!choice) return;

        var topic = qNode.topic || qNode.text || "";
        var summary = choice.summary || choice.label || "";

        var li = el("li", "cc-tool__trail-item");

        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "cc-tool__trail-chip";
        chip.setAttribute("aria-label",
          "Go back to: " + topic + " \u2014 answered " + summary);

        var topicEl = el("span", "cc-tool__trail-topic");
        topicEl.textContent = topic;
        chip.appendChild(topicEl);

        var sepEl = el("span", "cc-tool__trail-sep");
        sepEl.textContent = ": ";
        chip.appendChild(sepEl);

        var answerEl = el("span", "cc-tool__trail-answer");
        answerEl.textContent = summary;
        chip.appendChild(answerEl);

        chip.addEventListener("click", function () {
          current = step.nodeId;
          history = history.slice(0, idx);
          render();
        });

        li.appendChild(chip);
        ol.appendChild(li);
      });

      nav.appendChild(ol);
      return nav;
    }

    // Kick off
    render();
  }

  // --- Helpers ---
  function el(tag, className) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    return e;
  }
})();
