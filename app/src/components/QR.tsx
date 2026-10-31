import qrcode from 'qrcode-generator';
import { useMemo } from 'react';
import { View } from 'react-native';

/** A QR code drawn with plain Views (no native module): each row is runs of dark/light cells. */
export function QR({ value, size = 220 }: { value: string; size?: number }) {
  const rows = useMemo(() => {
    const q = qrcode(0, 'M');
    q.addData(value);
    q.make();
    const n = q.getModuleCount();
    const out: { dark: boolean; len: number }[][] = [];
    for (let r = 0; r < n; r++) {
      const runs: { dark: boolean; len: number }[] = [];
      for (let c = 0; c < n; c++) {
        const dark = q.isDark(r, c);
        const last = runs[runs.length - 1];
        if (last && last.dark === dark) last.len++;
        else runs.push({ dark, len: 1 });
      }
      out.push(runs);
    }
    return { n, out };
  }, [value]);
  const quiet = 3; // light border in modules
  const cell = Math.floor(size / (rows.n + quiet * 2));
  return (
    <View style={{ backgroundColor: '#fff', padding: cell * quiet, borderRadius: 12 }} accessibilityLabel="QR code to join">
      {rows.out.map((runs, r) => (
        <View key={r} style={{ flexDirection: 'row', height: cell }}>
          {runs.map((run, i) => (
            <View key={i} style={{ width: cell * run.len, height: cell, backgroundColor: run.dark ? '#000' : '#fff' }} />
          ))}
        </View>
      ))}
    </View>
  );
}
