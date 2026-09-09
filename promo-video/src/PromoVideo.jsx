import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring, Img, staticFile } from "remotion";

export const PromoVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene 1: Panoramica (Frames 0 - 90)
  const opacity1 = interpolate(frame, [0, 15, 75, 90], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const scale1 = interpolate(frame, [0, 90], [1, 1.05]); // Ken burns effect
  
  // Scene 2: Gestione Gara (Frames 90 - 180)
  const opacity2 = interpolate(frame, [90, 105, 165, 180], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const scale2 = interpolate(frame, [90, 180], [1, 1.05]);

  // Scene 3: Call Room Live (Frames 180 - 270)
  const opacity3 = interpolate(frame, [180, 195, 255, 270], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const scale3 = interpolate(frame, [180, 270], [1, 1.05]);
  
  // Scene 4: Outro (Frames 270 - 360)
  const opacity4 = interpolate(frame, [270, 285], [0, 1], { extrapolateRight: "clamp" });
  const scale4 = spring({ frame: frame - 270, fps, config: { damping: 200 } });

  // Custom text animations
  const textY1 = spring({ frame, fps, from: 50, to: 0, config: { damping: 15 } });
  const textY2 = spring({ frame: frame - 90, fps, from: 50, to: 0, config: { damping: 15 } });
  const textY3 = spring({ frame: frame - 180, fps, from: 50, to: 0, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#1e1e2f", fontFamily: "sans-serif" }}>
      
      {/* Scene 1 */}
      <AbsoluteFill style={{ opacity: opacity1 }}>
        <AbsoluteFill style={{ transform: `scale(${scale1})` }}>
          <Img src={staticFile("step1.png")} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
        <div style={{ position: 'absolute', bottom: 100, width: '100%', textAlign: 'center', transform: `translateY(${textY1}px)` }}>
          <div style={{ display: 'inline-block', backgroundColor: 'rgba(0,0,0,0.8)', padding: '20px 40px', borderRadius: 20 }}>
            <h1 style={{ fontSize: 60, color: "#f39c12", margin: 0 }}>WA Gold TD Dashboard</h1>
            <h2 style={{ fontSize: 40, color: "white", margin: 0, marginTop: 10 }}>Panoramica e calcolo durate automatico</h2>
          </div>
        </div>
      </AbsoluteFill>

      {/* Scene 2 */}
      <AbsoluteFill style={{ opacity: opacity2 }}>
        <AbsoluteFill style={{ transform: `scale(${scale2})` }}>
          <Img src={staticFile("step2.png")} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
        <div style={{ position: 'absolute', bottom: 100, width: '100%', textAlign: 'center', transform: `translateY(${textY2}px)` }}>
          <div style={{ display: 'inline-block', backgroundColor: 'rgba(0,0,0,0.8)', padding: '20px 40px', borderRadius: 20 }}>
            <h1 style={{ fontSize: 60, color: "#3498db", margin: 0 }}>Composizione Start List</h1>
            <h2 style={{ fontSize: 40, color: "white", margin: 0, marginTop: 10 }}>Seeding automatico a zig-zag o a sorteggio</h2>
          </div>
        </div>
      </AbsoluteFill>

      {/* Scene 3 */}
      <AbsoluteFill style={{ opacity: opacity3 }}>
        <AbsoluteFill style={{ transform: `scale(${scale3})` }}>
          <Img src={staticFile("step3.png")} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
        <div style={{ position: 'absolute', bottom: 100, width: '100%', textAlign: 'center', transform: `translateY(${textY3}px)` }}>
          <div style={{ display: 'inline-block', backgroundColor: 'rgba(0,0,0,0.8)', padding: '20px 40px', borderRadius: 20 }}>
            <h1 style={{ fontSize: 60, color: "#e74c3c", margin: 0 }}>Call Room Live</h1>
            <h2 style={{ fontSize: 40, color: "white", margin: 0, marginTop: 10 }}>Allarmi di chiamata indipendenti per Corsia e Pedana</h2>
          </div>
        </div>
      </AbsoluteFill>

      {/* Scene 4 */}
      <AbsoluteFill style={{ opacity: opacity4, transform: `scale(${scale4})`, justifyContent: "center", alignItems: "center" }}>
        <Img src={staticFile("step4.png")} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, position: 'absolute' }} />
        <h1 style={{ fontSize: 100, color: "#2ecc71", textShadow: "0px 5px 15px rgba(0,0,0,0.5)" }}>100% Gratuita e Offline</h1>
        <h2 style={{ fontSize: 50, marginTop: 20, color: "white", textShadow: "0px 5px 15px rgba(0,0,0,0.5)" }}>Disponibile ora su GitHub</h2>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};
