(() => {
  const DEBUG = false;

  const MODE_CODE = 'code';
  const MODE_SOURCE = 'source';

  function isSupportedTextarea(element) {
    return element instanceof HTMLTextAreaElement && !element.disabled && !element.readOnly;
  }

  function getElement(node) {
    if (node instanceof Element) {
      return node;
    }

    return node instanceof Node ? node.parentElement : null;
  }

  function getParentElement(element) {
    if (!element) {
      return null;
    }

    if (element.parentElement) {
      return element.parentElement;
    }

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

    if (contentEditable === 'false') {
      return false;
    }

    if (contentEditable === 'true' || contentEditable === 'plaintext-only' || contentEditable === '') {
      return true;
    }

    if (!element.isContentEditable) {
      return false;
    }

    if (element.getAttribute('role') === 'textbox') {
      return true;
    }

    const parent = getParentElement(element);
    return !(parent instanceof Element) || !parent.isContentEditable;
  }

  function findContentEditable(node) {
    let current = getElement(node);

    while (current) {
      if (getContentEditableValue(current) === 'false') {
        return null;
      }

      if (isEditableRoot(current)) {
        return current;
      }

      current = getParentElement(current);
    }

    return null;
  }

  function describeNode(node) {
    const element = getElement(node);

    if (!element) {
      return null;
    }

    return {
      tagName: element.tagName,
      className: typeof element.className === 'string' ? element.className : '',
      role: element.getAttribute ? element.getAttribute('role') : null,
      contenteditable: getContentEditableValue(element),
      isContentEditable: Boolean(element.isContentEditable)
    };
  }

  function debugLog(trigger, event, details) {
    if (!DEBUG) {
      return;
    }

    console.log('[One Tap Code Block]', {
      trigger,
      target: describeNode(event && event.target),
      activeElement: describeNode(document.activeElement),
      ...details
    });
  }

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

  function dispatchContentEditableInput(editable, text) {
    try {
      editable.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: text
      }));
    } catch {
      editable.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function getLongestBacktickRun(text) {
    const runs = String(text || '').match(/`+/g);
    return runs ? Math.max(...runs.map((run) => run.length)) : 0;
  }

  function getCodeFence(text) {
    return '`'.repeat(Math.max(3, getLongestBacktickRun(text) + 1));
  }

  function buildBlock(mode, selectedText) {
    if (mode === MODE_SOURCE) {
      return {
        text: `<source>\n${selectedText}\n</source>`,
        cursorOffset: selectedText ? `<source>\n${selectedText}`.length : '<source>\n'.length
      };
    }

    const fence = getCodeFence(selectedText);
    return {
      text: `${fence}\n${selectedText}\n${fence}`,
      cursorOffset: selectedText ? `${fence}\n${selectedText}`.length : fence.length + 1
    };
  }

  function getWrappedInsertion(mode, selectedText, charBefore, charAfter) {
    const block = buildBlock(mode, selectedText);
    const prefix = charBefore === '' || charBefore === '\n' ? '' : '\n\n';
    const suffix = charAfter === '' || charAfter === '\n' ? '' : '\n';

    return {
      text: `${prefix}${block.text}${suffix}`,
      cursorOffset: prefix.length + block.cursorOffset
    };
  }

  function insertOrWrapTextarea(textarea, mode) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (typeof start !== 'number' || typeof end !== 'number') {
      return false;
    }

    const value = textarea.value;
    const scrollTop = textarea.scrollTop;
    const selectedText = value.slice(start, end);
    let insertion;

    if (start === end) {
      const block = buildBlock(mode, '');
      insertion = {
        text: block.text,
        cursorOffset: block.cursorOffset
      };
    } else {
      insertion = getWrappedInsertion(
        mode,
        selectedText,
        value[start - 1] || '',
        value[end] || ''
      );
    }

    textarea.setRangeText(insertion.text, start, end, 'end');
    dispatchTextareaInput(textarea, insertion.text);
    textarea.focus();

    const cursor = start + insertion.cursorOffset;
    textarea.setSelectionRange(cursor, cursor);
    textarea.scrollTop = scrollTop;

    return true;
  }

  function getSelectionRange(editable) {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);

    if (!editable.contains(range.startContainer) || !editable.contains(range.endContainer)) {
      return null;
    }

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

  function moveCaretBackward(selection, characterCount) {
    let remaining = Math.max(0, characterCount);

    if (remaining === 0) {
      return true;
    }

    if (
      selection.anchorNode instanceof Text &&
      selection.isCollapsed &&
      selection.anchorOffset >= remaining
    ) {
      const range = document.createRange();
      range.setStart(selection.anchorNode, selection.anchorOffset - remaining);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    }

    if (typeof selection.modify !== 'function') {
      return false;
    }

    while (remaining > 0) {
      selection.modify('move', 'backward', 'character');
      remaining -= 1;
    }

    return true;
  }

  function replaceSelectionWithTextFallback(editable, selection, range, text, cursorOffset) {
    const textNode = document.createTextNode(text);

    range.deleteContents();
    range.insertNode(textNode);

    const nextRange = document.createRange();
    nextRange.setStart(textNode, Math.min(cursorOffset, textNode.data.length));
    nextRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(nextRange);

    dispatchContentEditableInput(editable, text);
    return true;
  }

  function insertTextNative(editable, selection, range, text, cursorOffset) {
    editable.focus();

    selection.removeAllRanges();
    selection.addRange(range);

    let inserted = false;

    try {
      inserted = document.execCommand('insertText', false, text);
    } catch {
      inserted = false;
    }

    if (!inserted) {
      return false;
    }

    moveCaretBackward(selection, text.length - cursorOffset);
    return true;
  }

  function insertOrWrapContentEditable(editable, mode) {
    const selectionState = getSelectionRange(editable);

    if (!selectionState) {
      return false;
    }

    const { selection, range } = selectionState;
    const selectedText = range.toString();
    const boundary = getBoundaryCharacters(editable, range);
    let insertion;

    if (selection.isCollapsed) {
      const block = buildBlock(mode, '');
      insertion = {
        text: block.text,
        cursorOffset: block.cursorOffset
      };
    } else {
      insertion = getWrappedInsertion(
        mode,
        selectedText,
        boundary.charBefore,
        boundary.charAfter
      );
    }

    // Prefer the direct Range path. Chromium's execCommand('insertText') has two
    // long-standing bugs that bite us here:
    //   1. Newlines in the data argument are silently dropped in many contexts
    //      (e.g. contenteditable="plaintext-only" editors such as ChatGPT), so
    //      "```\n\n```" lands as "``````".
    //   2. Some controlled editors run their own input rules against insertText
    //      transactions and may consume Markdown characters we inserted.
    // The Range path inserts a real text node with the newlines intact and lets
    // selection.model drift remain confined to the user's caret intent. We only
    // fall back to native execCommand when the Range path is impossible (e.g.
    // the editor has rejected our DOM mutation).
    const replaced = replaceSelectionWithTextFallback(
      editable,
      selection,
      range,
      insertion.text,
      insertion.cursorOffset
    );

    if (replaced) {
      return true;
    }

    return insertTextNative(
      editable,
      selection,
      range,
      insertion.text,
      insertion.cursorOffset
    );
  }

  function getPointRange(x, y) {
    if (typeof document.caretRangeFromPoint === 'function') {
      return document.caretRangeFromPoint(x, y);
    }

    if (typeof document.caretPositionFromPoint === 'function') {
      const position = document.caretPositionFromPoint(x, y);

      if (!position) {
        return null;
      }

      const range = document.createRange();
      range.setStart(position.offsetNode, position.offset);
      range.collapse(true);
      return range;
    }

    return null;
  }

  function placeContentEditableCaret(editable, event) {
    const range = getPointRange(event.clientX, event.clientY);

    if (!range || !editable.contains(range.startContainer) || !editable.contains(range.endContainer)) {
      return false;
    }

    const selection = window.getSelection();

    if (!selection) {
      return false;
    }

    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }

  function handleTextareaTrigger(textarea, mode) {
    textarea.focus();
    return insertOrWrapTextarea(textarea, mode);
  }

  function handleContentEditableTrigger(editable, event, mode) {
    editable.focus();

    if (!getSelectionRange(editable)) {
      if (!event || event.type !== 'mousedown' || !placeContentEditableCaret(editable, event)) {
        return false;
      }
    }

    return insertOrWrapContentEditable(editable, mode);
  }

  function handleEditableTarget(target, event, mode) {
    if (!target) {
      return { handled: false, reason: 'no supported editable target', editableKind: null, mode };
    }

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
    if (!event || typeof event.composedPath !== 'function') {
      return [];
    }

    const path = event.composedPath();
    return Array.isArray(path) ? path : [];
  }

  function resolveEditableTarget(candidates) {
    const seen = new Set();

    for (const node of candidates) {
      if (!node || seen.has(node)) {
        continue;
      }

      seen.add(node);

      const element = getElement(node);

      if (isSupportedTextarea(element)) {
        return { kind: 'textarea', element };
      }

      const editable = findContentEditable(node);

      if (editable) {
        return { kind: 'contenteditable', element: editable };
      }
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
    if (event.code !== 'AltRight' || event.repeat) {
      return;
    }

    const mode = getMode(event);
    const result = handleEditableTarget(getKeyboardEditableTarget(event), event, mode);
    debugLog(mode === MODE_SOURCE ? 'Shift+AltRight' : 'AltRight', event, result);

    if (result.handled) {
      event.preventDefault();
    }
  });

  document.addEventListener('mousedown', (event) => {
    if (event.button !== 1) {
      return;
    }

    const mode = getMode(event);
    const result = handleEditableTarget(getMouseEditableTarget(event), event, mode);
    debugLog(mode === MODE_SOURCE ? 'Shift+MiddleMouse' : 'MiddleMouse', event, result);

    if (result.handled) {
      event.preventDefault();
    }
  });
})();
