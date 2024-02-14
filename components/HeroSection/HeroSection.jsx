import React, { useContext, useEffect } from "react";
import Image from "next/image";

//INTERNAL IMPORT
import Style from "./HeroSection.module.css";
import { Button } from "../componentsindex";
import images from "../../img";

import { NFTMarketplaceContext } from "../../Context/NFTMarketPlaceContext";

const HeroSection = () => {
  const { title } = useContext(NFTMarketplaceContext);
  console.log(title);
  return (
    <div className={Style.heroSection}>
      <div className={Style.heroSection_box}>
        <div className={Style.heroSection_box_left}>
          <h1>{title}🖼️</h1>
          <p>
            Your Gateway to a Creative Cosmos. Discover the most outstanding
            NTFs in all topics of life. Creative your NTFs and sell them
          </p>
          <Button btnName="Start your search" />
        </div>
        <div className={Style.heroSection_box_right}>
          <Image
            src={images.hero}
            alt="Hero section"
            width={600}
            height={600}
          />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
