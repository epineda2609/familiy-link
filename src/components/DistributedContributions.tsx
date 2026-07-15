import {
  Users,
  ShieldAlert,
  Hospital,
  Home,
  HeartHandshake,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import { useT } from "../i18n/LocaleProvider";
import type { MessageKey } from "../i18n/messages";

const contribs: {
  Icon: LucideIcon;
  title: MessageKey;
  desc: MessageKey;
  tint: string;
}[] = [
  {
    Icon: Users,
    title: "rescue.contrib.family",
    desc: "rescue.contrib.family.desc",
    tint: "bg-primary/10 text-primary",
  },
  {
    Icon: ShieldAlert,
    title: "rescue.contrib.rescuer",
    desc: "rescue.contrib.rescuer.desc",
    tint: "bg-urgent/20 text-urgent-foreground",
  },
  {
    Icon: Hospital,
    title: "rescue.contrib.hospital",
    desc: "rescue.contrib.hospital.desc",
    tint: "bg-primary/10 text-primary",
  },
  {
    Icon: Home,
    title: "rescue.contrib.shelter",
    desc: "rescue.contrib.shelter.desc",
    tint: "bg-hope/20 text-hope-foreground",
  },
  {
    Icon: HeartHandshake,
    title: "rescue.contrib.ngo",
    desc: "rescue.contrib.ngo.desc",
    tint: "bg-primary/10 text-primary",
  },
  {
    Icon: Landmark,
    title: "rescue.contrib.authority",
    desc: "rescue.contrib.authority.desc",
    tint: "bg-muted text-foreground",
  },
];

export function DistributedContributions() {
  const { t } = useT();
  return (
    <section className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("rescue.contrib.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("rescue.contrib.subtitle")}
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contribs.map(({ Icon, title, desc, tint }) => (
            <article
              key={title}
              className="flex gap-3 rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tint}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{t(title)}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(desc)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
