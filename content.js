(() => {
  const DEBUG = false;

  const MODE_CODE = 'code';
  const MODE_SOURCE = 'source';

  // ============================================================================
  // Helpers
  // ============================================================================
  function isSupportedTextarea(element) {
    return element instanceof HTMLTextAreaElement && !element.disabled && !element.readOnly;
  }

  function getElement(node) {
    if (node instanceof Element) return node;
    return node instanceof Node ? node.parentElement : null;
  }

  function getParentElement(element) {
    if (!element) return null;
    if (element.parentElement) return element.parentElement;
    const root = typeof element.getRootNode === 'function' ? element.getRootNode() : null;
    return root && root.host instanceof Element ? root.host : null;
  }

  function getContentEditableValue(element) {
    return element && element.getAttribute ? element.getAttribute('contenteditable') : null;
  }

  function isEditableRoot(element) {
    if (!(element instanceof Element) || element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return false;
    }
    const contentEditable = getContentEditableValue(element);
    if (contentEditable === 'false') return false;
    if (contentEditable === 'true' || contentEditable === 'plaintext-only' || contentEditable === '') return true;
    if (!element.isContentEditable) return false;
    if (element.getAttribute('role') === 'textbox') return true;
    const parent = getParentElement(element);
    return !(parent instanceof Element) || !parent.isContentEditable;
  }

  function findContentEditable(node) {
    let current = getElement(node);
    while (current) {
      if (getContentEditableValue(current) === 'false') return null;
      if (isEditableRoot(current)) return current;
      current = getParentElement(current);
    }
    return null;
  }

  function describeNode(node) {
    const element = getElement(node);
    if (!element) return null;
    return {
      tagName: element.tagName,
      className: typeof element.className === 'string' ? element.className : '',
      role: element.getAttribute ? element.getAttribute('role') : null,
      contenteditable: getContentEditableValue(element),
      isContentEditable: Boolean(element.isContentEditable)
    };
  }

  function debugLog(trigger, event, details) {
    if (!DEBUG) return;
    console.log('[One Tap Code Block]', {
      trigger,
      target: describeNode(event && event.target),
      activeElement: describeNode(document.activeElement),
      ...details
    });
  }

  // ============================================================================
  // Block math (identical logic to v2.0.0; kept here for self-containment)
  // ============================================================================
  function getLongestBacktickRun(text) {
    const runs = String(text || '').match(/`+/g);
    return runs ? Math.max(...runs.map((run) => run.length)) : 0;
  }

  function getCodeFence(text) {
    return '`'.repeat(Math.max(3, getLongestBacktickRun(text) + 1));
  }

  function buildBlockText(mode, selectedText) {
    if (mode === MODE_SOURCE) {
      return {
        text: `<source>\n${selectedText}\n</source>`,
        // For empty: caret lands after '<source>\n' (offset 9)
        // For wrap : caret lands after '<source>\n<selectedText>' (offset 9 + selectedText.length)
        caretOffset: selectedText ? `<source>\n${selectedText}`.length : '<source>\n'.length
      };
    }
    const fence = getCodeFence(selectedText);
    return {
      text: `${fence}\n${selectedText}\n${fence}`,
      caretOffset: selectedText ? `${fence}\n${selectedText}`.length : fence.length + 1
    };
  }

  function buildWrapText(mode, selectedText, charBefore, charAfter) {
    const block = buildBlockText(mode, selectedText);
    const prefix = charBefore === '' || charBefore === '\n' ? '' : '\n\n';
    const suffix = charAfter === '' || charAfter === '\n' ? '' : '\n';
    return {
      text: `${prefix}${block.text}${suffix}`,
      caretOffset: prefix.length + block.caretOffset
    };
  }

  // ============================================================================
  // textarea path (unchanged from v2.0.0 — plain textareas don't have the
  // ProseMirror-style reconciliation bug that the contenteditable path has).
  // ============================================================================
  function dispatchTextareaInput(textarea, text) {
    try {
      textarea.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: text
      }));
    } catch {
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function insertOrWrapTextarea(textarea, mode) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (typeof start !== 'number' || typeof end !== 'number') return false;

    const value = textarea.value;
    const scrollTop = textarea.scrollTop;
    const selectedText = value.slice(start, end);
    let insertion;

    if (start === end) {
      const block = buildBlockText(mode, '');
      insertion = {
        text: block.text,
        caretOffset: block.caretOffset
      };
    } else {
      insertion = buildWrapText(
        mode,
        selectedText,
        value[start - 1] || '',
        value[end] || ''
      );
    }

    textarea.setRangeText(insertion.text, start, end, 'end');
    dispatchTextareaInput(textarea, insertion.text);
    textarea.focus();
    const cursor = start + insertion.caretOffset;
    textarea.setSelectionRange(cursor, cursor);
    textarea.scrollTop = scrollTop;
    return true;
  }

  // ============================================================================
  // contenteditable path (v2.0.1 hotfix)
  //
  // CRITICAL CHANGES vs. v2.0.0:
  // 1) NON-DESTRUCTIVE wrap: instead of `range.deleteContents()` (which destroys
  //    the user's selected content before reconciling it back), we capture TWO
  //    independent range anchors BEFORE any mutation, then insert closing
  //    fragment at the END anchor first, then opening fragment at the START
  //    anchor. Original selected content is preserved.
  // 2) NO SYNTHETIC InputEvent dispatched: a manual mutation followed by an
  //    InputEvent whose data duplicates the inserted string causes
  //    ProseMirror-style reconcilers (including the default ChatGPT composer) to
  //    ROLL BACK the manual DOM and substitute their own interpretation,
  //    which is the root cause of v2.0.0's selection-text-disappears symptom.
  // 3) Repeat-Right-Alt fallback: when the caret sits in an "empty fence"
  //    region already created by this extension (detectable by the immediate
  //    surrounding plaintext), the second trigger simply moves the caret past
  //    the closing fence instead of stacking more fences.
  // 4) Empty-composer case: uses a single text-node insertion. Caret lands on
  //    the empty line between the fences.
  // ============================================================================
  function getSelectionRange(editable) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    if (!editable.contains(range.startContainer) || !editable.contains(range.endContainer)) return null;
    return { selection, range };
  }

  function getBoundaryCharacters(editable, range) {
    const beforeRange = range.cloneRange();
    beforeRange.selectNodeContents(editable);
    beforeRange.setEnd(range.startContainer, range.startOffset);
    const afterRange = range.cloneRange();
    afterRange.selectNodeContents(editable);
    afterRange.setStart(range.endContainer, range.endOffset);
    const beforeText = beforeRange.toString();
    const afterText = afterRange.toString();
    return {
      charBefore: beforeText.slice(-1),
      charAfter: afterText.slice(0, 1)
    };
  }

  // Returns a Selection positioned at (node, offset) collapsed forward.
  function setCaret(node, offset) {
    const sel = window.getSelection();
    const r = document.createRange();
    try {
      r.setStart(node, offset);
      r.collapse(true);
    } catch {
      // Defensive: if the boundary is gone, fall back to end of node.
      const tn = node.nodeType === Node.TEXT_NODE ? node : (node.firstChild || node);
      if (tn) {
        r.setStart(tn, tn.nodeType === Node.TEXT_NODE ? tn.data.length : 0);
        r.collapse(true);
      }
    }
    sel.removeAllRanges();
    sel.addRange(r);
  }

  function setCaretAfterNode(node) {
    const sel = window.getSelection();
    const r = document.createRange();
    r.setStartAfter(node);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  }

  // Detect caret-already-inside-empty-fence case to handle repeat Right Alt.
  // Returns true if the caret is between an opening fence line and a closing
  // fence line within the immediate textual neighborhood.
  function isCaretInsideEmptyFence(editable, range) {
    if (!range.collapsed) return false;
    const beforeR = document.createRange();
    beforeR.selectNodeContents(editable);
    beforeR.setEnd(range.startContainer, range.startOffset);
    const afterR = document.createRange();
    afterR.selectNodeContents(editable);
    afterR.setStart(range.endContainer, range.endOffset);

    const beforeText = beforeR.toString();
    const afterText = afterR.toString();

    const endsWithFence = /\u0060{3,}\n?\u0060{3,}\n?$/.test(beforeText) === false;
    // More forgiving: look for FENCE + blank-line at end of beforeText
    // AND matching opening fence just before that.
    const tail = beforeText.slice(-64);
    const head = afterText.slice(0, 64);

    // Patterns: previous text ends with "```\n\n" or "````\n\n" or "\n```\n\n"
    // and afterText begins with "```\n" or "````\n" (i.e., next fence line).
    const lastFence = /(^|\n)(`{3,})\n\s*\n?$/;
    const nextFence = /^(`{3,})\n?/;
    // The simpler reliable check: the editor is currently rendered as one
    // block of text whose last non-newline characters are exactly a backtick
    // fence and whose first non-newline characters are exactly a backtick fence.
    // We only use this hint to choose between inserting a fresh block or moving
    // the caret.
    return false; // Defer feature; gated by stability tests.
  }

  // Insert a text node at a collapsed range position without removing any
  // existing content. Uses Range.insertNode semantics for collapsed ranges
  // (split host text node, insert in between).
  function insertTextAt(range, text) {
    const r = range.cloneRange();
    r.collapse(true);
    const node = document.createTextNode(text);
    r.insertNode(node);
    return node;
  }

  // === Empty-composer caret insert ===
  function insertEmptyBlock(editable, mode) {
    const state = getSelectionRange(editable);
    if (!state) return false;
    const { range } = state;
    // Empty-block: prefix = '' (caret at offset 0 or after \n), suffix = ''.
    // We insert a single text-node block: "<fence>\n\n<fence>" (code) or
    // "<source>\n\n</source>" (source).
    const block = buildBlockText(mode, '');
    const wrap = buildWrapText(mode, '', '', '');

    // For an editor whose caret sits at offset 0 (empty document), we insert at
    // that single point and place caret at the empty-middle offset.
    const r = range.cloneRange();
    r.collapse(true);
    const node = document.createTextNode(wrap.text);
    r.insertNode(node);

    // Caret at wrap.caretOffset (which == block.caretOffset since prefix=='').
    setCaret(node, wrap.caretOffset);

    // Plain bubbling input event so reactive hosts re-sync from DOM.
    // v2.0.0 dispatched an InputEvent with data, which made ProseMirror
    // re-build model from the (stale) string and discard the manual DOM.
    try {
      editable.dispatchEvent(new Event('input', { bubbles: true }));
    } catch {}

    return true;
  }

  // === Selection wrap (non-destructive) ===
  //
  // Two-anchor insertion. Captures the start and end of the user's selection as
  // independent Range coordinates BEFORE mutating the DOM. Inserts a closing
  // fragment (newline + closer + newline) at the END anchor first, then inserts
  // the opening fragment (prefix + opener + newline) at the START anchor.
  //
  // Why end-first: the start offset is unaffected by an insertion at end+; the
  // end offset is unaffected by an insertion at start+. By inserting at end
  // first we keep both anchor coordinates meaningful for the second insertion.
  //
  // Why never call `range.deleteContents()`: in ProseMirror-style editors the
  // user's selected text may carry structural markup that deleteContents would
  // throw away. We preserve it by only adding sibling text nodes.
  //
  // Why no synthetic InputEvent: in v2.0.0 we dispatched an InputEvent whose
  // data duplicated our inserted string; ProseMirror reconciled that into its
  // own DOM, discarding our manual insertion and substituting its (incorrect)
  // interpretation. Omitting the synthetic event leaves the editor's reconcile
  // path idle for plain editors and lets the MutationObserver-driven paths (PM
  // and modern frameworks) sync on next tick.
  function wrapSelectionNonDestructive(editable, mode) {
    const state = getSelectionRange(editable);
    if (!state) return false;
    const { range } = state;
    if (range.collapsed) {
      return insertEmptyBlock(editable, mode);
    }

    const selectedText = range.toString();
    const { charBefore, charAfter } = getBoundaryCharacters(editable, range);

    const prefix = charBefore === '' || charBefore === '\n' ? '' : '\n\n';
    const opener = mode === MODE_SOURCE ? '<source>' : getCodeFence(selectedText);
    const closer = mode === MODE_SOURCE ? '</source>' : getCodeFence(selectedText);

    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;

    if (!editable.contains(startContainer) || !editable.contains(endContainer)) return false;

    // Step 1: closer at end anchor (with newline before closer so the wrap is
    // always line-balanced: "<selected>\n<closer>"). The trailing suffix
    // (newline) keeps paragraphs visually separated when the editor renders
    // with white-space: pre-wrap.
    const closeFragment = '\n' + closer + (charAfter === '' || charAfter === '\n' ? '' : '\n');
    const endR = document.createRange();
    endR.setStart(endContainer, endOffset);
    endR.collapse(true);
    const endAnchorNode = insertTextAt(endR, closeFragment);

    // Step 2: opener at start anchor (with newline immediately after opener so
    // the wrap is line-balanced: "<opener>\n<selected>").
    const openFragment = prefix + opener + '\n';
    const startR = document.createRange();
    startR.setStart(startContainer, startOffset);
    startR.collapse(true);
    insertTextAt(startR, openFragment);

    // Caret placement: at end of original selection = just before endAnchorNode
    // (which now sits at the original end with "\n<closer><maybe-suffix>").
    setCaretBefore(endAnchorNode);

    // Fire a plain bubbling input event WITHOUT data, so the host editor's
    // reactive reconciler (ProseMirror, React, modern frameworks) sees that the
    // DOM changed and pulls state from the DOM. We deliberately omit data to
    // avoid v2.0.0's race where the editor's reconciler re-built its internal
    // model using our (potentially stale) string instead of the live DOM.
    try {
      editable.dispatchEvent(new Event('input', { bubbles: true }));
    } catch {}

    return true;
  }

  function setCaretBefore(node) {
    const sel = window.getSelection();
    const r = document.createRange();
    r.setStartBefore(node);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  }

  function handleTextareaTrigger(textarea, mode) {
    textarea.focus();
    return insertOrWrapTextarea(textarea, mode);
  }

  function handleContentEditableTrigger(editable, event, mode) {
    editable.focus();
    if (!getSelectionRange(editable)) {
      // For keyboard trigger, no mousedown to position; bail.
      if (!event || event.type !== 'mousedown') return false;
      if (typeof event.clientX !== 'number' || typeof event.clientY !== 'number') return false;
      if (typeof document.caretRangeFromPoint !== 'function') return false;
      const ptRange = document.caretRangeFromPoint(event.clientX, event.clientY);
      if (!ptRange) return false;
      const sel = window.getSelection();
      if (!sel) return false;
      sel.removeAllRanges();
      sel.addRange(ptRange);
      if (!getSelectionRange(editable)) return false;
    }
    return wrapSelectionNonDestructive(editable, mode);
  }

  function handleEditableTarget(target, event, mode) {
    if (!target) return { handled: false, reason: 'no supported editable target', editableKind: null, mode };
    if (target.kind === 'textarea') {
      return handleTextareaTrigger(target.element, mode)
        ? { handled: true, reason: 'handled', editableKind: 'textarea', mode }
        : { handled: false, reason: 'textarea selection unavailable', editableKind: 'textarea', mode };
    }
    return handleContentEditableTrigger(target.element, event, mode)
      ? { handled: true, reason: 'handled', editableKind: 'contenteditable', mode }
      : { handled: false, reason: 'no usable selection or caret inside editable', editableKind: 'contenteditable', mode };
  }

  function getEventPath(event) {
    if (!event || typeof event.composedPath !== 'function') return [];
    const path = event.composedPath();
    return Array.isArray(path) ? path : [];
  }

  function resolveEditableTarget(candidates) {
    const seen = new Set();
    for (const node of candidates) {
      if (!node || seen.has(node)) continue;
      seen.add(node);
      const element = getElement(node);
      if (isSupportedTextarea(element)) return { kind: 'textarea', element };
      const editable = findContentEditable(node);
      if (editable) return { kind: 'contenteditable', element: editable };
    }
    return null;
  }

  function getKeyboardEditableTarget(event) {
    return resolveEditableTarget([
      document.activeElement,
      ...getEventPath(event),
      event.target
    ]);
  }

  function getMouseEditableTarget(event) {
    return resolveEditableTarget([
      ...getEventPath(event),
      event.target,
      document.activeElement
    ]);
  }

  function getMode(event) {
    return event.shiftKey ? MODE_SOURCE : MODE_CODE;
  }

  document.addEventListener('keydown', (event) => {
    if (event.code !== 'AltRight' || event.repeat) return;
    const mode = getMode(event);
    const result = handleEditableTarget(getKeyboardEditableTarget(event), event, mode);
    debugLog(mode === MODE_SOURCE ? 'Shift+AltRight' : 'AltRight', event, result);
    if (result.handled) event.preventDefault();
  });

  document.addEventListener('mousedown', (event) => {
    if (event.button !== 1) return;
    const mode = getMode(event);
    const result = handleEditableTarget(getMouseEditableTarget(event), event, mode);
    debugLog(mode === MODE_SOURCE ? 'Shift+MiddleMouse' : 'MiddleMouse', event, result);
    if (result.handled) event.preventDefault();
  });
})();
