(() => {
  const DEBUG = false;

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

  function dispatchTextareaInput(textarea) {
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function dispatchContentEditableInput(editable) {
    try {
      editable.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: null
      }));
    } catch {
      editable.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function insertOrWrapTextarea(textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (typeof start !== 'number' || typeof end !== 'number') {
      return false;
    }

    const value = textarea.value;
    const scrollTop = textarea.scrollTop;
    const selectedText = value.slice(start, end);
    let insertedText;
    let cursor;

    if (start === end) {
      insertedText = '```\n\n```';
      cursor = start + 4;
    } else {
      const charBefore = value[start - 1];
      const charAfter = value[end];
      const prefix = start === 0 || charBefore === '\n' ? '' : '\n\n';
      const suffix = end === value.length || charAfter === '\n' ? '' : '\n';

      insertedText = `${prefix}\`\`\`\n${selectedText}\n\`\`\`${suffix}`;
      cursor = start + prefix.length + 4 + selectedText.length;
    }

    textarea.value = value.slice(0, start) + insertedText + value.slice(end);
    dispatchTextareaInput(textarea);
    textarea.focus();
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

  function replaceSelectionWithText(selection, range, text, cursorOffset) {
    const textNode = document.createTextNode(text);

    range.deleteContents();
    range.insertNode(textNode);

    const nextRange = document.createRange();
    nextRange.setStart(textNode, cursorOffset);
    nextRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(nextRange);
  }

  function insertOrWrapContentEditable(editable) {
    const selectionState = getSelectionRange(editable);

    if (!selectionState) {
      return false;
    }

    const { selection, range } = selectionState;
    const selectedText = range.toString();
    let insertedText;
    let cursor;

    if (selection.isCollapsed) {
      insertedText = '```\n\n```';
      cursor = 4;
    } else {
      const { charBefore, charAfter } = getBoundaryCharacters(editable, range);
      const prefix = charBefore === '' || charBefore === '\n' ? '' : '\n\n';
      const suffix = charAfter === '' || charAfter === '\n' ? '' : '\n';

      insertedText = `${prefix}\`\`\`\n${selectedText}\n\`\`\`${suffix}`;
      cursor = prefix.length + 4 + selectedText.length;
    }

    replaceSelectionWithText(selection, range, insertedText, cursor);
    editable.focus();
    dispatchContentEditableInput(editable);

    return true;
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

  function handleTextareaTrigger(textarea) {
    textarea.focus();
    return insertOrWrapTextarea(textarea);
  }

  function handleContentEditableTrigger(editable, event) {
    editable.focus();

    if (!getSelectionRange(editable)) {
      if (!event || event.type !== 'mousedown' || !placeContentEditableCaret(editable, event)) {
        return false;
      }
    }

    return insertOrWrapContentEditable(editable);
  }

  function handleEditableTarget(target, event) {
    if (!target) {
      return { handled: false, reason: 'no supported editable target', editableKind: null };
    }

    if (target.kind === 'textarea') {
      return handleTextareaTrigger(target.element)
        ? { handled: true, reason: 'handled', editableKind: 'textarea' }
        : { handled: false, reason: 'textarea selection unavailable', editableKind: 'textarea' };
    }

    return handleContentEditableTrigger(target.element, event)
      ? { handled: true, reason: 'handled', editableKind: 'contenteditable' }
      : { handled: false, reason: 'no usable selection or caret inside editable', editableKind: 'contenteditable' };
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

  document.addEventListener('keydown', (event) => {
    if (event.code !== 'AltRight' || event.repeat) {
      return;
    }

    const result = handleEditableTarget(getKeyboardEditableTarget(event), event);
    debugLog('AltRight', event, result);

    if (result.handled) {
      event.preventDefault();
    }
  });

  document.addEventListener('mousedown', (event) => {
    if (event.button !== 1) {
      return;
    }

    const result = handleEditableTarget(getMouseEditableTarget(event), event);
    debugLog('MiddleMouse', event, result);

    if (result.handled) {
      event.preventDefault();
    }
  });
})();
