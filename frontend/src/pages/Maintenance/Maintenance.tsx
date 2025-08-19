import type { FC } from 'react';

type MaintenanceProps = {
  siteName?: string;
};

const Maintenance: FC<MaintenanceProps> = ({ siteName = 'ConvertFlix' }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a, #111827)',
        color: '#e5e7eb',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 700 }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>
          {siteName} is under maintenance
        </h1>
        <p style={{ opacity: 0.9, marginBottom: '1.25rem' }}>
          We’re performing some scheduled work to improve your experience. The site will be back shortly.
        </p>
        <div style={{ opacity: 0.7, fontSize: '0.95rem' }}>
          Thank you for your patience.
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
