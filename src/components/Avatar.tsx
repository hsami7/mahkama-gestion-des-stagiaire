import React from 'react';

export default function Avatar({ src, name, size = 32, radius, className, style, onClick, border }: {
  src?: string | null | undefined;
  name?: string | null;
  size?: number;
  radius?: number | string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  border?: React.CSSProperties['border'];
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={className}
        onClick={onClick}
        style={{
          width: size,
          height: size,
          borderRadius: radius ?? '50%',
          objectFit: 'cover',
          flexShrink: 0,
          cursor: onClick ? 'zoom-in' : undefined,
          border,
          ...style,
        }}
      />
    );
  }
  const initial = (name || '?').trim().charAt(0);
  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? '50%',
        background: 'var(--gold)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        flexShrink: 0,
        cursor: onClick ? 'zoom-in' : undefined,
        border,
        ...style,
      }}
    >
      <span style={{ fontSize: size * 0.4, lineHeight: 1 }}>{initial}</span>
    </div>
  );
}
