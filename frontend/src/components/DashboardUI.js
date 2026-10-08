import React from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomColorPicker from "@/components/ColorPicker";

export function Header({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#E5E7EB]/60 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Panel({ title, children, className = "" }) {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-[#0c0e15] border border-white/10 shadow-lg space-y-4 ${className}`}>
      {title && (
        <div className="text-xs font-bold uppercase tracking-wider text-[#5B8DB8] border-b border-white/5 pb-2">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export function ToggleRow({ label, checked, onChange, testid }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-xs text-[#E5E7EB]/80 font-medium">{label}</span>
      <Switch data-testid={testid} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function SliderRow({ label, value, onChange, min = 0, max = 100, step = 1, suffix = "%" }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-[#E5E7EB]/70 font-medium">
        <span>{label}</span>
        <span className="font-mono text-white text-[11px]">{Math.round(value)}{suffix}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="cursor-pointer"
      />
    </div>
  );
}

export function SelectRow({ label, value, onChange, options }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-xs text-[#E5E7EB]/70 font-medium shrink-0">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-48 bg-black/40 border-white/10 text-white text-xs h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#0c0e15] border-white/10 text-white text-xs">
          {options.map((opt) => (
            <SelectItem key={opt.v} value={opt.v}>
              {opt.l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-xs text-[#E5E7EB]/70 font-medium">{label}</span>
      <CustomColorPicker color={value} onChange={onChange} />
    </div>
  );
}

export default { Header, Panel, ToggleRow, SliderRow, SelectRow, ColorRow };
