import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowRight, Award, Baby, BarChart3, BookOpen, Building2, Bus, Calendar, Check, ChevronDown, ChevronRight, ClipboardCheck, Clock, Droplets, Eye, FileText, FlaskConical, Globe2, GraduationCap, Handshake, Heart, Instagram, Languages, Lightbulb, Mail, MapPin, Menu, MessageCircle, MessageSquare, Music, Palette, Phone, Presentation, Quote, Search, Send, Smile, Sprout, Stethoscope, Tent, TrendingUp, Trophy, User, UserRound, Users, Volume2, VolumeX, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
const WALLPAPER_TILE = { width: 897, height: 1753 };
/* Earth, sun, cup, star, rocket, laptop, books, cricket, lion, football
   (physical-education) and painting (paint-palette) are pinned to specific
   spots next to About Us / Results / Facilities / Gallery / Testimonials
   content instead (see `PinnedIcon` and where it's used below) — dropped
   from this generic repeating set so they don't also turn up scattered at
   random elsewhere on the page. Rainbow, sleeping (moon) and
   carrot/pineapple were dropped outright rather than pinned. Only one of
   the two apples survives here too. */
const WALLPAPER_ICONS = [
  { file: 'apple-svgrepo-com.svg', leftPct: 93.1, topPct: 10, widthPct: 6 },
  { file: 'elephant-svgrepo-com.svg', leftPct: 2, topPct: 64, widthPct: 6.8 },
  { file: 'bulb-svgrepo-com.svg', leftPct: 92.8, topPct: 95, widthPct: 6 },
] as const;

const ALL_TILE_ICONS = WALLPAPER_ICONS;

const FLOAT_VARIANTS = ['wallpaper-icon-float-a', 'wallpaper-icon-float-b', 'wallpaper-icon-float-c'];

/* Scattered across the full width now rather than pinned to the two edge
   gutters — each icon's base spot is just a seed that gets thrown anywhere
   across a wide band on each side rather than pinned to one exact spot, so
   the sixteen repeats of this tile don't line up into hairline columns —
   but still kept out of the centre band where the reading content sits
   (Facilities, cards, etc.), so icons never land on top of text. `Math.random`
   is fine here: the tile isn't re-rendered after it mounts, so the scatter
   doesn't reshuffle under the reader. */
function WallpaperTile() {
  return <div className="relative mx-auto w-full" style={{ aspectRatio: `${WALLPAPER_TILE.width} / ${WALLPAPER_TILE.height}` }}>
    {ALL_TILE_ICONS.map((icon, index) => {
      const onLeft = icon.leftPct < 50;
      const width = icon.widthPct * 0.92;
      /* `left` is the icon's LEFT edge, so the right-hand band has to stop at
         `100 - width` — anchoring it at up to 100% pushed the icon's own
         width past the tile and the layer's `overflow-hidden` sliced it off.
         `MARGIN` leaves room for the float animation, which drifts each icon
         a little way in both axes. */
      const MARGIN = 1.5;
      const left = onLeft ? MARGIN + Math.random() * 12 : (100 - width - MARGIN) - Math.random() * 12;
      /* Same again vertically. The tile is far taller than it is wide, so a
         square icon `width`% across is only about half that in height-%. */
      const heightPct = width * (WALLPAPER_TILE.width / WALLPAPER_TILE.height);
      const top = Math.max(MARGIN, Math.min(100 - heightPct - MARGIN, icon.topPct + (Math.random() * 10 - 5)));
      return <div key={`${icon.file}-${index}`} className="wallpaper-icon-depth absolute" style={{ left: `${left}%`, top: `${top}%`, width: `${width}%` }}>
        <img src={`/wallpaper-icons/${icon.file}`} alt="" aria-hidden="true" className={`block w-full opacity-65 ${FLOAT_VARIANTS[index % FLOAT_VARIANTS.length]}`} style={{ animationDelay: `${((index * 1.3) % 12).toFixed(2)}s`, animationDuration: `${(14 + (index % 7) * 2.2).toFixed(2)}s` }} />
      </div>;
    })}
  </div>;
}

/* A single decorative icon, deliberately placed (via `className`) next to a
   specific piece of content, rather than one of the randomly-scattered
   wallpaper icons. Needs a `relative` ancestor to position against.

   Split into an outer/inner pair exactly like `WallpaperTile`'s icons:
   `wallpaper-icon-depth` (outer) is the cursor-repel effect driven by
   `WallpaperLayer`'s mousemove listener, which sets `transform` via the
   `--repel-x`/`--repel-y` custom properties; `wallpaper-icon-float-a`
   (inner) is the floating-bob *animation*, which also drives `transform`.
   Putting both on the same element would have the animation clobber the
   repel offset every frame, so each gets its own element. The
   `className`/`style` props (position, centering margins) go on the outer
   element since that's the one being positioned/repelled; the inner `img`
   just fills it. The `.wallpaper-icon-float-a` class only names the
   keyframes — it never sets a duration — so it needs one set inline or the
   animation runs in 0s and the icon just sits still, exactly like
   `WallpaperTile` already does per icon. Randomised per mount (each pin
   only mounts once) so nearby icons don't bob in lockstep. */
function PinnedIcon({ file, className = '', widthRem = 3.5, style }: { file: string; className?: string; widthRem?: number; style?: CSSProperties }) {
  return <div className={`wallpaper-icon-depth pointer-events-none absolute ${className}`} style={{ width: `${widthRem}rem`, ...style }}>
    <img src={`/wallpaper-icons/${file}`} alt="" aria-hidden="true" className="wallpaper-icon-float-a block w-full opacity-65" style={{ animationDuration: `${(14 + Math.random() * 10).toFixed(2)}s`, animationDelay: `${(Math.random() * 6).toFixed(2)}s` }} />
  </div>;
}

/* ═══════════════════════ WHERE THE DECORATIVE ICONS SIT ═══════════════════
   Every deliberately-placed icon on the site is listed here, grouped by the
   section it belongs to. This is the only place you need to edit to move
   one — nothing else in the file hard-codes a position.

   Each entry takes:
     file   the filename in  public/wallpaper-icons/  (see that folder for
            the full set: apple, books, bulb, carrot, cricket, cup, earth,
            educate, elephant, giraffe, laptop, lion, paint-palette-palette,
            physical-education, pineapple, rainbow, rocket, sleeping, star,
            sun — each ends in `-svgrepo-com.svg`)
     top    distance down from the section's top — '0%' is the very top,
            '50%' halfway, '100%' the bottom. Use `bottom` instead to
            measure up from the bottom edge.
     left   distance in from the section's left edge. Use `right` instead to
            measure in from the right edge. Small values like '1%' sit in
            the page margin; anything past roughly '15%' starts to overlap
            the text column, so keep them small unless you want an icon
            sitting over the content.
     size   width in rem — 3.5 is the usual, 4.5 is noticeably bigger.

   To MOVE an icon, change its numbers. To ADD one, copy a line and change
   the file. To REMOVE one, delete its line. To move an icon to a different
   section, cut the line and paste it under that section's heading. Changes
   show up as soon as you save — no restart needed.

   Tip for dialling in a position: nudge in steps of 5% and refresh; the
   percentages are of the whole section, so a tall section (Facilities)
   moves a lot per percent and a short one moves a little.            */
type IconPin = { file: string; top?: string; bottom?: string; left?: string; right?: string; size?: number };

const PINNED_ICONS = {
  /* ── About Us (the intro paragraph, the Vivekananda picture, branch cards) */
  about: [
    { file: 'sun-svgrepo-com.svg', top: '2%', right: '2%', size: 4 },
    { file: 'earth-svgrepo-com.svg', top: '24%', right: '1.5%', size: 4.5 },
  ],
  /* ── SSC Results (the three result posters) */
  results: [
    { file: 'cup-svgrepo-com.svg', top: '42%', right: '1.5%', size: 4.5 },
    { file: 'star-svgrepo-com.svg', top: '36%', left: '1.5%', size: 4 },
    { file: 'rocket-svgrepo-com.svg', top: '50%', left: '1.5%', size: 4.5 },
  ],
  /* ── Facilities (the row of four circles) */
  facilities: [
    { file: 'lion-svgrepo-com.svg', top: '42%', left: '1.5%', size: 3.5 },
    { file: 'laptop-svgrepo-com.svg', top: '28%', right: '1.5%', size: 4 },
    { file: 'books-svgrepo-com.svg', top: '62%', right: '1.5%', size: 4 },
  ],
  /* ── Photo Gallery (the video and the circles beside it) */
  gallery: [
    { file: 'cricket-svgrepo-com.svg', top: '55%', right: '1.5%', size: 3.5 },
    { file: 'physical-education-svgrepo-com.svg', top: '62%', left: '1.5%', size: 3.5 },
  ],
} satisfies Record<string, IconPin[]>;

/* Icons thrown at random over a whole section rather than lined up in a
   gutter. Positions are rolled once, in a `useState` initialiser rather than
   on every render, so the scatter doesn't jump around under the reader.

   The layering is what makes a full-width scatter safe: this wrapper is
   `z-0` and the section's content is `relative z-10`, so an icon that lands
   under a paragraph passes behind it instead of sitting on top of the words.
   Without that, absolutely-positioned icons paint above in-flow text and the
   section becomes unreadable wherever one lands. */
/* Drops one section's icons in. The section it's used in needs `relative`
   on it, which is what the percentages are measured against. */
function SectionIcons({ pins }: { pins: readonly IconPin[] }) {
  return <>{pins.map((pin, index) => <PinnedIcon
    key={`${pin.file}-${index}`}
    file={pin.file}
    widthRem={pin.size ?? 3.5}
    style={{ top: pin.top, bottom: pin.bottom, left: pin.left, right: pin.right }}
  />)}</>;
}

function WallpaperLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<{ el: HTMLDivElement; cx: number; cy: number }[]>([]);
  useEffect(() => {
    const container = layerRef.current; if (!container) return;
    const REPEL_RADIUS = 130;
    const REPEL_STRENGTH = 42;
    let measureQueued = false;
    /* `document`, not `container` — `PinnedIcon`s render inside their own
       sections (About Us, Results, Facilities, ...), not inside this layer,
       so scoping the scan to `container` would miss every one of them and
       only the randomly-scattered tile icons would ever repel from the
       cursor. */
    const measure = () => {
      measureQueued = false;
      iconsRef.current = Array.from(document.querySelectorAll<HTMLDivElement>('.wallpaper-icon-depth')).map((el) => {
        const r = el.getBoundingClientRect();
        return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
      });
    };
    const queueMeasure = () => { if (!measureQueued) { measureQueued = true; requestAnimationFrame(measure); } };
    queueMeasure();
    let moveQueued = false;
    const onMove = (event: MouseEvent) => {
      if (moveQueued) return; moveQueued = true;
      requestAnimationFrame(() => {
        moveQueued = false;
        for (const { el, cx, cy } of iconsRef.current) {
          const dx = cx - event.clientX; const dy = cy - event.clientY;
          const dist = Math.hypot(dx, dy);
          if (dist < REPEL_RADIUS && dist > 0.01) {
            const force = 1 - dist / REPEL_RADIUS;
            el.style.setProperty('--repel-x', `${((dx / dist) * REPEL_STRENGTH * force).toFixed(1)}px`);
            el.style.setProperty('--repel-y', `${((dy / dist) * REPEL_STRENGTH * force).toFixed(1)}px`);
          } else {
            el.style.setProperty('--repel-x', '0px');
            el.style.setProperty('--repel-y', '0px');
          }
        }
      });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', queueMeasure);
    window.addEventListener('scroll', queueMeasure, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', queueMeasure);
      window.removeEventListener('scroll', queueMeasure);
    };
  }, []);
  return <div ref={layerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="flex flex-col">
      {Array.from({ length: 16 }, (_, index) => <WallpaperTile key={index} />)}
    </div>
  </div>;
}


/* Clicking a photograph opens it in an overlay on the page rather than
   handing it to a new browser tab. The opener is handed down by context
   because the things that open one — gallery orbs, gallery tiles, results
   cards — sit several levels below `PageShell`, which is what owns the
   state and renders the overlay. Defaults to a no-op so a component used
   outside a shell still renders. */
const LightboxContext = createContext<(src: string, alt: string) => void>(() => undefined);
const useLightbox = () => useContext(LightboxContext);

function Lightbox({ image, onClose }: { image: { src: string; alt: string }; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    /* The page behind must not scroll while the overlay is up, or a trackpad
       flick moves the page rather than doing nothing. */
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = previous; };
  }, [onClose]);
  /* Backdrop closes; the photograph itself does not, so a click that lands on
     the picture is not read as "I am done looking at this". */
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-[#101A2B]/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={image.alt} onClick={onClose} data-testid="lightbox">
    <button type="button" onClick={onClose} aria-label="Close image" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-[#123A5E] shadow-lg transition hover:bg-white" data-testid="button-lightbox-close"><X size={22} /></button>
    <img src={image.src} alt={image.alt} className="max-h-[88dvh] max-w-[min(1100px,94vw)] rounded-xl border-[6px] border-white object-contain shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)]" onClick={(event) => event.stopPropagation()} />
  </div>;
}

const queryClient = new QueryClient();
/* `#…` scrolls to a section on the home page; `/…` is a route of its own. The
   nav treats the two differently, so they can sit in one list. */
/* Blogs is gone with the parent-testimonial section it pointed at — an
   anchor to a section that no longer exists would simply do nothing. */
const navItems = [
  ['Home', '/'], ['About Us', '#about'], ['Results', '#results'],
  ['Facilities', '#media'], ['School Life', '#school-life'], ['Gallery', '/gallery'],
  ['Blogs', '/blogs'], ['Contact Us', '#contact'],
] as const;
/* The header's own nav; `navItems` above stays the fuller list the footer
   prints. Labels are kept short here — "Why Us", not "Why Vivekananda
   Concept School" — because seven of them plus the Campuses menu is already
   as much as the bar holds before it wraps. */
/* `Home` is a route rather than `#top`: from a branch page the anchor would
   only scroll that branch's own hero into view, where what is wanted is the
   way back to the group. Faculty is gone from here — it belongs to a branch
   now — and Gallery has a page of its own. */
const headerNavItems = [
  ['Home', '/'], ['About Us', '#about'], ['Results', '#results'],
  ['Facilities', '#media'], ['School Life', '#school-life'], ['Gallery', '/gallery'],
] as const;

function useReveals(key?: string) {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')), { threshold: .12 });
    document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [key]);
}

/* `branchName` prints under the wordmark on a branch route, and `hideGroup`
   drops the GROUP OF SCHOOLS line there — that line belongs to the group's
   own pages, not to one school inside it. */
function Logo({ footer = false, branchName, shimmer = 0 }: { footer?: boolean; branchName?: string; shimmer?: number }) {
  const [location, navigate] = useLocation();
  /* On the home page `#top` is enough — the browser just scrolls the hero
     into view. Anywhere else (Gallery, Blogs, a campus page) there is no
     `#top` element on that route, so the hash quietly does nothing; this
     routes home first and then scrolls, which is what "take me to home"
     actually means from any page. */
  return <a href="/" onClick={(event) => {
    event.preventDefault();
    if (location === '/') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    navigate('/');
    window.scrollTo({ top: 0 });
  }} className="flex shrink-0 items-center gap-3.5" data-testid="link-logo">
    <span className="relative block h-[64px] w-[64px] shrink-0 overflow-hidden rounded-full sm:h-[82px] sm:w-[82px]">
      <img src="/logo.jpeg" alt="Sree Vivekananda Educational Society logo" className="h-full w-full object-cover" />
      {/* Keyed on the click count: a fresh element each click is what restarts
          the animation, since re-rendering the same node would not. */}
      {shimmer > 0 && <span key={shimmer} className="logo-shimmer" aria-hidden="true" />}
    </span>
    <span className="leading-none">
      <b className={`block font-round text-[clamp(.9rem,1.5vw,1.35rem)] font-extrabold tracking-[.045em] ${footer ? 'text-white' : 'text-[#123A5E]'}`}>SREE VIVEKANANDA</b>
      <small className={`mt-[6px] block text-[clamp(.55rem,.75vw,.75rem)] font-semibold tracking-[.15em] sm:tracking-[.2em] ${footer ? 'text-white/70' : 'text-[#7C8B99]'}`}>EDUCATIONAL SOCIETY</small>
      {branchName && <small className={`mt-[6px] block text-[clamp(.62rem,.9vw,.82rem)] font-semibold tracking-[.06em] ${footer ? 'text-white' : 'text-[#2E6A9E]'}`} data-testid="text-header-branch">{branchName}</small>}
    </span>
  </a>;
}

function Header({ onEnquire }: { onEnquire: () => void }) {
  const [open, setOpen] = useState(false);
  const [branchesOpen, setBranchesOpen] = useState(false);
  /* Bumped on every nav click; the crest reads it as the cue to flash. */
  const [shimmer, setShimmer] = useState(0);
  const [location, navigate] = useLocation();
  /* A route of its own owns the highlight outright; on the home page the
     highlight follows whichever section link was last taken. */
  const [active, setActive] = useState(() => location);
  useEffect(() => { setActive(location); }, [location]);
  /* Read while rendering rather than at module load: `BRANCHES` is declared
     further down the file, so a top-level derivation would run too early. */
  const branchLinks = Object.entries(BRANCHES);
  const onBranch = location.startsWith('/branch/');
  /* These are home-page sections; from a campus page the links would only
     bounce you back to the group site, so they are not offered there. */
  const homeOnly = ['#results', '#media', '#school-life'];
  const items = onBranch ? headerNavItems.filter(([, href]) => !homeOnly.includes(href)) : headerNavItems;
  const currentBranch = onBranch ? BRANCHES[location.slice('/branch/'.length)] : undefined;
  const go = (href: string) => {
    setOpen(false);
    setBranchesOpen(false);
    setShimmer((count) => count + 1);
    setActive(href);
    if (!href.startsWith('#')) { navigate(href); window.scrollTo({ top: 0 }); return; }
    const target = document.querySelector(href);
    if (target) { target.scrollIntoView({ behavior: 'smooth' }); return; }
    /* The section is on the home page and we are not on it — the anchor would
       otherwise do nothing at all from /faculty. Route home first, then
       scroll on the frame after the sections have mounted. */
    navigate('/');
    requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })));
  };
  return <header className="sticky top-0 z-30 border-b border-[#EFE7D7] bg-white">
    <div className="container-hero flex min-h-[80px] items-center justify-between gap-4 sm:min-h-[104px] sm:gap-6">
      <Logo branchName={currentBranch?.streetName} shimmer={shimmer} />
      <nav className="hidden items-center gap-[clamp(.9rem,2.1vw,2.1rem)] lg:flex" aria-label="Primary navigation">
        {items.map(([label, href]) => {
          const on = active === href;
          return <a key={href} href={href} onClick={(e) => { e.preventDefault(); go(href); }} aria-current={on ? 'page' : undefined} className={`relative whitespace-nowrap pb-[6px] text-[clamp(.9rem,1.05vw,1.06rem)] font-semibold transition-colors ${on ? 'text-[#1B7A3E]' : 'text-[#153B5B] hover:text-[#1B7A3E]'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
            {label}
            <span className={`absolute -bottom-[3px] left-0 h-[3px] rounded-full bg-[#1B7A3E] transition-all duration-300 ${on ? 'w-full opacity-100' : 'w-0 opacity-0'}`} />
          </a>;
        })}
        {/* The three branches are routes, not sections, so they hang off one
            menu rather than lengthening a nav that is already full. */}
        <div className="relative" onMouseEnter={() => setBranchesOpen(true)} onMouseLeave={() => setBranchesOpen(false)}>
          <button type="button" onClick={() => setBranchesOpen(!branchesOpen)} aria-expanded={branchesOpen} aria-haspopup="true" className={`relative flex items-center gap-1 whitespace-nowrap pb-[6px] text-[clamp(.9rem,1.05vw,1.06rem)] font-semibold transition-colors ${onBranch ? 'text-[#1B7A3E]' : 'text-[#153B5B] hover:text-[#1B7A3E]'}`} data-testid="button-nav-branches">
            Campuses
            <ChevronDown size={14} className={`transition-transform duration-200 ${branchesOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            <span className={`absolute -bottom-[3px] left-0 h-[3px] rounded-full bg-[#1B7A3E] transition-all duration-300 ${onBranch ? 'w-full opacity-100' : 'w-0 opacity-0'}`} />
          </button>
          {branchesOpen && <div className="absolute left-1/2 top-full z-40 w-[268px] -translate-x-1/2 rounded-xl border border-[#EFE7D7] bg-white p-1.5 shadow-[0_12px_28px_rgba(31,40,56,.18)]" role="menu">
            {branchLinks.map(([slug, info]) => <a key={slug} href={`/branch/${slug}`} onClick={(e) => { e.preventDefault(); go(`/branch/${slug}`); }} role="menuitem" className={`block rounded-lg px-3 py-2.5 text-left text-[14px] font-semibold transition-colors ${location === `/branch/${slug}` ? 'bg-[#EAF1F9] text-[#1B7A3E]' : 'text-[#153B5B] hover:bg-[#F2F7FC] hover:text-[#1B7A3E]'}`} data-testid={`link-nav-branch-${slug}`}>
              {info.streetName}
              <span className="mt-0.5 block text-[12px] font-medium text-[#7C8B99]">Pulivendla, Kadapa District</span>
            </a>)}
          </div>}
        </div>
      </nav>
      <div className="flex items-center gap-2">
        <button onClick={onEnquire} className="hidden rounded-full border-2 border-[#123A5E] px-[clamp(1.3rem,2.1vw,2.1rem)] py-[11px] text-[clamp(.9rem,1.05vw,1.06rem)] font-semibold text-[#123A5E] transition hover:bg-[#123A5E] hover:text-white md:block" data-testid="button-header-enquiry">Contact Us</button>
        <button onClick={() => setOpen(!open)} className="rounded-md p-2 text-[#153B5B] lg:hidden" aria-label="Toggle menu" data-testid="button-mobile-menu">{open ? <X size={24} /> : <Menu size={24} />}</button>
      </div>
    </div>
    {open && <div className="border-t border-[#EFE7D7] bg-white px-5 py-3 lg:hidden">
      <nav>
        {items.map(([label, href]) => <a key={href} href={href} onClick={(e) => { e.preventDefault(); go(href); }} className="flex items-center justify-between border-b border-[#EFE7D7] py-3 text-[15px] font-semibold text-[#153B5B]" data-testid={`link-mobile-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}<ChevronRight size={15} /></a>)}
        <div className="border-b border-[#EFE7D7] py-3">
          <p className="text-[12px] font-bold uppercase tracking-[.16em] text-[#7C8B99]">Campuses</p>
          {branchLinks.map(([slug, info]) => <a key={slug} href={`/branch/${slug}`} onClick={(e) => { e.preventDefault(); go(`/branch/${slug}`); }} className="flex items-center justify-between py-2 text-[15px] font-semibold text-[#153B5B]" data-testid={`link-mobile-branch-${slug}`}>{info.streetName}<ChevronRight size={15} /></a>)}
        </div>
      </nav>
      <a href="tel:+918500045678" className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#1B7A3E]" data-testid="link-mobile-phone"><Phone size={14} /> +91 85000 45678</a>
      <button onClick={onEnquire} className="mt-3 w-full rounded-full bg-[#1B7A3E] py-3 text-sm font-bold text-white" data-testid="button-mobile-enquiry">Contact Us</button>
    </div>}
  </header>;
}

/* ---------------------------------------------------------------- hero art */

/* One blobby outline drawn in a 0–100 box, reused twice: as the clip that
   gives the photo its cloud shape, and as the dashed ring around it. */
const HERO_BLOB = 'M50 2.5 C64 0.5 76.5 6 82.5 14 C93.5 12.5 100 22 98.5 34 C100 46 96 56.5 91.5 63 C96 74 89 85.5 77.5 87.5 C71.5 96.5 57.5 99.5 47.5 95 C35.5 100 22.5 96 17.5 86.5 C6 85 0.5 74 4 64 C0.5 53 2.5 41 8.5 35 C5 20 15.5 8.5 27.5 11 C33.5 4 42 1.5 50 2.5 Z';

const LEAF_PATH = 'M3 30 C 18 6, 56 -4, 97 10 C 78 44, 34 56, 3 30 Z';

function Leaf({ className = '', style, color = '#4C9A3F' }: { className?: string; style?: CSSProperties; color?: string }) {
  return <svg viewBox="0 0 100 56" className={className} style={style} aria-hidden="true">
    <path d={LEAF_PATH} fill={color} />
    <path d="M6 30 C 34 24, 66 17, 95 11" fill="none" stroke="rgba(255,255,255,.38)" strokeWidth="2.4" strokeLinecap="round" />
  </svg>;
}

function Bloom({ className = '', style, petal = '#F0863A', core = '#F7C948', petals = 6 }: { className?: string; style?: CSSProperties; petal?: string; core?: string; petals?: number }) {
  return <svg viewBox="0 0 60 60" className={className} style={style} aria-hidden="true">
    {Array.from({ length: petals }, (_, i) => <ellipse key={i} cx="30" cy="13.5" rx="7.5" ry="12.5" fill={petal} transform={`rotate(${(360 / petals) * i} 30 30)`} />)}
    <circle cx="30" cy="30" r="7" fill={core} />
  </svg>;
}

/* Leaves fanned out of one corner. The numbers are percentages of the cluster
   box, so the whole bouquet scales with the hero rather than the viewport. */
const LEAF_CLUSTER = [
  { left: -8, top: 46, w: 62, rot: -32, color: '#3E8F3B' },
  { left: 2, top: 22, w: 52, rot: -66, color: '#57A84A' },
  { left: -4, top: 68, w: 54, rot: 8, color: '#2F7C33' },
  { left: 24, top: 8, w: 44, rot: -88, color: '#6BBB57' },
  { left: 30, top: 52, w: 50, rot: -18, color: '#4C9A3F' },
  { left: 18, top: 82, w: 46, rot: 24, color: '#3E8F3B' },
  { left: 48, top: 30, w: 38, rot: -52, color: '#7CC763' },
  { left: 52, top: 72, w: 40, rot: 4, color: '#57A84A' },
];

function Foliage({ side }: { side: 'left' | 'right' }) {
  return <div className={`pointer-events-none absolute hidden sm:block ${side === 'left' ? '-bottom-14 -left-8 h-[min(34vw,320px)] w-[min(24vw,280px)]' : '-bottom-20 -right-6 h-[min(28vw,260px)] w-[min(19vw,220px)] -scale-x-100'}`} aria-hidden="true">
    {LEAF_CLUSTER.map((leaf, i) => <Leaf key={i} className="absolute drop-shadow-[0_4px_6px_rgba(31,70,40,.08)]" color={leaf.color} style={{ left: `${leaf.left}%`, top: `${leaf.top}%`, width: `${leaf.w}%`, transform: `rotate(${leaf.rot}deg)` }} />)}
    <Bloom className="absolute" style={{ left: '58%', top: '14%', width: '15%' }} />
    <Bloom className="absolute" style={{ left: '6%', top: '8%', width: '11%' }} petal="#F5A623" core="#E8722F" petals={5} />
  </div>;
}

/* The doodles floating around the photo. Positions are percentages of the
   photo frame so they keep their relationship to it at any width. */
function HeroDoodles() {
  return <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
    <svg viewBox="0 0 64 44" className="doodle-float absolute hidden sm:block left-[-12%] top-[3%] w-[13%]">
      <path d="M62 2 L2 24 L24 30 Z" fill="#FFC94D" />
      <path d="M62 2 L24 30 L28 42 L37 33 Z" fill="#E2911C" />
      <path d="M62 2 L24 30 L37 33 Z" fill="#F5B02E" />
    </svg>
    <svg viewBox="0 0 90 80" className="absolute hidden sm:block left-[-8%] top-[16%] w-[16%]">
      <path d="M6 4 C 34 6, 56 20, 62 42 C 68 64, 50 76, 30 70" fill="none" stroke="#7FA8D4" strokeWidth="2.2" strokeDasharray="5 7" strokeLinecap="round" />
    </svg>
    <svg viewBox="0 0 64 84" className="doodle-drift absolute hidden sm:block left-[-14%] top-[40%] w-[11%]">
      <path d="M32 2 C48 2 60 15 60 29 C60 43 46 55 32 61 C18 55 4 43 4 29 C4 15 16 2 32 2 Z" fill="#F2B33D" />
      <path d="M32 2 C24 12 20 21 20 29 C20 41 26 53 32 61 C38 53 44 41 44 29 C44 21 40 12 32 2 Z" fill="#E86A4E" />
      <path d="M32 2 C36 13 38 21 38 29 C38 41 35 53 32 61 C29 53 26 41 26 29 C26 21 28 13 32 2 Z" fill="#3FA9A0" />
      <path d="M25 61 L39 61 L36 69 L28 69 Z" fill="none" stroke="#B5713A" strokeWidth="1.6" />
      <rect x="26" y="69" width="12" height="10" rx="2.5" fill="#B5713A" />
    </svg>
    <Bloom className="doodle-spin absolute hidden sm:block left-[-9%] top-[63%] w-[7%]" petal="#F0863A" core="#F7C948" />
    <Bloom className="doodle-float absolute left-[62%] top-[-8%] w-[6%]" petal="#F7C948" core="#E8A020" petals={7} />
    <svg viewBox="0 0 40 30" className="absolute left-[57%] top-[-3%] w-[8%]">
      <path d="M20 24 C 8 24, 4 12, 14 10 C 20 -2, 34 2, 34 12 C 40 16, 36 26, 26 24 Z" fill="#57A84A" opacity=".85" />
    </svg>
    <svg viewBox="0 0 120 62" className="doodle-drift absolute hidden sm:block right-[-6%] top-[-4%] w-[19%]">
      <g fill="#CBE2F7"><ellipse cx="34" cy="36" rx="25" ry="17" /><ellipse cx="63" cy="28" rx="29" ry="21" /><ellipse cx="92" cy="38" rx="21" ry="15" /><rect x="14" y="38" width="94" height="16" rx="8" /></g>
    </svg>
    <svg viewBox="0 0 48 40" className="doodle-float absolute hidden sm:block right-[-8%] top-[26%] w-[7%]">
      <g fill="#5B9BE0"><path d="M24 20 C14 4 2 6 4 16 C5 24 16 24 24 20 Z" /><path d="M24 20 C34 4 46 6 44 16 C43 24 32 24 24 20 Z" /><path d="M24 20 C16 30 8 34 8 27 C8 21 17 19 24 20 Z" /><path d="M24 20 C32 30 40 34 40 27 C40 21 31 19 24 20 Z" /></g>
      <rect x="23" y="9" width="2" height="23" rx="1" fill="#2E6FB5" />
    </svg>
    <Bloom className="doodle-spin absolute hidden sm:block bottom-[6%] right-[-10%] w-[8%]" petal="#F0863A" core="#F7C948" />
    <svg viewBox="0 0 24 24" className="absolute left-[46%] top-[-6%] w-[2.6%]"><path d="M12 2 V22 M2 12 H22" stroke="#7FA8D4" strokeWidth="2.6" strokeLinecap="round" /></svg>
    <svg viewBox="0 0 24 24" className="absolute right-[4%] top-[46%] w-[2.2%]"><path d="M12 2 V22 M2 12 H22" stroke="#F5B02E" strokeWidth="2.6" strokeLinecap="round" /></svg>
    <svg viewBox="0 0 40 40" className="absolute hidden sm:block left-[-3%] top-[30%] w-[4%]"><circle cx="8" cy="8" r="3" fill="#F5B02E" /><circle cx="24" cy="16" r="2.4" fill="#E8722F" /><circle cx="12" cy="28" r="2" fill="#57A84A" /></svg>
  </div>;
}

/* ------------------------------------------------------------------- hero */

/* Every one of these is cut to exactly 1600×530 — the banner window's own
   ratio — so each fills the frame edge to edge with nothing cropped away at
   display size and no letterbox bar. They were cropped from the photographs
   the site already ships (see `public/banner-*.jpg`); to add another, cut it
   to 1600×530 and drop it in this list. */
const HERO_PHOTOS = [
  { src: '/banner-smart-classrooms.jpg', alt: 'Students at work in a smart classroom', caption: 'SMART CLASSROOMS' },
  { src: '/banner-safe-journeys.jpg', alt: 'Students boarding the school bus', caption: 'SAFE JOURNEYS, BRIGHTER TOMORROWS' },
  { src: '/banner-campus.jpg', alt: 'Students crossing the school courtyard', caption: 'A CAMPUS BUILT FOR LEARNING' },
  { src: '/banner-athletics.jpg', alt: 'Students racing on the athletics track', caption: 'STRONG BODIES, STRONG MINDS' },
  { src: '/banner-transport.jpg', alt: 'A student beside the school bus', caption: 'SAFE & CONVENIENT TRANSPORT' },
] as const;

function HeroBrand({ place, eyebrow, headingLevel }: { place: string; eyebrow: string; headingLevel: 'b' | 'h1' }) {
  const Title = headingLevel;
  return <div className="relative flex h-full items-center overflow-hidden bg-gradient-to-br from-[#D3E6F6] via-[#B9D8F0] to-[#9DC6E9] px-8 py-14">
    <span className="absolute -left-16 top-[-38px] h-[310px] w-[90px] rotate-[27deg] bg-white/45" />
    <span className="absolute -right-12 bottom-[-60px] h-[330px] w-[60px] rotate-[26deg] bg-[#7FB2DE]/45" />
    <div className="relative z-10 max-w-[480px] text-[#123A5E]">
      <p className="text-[13px] font-bold tracking-[.25em] text-[#2E6A9E]">{eyebrow}</p>
      <Title className="mt-4 block font-round text-[clamp(1.5rem,2.8vw,2.2rem)] font-extrabold leading-none tracking-[.03em]">SREE VIVEKANANDA</Title>
      <b className="mt-2.5 block text-[clamp(.72rem,1.1vw,.85rem)] font-semibold tracking-[.15em] text-[#5A7B99]">EDUCATIONAL SOCIETY</b>
      <p className="mt-3 font-display text-[clamp(1.2rem,2vw,1.65rem)] italic" data-testid="text-hero-place">{place}</p>
      <p className="mt-3 max-w-[315px] text-[15px] leading-6 font-semibold uppercase tracking-wide text-[#3F5771]">Inspiring growth, creating leader</p>
    </div>
  </div>;
}

/* `cover` rather than `contain`: the box is a fixed 1600:415 ratio, so each
   banner's height always fills it exactly — any width overflow (banners that
   aren't cut to that same ratio, like the CBSE one) is trimmed evenly from
   the sides rather than leaving a letterbox bar. */
function HeroPhoto({ photo }: { photo: (typeof HERO_PHOTOS)[number] }) {
  return <div className="relative h-full overflow-hidden bg-[#0F2A44]">
    <img src={photo.src} alt={photo.alt} className="absolute inset-0 h-full w-full object-cover" />
  </div>;
}

/* `place` and `eyebrow` are what a branch page changes; the crest and the
   school's own name are the same on all four. */
function Hero({ place = 'PULIVENDLA', eyebrow = 'WELCOME TO OUR SCHOOL', headingLevel = 'b' }: { place?: string; eyebrow?: string; headingLevel?: 'b' | 'h1' }) {
  /* The blue brand slide is gone from the scroller, but a branch page still
     needs its own `h1` — kept off-screen rather than dropped outright. */
  const Title = headingLevel;
  /* Every banner stays fully in view, then crossfades into the next one
     every 3 seconds — a fade rather than a slide, so nothing ever looks
     caught mid-transition. */
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % HERO_PHOTOS.length), 3000);
    return () => window.clearInterval(timer);
  }, []);
  /* No longer full-bleed: the banner sits in its own framed window, inset
     from the page edges and capped well short of the viewport, with a white
     mount and a hairline border around it. */
  return <section id="top" className="bg-transparent pt-4 md:pt-6">
    <Title className="sr-only">{`Sree Vivekananda Educational Society — ${place}`}</Title>
    {/* Height tracks the banners' own 1600×530 ratio, capped at 700px. Below
        `sm` the frame is a taller 2:1 rather than the very wide 1600:530 —
        at phone widths that ratio left the banner barely 100px tall, so
        mobile trades a bit of side crop on the photos for real height. */}
    <div className="relative mx-auto aspect-[2/1] max-h-[700px] w-[calc(100%-16px)] overflow-hidden rounded-2xl border-[6px] border-white shadow-[0_14px_38px_rgba(31,40,56,.20)] ring-1 ring-[#1C2A37]/20 sm:aspect-[1600/530] sm:w-[min(1320px,calc(100%-40px))]">
      {HERO_PHOTOS.map((photo, i) => <div key={photo.src} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`} aria-hidden={i !== index || undefined}>
        <HeroPhoto photo={photo} />
      </div>)}
    </div>
  </section>;
}

function Heading({ title, accent }: { title?: string; accent?: string }) {
  return <div className="reveal flex flex-col items-center"><h2 className="section-heading text-center text-[clamp(1.85rem,3.3vw,2.5rem)]">{title}{title && ' '}{accent && <em>{accent}</em>}</h2><div className="ornament mt-2"><span className="ornament-mark">◆</span></div></div>;
}

/* The three branch cards on the home page. `photo` is a stand-in until each
   branch's own campus photograph exists — the slugs match `BRANCHES` below,
   which is what the routes are built from. */
const BRANCH_CARDS = [
  { slug: 'shivalayam-street', streetName: 'Shivalayam Street', photo: '/campus-courtyard.jpg' },
  { slug: 'brahmanapalli-road', streetName: 'Brahmanapalli Road', photo: '/smartclass.jpeg' },
  { slug: 'parnapalli-road', streetName: 'Parnapalli Road', photo: '/athletics-field.jpg' },
] as const;

function Intro() {
  return <section id="about" className="relative overflow-hidden py-5 md:py-7"><div className="absolute left-0 top-0 h-16 w-16 border-l-[3px] border-t-[3px] border-[#0F4C5C] opacity-70" />
    <SectionIcons pins={PINNED_ICONS.about} />
    <div className="container-wide grid gap-7 md:grid-cols-[1fr_1fr] md:items-center">
    <div className="reveal"><p className="max-w-[470px] text-[14px] leading-[1.5] text-black sm:text-[17px] sm:leading-6"><span className="font-extrabold uppercase">I</span>gniting minds, shaping futures. Join us for academic excellence, character building, and holistic development. Our classrooms blend structured, CBSE-aligned learning with hands-on activities that turn curiosity into confidence, while dedicated teachers mentor every child from their very first day through each milestone that follows. From Pre-School through High-School, we build a foundation of strong values, critical thinking and real-world skills so every student leaves prepared to lead — in the classroom and far beyond it.</p></div>
    <div className="reveal relative mx-auto aspect-[1254/1030] w-full max-w-[460px] overflow-hidden rounded-3xl border-[6px] border-white bg-white shadow-[0_10px_26px_rgba(31,40,56,.18)] ring-1 ring-[#1C2A37]/25"><img src="/vivekananda.png" alt="Educate and raise the masses, and thus alone a nation is possible — Swami Vivekananda" className="h-full w-full rounded-2xl object-cover" data-testid="img-about" /></div>
  </div>
  <div className="container-wide mt-10 md:mt-14">
    <div className="reveal text-center mb-2">
      <h3 className="text-[20px] font-bold text-[#123A5E]">Campuses in Pulivendla, Kadapa District, Andhra Pradesh</h3>
      <div className="ornament mt-2 flex justify-center"><span className="ornament-mark">◆</span></div>
      <p className="mt-3 text-[15px] text-[#3F5771] font-medium text-center">Sree Swamy Vivekananda School — Three Campuses, One Vision</p>
    </div>
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
      {BRANCH_CARDS.map(({ slug, streetName, photo }) => <Link key={slug} href={`/branch/${slug}`} className="reveal flex flex-col items-center gap-3 cursor-pointer rounded-2xl p-4 transition hover:bg-white/70 hover:shadow-md group" data-testid={`link-branch-card-${slug}`}>
        {/* Stand-in for each branch's own photograph — swap `photo` for the
            real campus picture once it's shot; the frame is already the
            right shape for it. */}
        <div className="w-full max-w-[240px] overflow-hidden rounded-xl border-[4px] border-white bg-[#EAF1F9] shadow-[0_8px_20px_rgba(31,40,56,.14)] ring-1 ring-[#1C2A37]/10">
          <img src={photo} alt={`${streetName} campus`} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        </div>
        <img src="/logo.jpeg" alt="School logo" className="-mt-8 h-16 w-16 rounded-full border-[3px] border-white object-cover shadow group-hover:scale-105 transition-transform" />
        <div>
          <p className="font-bold text-[#0F4C5C] text-[16px]">SREE SWAMY VIVEKANANDA SCHOOL</p>
          <p className="mt-1 text-[15px]"><span className="font-bold text-[#123A5E] text-[17px]">{streetName}</span>,<br /><span className="text-black/70">Pulivendla, Kadapa District,<br />Andhra Pradesh</span></p>
          <p className="mt-2 text-[13px] font-semibold text-[#2E6A9E] flex items-center justify-center gap-1">View Campus <ArrowRight size={13} /></p>
        </div>
      </Link>)}
    </div>
  </div>
  </section>;
}

/* ───────────────────────────── SCHOOL LIFE ───────────────────────────── */
/* Four sides of the day beyond the timetable. `image` is a stand-in from
   the existing photo library — swap for real ones as they're shot. */
const SCHOOL_LIFE = [
  { image: '/athletics-field.jpg', title: 'Sports & Games', copy: 'Athletics, cricket and team games on our own grounds, with inter-house meets through the year so every child gets a turn to compete, not just watch.' },
  { image: '/making-lab.jpg', title: 'Clubs & Making', copy: 'Science, robotics and craft clubs where an idea gets built rather than only written about — the making lab is open beyond lesson time.' },
  { image: '/campus-courtyard.jpg', title: 'Arts & Culture', copy: 'Music, dance, drawing and elocution, rehearsed properly and performed in front of a real audience at our annual day and cultural evenings.' },
  { image: '/smartclass.jpeg', title: 'Events & Celebrations', copy: 'Festivals, national days, science fairs and field trips — the occasions that turn a set of classmates into a year group who remember it.' },
] as const;

/* Two by two, each photograph in the site's gallery orb with its words
   beside it rather than beneath. The orb is `GalleryOrb` itself, so these
   click through to the lightbox and carry the same spinning ring as the
   circles in Facilities and the Gallery; the fixed-width wrapper is what
   holds it to a size that leaves room for the text alongside. */
function SchoolLife() {
  return <section id="school-life" className="relative py-5 md:py-7"><div className="container-wide">
    <Heading title="School" accent="Life" />
    <div className="mx-auto mt-8 grid max-w-[1020px] gap-x-5 gap-y-11 sm:grid-cols-2">
      {SCHOOL_LIFE.map(({ image, title, copy }, index) => <div key={title} className="reveal flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left" data-testid={`card-school-life-${index + 1}`}>
        <div className="w-[235px] shrink-0">
          <GalleryOrb src={image} alt={title} colour={ORB_COLOURS[index % ORB_COLOURS.length]} spin={index * 47} />
        </div>
        <div className="flex-1">
          <h3 className="font-sans text-[17px] font-semibold leading-snug text-[#123A5E]">{title}</h3>
          <p className="mt-2 text-[13.5px] leading-[1.55] text-black/75">{copy}</p>
        </div>
      </div>)}
    </div>
  </div></section>;
}

type Programme = { name: string; image: string; copy: string };
const programmes: Programme[] = [
  { name: 'Pre-School', image: '/making-lab.jpg', copy: 'Children are introduced to learning through play, stories, creative expression, early numbers and joyful discovery.' },
  { name: 'Primary School', image: '/campus-courtyard.jpg', copy: 'Our curriculum helps children build confident foundations while learning to think, question and engage with the world.' },
  { name: 'Middle-School', image: '/athletics-field.jpg', copy: 'An inspiring environment enables a shift from rote methods to a course beyond textbooks, with ideas and experiences at the centre.' },
  { name: 'High-School', image: '/making-lab.jpg', copy: 'Experiential and student-centric learning prepares students for their next stage with focus, independence and purpose.' },
];
const resultImages = [
  { src: '/results-2.jpeg', caption: 'Town Toppers — SSC Results 2026', contain: true },
  { src: '/results-1.jpeg', caption: 'Our Achievers — SSC Results 2026' },
  { src: '/results-3.jpeg', caption: 'More Achievers — SSC Results 2026' },
];
/* A rectangular card rather than the round gallery orb: these are results
   posters with fine print (names, marks) that a circular crop would slice
   into, so the full rectangle is what stays legible. */
/* Fixed aspect ratio rather than each image's own natural size, so all three
   cards match. `contain` (rather than `cover`) is for the one poster — Town
   Toppers — that's noticeably more square than the 4:3 box, so cropping it
   to cover would cut its bottom row of names off; the others fit closely
   enough that `cover` reads as a clean fill. */
function ResultCard({ src, alt, caption, contain = false }: { src: string; alt: string; caption: string; contain?: boolean }) {
  const openLightbox = useLightbox();
  return <figure className="flex flex-col items-center gap-4">
    <button type="button" onClick={() => openLightbox(src, alt)} className="group block aspect-[4/3] w-full overflow-hidden rounded-2xl border-[6px] border-white shadow-[0_10px_30px_rgba(31,40,56,.16)] ring-1 ring-[#1C2A37]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C]" data-testid="button-result-card">
      <img src={src} alt={alt} className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${contain ? 'object-contain' : 'object-cover object-top'}`} loading="lazy" />
    </button>
    <figcaption className="max-w-[260px] text-center text-[15px] font-semibold leading-6 text-[#0F4C5C] sm:text-[16px]">{caption}</figcaption>
  </figure>;
}

function Results() {
  return <section id="results" className="relative py-6 md:py-9">
    <SectionIcons pins={PINNED_ICONS.results} />
    <div className="container-wide"><Heading title="SSC" accent="RESULTS 2026" /><p className="reveal mx-auto mt-4 max-w-[620px] text-center text-[18px] leading-7 text-black">Best in standards, first in results — proud of every student who made this year's SSC results shine.</p><div className="mx-auto mt-8 grid max-w-[1200px] grid-cols-1 gap-x-8 gap-y-9 sm:grid-cols-3">{resultImages.map((item, index) => <div key={item.src} className="reveal" data-testid={`card-result-${index + 1}`}><ResultCard src={item.src} alt={item.caption} caption={item.caption} contain={item.contain} /></div>)}</div></div></section>;
}

/* Each card shows either a line icon or a photograph in the same dashed circle,
   so pictures and icons can share the row without breaking its rhythm.
   `contain` for the ones that are logos rather than photographs: filling a
   circle crops a logo's edges off, where a photograph only loses background. */
const facilities: { icon?: typeof Bus; image?: string; contain?: boolean; title: string; copy: string }[] = [
  { image: '/schoolbus.jpeg', title: 'Safe & Convenient Transport', copy: 'Buses covering all major routes, with trained staff ensuring safe pickup and drop every day. Parents can rely on consistent timing and real attendance checks at every stop.' },
  { image: '/smartclass.jpeg', title: 'Smart Classrooms', copy: 'Interactive digital boards and audio-visual tools that make every lesson engaging and easy to grasp. Concepts come alive through visuals, simulations and collaborative activities.' },
  { image: '/cbse.jpeg', contain: true, title: 'CBSE Based LEAD Curriculum', copy: 'A structured, activity-based curriculum aligned with CBSE standards for strong conceptual learning. Regular assessments track progress and close gaps early.' },
  { image: '/iit.jpeg', contain: true, title: 'IIT-JEE and NEET Foundation', copy: 'Early foundation coaching that builds problem-solving skills for competitive exams from school itself. Experienced faculty blend board preparation with entrance-exam thinking.' },
];
const busRoutes = [
  { stop: 'Sivalayam Street', areas: ['Basireddy Palle', 'Boggudu Palle', 'Siddam Reddy Palle', 'Peddajuturu', 'Chinthalajuturu', 'Gollala Guduru', 'Pernapadu', 'Alavalapadu', 'Velamavari Palle', 'Besthavari Palle', 'Velpula', 'Vemula', 'Gondipalle', 'Kothapalle', 'V. Kothapalle', 'Tallapalle', 'Ganganapalle', 'Santha Kovvuru', 'Paluru', 'Agaduru', 'Inagaluru', 'Saidapuram', 'Krishnamgari Palle', 'R. Thummalapalle'] },
  { stop: 'Brahmanapalle Road', areas: ['Venkatapuram', 'E. Kothapalle', 'Chandragiri', 'Mallikarjunapuram', 'Erraballe', 'Nallapureddy Palle', 'Nallagondavari Palle', 'Ambakapalle', 'Murarichinthala', 'Brahmanapalle', 'Ippatla', 'Chinnakudala', 'Ramatlapalle', 'Gunakanapalle'] },
  { stop: 'Nagarigutta', areas: ['Ulimella', 'Erripalle', 'Putrayanapeta', 'Achavelli', 'Thimmapurampeta', 'Goturu', 'Nallacheruvupalle', 'Kondreddi Palle', 'Muthukuru', 'Narepalli', 'Moillacheruvu', 'Rami Reddy Palli', 'Peddarangapuram', 'Rayalapuram', 'Nakkalapalle', 'Dondlavagu', 'Balapanuru', 'Ankalammaguduru', 'Agraharam', 'Kasunuru', 'Maduru', 'Bojayapalle', 'Kovaramguttapalle', 'Lomada', 'Bhadrampalle', 'Thonduru', 'Lopatnuthala', 'Lingala', 'Bonala', 'Ankevaripalli', 'Kamasamudram', 'Kammavaripalle', 'Ramapuram', 'Intiobaiah Palli', 'Peddakudala', 'Akkulugari Palle', 'Thernampalle', 'Yerramreddy Palle', 'Chinna Rangapuram'] },
] as const;

/* Village names on this list are written every which way — `V.Kothapalle`,
   `R Thummalapalle`, `Rami Reddy Palli` against `Kondreddi Palle`. A parent
   typing their own village will not reproduce the punctuation or the spacing,
   so both sides are reduced to bare letters before they are compared and the
   match is a substring, which also lets a half-typed name find its village. */
const normaliseArea = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');

function BusRoutes() {
  const [query, setQuery] = useState('');
  const needle = normaliseArea(query);
  /* Below two letters nearly everything matches, which reads as a broken
     search rather than a helpful one, so the list stays whole until then. */
  const searching = needle.length >= 2;
  const matches = searching
    ? busRoutes.map((route) => ({ stop: route.stop, hits: route.areas.filter((area) => normaliseArea(area).includes(needle)) })).filter((route) => route.hits.length > 0)
    : [];
  const found = matches.reduce((total, route) => total + route.hits.length, 0);

  return <div id="bus-routes" className="mx-auto max-w-[880px]">
    <div className="rounded-2xl border-2 border-dashed border-[#1C2A37]/35 bg-white/85 p-5 shadow-[0_4px_12px_rgba(31,40,56,.12)] sm:p-7">
      <p className="mx-auto max-w-[460px] text-center text-[15px] leading-6 text-black/75">Type your village or area below. If it is on one of our three routes, our bus can pick your child up and drop them home.</p>

      <div className="mx-auto mt-5 flex max-w-[420px] items-center gap-2 rounded-full border-2 border-[#1C2A37]/30 bg-white px-4 py-2.5 focus-within:border-[#0F4C5C]">
        <Search size={17} className="shrink-0 text-[#0F4C5C]" aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search your area…" aria-label="Search for your village or area" className="w-full bg-transparent text-[15px] text-black outline-none placeholder:text-black/45" data-testid="input-bus-area-search" />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="shrink-0 rounded-full p-1 text-black/60 hover:text-[#0F4C5C]" data-testid="button-bus-search-clear"><X size={15} /></button>}
      </div>

      {searching && <p className={`mx-auto mt-4 max-w-[520px] rounded-xl px-4 py-3 text-center text-[15px] leading-6 ${found ? 'bg-[#0F4C5C]/10 text-[#0F4C5C]' : 'bg-[#1F2838]/8 text-black'}`} role="status" aria-live="polite" data-testid="text-bus-search-result">
        {found
          ? <><Check size={16} className="mr-1 inline align-[-2px]" aria-hidden="true" />Good news — our school bus reaches {found === 1 ? 'this area' : 'these areas'}. Board at the {matches.map((route) => route.stop).join(' or ')} route{matches.length > 1 ? 's' : ''}.</>
          : <>We do not have “{query.trim()}” on a route yet. Call us on <a href="tel:+918500045678" className="font-semibold underline">+91 85000 45678</a> and we will see what can be arranged.</>}
      </p>}

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {(searching ? matches : busRoutes.map((route) => ({ stop: route.stop, hits: route.areas }))).map((route) => <div key={route.stop} data-testid={`card-bus-route-${route.stop.toLowerCase().replaceAll(' ', '-')}`}>
          <h4 className="flex items-start gap-1.5 text-[15px] font-semibold leading-5 text-[#0F4C5C]"><Bus size={15} className="mt-0.5 shrink-0" aria-hidden="true" />Sree Swamy Vivekananda School, {route.stop}</h4>
          <ul className="mt-2 space-y-0.5 text-[14px] leading-5 text-black/80">
            {route.hits.map((area) => <li key={area}>{area}</li>)}
          </ul>
        </div>)}
      </div>
    </div>
  </div>;
}

/* All four facilities stand in a single row now, which leaves no centre
   gutter and no room beside a card for a per-card icon — at four columns a
   pin hung off a card's edge would sit on top of its own circle. So the
   decorative icons hang off the section instead, two down each side, clear
   of the row entirely. */
function Facilities() {
  return <section id="media" className="relative py-5 md:py-7">
    <SectionIcons pins={PINNED_ICONS.facilities} />
    <div className="container-wide">
    <Heading accent="Facilities" />
    <div className="relative mx-auto mt-8 grid max-w-[1000px] grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4 sm:gap-x-6 sm:gap-y-12">
      {/* Not a flex wrapper: `GalleryOrb`'s own figure needs to be a normal
          block box so its `w-full` button resolves against the full column
          width — inside a flex parent with `items-center` it would shrink to
          content instead and the orb would render tiny. */}
      {facilities.map(({ image, contain, title, copy }, index) => (
        <div key={title} className="reveal relative text-center" data-testid={`card-facility-${index + 1}`}>
          <GalleryOrb src={image!} alt={title} colour={ORB_COLOURS[index % ORB_COLOURS.length]} spin={index * 47} contain={contain} />
          <h3 className="mt-4 font-sans text-[12px] font-medium leading-[1.2] text-black sm:text-[16px] sm:leading-snug">{title}</h3>
          <p className="mt-1.5 mx-auto max-w-[280px] text-[10px] leading-[1.35] text-black/75 sm:text-[12.5px] sm:leading-[1.5]">{copy}</p>
        </div>
      ))}
    </div>
  </div></section>;
}

const gallery = ['/making-lab.jpg', '/campus-courtyard.jpg', '/athletics-field.jpg', '/smartclass.jpeg', '/schoolbus.jpeg', '/our-story-poster.jpg'];

/* One colour per orb, cycled. The ring is drawn on a 100-unit circle with
   `pathLength`, so the two arcs and the four dots that cap them are placed in
   percentages of the circumference rather than in pixels and hold their
   positions at any size. */
const ORB_COLOURS = ['#0F4C5C', '#C2591B', '#5B3E96', '#E0A93B', '#2F7D6E', '#1C2A37'] as const;
const ORB_CAPS = [
  { x: 93.68, y: 67.30 }, { x: 30.01, y: 92.52 }, { x: 6.32, y: 32.70 }, { x: 69.99, y: 7.48 },
] as const;

/* `spin` still sets each orb's starting angle so a row of them doesn't all
   begin in lockstep; the continuous rotation itself comes from the
   `orb-ring-spin` animation in index.css, alternating direction by parity so
   neighbouring rings don't turn the same way. */
function OrbRing({ colour, spin }: { colour: string; spin: number }) {
  return <div className="pointer-events-none absolute inset-0" style={{ transform: `rotate(${spin}deg)` }} aria-hidden="true">
    <svg viewBox="0 0 100 100" className={`h-full w-full orb-ring-spin ${spin % 2 === 0 ? 'orb-ring-spin-reverse' : ''}`}>
      <circle cx="50" cy="50" r="47" fill="none" stroke={colour} strokeWidth="1" strokeLinecap="round" strokeDasharray=".4 4.2" opacity=".75" />
      <circle cx="50" cy="50" r="47" fill="none" stroke={colour} strokeWidth="1.9" strokeLinecap="round" pathLength={100} strokeDasharray="26 24" strokeDashoffset="-6" />
      {ORB_CAPS.map((cap) => <circle key={`${cap.x}-${cap.y}`} cx={cap.x} cy={cap.y} r="2.3" fill={colour} />)}
    </svg>
  </div>;
}

function GalleryOrb({ src, alt, colour, spin, caption, contain = false }: { src: string; alt: string; colour: string; spin: number; caption?: string; contain?: boolean }) {
  const openLightbox = useLightbox();
  return <figure className="flex flex-col items-center gap-4">
    <button type="button" onClick={() => openLightbox(src, alt)} className="group relative block aspect-square w-full max-w-[250px] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C]" data-testid="button-gallery-orb">
      <span className="absolute inset-[6%] rounded-full bg-white shadow-[0_10px_30px_rgba(31,40,56,.16)]" />
      <span className="absolute inset-[11%] block overflow-hidden rounded-full">
        <img src={src} alt={alt} className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${contain ? 'object-contain p-4' : 'object-cover'}`} loading="lazy" />
      </span>
      <OrbRing colour={colour} spin={spin} />
    </button>
    {caption && <figcaption className="max-w-[260px] text-center text-[15px] font-semibold leading-6 text-[#0F4C5C] sm:text-[16px]">{caption}</figcaption>}
  </figure>;
}

function GalleryOrbs({ images, label, className = 'grid-cols-2 md:grid-cols-3', gapClassName = 'gap-x-6 gap-y-9' }: { images: readonly string[]; label: string; className?: string; gapClassName?: string }) {
  return <div className={`grid ${gapClassName} ${className}`}>
    {images.map((src, index) => <GalleryOrb key={`${src}-${index}`} src={src} alt={`${label} ${index + 1}`} colour={ORB_COLOURS[index % ORB_COLOURS.length]} spin={index * 47} />)}
  </div>;
}

function StoryVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  useEffect(() => { const video = videoRef.current; if (!video) return; video.muted = true; video.play().catch(() => undefined); }, []);
  /* The clip has to start muted — browsers refuse to autoplay a video with
     sound — so this is the only way to hear it. Reading and writing
     `video.muted` rather than driving it from state keeps the button honest if
     anything else changes it, and the tap that unmutes is itself the gesture
     that lets a blocked autoplay start, so the play() retry matters here. */
  const toggleMuted = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
    if (!next) video.play().catch(() => undefined);
  };
  return <>
    <video ref={videoRef} src="/our-story.mp4" poster="/our-story-poster.jpg" autoPlay muted loop playsInline preload="auto" className="h-full w-full object-cover" data-testid="video-our-story" />
    <button type="button" onClick={toggleMuted} aria-label={muted ? 'Unmute video' : 'Mute video'} aria-pressed={!muted} className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-[#1F2838]/70 text-white shadow-md transition-colors hover:bg-[#1F2838]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white" data-testid="button-video-mute">
      {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
    </button>
  </>;
}

/* The pool the 5×5 wall of tiles is drawn from — every photograph the site
   already ships, cycled to fill the grid, since there are fewer distinct
   pictures than there are squares. */
const GALLERY_TILE_POOL = [
  '/making-lab.jpg', '/campus-courtyard.jpg', '/athletics-field.jpg', '/smartclass.jpeg',
  '/schoolbus.jpeg', '/our-story-poster.jpg', '/cbse.jpeg', '/iit.jpeg',
  '/results-1.jpeg', '/results-2.jpeg', '/results-3.jpeg', '/swami-vivekananda-quote.jpg',
  '/hero-cbse-lead.png', '/hero-our-values.jpg', '/hero-learn-today.jpg', '/hero-safe-journeys.jpg',
  '/vivekananda.png', '/admissions-popup.jpeg', '/admissions.png', '/logo.jpeg',
] as const;

/* Five across and five down — square, bordered tiles rather than the orbs,
   and no video. Each opens in the lightbox like every other photograph. */
function GallerySquares() {
  const openLightbox = useLightbox();
  return <div className="mx-auto grid max-w-[1300px] grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 md:gap-8">
    {Array.from({ length: 25 }, (_, index) => {
      const src = GALLERY_TILE_POOL[index % GALLERY_TILE_POOL.length];
      const alt = `School life gallery ${index + 1}`;
      return <button key={`${src}-${index}`} type="button" onClick={() => openLightbox(src, alt)} className="reveal group aspect-square w-full overflow-hidden rounded-xl border-[4px] border-white bg-[#EAF1F9] shadow-[0_8px_20px_rgba(31,40,56,.14)] ring-1 ring-[#1C2A37]/15 transition hover:shadow-[0_12px_28px_rgba(31,40,56,.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C]" data-testid={`button-gallery-tile-${index + 1}`}>
        <img src={src} alt={alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
      </button>;
    })}
  </div>;
}

/* `heading` off when the page above already carries the title as its `h1`. */
/* Video beside a 3-column, 2-row orb grid (six photos), the whole block
   left-aligned within `container-wide` (no `mx-auto`) rather than centred,
   so it sits toward the left of the screen. */
function Gallery({ heading = true }: { heading?: boolean }) {
  return <section id="gallery" className="relative overflow-hidden py-5 md:py-7"><div className="absolute right-0 top-20 hero-dots h-24 w-16 opacity-60" /><SectionIcons pins={PINNED_ICONS.gallery} /><div className="container-wide">{heading && <Heading title="PHOTO" accent="GALLERY" />}<div className="mt-7 grid grid-cols-1 max-w-[1000px] items-start gap-3 md:grid-cols-[210px_1fr]">
    <div className="reveal relative mx-auto mt-10 w-full max-w-[210px] overflow-hidden rounded-2xl border-[5px] border-white bg-[#123A5E] shadow-[0_10px_26px_rgba(31,40,56,.2)] md:mx-0"><div className="relative aspect-[9/16] overflow-hidden rounded-xl"><StoryVideo /></div></div>
    {/* Fixed 250px columns instead of `1fr` ones — the orb itself is
        capped at 250px, so a stretchy column left a lot of empty slack
        between circles even with a tight `gap`. Fixed columns plus
        `justify-center` mean `gapClassName` is finally the whole visible
        gap. Below `md` there isn't room for three 250px columns side by
        side, so it's a fluid 2-up grid there instead — same as every other
        orb grid on the page — switching to the fixed 3-across layout once
        `md` actually has the width for it. */}
    <GalleryOrbs images={gallery} label="School life gallery" className="grid-cols-2 sm:grid-cols-3 md:grid-cols-[repeat(3,250px)] md:justify-center" gapClassName="gap-x-2 gap-y-6" />
  </div></div></section>;
}

/* The "Parent Say About Us" section lives in `src/testimonials.tsx` now —
   off the site, kept for whenever it's wanted back. */

function Admissions({ onEnquire }: { onEnquire: () => void }) {
  return <section id="career" className="py-4 text-center"><button onClick={onEnquire} className="rounded-full border-2 border-[#0F4C5C] px-10 py-5 text-base font-semibold text-[#0F4C5C] hover:bg-[#0F4C5C] hover:text-white" data-testid="button-admissions-enquiry">CONTACT US <ArrowRight className="ml-2 inline" size={20} /></button></section>;
}

/* `branchLabel`/`branchAddress` let a branch page swap in its own street
   address here instead of the head-office one — the map link is rebuilt
   from whichever address is showing, so it always points at the right pin. */
/* One row of the Get In Touch column: a round tinted icon chip and the line
   of text beside it, as a link when there's somewhere to go. */
function FooterContact({ icon, children, href, external }: { icon: ReactNode; children: ReactNode; href?: string; external?: boolean }) {
  const body = <>
    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0F4C5C]/10 text-[#0F4C5C] sm:h-8 sm:w-8">{icon}</span>
    <span className="text-[11px] leading-[1.35] text-[#3F5771] sm:text-[13.5px] sm:leading-[1.4]">{children}</span>
  </>;
  if (!href) return <div className="flex items-start gap-2 sm:gap-3">{body}</div>;
  return <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} className="flex items-start gap-2 transition-colors hover:text-[#0F4C5C] [&:hover>span:last-child]:text-[#0F4C5C] sm:gap-3">{body}</a>;
}

/* Light rather than the old dark texture, and laid out wide rather than
   tall: the crest sits beside its wordmark instead of above it, and brand,
   quick links and contact details share one three-column row. Type and
   spacing are dialled down throughout to keep the whole band short. The
   floating call widget already carries an ADMISSION ENQUIRY card over this
   corner of the page, so the footer doesn't repeat one — its enquiry button
   sits inside Contact Us instead. */
function Footer({ onEnquire, branchLabel, branchAddress }: { onEnquire: () => void; branchLabel?: string; branchAddress?: string }) {
  const address = branchAddress ?? '3-4-55, Guntha Bazar Rd, near Raja Reddy Hospital, Pulivendla, 516390';
  return <footer id="contact" className="relative overflow-hidden border-t border-[#E4EBF3] bg-gradient-to-b from-white to-[#F5F9FC] text-[#123A5E]">
    <DotGrid className="right-[4%] top-6 hidden h-16 w-20 opacity-70 lg:block" />
    <div id="disclosure" className="container-hero relative z-10 py-3 md:py-6">
      {/* Brand, quick links and contact details on one line, with real air
          between them — the wider `container-hero` (1400px against
          `container-wide`'s 1024px) is what buys room for both the gaps and
          the two-across contact block. Everything in this band is scaled
          down hard below `sm`: at the desktop sizes the footer alone was
          nearly as tall as a whole phone screen. */}
      <div className="grid gap-4 sm:gap-8 md:grid-cols-[1fr_auto_auto] md:items-start md:justify-between md:gap-16 lg:gap-24">

        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-4 sm:items-center sm:text-left">
          <a href="#top" className="shrink-0" data-testid="link-logo-footer">
            <img src="/logo.jpeg" alt="Sree Vivekananda Educational Society logo" className="h-14 w-14 rounded-full border-4 border-white object-cover shadow-[0_8px_22px_rgba(31,40,56,.2)] ring-1 ring-[#1C2A37]/10 sm:h-[104px] sm:w-[104px]" />
          </a>
          <div>
            <b className="block font-round text-[19px] font-extrabold leading-tight tracking-[.05em] text-[#123A5E] sm:text-[30px]">SREE VIVEKANANDA</b>
            <small className="mt-1 block text-[10px] font-semibold tracking-[.14em] text-[#5A7B99] sm:text-[14px] sm:tracking-[.18em]">EDUCATIONAL SOCIETY · PULIVENDLA</small>
            <span className="mx-auto mt-1.5 block h-[3px] w-8 rounded-full bg-[#0F4C5C]/60 sm:mx-0 sm:mt-2.5 sm:w-10" aria-hidden="true" />
            <p className="mt-1.5 font-display text-[13px] italic leading-[1.3] text-[#3F5771] sm:mt-2.5 sm:text-[18px] sm:leading-[1.4]">Inspiring Growth, Creating Leader</p>
          </div>
        </div>

        {/* Two columns of links: one column of six would stand taller than
            the two panels either side of it. */}
        <div className="text-center md:text-left">
          <h3 className="text-[10px] font-bold tracking-[.14em] text-[#123A5E] sm:text-[13px] sm:tracking-[.16em]">QUICK LINKS</h3>
          <div className="mx-auto mt-1.5 grid w-max grid-cols-2 gap-x-5 gap-y-1 text-left sm:mt-3 sm:gap-x-7 sm:gap-y-2 md:mx-0">
            {navItems.map(([label, href]) => <a key={href} href={href} className="group flex items-center gap-1.5 text-[12px] text-[#3F5771] transition-colors hover:text-[#0F4C5C] sm:text-[15px]" data-testid={`link-footer-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <ChevronRight size={12} className="shrink-0 text-[#0F4C5C] transition-transform group-hover:translate-x-0.5 sm:hidden" aria-hidden="true" />
              <ChevronRight size={15} className="hidden shrink-0 text-[#0F4C5C] transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
              {label}
            </a>)}
          </div>
        </div>

        {/* Two across rather than a four-tall stack: this column was what
            set the footer's height. */}
        <div className="text-center md:text-left">
          <h3 className="text-[10px] font-bold tracking-[.14em] text-[#123A5E] sm:text-[13px] sm:tracking-[.16em]">CONTACT US</h3>
          {branchLabel && <p className="mt-1 text-[11px] font-semibold text-[#0F4C5C] sm:mt-2 sm:text-[13px]" data-testid="text-footer-branch-label">{branchLabel}</p>}
          {/* Full width on mobile rather than `w-max`: at `w-max` the address
              line's own intrinsic width overrides the viewport, pushing the
              whole block off the right edge instead of wrapping. */}
          <div className="mx-auto mt-1.5 grid w-full gap-x-10 gap-y-1.5 text-left sm:mt-3 sm:w-auto sm:max-w-[540px] sm:grid-cols-2 sm:gap-y-3 md:mx-0">
            <FooterContact icon={<Phone size={13} />} href="tel:+918500045678"><span data-testid="link-phone-footer">+91 85000 45678 / 85004 95678</span></FooterContact>
            <FooterContact icon={<MapPin size={13} />} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} external><span data-testid="link-address-footer">{address}</span></FooterContact>
            <FooterContact icon={<Mail size={13} />} href="mailto:hello@vivekanandaconcept.school"><span data-testid="link-email-footer">hello@vivekanandaconcept.school</span></FooterContact>
            <FooterContact icon={<Instagram size={13} />} href="https://www.instagram.com/vcsplvd?igsh=MW00NW1xdWtoY2Q1Mw==" external><span data-testid="link-instagram-footer">Instagram</span></FooterContact>
          </div>
          <button onClick={onEnquire} className="mt-2.5 rounded-full border-2 border-[#0F4C5C] px-3 py-1 text-[10px] font-bold tracking-[.06em] text-[#0F4C5C] transition hover:bg-[#0F4C5C] hover:text-white sm:mt-4 sm:px-4 sm:py-1.5 sm:text-[12px] sm:tracking-[.08em]" data-testid="button-footer-enquiry">ADMISSION ENQUIRY</button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 sm:mt-5">
        <span className="h-px flex-1 bg-[#123A5E]/15" aria-hidden="true" />
        <p className="text-center text-[10px] text-[#3F5771] sm:text-[13px]">© 2026 Sree Vivekananda Educational Society · Mandatory Disclosure</p>
        <span className="h-px flex-1 bg-[#123A5E]/15" aria-hidden="true" />
      </div>
    </div>

    {/* Two soft waves washing across the base, behind the content. */}
    <svg viewBox="0 0 1440 150" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-[64px] w-full" aria-hidden="true">
      <path d="M0 78c150-42 310 20 470 30s330-44 500-30 330 62 470 40v32H0z" fill="#DDE8F5" opacity=".55" />
      <path d="M0 106c170-36 300 16 470 22s340-34 500-22 320 50 470 32v22H0z" fill="#F3DDE4" opacity=".5" />
    </svg>
  </footer>;
}

/* The dotted corner marks on the brand panel are decoration only, so they are drawn with a repeating
   gradient rather than four more image requests. */
function DotGrid({ className }: { className: string }) {
  return <span aria-hidden className={`pointer-events-none absolute ${className}`} style={{ backgroundImage: 'radial-gradient(#B7C4D4 1.5px, transparent 1.6px)', backgroundSize: '8px 8px' }} />;
}

const enquiryInputClass = 'w-full rounded-lg border border-[#DCE3EC] bg-white py-2 pl-10 pr-3 text-[13.5px] text-[#1F2838] outline-none transition placeholder:text-[#96A3B4] focus:border-[#123A5E] focus:ring-2 focus:ring-[#123A5E]/15';

function EnquiryField({ label, icon, error, children }: { label: string; icon: ReactNode; error?: string; children: ReactNode }) {
  return <label className="block">
    <span className="text-[12px] font-semibold text-[#123A5E]">{label}</span>
    <span className="relative mt-1 block">
      <span className="pointer-events-none absolute left-3 top-[10px] text-[#123A5E]/70">{icon}</span>
      {children}
    </span>
    {error && <span className="mt-1 block text-[12px] font-medium text-[#C0392B]">{error}</span>}
  </label>;
}

function EnquiryModal({ onClose }: { onClose: () => void }) {
  const [sent, setSent] = useState(false); const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const next: Record<string, string> = {}; if (!String(data.get('parentName')).trim()) next.parentName = 'Please tell us your name'; if (!String(data.get('studentName')).trim()) next.studentName = 'Please tell us the student’s name'; /* Spaces, dashes and a +91 are all normal ways to write a number down, so they are stripped before checking rather than rejected. What is left has to be a ten-digit Indian mobile — the admissions team calls back on this, so a landline or a short number is worth catching here. */ const phone = String(data.get('phone') ?? '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); if (!/^[6-9]\d{9}$/.test(phone)) next.phone = 'Enter a 10-digit mobile number'; if (!String(data.get('childGrade'))) next.childGrade = 'Choose a grade'; if (Object.keys(next).length) { setErrors(next); return; } setErrors({}); setSent(true); };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#101A2B]/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div className="relative flex max-h-[94dvh] w-full max-w-[880px] overflow-hidden rounded-[20px] bg-white text-[#123A5E] shadow-[0_30px_80px_-24px_rgba(11,26,48,.65)]">

      <aside className="relative hidden w-1/2 shrink-0 flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#F7FAFD] via-[#F2F7FC] to-[#EAF1F9] p-8 md:flex">
        <svg viewBox="0 0 400 260" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] w-full" aria-hidden>
          <path d="M0 118c78-46 150 22 226 4s118-62 174-38v176H0z" fill="#DDE8F5" opacity=".75" />
          <path d="M0 176c86-38 148 24 224 10s122-46 176-24v98H0z" fill="#F3DDE4" opacity=".7" />
          <path d="M0 214c92-30 150 18 226 6s116-32 174-14v54H0z" fill="#E3ECF7" opacity=".85" />
        </svg>
        <DotGrid className="left-7 top-7 h-[34px] w-[46px]" />
        <DotGrid className="bottom-9 right-8 h-[34px] w-[46px]" />
        <div className="relative z-10 flex w-full flex-col items-center text-center">
          <img src="/logo.jpeg" alt="Sree Vivekananda Educational Society logo" className="mb-5 h-[94px] w-[94px] rounded-full object-cover shadow-[0_10px_24px_-12px_rgba(18,58,94,.6)]" />
          <b className="font-round text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold leading-none tracking-[.045em] text-[#123A5E]">SREE VIVEKANANDA</b>
          <small className="mt-2.5 block text-[clamp(.6rem,1vw,.8rem)] font-semibold leading-none tracking-[.15em] text-[#7C8B99]">EDUCATIONAL SOCIETY</small>
          <span className="mt-4 flex items-center gap-2">
            <span className="h-[2px] w-[62px] rounded-full bg-[#123A5E]" /><span className="h-[5px] w-[5px] rounded-full bg-[#123A5E]" /><span className="h-[2px] w-[62px] rounded-full bg-[#123A5E]" />
          </span>
          <blockquote className="mt-7 flex w-full max-w-[300px] flex-col items-center">
            <span className="flex w-full items-center gap-3">
              <span className="h-px flex-1 bg-[#123A5E]/40" /><Quote size={22} className="shrink-0 rotate-180 text-[#123A5E]" fill="currentColor" strokeWidth={0} /><span className="h-px flex-1 bg-[#123A5E]/40" />
            </span>
            <p className="mt-4 text-[14px] uppercase font-bold tracking-wide text-[#3F5771]">Inspiring growth, creating leader</p>
            <Quote size={22} className="mt-4 text-[#123A5E]" fill="currentColor" strokeWidth={0} />
          </blockquote>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto p-5 sm:p-6">
        <DotGrid className="bottom-6 right-6 h-[26px] w-[38px]" />
        <button onClick={onClose} className="absolute right-5 top-5 z-10 rounded p-1 text-[#123A5E] transition hover:text-[#C0392B]" aria-label="Close enquiry" data-testid="button-close-enquiry"><X size={22} /></button>
        {sent ? <div className="grid flex-1 place-content-center py-10 text-center">
          <Check className="mx-auto rounded-full bg-[#123A5E] p-3 text-white" size={58} />
          <h2 className="mt-6 font-display text-4xl text-[#123A5E]">Thank you.</h2>
          <p className="mt-3 text-sm text-[#3F5771]">Our admissions team will call you within one school day.</p>
          <button onClick={onClose} className="mx-auto mt-6 rounded-lg bg-[#123A5E] px-6 py-3 text-xs font-bold tracking-[.12em] text-white transition hover:bg-[#0D2B46]" data-testid="button-success-close">BACK TO SCHOOL</button>
        </div> : <>
          <h2 className="pr-9 text-[21px] font-bold tracking-[.14em] text-[#123A5E]">ADMISSION ENQUIRY</h2>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <EnquiryField label="Parent / guardian name" icon={<User size={17} />} error={errors.parentName}>
              <input name="parentName" placeholder="Enter full name" className={enquiryInputClass} data-testid="input-parent-name" />
            </EnquiryField>
            <EnquiryField label="Student name" icon={<UserRound size={17} />} error={errors.studentName}>
              <input name="studentName" placeholder="Enter student name" className={enquiryInputClass} data-testid="input-student-name" />
            </EnquiryField>
            <EnquiryField label="Phone number" icon={<Phone size={17} />} error={errors.phone}>
              <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" className={enquiryInputClass} data-testid="input-phone" />
            </EnquiryField>
            <EnquiryField label="Child’s grade" icon={<GraduationCap size={17} />} error={errors.childGrade}>
              <select name="childGrade" defaultValue="" className={`${enquiryInputClass} appearance-none pr-10`} data-testid="select-child-grade">
                <option value="" disabled>Select a grade</option>
                {programmes.map((item) => <option key={item.name}>{item.name}</option>)}
              </select>
              <ChevronDown size={17} className="pointer-events-none absolute right-3 top-[10px] text-[#123A5E]" />
            </EnquiryField>
            <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#123A5E] py-3.5 text-[12.5px] font-bold tracking-[.14em] text-white shadow-[0_12px_22px_-12px_rgba(18,58,94,.9)] transition hover:bg-[#0D2B46]" data-testid="button-submit-enquiry">SEND ENQUIRY <Send size={15} /></button>
            <div className="mt-5 text-center">
              <span className="text-[13.5px] text-[#3F5771]">Or call us at </span>
              <a href="tel:+918331003003" className="font-semibold text-[#123A5E]">+91 8331 003 003</a>
            </div>
          </form>
        </>}
      </div>
    </div>
  </div>;
}

function AdmissionsPopup({ onClose, onEnquire }: { onClose: () => void; onEnquire: () => void }) {
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-[#1F2838]/70 p-4" role="dialog" aria-modal="true" onClick={onClose}>
    <div className="relative w-full max-w-[620px]" onClick={(event) => event.stopPropagation()}>
      <button onClick={onClose} className="absolute -right-2 -top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white text-[#0F4C5C] shadow-lg" aria-label="Close admissions popup" data-testid="button-close-admissions-popup"><X size={18} /></button>
      <img src="/admissions-popup.jpeg" alt="Admissions open at Vivekananda Concept School" className="w-full rounded-lg border-4 border-white shadow-2xl" data-testid="img-admissions-popup" />
      <button onClick={() => { onClose(); onEnquire(); }} className="mt-3 w-full rounded-full bg-[#0F4C5C] py-3 text-xs font-bold text-white" data-testid="button-admissions-popup-enquiry">START YOUR ADMISSION ENQUIRY</button>
    </div>
  </div>;
}

function CallFab({ onEnquire }: { onEnquire: () => void }) {
  /* The widget waits until the header has scrolled out of view. While the
     header is on screen its own enquiry button is right there, so the floating
     one is just another thing sitting over the hero. */
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  /* Scaled back below sm, and below that the text cloud drops out entirely,
     leaving just the round button. Even at its smallest the full stack is
     124px wide sitting fixed over the content for the whole scroll — on a
     360–400px phone that's wide enough to permanently cover a photo circle
     or a line of body text every time one happens to scroll under it. The
     round button alone is a fifth the width and still does the same job.
     The inset clears the iOS home indicator via the safe-area inset. */
  return <div className={`fixed bottom-3 right-3 z-40 flex flex-col items-center gap-1 transition-all duration-300 sm:bottom-7 sm:right-7 ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-5 opacity-0'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-hidden={!visible}>
    <button onClick={onEnquire} className="call-cloud relative hidden sm:block sm:h-[76px] sm:w-[170px]" aria-label="Start your admission enquiry" data-testid="button-call-cloud">
      <svg viewBox="0 0 200 96" preserveAspectRatio="none" className="absolute inset-0 h-full w-full drop-shadow-[0_4px_10px_rgba(31,40,56,.25)]" aria-hidden="true">
        <path d="M24 72 A20 20 0 0 1 30 33 A26 26 0 0 1 78 20 A24 24 0 0 1 124 24 A24 24 0 0 1 168 36 A19 19 0 0 1 176 72 L118 72 L106 93 L96 72 Z" fill="#FFFFFF" stroke="#1C2A37" strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="relative flex h-full w-full flex-col items-center justify-center pb-2 text-[9px] font-bold leading-[1.2] tracking-[.09em] text-black sm:pb-3 sm:text-[12px]"><span>ADMISSION</span><span>ENQUIRY</span></span>
    </button>
    <button onClick={onEnquire} className="relative grid h-[56px] w-[56px] shrink-0 place-items-center rounded-full border-[4px] border-white bg-[#1C2A37] text-white shadow-[0_10px_24px_rgba(28,42,55,.45)] ring-2 ring-[#1C2A37] sm:h-[74px] sm:w-[74px] sm:border-[5px]" aria-label="Start your admission enquiry" data-testid="button-call-fab">
      <span className="call-fab-ripple" aria-hidden="true" />
      <span className="call-fab-ripple" style={{ animationDelay: '1.1s' }} aria-hidden="true" />
      {/* Sized in CSS rather than by lucide's `size`, so it can step with the
          button across the breakpoint. */}
      <Phone className="call-fab-icon relative h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" />
    </button>
  </div>;
}

/* The page furniture every route shares — background, wallpaper, header,
   footer, call widget and the enquiry modal. Children come in as a function so
   a page can wire its own buttons to the same modal without the state having to
   be lifted any further or threaded through a context. */
/* Stamped the first time the poster is shown, so a returning visitor — or
   anyone moving between pages — is not handed it again. */
const ADMISSIONS_POPUP_KEY = 'vces.admissions-popup-seen';

function PageShell({ title, description, admissionsPopup: withPopup = false, footerBranchLabel, footerBranchAddress, children }: { title: string; description: string; admissionsPopup?: boolean; footerBranchLabel?: string; footerBranchAddress?: string; children: (onEnquire: () => void) => ReactNode }) {
  const [modal, setModal] = useState(false); const [admissionsPopup, setAdmissionsPopup] = useState(false);
  /* Keyed on the location so the page is rebuilt — and so comes up again —
     when one branch route replaces another, where the component itself would
     otherwise stay mounted and never replay. */
  const [location] = useLocation();
  useReveals(location);
  useEffect(() => {
    if (!withPopup) return;
    /* Private-mode browsers throw on `localStorage`; the poster is not worth
       a blank page, so a failure just means it is shown. */
    try {
      if (window.localStorage.getItem(ADMISSIONS_POPUP_KEY)) return;
      window.localStorage.setItem(ADMISSIONS_POPUP_KEY, '1');
    } catch { /* no storage — show it and move on */ }
    setAdmissionsPopup(true);
  }, [withPopup]);
  useEffect(() => { document.title = title; const set = (name: string, content: string) => { let meta = document.querySelector(`meta[name="${name}"]`); if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', name); document.head.appendChild(meta); } meta.setAttribute('content', content); }; set('description', description); }, [title, description]);
  const openEnquiry = () => setModal(true);
  /* Whatever photograph is being looked at full-size, or `null`. Every
     clickable picture on the page reaches this through `LightboxContext`. */
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  /* Stable identity so the context value doesn't change on every render — a
     plain arrow would re-render every consumer each time this shell does. */
  const openLightboxRef = useRef((src: string, alt: string) => setLightbox({ src, alt }));
  return <LightboxContext.Provider value={openLightboxRef.current}><div className="grain relative min-h-[100dvh] overflow-hidden bg-white">
    <div className="pointer-events-none absolute inset-0 z-0 bg-cover bg-top bg-no-repeat" style={{ backgroundImage: "url('/background.jpeg')" }} aria-hidden="true" />
    <WallpaperLayer />
    <div key={location} className="page-reveal relative z-10"><Header onEnquire={openEnquiry} />{children(openEnquiry)}<Footer onEnquire={openEnquiry} branchLabel={footerBranchLabel} branchAddress={footerBranchAddress} /></div>
    <CallFab onEnquire={openEnquiry} />
    {modal && <EnquiryModal onClose={() => setModal(false)} />}{admissionsPopup && <AdmissionsPopup onClose={() => setAdmissionsPopup(false)} onEnquire={openEnquiry} />}
    {lightbox && <Lightbox image={lightbox} onClose={() => setLightbox(null)} />}
  </div></LightboxContext.Provider>;
}

function BusRoutesPage() {
  return <PageShell title="Bus Routes & Area Search | Vivekananda Concept School" description="Search your village to see whether a Sree Swamy Vivekananda School bus reaches you — the full stop list for the Sivalayam Street, Brahmanapalle Road and Nagarigutta routes.">
    {(onEnquire) => <>
      <section className="pt-8 md:pt-12"><div className="container-wide flex flex-col items-center">
        <h1 className="section-heading text-center text-[clamp(2rem,3.6vw,2.8rem)]">Bus <em>Routes</em></h1>
        <div className="ornament mt-2"><span className="ornament-mark">◆</span></div>
      </div></section>
      <section className="py-7 md:py-9"><div className="container-wide"><BusRoutes /></div></section>
      <Admissions onEnquire={onEnquire} />
    </>}
  </PageShell>;
}

/* ───────────────────────────────── BLOGS ───────────────────────────────── */
/* Placeholder posts — swap `image`, `date`, `category`, `title`, `excerpt`
   and `body` for real ones as they're written. `slug` is what `/blogs/:slug`
   matches on, so keep it URL-safe if a title changes. `body` is an array of
   paragraphs, read out one `<p>` per entry on the post's own page. */
const BLOG_POSTS = [
  {
    slug: 'lead-curriculum-in-the-classroom',
    image: '/why-academic-strength.jpg', date: 'August 12, 2026', category: 'Academics',
    title: 'What the LEAD Curriculum Actually Changes in the Classroom',
    excerpt: 'A concept a child has built with their own hands sticks in a way a definition copied off a board never does. Here is what an activity-first CBSE classroom looks like on an ordinary Tuesday.',
    body: [
      'Walk into a Class VI science lesson here on an ordinary Tuesday and you will not find a teacher reading a definition off the board while thirty children copy it down. You will find groups of four working out, with magnets and a tray of iron filings, which way a field actually bends — and only afterwards being handed the word for it. That order is not an accident. It is the whole idea behind the CBSE-aligned LEAD curriculum: a concept a child has built with their own hands stays with them in a way a definition copied into a notebook rarely does.',
      'The curriculum runs unbroken from Pre-School through to Class X, which matters more than it sounds. A child who starts with us at three is not handed four different syllabi as they move up — the same activity-first approach, the same assessment rhythm and the same teaching relationships carry through every stage, so nothing has to be relearned from scratch at each transition.',
      'Board preparation still happens, and happens seriously — but it sits alongside this, not instead of it. From the middle years, IIT-JEE and NEET foundation work runs in parallel with regular board coursework, so a student is never asked to choose between doing well in Class X and being ready for what comes after it.',
      'None of this replaces a good teacher — it gives one more to work with. Every classroom carries digital boards and audio-visual tools, but the equipment is only useful in the hands of faculty who already know which child needs the concept shown three ways before it lands, and which one only needed to see it once.',
    ],
  },
  {
    slug: 'behind-every-bus-route',
    image: '/schoolbus.jpeg', date: 'July 28, 2026', category: 'Safety',
    title: 'Behind Every Bus Route: How We Keep Pickup and Drop Reliable',
    excerpt: 'Trained staff, real attendance checks at every stop, and routes reviewed as the town grows — the quiet systems that make a bus route something a parent can stop thinking about.',
    body: [
      'For most parents, a school bus is only noticed on the one morning it runs late. That is by design, in a sense — the goal is for pickup and drop to be reliable enough that you stop thinking about it at all. Getting there takes more than a bus and a driver; it takes systems that are boring to describe and easy to take for granted.',
      'Every route carries trained staff who take a real attendance check at each stop, not a headcount from memory — a child who does not board is flagged the same morning, not discovered missing at the end of the day. Routes themselves are reviewed periodically as Pulivendla grows and new residential areas open up, rather than left to run unchanged for years after the town around them has changed.',
      'The three main routes — Sivalayam Street, Brahmanapalle Road and Nagarigutta — between them cover the villages and localities most of our families live in. If you are not sure whether a particular street is covered, the bus route search on this site lets you check by typing your area directly rather than reading through a long list.',
      'None of this is meant to be visible day to day. A parent should be able to send a child to the bus stop in the morning and give it no further thought until the afternoon — that quiet reliability is the actual measure of whether the system is working.',
    ],
  },
  {
    slug: 'every-child-on-sports-day',
    image: '/athletics-field.jpg', date: 'July 9, 2026', category: 'School Life',
    title: 'Why Every Child Gets a Turn on Sports Day, Not Just the Fastest Ones',
    excerpt: 'Inter-house meets are built so a child who will never win a race still has an event that is theirs. What that does for confidence carries well beyond the athletics field.',
    body: [
      'A sports day built only around the fastest runners teaches most children exactly one lesson: that this event is not for them. Ours is built differently on purpose. Inter-house meets run through the year with a wide enough spread of events — relays, throws, team games, activities that reward coordination rather than raw speed — that a child who will never win the 100-metre dash still has something on the calendar that is genuinely theirs.',
      'That matters for reasons that have very little to do with athletics. A child who competes and loses gracefully, or who finds one event where they are unexpectedly good, carries that experience into how they handle a difficult exam or a tricky friendship later the same term. Confidence built on a field tends not to stay on the field.',
      'It also changes what "sport" means inside the school day. Athletics and cricket run on our own grounds, coached rather than merely supervised, so a child who shows real aptitude has somewhere for that to go beyond one meet a year.',
      'None of this is separate from the classroom, either — the same student who found their footing at an inter-house meet is often the one who is easier to reach in a subject they had quietly written themselves off in. A school day built with room to play is not time taken away from learning; more often, it is what makes the rest of the learning possible.',
    ],
  },
  {
    slug: 'inside-the-making-lab',
    image: '/making-lab.jpg', date: 'June 21, 2026', category: 'Academics',
    title: 'Inside the Making Lab: Where an Idea Becomes Something You Can Hold',
    excerpt: 'Robotics kits, craft materials and an open door beyond lesson time. A look at how the making lab turns science-fair projects from a chore into something students ask to stay back for.',
    body: [
      'Ask most students what a "science project" means and you will get a groan — a poster, a diagram copied from somewhere, handed in the night before it is due. The making lab exists to make that the exception rather than the rule. It is stocked with robotics kits, craft materials and simple tools, and — this is the part that actually changes things — it stays open beyond lesson time, so a half-finished idea does not have to wait a week for the next scheduled period.',
      'What comes out of it varies enormously by age. Younger children tend toward models — a working pulley, a simple circuit that lights a bulb — where the point is simply seeing cause and effect happen under their own hands. Older students take on longer projects: a small robotics build for a science fair, a craft piece that took three sittings to get right.',
      'The lab is run alongside the clubs programme, so a student with a standing interest in robotics or making is not limited to whatever the syllabus happens to require that term. It is common, once a term settles in, to find the same small group turning up voluntarily after their last period, working on something nobody assigned them.',
      'That voluntary return is really the measure of whether it is working. A space that only gets used when a project is due is a classroom with different furniture. A space students choose to come back to on their own time is something else entirely.',
    ],
  },
  {
    slug: 'first-month-parents-guide',
    image: '/campus-courtyard.jpg', date: 'June 2, 2026', category: 'Community',
    title: 'A Parent’s Guide to the First Month at Vivekananda Concept School',
    excerpt: 'What to expect in the settling-in weeks, who to call with a question, and how progress gets shared with you — from a school that would rather you asked early than worried alone.',
    body: [
      'The first few weeks at a new school are unsettled for almost every child, and often more so for the parent watching from outside the gate than for the child actually inside it. This is a short guide to what those weeks usually look like here, and who to talk to if something does not feel right.',
      'Class teachers are deliberately kept with the same group year on year, which means that even in the first week, there is one adult who is building a real picture of your child — who needs drawing out, who needs a quieter corner, who has already made a friend and who is still finding their feet. That teacher is your first call for anything day-to-day, and is easier to reach directly than most parents expect.',
      'Assessment does not wait for a term-end report. Progress is tracked continuously through the year, so if something needs attention — academic or otherwise — it tends to surface, and get raised with you, well before it would show up on a formal report card. If a first month has gone quietly, that quiet is itself informative.',
      'The honest answer to "how will I know how it’s going" is: you will hear from us before you have to ask. But asking early is always welcome — a two-minute question in week two is easier for everyone than the same question, grown larger, in week twelve.',
    ],
  },
  {
    slug: 'continuous-assessment-explained',
    image: '/smartclass.jpeg', date: 'May 15, 2026', category: 'Academics',
    title: 'Continuous Assessment, Explained: Why We Don’t Wait for One Big Exam',
    excerpt: 'A gap caught in week three is a five-minute conversation. The same gap found in week thirty is a crisis. Here is how assessment through the year is meant to work in a child’s favour.',
    body: [
      'A single high-stakes exam at the end of a term tells you a great deal about how a child performs under exam conditions on one particular day, and comparatively little about where they actually stand across the months that led up to it. Continuous assessment is our answer to that gap — regular, lower-stakes checks through the year that are meant to catch a problem while it is still small.',
      'The practical difference is timing. A misunderstood concept caught in week three is a five-minute conversation with a teacher and a slightly different homework set the following week. The same gap, left to compound silently until it surfaces on a term exam in week thirty, has usually become several gaps stacked on top of each other — and a genuine crisis for the student trying to sit that paper.',
      'This only works if it is paired with straight reporting. Continuous assessment that stays inside the school and only reaches a parent as a single end-of-term number defeats its own purpose. What we find through the year is shared with parents as we find it — including, deliberately, the parts that are harder to hear, because those are the ones most worth acting on early.',
      'None of this replaces board exams, which remain exactly as serious as they have always been. What it changes is how prepared a student is when they get there — not through a final push of last-minute revision, but because the gaps were closed as they appeared, month after month, long before the exam itself.',
    ],
  },
] as const;

function BlogCard({ post, index }: { post: (typeof BLOG_POSTS)[number]; index: number }) {
  const openLightbox = useLightbox();
  return <article className="reveal flex flex-col overflow-hidden rounded-2xl border-[5px] border-white bg-white shadow-[0_10px_26px_rgba(31,40,56,.16)] ring-1 ring-[#1C2A37]/12" data-testid={`card-blog-${index + 1}`}>
    <button type="button" onClick={() => openLightbox(post.image, post.title)} className="group block aspect-[16/10] w-full overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C]" data-testid={`button-blog-${index + 1}`}>
      <img src={post.image} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
    </button>
    <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
      <div className="flex items-center gap-3 text-[12px] font-semibold text-[#0F4C5C]">
        <span className="rounded-full bg-[#0F4C5C]/10 px-2.5 py-1 tracking-wide">{post.category}</span>
        <span className="flex items-center gap-1 text-black/55"><Calendar size={13} aria-hidden="true" /> {post.date}</span>
      </div>
      <h3 className="mt-3 font-sans text-[17px] font-semibold leading-snug text-black">{post.title}</h3>
      <p className="mt-2 flex-1 text-[13.5px] leading-[1.55] text-black/75">{post.excerpt}</p>
      <Link href={`/blogs/${post.slug}`} className="group/link mt-3 flex items-center gap-1.5 text-[13.5px] font-semibold text-[#0F4C5C]" data-testid={`link-blog-read-more-${index + 1}`}>
        Read More <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-1" aria-hidden="true" />
      </Link>
    </div>
  </article>;
}

function BlogsPage() {
  return <PageShell title="Blogs | Sree Vivekananda Educational Society" description="Notes from Sree Vivekananda Educational Society, Pulivendla — on the curriculum, campus life, admissions and what a school day here actually looks like.">
    {(onEnquire) => <>
      <section className="pt-8 md:pt-12"><div className="container-wide flex flex-col items-center">
        <h1 className="section-heading text-center text-[clamp(2rem,3.6vw,2.8rem)]">Blogs</h1>
        <div className="ornament mt-2"><span className="ornament-mark">◆</span></div>
        <p className="reveal mx-auto mt-4 max-w-[600px] text-center text-[15px] leading-[1.6] text-black">Notes on the curriculum, campus life and what a school day here actually looks like.</p>
      </div></section>
      <section className="py-5 md:py-7"><div className="container-wide">
        <div className="mx-auto grid max-w-[1200px] gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post, index) => <BlogCard key={post.title} post={post} index={index} />)}
        </div>
      </div></section>
      <Admissions onEnquire={onEnquire} />
    </>}
  </PageShell>;
}

/* The full article behind a "Read More" — hero photograph, the same
   category/date chip as the card, then every paragraph in `body`. Falls
   through to `NotFound` for a slug that doesn't match any post, the same way
   `BranchPage` does for an unknown branch. */
function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = BLOG_POSTS.find((entry) => entry.slug === params.slug);
  if (!post) return <NotFound />;
  return <PageShell title={`${post.title} | Sree Vivekananda Educational Society`} description={post.excerpt}>
    {(onEnquire) => <>
      <section className="pt-8 md:pt-12"><div className="container-wide">
        <Link href="/blogs" className="group inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#0F4C5C]" data-testid="link-blog-back">
          <ChevronRight size={15} className="rotate-180 transition-transform group-hover:-translate-x-1" aria-hidden="true" /> Back to Blogs
        </Link>
        <div className="mx-auto mt-5 max-w-[760px]">
          <div className="flex items-center gap-3 text-[12px] font-semibold text-[#0F4C5C]">
            <span className="rounded-full bg-[#0F4C5C]/10 px-2.5 py-1 tracking-wide">{post.category}</span>
            <span className="flex items-center gap-1 text-black/55"><Calendar size={13} aria-hidden="true" /> {post.date}</span>
          </div>
          <h1 className="section-heading mt-4 text-[clamp(1.7rem,3.4vw,2.5rem)] leading-[1.15]">{post.title}</h1>
        </div>
      </div></section>
      <section className="mt-7"><div className="container-wide">
        <div className="reveal mx-auto aspect-[16/9] max-w-[900px] overflow-hidden rounded-2xl border-[6px] border-white shadow-[0_14px_36px_rgba(31,40,56,.18)] ring-1 ring-[#1C2A37]/10">
          <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
        </div>
      </div></section>
      <section className="py-7 md:py-9"><div className="container-wide">
        <div className="reveal mx-auto grid max-w-[720px] gap-4">
          {post.body.map((paragraph) => <p key={paragraph.slice(0, 40)} className="text-[16px] leading-[1.75] text-black">{paragraph}</p>)}
        </div>
      </div></section>
      <Admissions onEnquire={onEnquire} />
    </>}
  </PageShell>;
}

function GalleryPage() {
  return <PageShell title="Photo Gallery | Sree Vivekananda Educational Society" description="Photographs from Sree Vivekananda Educational Society, Pulivendla — the campus, the classrooms, the playing fields and the school buses.">
    {(onEnquire) => <>
      <section className="pt-8 md:pt-12"><div className="container-wide flex flex-col items-center">
        <h1 className="section-heading text-center text-[clamp(2rem,3.6vw,2.8rem)]">Photo <em>Gallery</em></h1>
        <div className="ornament mt-2"><span className="ornament-mark">◆</span></div>
      </div></section>
      <section className="py-5 md:py-7"><div className="container-wide"><GallerySquares /></div></section>
      <Admissions onEnquire={onEnquire} />
    </>}
  </PageShell>;
}

function Home() {
  return <PageShell title="Vivekananda Concept School | Pulivendla" description="Vivekananda Concept School in Pulivendla offers thoughtful education from Pre-School through High-School." admissionsPopup>
    {(onEnquire) => <><Hero /><Intro /><Results /><Facilities /><SchoolLife /><Gallery /><Admissions onEnquire={onEnquire} /></>}
  </PageShell>;
}

/* ─────────────────────────── BRANCH PAGE TEMPLATE ─────────────────────────── */
type BranchInfo = { title: string; streetName: string; fullAddress: string; description: string; about: readonly string[]; quote: string; gallery: readonly string[] };

function BranchGallery({ streetName, images }: { streetName: string; images: readonly string[] }) {
  return (
    <section className="py-8 md:py-12">
      <div className="container-wide">
        <div className="text-center">
          <h2 className="section-heading text-[clamp(1.6rem,2.8vw,2.2rem)]">Photo <em>Gallery</em></h2>
          <div className="ornament mt-2"><span className="ornament-mark">◆</span></div>
          <p className="mt-3 text-[15px] text-[#3F5771]">A look at life on our {streetName} campus.</p>
        </div>
        <div className="mt-9">
          <GalleryOrbs images={images} label={`${streetName} campus gallery`} className="grid-cols-2 md:grid-cols-4" />
        </div>
      </div>
    </section>
  );
}

function BranchPageTemplate({ branch }: { branch: BranchInfo }) {
  return (
    <PageShell
      title={`${branch.streetName} Campus | Sree Vivekananda Educational Society`}
      description={branch.description}
      footerBranchLabel={`Sree Swamy Vivekananda School — ${branch.streetName}`}
      footerBranchAddress={branch.fullAddress}
    >
      {(onEnquire) => <>
        {/* The same hero the home page runs, scrolling photographs and all,
            with the branch standing in for the town. */}
        <Hero place={branch.streetName} eyebrow="SREE SWAMY VIVEKANANDA SCHOOL" headingLevel="h1" />
        {/* `#about` in the header finds this before it thinks about routing
            home, so About Us lands on the branch you are actually reading. */}
        <section id="about" className="py-8 md:py-11">
          <div className="container-wide">
            <Heading title="About" accent="Us" />
            <div className="mt-7 grid gap-8 md:grid-cols-[1fr_1fr] md:items-center">
              <div className="reveal">
                {branch.about.map((paragraph, index) => <p key={paragraph.slice(0, 40)} className={`text-[15px] leading-7 text-black/75 ${index > 0 ? 'mt-4' : ''}`}>{paragraph}</p>)}
              </div>
              {/* The gallery's orb, with words where the photograph goes. The
                  inset is a percentage so the text box scales with the circle
                  and the longest of the three quotes keeps its corners inside
                  the curve. */}
              <figure className="reveal relative mx-auto aspect-square w-full max-w-[400px]">
                <span className="absolute inset-[6%] rounded-full bg-white shadow-[0_10px_30px_rgba(31,40,56,.16)]" />
                <OrbRing colour="#0F4C5C" spin={0} />
                <div className="absolute inset-[15%] flex flex-col items-center justify-center gap-3 text-center">
                  <Quote className="h-6 w-6 shrink-0 text-[#0F4C5C]" fill="currentColor" aria-hidden="true" />
                  <blockquote className="font-display text-[clamp(.85rem,1.3vw,1.05rem)] italic leading-7 text-[#123A5E]" data-testid="text-branch-quote">{branch.quote}</blockquote>
                  <figcaption className="text-[13px] font-semibold text-[#0F4C5C]">— Swami Vivekananda</figcaption>
                </div>
              </figure>
            </div>
          </div>
        </section>
        <BranchGallery streetName={branch.streetName} images={branch.gallery} />
        <Admissions onEnquire={onEnquire} />
      </>}
    </PageShell>
  );
}

/* Each branch shows the same photographs in its own order, so the three
   gallery pages do not scroll past as one repeated grid. */
const BRANCH_PHOTOS = ['/campus-courtyard.jpg', '/making-lab.jpg', '/smartclass.jpeg', '/athletics-field.jpg', '/schoolbus.jpeg', '/our-story-poster.jpg'] as const;

const BRANCHES: Record<string, BranchInfo> = {
  'shivalayam-street': {
    title: 'Shivalayam Street Campus',
    streetName: 'Shivalayam Street',
    fullAddress: 'Shivalayam Street, Pulivendla, Kadapa District, Andhra Pradesh – 516390',
    description: 'Our flagship campus on Shivalayam Street brings CBSE-aligned education from Pre-School through High-School to the heart of Pulivendla, with experienced faculty and a nurturing environment.',
    about: [
      'Set in the heart of Pulivendla, the Shivalayam Street campus is where the school began, and it still sets the pace for the campuses that followed. Classes run the whole way from Pre-School to High-School, so a child who joins us at three can sit their board exams without ever having to change schools.',
      'Teaching follows the CBSE-aligned LEAD curriculum, with smart classrooms and activity-based lessons that turn a concept into something a child has actually done rather than only read about. From the middle years, foundation coaching for IIT-JEE and NEET runs alongside board preparation, and assessments through the year mean a gap is closed when it appears rather than discovered the week before an exam.',
    ],
    quote: 'The power of concentration is the only key to the treasure-house of knowledge.',
    gallery: BRANCH_PHOTOS,
  },
  'brahmanapalli-road': {
    title: 'Brahmanapalli Road Campus',
    streetName: 'Brahmanapalli Road',
    fullAddress: 'Brahmanapalli Road, Pulivendla, Kadapa District, Andhra Pradesh – 516390',
    description: 'The Brahmanapalli Road campus offers a calm and focused learning environment, serving families across the Brahmanapalli area with dedicated teachers and holistic education.',
    about: [
      'The Brahmanapalli Road campus opened to bring the same standard of teaching within reach of families on that side of Pulivendla, and it has kept the unhurried feel of a school where everyone knows everyone. Teachers stay with a class long enough to know each child by name and by temperament — who needs drawing out, who needs slowing down, and who has quietly stopped following.',
      'The curriculum, the smart classrooms, the assessment pattern and the IIT-JEE and NEET foundation work are the same as at every campus of the society, so a family moving between our campuses finds their child picking up exactly where they left off. Progress is shared with parents honestly and early, not saved up for a report at the end of the year.',
    ],
    quote: 'To me the very essence of education is concentration of mind, not the collecting of facts.',
    gallery: [...BRANCH_PHOTOS.slice(2), ...BRANCH_PHOTOS.slice(0, 2)],
  },
  'parnapalli-road': {
    title: 'Parnapalli Road Campus',
    streetName: 'Parnapalli Road',
    fullAddress: 'Parnapalli Road, Pulivendla, Kadapa District, Andhra Pradesh – 516390',
    description: 'The Parnapalli Road campus extends our mission of inspiring growth to the Parnapalli area, offering the same high standards of CBSE education and character development.',
    about: [
      'The Parnapalli Road campus carries our work out to the Parnapalli side of town, so that a good school is a short journey rather than a long one for the families living there. The building was laid out for the way children actually learn: room to move between activities, space for reading and for making things, and classrooms fitted with the same digital boards and audio-visual tools used across the society.',
      'Lessons follow the CBSE-aligned LEAD curriculum from Pre-School through High-School, with early foundation coaching for IIT-JEE and NEET for students who want it. Character is taught as deliberately as the subjects are — punctuality, honesty, looking after younger children and finishing what you start are expected here every day.',
    ],
    quote: 'Education is not the amount of information that is put into your brain and runs riot there, undigested, all your life.',
    gallery: [...BRANCH_PHOTOS.slice(4), ...BRANCH_PHOTOS.slice(0, 4)],
  },
};

function BranchPage({ params }: { params: { slug: string } }) {
  const info = BRANCHES[params.slug];
  if (!info) return <NotFound />;
  return <BranchPageTemplate branch={info} />;
}

/* A second of crest on white before each page — on first arrival and again on
   every route change, which is what the header links are. Keyed on the
   location so the timer restarts per navigation; the fade lives in the
   animation and finishes exactly as the element is unmounted. */
function LoadingSplash() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 1000);
    return () => window.clearTimeout(timer);
  }, [location]);
  if (!visible) return null;
  return <div className="loading-splash fixed inset-0 z-[100] grid place-items-center bg-white" role="status" aria-live="polite" data-testid="loading-splash">
    <span className="relative block h-[124px] w-[124px] overflow-hidden rounded-full shadow-[0_10px_30px_rgba(31,40,56,.14)] sm:h-[156px] sm:w-[156px]">
      <img src="/logo.jpeg" alt="" className="h-full w-full object-cover" />
      <span className="logo-shimmer logo-shimmer-loop" aria-hidden="true" />
    </span>
    <span className="sr-only">Loading</span>
  </div>;
}

function Router() { return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route path="/gallery" component={GalleryPage} /><Route path="/blogs" component={BlogsPage} /><Route path="/blogs/:slug" component={BlogPostPage} /><Route path="/bus-routes" component={BusRoutesPage} /><Route path="/branch/:slug" component={BranchPage} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>; }
function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><LoadingSplash /><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;