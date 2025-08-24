export default function DotGrid() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.15] dark:opacity-[0.1]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '12px 12px',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 0.5px, transparent 0.5px)`,
          backgroundSize: '48px 48px',
          backgroundPosition: '24px 24px',
        }}
      />
    </div>
  );
}
