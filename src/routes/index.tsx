import { createFileRoute } from "@tanstack/react-router";

import { HomeSections } from "@/components/HomeSections";
import { ThreePane } from "@/components/ThreePane";
import { useHomeLayout } from "@/lib/content";
import { DEFAULT_HOME_LAYOUT } from "@/lib/home-layout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "जय हिन्द भारत — ताजा हिंदी समाचार, ई-पेपर और लाइव टीवी" },
      {
        name: "description",
        content:
          "देश, राज्य, दुनिया, कारोबार, खेल और मनोरंजन की ताजा हिंदी खबरें, आज का ई-पेपर, वीडियो और 24x7 लाइव टीवी — जय हिन्द भारत पर।",
      },
      { property: "og:title", content: "जय हिन्द भारत — ताजा हिंदी समाचार" },
      {
        property: "og:description",
        content: "ताजा हिंदी खबरें, ई-पेपर, वीडियो और लाइव टीवी एक ही जगह।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: layout } = useHomeLayout();
  return (
    <ThreePane>
      <HomeSections layout={layout ?? DEFAULT_HOME_LAYOUT} />
    </ThreePane>
  );
}

