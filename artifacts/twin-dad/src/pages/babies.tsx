import React from "react";
import { useTranslation } from "react-i18next";

export default function Babies() {
  const { t } = useTranslation();
  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-500">
      <h1 className="text-4xl font-bold mb-6">{t("babies.title")}</h1>
      <p>{t("babies.underConstruction")}</p>
    </div>
  );
}
