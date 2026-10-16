import { useEffect, useId } from "react";
import { SUBJECTS_BY_LANG } from "./i18n.js";
import { useI18n } from "./i18n.jsx";
import { PRIORITIES } from "./model.js";

export function Hamster({ className = "" }) {
  return <img className={`hamster ${className}`.trim()} src="/hamsters/head.png?v=5" alt="" />;
}

export function Icon({ name }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      {name === "today" && (
        <>
          <path {...common} d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
        </>
      )}
      {name === "schedule" && (
        <>
          <rect {...common} x="4" y="5" width="16" height="15" rx="2" />
          <path {...common} d="M8 3.5V7M16 3.5V7M4 10h16" />
        </>
      )}
      {name === "tasks" && (
        <>
          <rect {...common} x="5" y="4" width="14" height="16" rx="2" />
          <path {...common} d="M8.5 9.5 10.2 11 14 8M8.5 15h6" />
        </>
      )}
      {name === "focus" && (
        <>
          <circle {...common} cx="12" cy="12" r="8" />
          <path {...common} d="M12 8.5V12l2.5 1.5" />
        </>
      )}
      {name === "goals" && (
        <>
          <circle {...common} cx="12" cy="12" r="8" />
          <circle {...common} cx="12" cy="12" r="4" />
          <circle {...common} cx="12" cy="12" r="1" />
        </>
      )}
      {name === "progress" && (
        <>
          <path {...common} d="M4 19V11M10 19V5M16 19v-6M22 19H2" />
        </>
      )}
      {name === "chat" && (
        <>
          <path {...common} d="M5 6.5h14a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1H9l-4 2.8V7.5a1 1 0 0 1 1-1z" />
        </>
      )}
      {name === "settings" && (
        <>
          <circle {...common} cx="12" cy="12" r="3" />
          <path {...common} d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6" />
        </>
      )}
    </svg>
  );
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function SubjectInput({ value, onChange, label, required = true }) {
  const { t } = useI18n();
  const listId = useId();
  const subjects = SUBJECTS_BY_LANG[t.lang] || SUBJECTS_BY_LANG.ru;
  return (
    <Field label={label || t("subject.label")}>
      <input list={listId} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
      <datalist id={listId}>
        {subjects.map((subject) => (
          <option key={subject} value={subject} />
        ))}
      </datalist>
    </Field>
  );
}

export function PrioritySwitch({ value, onChange }) {
  const { t } = useI18n();
  return (
    <div className="seg" role="radiogroup" aria-label={t("priority.label")}>
      {PRIORITIES.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={value === item.id}
          className={value === item.id ? "on" : ""}
          onClick={() => onChange(item.id)}
        >
          {t(`priority.${item.id}`)}
          <small>+{item.xp} XP</small>
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="modal-back" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="btn ghost small" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, text, children }) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {children}
    </header>
  );
}

export function Empty({ title, text, action, mood = "happy" }) {
  return (
    <div className="empty">
      <Hamster mood={mood} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function XpRing({ current, need, size = 86 }) {
  const radius = 32;
  const length = 2 * Math.PI * radius;
  const ratio = need ? Math.max(0, Math.min(1, current / need)) : 0;
  return (
    <svg className="xp-ring" viewBox="0 0 86 86" width={size} height={size} aria-hidden="true">
      <circle className="ring-track" cx="43" cy="43" r={radius} />
      <circle
        className="ring-value"
        cx="43"
        cy="43"
        r={radius}
        strokeDasharray={length}
        strokeDashoffset={length * (1 - ratio)}
      />
    </svg>
  );
}
