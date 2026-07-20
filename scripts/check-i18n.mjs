import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const localeDir = path.join(root, "src/i18n/locales");
const locales = ["es", "en", "pt", "fr", "ar", "da", "it", "de", "tr", "ja"];

function sourceFile(file) {
  return ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function readStringObject(file, variableName) {
  const source = sourceFile(file);
  let result;
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(source) !== variableName || !declaration.initializer) continue;
      let initializer = declaration.initializer;
      if (ts.isAsExpression(initializer)) initializer = initializer.expression;
      if (!ts.isObjectLiteralExpression(initializer)) continue;
      result = {};
      for (const property of initializer.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const key = property.name.text;
        if (typeof key !== "string") continue;
        let value = property.initializer;
        if (ts.isAsExpression(value)) value = value.expression;
        if (ts.isStringLiteralLike(value)) result[key] = value.text;
        else if (ts.isObjectLiteralExpression(value)) {
          result[key] = Object.fromEntries(
            value.properties
              .filter(ts.isPropertyAssignment)
              .filter((entry) => ts.isStringLiteralLike(entry.initializer))
              .map((entry) => [entry.name.text, entry.initializer.text]),
          );
        }
      }
    }
  }
  if (!result) throw new Error(`No se encontró ${variableName} en ${file}`);
  return result;
}

const spanish = readStringObject(path.join(localeDir, "es.ts"), "esDict");
const audited = readStringObject(path.join(localeDir, "audited.ts"), "auditedEs");
const sourceMessages = { ...spanish, ...audited };
const generated = readStringObject(
  path.join(localeDir, "generatedTranslations.ts"),
  "generatedTranslations",
);
const english = readStringObject(path.join(localeDir, "en.ts"), "en");

const placeholderNames = (value) =>
  [...value.matchAll(/\{(\w+)\}/g)]
    .map((match) => match[1])
    .sort()
    .join(",");

const errors = [];
for (const locale of locales) {
  const manual =
    locale === "es" ? spanish : readStringObject(path.join(localeDir, `${locale}.ts`), locale);
  const effective = locale === "es" ? sourceMessages : { ...manual, ...(generated[locale] ?? {}) };
  for (const [key, sourceValue] of Object.entries(sourceMessages)) {
    if (effective[key] == null) {
      errors.push(`${locale}: falta la clave ${key}`);
      continue;
    }
    if (placeholderNames(sourceValue) !== placeholderNames(effective[key])) {
      errors.push(`${locale}: los parámetros de ${key} no coinciden`);
    }
  }
  if (locale !== "es" && locale !== "en") {
    for (const [key, value] of Object.entries(manual)) {
      if (
        value === english[key] &&
        sourceMessages[key] !== english[key] &&
        generated[locale]?.[key] == null
      ) {
        errors.push(`${locale}: ${key} sigue siendo una copia del inglés`);
      }
    }
  }
}

const visibleAttributes = new Set([
  "alt",
  "aria-label",
  "aria-description",
  "label",
  "placeholder",
  "title",
]);
const sourceRoot = path.join(root, "src");
const tsxFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith(".tsx")) tsxFiles.push(file);
  }
}
walk(sourceRoot);

const hasLetters = (value) =>
  /[A-Za-zÁÉÍÓÚÑáéíóúñÀ-ÿ\u0600-\u06ff\u3040-\u30ff\u4e00-\u9faf]/.test(value);
for (const file of tsxFiles) {
  const source = sourceFile(file);
  const visit = (node) => {
    let value;
    if (ts.isJsxText(node)) value = node.text.replace(/\s+/g, " ").trim();
    if (
      ts.isJsxAttribute(node) &&
      visibleAttributes.has(node.name.getText(source)) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    ) {
      value = node.initializer.text.trim();
    }
    if (value && hasLetters(value)) {
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      errors.push(`${path.relative(root, file)}:${line}: texto visible sin traducir: ${value}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `i18n OK: ${Object.keys(sourceMessages).length} claves completas en ${locales.length} idiomas, parámetros y JSX visibles validados.`,
  );
}
