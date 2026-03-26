"use client";

import { DEFAULT_HOME_HERO_CONTENT, HomeHeroSection } from "@/components/home";

type HeroProps = {
  backgroundImageUrl?: string | null;
};

const Hero = ({ backgroundImageUrl }: HeroProps) => {
  return (
    <HomeHeroSection
      content={{
        ...DEFAULT_HOME_HERO_CONTENT,
        backgroundImageUrl,
      }}
    />
  );
};

export default Hero;
