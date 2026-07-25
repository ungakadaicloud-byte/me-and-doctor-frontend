import { useClinic } from '../hooks/useClinicData';

export default function Header({ title, subtitle }) {
  const { clinic } = useClinic();

  return (
    <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-6 border-b border-ink/10">
      <div>
        <h1 className="font-display text-lg sm:text-2xl text-ink">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-ink-soft mt-0.5 sm:mt-1">{subtitle}</p>}
      </div>
      {clinic && (
        <div className="text-right">
          <div className="font-display text-xs sm:text-sm text-ink">{clinic.clinic_name}</div>
          <div className="text-[10px] sm:text-xs text-ink-soft">
            {clinic.doctor_name}
            {clinic.qualification ? ` · ${clinic.qualification}` : ''}
          </div>
        </div>
      )}
    </header>
  );
}
