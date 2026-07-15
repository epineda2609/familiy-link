// BASUF — Generador de narrativa de caso.
// Regla clave: NUNCA inventa. Cada frase se deriva de un evento existente.
import type { CaseEvent, CaseHistory } from "../domain/caseTimeline";
import type { Locale } from "../i18n/messages";

type T = Record<string, string>;

const NARR: Record<Locale, T> = {
  es: {
    reported:
      "Reportada como desaparecida el {date}{location}, tras un evento humanitario en curso.",
    rescue:
      "Fue localizada y rescatada por {org}{location}, iniciando su cadena de identidad de rescate.",
    triage:
      "Recibió atención de triaje por {org}{location}, permitiendo evaluar su estado sin conocer aún su identidad.",
    hospital:
      "Ingresó a un centro hospitalario ({org}{location}), donde su cuadro pudo estabilizarse bajo custodia médica.",
    shelter:
      "Fue derivada a un refugio bajo custodia de {org}{location}, con acompañamiento social.",
    match:
      "Un revisor humano identificó una posible coincidencia con un reporte familiar, aún sujeta a validación.",
    reunion:
      "El caso se cerró con una reunificación confirmada, coordinada por {org}{location}.",
    stillOpen:
      "El caso permanece abierto: nuevos eventos podrán actualizar esta historia a medida que otros actores contribuyan.",
    inLoc: " en {location}",
  },
  en: {
    reported:
      "Reported missing on {date}{location} amid an ongoing humanitarian event.",
    rescue:
      "Located and rescued by {org}{location}, starting the rescue identity chain.",
    triage:
      "Received triage care from {org}{location}, allowing an assessment even before identity was known.",
    hospital:
      "Admitted to a hospital ({org}{location}), where clinical status could be stabilised under medical custody.",
    shelter:
      "Transferred to a shelter under the custody of {org}{location}, with social support.",
    match:
      "A human reviewer identified a possible match with a family report, still subject to validation.",
    reunion:
      "The case closed with a confirmed reunification, coordinated by {org}{location}.",
    stillOpen:
      "The case remains open: new events may update this story as other actors contribute.",
    inLoc: " in {location}",
  },
  pt: {
    reported:
      "Reportada como desaparecida em {date}{location}, em meio a um evento humanitário em curso.",
    rescue:
      "Localizada e resgatada por {org}{location}, iniciando sua cadeia de identidade de resgate.",
    triage:
      "Recebeu atendimento de triagem de {org}{location}, permitindo avaliação antes da identificação.",
    hospital:
      "Foi admitida em um hospital ({org}{location}), onde seu quadro pôde estabilizar sob custódia médica.",
    shelter:
      "Foi encaminhada a um abrigo sob custódia de {org}{location}, com acompanhamento social.",
    match:
      "Um revisor humano identificou uma possível coincidência com um reporte familiar, ainda sujeita a validação.",
    reunion:
      "O caso foi encerrado com reunificação confirmada, coordenada por {org}{location}.",
    stillOpen:
      "O caso permanece aberto: novos eventos podem atualizar esta história.",
    inLoc: " em {location}",
  },
  fr: {
    reported:
      "Signalée disparue le {date}{location}, dans le cadre d'un événement humanitaire en cours.",
    rescue:
      "Localisée et secourue par {org}{location}, initiant la chaîne d'identité de secours.",
    triage:
      "A reçu des soins de triage de {org}{location}, permettant une évaluation avant identification.",
    hospital:
      "Admise dans un hôpital ({org}{location}), où son état a pu être stabilisé sous garde médicale.",
    shelter:
      "Transférée dans un refuge sous la garde de {org}{location}, avec accompagnement social.",
    match:
      "Un examinateur humain a identifié une correspondance possible avec un signalement familial, encore à valider.",
    reunion:
      "Le dossier a été clos par une réunification confirmée, coordonnée par {org}{location}.",
    stillOpen:
      "Le dossier reste ouvert : de nouveaux événements peuvent mettre à jour ce récit.",
    inLoc: " à {location}",
  },
  ar: {
    reported: "تم الإبلاغ عن اختفائها في {date}{location} خلال حدث إنساني جارٍ.",
    rescue: "تم العثور عليها وإنقاذها من قبل {org}{location}، وبدأت سلسلة هوية الإنقاذ.",
    triage: "تلقت رعاية الفرز من {org}{location}، مما سمح بالتقييم قبل تحديد الهوية.",
    hospital: "أُدخلت إلى مستشفى ({org}{location})، حيث أمكن استقرار حالتها تحت الرعاية الطبية.",
    shelter: "نُقلت إلى ملجأ تحت رعاية {org}{location} مع مرافقة اجتماعية.",
    match: "حدد مراجع بشري تطابقاً محتملاً مع بلاغ عائلي، لا يزال بحاجة إلى تحقق.",
    reunion: "أُغلقت الحالة بلمّ شمل مؤكد، بتنسيق من {org}{location}.",
    stillOpen: "لا تزال الحالة مفتوحة: قد تُحدَّث القصة بأحداث جديدة.",
    inLoc: " في {location}",
  },
  da: {
    reported:
      "Rapporteret som savnet den {date}{location} under en igangværende humanitær hændelse.",
    rescue:
      "Fundet og reddet af {org}{location}, hvilket startede redningsidentitetskæden.",
    triage:
      "Modtog triage-behandling af {org}{location}, hvilket muliggjorde vurdering før identifikation.",
    hospital:
      "Indlagt på et hospital ({org}{location}), hvor tilstanden kunne stabiliseres.",
    shelter:
      "Overført til et herberg under {org}{location} med social støtte.",
    match:
      "En menneskelig gennemgang identificerede et muligt match med en familieanmeldelse.",
    reunion:
      "Sagen blev afsluttet med en bekræftet genforening, koordineret af {org}{location}.",
    stillOpen:
      "Sagen forbliver åben: nye hændelser kan opdatere denne historie.",
    inLoc: " i {location}",
  },
  it: {
    reported:
      "Segnalata come dispersa il {date}{location}, nell'ambito di un evento umanitario in corso.",
    rescue:
      "Localizzata e soccorsa da {org}{location}, dando inizio alla catena di identità di soccorso.",
    triage:
      "Ha ricevuto cure di triage da {org}{location}, permettendo una valutazione prima dell'identificazione.",
    hospital:
      "Ricoverata in un ospedale ({org}{location}), dove il quadro clinico ha potuto stabilizzarsi.",
    shelter:
      "Trasferita in un rifugio sotto la custodia di {org}{location}, con accompagnamento sociale.",
    match:
      "Un revisore umano ha identificato una possibile corrispondenza con una segnalazione familiare, ancora da convalidare.",
    reunion:
      "Il caso si è chiuso con una riunificazione confermata, coordinata da {org}{location}.",
    stillOpen:
      "Il caso rimane aperto: nuovi eventi potranno aggiornare questa storia.",
    inLoc: " a {location}",
  },
  de: {
    reported:
      "Am {date}{location} als vermisst gemeldet, im Rahmen eines laufenden humanitären Ereignisses.",
    rescue:
      "Von {org}{location} gefunden und gerettet, wodurch die Rettungsidentitätskette begann.",
    triage:
      "Erhielt Triage-Versorgung von {org}{location}, wodurch eine Einschätzung vor der Identifikation möglich war.",
    hospital:
      "In ein Krankenhaus aufgenommen ({org}{location}), wo der Zustand unter medizinischer Obhut stabilisiert werden konnte.",
    shelter:
      "In eine Unterkunft unter der Obhut von {org}{location} verlegt, mit sozialer Begleitung.",
    match:
      "Ein menschlicher Prüfer identifizierte eine mögliche Übereinstimmung mit einer Familienmeldung, noch zu validieren.",
    reunion:
      "Der Fall wurde mit einer bestätigten Zusammenführung abgeschlossen, koordiniert von {org}{location}.",
    stillOpen:
      "Der Fall bleibt offen: neue Ereignisse können diese Geschichte aktualisieren.",
    inLoc: " in {location}",
  },
  tr: {
    reported:
      "{date} tarihinde{location} devam eden bir insanî olay sırasında kayıp olarak bildirildi.",
    rescue:
      "{org} tarafından{location} bulunarak kurtarıldı; kurtarma kimlik zinciri başladı.",
    triage:
      "{org} tarafından{location} triyaj bakımı aldı; kimlik belirlenmeden değerlendirme yapılabildi.",
    hospital:
      "Bir hastaneye ({org}{location}) yatırıldı ve tıbbi gözetim altında durumu stabilize edilebildi.",
    shelter:
      "{org} gözetiminde{location} bir sığınağa nakledildi; sosyal destek sağlandı.",
    match:
      "Bir insan denetçi, bir aile bildirimi ile olası bir eşleşme belirledi; doğrulama bekleniyor.",
    reunion:
      "Vaka, {org} tarafından{location} koordine edilen doğrulanmış bir yeniden kavuşma ile kapandı.",
    stillOpen:
      "Vaka açık kalmakta: yeni olaylar bu hikayeyi güncelleyebilir.",
    inLoc: " {location}'de",
  },
  ja: {
    reported: "{date}{location}にて、進行中の人道的事象の中で行方不明として報告されました。",
    rescue: "{org}{location}によって発見・救助され、レスキュー身元確認チェーンが始まりました。",
    triage: "{org}{location}によりトリアージ処置を受け、身元判明前に状態評価が可能となりました。",
    hospital: "病院（{org}{location}）に搬送され、医療的管理下で容態が安定しました。",
    shelter: "{org}{location}の管理のもと避難所へ移送され、社会的な支援が提供されました。",
    match: "人によるレビューで家族からの報告と一致する可能性が確認され、検証待ちです。",
    reunion: "{org}{location}の調整により、再会が確認され、ケースは終了しました。",
    stillOpen: "ケースは継続中です。新たな出来事によりこの経緯は更新される可能性があります。",
    inLoc: "、{location}",
  },
};

function fmtDate(iso: string, locale: Locale): string {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      dateStyle: "long",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function fill(tpl: string, params: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? "");
}

function findFirst(events: CaseEvent[], type: CaseEvent["type"]) {
  return events.find((e) => e.type === type);
}

/**
 * Build 2-4 narrative paragraphs strictly derived from the events.
 * Never fabricates data absent from the timeline.
 */
export function buildNarrative(
  history: CaseHistory,
  locale: Locale,
): string[] {
  const nar = NARR[locale] ?? NARR.en;
  const paras: string[] = [];
  const { events } = history;
  if (events.length === 0) return paras;

  const withLoc = (base: string, loc?: string) =>
    loc ? fill(nar.inLoc, { location: loc }) : "";

  const reported = findFirst(events, "reported_missing");
  if (reported) {
    paras.push(
      fill(nar.reported, {
        date: fmtDate(reported.at, locale),
        location: withLoc(nar.inLoc, reported.location),
      }),
    );
  }

  const rescue = findFirst(events, "rescue");
  if (rescue) {
    paras.push(
      fill(nar.rescue, {
        org: rescue.actorOrg,
        location: withLoc(nar.inLoc, rescue.location),
      }),
    );
  }

  const triage = findFirst(events, "triage");
  if (triage && !rescue) {
    paras.push(
      fill(nar.triage, {
        org: triage.actorOrg,
        location: withLoc(nar.inLoc, triage.location),
      }),
    );
  }

  const hospital = findFirst(events, "hospital");
  if (hospital) {
    paras.push(
      fill(nar.hospital, {
        org: hospital.actorOrg,
        location: withLoc(nar.inLoc, hospital.location),
      }),
    );
  }

  const shelter = findFirst(events, "shelter");
  if (shelter) {
    paras.push(
      fill(nar.shelter, {
        org: shelter.actorOrg,
        location: withLoc(nar.inLoc, shelter.location),
      }),
    );
  }

  const match = findFirst(events, "possible_match") ?? findFirst(events, "match");
  if (match) {
    paras.push(nar.match);
  }

  const reunion = findFirst(events, "reunion");
  if (reunion) {
    paras.push(
      fill(nar.reunion, {
        org: reunion.actorOrg,
        location: withLoc(nar.inLoc, reunion.location),
      }),
    );
  } else if (paras.length > 0) {
    paras.push(nar.stillOpen);
  }

  return paras;
}
