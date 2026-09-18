import Image from "next/image";
export function Brand({ large = false }: { large?: boolean }) {
  return (
    <div className={`brand ${large ? "large" : ""}`}>
      <Image
        src="/brand/logo.png"
        width={large ? 100 : 58}
        height={large ? 100 : 58}
        alt="Logo Distribuidora Araujo"
        priority
      />
      <div>
        <strong>DISTRIBUIDORA ARAUJO</strong>
        <span>VIDRIERÍA &amp; ALUMINIOS</span>
      </div>
    </div>
  );
}
