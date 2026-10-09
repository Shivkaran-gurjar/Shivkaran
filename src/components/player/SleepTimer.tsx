import { useEffect, useState } from "react";
import { Moon, TimerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { usePlayer } from "@/store/player";

export function SleepTimer() {
  const sleepAt = usePlayer((s) => s.sleepAt);
  const end = usePlayer((s) => s.sleepEndOfVideo);
  const setSleep = usePlayer((s) => s.setSleep);
  const [minutes, setMinutes] = useState(30);
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    if (!sleepAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [sleepAt]);
  const seconds = Math.max(0, Math.ceil(((sleepAt ?? now) - now) / 1000));
  const label = sleepAt ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : end ? "End of song" : "Sleep timer";
  return <Popover>
    <PopoverTrigger asChild><Button variant="ghost" className={sleepAt || end ? "text-primary" : "text-muted-foreground"} aria-label="Adjust sleep timer" title="Sleep timer"><Moon /><span className="text-xs tabular-nums">{label}</span></Button></PopoverTrigger>
    <PopoverContent className="w-72" align="end">
      <h3 className="mb-4 font-semibold">Sleep timer</h3>
      <div className="mb-4 flex justify-between text-sm"><span>Stop after</span><span>{minutes} minutes</span></div>
      <Slider value={[minutes]} min={5} max={120} step={5} onValueChange={([value]) => setMinutes(value)} aria-label="Sleep timer minutes" />
      <div className="mt-5 flex flex-wrap gap-2">{[15, 30, 60].map((value) => <Button key={value} size="sm" variant="secondary" onClick={() => { setMinutes(value); setSleep(value); }}>{value} min</Button>)}</div>
      <Button className="mt-3 w-full" onClick={() => setSleep(minutes)}>Start {minutes}-minute timer</Button>
      <Button variant="ghost" className="mt-1 w-full" onClick={() => setSleep(null, true)}>End of current song</Button>
      {(sleepAt || end) && <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setSleep(null)}><TimerOff />Cancel timer</Button>}
    </PopoverContent>
  </Popover>;
}