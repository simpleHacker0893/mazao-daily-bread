import { type MessageKey, t } from "@/i18n/t";
import {
  Action,
  Container,
  LandingImage,
  landingRoutes,
  type PhotoName,
} from "./primitives";

// The /welcome sections, top to bottom (#32, stall-front split). No two adjacent sections share a layout.

const sectionTitle =
  "font-extrabold text-[min(2rem,10vw)] text-ink leading-[1.1] tracking-tight md:text-5xl";

function Actions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Action href={landingRoutes.start} variant="primary" size="lg">
        {t("landing.cta.start")}
      </Action>
      <Action href={landingRoutes.demo} variant="secondary" size="lg">
        {t("landing.cta.demo")}
      </Action>
    </div>
  );
}

/** Asymmetric split: copy on 5 columns, the stall photo on 7. Copy first at 360 px. */
export function Hero() {
  return (
    <section aria-labelledby="hero-title">
      <Container className="grid gap-8 pt-8 pb-12 md:pt-12 lg:grid-cols-12 lg:items-center lg:gap-12 lg:pb-20">
        <div className="landing-enter flex flex-col gap-6 lg:col-span-5">
          <h1
            id="hero-title"
            className="font-extrabold text-[min(2.75rem,13vw)] text-ink leading-[1.02] tracking-tight md:text-6xl lg:text-7xl"
          >
            {t("landing.hero.title")}
          </h1>
          <p className="max-w-[34ch] text-lg text-moss leading-relaxed md:text-xl">
            {t("landing.hero.body")}
          </p>
          <Actions />
        </div>
        {/* The Overview phone frame joins this figure once /demo exists (#32 Task 7 fallback). */}
        <figure className="landing-enter landing-enter-late lg:col-span-7">
          <LandingImage
            name="mama-mboga-stall"
            alt={t("landing.hero.photoAlt")}
            sizes="(min-width: 1024px) 680px, 100vw"
            eager
            className="aspect-[4/3] w-full rounded-card object-[70%_40%] lg:aspect-auto lg:h-[min(640px,calc(100dvh-160px))]"
          />
        </figure>
      </Container>
    </section>
  );
}

const notebookRows: [title: MessageKey, body: MessageKey][] = [
  ["landing.notebook.debts.title", "landing.notebook.debts.body"],
  ["landing.notebook.profit.title", "landing.notebook.profit.body"],
  ["landing.notebook.offline.title", "landing.notebook.offline.body"],
  ["landing.notebook.backup.title", "landing.notebook.backup.body"],
];

/** Photo half, a hard Ink hinge, then the list half. */
export function NotebookVsMazao() {
  return (
    <section aria-labelledby="notebook-title" className="py-12 lg:py-20">
      <Container>
        <div className="grid overflow-hidden rounded-card bg-surface md:grid-cols-2">
          <LandingImage
            name="notebook-hands"
            alt={t("landing.notebook.photoAlt")}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-[4/3] h-full w-full md:aspect-auto"
          />
          <div className="flex flex-col gap-8 border-ink border-t-8 p-6 md:border-t-0 md:border-l-8 md:p-10">
            <h2 id="notebook-title" className={sectionTitle}>
              {t("landing.notebook.title")}
            </h2>
            <dl className="grid gap-6 sm:grid-cols-2 sm:gap-x-8">
              {notebookRows.map(([title, body]) => (
                <div key={title} className="flex flex-col gap-1">
                  <dt className="font-bold text-ink text-lg leading-snug">
                    {t(title)}
                  </dt>
                  <dd className="text-moss leading-relaxed">{t(body)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** The aisle photo full bleed; the words sit below it, never on it. */
export function OfflineStory() {
  return (
    <section aria-labelledby="offline-title" className="pb-12 lg:pb-20">
      <LandingImage
        name="gikomba-aisle"
        alt={t("landing.offline.photoAlt")}
        sizes="100vw"
        className="aspect-[16/10] w-full md:aspect-[21/8]"
      />
      <Container className="flex flex-col gap-4 pt-8">
        <h2
          id="offline-title"
          className="font-extrabold text-[min(3rem,13vw)] text-ink leading-none tracking-tight md:text-7xl"
        >
          {t("landing.offline.title")}
        </h2>
        <p className="max-w-[48ch] text-lg text-moss leading-relaxed md:text-xl">
          {t("landing.offline.body")}
        </p>
      </Container>
    </section>
  );
}

const debtLines: MessageKey[] = [
  "landing.debts.overdue",
  "landing.debts.dueDate",
  "landing.debts.payments",
];

/** Heading on the left, the three deni lines on the right. The Debts phone frame joins once /demo exists. */
export function Debts() {
  return (
    <section
      aria-labelledby="debts-title"
      className="border-line border-y bg-surface py-12 lg:py-20"
    >
      <Container className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <h2 id="debts-title" className={`${sectionTitle} lg:col-span-5`}>
          {t("landing.debts.title")}
        </h2>
        <ul className="flex flex-col gap-6 lg:col-span-7">
          {debtLines.map((line) => (
            <li
              key={line}
              className="border-maize border-l-4 pl-4 font-semibold text-ink text-xl leading-snug md:text-2xl"
            >
              {t(line)}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

type BentoCell = {
  photo: PhotoName;
  alt: MessageKey;
  caption: MessageKey;
  cell: string;
  image: string;
  sizes: string;
};

// One large cell and three smaller ones; the spans fill the grid exactly at both widths.
const bentoCells: BentoCell[] = [
  {
    photo: "boda-rider",
    alt: "landing.bento.trips.alt",
    caption: "landing.bento.trips.caption",
    cell: "col-span-2 lg:row-span-2",
    image: "aspect-square lg:aspect-auto lg:h-0 lg:flex-1",
    sizes: "(min-width: 1024px) 560px, 100vw",
  },
  {
    photo: "mama-mboga-stall",
    alt: "landing.bento.units.alt",
    caption: "landing.bento.units.caption",
    cell: "col-span-2",
    image: "aspect-[2/1] object-[10%_70%]",
    sizes: "(min-width: 1024px) 560px, 100vw",
  },
  {
    photo: "duka-shelf",
    alt: "landing.bento.stock.alt",
    caption: "landing.bento.stock.caption",
    cell: "col-span-1",
    image: "aspect-square",
    sizes: "(min-width: 1024px) 280px, 50vw",
  },
  {
    photo: "phone-fundi-kiosk",
    alt: "landing.bento.repairs.alt",
    caption: "landing.bento.repairs.caption",
    cell: "col-span-1",
    image: "aspect-square",
    sizes: "(min-width: 1024px) 280px, 50vw",
  },
];

/** Goods and services: four photo cells, each caption under its photo. */
export function GoodsAndServices() {
  return (
    <section aria-labelledby="bento-title" className="py-12 lg:py-20">
      <Container className="flex flex-col gap-8">
        <h2 id="bento-title" className={sectionTitle}>
          {t("landing.bento.title")}
        </h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
          {bentoCells.map((item) => (
            <figure
              key={item.caption}
              className={`flex flex-col gap-3 ${item.cell}`}
            >
              <LandingImage
                name={item.photo}
                alt={t(item.alt)}
                sizes={item.sizes}
                className={`w-full rounded-card ${item.image}`}
              />
              <figcaption className="font-bold text-ink text-lg leading-snug">
                {t(item.caption)}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

const startSteps: [verb: MessageKey, body: MessageKey][] = [
  ["landing.start.signIn.verb", "landing.start.signIn.body"],
  ["landing.start.pin.verb", "landing.start.pin.body"],
  ["landing.start.sale.verb", "landing.start.sale.body"],
];

/** Three large verbs, no step numbers: a row at 1280, a list at 360. */
export function StartInThree() {
  return (
    <section
      aria-labelledby="start-title"
      className="border-line border-y bg-surface py-12 lg:py-20"
    >
      <Container className="flex flex-col gap-10">
        <h2 id="start-title" className={sectionTitle}>
          {t("landing.start.title")}
        </h2>
        <ol className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          {startSteps.map(([verb, body]) => (
            <li
              key={verb}
              className="flex flex-col gap-3 border-ink border-t-2 pt-5"
            >
              <p className="font-extrabold text-3xl text-ink tracking-tight md:text-4xl">
                {t(verb)}
              </p>
              <p className="max-w-[36ch] text-lg text-moss leading-relaxed">
                {t(body)}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

const dataPoints: [title: MessageKey, body: MessageKey][] = [
  ["landing.data.pin.title", "landing.data.pin.body"],
  ["landing.data.eu.title", "landing.data.eu.body"],
  ["landing.data.delete.title", "landing.data.delete.body"],
  ["landing.data.ads.title", "landing.data.ads.body"],
];

/** Text only, a two-column grouped list. */
export function YourData() {
  return (
    <section aria-labelledby="data-title" className="py-12 lg:py-20">
      <Container className="flex flex-col gap-8">
        <h2 id="data-title" className={sectionTitle}>
          {t("landing.data.title")}
        </h2>
        <dl className="grid gap-x-12 gap-y-8 md:grid-cols-2">
          {dataPoints.map(([title, body]) => (
            <div key={title} className="flex max-w-[44ch] flex-col gap-2">
              <dt className="font-bold text-ink text-xl leading-snug">
                {t(title)}
              </dt>
              <dd className="text-lg text-moss leading-relaxed">{t(body)}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

const questions: [question: MessageKey, answer: MessageKey][] = [
  ["landing.faq.free.question", "landing.faq.free.answer"],
  ["landing.faq.offline.question", "landing.faq.offline.answer"],
  ["landing.faq.lost.question", "landing.faq.lost.answer"],
  ["landing.faq.trade.question", "landing.faq.trade.answer"],
  ["landing.faq.language.question", "landing.faq.language.answer"],
];

/** Native disclosure: opens with Enter or Space, announces its state, needs no JavaScript. */
export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="pb-12 lg:pb-20">
      <Container className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <h2 id="faq-title" className={`${sectionTitle} lg:col-span-4`}>
          {t("landing.faq.title")}
        </h2>
        <div className="divide-y divide-line border-line border-y lg:col-span-8">
          {questions.map(([question, answer]) => (
            <details key={question} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-card py-3 font-bold text-ink text-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sukuma [&::-webkit-details-marker]:hidden">
                {t(question)}
                <span
                  aria-hidden="true"
                  className="text-2xl text-sukuma leading-none after:content-['+'] group-open:after:content-['\2212']"
                />
              </summary>
              <p className="max-w-[60ch] pb-5 text-lg text-moss leading-relaxed">
                {t(answer)}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function ClosingBand() {
  return (
    <section
      aria-labelledby="close-title"
      className="border-line border-t bg-surface py-12 lg:py-16"
    >
      <Container className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <h2
          id="close-title"
          className="font-extrabold text-[min(3rem,13vw)] text-ink leading-none tracking-tight md:text-6xl"
        >
          {t("landing.close.title")}
        </h2>
        <Actions />
      </Container>
    </section>
  );
}
