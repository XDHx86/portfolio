import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lazy, Suspense, useEffect, useRef } from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import { useThemeStore } from '../../store/themeStore';

const PartsAssemblingCanvas = lazy(
  () => import('../Canvas/PartsAssemblingCanvas'),
);

gsap.registerPlugin(ScrollTrigger);

const workExperience = [
  {
    title: 'Independent Software Engineer',
    company: 'Self-Directed',
    date: 'Jun 2025 - Present',
    points: [
      "Accelerating feature delivery across full-stack applications by adopting <span class='black'>AI-assisted development workflows</span> with Claude Code",
      "Designed and built personal <span class='black'>SaaS and full-stack projects</span> end to end—covering front-end, back-end services, REST API integrations, and database modeling",
      "Containerized applications with <span class='black'>Docker</span> and connected source control, automated checks, and deployment steps into repeatable <span class='black'>CI/CD workflows</span>",
      "Reduced repetitive implementation effort by <span class='black'>60%</span> through systematic use of coding agents, freeing focus for architecture review and quality assurance",
    ],
  },
  {
    title: 'DevOps / Systems Automation Engineer',
    company: 'Independent Technical Projects',
    date: 'Aug 2024 - Jun 2025',
    points: [
      "Reduced repetitive administrative effort by <span class='black'>60%</span> by building reusable <span class='black'>Bash and PowerShell scripts</span> with comprehensive documentation",
      "Decreased environment setup errors by <span class='black'>45%</span> through rigorous standardization of provisioning and validation steps",
      "Shortened release cycles by <span class='black'>30%</span> by wiring automation and pre-deployment validation checks into <span class='black'>GitHub CI/CD workflows</span>",
      "Reduced exposed credentials by <span class='black'>75%</span> by implementing <span class='black'>HashiCorp Vault</span> and environment-based separation for sensitive data",
      "Improved issue detection speed by <span class='black'>40%</span> by consolidating metrics, logs, and alerts into centralized monitoring dashboards",
    ],
  },
  {
    title: 'AI Model Quality & Safety Evaluation Specialist',
    company: 'The AI Training Company',
    date: 'Aug 2023 - Aug 2024',
    points: [
      "Systematically evaluated <span class='black'>Arabic-language model outputs</span> for fluency, accuracy, and cultural appropriateness",
      "Maintained <span class='black'>95%+ consistency</span> in issue evaluation by creating and applying standardized quality assessment rubrics",
      "Documented an average of <span class='black'>10 critical issues per testing cycle</span> through meticulous result analysis and root cause investigation",
      "Built reproducible evaluation methodology by developing <span class='black'>structured testing templates and issue documentation frameworks</span>",
      "Improved evaluation efficiency by <span class='black'>30%</span> through systematic documentation and process standardization",
    ],
  },
  {
    title: 'Real Time Analyst',
    company: 'Vodafone UK — VOISEG',
    date: 'Dec 2021 - Aug 2023',
    points: [
      "Maintained <span class='black'>97% SLA adherence</span> by continuously tracking and documenting real-time queues and service-level trends",
      "Improved service-impacting issue response time by <span class='black'>30%</span> by detecting bottlenecks early and maintaining detailed escalation logs",
      "Reduced manual reporting time by <span class='black'>40%</span> by consolidating live operational data into automated Excel-based daily and weekly performance reports",
      "Reduced repeat incidents by <span class='black'>25%</span> by systematically identifying root causes and documenting findings into permanent process improvements",
    ],
  },
  {
    title: 'Data Analyst Contractor',
    company: 'Upwork',
    date: 'Mar 2020 - Dec 2021',
    points: [
      "Improved data accuracy by <span class='black'>20%</span> through systematic cleaning, normalizing, and structuring of raw datasets in <span class='black'>SQL and Excel</span>",
      "Reduced manual spreadsheet work by <span class='black'>40%</span> by automating recurring reporting tasks through repeatable, documented data preparation workflows",
      "Detected an average of <span class='black'>7 trends and anomalies per project</span> by systematically analyzing data for irregularities and operational risk signals",
      "Achieved <span class='black'>90% positive client feedback</span> and <span class='black'>65% repeat engagement</span> by translating technical results into clear, actionable business recommendations",
    ],
  },
  {
    title: 'Full-Stack Web Developer Contractor',
    company: 'Upwork',
    date: 'Feb 2018 - Dec 2021',
    points: [
      "Delivered <span class='black'>15+ client web applications</span> by translating requirements into functional front-end and back-end implementations",
      "Reduced API integration errors by <span class='black'>30%</span> by systematically connecting third-party services and rigorously validating request/response behavior",
      "Improved application response times by <span class='black'>20%</span> by optimizing database queries and implementing caching strategies",
      "Improved release stability by <span class='black'>30%</span> by maintaining organized environments, Git discipline, and predictable deployment steps with comprehensive documentation",
    ],
  },
];

const WorkExperience = () => {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const { darkMode } = useThemeStore();
  const isMobile = useIsMobile(600);

  useEffect(() => {
    const sections = gsap.utils.toArray('.work-experience-section');
    const triggers: ScrollTrigger[] = [];

    // Simple one-shot fade-in animation — no scrub, so items stay visible once revealed
    sections.forEach((section: any) => {
      const anim = gsap.fromTo(
        section,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        },
      );
      if (anim.scrollTrigger) triggers.push(anim.scrollTrigger);
    });

    // Keep the 3D model progress tracker
    const progressTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: self => {
        document.dispatchEvent(
          new CustomEvent('scrollAnimationProgress', { detail: self.progress }),
        );
      },
    });
    triggers.push(progressTrigger);

    return () => {
      triggers.forEach(t => t.kill());
    };
  }, [darkMode, isMobile]);

  return (
    <div className="work-experience-main-wrapper" ref={containerRef}>
      <h1 className="fixed-heading">
        <span className="orange">Destructuring </span>
        <span data-color-inverted={'true'}>My Work Experience.</span>
      </h1>
      <div className="left-column">
        <Suspense fallback={null}>
          <PartsAssemblingCanvas />
        </Suspense>
      </div>
      <div className="right-column" ref={textRef}>
        {workExperience.map((exp, index) => (
          <div key={index} className="work-experience-section">
            <h2 className="job-title">
              {exp.title} @ <span className="orange">{exp.company}</span>
            </h2>
            <div className="flex-row">
              <p className="duration">{exp.date}</p>
            </div>
            <ul className="work-ex-points">
              {exp.points.map((point, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: point }} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkExperience;
