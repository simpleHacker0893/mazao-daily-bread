"use client";

import type { Locale } from "@/i18n/t";
import { type MessageKey, t } from "@/i18n/t";

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma";

export function PinPad({
  label,
  value,
  onChange,
  disabled = false,
  locale = "en",
}: {
  label: MessageKey;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  locale?: Locale;
}) {
  const update = (next: string) => {
    if (/^\d{0,4}$/.test(next)) onChange(next);
  };

  return (
    <fieldset
      disabled={disabled}
      className="flex flex-col gap-3 disabled:opacity-60"
    >
      <legend className="mb-2 font-semibold">{t(label, locale)}</legend>
      <input
        aria-label={t(label, locale)}
        autoComplete="one-time-code"
        inputMode="numeric"
        pattern="[0-9]*"
        type="password"
        value={value}
        onChange={(event) => update(event.target.value.replace(/\D/g, ""))}
        className={`min-h-14 w-full rounded-card border border-line bg-surface px-4 text-center text-2xl tracking-[0.5em] ${focus}`}
      />
      <div className="mx-auto grid w-full max-w-[21rem] grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            aria-label={t("shell.pin.input.digit", locale).replace(
              "{digit}",
              digit,
            )}
            onClick={() => update(`${value}${digit}`)}
            className={`min-h-16 rounded-card bg-surface text-xl font-semibold active:bg-chalk ${focus}`}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          aria-label={t("shell.pin.input.clear", locale)}
          onClick={() => onChange("")}
          className={`min-h-16 rounded-card bg-surface text-sm font-semibold active:bg-chalk ${focus}`}
        >
          {t("shell.pin.input.clear")}
        </button>
        <button
          type="button"
          aria-label={t("shell.pin.input.digit", locale).replace(
            "{digit}",
            "0",
          )}
          onClick={() => update(`${value}0`)}
          className={`min-h-16 rounded-card bg-surface text-xl font-semibold active:bg-chalk ${focus}`}
        >
          0
        </button>
        <button
          type="button"
          aria-label={t("shell.pin.input.backspace", locale)}
          onClick={() => onChange(value.slice(0, -1))}
          className={`min-h-16 rounded-card bg-surface text-sm font-semibold active:bg-chalk ${focus}`}
        >
          {t("shell.pin.input.backspace", locale)}
        </button>
      </div>
    </fieldset>
  );
}
