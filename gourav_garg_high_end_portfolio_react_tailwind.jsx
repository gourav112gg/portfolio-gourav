import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Github, Linkedin, Mail, ChevronRight, ExternalLink, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// === Simple GG Monogram Logo (SVG) ===
function GGLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label="Gourav Garg logo">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stopOpacity="1" />
          <stop offset="100%" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect rx="14" ry="14" width="64" height="64" fill="url(#g)" />
      <path
        d="M20 20h14a10 10 0 0 1 0 20h-9v-6h9a4 4 0 0 0 0-8H26v14h-6z"
        fill="currentColor"
      />
      <path
        d="M34 44V20h10a10 10 0 0 1 0 20h-4v-6h4a4 4 0 0 0 0-8h-4v18z"
        fill="currentColor"
      />
    </svg>
  );
}

// === Animated Background (Canvas Particles + Soft Gradient) ===
function AnimatedBackground({ enabled = true }: { enabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    function resize() {
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      // regenerate particles according to area
      const density = 0.00012; // particles per pixel
      const target = Math.max(60, Math.min(220, Math.floor(w * h * density)));
      const arr = particlesRef.current;
      while (arr.length < target) {
        arr.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
        });
      }
      while (arr.length > target) arr.pop();
    }

    function drawGradient() {
      const { innerWidth: w, innerHeight: h } = window;
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "rgba(120,119,198,0.20)"); // indigo
      g.addColorStop(1, "rgba(99, 102, 241,0.08)"); // violet
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    function step() {
      const { innerWidth: w, innerHeight: h } = window;
      ctx.clearRect(0, 0, w, h);
      drawGradient();

      const arr = particlesRef.current;
      // update + draw particles
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fill();
      }

      // lines between nearby particles
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i], b = arr[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 140 * 140) {
            const alpha = 0.12 * (1 - d2 / (140 * 140));
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // gentle attraction to mouse
      const m = mouseRef.current;
      if (m) {
        for (let i = 0; i < arr.length; i++) {
          const p = arr[i];
          const dx = m.x - p.x, dy = m.y - p.y;
          const dist = Math.hypot(dx, dy) || 1;
          const force = Math.min(0.04, 20 / (dist * dist));
          p.vx += force * dx;
          p.vy += force * dy;
          p.vx *= 0.98; // damping
          p.vy *= 0.98;
        }
      }

      rafRef.current = requestAnimationFrame(step);
    }

    resize();
    step();

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => (mouseRef.current = null);

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled]);

  return (
    <>
      {/* soft blurred glow layer */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full blur-3xl opacity-30 bg-fuchsia-500/30" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full blur-3xl opacity-30 bg-indigo-500/30" />
      </div>
      {/* particles canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 -z-10" aria-hidden />
    </>
  );
}

// === Reveal wrapper using Framer Motion whileInView ===
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

// === Data you can edit ===
const PROFILE = {
  name: "Gourav Garg",
  tagline: "AI/ML Student • Builder • Visual Creator",
  location: "India",
  email: "your.email@example.com", // TODO: replace
  linkedin: "https://www.linkedin.com/in/your-username/", // TODO: replace
  github: "https://github.com/your-username", // TODO: replace
  resumeUrl: "#", // TODO: link to PDF resume if any
};

const ABOUT = `I’m a 17-year-old Computer Science student focused on AI and Machine Learning. I love turning ideas into practical, fast, and clean solutions. Alongside tech, I explore art and photography, which keeps my eye sharp for design and detail.`;

const INTROS = {
  events:
    "Hi everyone! I’m Gourav Garg, driven by a deep passion for technology and coding. I specialize in programming and high-speed typing and I love turning ideas into digital solutions. If you’re curious and creative, let’s connect!",
  classroom:
    "Good morning/afternoon! I’m Gourav Garg, with a strong interest in technology and coding. I’m improving my programming and fast-typing skills and enjoy solving problems. Excited to share and learn with you all!",
  public:
    "Hello! I’m Gourav Garg, and I believe age doesn’t limit passion. Mine is technology and coding. With skills in programming and fast typing, I explore how tech can improve lives. Here to inspire and learn together.",
};

const SKILLS = {
  tech: [
    "Python",
    "C",
    "C++",
    "HTML/CSS",
    "TensorFlow / PyTorch (basics)",
    "Scikit-learn",
    "Pandas & NumPy",
    "Git & GitHub",
  ],
  soft: ["Teamwork", "Leadership", "Public speaking", "Fast typing"],
  creative: ["Photography", "Painting", "Canva"],
};

const PROJECTS = [
  {
    title: "Hackathon Project – Smart Campus Assistant",
    period: "2025",
    tags: ["Python", "LLM", "FastAPI", "RAG"],
    description:
      "Built in a 24-hr hackathon: a campus Q&A assistant that answers queries about events, schedules, and locations using retrieval-augmented generation.",
    highlights: [
      "Implemented vector search over PDFs and web pages",
      "Deployed a simple API and React UI",
      "Team of 3: I led the backend & integration",
    ],
    links: [
      { label: "GitHub", href: "#" }, // TODO
      { label: "Demo", href: "#" },
    ],
  },
  {
    title: "ML – Pneumonia X-ray Classifier (learning project)",
    period: "2024",
    tags: ["Python", "TensorFlow", "CNN"],
    description:
      "Trained a small CNN to classify chest X-rays as pneumonia/normal for learning purposes; explored data augmentation and evaluation.",
    highlights: [
      "~85% validation accuracy on a public dataset",
      "Experimented with transfer learning",
      "Logged training with TensorBoard",
    ],
    links: [
      { label: "Notebook", href: "#" }, // TODO
    ],
  },
  {
    title: "Web – Typing Speed Tracker",
    period: "2024",
    tags: ["HTML", "CSS", "JavaScript"],
    description:
      "A clean web app that measures WPM/accuracy, stores best scores locally, and offers practice modes.",
    highlights: [
      "Minimal UI with keyboard hints",
      "Accuracy + streak mechanics",
    ],
    links: [{ label: "Live", href: "#" }], // TODO
  },
  {
    title: "Photography Showcase",
    period: "Ongoing",
    tags: ["Lightroom", "Composition", "Story"],
    description:
      "Curated shots exploring light, texture, and color theory. Adds a visual edge to my product thinking.",
    highlights: ["Portrait & street themes", "Rule of thirds & leading lines"],
    links: [{ label: "Gallery", href: "#" }], // TODO
  },
];

const CONTACT_NOTE = "Open to AI/ML internships, campus ambassador roles, and hackathons.";

function useScrollSpy(ids: string[], offset = 100) {
  const [activeId, setActiveId] = useState(ids[0]);
  useEffect(() => {
    const handler = () => {
      const scrollY = window.scrollY + offset;
      let current = ids[0];
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY) current = id;
      });
      setActiveId(current);
    };
    handler();
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, [ids, offset]);
  return activeId;
}

export default function Portfolio() {
  const sections = useMemo(
    () => [
      { id: "home", label: "Home" },
      { id: "about", label: "About" },
      { id: "skills", label: "Skills" },
      { id: "projects", label: "Projects" },
      { id: "contact", label: "Contact" },
    ],
    []
  );

  const active = useScrollSpy(sections.map((s) => s.id), 120);
  const [dark, setDark] = useState(true);
  const [bgOn, setBgOn] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
      {/* Animated background behind everything */}
      {bgOn && <AnimatedBackground enabled />}

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/30 border-b border-neutral-200/60 dark:border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GGLogo className="w-8 h-8 text-neutral-900 dark:text-neutral-100" />
            <span className="font-semibold">{PROFILE.name}</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`px-3 py-2 rounded-xl text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ${
                  active === s.id ? "bg-neutral-100 dark:bg-neutral-800" : ""
                }`}
              >
                {s.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="rounded-2xl" onClick={() => setDark((d) => !d)}>
              {dark ? "Light" : "Dark"}
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={() => setBgOn((b) => !b)}>
              {bgOn ? "BG Off" : "BG On"}
            </Button>
            <a href={PROFILE.resumeUrl} target="_blank" className="hidden md:inline-block">
              <Button className="rounded-2xl">Resume</Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <motion.section id="home" className="mx-auto max-w-6xl px-4 pt-12 pb-8 md:pt-20 md:pb-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <Reveal>
            <div>
              <p className="text-sm tracking-wide uppercase text-neutral-500 dark:text-neutral-400">{PROFILE.location} • Available for opportunities</p>
              <h1 className="mt-3 text-3xl md:text-5xl font-bold leading-tight">
                Building with <span className="underline decoration-wavy underline-offset-4">AI & ML</span>,
                and an eye for design.
              </h1>
              <p className="mt-4 text-neutral-600 dark:text-neutral-300">{ABOUT}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={PROFILE.linkedin} target="_blank" rel="noreferrer">
                  <Button className="rounded-2xl inline-flex items-center gap-2"><Linkedin className="w-4 h-4" />LinkedIn</Button>
                </a>
                <a href={PROFILE.github} target="_blank" rel="noreferrer">
                  <Button variant="secondary" className="rounded-2xl inline-flex items-center gap-2"><Github className="w-4 h-4" />GitHub</Button>
                </a>
                <a href={`mailto:${PROFILE.email}`}>
                  <Button variant="outline" className="rounded-2xl inline-flex items-center gap-2"><Mail className="w-4 h-4" />Email</Button>
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="rounded-3xl shadow-sm">
              <CardContent className="p-6">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center">
                  {/* Replace with your photo */}
                  <span className="text-neutral-500 dark:text-neutral-400">Your photo here</span>
                </div>
                <div className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                  Tip: Add a crisp portrait (good light, neutral background). Keep it consistent with LinkedIn.
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </motion.section>

      {/* About with quick intros */}
      <section id="about" className="mx-auto max-w-6xl px-4 py-12 md:py-20 border-t border-neutral-200/60 dark:border-neutral-800">
        <Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold">About</h2>
              <p className="mt-3 text-neutral-600 dark:text-neutral-300">
                {ABOUT}
              </p>
            </div>
            <div className="md:col-span-2">
              <div className="grid sm:grid-cols-3 gap-4">
                {Object.entries(INTROS).map(([k, v]) => (
                  <Card key={k} className="rounded-2xl">
                    <CardContent className="p-4">
                      <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{k}</div>
                      <p className="mt-2 text-sm">{v}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Skills */}
      <section id="skills" className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <Reveal>
          <h2 className="text-2xl md:text-3xl font-semibold">Skills</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            {Object.entries(SKILLS).map(([group, items]) => (
              <Card key={group} className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="text-sm uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{group}</div>
                  <ul className="mt-4 space-y-2">
                    {items.map((it) => (
                      <li key={it} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Projects */}
      <section id="projects" className="mx-auto max-w-6xl px-4 py-12 md:py-20 border-t border-neutral-200/60 dark:border-neutral-800">
        <Reveal>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl md:text-3xl font-semibold">Projects</h2>
            <a href={PROFILE.github} target="_blank" className="text-sm inline-flex items-center gap-1 hover:underline">
              View more <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {PROJECTS.map((p) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <Card className="rounded-2xl hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{p.title}</h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{p.period}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {p.tags.map((t: string) => (
                          <span key={t} className="text-xs px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{p.description}</p>
                    <ul className="mt-3 space-y-2 text-sm">
                      {p.highlights.map((h: string) => (
                        <li key={h} className="flex items-center gap-2">
                          <ChevronRight className="w-4 h-4" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {p.links.map((l: any) => (
                        <a key={l.href} href={l.href} target="_blank" className="inline-flex items-center gap-2 text-sm hover:underline">
                          <ExternalLink className="w-4 h-4" /> {l.label}
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <Reveal>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold">Let’s connect</h2>
              <p className="mt-3 text-neutral-600 dark:text-neutral-300">{CONTACT_NOTE}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={PROFILE.linkedin} target="_blank" rel="noreferrer">
                  <Button className="rounded-2xl inline-flex items-center gap-2"><Linkedin className="w-4 h-4" />Message on LinkedIn</Button>
                </a>
                <a href={`mailto:${PROFILE.email}`}>
                  <Button variant="outline" className="rounded-2xl inline-flex items-center gap-2"><Mail className="w-4 h-4" />Email me</Button>
                </a>
              </div>
            </div>
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <form className="grid gap-3">
                  <input className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900" placeholder="Your name" />
                  <input className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900" placeholder="Your email" />
                  <textarea className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 min-h-[120px]" placeholder="Your message" />
                  <Button className="rounded-2xl">Send</Button>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">This demo form is static. Replace with Formspree or a serverless function.</div>
                </form>
              </CardContent>
            </Card>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200/60 dark:border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GGLogo className="w-6 h-6" />
            <span>© {new Date().getFullYear()} {PROFILE.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={PROFILE.github} target="_blank" aria-label="GitHub"><Github className="w-5 h-5" /></a>
            <a href={PROFILE.linkedin} target="_blank" aria-label="LinkedIn"><Linkedin className="w-5 h-5" /></a>
            <a href={`mailto:${PROFILE.email}`} aria-label="Email"><Mail className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
