(() => {
  function isSupportedTextarea(element) {
    return element instanceof HTMLTextAreaElement && !element.disabled && !element.readOnly;
  }

  function insertOrWrap(textarea) {
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
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);
    textarea.scrollTop = scrollTop;

    return true;
  }

  document.addEventListener('keydown', (event) => {
    if (event.code !== 'AltRight' || event.repeat) {
      return;
    }

    const activeElement = document.activeElement;

    if (!isSupportedTextarea(activeElement)) {
      return;
    }

    if (insertOrWrap(activeElement)) {
      event.preventDefault();
    }
  });
})();
