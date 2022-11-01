import React from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

import { ParallaxProvider } from "react-scroll-parallax";
import { useMediaQuery } from "react-responsive";

export default function Home() {
  const isDesktopOrLaptop = useMediaQuery({
    query: "(min-width: 1224px)",
  });

  return (
    <ParallaxProvider>
      <Layout
        // title={`${siteConfig.title}`}
        title="Home"
        description="Wiki知识库/vscode/javascript/软件/工具"
      >
        {/* <HomepageHeader /> */}
        <main>
          {isDesktopOrLaptop ? <MyNewHero /> : null}
          {/* <HomepageFeatures /> */}
        </main>
      </Layout>
    </ParallaxProvider>
  );
}
