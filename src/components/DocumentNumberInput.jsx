import { DOCUMENT_MAX_LENGTH, formatDocumentNumber, normalizeDocumentNumber } from "../tools/formValidation";

export default function DocumentNumberInput({ value, onChange, ...props }) {
  const number = normalizeDocumentNumber(String(value || ""));
  const displayed = /^\d*$/.test(number) ? formatDocumentNumber(number) : value;

  const update = (input, raw, cursor) => {
    const digits = raw.replace(/\D/g, "").slice(0, DOCUMENT_MAX_LENGTH);
    const beforeCursor = raw.slice(0, cursor).replace(/\D/g, "").slice(0, DOCUMENT_MAX_LENGTH).length;
    const formatted = formatDocumentNumber(digits);
    const position = beforeCursor + Math.floor(Math.max(0, beforeCursor - 1) / 4);
    input.value = formatted;
    input.setSelectionRange(position, position);
    onChange(digits);
  };

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      maxLength={DOCUMENT_MAX_LENGTH + Math.floor((DOCUMENT_MAX_LENGTH - 1) / 4)}
      value={displayed}
      onChange={(event) => {
        const input = event.target;
        update(input, input.value, input.selectionStart ?? input.value.length);
      }}
      onKeyDown={(event) => {
        const input = event.currentTarget;
        const cursor = input.selectionStart;
        if (cursor == null || cursor !== input.selectionEnd) return;
        if (event.key === "Backspace" && input.value[cursor - 1] === " " && cursor > 1) {
          event.preventDefault();
          update(input, input.value.slice(0, cursor - 2) + input.value.slice(cursor), cursor - 2);
        } else if (event.key === "Delete" && input.value[cursor] === " " && cursor + 1 < input.value.length) {
          event.preventDefault();
          update(input, input.value.slice(0, cursor) + input.value.slice(cursor + 2), cursor);
        }
      }}
    />
  );
}
