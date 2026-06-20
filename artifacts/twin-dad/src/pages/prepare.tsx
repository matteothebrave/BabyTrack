import React from "react";
import { useTranslation } from "react-i18next";

export default function Prepare() {
  const { t } = useTranslation();
  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-500">
      <h1 className="text-4xl font-bold mb-6">{t("prepare.title")}</h1>
      <p>{t("prepare.underConstruction")}</p>
    </div>
  );
}
