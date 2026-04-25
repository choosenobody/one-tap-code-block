(() => {
  const SUPPORTED_INPUT_TYPES = new Set([
    'text',
    'search',
    'url',
    'email',
    'password',
    'tel'
  ]);

  function isSupportedEditable(element) {
    if (element instanceof HTMLTextAreaElement) {
      return !element.disabled && !element.readOnly;
    }

    if (!(element instanceof HTMLInputElement)) {
      return false;
    }

    return !element.disabled && !element.readOnly && SUPPORTED_INPUT_TYPES.has(element.type);
  }

  function insertOrWrap(element) {
    const start = element.selectionStart;
    const end = element.selectionEnd;

    if (typeof start !== 'number' || typeof end !== 'number') {
      return false;
    }

    const value = element.value;
    const selectedText = value.slice(start, end);
    const insertedText = selectedText ? `\`\`\`\n${selectedText}\n\`\`\`` : '\`\`\`\n\n\`\`\`';
    const nextValue = value.slice(0, start) + insertedText + value.slice(end);

    element.value = nextValue;
    element.focus();

    const cursor = selectedText ? start + 4 + selectedText.length : start + 4;
    element.setSelectionRange(cursor, cursor);

    return true;
  }

  document.addEventListener('keydown', (event) => {
    if (event.code !== 'AltRight') {
      return;
    }

    const activeElement = document.activeElement;

    if (!isSupportedEditable(activeElement)) {
      return;
    }

    if (insertOrWrap(activeElement)) {
      event.preventDefault();
    }
  });
})();
