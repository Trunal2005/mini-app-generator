import Link from "next/link";
import { Zap, Code2, Table2, Upload, ArrowRight, Github } from "lucide-react";

const sampleConfig = `{
  "version": "1.0",
  "app": { "name": "Employee Directory" },
  "entities": [{
    "name": "employees",
    "fields": [
      { "name": "name", "type": "text" },
      { "name": "email", "type": "email" },
      { "name": "department", "type": "select" }
    ]
  }],
  "pages": [
    { "type": "table", "entity": "employees" },
    { "type": "dashboard" }
  ]
}`;

const features = [
  {
    icon: Code2,
    title: "Dynamic Forms",
    description:
      "Define field types in JSON. Get fully validated, production-ready forms instantly with no coding required.",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: Table2,
    title: "Real-time Tables",
    description:
      "Auto-generated data tables with sorting, filtering, pagination and CRUD operations — all from your config.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Upload,
    title: "CSV Import",
    description:
      "Bulk import data with intelligent column mapping, row validation, and detailed error reporting.",
    color: "from-pink-500 to-purple-500",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b1326] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-700/20 bg-[#0b1326]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              AppForge
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </nav>
          <div className="flex md:hidden gap-2">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white">Login</Link>
            <Link
              href="/register"
              className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              JSON-Driven Application Platform
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Turn{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                JSON
              </span>{" "}
              into
              <br />
              Working Apps
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Define your data model in JSON. AppForge generates forms, tables, dashboards
              and APIs instantly — no coding required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="https://github.com"
                className="flex items-center gap-2 px-6 py-3 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-medium rounded-xl transition-all"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </Link>
            </div>
          </div>

          {/* Code preview */}
          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-gray-700/30 bg-[#131b2e] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-gray-500 font-mono ml-2">app.config.json</span>
              </div>
              <pre className="p-4 text-xs font-mono text-green-300 overflow-x-auto leading-relaxed">
                <code>{sampleConfig}</code>
              </pre>
            </div>
            <div className="rounded-2xl border border-gray-700/30 bg-[#131b2e] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-gray-500 font-mono ml-2">Generated App Preview</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-gray-700/30">
                  <h3 className="text-sm font-semibold text-gray-200">Employee Directory</h3>
                  <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">Live</span>
                </div>
                <div className="space-y-2">
                  {[{ name: "Alice Johnson", email: "alice@co.com", dept: "Engineering" }, { name: "Bob Smith", email: "bob@co.com", dept: "Marketing" }, { name: "Carol Lee", email: "carol@co.com", dept: "Sales" }].map((row, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-800/40 rounded-lg">
                      <div className="w-7 h-7 rounded-full bg-indigo-600/40 flex items-center justify-center text-indigo-300 text-xs font-bold">
                        {row.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-200 truncate">{row.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{row.email}</p>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">{row.dept}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <div className="flex-1 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs">
                    + Add Record
                  </div>
                  <div className="flex-1 h-8 rounded-lg bg-gray-800/50 border border-gray-700/30 flex items-center justify-center text-gray-400 text-xs">
                    CSV Import
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-[#060e20]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              From a simple JSON config to a full-featured web application in minutes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-[#131b2e] border border-gray-700/20 hover:border-gray-600/40 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-100 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
          <p className="text-gray-400 mb-8">Start for free, no credit card required.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25 text-lg"
          >
            Create your first app
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-700/20 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>AppForge © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-gray-300 transition-colors">Login</Link>
            <Link href="/register" className="hover:text-gray-300 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
