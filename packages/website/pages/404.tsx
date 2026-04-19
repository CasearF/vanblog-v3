import Image from "next/image";
import Head from "next/head";
import Link from "next/link";
import { getPublicMeta } from "../api/getAllData";

export async function getStaticProps() {
  const meta = await getPublicMeta();
  return {
    props: {
      theme: meta?.theme || "default",
    },
  };
}

export default function (props: { name?: string; theme?: string }) {
  const themeName = props.theme || "default";
  const themeClass = themeName !== "default" ? `${themeName}-theme` : "";
  const isNebula = themeName === "nova-nebula";

  const nebulaBg = isNebula ? {
    background: 
      `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(10, 74, 138, 0.25) 0%, transparent 60%),` +
      `radial-gradient(ellipse 60% 40% at 80% 100%, rgba(45, 27, 78, 0.2) 0%, transparent 50%),` +
      `radial-gradient(ellipse 100% 80% at 20% 80%, rgba(14, 165, 233, 0.08) 0%, transparent 40%),` +
      `linear-gradient(180deg, #050508 0%, #0a0a12 50%, #050508 100%)`
  } : {};

  const textColor = isNebula ? { color: "#94a3b8" } : {};
  const linkColor = isNebula ? { color: "#3cffd0" } : {};

  return (
    <>
      <Head>
        <title>{`此${props?.name ? props.name : "页面"}不存在`}</title>
        <link rel="icon" href={"/logo.svg"}></link>
      </Head>
      <div
        className={`flex items-center justify-center ${themeClass}`}
        style={{ top: 0, left: 0, bottom: 0, right: 0, position: "absolute", ...nebulaBg }}
      >
        <div
          className="flex flex-col items-center justify-center select-none"
          style={{ transform: "translateY(-30%)" }}
        >
          <Image alt="logo" src="/logo.svg" width={200} height={200} />
          <div className="mt-4 text-gray-600 font-base text-xl dark:text-dark" style={textColor}>
            {`此${props?.name ? props.name : "页面"}不存在`}
          </div>
          <Link href="/">
            <div className="mt-4 ua ua-link text-base text-gray-600 dark:text-dark" style={linkColor}>
              返回主页
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
