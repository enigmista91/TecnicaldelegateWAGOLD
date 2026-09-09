import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";

export const PromoVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const opacity1 = interpolate(frame, [0, 30, 90, 120], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const scale1 = spring({ frame, fps, config: { damping: 200 } });

  const opacity2 = interpolate(frame, [120, 150, 210, 240], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const scale2 = spring({ frame: frame - 120, fps, config: { damping: 200 } });

  const opacity3 = interpolate(frame, [240, 270], [0, 1], { extrapolateRight: "clamp" });
  const scale3 = spring({ frame: frame - 240, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#1e1e2f", color: "white", fontFamily: "sans-serif", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      
      {/* Scene 1: Introduction */}
      <AbsoluteFill style={{ opacity: opacity1, transform: `scale(${scale1})`, justifyContent: "center", alignItems: "center" }}>
        <h1 style={{ fontSize: 100, marginBottom: 20, color: "#f39c12" }}>WA Gold</h1>
        <h2 style={{ fontSize: 60 }}>Technical Delegate Dashboard</h2>
      </AbsoluteFill>

      {/* Scene 2: Features */}
      <AbsoluteFill style={{ opacity: opacity2, transform: `scale(${scale2})`, justifyContent: "center", alignItems: "center" }}>
        <h1 style={{ fontSize: 80, color: "#3498db" }}>Gestione Gare Istantanea</h1>
        <h2 style={{ fontSize: 50, marginTop: 20 }}>100% Offline • Start List • Stampe</h2>
      </AbsoluteFill>

      {/* Scene 3: Outro */}
      <AbsoluteFill style={{ opacity: opacity3, transform: `scale(${scale3})`, justifyContent: "center", alignItems: "center" }}>
        <h1 style={{ fontSize: 90, color: "#2ecc71" }}>Scaricala ora!</h1>
        <h2 style={{ fontSize: 50, marginTop: 20 }}>Disponibile su GitHub per Windows e Mac</h2>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};
