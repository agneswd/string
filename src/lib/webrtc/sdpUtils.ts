/**
 * Modify Opus fmtp line in SDP to optimise voice quality.
 * Applied to local SDP before sending offer/answer.
 */
export function enhanceOpusSdp(sdp: string): string {
  // Find the Opus payload type from rtpmap
  const opusMatch = sdp.match(/a=rtpmap:(\d+) opus\/48000\/2/);
  if (!opusMatch) return sdp;

  const payloadType = opusMatch[1];
  const fmtpPrefix = `a=fmtp:${payloadType}`;

  // Desired Opus parameters for high-quality voice at reasonable bandwidth
  const opusParams: Record<string, string> = {
    maxaveragebitrate: '64000',   // 64 kbps – sweet spot for voice quality vs bandwidth
    useinbandfec: '1',            // Forward error correction – recovers from packet loss
    usedtx: '0',                  // Disable DTX – avoids cutting out quiet speech
    stereo: '0',                  // Mono – voice doesn't need stereo
    'sprop-stereo': '0',
    cbr: '0',                     // VBR – more efficient for speech
    maxplaybackrate: '48000',     // Full sample rate
  };

  const lines = sdp.split('\r\n');
  const result: string[] = [];
  let foundFmtp = false;

  for (const line of lines) {
    if (line.startsWith(fmtpPrefix)) {
      foundFmtp = true;
      // Parse existing fmtp params (format: "key=val;key=val" or "key=val; key=val")
      const paramString = line.slice(fmtpPrefix.length + 1);
      const paramPairs = paramString.split(';').map((p) => p.trim()).filter(Boolean);
      const paramMap = new Map<string, string>();

      for (const pair of paramPairs) {
        const eqIdx = pair.indexOf('=');
        if (eqIdx > 0) {
          paramMap.set(pair.slice(0, eqIdx).trim(), pair.slice(eqIdx + 1).trim());
        }
      }

      // Merge our params (overwrite existing)
      for (const [key, value] of Object.entries(opusParams)) {
        paramMap.set(key, value);
      }

      // Join with ';' (no spaces) per SDP convention
      const newParams = [...paramMap.entries()].map(([k, v]) => `${k}=${v}`).join(';');
      result.push(`${fmtpPrefix} ${newParams}`);
    } else {
      result.push(line);
    }
  }

  // If no fmtp line existed for Opus, add one
  if (!foundFmtp) {
    const insertIdx = result.findIndex((l) => l.startsWith(`a=rtpmap:${payloadType} opus`));
    if (insertIdx >= 0) {
      const newParams = Object.entries(opusParams).map(([k, v]) => `${k}=${v}`).join(';');
      result.splice(insertIdx + 1, 0, `${fmtpPrefix} ${newParams}`);
    }
  }

  return result.join('\r\n');
}
