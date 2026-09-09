import { Composition } from "remotion";
import { PromoVideo } from "./PromoVideo";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="WAGoldPromo"
        component={PromoVideo}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
