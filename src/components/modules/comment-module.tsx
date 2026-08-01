"use client";

import { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentModuleProps {
  value: string;
  onChange: (value: string) => void;
}

type SpeechRec = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export function CommentModule({ value, onChange }: CommentModuleProps) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRec | null>(null);

  const toggleVoice = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      onChange(
        value
          ? `${value}\n[Voice note placeholder — speech recognition unavailable]`
          : "[Voice note placeholder — speech recognition unavailable]"
      );
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-CA";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      onChange(value ? `${value} ${transcript}` : transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Optional notes for supervisor or safety. Use voice if your hands are busy.
      </p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type or dictate notes…"
        className="min-h-44 rounded-2xl text-base leading-relaxed"
      />
      <Button
        type="button"
        variant={listening ? "destructive" : "outline"}
        className="h-14 w-full rounded-2xl text-base"
        onClick={toggleVoice}
      >
        {listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        {listening ? "Stop listening" : "Voice to text"}
      </Button>
    </div>
  );
}
