import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';

/* Pulled out of App.tsx and parked here, unused, while the "Parent Say About
   Us" section is off the home page — reinstate by importing `Testimonials`
   and rendering it where it used to sit in `Home` (between `Gallery` and
   `Admissions`), and add `['Blogs', '#blogs']` back into `navItems` in
   App.tsx so the footer link has a section to reach again.

   Two things this file needs from App.tsx if it is ever switched back on:
   the shared `Heading` component and `PinnedIcon` (the earth icon that used
   to sit beside the parent's name). Both are declared local to App.tsx, so
   either export them from there or inline replacements here — the local
   `Heading` below is a copy of App.tsx's, kept so this file compiles on its
   own, and the earth `PinnedIcon` has simply been left out. */

function Heading({ title, accent }: { title?: string; accent?: string }) {
  return <div className="reveal flex flex-col items-center"><h2 className="section-heading text-center text-[clamp(1.85rem,3.3vw,2.5rem)]">{title}{title && ' '}{accent && <em>{accent}</em>}</h2><div className="ornament mt-2"><span className="ornament-mark">◆</span></div></div>;
}

export function Testimonials() {
  const testimonials = [
    { quote: 'Kudos to the entire team of Vivekananda Concept School for running online classes without compromising on the quality during this pandemic. We are lucky to get the admission for our kids. Kids initially faced a lot of difficulties in coping up with the syllabus and they felt it was too much for them. Slowly, they got settled here and started liking the teaching style, syllabus, and contents. Teachers are helping them in understanding the subjects and also taking extra efforts in teaching Maths and Hindi by conducting extra classes.\n\nOverall, kids love the school and started socializing with the teachers and fellow students. They also helped my kids a lot in learning the missed lessons.', name: 'Murali Krishna' },
    { quote: 'The teachers at Vivekananda Concept School are very loving and nurturing while providing the guidance and structure my kids need. I have been impressed with the dedication of the staff. Truly impressed.', name: 'Sai Chandrika' },
  ];
  const [active, setActive] = useState(0); const [paused, setPaused] = useState(false); const testimonial = testimonials[active];
  useEffect(() => {
    if (paused || testimonials.length < 2) return;
    const timer = window.setInterval(() => setActive(current => (current + 1) % testimonials.length), 7000);
    return () => window.clearInterval(timer);
  }, [paused, testimonials.length]);
  return <section id="blogs" className="py-5 md:py-7"><div className="container-wide"><Heading title="Parent Say" accent="About us" /><div className="relative mx-auto mt-6 max-w-[760px] px-7 text-center sm:px-14" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)} aria-roledescription="carousel" aria-live="polite"><Quote className="absolute left-0 top-0 h-7 w-7 text-[#0F4C5C] sm:h-10 sm:w-10" fill="currentColor" /><Quote className="absolute right-0 top-0 h-7 w-7 rotate-180 text-[#0F4C5C] sm:h-10 sm:w-10" fill="currentColor" /><div key={active} className="testimonial-fade"><blockquote className="whitespace-pre-line text-[16px] leading-[1.55] text-black" data-testid="text-testimonial">{testimonial.quote}</blockquote><p className="mt-4 text-right text-[18px] font-semibold text-[#0F4C5C]" data-testid="text-testimonial-name">{testimonial.name}</p></div><div className="absolute -right-2 bottom-4 hidden h-20 w-14 rounded-[50%] bg-gradient-to-br from-[#0F4C5C] via-white to-[#1F2838] md:block" /></div></div></section>;
}
