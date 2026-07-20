import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { SearchForm } from "../components/SearchForm";
import { PersonCard } from "../components/PersonCard";
import { EmptyState } from "../components/EmptyState";
import { WhatHappensNow } from "../components/ux/WhatHappensNow";
import { PrivacyInline } from "../components/ux/PrivacyInline";
import { SearchX } from "lucide-react";
import { useT } from "../i18n/LocaleProvider";
import {
  peopleRepository,
  type SearchFilters,
} from "../repositories/PeopleRepository";
import type { PublicPersonCard, Disaster, Country } from "../domain/types";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Buscar personas — BASUF" },
      {
        name: "description",
        content:
          "Buscador humanitario de personas desaparecidas en Latinoamérica. Datos sensibles restringidos.",
      },
      { property: "og:title", content: "Buscar personas — BASUF" },
      {
        property: "og:description",
        content:
          "Filtros por país, catástrofe, estado y edad. Prototipo con datos de demostración.",
      },
    ],
  }),
  component: SearchPage,
});

const emptyFilters: SearchFilters = {};

function SearchPage() {
  const { t } = useT();
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [applied, setApplied] = useState<SearchFilters>(emptyFilters);
  const [activeOnly, setActiveOnly] = useState(true);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [nationalities, setNationalities] = useState<Country[]>([]);

  useEffect(() => {
    peopleRepository.listDisasters().then(setDisasters);
    peopleRepository.listCountries().then(setCountries);
    peopleRepository.listNationalities().then(setNationalities);
  }, []);

  useEffect(() => {
    let alive = true;
    peopleRepository.searchPublic(applied).then((r) => {
      if (alive) setResults(r);
    });
    return () => {
      alive = false;
    };
  }, [applied]);

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("search.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("search.subtitle")}
          </p>
          <div className="mt-3">
            <PrivacyInline />
          </div>
        </header>

        <div className="mb-6">
          <WhatHappensNow flow="search" />
        </div>


        <SearchForm
          value={filters}
          onChange={setFilters}
          onSubmit={() => setApplied(filters)}
          onReset={() => {
            setFilters(emptyFilters);
            setApplied(emptyFilters);
          }}
          countries={countries}
          disasters={disasters}
          nationalities={nationalities}
        />

        <section className="mt-8">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">{t("search.results")}</h2>
            <span className="text-sm text-muted-foreground">
              {results.length}
            </span>
          </div>

          {results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={t("empty.search.title")}
              description={t("empty.search.desc")}
            />
          ) : (
            <div
              key={JSON.stringify(applied)}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300"
            >
              {results.map((p) => (
                <PersonCard key={p.id} person={p} />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
