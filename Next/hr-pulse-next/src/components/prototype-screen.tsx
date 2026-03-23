import type { LoadedScreen } from "@/lib/prototype-screens";

type PrototypeScreenProps = {
  screen: LoadedScreen;
};

export default function PrototypeScreen({ screen }: PrototypeScreenProps) {
  const markup = `${screen.styleBlocks}
<div class="${screen.bodyClassName}">
${screen.bodyContent}
</div>`;

  return (
    <main
      aria-label={screen.title}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
