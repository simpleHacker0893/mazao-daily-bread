import { type MessageKey, t } from "@/i18n/t";
import {
  Action,
  Container,
  displayTitle,
  focusRing,
  LandingImage,
  landingRoutes,
  type PhotoName,
  Section,
  sectionTitle,
} from "./primitives";

// The /welcome sections, top to bottom (#32, stall-front split). No two adjacent sections share a layout.

/** A heading and one plain sentence: the shape of most landing lists. */
type TitledText = [title: MessageKey, body: MessageKey];

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

function TitledList({
  items,
  className,
  titleClass,
  bodyClass,
}: {
  items: TitledText[];
  className: string;
  titleClass: string;
  bodyClass: string;
}) {
  return (
    <dl className={className}>
      {items.map(([title, body]) => (
        <div key={title} className="flex max-w-[44ch] flex-col gap-2">
          <dt className={`font-bold text-ink leading-snug ${titleClass}`}>
            {t(title)}
          </dt>
          <dd className={`text-moss leading-relaxed ${bodyClass}`}>
            {t(body)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Asymmetric split: copy on 5 columns, the stall photo on 7. Copy first at 360 px. */
export function Hero() {
  return (
    <Section
      tone="chalk"
      labelledBy="hero-title"
      className="pt-8 pb-16 md:pt-14 lg:pt-16 lg:pb-24"
    >
      <Container className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
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
          <div className="pt-2">
            <Actions />
          </div>
        </div>
        {/* The Overview phone frame joins this figure once /demo exists (#32 Task 7 fallback). */}
        <figure className="landing-enter landing-enter-late lg:col-span-7">
          <LandingImage
            name="mama-mboga-stall"
            alt={t("landing.hero.photoAlt")}
            sizes="(min-width: 1024px) 680px, 100vw"
            eager
            className="aspect-[4/3] w-full rounded-card object-[70%_40%] lg:aspect-auto lg:h-[min(640px,calc(100dvh-180px))]"
          />
        </figure>
      </Container>
    </Section>
  );
}

const notebookRows: TitledText[] = [
  ["landing.notebook.debts.title", "landing.notebook.debts.body"],
  ["landing.notebook.profit.title", "landing.notebook.profit.body"],
  ["landing.notebook.offline.title", "landing.notebook.offline.body"],
  ["landing.notebook.backup.title", "landing.notebook.backup.body"],
];

/** Photo half, a hard Ink hinge, then the list half. */
export function NotebookVsMazao() {
  return (
    <Section tone="chalk" labelledBy="notebook-title">
      <Container>
        <div className="grid overflow-hidden rounded-card bg-surface md:grid-cols-2">
          <LandingImage
            name="notebook-hands"
            alt={t("landing.notebook.photoAlt")}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-[4/3] h-full w-full md:aspect-auto"
          />
          <div className="flex flex-col gap-8 border-ink border-t-8 px-5 py-8 md:border-t-0 md:border-l-8 md:p-10 lg:p-12">
            <h2 id="notebook-title" className={sectionTitle}>
              {t("landing.notebook.title")}
            </h2>
            <TitledList
              items={notebookRows}
              className="grid gap-7 sm:grid-cols-2 sm:gap-x-8"
              titleClass="text-lg"
              bodyClass=""
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}

/** The aisle photo full bleed; the words sit below it, never on it. */
export function OfflineStory() {
  return (
    <Section tone="chalk" labelledBy="offline-title">
      <LandingImage
        name="gikomba-aisle"
        alt={t("landing.offline.photoAlt")}
        sizes="100vw"
        className="aspect-[16/10] w-full md:aspect-[21/8]"
      />
      <Container className="flex flex-col gap-4 pt-10 lg:pt-12">
        <h2 id="offline-title" className={displayTitle}>
          {t("landing.offline.title")}
        </h2>
        <p className="max-w-[48ch] text-lg text-moss leading-relaxed md:text-xl">
          {t("landing.offline.body")}
        </p>
      </Container>
    </Section>
  );
}

const debtLines: MessageKey[] = [
  "landing.debts.overdue",
  "landing.debts.dueDate",
  "landing.debts.payments",
];

/** On a Maize band, the in-app deni colour. The Debts phone frame joins on the right once /demo exists. */
export function Debts() {
  return (
    <Section tone="maize" labelledBy="debts-title">
      <Container className="grid gap-8 lg:grid-cols-12 lg:gap-14">
        <h2 id="debts-title" className={`${sectionTitle} lg:col-span-5`}>
          {t("landing.debts.title")}
        </h2>
        <ul className="flex flex-col gap-5 lg:col-span-7">
          {debtLines.map((line) => (
            <li
              key={line}
              className="font-semibold text-ink text-xl leading-snug md:text-2xl"
            >
              {t(line)}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
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
    <Section tone="chalk" labelledBy="bento-title">
      <Container className="flex flex-col gap-10">
        <h2 id="bento-title" className={sectionTitle}>
          {t("landing.bento.title")}
        </h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
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
    </Section>
  );
}

const startSteps: TitledText[] = [
  ["landing.start.signIn.verb", "landing.start.signIn.body"],
  ["landing.start.pin.verb", "landing.start.pin.body"],
  ["landing.start.sale.verb", "landing.start.sale.body"],
];

/** Three large verbs, no step numbers: a row at 1280, a list at 360. */
export function StartInThree() {
  return (
    <Section tone="surface" labelledBy="start-title">
      <Container className="flex flex-col gap-10 lg:gap-12">
        <h2 id="start-title" className={sectionTitle}>
          {t("landing.start.title")}
        </h2>
        <ol className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          {startSteps.map(([verb, body]) => (
            <li
              key={verb}
              className="flex flex-col gap-3 border-ink border-t-2 pt-6"
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
    </Section>
  );
}

const dataPoints: TitledText[] = [
  ["landing.data.pin.title", "landing.data.pin.body"],
  ["landing.data.eu.title", "landing.data.eu.body"],
  ["landing.data.delete.title", "landing.data.delete.body"],
  ["landing.data.ads.title", "landing.data.ads.body"],
];

/** Text only, a two-column grouped list. */
export function YourData() {
  return (
    <Section tone="chalk" labelledBy="data-title">
      <Container className="flex flex-col gap-10">
        <h2 id="data-title" className={sectionTitle}>
          {t("landing.data.title")}
        </h2>
        <TitledList
          items={dataPoints}
          className="grid gap-x-16 gap-y-10 md:grid-cols-2"
          titleClass="text-xl"
          bodyClass="text-lg"
        />
      </Container>
    </Section>
  );
}

const questions: TitledText[] = [
  ["landing.faq.free.question", "landing.faq.free.answer"],
  ["landing.faq.offline.question", "landing.faq.offline.answer"],
  ["landing.faq.lost.question", "landing.faq.lost.answer"],
  ["landing.faq.trade.question", "landing.faq.trade.answer"],
  ["landing.faq.language.question", "landing.faq.language.answer"],
];

/** Native disclosure: opens with Enter or Space, announces its state, needs no JavaScript. */
export function Faq() {
  return (
    <Section tone="chalk" labelledBy="faq-title">
      <Container className="grid gap-8 lg:grid-cols-12 lg:gap-14">
        <h2 id="faq-title" className={`${sectionTitle} lg:col-span-4`}>
          {t("landing.faq.title")}
        </h2>
        <div className="divide-y divide-line border-line border-y lg:col-span-8">
          {questions.map(([question, answer]) => (
            <details key={question} className="group">
              <summary
                className={`flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-card py-3 font-bold text-ink text-lg [&::-webkit-details-marker]:hidden ${focusRing}`}
              >
                {t(question)}
                <span
                  aria-hidden="true"
                  className="text-2xl text-sukuma leading-none after:content-['+'] group-open:after:content-['\2212']"
                />
              </summary>
              <p className="max-w-[60ch] pb-6 text-lg text-moss leading-relaxed">
                {t(answer)}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function ClosingBand() {
  return (
    <Section tone="surface" labelledBy="close-title">
      <Container className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <h2 id="close-title" className={displayTitle}>
          {t("landing.close.title")}
        </h2>
        <Actions />
      </Container>
    </Section>
  );
}
