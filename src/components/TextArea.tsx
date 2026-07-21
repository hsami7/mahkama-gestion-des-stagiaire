import type { TextareaHTMLAttributes } from 'react';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export default function TextArea({ label, style, ...rest }: Props) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <textarea
        className="input"
        style={{
          width: '100%',
          padding: '11px 13px',
          border: '1px solid var(--line)',
          borderRadius: 8,
          fontFamily: 'inherit',
          fontSize: 13.5,
          background: 'var(--paper)',
          resize: 'vertical',
          minHeight: 90,
          ...style
        }}
        {...rest}
      />
    </div>
  );
}
