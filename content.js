(() => {
  function isSupportedTextarea(element) {
    return element instanceof HTMLTextAreaElement && !element.disabled && !element.readOnly;
  }

  function getElement(node) {
    if (node instanceof Element) {
      return node;
    }

    return node instanceof Node ? node.parentElement : null;
  }

  function findContentEditable(node) {
    const element = getElement(node);

    if (!element) {
      return null;
    }

    const editable = element.closest('[contenteditable="true"], [contenteditable="plaintext-only"], [contenteditable=""]');

    if (!editable) {
      return null;
    }

    let current = element;

    while (current && current !== editable) {
      if (current.getAttribute && current.getAttribute('contenteditable') === 'false') {
        return null;
      }

      current = current.parentElement;
    }

    return editable.getAttribute('contenteditable') === 'false' ? null : editable;
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

  document.addEventListener('keydown', (event) => {
    if (event.code !== 'AltRight' || event.repeat) {
      return;
    }

    const activeElement = document.activeElement;

    if (isSupportedTextarea(activeElement)) {
      if (insertOrWrapTextarea(activeElement)) {
        event.preventDefault();
      }

      return;
    }

    const editable = findContentEditable(event.target) || findContentEditable(activeElement);

    if (!editable) {
      return;
    }

    if (insertOrWrapContentEditable(editable)) {
      event.preventDefault();
    }
  });
})();
