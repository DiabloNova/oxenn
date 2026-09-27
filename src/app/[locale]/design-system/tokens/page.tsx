import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design Tokens - Oxenn Design System",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TokensPage() {
  return (
    <div className="min-h-screen bg-ox-background text-ox-text-primary p-8 md:p-12 lg:p-16 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-16">

        <header className="space-y-4">
          <h1 className="text-ox-4xl font-bold tracking-tight">Design Tokens</h1>
          <p className="text-ox-lg text-ox-text-secondary max-w-2xl">
            Semantic design tokens for the Oxenn product suite, supporting comprehensive dark and light modes, LTR/RTL reading directions, and accessible contrast ratios.
          </p>
        </header>

        {/* Semantic Colors */}
        <section className="space-y-6">
          <h2 className="text-ox-2xl font-semibold border-b border-ox-border pb-2">Semantic Backgrounds</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Swatch colorVar="bg-ox-background" name="Background" desc="Base page layer" border />
            <Swatch colorVar="bg-ox-surface" name="Surface" desc="Cards, sheets, menus" />
            <Swatch colorVar="bg-ox-surface-raised" name="Surface Raised" desc="Modals, dropdowns" />
            <Swatch colorVar="bg-ox-surface-muted" name="Surface Muted" desc="Subtle sections" />
          </div>
        </section>

        {/* Text Colors */}
        <section className="space-y-6">
          <h2 className="text-ox-2xl font-semibold border-b border-ox-border pb-2">Typography & Text</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4 p-4 rounded-ox-lg bg-ox-surface border border-ox-border">
              <div className="text-ox-primary text-ox-2xl font-bold">Primary</div>
              <div className="text-ox-text-primary text-ox-sm">High-emphasis text for headings and primary content. AAA Contrast.</div>
            </div>
            <div className="space-y-4 p-4 rounded-ox-lg bg-ox-surface border border-ox-border">
              <div className="text-ox-text-secondary text-ox-2xl font-bold">Secondary</div>
              <div className="text-ox-text-secondary text-ox-sm">Medium-emphasis text for descriptions and metadata. AA Contrast.</div>
            </div>
            <div className="space-y-4 p-4 rounded-ox-lg bg-ox-surface border border-ox-border">
              <div className="text-ox-text-muted text-ox-2xl font-bold">Muted</div>
              <div className="text-ox-text-muted text-ox-sm">Low-emphasis text for disabled states and placeholders.</div>
            </div>
            <div className="space-y-4 p-4 rounded-ox-lg bg-ox-text-primary border border-ox-border">
              <div className="text-ox-text-inverse text-ox-2xl font-bold">Inverse</div>
              <div className="text-ox-text-inverse text-ox-sm">Used against high-contrast backgrounds like primary buttons.</div>
            </div>
          </div>
        </section>

        {/* Status Colors */}
        <section className="space-y-6">
          <h2 className="text-ox-2xl font-semibold border-b border-ox-border pb-2">Status Intention</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusSwatch
              baseClass="text-ox-success"
              bgClass="bg-ox-success-bg"
              name="Success"
              desc="Confirmation messages, successes"
            />
            <StatusSwatch
              baseClass="text-ox-warning"
              bgClass="bg-ox-warning-bg"
              name="Warning"
              desc="Caution, potentially destructive"
            />
            <StatusSwatch
              baseClass="text-ox-error"
              bgClass="bg-ox-error-bg"
              name="Error"
              desc="Errors, failures, destructive"
            />
            <StatusSwatch
              baseClass="text-ox-info"
              bgClass="bg-ox-info-bg"
              name="Info"
              desc="Informational alerts"
            />
          </div>
        </section>

        {/* Spacing */}
        <section className="space-y-6">
          <h2 className="text-ox-2xl font-semibold border-b border-ox-border pb-2">Spacing & Radius</h2>
          <div className="flex flex-wrap gap-8 items-end">
            <div className="space-y-2">
              <div className="w-ox-4 h-ox-4 bg-ox-brand-500 rounded-ox-sm"></div>
              <div className="text-ox-xs text-ox-text-muted">sm (4px)</div>
            </div>
            <div className="space-y-2">
              <div className="w-ox-8 h-ox-8 bg-ox-brand-500 rounded-ox-md"></div>
              <div className="text-ox-xs text-ox-text-muted">md (8px)</div>
            </div>
            <div className="space-y-2">
              <div className="w-ox-12 h-ox-12 bg-ox-brand-500 rounded-ox-lg"></div>
              <div className="text-ox-xs text-ox-text-muted">lg (12px)</div>
            </div>
            <div className="space-y-2">
              <div className="w-ox-16 h-ox-16 bg-ox-brand-500 rounded-ox-xl"></div>
              <div className="text-ox-xs text-ox-text-muted">xl (16px)</div>
            </div>
            <div className="space-y-2">
              <div className="w-ox-20 h-ox-20 bg-ox-brand-500 rounded-ox-full"></div>
              <div className="text-ox-xs text-ox-text-muted">full (999px)</div>
            </div>
          </div>
        </section>

        {/* Elevation */}
        <section className="space-y-6">
          <h2 className="text-ox-2xl font-semibold border-b border-ox-border pb-2">Elevation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 p-8 bg-ox-surface-muted rounded-ox-xl border border-ox-border">
            <div className="h-32 bg-ox-surface rounded-ox-lg shadow-ox-sm border border-ox-border flex items-center justify-center text-ox-sm font-medium">
              shadow-sm
            </div>
            <div className="h-32 bg-ox-surface rounded-ox-lg shadow-ox-md border border-ox-border flex items-center justify-center text-ox-sm font-medium">
              shadow-md
            </div>
            <div className="h-32 bg-ox-surface rounded-ox-lg shadow-ox-lg border border-ox-border flex items-center justify-center text-ox-sm font-medium">
              shadow-lg
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function Swatch({ colorVar, name, desc, border }: { colorVar: string, name: string, desc: string, border?: boolean }) {
  return (
    <div className="flex flex-col space-y-3">
      <div className={`h-24 rounded-ox-lg w-full ${colorVar} ${border ? 'border border-ox-border-strong' : 'shadow-ox-sm'}`} />
      <div>
        <div className="font-medium text-ox-base">{name}</div>
        <div className="text-ox-sm text-ox-text-secondary">{desc}</div>
      </div>
    </div>
  );
}

function StatusSwatch({ baseClass, bgClass, name, desc }: { baseClass: string, bgClass: string, name: string, desc: string }) {
  return (
    <div className={`p-4 rounded-ox-lg border border-ox-border ${bgClass} space-y-2`}>
      <div className={`font-bold text-ox-lg ${baseClass}`}>{name}</div>
      <div className={`${baseClass} opacity-90 text-ox-sm`}>{desc}</div>
    </div>
  );
}
